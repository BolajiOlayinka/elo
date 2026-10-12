'use strict';

/**
 * Map local API-Football JSON into Postgres.
 *
 *   node scripts/load-api-football.js --smoke
 *   node scripts/load-api-football.js --league 39 --season 2024
 *   node scripts/load-api-football.js --league 39 --season 2024 --live
 *   node scripts/load-api-football.js --all --live
 *
 * --live uses DATABASE_URL (Heroku). Default is local Docker.
 * Resume is on by default (skip seasons with _load_complete.*.json).
 * --all refuses to run until all 922 seasons are downloaded, unless --allow-partial.
 */

const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const knexLib = require('knex');
const knexConfig = require('../src/infra/database/knexfile');
const { parseIngestArgs } = require('./lib/cli');
const {
    listPlayerStatSeasons,
    loadCompletePath,
    seasonDir
} = require('./lib/coverage');
const { fileExists, readJson, writeJson } = require('./lib/json-store');
const { createProgress, describeDbTarget } = require('./lib/progress');
const { formatVerifyReport, verifyDownloadedSeasons } = require('./lib/verify-download');
const {
    coachesToRows,
    collectCoachesFromFiles,
    collectFromEvents,
    collectFromLineups,
    collectFromMatchPlayers,
    collectFromTeamStats,
    collectPlayersFromProfiles,
    mapMatches,
    mapStandings,
    mapTeams,
    mapVenues,
    playersToRows
} = require('./lib/map-season');
const { rawFile } = require('./lib/paths');
const { batchInsert, batchUpsert, uniqueBy } = require('./lib/upsert');

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

    if (args.live && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is missing (needed for --live)');
    }

    knex = knexLib(args.live ? knexConfig.production : knexConfig.development);

    if (args.smoke) {
        await loadCatalog(args);

        return;
    }

    if (args.all) {
        await loadAll(args);

        return;
    }

    if (args.league && args.season) {
        await loadCatalog(args);
        await loadSeason(args.league, args.season, args, null);

        return;
    }

    throw new Error('Use --smoke, --league <id> --season <year>, or --all. Add --live for Heroku.');
}

async function loadAll(args) {
    if (!args.allowPartial) {
        const report = await verifyDownloadedSeasons();

        console.log(formatVerifyReport(report));

        if (report.incomplete > 0 || report.total === 0) {
            throw new Error(
                'Refusing --all load until download is complete.'
                + ' Keep running npm run ingest:download:all (quota pause + resume).'
                + ' Pass --allow-partial only if you intentionally want a subset.'
            );
        }
    }

    await loadCatalog(args);

    const seasons = listPlayerStatSeasons(await readJson(rawFile('leagues.json')));
    const progress = createProgress({ mode: args.live ? 'load-all-live' : 'load-all-local', total: seasons.length });

    await progress.log(`Load ${seasons.length} seasons → ${describeDbTarget(args.live, knexConfig)}`);
    await progress.log(`Resume=${args.resume}. Log: ${progress.logFile}`);

    for (let index = 0; index < seasons.length; index += 1) {
        if (stopRequested) {
            await progress.log(`Stopped by user at ${index}/${seasons.length}. Re-run to resume.`);

            return;
        }

        const season = seasons[index];
        const label = `${season.leagueName} ${season.year} (${index + 1}/${seasons.length})`;
        const marker = loadCompletePath(season.leagueId, season.year, args.live);
        const teamsPath = path.join(seasonDir(season.leagueId, season.year), 'teams.json');

        progress.tick(index, seasons.length, label);
        await progress.snapshot({ current: { leagueId: season.leagueId, year: season.year, index: index + 1 } });

        if (args.resume && await fileExists(marker)) {
            progress.state.skipped += 1;
            continue;
        }

        if (!await fileExists(teamsPath)) {
            await progress.log(`[${index + 1}/${seasons.length}] skip ${season.leagueName} ${season.year} (not downloaded yet)`);
            progress.state.skipped += 1;
            continue;
        }

        await progress.log(`[${index + 1}/${seasons.length}] ${season.leagueName} league=${season.leagueId} year=${season.year}`);
        await loadSeason(season.leagueId, season.year, args, progress);
        await writeJson(marker, {
            leagueId: season.leagueId,
            year: season.year,
            live: args.live,
            finishedAt: new Date().toISOString()
        });
        progress.state.completed += 1;
        progress.tick(index + 1, seasons.length, label);
    }

    progress.clearBar();
    await progress.log(`Done. completed=${progress.state.completed} skipped=${progress.state.skipped}`);
}

