'use strict';

/**
 * Rate-limited probe of football-data.org v4.
 *
 * Free plan: 10 requests/minute. Header: X-Auth-Token.
 *
 *   npm run probe:football-data
 *   node scripts/probe-football-data.js --wide
 *   node scripts/probe-football-data.js --persons
 */

const path = require('path');
const { setTimeout: sleep } = require('timers/promises');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'https://api.football-data.org/v4';
const FREE_PER_MINUTE = 10;
const GAP_MS = 7500;
const BACKFILL_FROM = 2000;
const BACKFILL_TO = 2010;

const DEFAULT_CODES = ['PL', 'PD', 'SA', 'BL1', 'FL1', 'CL'];
const WIDE_CODES = [...DEFAULT_CODES, 'PPL', 'DED', 'FAC', 'ELC', 'EL', 'WC'];

const args = parseArgs(process.argv.slice(2));

const state = {
    used: 0,
    minuteRemaining: null,
    resetIn: null
};

async function main() {
    const token = process.env.FOOTBALL_DATA_KEY;

    if (!token) {
        throw new Error('FOOTBALL_DATA_KEY is missing from elo_backend/.env');
    }

    if (args.persons) {
        await probePersons();
        printQuota();
        return;
    }

    const codes = args.wide ? WIDE_CODES : DEFAULT_CODES;

    console.log('football-data.org v4 season probe');
    console.log(`Auth: X-Auth-Token (not logged). Pace: 1 call / ${GAP_MS / 1000}s (free is ${FREE_PER_MINUTE}/min)`);
    console.log(`Detail sample: ${codes.join(', ')}`);
    console.log(`Backfill window of interest: ${BACKFILL_FROM}–${BACKFILL_TO}`);
    console.log('');

    const catalog = await apiGet('/competitions');
    const competitions = catalog.competitions || [];

    console.log(`Authenticated catalog: ${catalog.count ?? competitions.length} competitions`);
    printCatalogSummary(competitions);

    const details = [];

    for (const code of codes) {
        const row = competitions.find((item) => item.code === code);

        if (!row) {
            console.log(`\n${code}: not in this token's catalog`);
            continue;
        }

        const detail = await apiGet(`/competitions/${code}`);
        const summary = summarizeSeasons(code, row.name, detail);
        details.push(summary);
        printSeasonSummary(summary);
    }

    console.log('\nDepth test: Premier League 2004 (matches + scorers)');
    const matches = await apiGet('/competitions/PL/matches?season=2004');
    printMatchDepth(matches);
    const scorers = await apiGet('/competitions/PL/scorers?season=2004');
    printScorerDepth(scorers);

    printVerdict(competitions, details, matches, scorers);
    printQuota();
}

async function probePersons() {
    console.log('football-data.org v4 person probe');
    console.log(`Auth: X-Auth-Token (not logged). Pace: 1 call / ${GAP_MS / 1000}s`);
    console.log('Docs: GET /persons/{id} and /persons/{id}/matches — no public list-all');
    console.log(`Backfill window of interest: ${BACKFILL_FROM}–${BACKFILL_TO}`);
    console.log('');

    console.log('GET /persons (list-all)');
    const listed = await apiGet('/persons');
    printHttpShape('  list', listed);

    console.log('\nGET /persons/44 (quickstart sample)');
    const person = await apiGet('/persons/44');
    printPerson(person);

    console.log('\nGET /persons/2019 (Buffon — active in 2000–2010)');
    const buffon = await apiGet('/persons/2019');
    printPerson(buffon);

    console.log('\nGET /persons/2019/matches (default = current season)');
    const current = await apiGet('/persons/2019/matches?limit=5');
    printPersonMatches('current', current);

    console.log('\nGET /persons/2019/matches?dateFrom=2004-08-01&dateTo=2005-07-31');
    const backfill = await apiGet('/persons/2019/matches?dateFrom=2004-08-01&dateTo=2005-07-31&limit=100');
    printPersonMatches('2004/05', backfill);

    console.log('\nPerson verdict');
    if (listed.errorCode || listed.message) {
        console.log(`  /persons is not a directory (${listed.errorCode || ''} ${listed.message}). IDs come from squads/scorers/lineups.`);
    } else {
        console.log(`  /persons returned ${listed.count ?? (listed.persons || []).length} rows.`);
    }

    if (backfill.errorCode || backfill.message) {
        console.log(`  2004/05 person matches are locked on this token: ${backfill.message || backfill.errorCode}`);
        console.log('  Same permission wall as /competitions/PL/matches?season=2004 — not a second door into history.');
    } else if (!(backfill.matches || []).length) {
        console.log('  Person matches accepted the 2004 date range but returned no fixtures.');
    } else {
        const first = (backfill.resultSet && backfill.resultSet.first) || '—';
        const last = (backfill.resultSet && backfill.resultSet.last) || '—';
        console.log(`  2004/05 person matches returned ${(backfill.matches || []).length} fixtures (${first}–${last}).`);
        console.log('  Grain is appearances + goals/assists/cards/minutes, not API-Football player-match stats.');
    }
}

