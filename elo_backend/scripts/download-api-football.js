'use strict';

/**
 * Download API-Football JSON to data/raw (and optionally S3). Does not write Postgres.
 *
 *   node scripts/download-api-football.js --smoke
 *   node scripts/download-api-football.js --league 39 --season 2024
 *   node scripts/download-api-football.js --all
 *
 * Resume is on by default (skip finished seasons and existing JSON files).
 * --all stops by itself when daily quota or API access is exhausted. Re-run to resume.
 * You do not need to Ctrl+C for quota. Incomplete seasons are not marked complete.
 */

const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createClient, pauseReason } = require('./lib/api-football-client');
const { parseIngestArgs } = require('./lib/cli');
const {
    downloadCompletePath,
    listPlayerStatSeasons,
    seasonDir
} = require('./lib/coverage');
const { fileExists, readJson, writeJson, relativeRaw } = require('./lib/json-store');
const { RAW_DIR, rawFile } = require('./lib/paths');
const { createProgress } = require('./lib/progress');
const { createUploadContext, uploadRawFile } = require('./lib/s3');

let stopRequested = false;

process.on('SIGINT', () => {
    if (stopRequested) {
        process.exit(1);
    }

    stopRequested = true;
    console.log('\nStop requested — finishing the current season, then exiting. Ctrl+C again aborts now.');
});

async function main() {
    const args = parseIngestArgs(process.argv);
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
        throw new Error('API_FOOTBALL_KEY is missing');
    }

    if (args.smoke) {
        await downloadSmoke(apiKey, args);

        return;
    }

    if (args.all) {
        await downloadAll(apiKey, args);

        return;
    }

    if (args.league && args.season) {
        await downloadOne(apiKey, args, args.league, args.season);

        return;
    }

    throw new Error('Use --smoke, --league <id> --season <year>, or --all.');
}

async function downloadSmoke(apiKey, args) {
    const client = createClient({ apiKey, maxRequests: 5, verbose: args.verbose });
    const s3 = args.skipS3 ? null : await createUploadContext();
    const progress = createProgress({ mode: 'download-smoke', total: 2 });

    await progress.log('Download smoke: /countries and /leagues');
    await fs.mkdir(RAW_DIR, { recursive: true });
    await fetchToFile(client, s3, rawFile('countries.json'), '/countries', {}, args);
    await fetchToFile(client, s3, rawFile('leagues.json'), '/leagues', {}, args);
    await progress.log(`API calls=${client.state.used} daily remaining=${client.state.dailyRemaining ?? '?'}`);
}

async function downloadOne(apiKey, args, leagueId, seasonYear) {
    const maxRequests = Number(process.env.INGEST_MAX_REQUESTS) || 10000;
    const client = createClient({ apiKey, maxRequests, minGapMs: 150, verbose: args.verbose });
    const s3 = args.skipS3 ? null : await createUploadContext();
    const progress = createProgress({ mode: 'download-season', total: 1 });

    await progress.log(`Download league=${leagueId} season=${seasonYear}`);

    if (s3) {
        await progress.log(`S3 uploads → s3://${s3.bucket}/api-football/ (${s3.region})`);
    }

    await ensureCatalog(client, s3, args);
    await downloadSeason(client, s3, progress, args, { leagueId, leagueName: String(leagueId), year: seasonYear });
    await progress.log(`API calls=${client.state.used} daily remaining=${client.state.dailyRemaining ?? '?'}`);
}

async function downloadAll(apiKey, args) {
    const maxRequests = Number(process.env.INGEST_MAX_REQUESTS) || 80000;
    const client = createClient({ apiKey, maxRequests, minGapMs: 150, verbose: args.verbose });
    const s3 = args.skipS3 ? null : await createUploadContext();

    await ensureCatalog(client, s3, args);

    const seasons = listPlayerStatSeasons(await readJson(rawFile('leagues.json')));
    const progress = createProgress({ mode: 'download-all', total: seasons.length });

    await progress.log(
        `Download ${seasons.length} player-match-stat seasons (resume=${args.resume}).`
        + ` Log: ${progress.logFile}`
    );

    if (s3) {
        await progress.log(`S3 uploads → s3://${s3.bucket}/api-football/ (${s3.region})`);
    }

    try {
        await walkSeasons(client, s3, progress, args, seasons);
    } catch (err) {
        const paused = pauseReason(err);

        if (paused) {
            await progress.log(paused);
            await progress.log(
                'Paused automatically. Incomplete seasons are not marked complete.'
                + ' Re-run npm run ingest:download:all when you are ready.'
            );
            await progress.snapshot({
                paused: true,
                reason: paused,
                apiUsed: client.state.used,
                dailyRemaining: client.state.dailyRemaining
            });
            process.exitCode = 2;

            return;
        }

        throw err;
    }

    await progress.log(
        `Done. completed=${progress.state.completed} skipped=${progress.state.skipped}`
        + ` API calls=${client.state.used} daily remaining=${client.state.dailyRemaining ?? '?'}`
    );
}

