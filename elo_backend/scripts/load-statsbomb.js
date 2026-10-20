'use strict';

/**
 * Load extracted StatsBomb counts into Postgres.
 * Links to existing matches/players/teams via statsbomb_id, then name.
 * Does not overwrite API-Football goals / apps. Does not store frames.
 *
 *   node scripts/load-statsbomb.js --smoke
 *   node scripts/load-statsbomb.js --all
 *   node scripts/load-statsbomb.js --all --live
 */

const path = require('path');
const fs = require('fs/promises');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const knexLib = require('knex');
const knexConfig = require('../src/infra/database/knexfile');
const { parseIngestArgs } = require('./lib/cli');
const { fileExists, readJson } = require('./lib/json-store');
const { STATSBOMB_RAW_DIR, statsbombExtractedFile } = require('./lib/paths');
const { createProgress, describeDbTarget } = require('./lib/progress');
const { batchUpsert } = require('./lib/upsert');
const { seasonStartYear } = require('./lib/statsbomb-scope');

const RESERVED_ID_FLOOR = 1000000000;

const ADVANCED = [
    'xg', 'npxg', 'xa', 'xg_faced', 'pressures', 'carries',
    'progressive_carries', 'progressive_passes', 'passes_into_box'
];

let knex = null;
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

    if (args.live && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is missing (needed for --live)');
    }

    knex = knexLib(args.live ? knexConfig.production : knexConfig.development);

    try {
        await assertColumns();
        const files = args.smoke
            ? [statsbombExtractedFile('_smoke.json')]
            : await listExtractedSeasons();

        if (!files.length) {
            throw new Error('No extracted StatsBomb files. Run npm run ingest:statsbomb:extract first.');
        }

        const progress = createProgress({
            mode: args.smoke ? 'statsbomb-load-smoke' : 'statsbomb-load',
            total: files.length,
            dir: STATSBOMB_RAW_DIR
        });

        await progress.log(`Load ${files.length} file(s) → ${describeDbTarget(args.live, knexConfig)}`);

        const context = await buildContext();
        let done = 0;

        for (const filePath of files) {
            if (stopRequested) {
                break;
            }

            if (!await fileExists(filePath)) {
                throw new Error(`Missing ${filePath}`);
            }

            const season = await readJson(filePath);

            await loadSeason(context, season);
            done += 1;
            progress.tick(done, files.length, `${season.competitionName} ${season.seasonName}`);
        }

        progress.clearBar();

        if (stopRequested) {
            await progress.log('Stopped by user. Re-run npm run ingest:statsbomb:load to resume.');

            return;
        }

        await progress.log(`Done. seasons=${done} createdPlayers=${context.created.players}`
            + ` createdMatches=${context.created.matches} skippedPlayers=${context.skipped.length}`);

        if (context.skipped.length) {
            await progress.log(`Skipped ${context.skipped.length} ambiguous player name(s). First: ${
                context.skipped.slice(0, 5).join('; ')
            }`);
        }
    } finally {
        await knex.destroy();
    }
}

async function listExtractedSeasons() {
    const root = statsbombExtractedFile();

    if (!await fileExists(root)) {
        return [];
    }

    const files = [];
    const competitions = await fs.readdir(root, { withFileTypes: true });

    for (const entry of competitions) {
        if (!entry.isDirectory()) {
            continue;
        }

        const dir = path.join(root, entry.name);
        const seasons = await fs.readdir(dir);

        for (const fileName of seasons) {
            if (fileName.endsWith('.json')) {
                files.push(path.join(dir, fileName));
            }
        }
    }

    return files.sort();
}

async function assertColumns() {
    const hasId = await knex.schema.hasColumn('players', 'statsbomb_id');
    const hasXg = await knex.schema.hasColumn('player_season_stats', 'xg');

    if (!hasId || !hasXg) {
        throw new Error('StatsBomb columns are missing. Run npm run mg:latest or npm run mg:latest:live.');
    }
}