function printHttpShape(label, payload) {
    if (payload.errorCode || payload.message) {
        console.log(`${label}: ${payload.errorCode || ''} ${payload.message}`);
        return;
    }

    const keys = Object.keys(payload).slice(0, 8).join(', ');
    console.log(`${label}: ok  keys=${keys}`);
}

function printPerson(payload) {
    if (payload.errorCode || payload.message) {
        console.log(`  ${payload.errorCode || ''} ${payload.message}`);
        return;
    }

    const team = payload.currentTeam && payload.currentTeam.name;
    console.log(`  id=${payload.id}  ${payload.name}  ${payload.position || '—'}  ${payload.nationality || '—'}  team=${team || '—'}`);
}

function printPersonMatches(label, payload) {
    if (payload.errorCode || payload.message) {
        console.log(`  ${label}: ${payload.errorCode || ''} ${payload.message}`);
        return;
    }

    const matches = payload.matches || [];
    const agg = payload.aggregations || {};
    const range = payload.resultSet || {};
    const permission = payload.filters && payload.filters.permission;

    console.log(`  ${label}: matches=${matches.length}  first=${range.first || '—'}  last=${range.last || '—'}  permission=${permission || '—'}`);
    console.log(`  aggregations: pitch=${agg.matchesOnPitch ?? '—'}  xi=${agg.startingXI ?? '—'}  mins=${agg.minutesPlayed ?? '—'}  goals=${agg.goals ?? '—'}  assists=${agg.assists ?? '—'}`);
}

function printCatalogSummary(competitions) {
    const byPlan = new Map();

    for (const item of competitions) {
        const plan = item.plan || 'UNKNOWN';
        const count = byPlan.get(plan) || 0;
        byPlan.set(plan, count + 1);
    }

    console.log('By plan:');
    for (const [plan, count] of [...byPlan.entries()].sort()) {
        console.log(`  ${plan}: ${count}`);
    }

    const deep = competitions
        .filter((item) => (item.numberOfAvailableSeasons || 0) >= 20)
        .sort((left, right) => right.numberOfAvailableSeasons - left.numberOfAvailableSeasons)
        .slice(0, 12);

    console.log('\nLongest catalogs (numberOfAvailableSeasons):');
    for (const item of deep) {
        console.log(`  ${item.code || '—'}  ${String(item.numberOfAvailableSeasons).padStart(3)}  ${item.name}`);
    }
}

function summarizeSeasons(code, name, detail) {
    const seasons = detail.seasons || [];
    const years = seasons
        .map((season) => Number(String(season.startDate || '').slice(0, 4)))
        .filter((year) => Number.isFinite(year))
        .sort((left, right) => left - right);
    const inWindow = years.filter((year) => year >= BACKFILL_FROM && year <= BACKFILL_TO);

    return {
        code,
        name,
        listed: seasons.length,
        first: years[0] || null,
        last: years[years.length - 1] || null,
        backfillYears: inWindow,
        missingBackfill: missingYears(inWindow)
    };
}

function missingYears(present) {
    const have = new Set(present);
    const missing = [];

    for (let year = BACKFILL_FROM; year <= BACKFILL_TO; year += 1) {
        if (!have.has(year)) {
            missing.push(year);
        }
    }

    return missing;
}

function printSeasonSummary(summary) {
    console.log(`\n${summary.code}  ${summary.name}`);
    console.log(`  seasons[]: ${summary.listed}   range: ${summary.first || '—'}–${summary.last || '—'}`);
    console.log(`  ${BACKFILL_FROM}–${BACKFILL_TO} present: ${summary.backfillYears.join(', ') || 'none'}`);

    if (summary.missingBackfill.length) {
        console.log(`  missing in window: ${summary.missingBackfill.join(', ')}`);
    }
}

