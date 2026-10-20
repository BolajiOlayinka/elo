'use strict';

/**
 * Download image URLs stored in Postgres, upload them to S3, and replace the
 * stored link with the S3 URL.
 *
 *   node scripts/mirror-images.js --smoke
 *   node scripts/mirror-images.js --all
 *   node scripts/mirror-images.js --all --live
 *
 * Columns: countries.flag_url, venues.image_url, leagues.logo_url,
 * teams.logo_url, players.photo_url, coaches.photo_url.
 * rating_board payloads that still contain those URLs are rewritten too.
 *
 * Already-mirrored URLs are skipped. Ctrl+C finishes the current image.
 * The media/ prefix must be publicly readable, or set S3_PUBLIC_BASE_URL.
 */

const nodeCrypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const knexLib = require('knex');
const knexConfig = require('../src/infra/database/knexfile');
const { parseIngestArgs } = require('./lib/cli');
const { fileExists, readJson, writeJson } = require('./lib/json-store');
const { ROOT } = require('./lib/paths');
const { createProgress, describeDbTarget } = require('./lib/progress');
const { createUploadContext, publicObjectUrl, uploadObject } = require('./lib/s3');

const CACHE_DIR = path.join(ROOT, 'data', 'media-cache');
const FILE_DIR = path.join(CACHE_DIR, 'files');
const MANIFEST_PATH = path.join(CACHE_DIR, 'manifest.json');
const FAILURES_PATH = path.join(CACHE_DIR, 'failures.log');
const SOURCES = [
    { table: 'countries', column: 'flag_url' },
    { table: 'venues', column: 'image_url' },
    { table: 'leagues', column: 'logo_url' },
    { table: 'teams', column: 'logo_url' },
    { table: 'players', column: 'photo_url' },
    { table: 'coaches', column: 'photo_url' }
];
const SMOKE_LIMIT = 25;
const POOL = 6;
const DB_BATCH = 100;
const MAX_BYTES = 8 * 1024 * 1024;
const URL_LIMIT = 255;

let knex = null;
let stopRequested = false;

process.on('SIGINT', () => {
    if (stopRequested) {
        process.exit(1);
    }

    stopRequested = true;
    console.log('\nStop requested — finishing the current image, then exiting. Ctrl+C again aborts now.');
});

async function main() {
    const args = parseIngestArgs(process.argv);

    if (!args.all && !args.smoke) {
        throw new Error('Use --smoke or --all. Add --live for Heroku.');
    }

    if (args.live && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is missing (needed for --live)');
    }

    const s3 = await createUploadContext();
    const publicBase = publicObjectUrl(s3.bucket, s3.region, '').replace(/\/$/, '');

    knex = knexLib(args.live ? knexConfig.production : knexConfig.development);

    try {
        console.log(`Images → s3://${s3.bucket}/media/ (${s3.region})`);
        console.log(`Public base ${publicBase}/`);
        console.log(`Database ${describeDbTarget(args.live, knexConfig)}`);

        const manifest = await loadManifest();
        const jobs = await collectUrls(knex, publicBase, args.smoke ? SMOKE_LIMIT : null);
        const urls = [...new Set(jobs.map((job) => job.sourceUrl))];
        const progress = createProgress({
            mode: args.smoke ? 'images-smoke' : 'images',
            total: urls.length,
            dir: CACHE_DIR
        });

        await progress.log(`Queued ${urls.length} image URL${urls.length === 1 ? '' : 's'}`);

        const mirrored = new Map();

        await mapPool(urls, POOL, async (sourceUrl) => {
            if (stopRequested) {
                return;
            }

            const known = manifest.get(sourceUrl);

            if (known) {
                mirrored.set(sourceUrl, known);
                progress.state.skipped += 1;
                progress.tick(doneCount(progress), urls.length, 'cached');

                return;
            }

            try {
                const stored = await mirrorOne(s3, publicBase, sourceUrl);

                manifest.set(sourceUrl, stored);
                mirrored.set(sourceUrl, stored);
                progress.state.completed += 1;
            } catch (error) {
                progress.state.failed += 1;
                await fs.mkdir(CACHE_DIR, { recursive: true });
                await fs.appendFile(FAILURES_PATH, `${new Date().toISOString()}  ${sourceUrl}  ${error.message}\n`);
            }

            progress.tick(doneCount(progress), urls.length, sourceUrl.slice(0, 60));

            if ((progress.state.completed + progress.state.skipped) % 50 === 0) {
                await saveManifest(manifest);
            }
        });

        progress.clearBar();
        await saveManifest(manifest);

        if (!stopRequested && mirrored.size) {
            await progress.log(`Rewriting ${mirrored.size} URL${mirrored.size === 1 ? '' : 's'} in the database`);
            await replaceSources(knex, jobs, mirrored);
            await replaceBoard(knex, manifest, progress);
        }

        await progress.log(
            `Done. uploaded=${progress.state.completed} cached=${progress.state.skipped} failed=${progress.state.failed}`
        );

        if (s3.acl === false) {
            await progress.log('Bucket rejected public-read ACL. Allow public GET on media/* or set S3_PUBLIC_BASE_URL.');
        }
    } finally {
        await knex.destroy();
    }
}