async function walkSeasons(client, s3, progress, args, seasons) {
    for (let index = 0; index < seasons.length; index += 1) {
        if (stopRequested) {
            await progress.log(`Stopped by user at ${index}/${seasons.length}. Re-run to resume.`);

            return;
        }

        const season = seasons[index];
        const label = `${season.leagueName} ${season.year} (${index + 1}/${seasons.length})`;

        progress.tick(index, seasons.length, label);
        await progress.snapshot({
            current: { leagueId: season.leagueId, year: season.year, index: index + 1 },
            apiUsed: client.state.used,
            dailyRemaining: client.state.dailyRemaining
        });

        const marker = downloadCompletePath(season.leagueId, season.year);

        if (args.resume && await fileExists(marker)) {
            progress.state.skipped += 1;
            continue;
        }

        await progress.log(`[${index + 1}/${seasons.length}] ${season.leagueName} league=${season.leagueId} year=${season.year}`);
        await downloadSeason(client, s3, progress, args, season);
        progress.state.completed += 1;
        progress.tick(index + 1, seasons.length, label);
    }

    progress.clearBar();
}

async function downloadSeason(client, s3, progress, args, season) {
    const dir = seasonDir(season.leagueId, season.year);

    await fs.mkdir(dir, { recursive: true });

    const teams = await fetchToFile(
        client,
        s3,
        path.join(dir, 'teams.json'),
        '/teams',
        { league: season.leagueId, season: season.year },
        args
    );
    const fixtures = await fetchToFile(
        client,
        s3,
        path.join(dir, 'fixtures.json'),
        '/fixtures',
        { league: season.leagueId, season: season.year },
        args
    );

    await fetchToFile(
        client,
        s3,
        path.join(dir, 'standings.json'),
        '/standings',
        { league: season.leagueId, season: season.year },
        args
    );
    await downloadPlayerPages(client, s3, progress, args, dir, season);
    await downloadCoaches(client, s3, args, dir, teams.response || []);
    await downloadFixtureDetails(client, s3, progress, args, fixtures.response || [], season);

    await writeJson(downloadCompletePath(season.leagueId, season.year), {
        leagueId: season.leagueId,
        year: season.year,
        fixtures: (fixtures.response || []).length,
        finishedAt: new Date().toISOString()
    });
}

async function ensureCatalog(client, s3, args) {
    await fs.mkdir(RAW_DIR, { recursive: true });

    if (!await fileExists(rawFile('countries.json'))) {
        await fetchToFile(client, s3, rawFile('countries.json'), '/countries', {}, args);
    }

    if (!await fileExists(rawFile('leagues.json'))) {
        await fetchToFile(client, s3, rawFile('leagues.json'), '/leagues', {}, args);
    }
}

async function downloadPlayerPages(client, s3, progress, args, dir, season) {
    const firstPath = path.join(dir, 'players', 'page-1.json');
    const first = await fetchToFile(
        client,
        s3,
        firstPath,
        '/players',
        { league: season.leagueId, season: season.year, page: 1 },
        args
    );
    const totalPages = first.paging?.total || 1;

    for (let page = 2; page <= totalPages; page += 1) {
        progress.tick(page, totalPages, `players ${season.leagueName} ${season.year}`);
        await fetchToFile(
            client,
            s3,
            path.join(dir, 'players', `page-${page}.json`),
            '/players',
            { league: season.leagueId, season: season.year, page },
            args
        );
    }
}

async function downloadCoaches(client, s3, args, dir, teamRows) {
    for (const row of teamRows) {
        const teamId = row.team?.id;

        if (!teamId) {
            continue;
        }

        await fetchToFile(client, s3, path.join(dir, 'coaches', `${teamId}.json`), '/coachs', { team: teamId }, args);
    }
}

async function downloadFixtureDetails(client, s3, progress, args, fixtureRows, season) {
    const total = fixtureRows.length;

    for (let index = 0; index < total; index += 1) {
        const fixtureId = fixtureRows[index]?.fixture?.id;

        if (!fixtureId) {
            continue;
        }

        const dir = rawFile('fixtures', String(fixtureId));

        progress.tick(index + 1, total, `fixtures ${season.leagueName} ${season.year}`);
        await fetchToFile(client, s3, path.join(dir, 'events.json'), '/fixtures/events', { fixture: fixtureId }, args);
        await fetchToFile(client, s3, path.join(dir, 'lineups.json'), '/fixtures/lineups', { fixture: fixtureId }, args);
        await fetchToFile(client, s3, path.join(dir, 'statistics.json'), '/fixtures/statistics', {
            fixture: fixtureId
        }, args);
        await fetchToFile(client, s3, path.join(dir, 'players.json'), '/fixtures/players', { fixture: fixtureId }, args);
    }
}

async function fetchToFile(client, s3, filePath, pathname, params, args) {
    if (await fileExists(filePath)) {
        if (args.verbose) {
            console.log(`  skip ${relativeRaw(filePath)}`);
        }

        return readJson(filePath);
    }

    const payload = await client.get(pathname, params);

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

main().catch((err) => {
    const paused = pauseReason(err);

    if (paused) {
        console.error(paused);
        console.error('Paused automatically. Re-run npm run ingest:download:all to resume.');
        process.exitCode = 2;

        return;
    }

    console.error(err.message || err);
    process.exitCode = 1;
});
