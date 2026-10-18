'use strict';

/**
 * Download API-Football /trophies JSON. Does not write Postgres.
 * One request per player or coach. IDs come from already-downloaded season files
 * unless you pass --player / --coach.
 *
 *   node scripts/download-trophies.js --smoke
 *   node scripts/download-trophies.js --player 874
 *   node scripts/download-trophies.js --coach 2
 *   node scripts/download-trophies.js --league 39 --season 2024
 *   node scripts/download-trophies.js --all
 *
 * Resume skips existing trophies/{players|coaches}/{id}.json. Quota pause + re-run.
 */

const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createClient, pauseReason } = require('./lib/api-football-client');
const { parseIngestArgs } = require('./lib/cli');
const { listPlayerStatSeasons, seasonDir } = require('./lib/coverage');
const { fileExists, readJson, writeJson } = require('./lib/json-store');
const { rawFile } = require('./lib/paths');
const { createProgress } = require('./lib/progress');
const { createUploadContext, uploadRawFile } = require('./lib/s3');

const SMOKE_PLAYER_ID = 874;

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
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
        throw new Error('API_FOOTBALL_KEY is missing');
    }

    const maxRequests = Number(process.env.INGEST_MAX_REQUESTS) || (args.smoke ? 5 : 10000);
    const client = createClient({ apiKey, maxRequests, minGapMs: 150, verbose: args.verbose });
    const s3 = args.skipS3 ? null : await createUploadContext();

    if (args.smoke) {
        await downloadOne(client, s3, args, 'player', SMOKE_PLAYER_ID);
        console.log(`API calls=${client.state.used} daily remaining=${client.state.dailyRemaining ?? '?'}`);

        return;
    }

    if (args.player) {
        await downloadOne(client, s3, args, 'player', args.player);
        console.log(`API calls=${client.state.used} daily remaining=${client.state.dailyRemaining ?? '?'}`);

        return;
    }

    if (args.coach) {
        await downloadOne(client, s3, args, 'coach', args.coach);
        console.log(`API calls=${client.state.used} daily remaining=${client.state.dailyRemaining ?? '?'}`);

        return;
    }

    if (!args.all && !(args.league && args.season)) {
        throw new Error('Use --smoke, --player <id>, --coach <id>, --league <id> --season <year>, or --all.');
    }

    const { players, coaches } = await collectIds(args);
    const jobs = [
        ...players.map((id) => ({ kind: 'player', id })),
        ...coaches.map((id) => ({ kind: 'coach', id }))
    ];

    if (jobs.length === 0) {
        throw new Error(
            'No player or coach ids on disk. Download a league-season first (npm run ingest:download:season).'
        );
    }

    const progress = createProgress({ mode: 'download-trophies', total: jobs.length });

    await progress.log(
        `Download trophies for ${players.length} players and ${coaches.length} coaches (resume skip existing files).`
        + ` Log: ${progress.logFile}`
    );

    for (let index = 0; index < jobs.length; index += 1) {
        if (stopRequested) {
            await progress.log(`Stopped by user at ${index}/${jobs.length}. Re-run to resume.`);

            return;
        }

        const job = jobs[index];
        const label = `${job.kind} ${job.id} (${index + 1}/${jobs.length})`;

        progress.tick(index, jobs.length, label);
        await progress.snapshot({
            current: job,
            apiUsed: client.state.used,
            dailyRemaining: client.state.dailyRemaining
        });

        const existed = await fileExists(trophyPath(job.kind, job.id));

        await downloadOne(client, s3, args, job.kind, job.id);

        if (existed && args.resume) {
            progress.state.skipped += 1;
        } else {
            progress.state.completed += 1;
        }

        progress.tick(index + 1, jobs.length, label);
    }

    progress.clearBar();
    await progress.log(
        `Done. completed=${progress.state.completed} skipped=${progress.state.skipped}`
        + ` API calls=${client.state.used} daily remaining=${client.state.dailyRemaining ?? '?'}`
    );
}

async function downloadOne(client, s3, args, kind, id) {
    const filePath = trophyPath(kind, id);
    const params = kind === 'player' ? { player: id } : { coach: id };

    if (await fileExists(filePath) && args.resume !== false) {
        return readJson(filePath);
    }

    const payload = await client.get('/trophies', params);

    await writeJson(filePath, payload);

    if (s3) {
        try {
            await uploadRawFile(s3, filePath);
        } catch (err) {
            await fs.unlink(filePath).catch(() => null);
            throw err;
        }
    }

    return payload;
}

function trophyPath(kind, id) {
    const folder = kind === 'player' ? 'players' : 'coaches';

    return rawFile('trophies', folder, `${id}.json`);
}

async function collectIds(args) {
    const players = new Set();
    const coaches = new Set();
    const seasons = args.league && args.season
        ? [{ leagueId: args.league, year: args.season, leagueName: String(args.league) }]
        : listPlayerStatSeasons(await readJson(rawFile('leagues.json')));

    for (const season of seasons) {
        const dir = seasonDir(season.leagueId, season.year);
        const playersDir = path.join(dir, 'players');
        const coachesDir = path.join(dir, 'coaches');

        await collectPlayerIds(playersDir, players);
        await collectCoachIds(coachesDir, coaches);
    }

    return {
        players: [...players].sort((left, right) => left - right),
        coaches: [...coaches].sort((left, right) => left - right)
    };
}

async function collectPlayerIds(dir, ids) {
    if (!await fileExists(dir)) {
        return;
    }

    const names = await fs.readdir(dir);

    for (const fileName of names.filter((entry) => entry.endsWith('.json'))) {
        const payload = await readJson(path.join(dir, fileName));

        for (const row of payload.response || []) {
            if (row.player?.id) {
                ids.add(row.player.id);
            }
        }
    }
}

async function collectCoachIds(dir, ids) {
    if (!await fileExists(dir)) {
        return;
    }

    const names = await fs.readdir(dir);

    for (const fileName of names.filter((entry) => entry.endsWith('.json'))) {
        const payload = await readJson(path.join(dir, fileName));

        for (const coach of payload.response || []) {
            if (coach.id) {
                ids.add(coach.id);
            }
        }
    }
}

main().catch((err) => {
    const paused = pauseReason(err);

    if (paused) {
        console.error(paused);
        console.error('Paused automatically. Re-run npm run ingest:download:trophies to resume.');
        process.exitCode = 2;

        return;
    }

    console.error(err.message || err);
    process.exitCode = 1;
});
