'use strict';

/**
 * Download StatsBomb Open Data from GitHub (hudl/open-data). No API key.
 * Does not call API-Football. Does not write Postgres.
 *
 *   node scripts/download-statsbomb.js --smoke
 *   node scripts/download-statsbomb.js --all
 *
 * Resume skips existing JSON. --fresh re-downloads.
 * If you publish analysis from this dump, credit StatsBomb and use their logo.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { parseIngestArgs } = require('./lib/cli');
const { fileExists, readJson, writeJson } = require('./lib/json-store');
const { STATSBOMB_RAW_DIR, statsbombFile } = require('./lib/paths');
const { createProgress } = require('./lib/progress');

const RAW_BASE = 'https://raw.githubusercontent.com/hudl/open-data/master/data';
const USER_AGENT = process.env.STATSBOMB_USER_AGENT
    || process.env.WIKIDATA_USER_AGENT
    || 'EloStatsFootball/0.1 (open-data ingest; +https://github.com/hudl/open-data)';
const CONCURRENCY = 6;

let stopRequested = false;

process.on('SIGINT', () => {
    if (stopRequested) {
        process.exit(1);
    }

    stopRequested = true;
    console.log('\nStop requested — finishing in-flight files, then exiting. Ctrl+C again aborts now.');
});

async function main() {
    const args = parseIngestArgs(process.argv);

    if (!args.smoke && !args.all) {
        throw new Error('Use --smoke or --all.');
    }

    if (args.smoke) {
        await downloadSmoke(args);

        return;
    }

    await downloadAll(args);
}

async function downloadSmoke(args) {
    const progress = createProgress({ mode: 'statsbomb-smoke', total: 4, dir: STATSBOMB_RAW_DIR });

    await progress.log('StatsBomb open-data smoke (GitHub, no key)');
    const competitions = await fetchToFile(
        statsbombFile('competitions.json'),
        `${RAW_BASE}/competitions.json`,
        args
    );
    const first = competitions[0];

    if (!first) {
        throw new Error('competitions.json was empty');
    }

    const matches = await fetchToFile(
        statsbombFile('matches', String(first.competition_id), `${first.season_id}.json`),
        `${RAW_BASE}/matches/${first.competition_id}/${first.season_id}.json`,
        args
    );
    const matchId = matches[0]?.match_id;

    if (!matchId) {
        throw new Error(`No matches in ${first.competition_name} ${first.season_name}`);
    }

    await fetchToFile(statsbombFile('events', `${matchId}.json`), `${RAW_BASE}/events/${matchId}.json`, args);
    await fetchToFile(statsbombFile('lineups', `${matchId}.json`), `${RAW_BASE}/lineups/${matchId}.json`, args);
    await writeManifest();
    await progress.log(
        `Smoke saved ${first.competition_name} ${first.season_name} match=${matchId} → ${STATSBOMB_RAW_DIR}`
    );
}

async function downloadAll(args) {
    const competitions = await fetchToFile(
        statsbombFile('competitions.json'),
        `${RAW_BASE}/competitions.json`,
        args
    );
    const jobs = [];

    for (const row of competitions) {
        jobs.push({
            kind: 'matches',
            dest: statsbombFile('matches', String(row.competition_id), `${row.season_id}.json`),
            url: `${RAW_BASE}/matches/${row.competition_id}/${row.season_id}.json`,
            label: `${row.competition_name} ${row.season_name}`
        });
    }

    const progress = createProgress({ mode: 'statsbomb-all', total: jobs.length, dir: STATSBOMB_RAW_DIR });

    await progress.log(`Download ${competitions.length} competition-seasons from hudl/open-data`);
    await writeManifest();

    const matchFiles = await mapPool(jobs, CONCURRENCY, async (job, index) => {
        if (stopRequested) {
            return null;
        }

        progress.tick(index, jobs.length, job.label);
        await fetchToFile(job.dest, job.url, args);

        return job.dest;
    });

    if (stopRequested) {
        await progress.log('Stopped by user. Re-run npm run ingest:statsbomb:download to resume.');

        return;
    }

    const matchIds = new Set();

    for (const filePath of matchFiles.filter(Boolean)) {
        const rows = await readJson(filePath);

        for (const match of rows) {
            if (match.match_id) {
                matchIds.add(match.match_id);
            }
        }
    }

    const detailJobs = [];

    for (const matchId of [...matchIds].sort((left, right) => left - right)) {
        detailJobs.push({
            dest: statsbombFile('events', `${matchId}.json`),
            url: `${RAW_BASE}/events/${matchId}.json`,
            optional: false
        });
        detailJobs.push({
            dest: statsbombFile('lineups', `${matchId}.json`),
            url: `${RAW_BASE}/lineups/${matchId}.json`,
            optional: false
        });
        detailJobs.push({
            dest: statsbombFile('three-sixty', `${matchId}.json`),
            url: `${RAW_BASE}/three-sixty/${matchId}.json`,
            optional: true
        });
    }

    progress.state.total = jobs.length + detailJobs.length;
    await progress.log(`Fetching events/lineups/360 for ${matchIds.size} matches (${detailJobs.length} files)`);

    let done = jobs.length;

    await mapPool(detailJobs, CONCURRENCY, async (job) => {
        if (stopRequested) {
            return;
        }

        done += 1;
        progress.tick(done, progress.state.total, path.basename(job.dest));
        await fetchToFile(job.dest, job.url, args, job.optional);
    });

    progress.clearBar();

    if (stopRequested) {
        await progress.log('Stopped by user. Re-run npm run ingest:statsbomb:download to resume.');

        return;
    }

    await writeJson(statsbombFile('_complete.json'), {
        source: 'https://github.com/hudl/open-data',
        competitionSeasons: competitions.length,
        matches: matchIds.size,
        finishedAt: new Date().toISOString()
    });
    await progress.log(`Done. seasons=${competitions.length} matches=${matchIds.size} → ${STATSBOMB_RAW_DIR}`);
}

async function writeManifest() {
    await writeJson(statsbombFile('_manifest.json'), {
        source: 'https://github.com/hudl/open-data',
        rawBase: RAW_BASE,
        attribution: 'Credit StatsBomb and use their logo if you publish analysis.',
        updatedAt: new Date().toISOString()
    });
}

async function fetchToFile(filePath, url, args, optional = false) {
    if (args.resume && await fileExists(filePath)) {
        return readJson(filePath);
    }

    const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
    });

    if (response.status === 404 && optional) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${url}`);
    }

    const payload = await response.json();

    await writeJson(filePath, payload);

    return payload;
}

async function mapPool(items, concurrency, worker) {
    const results = new Array(items.length);
    let next = 0;

    async function run() {
        while (next < items.length && !stopRequested) {
            const index = next;
            next += 1;
            results[index] = await worker(items[index], index);
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));

    return results;
}

main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
});