async function loadCatalog(args) {
    console.log(`Load catalog → ${describeDbTarget(args.live, knexConfig)}`);

    const countriesPayload = await readJson(rawFile('countries.json'));
    const leaguesPayload = await readJson(rawFile('leagues.json'));
    const countryCount = await upsertCountries(countriesPayload.response || []);
    const { leagues, seasons } = await upsertLeagues(leaguesPayload.response || []);

    console.log(`Upserted countries=${countryCount} leagues=${leagues} seasons=${seasons}`);
}

async function loadSeason(leagueId, seasonYear, args, progress) {
    const seasonFolder = seasonDir(leagueId, seasonYear);
    const teamsPath = path.join(seasonFolder, 'teams.json');

    if (!await fileExists(teamsPath)) {
        throw new Error(`Missing ${teamsPath}. Run download with --league ${leagueId} --season ${seasonYear} first.`);
    }

    if (progress) {
        await progress.log(`Load season league=${leagueId} year=${seasonYear}`);
    } else {
        console.log(`Load season league=${leagueId} year=${seasonYear}`);
    }

    const countries = await knex('countries').select('id', 'name');
    const countryByName = new Map(countries.map((row) => [row.name, row.id]));
    const teamsPayload = await readJson(teamsPath);
    const fixturesPayload = await readJson(path.join(seasonFolder, 'fixtures.json'));
    const standingsPayload = await readJson(path.join(seasonFolder, 'standings.json'));
    const teamRows = teamsPayload.response || [];
    const fixtureRows = fixturesPayload.response || [];

    const venues = mapVenues(teamRows, fixtureRows, countryByName);
    const venueIds = new Set(venues.map((row) => row.id));
    const teams = mapTeams(teamRows, countryByName).map((row) => ({
        ...row,
        venue_id: row.venue_id && venueIds.has(row.venue_id) ? row.venue_id : null
    }));
    const matches = mapMatches(fixtureRows).map((row) => ({
        ...row,
        venue_id: row.venue_id && venueIds.has(row.venue_id) ? row.venue_id : null
    }));
    const knownTeamIds = new Set(teams.map((row) => row.id));

    for (const match of matches) {
        knownTeamIds.add(match.home_team_id);
        knownTeamIds.add(match.away_team_id);
    }

    await ensureStubTeams(matches, teams);

    await batchUpsert(knex, 'venues', venues, ['id'], [
        'name', 'address', 'city', 'country_id', 'capacity', 'surface', 'image_url', 'updated_at'
    ]);
    await batchUpsert(knex, 'teams', teams, ['id'], [
        'name', 'code', 'founded', 'is_national', 'logo_url', 'country_id', 'country_name', 'venue_id', 'updated_at'
    ]);

    const playerPages = await readPlayerPages(seasonFolder);
    const { players, seasonStats } = collectPlayersFromProfiles(playerPages, leagueId, seasonYear);
    const coachPayloads = await readCoachFiles(seasonFolder);
    const { coaches, tenures } = collectCoachesFromFiles(coachPayloads, knownTeamIds);

    const matchBundles = await loadMatchFiles(matches, players, coaches, progress, leagueId, seasonYear);
    const playerRows = playersToRows(players);
    const coachRows = coachesToRows(coaches).map((row) => ({
        ...row,
        current_team_id: row.current_team_id && knownTeamIds.has(row.current_team_id)
            ? row.current_team_id
            : null
    }));

    await batchUpsert(knex, 'players', playerRows, ['id'], [
        'name', 'first_name', 'last_name', 'age', 'birth_date', 'birth_place', 'birth_country',
        'nationality', 'height', 'weight', 'injured', 'photo_url', 'updated_at'
    ]);
    await batchUpsert(knex, 'coaches', coachRows, ['id'], [
        'name', 'first_name', 'last_name', 'age', 'birth_date', 'birth_place', 'birth_country',
        'nationality', 'height', 'weight', 'photo_url', 'current_team_id', 'updated_at'
    ]);
    await replaceTenures(coachRows.map((row) => row.id), tenures);
    await batchUpsert(knex, 'matches', matches, ['id'], [
        'league_id', 'season_year', 'round', 'venue_id', 'venue_name', 'venue_city', 'referee',
        'kickoff_at', 'kickoff_unix', 'timezone', 'status_short', 'status_long', 'elapsed_minutes',
        'home_team_id', 'away_team_id', 'home_goals', 'away_goals', 'home_goals_ht', 'away_goals_ht',
        'home_goals_et', 'away_goals_et', 'home_penalties', 'away_penalties', 'home_winner', 'updated_at'
    ]);

    const matchIds = matches.map((row) => row.id);

    await deleteMatchChildren(matchIds);
    await batchInsert(knex, 'match_events', matchBundles.events);
    await batchUpsert(knex, 'match_coaches', matchBundles.matchCoaches, ['match_id', 'team_id'], [
        'coach_id', 'formation', 'updated_at'
    ]);
    await batchInsert(knex, 'lineup_players', matchBundles.lineups);
    await batchUpsert(knex, 'player_match_stats', matchBundles.playerStats, ['match_id', 'player_id'], [
        'team_id', 'minutes', 'shirt_number', 'position', 'rating', 'captain', 'substitute', 'offsides',
        'shots_total', 'shots_on', 'goals', 'goals_conceded', 'assists', 'saves', 'passes_total', 'passes_key',
        'passes_accuracy', 'tackles_total', 'blocks', 'interceptions', 'duels_total', 'duels_won',
        'dribbles_attempts', 'dribbles_success', 'dribbles_past', 'fouls_drawn', 'fouls_committed',
        'yellow_cards', 'red_cards', 'penalties_won', 'penalties_committed', 'penalties_scored',
        'penalties_missed', 'penalties_saved', 'updated_at'
    ]);
    await batchUpsert(knex, 'match_team_stats', matchBundles.teamStats, ['match_id', 'team_id'], [
        'shots_on_goal', 'shots_off_goal', 'shots_total', 'shots_blocked', 'shots_inside_box',
        'shots_outside_box', 'fouls', 'corners', 'offsides', 'ball_possession', 'yellow_cards',
        'red_cards', 'goalkeeper_saves', 'passes_total', 'passes_accurate', 'passes_accuracy',
        'extras', 'updated_at'
    ]);
    await batchUpsert(
        knex,
        'player_season_stats',
        uniqueBy(
            seasonStats.filter((row) => knownTeamIds.has(row.team_id)),
            (row) => `${row.player_id}:${row.team_id}:${row.league_id}:${row.season_year}`
        ),
        ['player_id', 'team_id', 'league_id', 'season_year'],
        [
            'position', 'rating', 'captain', 'appearances', 'lineups', 'minutes', 'substitutes_in',
            'substitutes_out', 'bench', 'shots_total', 'shots_on', 'goals', 'goals_conceded', 'assists',
            'saves', 'passes_total', 'passes_key', 'passes_accuracy', 'tackles_total', 'blocks',
            'interceptions', 'duels_total', 'duels_won', 'dribbles_attempts', 'dribbles_success',
            'fouls_drawn', 'fouls_committed', 'yellow_cards', 'yellow_red_cards', 'red_cards',
            'penalties_scored', 'penalties_missed', 'penalties_saved', 'updated_at'
        ]
    );

    const standingRows = mapStandings(standingsPayload, leagueId, seasonYear);

    await batchUpsert(knex, 'standings', standingRows, ['league_id', 'season_year', 'team_id', 'group_name'], [
        'rank', 'points', 'goal_diff', 'form', 'status', 'description', 'played', 'wins', 'draws',
        'losses', 'goals_for', 'goals_against', 'home_played', 'home_wins', 'home_draws', 'home_losses',
        'home_goals_for', 'home_goals_against', 'away_played', 'away_wins', 'away_draws', 'away_losses',
        'away_goals_for', 'away_goals_against', 'updated_at'
    ]);

    const summary = `Loaded teams=${teams.length} venues=${venues.length} matches=${matches.length}`
        + ` players=${playerRows.length} coaches=${coachRows.length}`
        + ` player_match_stats=${matchBundles.playerStats.length}`
        + ` season_stats=${seasonStats.length} standings=${standingRows.length}`;

    if (progress) {
        await progress.log(summary);
    } else {
        console.log(summary);
    }

    await writeJson(loadCompletePath(leagueId, seasonYear, args.live), {
        leagueId,
        year: seasonYear,
        live: Boolean(args.live),
        matches: matches.length,
        finishedAt: new Date().toISOString()
    });
}