async function buildContext() {
    const [players, teams, leagues, matches, playerMax, teamMax, leagueMax, matchMax] = await Promise.all([
        knex('players').select('id', 'name', 'first_name', 'last_name', 'nationality', 'birth_date', 'statsbomb_id'),
        knex('teams').select('id', 'name', 'country_name', 'is_national', 'statsbomb_id'),
        knex('leagues').select('id', 'name', 'kind', 'gender', 'statsbomb_id'),
        knex('matches').select('id', 'league_id', 'home_team_id', 'away_team_id', 'kickoff_at', 'statsbomb_id'),
        knex('players').max('id as max').first(),
        knex('teams').max('id as max').first(),
        knex('leagues').max('id as max').first(),
        knex('matches').max('id as max').first()
    ]);

    let nextId = Math.max(
        RESERVED_ID_FLOOR,
        Number(playerMax.max) || 0,
        Number(teamMax.max) || 0,
        Number(leagueMax.max) || 0,
        Number(matchMax.max) || 0
    );

    const context = {
        nextId() {
            nextId += 1;

            return nextId;
        },
        playersBySb: new Map(),
        teamsBySb: new Map(),
        leaguesBySb: new Map(),
        matchesBySb: new Map(),
        playersByName: new Map(),
        playersByLast: new Map(),
        teamsByName: new Map(),
        leaguesByName: new Map(),
        matchesByKey: new Map(),
        skipped: [],
        created: { players: 0, teams: 0, leagues: 0, matches: 0 }
    };

    for (const row of players) {
        indexPerson(context, row);
    }

    for (const row of teams) {
        if (row.statsbomb_id != null) {
            context.teamsBySb.set(Number(row.statsbomb_id), row);
        }

        pushIndex(context.teamsByName, foldName(row.name), row);
    }

    for (const row of leagues) {
        if (row.statsbomb_id != null) {
            context.leaguesBySb.set(Number(row.statsbomb_id), row);
        }

        pushIndex(context.leaguesByName, foldName(row.name), row);
    }

    for (const row of matches) {
        indexMatch(context, row);
    }

    return context;
}

function indexPerson(context, row) {
    if (row.statsbomb_id != null) {
        context.playersBySb.set(Number(row.statsbomb_id), row);
    }

    const names = nameKeys(row.name, row.first_name, row.last_name);

    for (const key of names) {
        pushIndex(context.playersByName, key, row);
    }

    const last = foldName(row.last_name) || foldName(row.name).split(' ').filter(Boolean).pop();

    pushIndex(context.playersByLast, last, row);
}

function indexMatch(context, row) {
    if (row.statsbomb_id != null) {
        context.matchesBySb.set(Number(row.statsbomb_id), row);
    }

    context.matchesByKey.set(matchKey(row.league_id, row.home_team_id, row.away_team_id, row.kickoff_at), row);
}

function pushIndex(map, key, row) {
    if (!key) {
        return;
    }

    const list = map.get(key) || [];

    if (!list.some((item) => item.id === row.id)) {
        list.push(row);
    }

    map.set(key, list);
}

