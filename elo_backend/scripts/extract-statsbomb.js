'use strict';

/**
 * Roll downloaded StatsBomb events into per-match player counts.
 * Does not write Postgres. Does not read freeze-frame / 360 files.
 *
 *   node scripts/extract-statsbomb.js --smoke
 *   node scripts/extract-statsbomb.js --all
 *
 * Resume skips extracted competition-seasons. --fresh rebuilds them.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { parseIngestArgs } = require('./lib/cli');
const { fileExists, readJson, writeJson } = require('./lib/json-store');
const { STATSBOMB_RAW_DIR, statsbombFile, statsbombExtractedFile } = require('./lib/paths');
const { createProgress } = require('./lib/progress');
const { aggregateMatch, finalizeStats } = require('./lib/statsbomb-events');
const { scopedCompetitions, seasonStartYear } = require('./lib/statsbomb-scope');

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

    if (!args.smoke && !args.all) {
        throw new Error('Use --smoke or --all.');
    }

    const catalogPath = statsbombFile('competitions.json');

    if (!await fileExists(catalogPath)) {
        throw new Error('No StatsBomb dump. Run npm run ingest:statsbomb:download first.');
    }

    const competitions = scopedCompetitions(await readJson(catalogPath), { everything: args.everything });

    if (!competitions.length) {
        throw new Error('No in-scope StatsBomb competitions on disk.');
    }

    if (args.smoke) {
        await extractSmoke(competitions);

        return;
    }

    await extractAll(competitions, args);
}

async function extractSmoke(competitions) {
    const progress = createProgress({ mode: 'statsbomb-extract-smoke', total: 1, dir: STATSBOMB_RAW_DIR });
    const season = await firstSeasonWithEvents(competitions);

    if (!season) {
        throw new Error('No in-scope match events on disk. Run npm run ingest:statsbomb:download first.');
    }

    const match = season.matches[0];
    const payload = await extractSeason(season.row, [match]);
    const dest = statsbombExtractedFile('_smoke.json');

    await writeJson(dest, payload);
    const playerCount = payload.matches[0]?.players.length || 0;
    const label = `${season.row.competition_name} ${season.row.season_name}`;

    await progress.log(`Smoke extract ${label} match=${match.match_id} players=${playerCount} → ${dest}`);
}

async function extractAll(competitions, args) {
    const progress = createProgress({
        mode: 'statsbomb-extract',
        total: competitions.length,
        dir: STATSBOMB_RAW_DIR
    });

    await progress.log(`Extract ${competitions.length} in-scope competition-seasons (no frames)`);

    let done = 0;
    let skipped = 0;
    let matchesOut = 0;

    for (const row of competitions) {
        if (stopRequested) {
            break;
        }

        const dest = extractedPath(row);

        if (args.resume && await fileExists(dest)) {
            skipped += 1;
            done += 1;
            progress.tick(done, competitions.length, `skip ${row.competition_name} ${row.season_name}`);
            continue;
        }

        const matchPath = statsbombFile('matches', String(row.competition_id), `${row.season_id}.json`);

        if (!await fileExists(matchPath)) {
            skipped += 1;
            done += 1;
            progress.tick(done, competitions.length, `missing ${row.competition_name} ${row.season_name}`);
            continue;
        }

        const matches = await readJson(matchPath);
        const payload = await extractSeason(row, matches);

        if (stopRequested) {
            break;
        }

        await writeJson(dest, payload);
        matchesOut += payload.matches.length;
        done += 1;
        progress.tick(done, competitions.length, `${row.competition_name} ${row.season_name}`);
    }

    progress.clearBar();

    if (stopRequested) {
        await progress.log('Stopped by user. Re-run npm run ingest:statsbomb:extract to resume.');

        return;
    }

    await writeJson(statsbombExtractedFile('_complete.json'), {
        source: 'statsbomb-open-data',
        seasons: competitions.length,
        matches: matchesOut,
        skipped,
        finishedAt: new Date().toISOString()
    });
    await progress.log(`Done. seasons=${done} skipped=${skipped} matches=${matchesOut} → ${statsbombExtractedFile()}`);
}

async function extractSeason(row, matches) {
    const extracted = [];

    for (const match of matches) {
        if (stopRequested) {
            break;
        }

        const matchId = match.match_id;
        const eventsPath = statsbombFile('events', `${matchId}.json`);
        const lineupsPath = statsbombFile('lineups', `${matchId}.json`);

        if (!await fileExists(eventsPath) || !await fileExists(lineupsPath)) {
            continue;
        }

        const events = await readJson(eventsPath);
        const lineups = await readJson(lineupsPath);
        const homeId = match.home_team?.home_team_id;
        const awayId = match.away_team?.away_team_id;
        const players = aggregateMatch(events, lineups, homeId, awayId).map((person) => ({
            ...person,
            stats: finalizeStats(person.stats)
        }));

        extracted.push({
            statsbombMatchId: matchId,
            matchDate: match.match_date || null,
            kickOff: match.kick_off || null,
            home: {
                statsbombTeamId: homeId,
                name: match.home_team?.home_team_name || null,
                gender: match.home_team?.home_team_gender || row.competition_gender || null
            },
            away: {
                statsbombTeamId: awayId,
                name: match.away_team?.away_team_name || null,
                gender: match.away_team?.away_team_gender || row.competition_gender || null
            },
            homeScore: match.home_score ?? null,
            awayScore: match.away_score ?? null,
            players
        });
    }

    return {
        competitionId: row.competition_id,
        competitionName: row.competition_name,
        competitionGender: row.competition_gender || null,
        competitionInternational: Boolean(row.competition_international),
        seasonId: row.season_id,
        seasonName: row.season_name,
        seasonYear: seasonStartYear(row.season_name),
        matches: extracted
    };
}

async function firstSeasonWithEvents(competitions) {
    for (const row of competitions) {
        const matchPath = statsbombFile('matches', String(row.competition_id), `${row.season_id}.json`);

        if (!await fileExists(matchPath)) {
            continue;
        }

        const matches = await readJson(matchPath);

        for (const match of matches) {
            if (await fileExists(statsbombFile('events', `${match.match_id}.json`))) {
                return { row, matches: [match] };
            }
        }
    }

    return null;
}

function extractedPath(row) {
    return statsbombExtractedFile(String(row.competition_id), `${row.season_id}.json`);
}

main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
});
