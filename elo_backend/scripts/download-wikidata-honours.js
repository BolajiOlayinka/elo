'use strict';

/**
 * Download Wikidata honours for people already on disk (born-YYYY/_ids.json).
 * P166 award received + P2522 victory. Does not re-list people. No API-Football.
 *
 *   npm run ingest:wikidata:honours:smoke
 *   npm run ingest:wikidata:honours
 *   node scripts/download-wikidata-honours.js --year 1985
 *
 * Resume skips birth years with honours/born-YYYY/_complete.json.
 */

const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { fileExists, readJson, writeJson } = require('./lib/json-store');
const { WIKIDATA_RAW_DIR, wikidataFile } = require('./lib/paths');
const { createProgress } = require('./lib/progress');
const {
    createWikidataClient,
    literal,
    qidFromUri,
    resolveUserAgent
} = require('./lib/wikidata-client');
const { honoursQuery } = require('./lib/wikidata-queries');

const BATCH_SIZE = 40;
const SMOKE_LIMIT = 40;
const SMOKE_YEAR = 1985;

let stopRequested = false;

process.on('SIGINT', () => {
    if (stopRequested) {
        process.exit(1);
    }

    stopRequested = true;
    console.log('\nStop requested — finishing the current birth year, then exiting. Ctrl+C again aborts now.');
});

async function main() {
    const args = parseArgs(process.argv);
    const client = createWikidataClient({ userAgent: resolveUserAgent() });
    const years = args.smoke
        ? [SMOKE_YEAR]
        : args.year != null
            ? [args.year]
            : await listBirthYears();

    if (!years.length) {
        throw new Error('No people/born-* folders with _ids.json. Run npm run ingest:wikidata:download first.');
    }

    const progress = createProgress({
        mode: args.smoke ? 'wikidata-honours-smoke' : 'wikidata-honours',
        total: years.length,
        dir: WIKIDATA_RAW_DIR
    });

    await writeJson(wikidataFile('honours', '_manifest.json'), {
        source: 'wikidata',
        properties: ['P166 award received', 'P2522 victory'],
        supporting: true,
        resume: args.resume,
        startedAt: new Date().toISOString()
    });

    await progress.log(
        `Wikidata honours for birth ${years[0]}–${years[years.length - 1]} (resume=${args.resume}).`
        + ` Files: ${wikidataFile('honours')}`
    );

    try {
        for (const year of years) {
            if (stopRequested) {
                await progress.log('Stopped by user. Re-run to resume.');
                process.exitCode = 2;

                return;
            }

            await downloadYear(client, args, year, progress);
        }

        await progress.log(`Done. SPARQL calls=${client.state.used}`);
    } finally {
        progress.clearBar();
    }
}

async function downloadYear(client, args, birthYear, progress) {
    const outDir = wikidataFile('honours', `born-${birthYear}`);
    const completePath = path.join(outDir, '_complete.json');

    if (args.resume && !args.smoke && await fileExists(completePath)) {
        progress.state.skipped += 1;
        progress.state.completed += 1;
        progress.tick(progress.state.completed, progress.state.total, `born-${birthYear} skip`);
        await progress.snapshot({ current: `born-${birthYear}` });

        return;
    }

    const qids = await readYearQids(birthYear);

    if (!qids.length) {
        await progress.log(`born-${birthYear}: no _ids.json, skip`);
        progress.state.skipped += 1;
        progress.state.completed += 1;
        progress.tick(progress.state.completed, progress.state.total, `born-${birthYear} skip`);

        return;
    }

    const work = args.smoke ? qids.slice(0, SMOKE_LIMIT) : qids;

    await progress.log(`born-${birthYear}: ${work.length} people, fetching P166/P2522`);

    const people = [];
    const batches = chunk(work, args.smoke ? 20 : BATCH_SIZE);

    for (let index = 0; index < batches.length; index += 1) {
        if (stopRequested) {
            break;
        }

        const rows = await loadHonours(client, batches[index]);
        people.push(...rows);
        await writeJson(path.join(outDir, `batch-${String(index + 1).padStart(4, '0')}.json`), rows);
        progress.tick(index + 1, batches.length, `born-${birthYear} batch`);
    }

    const withHonours = people.filter((person) => person.honours.length).length;
    const honourCount = people.reduce((sum, person) => sum + person.honours.length, 0);

    await writeJson(path.join(outDir, 'people.json'), people);
    await writeJson(path.join(outDir, '_summary.json'), {
        birthYear,
        personCount: people.length,
        withHonours,
        honourCount
    });

    if (!args.smoke && !stopRequested) {
        await writeJson(completePath, {
            birthYear,
            personCount: people.length,
            withHonours,
            honourCount,
            completedAt: new Date().toISOString()
        });
    }

    progress.state.completed += 1;
    progress.tick(progress.state.completed, progress.state.total, `born-${birthYear}`);
    await progress.snapshot({ current: `born-${birthYear}`, apiUsed: client.state.used });
    await progress.log(
        `born-${birthYear}: ${withHonours}/${people.length} people have honours (${honourCount} rows)${args.smoke ? ' [smoke, not marked complete]' : ''}`
    );
}