function doneCount(progress) {
    return progress.state.completed + progress.state.skipped + progress.state.failed;
}

async function loadManifest() {
    if (!(await fileExists(MANIFEST_PATH))) {
        return new Map();
    }

    const payload = await readJson(MANIFEST_PATH);

    return new Map(Object.entries(payload));
}

async function saveManifest(manifest) {
    await writeJson(MANIFEST_PATH, Object.fromEntries(manifest));
}

async function collectUrls(db, publicBase, limit) {
    const urls = [];
    const perTable = limit ? Math.max(1, Math.ceil(limit / SOURCES.length)) : null;

    for (const source of SOURCES) {
        if (limit && urls.length >= limit) {
            break;
        }

        let query = db(source.table)
            .distinct(source.column)
            .whereNotNull(source.column)
            .where(source.column, 'like', 'http%')
            .whereNot(source.column, 'like', `${escapeLike(publicBase)}%`);

        if (perTable) {
            query = query.limit(Math.min(perTable, limit - urls.length));
        }

        const rows = await query;

        rows.forEach((row) => {
            const sourceUrl = row[source.column];

            if (!sourceUrl) {
                return;
            }

            urls.push({
                sourceUrl,
                table: source.table,
                column: source.column
            });
        });
    }

    return limit ? urls.slice(0, limit) : urls;
}

function escapeLike(value) {
    return value.replace(/[%_\\]/g, '\\$&');
}

async function mirrorOne(s3, publicBase, sourceUrl) {
    const hash = nodeCrypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0, 32);
    const cached = await readCache(hash);
    const downloaded = cached || await downloadImage(sourceUrl);
    const extension = extensionFor(downloaded.contentType, sourceUrl, downloaded.body);
    const key = `media/${hash}${extension}`;
    const stored = publicObjectUrl(s3.bucket, s3.region, key);

    if (stored.length > URL_LIMIT) {
        throw new Error(`S3 URL is longer than ${URL_LIMIT} characters`);
    }

    if (!stored.startsWith(publicBase)) {
        throw new Error('Public URL does not match the configured base');
    }

    await fs.mkdir(FILE_DIR, { recursive: true });
    await fs.writeFile(path.join(FILE_DIR, `${hash}${extension}`), downloaded.body);
    await uploadObject(s3, { key, body: downloaded.body, contentType: downloaded.contentType });

    return stored;
}

async function readCache(hash) {
    const extensions = ['.png', '.jpg', '.svg', '.webp', '.gif', '.avif', '.img'];

    for (const extension of extensions) {
        try {
            const body = await fs.readFile(path.join(FILE_DIR, `${hash}${extension}`));

            return { body, contentType: contentTypeForExtension(extension) };
        } catch {
            // This extension was not cached.
        }
    }

    return null;
}

async function downloadImage(sourceUrl) {
    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            const response = await fetch(sourceUrl, {
                redirect: 'follow',
                signal: AbortSignal.timeout(20000),
                headers: { 'user-agent': 'elo-points-image-mirror' }
            });

            if (response.status === 404 || response.status === 410) {
                throw new Error(`HTTP ${response.status}`);
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const body = Buffer.from(await response.arrayBuffer());

            if (!body.length) {
                throw new Error('empty image');
            }

            if (body.length > MAX_BYTES) {
                throw new Error(`image is larger than ${MAX_BYTES} bytes`);
            }

            return {
                body,
                contentType: sniffType(body, response.headers.get('content-type'))
            };
        } catch (error) {
            lastError = error;

            if (/HTTP 404|HTTP 410|empty image|larger than/.test(error.message)) {
                throw error;
            }

            await delay(400 * attempt);
        }
    }

    throw lastError;
}