function printMatchDepth(payload) {
    if (payload.errorCode || payload.message) {
        console.log(`  matches 2004: ${payload.errorCode || ''} ${payload.message}`);
        return;
    }

    const matches = payload.matches || [];
    const finished = matches.filter((match) => match.status === 'FINISHED').length;
    const withLineup = matches.filter((match) => (match.homeTeam?.lineup || []).length > 0).length;
    const withGoals = matches.filter((match) => (match.goals || []).length > 0).length;

    console.log(`  matches: ${matches.length}  finished: ${finished}  with lineup: ${withLineup}  with goals[]: ${withGoals}`);
}

function printScorerDepth(payload) {
    if (payload.errorCode || payload.message) {
        console.log(`  scorers 2004: ${payload.errorCode || ''} ${payload.message}`);
        return;
    }

    const scorers = payload.scorers || [];
    console.log(`  scorers: ${scorers.length}  (goals/assists leaders, not full squads)`);
}

function printVerdict(competitions, details, matches, scorers) {
    const tokenSees = competitions.length;
    const windowHits = details.filter((item) => item.backfillYears.length > 0);
    const matchCount = (matches.matches || []).length;
    const lineupCount = (matches.matches || []).filter((match) => (match.homeTeam?.lineup || []).length > 0).length;

    console.log('\nVerdict');
    console.log(`  This token sees ${tokenSees} competitions (free is usually ~12).`);
    console.log(`  Sample leagues with ${BACKFILL_FROM}–${BACKFILL_TO} in seasons[]: ${windowHits.map((item) => item.code).join(', ') || 'none'}`);

    if (matches.errorCode || matches.message) {
        console.log(`  PL 2004 matches are not available to this token: ${matches.message || matches.errorCode}`);
    } else if (matchCount === 0) {
        console.log('  PL 2004 seasons[] may exist, but matches are empty for this token.');
    } else if (lineupCount === 0) {
        console.log(`  PL 2004 has ${matchCount} matches but no lineups — results only, not Career Points grain.`);
    } else {
        console.log(`  PL 2004 has lineups on ${lineupCount}/${matchCount} matches — usable as a thin backfill.`);
    }

    if (!scorers.errorCode && (scorers.scorers || []).length) {
        console.log(`  PL 2004 scorers list is populated (${scorers.scorers.length}).`);
    }
}

function printQuota() {
    console.log('\nQuota');
    console.log(`  used this run: ${state.used}`);
    console.log(`  X-RequestsAvailable-Minute: ${state.minuteRemaining ?? '—'}`);
    console.log(`  X-RequestCounter-Reset: ${state.resetIn ?? '—'}s`);
}

async function apiGet(pathname) {
    await pace();

    const response = await fetch(`${BASE_URL}${pathname}`, {
        headers: {
            'X-Auth-Token': process.env.FOOTBALL_DATA_KEY
        }
    });

    state.used += 1;
    state.minuteRemaining = headerInt(response.headers, 'x-requestsavailable-minute');
    state.resetIn = headerInt(response.headers, 'x-requestcounter-reset');

    if (response.status === 429) {
        const wait = (state.resetIn || 60) * 1000;
        console.log(`  429 rate limited; waiting ${Math.ceil(wait / 1000)}s`);
        await sleep(wait);
        return apiGet(pathname);
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok && !body.message && !body.errorCode) {
        body.message = `HTTP ${response.status}`;
        body.errorCode = response.status;
    }

    return body;
}

async function pace() {
    if (state.minuteRemaining !== null && state.minuteRemaining <= 1 && state.resetIn) {
        console.log(`  minute quota low; waiting ${state.resetIn}s`);
        await sleep((state.resetIn + 1) * 1000);
    }

    await sleep(GAP_MS);
}

function headerInt(headers, name) {
    const raw = headers.get(name);

    if (raw == null || raw === '') {
        return null;
    }

    const value = Number(raw);

    return Number.isFinite(value) ? value : null;
}

function parseArgs(argv) {
    return {
        wide: argv.includes('--wide'),
        persons: argv.includes('--persons')
    };
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
