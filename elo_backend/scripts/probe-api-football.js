'use strict';

/**
 * Low-quota probe of API-Football coverage.
 *
 * Free plan: 100 requests/day and 10/minute. Default run uses ~15 calls.
 *
 *   npm run probe:api-football
 *   node scripts/probe-api-football.js --max-requests=20
 *   node scripts/probe-api-football.js --wide   # Big 5 + UCL (~27 calls)
 */

const path = require('path');
const { setTimeout: sleep } = require('timers/promises');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'https://v3.football.api-sports.io';
const PLAYERS_PER_PAGE = 20;
const FREE_PLAN_PER_MINUTE = 10;
const MIN_DAILY_REMAINING = 2;

const DEFAULT_SAMPLE = [
    { id: 39, name: 'Premier League' },
    { id: 140, name: 'La Liga' },
    { id: 2, name: 'UEFA Champions League' }
];

const WIDE_SAMPLE = [
    ...DEFAULT_SAMPLE,
    { id: 78, name: 'Bundesliga' },
    { id: 135, name: 'Serie A' },
    { id: 61, name: 'Ligue 1' }
];

const args = parseArgs(process.argv.slice(2));

const state = {
    used: 0,
    maxRequests: args.maxRequests,
    dailyRemaining: null,
    dailyLimit: null,
    minuteRemaining: null,
    lastCallAt: 0
};

async function main() {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
        throw new Error('API_FOOTBALL_KEY is missing from elo_backend/.env');
    }

    const sampleLeagues = args.wide ? WIDE_SAMPLE : DEFAULT_SAMPLE;

    console.log('API-Football coverage probe');
    console.log(`Budget: ${state.maxRequests} requests (free plan is 100/day, 10/min)`);
    console.log(`Sample leagues: ${sampleLeagues.map((league) => league.name).join(', ')}`);
    console.log('');

    const countries = await apiGet('/countries');
    const seasonYears = await apiGet('/leagues/seasons');
    const leaguesPayload = await apiGet('/leagues');

    const catalog = summarizeCatalog(leaguesPayload.response || [], {
        countries: countries.results,
        seasonYears: seasonYears.response || []
    });

    printCatalog(catalog);

    const samples = [];

    for (const league of sampleLeagues) {
        const sample = await probeLeague(league, catalog.leaguesById);
        samples.push(sample);
        printLeagueSample(sample);
    }

    printVerdict(catalog, samples);
    printQuota();
}

function parseArgs(argv) {
    let maxRequests = 20;
    let wide = false;

    for (const arg of argv) {
        if (arg === '--wide') {
            wide = true;
            maxRequests = 30;
        } else if (arg.startsWith('--max-requests=')) {
            maxRequests = Number(arg.split('=')[1]);
        }
    }

    if (!Number.isFinite(maxRequests) || maxRequests < 3) {
        throw new Error('--max-requests must be a number >= 3');
    }

    return { maxRequests, wide };
}