async function loadHonours(client, qids) {
    const byQid = new Map(qids.map((qid) => [qid, { qid, honours: [] }]));
    const bindings = await client.sparql(honoursQuery(qids));

    for (const row of bindings) {
        const qid = qidFromUri(row.person && row.person.value);
        const person = byQid.get(qid);
        const honourQid = qidFromUri(row.honour && row.honour.value);

        if (!person || !honourQid) {
            continue;
        }

        const item = {
            kind: literal(row.kind) || 'award',
            honourQid,
            honourLabel: literal(row.honourLabel),
            when: literal(row.when),
            ofQid: qidFromUri(row.of && row.of.value),
            ofLabel: literal(row.ofLabel)
        };
        const key = `${item.kind}|${item.honourQid}|${item.when}|${item.ofQid}`;

        if (!person.honours.some((entry) => `${entry.kind}|${entry.honourQid}|${entry.when}|${entry.ofQid}` === key)) {
            person.honours.push(item);
        }
    }

    return [...byQid.values()];
}

async function listBirthYears() {
    const dir = wikidataFile('people');

    if (!await fileExists(dir)) {
        return [];
    }

    const names = await fs.readdir(dir);
    const years = [];

    for (const folder of names.filter((entry) => entry.startsWith('born-'))) {
        const year = Number(folder.slice(5));
        const idsPath = path.join(dir, folder, '_ids.json');

        if (Number.isFinite(year) && await fileExists(idsPath)) {
            years.push(year);
        }
    }

    return years.sort((left, right) => left - right);
}

async function readYearQids(birthYear) {
    const idsPath = wikidataFile('people', `born-${birthYear}`, '_ids.json');

    if (!await fileExists(idsPath)) {
        return [];
    }

    const payload = await readJson(idsPath);

    return Array.isArray(payload.qids) ? payload.qids : [];
}

function chunk(items, size) {
    const groups = [];

    for (let index = 0; index < items.length; index += size) {
        groups.push(items.slice(index, index + size));
    }

    return groups;
}

function parseArgs(argv) {
    const args = {
        smoke: false,
        resume: true,
        year: null
    };

    for (let index = 2; index < argv.length; index += 1) {
        const flag = argv[index];

        if (flag === '--smoke') {
            args.smoke = true;
        } else if (flag === '--all') {
            args.year = null;
        } else if (flag === '--resume') {
            args.resume = true;
        } else if (flag === '--fresh') {
            args.resume = false;
        } else if (flag === '--year') {
            args.year = Number(argv[index + 1]);
            index += 1;
        } else {
            throw new Error(`Unknown argument: ${flag}`);
        }
    }

    if (args.year != null && !Number.isFinite(args.year)) {
        throw new Error('--year must be a birth year (e.g. 1985)');
    }

    if (!args.smoke && args.year == null && !argv.includes('--all')) {
        throw new Error('Use --smoke, --year <birthYear>, or --all.');
    }

    return args;
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