async function ensureStubTeams(matches, teams) {
    const known = new Set(teams.map((row) => row.id));
    const now = new Date();

    for (const match of matches) {
        addStubTeam(teams, known, match.home_team_id, now);
        addStubTeam(teams, known, match.away_team_id, now);
    }
}

function addStubTeam(teams, known, teamId, now) {
    if (!teamId || known.has(teamId)) {
        return;
    }

    known.add(teamId);
    teams.push({
        id: teamId,
        name: `Team ${teamId}`,
        code: null,
        founded: null,
        is_national: false,
        logo_url: null,
        country_id: null,
        country_name: null,
        venue_id: null,
        updated_at: now
    });
}

async function readPlayerPages(folder) {
    const dir = path.join(folder, 'players');

    if (!await fileExists(dir)) {
        return [];
    }

    const names = await fs.readdir(dir);
    const pages = [];

    for (const fileName of names.filter((entry) => entry.endsWith('.json')).sort()) {
        pages.push(await readJson(path.join(dir, fileName)));
    }

    return pages;
}

async function readCoachFiles(folder) {
    const dir = path.join(folder, 'coaches');

    if (!await fileExists(dir)) {
        return [];
    }

    const names = await fs.readdir(dir);
    const payloads = [];

    for (const fileName of names.filter((entry) => entry.endsWith('.json'))) {
        payloads.push(await readJson(path.join(dir, fileName)));
    }

    return payloads;
}