async function apiGet(pathname, params = {}) {
    guardBudget();

    const url = new URL(pathname, BASE_URL);

    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    }

    await throttle();

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'x-apisports-key': process.env.API_FOOTBALL_KEY
        }
    });

    captureRateLimits(response.headers);
    state.used += 1;
    state.lastCallAt = Date.now();

    const body = await response.json();
    const apiErrors = body.errors;

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${pathname}: ${JSON.stringify(apiErrors || body)}`);
    }

    if (apiErrors && !Array.isArray(apiErrors) && Object.keys(apiErrors).length > 0) {
        throw new Error(`${pathname} error: ${JSON.stringify(apiErrors)}`);
    }

    if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        throw new Error(`${pathname} error: ${JSON.stringify(apiErrors)}`);
    }

    console.log(
        `  [${state.used}/${state.maxRequests}] GET ${url.pathname}${url.search}`
        + `  daily left=${state.dailyRemaining ?? '?'}  minute left=${state.minuteRemaining ?? '?'}`
    );

    return body;
}

function guardBudget() {
    if (state.used >= state.maxRequests) {
        throw new Error(`Stopped: local budget of ${state.maxRequests} requests reached`);
    }

    if (state.dailyRemaining !== null && state.dailyRemaining <= MIN_DAILY_REMAINING) {
        throw new Error(`Stopped: only ${state.dailyRemaining} daily requests left`);
    }
}

async function throttle() {
    const minGapMs = state.dailyLimit && state.dailyLimit <= 100
        ? Math.ceil(60_000 / FREE_PLAN_PER_MINUTE) + 200
        : 250;

    const elapsed = Date.now() - state.lastCallAt;

    if (state.lastCallAt && elapsed < minGapMs) {
        await sleep(minGapMs - elapsed);
    }

    if (state.minuteRemaining !== null && state.minuteRemaining <= 1) {
        console.log('  minute rate limit low; waiting 15s');
        await sleep(15_000);
    }
}

function captureRateLimits(headers) {
    state.dailyLimit = parseHeader(headers, 'x-ratelimit-requests-limit') ?? state.dailyLimit;
    state.dailyRemaining = parseHeader(headers, 'x-ratelimit-requests-remaining') ?? state.dailyRemaining;
    state.minuteRemaining = parseHeader(headers, 'x-ratelimit-remaining')
        ?? parseHeader(headers, 'X-Ratelimit-Remaining')
        ?? state.minuteRemaining;
}

function parseHeader(headers, headerName) {
    const raw = headers.get(headerName);

    if (raw === null) {
        return null;
    }

    const parsed = Number(raw);

    return Number.isFinite(parsed) ? parsed : null;
}

function summarizeCatalog(leagues, extras) {
    const leaguesById = new Map();
    const countryNames = new Set();
    const years = new Set(extras.seasonYears);
    const types = { League: 0, Cup: 0, other: 0 };
    const coverage = {
        events: 0,
        lineups: 0,
        statistics_fixtures: 0,
        statistics_players: 0,
        standings: 0,
        players: 0,
        trophiesHint: 0
    };
    let seasonRows = 0;
    let currentSeasons = 0;

    for (const row of leagues) {
        const league = row.league || {};
        const country = row.country || {};
        const seasons = row.seasons || [];

        leaguesById.set(league.id, row);

        if (country.name) {
            countryNames.add(country.name);
        }

        if (league.type === 'League') {
            types.League += 1;
        } else if (league.type === 'Cup') {
            types.Cup += 1;
        } else {
            types.other += 1;
        }

        for (const season of seasons) {
            seasonRows += 1;

            if (season.year) {
                years.add(season.year);
            }

            if (season.current) {
                currentSeasons += 1;
            }

            const flags = season.coverage || {};
            const fixtures = flags.fixtures || {};

            if (fixtures.events) coverage.events += 1;
            if (fixtures.lineups) coverage.lineups += 1;
            if (fixtures.statistics_fixtures) coverage.statistics_fixtures += 1;
            if (fixtures.statistics_players) coverage.statistics_players += 1;
            if (flags.standings) coverage.standings += 1;
            if (flags.players) coverage.players += 1;
        }
    }

    const sortedYears = [...years].sort((a, b) => a - b);

    return {
        leagueCount: leagues.length,
        types,
        countryCount: extras.countries || countryNames.size,
        seasonRows,
        currentSeasons,
        yearMin: sortedYears[0] || null,
        yearMax: sortedYears[sortedYears.length - 1] || null,
        coverage,
        leaguesById
    };
}

function printCatalog(catalog) {
    console.log('');
    console.log('Catalog (from /leagues, /leagues/seasons, /countries)');
    console.log(`  Leagues/cups:          ${catalog.leagueCount}`);
    console.log(`    leagues:             ${catalog.types.League}`);
    console.log(`    cups:                ${catalog.types.Cup}`);
    console.log(`  Countries:             ${catalog.countryCount}`);
    console.log(`  League-season rows:    ${catalog.seasonRows}`);
    console.log(`  Currently running:     ${catalog.currentSeasons}`);
    console.log(`  Season years in API:   ${catalog.yearMin}–${catalog.yearMax}`);
    console.log('  Coverage flags across league-seasons:');
    console.log(`    player season stats: ${catalog.coverage.players}`);
    console.log(`    player match stats:  ${catalog.coverage.statistics_players}`);
    console.log(`    events (goals etc):  ${catalog.coverage.events}`);
    console.log(`    lineups (coaches):   ${catalog.coverage.lineups}`);
    console.log(`    team match stats:    ${catalog.coverage.statistics_fixtures}`);
    console.log(`    standings:           ${catalog.coverage.standings}`);

    if (state.dailyLimit !== null && state.dailyLimit <= 100) {
        console.log('  Free plan note:        team/player/fixture calls are limited to seasons 2022–2024.');
    }
}

async function probeLeague(sample, leaguesById) {
    const catalogRow = leaguesById.get(sample.id);
    const seasons = catalogRow?.seasons || [];
    const seasonYears = seasons.map((season) => season.year).filter(Boolean).sort((a, b) => a - b);
    const seasonYear = pickSeasonYear(seasons);
    const seasonRow = seasons.find((season) => season.year === seasonYear) || null;
    const result = {
        id: sample.id,
        name: catalogRow?.league?.name || sample.name,
        seasonYear,
        seasonCount: seasonYears.length,
        seasonMin: seasonYears[0] || null,
        seasonMax: seasonYears[seasonYears.length - 1] || null,
        coverage: seasonRow?.coverage || null,
        teams: null,
        nationalTeams: null,
        playerEstimate: null,
        playerPages: null,
        fixtures: null,
        coachesOnSampleClub: null,
        sampleClub: null,
        note: null
    };

    if (!catalogRow) {
        result.note = 'League id not present in /leagues response (free-plan season filter?)';

        return result;
    }

    if (!seasonYear) {
        result.note = 'No season year on this league';

        return result;
    }

    try {
        const teamsBody = await apiGet('/teams', { league: sample.id, season: seasonYear });
        const teams = teamsBody.response || [];
        result.teams = teams.length;
        result.nationalTeams = teams.filter((row) => row.team?.national).length;

        const club = teams.find((row) => row.team && !row.team.national) || teams[0];

        const playersBody = await apiGet('/players', { league: sample.id, season: seasonYear, page: 1 });
        const pages = playersBody.paging?.total || 0;
        result.playerPages = pages;
        result.playerEstimate = pages * PLAYERS_PER_PAGE;

        const fixturesBody = await apiGet('/fixtures', { league: sample.id, season: seasonYear });
        result.fixtures = fixturesBody.results ?? (fixturesBody.response || []).length;

        if (club?.team?.id) {
            result.sampleClub = club.team.name;
            const coachesBody = await apiGet('/coachs', { team: club.team.id });
            result.coachesOnSampleClub = coachesBody.results ?? (coachesBody.response || []).length;
        }
    } catch (err) {
        result.note = err.message;
    }

    return result;
}

function pickSeasonYear(seasons) {
    const years = seasons.map((season) => season.year).filter(Boolean).sort((a, b) => a - b);
    const current = seasons.find((season) => season.current);
    const freePlan = state.dailyLimit !== null && state.dailyLimit <= 100;

    if (freePlan) {
        const allowed = years.filter((year) => year >= 2022 && year <= 2024);

        return allowed[allowed.length - 1] || 2024;
    }

    return current?.year || years[years.length - 1] || null;
}

function printLeagueSample(sample) {
    console.log('');
    console.log(`${sample.name} (id ${sample.id})`);

    if (sample.note) {
        console.log(`  ${sample.note}`);

        return;
    }

    console.log(`  History in catalog:    ${sample.seasonMin}–${sample.seasonMax} (${sample.seasonCount} seasons)`);
    console.log(`  Probed season:         ${sample.seasonYear}`);
    console.log(`  Teams:                 ${sample.teams} (${sample.nationalTeams} national)`);
    console.log(`  Players (estimate):    up to ${sample.playerEstimate} (${sample.playerPages} pages × ${PLAYERS_PER_PAGE})`);
    console.log(`  Fixtures this season:  ${sample.fixtures}`);
    console.log(`  Coaches on ${sample.sampleClub}: ${sample.coachesOnSampleClub}`);
    console.log(`  Current coverage:      ${formatCoverage(sample.coverage)}`);
}

function formatCoverage(coverage) {
    if (!coverage) {
        return 'n/a';
    }

    const fixtures = coverage.fixtures || {};
    const flags = [
        coverage.players ? 'players' : null,
        fixtures.statistics_players ? 'player-match-stats' : null,
        fixtures.events ? 'events' : null,
        fixtures.lineups ? 'lineups' : null,
        coverage.standings ? 'standings' : null
    ].filter(Boolean);

    return flags.length ? flags.join(', ') : 'none';
}

function printVerdict(catalog, samples) {
    const usable = samples.filter((sample) => sample.playerEstimate > 0 && sample.fixtures > 0);
    const withCoaches = samples.filter((sample) => sample.coachesOnSampleClub > 0);

    console.log('');
    console.log('What this means');
    console.log(`  League catalog is ${catalog.leagueCount >= 200 ? 'large enough' : 'thin'} (${catalog.leagueCount} competitions).`);
    console.log(
        `  History starts around ${catalog.yearMin} — not pre-2000 legend coverage.`
    );
    console.log(
        `  Player-match-stats exist on ${catalog.coverage.statistics_players} league-seasons; that is the Elo input.`
    );
    console.log(
        `  Sampled competitions with players+fixtures: ${usable.length}/${samples.length}.`
    );
    console.log(
        `  Sampled clubs that returned a coach: ${withCoaches.length}/${samples.length}.`
    );
    console.log('  There is no global /players or /coachs count. Player totals are page estimates;');
    console.log('  coach totals require one /coachs?team= call per club (not done here).');
    console.log('  Free plan also limits how far back seasons go; paid plans unlock more history.');
}

function printQuota() {
    console.log('');
    console.log(`Requests used this run: ${state.used}`);
    console.log(`Daily remaining:        ${state.dailyRemaining ?? 'unknown'} / ${state.dailyLimit ?? 'unknown'}`);
}

main().catch((error) => {
    console.error(error.message || error);
    printQuota();
    process.exitCode = 1;
});