async function loadSeason(context, season) {
    const league = await resolveLeague(context, season);
    const now = new Date();
    const matchRows = [];
    const matchPatches = [];
    const playerRows = [];
    const teamRows = [];
    const seasonBuckets = new Map();
    const seasonYear = season.seasonYear || seasonStartYear(season.seasonName);

    await knex('competition_seasons').insert({
        league_id: league.id,
        year: seasonYear,
        coverage_xg: true,
        coverage_xg_faced: true,
        updated_at: now
    }).onConflict(['league_id', 'year']).merge(['coverage_xg', 'coverage_xg_faced', 'updated_at']);

    for (const match of season.matches || []) {
        const home = await resolveTeam(context, match.home, {
            national: season.competitionInternational,
            gender: season.competitionGender
        }, teamRows, now);
        const away = await resolveTeam(context, match.away, {
            national: season.competitionInternational,
            gender: season.competitionGender
        }, teamRows, now);
        const stored = await resolveMatch(context, {
            league,
            seasonYear,
            match,
            home,
            away,
            now
        }, matchRows, matchPatches);

        const seenInMatch = new Set();

        for (const person of match.players || []) {
            const player = await resolvePlayer(context, person, playerRows, now);

            if (!player) {
                continue;
            }

            const seenKey = `${stored.id}:${player.id}`;

            if (seenInMatch.has(seenKey)) {
                continue;
            }

            seenInMatch.add(seenKey);

            const onHome = person.statsbombTeamId === match.home.statsbombTeamId;
            const team = onHome || person.statsbombTeamId !== match.away.statsbombTeamId
                ? home
                : away;
            const stats = person.stats || {};
            const matchStat = {
                match_id: stored.id,
                team_id: team.id,
                player_id: player.id,
                minutes: stats.minutes || null,
                position: person.position || null,
                shots_total: stats.shots || null,
                shots_on: stats.shotsOn || null,
                goals: stats.goals || null,
                assists: stats.assists || null,
                saves: null,
                passes_key: stats.keyPasses || null,
                xg: stats.xg,
                npxg: stats.npxg,
                xa: stats.xa,
                xg_faced: stats.xgFaced,
                pressures: stats.pressures,
                carries: stats.carries,
                progressive_carries: stats.progressiveCarries,
                progressive_passes: stats.progressivePasses,
                passes_into_box: stats.passesIntoBox,
                updated_at: now
            };

            playerRows.push({ kind: 'matchStat', row: matchStat });
            addSeasonBucket(seasonBuckets, {
                playerId: player.id,
                teamId: team.id,
                leagueId: league.id,
                seasonYear,
                position: person.position,
                stats
            });
        }
    }

    const teamsToWrite = uniqueRows(teamRows, (row) => row.id);
    const matchesToWrite = uniqueRows(matchRows, (row) => row.id);
    const playersToWrite = uniqueRows(
        playerRows.filter((item) => item.kind === 'player').map((item) => item.row),
        (row) => row.id
    );
    const matchStats = uniqueRows(
        playerRows.filter((item) => item.kind === 'matchStat').map((item) => item.row),
        (row) => `${row.match_id}:${row.player_id}`
    );

    if (teamsToWrite.length) {
        await batchUpsert(knex, 'teams', teamsToWrite, ['id'], [
            'name', 'is_national', 'country_name', 'statsbomb_id', 'updated_at'
        ]);
    }

    if (playersToWrite.length) {
        await batchUpsert(knex, 'players', playersToWrite, ['id'], [
            'name', 'first_name', 'last_name', 'nationality', 'statsbomb_id', 'updated_at'
        ]);
    }

    if (matchesToWrite.length) {
        await batchUpsert(knex, 'matches', matchesToWrite, ['id'], [
            'league_id', 'season_year', 'kickoff_at', 'status_short', 'home_team_id', 'away_team_id',
            'home_goals', 'away_goals', 'statsbomb_id', 'has_events', 'has_lineups', 'has_player_stats',
            'updated_at'
        ]);
    }

    const patches = uniqueRows(matchPatches, (row) => row.id);

    for (const row of patches) {
        await knex('matches').where({ id: row.id }).update({
            statsbomb_id: row.statsbomb_id,
            has_events: true,
            has_lineups: true,
            has_player_stats: true,
            updated_at: row.updated_at
        });
    }

    if (matchStats.length) {
        await batchUpsert(knex, 'player_match_stats', matchStats, ['match_id', 'player_id'], [
            ...ADVANCED, 'updated_at'
        ]);
    }

    await upsertSeasonStats(seasonBuckets, now);
}