async function loadMatchFiles(matches, players, coaches, progress, leagueId, seasonYear) {
    const events = [];
    const lineups = [];
    const matchCoaches = [];
    const playerStats = [];
    const teamStats = [];
    const total = matches.length;

    for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];

        if (progress) {
            progress.tick(index + 1, total, `parse matches ${leagueId}/${seasonYear}`);
        }
        const dir = rawFile('fixtures', String(match.id));
        const eventsPayload = await readJson(path.join(dir, 'events.json'));
        const lineupsPayload = await readJson(path.join(dir, 'lineups.json'));
        const statsPayload = await readJson(path.join(dir, 'statistics.json'));
        const playersPayload = await readJson(path.join(dir, 'players.json'));
        const lineupBundle = collectFromLineups(lineupsPayload, match.id, players, coaches);

        events.push(...collectFromEvents(eventsPayload, match.id, players));
        lineups.push(...lineupBundle.lineupRows);
        matchCoaches.push(...lineupBundle.coachRows);
        playerStats.push(...collectFromMatchPlayers(playersPayload, match.id, players));
        teamStats.push(...collectFromTeamStats(statsPayload, match.id));
    }

    return {
        events,
        lineups,
        matchCoaches: uniqueBy(matchCoaches, (row) => `${row.match_id}:${row.team_id}`),
        playerStats: uniqueBy(
            playerStats.filter((row) => row.team_id && row.player_id),
            (row) => `${row.match_id}:${row.player_id}`
        ),
        teamStats: uniqueBy(
            teamStats.filter((row) => row.team_id),
            (row) => `${row.match_id}:${row.team_id}`
        )
    };
}

