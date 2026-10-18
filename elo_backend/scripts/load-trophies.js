'use strict';

/**
 * Map local /trophies JSON into Postgres. Does not call API-Football.
 *
 *   node scripts/load-trophies.js --smoke
 *   node scripts/load-trophies.js --all
 *   node scripts/load-trophies.js --all --live
 *
 * Players/coaches must already be loaded (FK). Unknown ids are skipped.
 */

const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const knexLib = require('knex');
const knexConfig = require('../src/infra/database/knexfile');
const { parseIngestArgs } = require('./lib/cli');
const { fileExists, readJson } = require('./lib/json-store');
const { rawFile } = require('./lib/paths');
const { createProgress, describeDbTarget } = require('./lib/progress');
const { batchInsert } = require('./lib/upsert');

const SMOKE_PLAYER_ID = 874;

let knex = null;
let stopRequested = false;

process.on('SIGINT', () => {
    if (stopRequested) {
        process.exit(1);
    }

    stopRequested = true;
    console.log('\nStop requested — finishing the current person, then exiting. Ctrl+C again aborts now.');
});

async function main() {
    const args = parseIngestArgs(process.argv);

    if (args.live && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is missing (needed for --live)');
    }

    knex = knexLib(args.live ? knexConfig.production : knexConfig.development);

    try {
        if (args.smoke) {
            await loadOne('player', SMOKE_PLAYER_ID, new Set(await knex('players').pluck('id')), new Set());

            return;
        }

        if (args.player) {
            await loadOne('player', args.player, new Set(await knex('players').pluck('id')), new Set());

            return;
        }

        if (args.coach) {
            await loadOne('coach', args.coach, new Set(), new Set(await knex('coaches').pluck('id')));

            return;
        }

        if (!args.all) {
            throw new Error('Use --smoke, --player <id>, --coach <id>, or --all. Add --live for Heroku.');
        }

        await loadAll(args);
    } finally {
        await knex.destroy();
    }
}

async function loadAll(args) {
    const jobs = await listTrophyFiles();

    if (jobs.length === 0) {
        throw new Error('No trophies JSON on disk. Run npm run ingest:download:trophies first.');
    }

    const knownPlayers = new Set(await knex('players').pluck('id'));
    const knownCoaches = new Set(await knex('coaches').pluck('id'));
    const progress = createProgress({
        mode: args.live ? 'load-trophies-live' : 'load-trophies-local',
        total: jobs.length
    });

    await progress.log(`Load ${jobs.length} trophy files → ${describeDbTarget(args.live, knexConfig)}`);

    let loaded = 0;
    let skipped = 0;

    for (let index = 0; index < jobs.length; index += 1) {
        if (stopRequested) {
            await progress.log(`Stopped by user at ${index}/${jobs.length}. Re-run to resume.`);

            return;
        }

        const job = jobs[index];

        progress.tick(index, jobs.length, `${job.kind} ${job.id}`);

        const result = await loadOne(job.kind, job.id, knownPlayers, knownCoaches, true);

        if (result === 'skipped') {
            skipped += 1;
        } else {
            loaded += 1;
        }

        progress.tick(index + 1, jobs.length, `${job.kind} ${job.id}`);
    }

    progress.clearBar();
    await progress.log(`Done. loaded=${loaded} skipped=${skipped} (missing player/coach row)`);
}

async function loadOne(kind, id, knownPlayers, knownCoaches, quiet = false) {
    const filePath = trophyPath(kind, id);

    if (!await fileExists(filePath)) {
        if (!quiet) {
            console.log(`Missing ${filePath}. Download trophies first.`);
        }

        return 'skipped';
    }

    const known = kind === 'player' ? knownPlayers : knownCoaches;

    if (!known.has(id)) {
        if (!quiet) {
            console.log(`Skip ${kind} ${id}: not in ${kind === 'player' ? 'players' : 'coaches'} yet.`);
        }

        return 'skipped';
    }

    const payload = await readJson(filePath);
    const column = kind === 'player' ? 'player_id' : 'coach_id';
    const rows = (payload.response || [])
        .map((item) => mapTrophy(item, kind, id))
        .filter(Boolean);

    await knex('trophies').where(column, id).del();
    await batchInsert(knex, 'trophies', rows);

    if (!quiet) {
        console.log(`Loaded ${rows.length} trophies for ${kind} ${id}`);
    }

    return 'loaded';
}

function mapTrophy(item, kind, id) {
    const league = typeof item.league === 'string' ? item.league : item.league?.name;

    if (!league) {
        return null;
    }

    return {
        player_id: kind === 'player' ? id : null,
        coach_id: kind === 'coach' ? id : null,
        competition_name: league,
        country: item.country || item.league?.country || null,
        season: item.season == null ? null : String(item.season),
        place: item.place || null
    };
}

function trophyPath(kind, id) {
    const folder = kind === 'player' ? 'players' : 'coaches';

    return rawFile('trophies', folder, `${id}.json`);
}

async function listTrophyFiles() {
    const jobs = [];

    for (const kind of ['player', 'coach']) {
        const folder = kind === 'player' ? 'players' : 'coaches';
        const dir = rawFile('trophies', folder);

        if (!await fileExists(dir)) {
            continue;
        }

        const names = await fs.readdir(dir);

        for (const fileName of names.filter((entry) => entry.endsWith('.json'))) {
            const id = Number(path.basename(fileName, '.json'));

            if (Number.isFinite(id)) {
                jobs.push({ kind, id });
            }
        }
    }

    return jobs;
}

main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
});