function addSeasonBucket(buckets, item) {
    const key = `${item.playerId}:${item.teamId}:${item.leagueId}:${item.seasonYear}`;
    const current = buckets.get(key) || {
        player_id: item.playerId,
        team_id: item.teamId,
        league_id: item.leagueId,
        season_year: item.seasonYear,
        position: item.position || null,
        appearances: 0,
        minutes: 0,
        shots_total: 0,
        shots_on: 0,
        goals: 0,
        assists: 0,
        passes_key: 0,
        xg: 0,
        npxg: 0,
        xa: 0,
        xg_faced: 0,
        pressures: 0,
        carries: 0,
        progressive_carries: 0,
        progressive_passes: 0,
        passes_into_box: 0
    };
    const stats = item.stats || {};

    current.appearances += 1;
    current.minutes += Number(stats.minutes) || 0;
    current.shots_total += Number(stats.shots) || 0;
    current.shots_on += Number(stats.shotsOn) || 0;
    current.goals += Number(stats.goals) || 0;
    current.assists += Number(stats.assists) || 0;
    current.passes_key += Number(stats.keyPasses) || 0;
    current.xg += Number(stats.xg) || 0;
    current.npxg += Number(stats.npxg) || 0;
    current.xa += Number(stats.xa) || 0;
    current.xg_faced += Number(stats.xgFaced) || 0;
    current.pressures += Number(stats.pressures) || 0;
    current.carries += Number(stats.carries) || 0;
    current.progressive_carries += Number(stats.progressiveCarries) || 0;
    current.progressive_passes += Number(stats.progressivePasses) || 0;
    current.passes_into_box += Number(stats.passesIntoBox) || 0;
    current.position = current.position || item.position || null;
    buckets.set(key, current);
}

async function upsertSeasonStats(buckets, now) {
    const rows = [...buckets.values()];

    if (!rows.length) {
        return;
    }

    const existing = [];

    for (let index = 0; index < rows.length; index += 200) {
        const chunk = rows.slice(index, index + 200);
        const found = await knex('player_season_stats')
            .whereIn(
                ['player_id', 'team_id', 'league_id', 'season_year'],
                chunk.map((row) => [row.player_id, row.team_id, row.league_id, row.season_year])
            )
            .select('player_id', 'team_id', 'league_id', 'season_year');

        existing.push(...found);
    }

    const have = new Set(existing.map((row) => (
        `${row.player_id}:${row.team_id}:${row.league_id}:${row.season_year}`
    )));
    const inserts = [];
    const patches = [];

    for (const row of rows) {
        const key = `${row.player_id}:${row.team_id}:${row.league_id}:${row.season_year}`;
        const advanced = {
            xg: round(row.xg, 3),
            npxg: round(row.npxg, 3),
            xa: round(row.xa, 3),
            xg_faced: round(row.xg_faced, 3),
            pressures: row.pressures,
            carries: row.carries,
            progressive_carries: row.progressive_carries,
            progressive_passes: row.progressive_passes,
            passes_into_box: row.passes_into_box,
            updated_at: now
        };

        if (have.has(key)) {
            patches.push({
                player_id: row.player_id,
                team_id: row.team_id,
                league_id: row.league_id,
                season_year: row.season_year,
                ...advanced
            });
        } else {
            inserts.push({
                ...row,
                ...advanced,
                source: 'statsbomb',
                coverage: 'sb',
                created_at: now
            });
        }
    }

    if (inserts.length) {
        await batchUpsert(
            knex,
            'player_season_stats',
            inserts,
            ['player_id', 'team_id', 'league_id', 'season_year'],
            ['minutes', 'appearances', 'position', 'shots_total', 'shots_on', 'goals', 'assists', 'passes_key',
                ...ADVANCED, 'source', 'coverage', 'updated_at']
        );
    }

    for (const row of patches) {
        await knex('player_season_stats')
            .where({
                player_id: row.player_id,
                team_id: row.team_id,
                league_id: row.league_id,
                season_year: row.season_year
            })
            .update({
                xg: row.xg,
                npxg: row.npxg,
                xa: row.xa,
                xg_faced: row.xg_faced,
                pressures: row.pressures,
                carries: row.carries,
                progressive_carries: row.progressive_carries,
                progressive_passes: row.progressive_passes,
                passes_into_box: row.passes_into_box,
                updated_at: row.updated_at
            });
    }
}