async function deleteMatchChildren(matchIds) {
    if (matchIds.length === 0) {
        return;
    }

    await knex('match_events').whereIn('match_id', matchIds).del();
    await knex('lineup_players').whereIn('match_id', matchIds).del();
}

async function replaceTenures(coachIds, tenures) {
    if (coachIds.length > 0) {
        await knex('coach_tenures').whereIn('coach_id', uniqueBy(coachIds, (id) => id)).del();
    }

    await batchInsert(knex, 'coach_tenures', tenures);
}

async function upsertCountries(rows) {
    const now = new Date();
    const payload = uniqueBy(
        rows
            .filter((row) => row && row.name)
            .map((row) => ({
                name: row.name,
                code: row.code || null,
                flag_url: row.flag || null,
                updated_at: now
            })),
        (row) => row.name
    );

    await batchUpsert(knex, 'countries', payload, ['name'], ['code', 'flag_url', 'updated_at']);

    return payload.length;
}

async function upsertLeagues(rows) {
    const countries = await knex('countries').select('id', 'name');
    const countryByName = new Map(countries.map((row) => [row.name, row.id]));
    const now = new Date();
    const leagues = [];
    const seasons = [];

    for (const row of rows) {
        const league = row.league || {};
        const country = row.country || {};

        if (!league.id) {
            continue;
        }

        leagues.push({
            id: league.id,
            name: league.name,
            type: league.type || null,
            logo_url: league.logo || null,
            country_id: country.name ? countryByName.get(country.name) || null : null,
            updated_at: now
        });

        pushSeasons(seasons, league.id, row.seasons || [], now);
    }

    const uniqueLeagues = uniqueBy(leagues, (row) => row.id);
    const uniqueSeasons = uniqueBy(seasons, (row) => `${row.league_id}:${row.year}`);

    await batchUpsert(knex, 'leagues', uniqueLeagues, ['id'], [
        'name', 'type', 'logo_url', 'country_id', 'updated_at'
    ]);
    await batchUpsert(knex, 'competition_seasons', uniqueSeasons, ['league_id', 'year'], [
        'start_date', 'end_date', 'is_current', 'coverage_events', 'coverage_lineups',
        'coverage_fixture_stats', 'coverage_player_match_stats', 'coverage_standings',
        'coverage_players', 'coverage_top_scorers', 'coverage_top_assists', 'coverage_injuries',
        'updated_at'
    ]);

    return { leagues: uniqueLeagues.length, seasons: uniqueSeasons.length };
}

function pushSeasons(seasons, leagueId, seasonRows, now) {
    for (const season of seasonRows) {
        if (season.year == null) {
            continue;
        }

        const coverage = season.coverage || {};
        const fixtures = coverage.fixtures || {};

        seasons.push({
            league_id: leagueId,
            year: season.year,
            start_date: season.start || null,
            end_date: season.end || null,
            is_current: Boolean(season.current),
            coverage_events: Boolean(fixtures.events),
            coverage_lineups: Boolean(fixtures.lineups),
            coverage_fixture_stats: Boolean(fixtures.statistics_fixtures),
            coverage_player_match_stats: Boolean(fixtures.statistics_players),
            coverage_standings: Boolean(coverage.standings),
            coverage_players: Boolean(coverage.players),
            coverage_top_scorers: Boolean(coverage.top_scorers),
            coverage_top_assists: Boolean(coverage.top_assists),
            coverage_injuries: Boolean(coverage.injuries),
            updated_at: now
        });
    }
}

main()
    .catch((err) => {
        console.error(err.message || err);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (knex) {
            await knex.destroy();
        }
    });