function sniffType(body, header) {
    const declared = String(header || '').split(';')[0].trim().toLowerCase();

    if (declared.startsWith('image/')) {
        return declared;
    }

    if (body[0] === 0x89 && body[1] === 0x50) {
        return 'image/png';
    }

    if (body[0] === 0xff && body[1] === 0xd8) {
        return 'image/jpeg';
    }

    if (body[0] === 0x47 && body[1] === 0x49) {
        return 'image/gif';
    }

    const head = body.subarray(0, 200).toString('utf8').trim().toLowerCase();

    if (head.startsWith('<svg') || head.includes('<svg')) {
        return 'image/svg+xml';
    }

    return 'application/octet-stream';
}

function extensionFor(contentType, sourceUrl, body) {
    const type = sniffType(body, contentType);
    const map = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'image/svg+xml': '.svg',
        'image/avif': '.avif'
    };

    if (map[type]) {
        return map[type];
    }

    try {
        const extension = path.extname(new URL(sourceUrl).pathname).toLowerCase();

        if (extension === '.jpeg') {
            return '.jpg';
        }

        if (/^\.(png|jpg|gif|webp|svg|avif)$/.test(extension)) {
            return extension;
        }
    } catch {
        return '.img';
    }

    return '.img';
}

function contentTypeForExtension(extension) {
    const map = {
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.avif': 'image/avif'
    };

    return map[extension] || 'application/octet-stream';
}

async function replaceSources(db, jobs, mirrored) {
    const grouped = new Map();

    jobs.forEach((job) => {
        const stored = mirrored.get(job.sourceUrl);

        if (!stored || stored.length > URL_LIMIT) {
            return;
        }

        const key = `${job.table}:${job.column}`;
        const pairs = grouped.get(key) || [];

        pairs.push([job.sourceUrl, stored]);
        grouped.set(key, pairs);
    });

    for (const [key, pairs] of grouped) {
        const [table, column] = key.split(':');

        for (let index = 0; index < pairs.length; index += DB_BATCH) {
            if (stopRequested) {
                return;
            }

            await replaceBatch(db, table, column, pairs.slice(index, index + DB_BATCH));
        }
    }
}

async function replaceBatch(db, table, column, pairs) {
    if (!pairs.length) {
        return;
    }

    const values = pairs.map(() => '(?, ?)').join(', ');
    const bindings = [table, column];

    pairs.forEach(([sourceUrl, stored]) => {
        bindings.push(sourceUrl, stored);
    });
    bindings.push(column);

    await db.raw(
        `update ?? as target
         set ?? = v.new_url, updated_at = now()
         from (values ${values}) as v(old_url, new_url)
         where target.?? = v.old_url`,
        bindings
    );
}

async function replaceBoard(db, mirrored, progress) {
    const exists = await db.schema.hasTable('rating_board');

    if (!exists) {
        return;
    }

    let lastEntity = '';
    let lastId = 0;
    let rewritten = 0;

    for (;;) {
        if (stopRequested) {
            return;
        }

        const rows = await db('rating_board')
            .select('entity', 'entity_id', 'payload')
            .whereRaw('(entity > ? or (entity = ? and entity_id > ?))', [lastEntity, lastEntity, lastId])
            .orderBy([
                { column: 'entity', order: 'asc' },
                { column: 'entity_id', order: 'asc' }
            ])
            .limit(200);

        if (!rows.length) {
            break;
        }

        for (const row of rows) {
            const state = { changed: false };
            const payload = rewriteValue(row.payload, mirrored, state);

            if (state.changed) {
                await db('rating_board')
                    .where({ entity: row.entity, entity_id: row.entity_id })
                    .update({ payload, updated_at: new Date() });
                rewritten += 1;
            }
        }

        const tail = rows[rows.length - 1];

        lastEntity = tail.entity;
        lastId = tail.entity_id;
    }

    await progress.log(`Rating board rows rewritten=${rewritten}`);
}

function rewriteValue(value, mirrored, state) {
    if (typeof value === 'string') {
        const stored = mirrored.get(value);

        if (stored && stored !== value) {
            state.changed = true;

            return stored;
        }

        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => rewriteValue(item, mirrored, state));
    }

    if (value && typeof value === 'object') {
        const copy = {};

        Object.keys(value).forEach((key) => {
            copy[key] = rewriteValue(value[key], mirrored, state);
        });

        return copy;
    }

    return value;
}

async function mapPool(items, limit, worker) {
    let cursor = 0;

    async function run() {
        while (cursor < items.length && !stopRequested) {
            const index = cursor;

            cursor += 1;
            await worker(items[index], index);
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
}

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