async function resolveLeague(context, season) {
    const found = context.leaguesBySb.get(Number(season.competitionId))
        || uniqueOrNull(context.leaguesByName.get(foldName(season.competitionName)));

    if (found) {
        if (found.statsbomb_id == null) {
            found.statsbomb_id = season.competitionId;
            await knex('leagues').where({ id: found.id }).update({
                statsbomb_id: season.competitionId,
                updated_at: new Date()
            });
            context.leaguesBySb.set(Number(season.competitionId), found);
        }

        return found;
    }

    const row = {
        id: context.nextId(),
        name: season.competitionName,
        statsbomb_id: season.competitionId,
        kind: season.competitionInternational ? 'international' : 'league',
        gender: season.competitionGender === 'female' ? 'women' : 'men',
        in_scope: true,
        created_at: new Date(),
        updated_at: new Date()
    };

    await knex('leagues').insert(row);
    context.created.leagues += 1;
    context.leaguesBySb.set(Number(season.competitionId), row);
    pushIndex(context.leaguesByName, foldName(row.name), row);

    return row;
}

async function resolveTeam(context, side, options, pending, now) {
    const sbId = Number(side.statsbombTeamId);
    const found = context.teamsBySb.get(sbId)
        || uniqueOrNull(context.teamsByName.get(foldName(side.name)));

    if (found) {
        if (found.statsbomb_id == null) {
            found.statsbomb_id = sbId;
            pending.push({
                id: found.id,
                name: found.name,
                is_national: found.is_national,
                country_name: found.country_name,
                statsbomb_id: sbId,
                updated_at: now
            });
            context.teamsBySb.set(sbId, found);
        }

        return found;
    }

    const row = {
        id: context.nextId(),
        name: side.name,
        is_national: Boolean(options.national),
        country_name: null,
        statsbomb_id: sbId,
        updated_at: now
    };

    pending.push(row);
    context.created.teams += 1;
    context.teamsBySb.set(sbId, row);
    pushIndex(context.teamsByName, foldName(row.name), row);

    return row;
}

async function resolveMatch(context, input, pending, patches) {
    const sbId = Number(input.match.statsbombMatchId);
    const kickoff = kickoffAt(input.match.matchDate, input.match.kickOff);
    const found = context.matchesBySb.get(sbId)
        || context.matchesByKey.get(matchKey(input.league.id, input.home.id, input.away.id, kickoff));

    if (found) {
        if (found.statsbomb_id == null) {
            found.statsbomb_id = sbId;
            patches.push({
                id: found.id,
                statsbomb_id: sbId,
                updated_at: input.now
            });
            context.matchesBySb.set(sbId, found);
        }

        return found;
    }

    if (input.seasonYear == null) {
        throw new Error(`Missing season_year for StatsBomb match ${sbId}`);
    }

    const row = {
        id: context.nextId(),
        league_id: input.league.id,
        season_year: input.seasonYear,
        kickoff_at: kickoff,
        status_short: 'FT',
        home_team_id: input.home.id,
        away_team_id: input.away.id,
        home_goals: input.match.homeScore,
        away_goals: input.match.awayScore,
        statsbomb_id: sbId,
        has_events: true,
        has_lineups: true,
        has_player_stats: true,
        updated_at: input.now
    };

    pending.push(row);
    context.created.matches += 1;
    indexMatch(context, row);

    return row;
}

async function resolvePlayer(context, person, pending, now) {
    const sbId = Number(person.statsbombPlayerId);
    const linked = context.playersBySb.get(sbId);

    if (linked) {
        return linked;
    }

    const matched = matchPlayer(context, person);

    if (matched === 'ambiguous') {
        context.skipped.push(`${person.name} (${person.country || '?'})`);

        return null;
    }

    if (matched) {
        matched.statsbomb_id = sbId;
        context.playersBySb.set(sbId, matched);
        pending.push({
            kind: 'player',
            row: {
                id: matched.id,
                name: matched.name,
                first_name: matched.first_name,
                last_name: matched.last_name,
                nationality: matched.nationality,
                statsbomb_id: sbId,
                updated_at: now
            }
        });

        return matched;
    }

    const parts = String(person.name || '').trim().split(/\s+/);
    const row = {
        id: context.nextId(),
        name: person.nickname || person.name || `Player ${sbId}`,
        first_name: parts[0] || null,
        last_name: parts.length > 1 ? parts[parts.length - 1] : null,
        nationality: person.country || null,
        statsbomb_id: sbId,
        updated_at: now
    };

    pending.push({ kind: 'player', row });
    context.created.players += 1;
    indexPerson(context, row);

    return row;
}

function matchPlayer(context, person) {
    const keys = nameKeys(person.name, null, null);

    if (person.nickname) {
        for (const key of nameKeys(person.nickname, null, null)) {
            keys.add(key);
        }
    }

    const hits = [];

    for (const key of keys) {
        for (const row of context.playersByName.get(key) || []) {
            if (!hits.some((item) => item.id === row.id)) {
                hits.push(row);
            }
        }
    }

    const country = foldName(person.country);

    if (hits.length === 1) {
        return hits[0];
    }

    if (hits.length > 1) {
        const narrowed = country
            ? hits.filter((row) => foldName(row.nationality) === country)
            : hits;

        if (narrowed.length === 1) {
            return narrowed[0];
        }

        return 'ambiguous';
    }

    const last = foldName(person.name).split(' ').filter(Boolean).pop();
    const lastHits = context.playersByLast.get(last) || [];

    if (lastHits.length === 1) {
        return lastHits[0];
    }

    if (lastHits.length > 1) {
        const narrowed = country
            ? lastHits.filter((row) => foldName(row.nationality) === country)
            : lastHits;

        if (narrowed.length === 1) {
            return narrowed[0];
        }

        return 'ambiguous';
    }

    return null;
}

function nameKeys(label, first, last) {
    const keys = new Set();
    const folded = foldName(label);
    const parts = folded.split(' ').filter(Boolean);

    if (folded) {
        keys.add(folded);
    }

    if (parts.length >= 2) {
        keys.add(`${parts[0]} ${parts[parts.length - 1]}`);
        keys.add(parts.slice(-2).join(' '));
    }

    const combo = foldName([first, last].filter(Boolean).join(' '));

    if (combo) {
        keys.add(combo);
    }

    if (parts.length >= 2 && parts[0][0]) {
        keys.add(`${parts[0][0]} ${parts[parts.length - 1]}`);
    }

    return keys;
}

function foldName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function uniqueOrNull(list) {
    if (!list || list.length !== 1) {
        return null;
    }

    return list[0];
}

function uniqueRows(rows, keyFn) {
    const seen = new Map();

    for (const row of rows) {
        seen.set(keyFn(row), row);
    }

    return [...seen.values()];
}

function kickoffAt(date, time) {
    if (!date) {
        return null;
    }

    const clock = time && /^\d{2}:\d{2}/.test(time) ? String(time).slice(0, 8) : '00:00:00';

    return new Date(`${date}T${clock}Z`);
}

function matchKey(leagueId, homeId, awayId, kickoff) {
    const day = kickoff ? new Date(kickoff).toISOString().slice(0, 10) : '';

    return `${leagueId}:${homeId}:${awayId}:${day}`;
}

function round(value, digits) {
    const factor = 10 ** digits;

    return Math.round((Number(value) || 0) * factor) / factor;
}

main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
});
