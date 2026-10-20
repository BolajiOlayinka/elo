'use strict';

/**
 * Fill club seasons that API-Football does not have.
 *
 * For each existing player, read the English Wikipedia career table and a
 * second page. Portuguese is the second page when it has a club table.
 * Otherwise the page in the player's national language is used, and a model
 * reads that table when its columns are not the Portuguese shape. A row is
 * inserted when both tables agree on goals for that club, competition, and
 * year. Appearances may differ; the English count is kept.
 * Cups, other club games, and senior national-team years are included.
 * A competition already stored for that player is left untouched, including
 * every API-Football row from 2015 onward. A national-team year that is only
 * partly stored is topped up to the agreed total. A year already at or above
 * that total is left as stored.
 *
 * Does not call API-Football and does not run ingest:download / ingest:load.
 * Reuses players.id, teams.id, and leagues.id. A team or competition id is
 * created only when that name is not already in the database, from 1000000000
 * upward so it cannot collide with an API-Football id.
 *
 *   node scripts/backfill-career-seasons.js --smoke --dry-run
 *   node scripts/backfill-career-seasons.js --player 874
 *   node scripts/backfill-career-seasons.js --player 874 --fbref ./ronaldo.html
 *   node scripts/backfill-career-seasons.js --all --limit 25
 *   node scripts/backfill-career-seasons.js --all --live
 *   node scripts/backfill-career-seasons.js --all --live --from 1173
 *   node scripts/backfill-career-seasons.js --all --live --before 1173
 *
 * --fbref is a page saved locally. FBref blocks a bulk crawl, so this script
 * never fetches it. When the file is passed, a row must match that file too.
 * --all walks players born before 1997. --from starts at that id.
 * --before stops before that id. --limit stops after that many players.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const knexLib = require('knex');
const knexConfig = require('../src/infra/database/knexfile');
const {
    RESERVED_ID_FLOOR,
    parseClubTable,
    agreeSeasons,
    parseInternational,
    agreeInternationals,
    parseFbref,
    confirmFbref,
    clubKey,
    competitionKey
} = require('./lib/wikipedia-career');
const { wikiLang } = require('./lib/wiki-lang');

const SMOKE_IDS = [874, 154];
const SKIP_LOG = path.resolve(__dirname, '../data/career-backfill-skips.log');
const PT_FIELDS = [
    'leagueApps', 'leagueGoals', 'leagueAssists',
    'cupApps', 'cupGoals', 'cupAssists',
    'continentalApps', 'continentalGoals', 'continentalAssists',
    'otherApps', 'otherGoals', 'otherAssists'
];
const USER_AGENT = process.env.WIKIDATA_USER_AGENT || 'elo-points/0.1 (career backfill)';

let knex = null;

async function main() {
    const args = parseArgs(process.argv);

    if (args.live && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is missing (needed for --live)');
    }

    knex = knexLib(args.live ? knexConfig.production : knexConfig.development);

    try {
        await assertColumns();
        fs.mkdirSync(path.dirname(SKIP_LOG), { recursive: true });
        const players = await loadPlayers(args);

        if (players.length === 0) {
            console.log('No players matched.');

            return;
        }

        console.log(`Starting at player ${players[0].id} ${players[0].name} (${players.length} players)`);
        const teams = indexBy(
            await knex('teams').select('id', 'name', 'country_id', 'is_national'),
            (row) => clubKey(row.name)
        );
        const leagues = indexBy(
            await knex('leagues').select('id', 'name', 'country_id'),
            (row) => competitionKey(row.name)
        );
        const ids = await idAllocator();
        const fbrefRows = args.fbref ? parseFbref(fs.readFileSync(args.fbref, 'utf8')) : null;
        let inserted = 0;
        let skipped = 0;

        for (const player of players) {
            try {
                const result = await backfillPlayer(player, {
                    args,
                    teams,
                    leagues,
                    ids,
                    fbrefRows
                });

                inserted += result.inserted;
                skipped += result.skipped;
            } catch (error) {
                const resume = resumeCommand(args, player.id);

                throw new Error(`Stopped at player ${player.id} ${player.name}: ${error.message}. Resume with ${resume}`);
            }

            await sleep(players.length > 2 ? 1000 : 200);
        }

        console.log(`Done. players=${players.length} inserted=${inserted} skipped=${skipped} dryRun=${args.dryRun}`);
    } finally {
        await knex.destroy();
    }
}

async function backfillPlayer(player, context) {
    const title = await findTitle(player);

    if (!title) {
        return skipPlayer(player, 'no English career page');
    }

    const second = await secondSource(title, player);

    if (!second.chosen) {
        const detail = second.tried.map((page) => `  ${page.lang}: ${sectionLabels(page.list)}`).join('\n');

        return skipPlayer(player, `career table not found on ${title}`, detail);
    }

    console.log(`${player.name}: ${title} / ${second.chosen.lang}:${second.chosen.title}`);

    const enSections = await sections('en', title);
    const enSection = findClubSection(enSections);

    if (!enSection) {
        return skipPlayer(player, `career table not found on ${title}`, `  en: ${sectionLabels(enSections)}`);
    }

    const enText = await sectionText('en', title, enSection.index);
    const enClub = parseClubTable(enText, 'en');
    const secondClub = await readClubRows(second.chosen, enClub);
    const enIntl = findIntlSection(enSections);
    const intlRows = enIntl && second.chosen.intl
        ? agreeInternationals(
            parseInternational(await sectionText('en', title, enIntl.index), 'en'),
            await readIntlRows(second.chosen)
        )
        : [];
    let clubRows = agreeSeasons(enClub, secondClub);

    if (context.fbrefRows) {
        const before = clubRows.length;

        clubRows = confirmFbref(clubRows, context.fbrefRows);
        console.log(`${player.name}: FBref kept ${clubRows.length} of ${before}`);
    }

    const agreed = clubRows.concat(intlRows);
    const enUrl = wikiUrl('en', title);
    const ptUrl = wikiUrl(second.chosen.lang, second.chosen.title);
    const storedRows = await knex('player_season_stats as s')
        .join('teams as t', 't.id', 's.team_id')
        .where('s.player_id', player.id)
        .select('s.team_id', 's.league_id', 's.season_year', 's.goals', 't.is_national');
    const storedGoals = await knex('player_season_stats')
        .where({ player_id: player.id })
        .sum('goals as goals')
        .first();
    const storedKeys = new Set(storedRows.map((row) => `${row.team_id}:${row.league_id}:${row.season_year}`));

    context.usedTeamIds = new Set(storedRows.map((row) => row.team_id));
    let inserted = 0;
    let addedGoals = 0;

    for (const row of agreed) {
        row.club = String(row.club || '').replace(/\s*\((?:on )?loan\)/gi, '').trim();

        if (/^jong\b/i.test(row.club) || /(?:\s+[BC]|\s+II|\s+U-?\d{2}|reserves?|youth)$/i.test(row.club)) {
            continue;
        }

        const team = await ensureNamed(
            context,
            'teams',
            row.club,
            clubKey,
            context.teams,
            null,
            { national: Boolean(row.international) }
        );

        if (!team) {
            console.log(`  skip ${row.year} ${row.club}: more than one team has that name`);
            continue;
        }

        const league = await ensureNamed(context, 'leagues', row.competition, competitionKey, context.leagues, team);

        if (!league) {
            console.log(`  skip ${row.year} ${row.competition}: more than one league has that name`);
            continue;
        }

        const key = `${team.id}:${league.id}:${row.year}`;
        const recordGoals = nationalRemainder(storedRows, team.id, row);

        if (row.international && recordGoals == null) {
            console.log(`  keep ${row.year} ${team.name} (national year already stored)`);
            continue;
        }

        if (storedKeys.has(key)) {
            console.log(`  keep ${row.year} ${row.competition} (already stored)`);
            continue;
        }

        const record = {
            player_id: player.id,
            team_id: team.id,
            league_id: league.id,
            season_year: row.year,
            appearances: recordGoals === row.goals ? row.appearances : null,
            goals: recordGoals,
            assists: recordGoals === row.goals ? row.assists : null,
            source: 'wikipedia',
            source_url: enUrl,
            source_url_alt: ptUrl,
            coverage: 'basic',
            updated_at: new Date()
        };
        const note = row.keptEnglish ? ' kept English count' : '';
        const summary = `${row.year} ${team.name} / ${league.name} ${record.appearances} apps ${record.goals} goals${note}`;

        if (context.args.dryRun) {
            console.log(`  would insert ${player.id} ${summary}`);
        } else {
            await knex('player_season_stats').insert(record);
            console.log(`  inserted ${player.id} ${summary}`);
        }

        storedKeys.add(key);
        inserted += 1;
        addedGoals += record.goals;
    }

    const stored = Number(storedGoals.goals) || 0;

    console.log(`${player.name}: ${inserted} rows, ${addedGoals} new goals, stored ${stored}, combined ${stored + addedGoals}`);

    return { inserted, skipped: 0 };
}

async function ensureNamed(context, table, label, keyFn, cache, team, options = {}) {
    const key = keyFn(label);
    const found = cache.get(key) || [];
    const existing = pickNamed(found, team, options.national, context.usedTeamIds);

    if (existing) {
        return existing;
    }

    if (found.length > 0) {
        return null;
    }

    const id = context.ids.next();
    const row = {
        id,
        name: label,
        country_id: team ? team.country_id : null,
        is_national: Boolean(options.national)
    };

    cache.set(key, [row]);

    if (!context.args.dryRun) {
        if (table === 'teams') {
            await knex('teams').insert({ id, name: label, is_national: Boolean(options.national) });
        } else {
            await knex('leagues').insert({
                id,
                name: label,
                country_id: team ? team.country_id : null,
                kind: leagueKind(label),
                gender: 'men',
                age_group: 'senior',
                in_scope: true
            });
        }
    }

    console.log(`  ${context.args.dryRun ? 'would create' : 'created'} ${table} ${id} ${label}`);

    return row;
}

function nationalRemainder(storedRows, teamId, row) {
    if (!row.international) {
        return row.goals;
    }

    const sameYear = storedRows.filter((stored) => (
        stored.team_id === teamId && Number(stored.season_year) === row.year
    ));

    if (sameYear.length === 0) {
        return row.goals;
    }

    if (sameYear.some((stored) => stored.goals == null)) {
        return null;
    }

    const already = sameYear.reduce((sum, stored) => sum + Number(stored.goals), 0);

    if (already >= row.goals) {
        return null;
    }

    return row.goals - already;
}

function pickNamed(list, team, national, usedTeamIds) {
    if (usedTeamIds) {
        const used = list.filter((item) => usedTeamIds.has(item.id));

        if (used.length === 1) {
            return used[0];
        }
    }

    if (national) {
        const flagged = list.filter((item) => item.is_national);

        if (flagged.length === 1) {
            return flagged[0];
        }
    }

    return pickExisting(list, team);
}

function leagueKind(label) {
    const key = competitionKey(label);

    if (key === 'senior internationals') {
        return 'international';
    }

    if (/club world cup|champions|europa league/.test(key)) {
        return 'continental';
    }

    if (/super cup|community shield/.test(key)) {
        return 'super_cup';
    }

    if (/cup|coupe|copa |taca /.test(key)) {
        return 'cup';
    }

    return 'league';
}

function pickExisting(list, team) {
    if (list.length === 1) {
        return list[0];
    }

    if (!team || !team.country_id) {
        return null;
    }

    const sameCountry = list.filter((item) => item.country_id === team.country_id);

    return sameCountry.length === 1 ? sameCountry[0] : null;
}

async function loadPlayers(args) {
    const query = knex('players as p')
        .leftJoin('player_season_stats as s', 's.player_id', 'p.id')
        .groupBy('p.id', 'p.name', 'p.birth_date', 'p.nationality')
        .select('p.id', 'p.name', 'p.birth_date', 'p.nationality')
        .min('s.season_year as first_year')
        .orderBy('p.id', 'asc');

    if (args.player != null) {
        query.where('p.id', args.player);
    } else if (args.smoke) {
        query.whereIn('p.id', SMOKE_IDS);
    } else {
        query.whereNotNull('p.birth_date').andWhere('p.birth_date', '<', '1997-01-01');
    }

    if (args.from != null) {
        query.where('p.id', '>=', args.from);
    }

    if (args.before != null) {
        query.where('p.id', '<', args.before);
    }

    if (args.limit != null) {
        query.limit(args.limit);
    }

    const rows = await query;

    if (rows.length === 0) {
        throw new Error('No matching players. Pass --player <id> for someone already in players.');
    }

    return rows;
}

async function assertColumns() {
    const hasSource = await knex.schema.hasColumn('player_season_stats', 'source');

    if (!hasSource) {
        throw new Error('player_season_stats.source is missing. Run npm run mg:latest or npm run mg:latest:live.');
    }
}

async function idAllocator() {
    const teamMax = await knex('teams').max('id as max').first();
    const leagueMax = await knex('leagues').max('id as max').first();
    let nextId = Math.max(RESERVED_ID_FLOOR, Number(teamMax.max) || 0, Number(leagueMax.max) || 0);

    return {
        next() {
            nextId += 1;

            return nextId;
        }
    };
}

function indexBy(rows, keyFn) {
    const map = new Map();

    for (const row of rows) {
        const key = keyFn(row);
        const list = map.get(key) || [];

        list.push(row);
        map.set(key, list);
    }

    return map;
}

async function findTitle(player) {
    for (const title of await candidateTitles(player)) {
        const club = findClubSection(await sections('en', title));

        if (club) {
            return title;
        }
    }

    return null;
}

async function candidateTitles(player) {
    const year = birthYear(player.birth_date);
    const queries = [`${player.name} ${year} footballer`.trim()];

    if (/^[A-Z]\.\s+\S+/.test(player.name)) {
        queries.push(`${player.name.replace(/^[A-Z]\.\s+/, '')} ${year} footballer`.trim());
    }

    const titles = [];

    for (const search of queries) {
        const data = await wiki('en', {
            action: 'query',
            list: 'search',
            srsearch: search,
            srlimit: '5'
        });

        for (const hit of data.query?.search || []) {
            if (/^list of/i.test(hit.title) || /disambiguation/i.test(hit.title)) {
                continue;
            }

            if (titleMatches(hit.title, player.name) && !titles.includes(hit.title)) {
                titles.push(hit.title);
            }
        }
    }

    return titles;
}

async function langTitle(title, lang) {
    const data = await wiki('en', {
        action: 'query',
        titles: title,
        prop: 'langlinks',
        lllang: lang,
        lllimit: '1',
        redirects: '1'
    });
    const page = Object.values(data.query?.pages || {})[0];

    return page?.langlinks?.[0]?.['*'] || null;
}

async function secondSource(title, player) {
    const portuguese = await langTitle(title, 'pt');
    const ptPack = portuguese ? await pagePack('pt', portuguese) : null;
    const tried = ptPack ? [ptPack] : [];

    if (ptPack && ptPack.club) {
        return { chosen: ptPack, tried };
    }

    const lang = wikiLang(player.nationality);

    if (lang && lang !== 'en' && lang !== 'pt') {
        const localTitle = await langTitle(title, lang);
        const localPack = localTitle ? await pagePack(lang, localTitle) : null;

        if (localPack) {
            tried.push(localPack);
        }

        if (localPack && localPack.club) {
            return { chosen: localPack, tried };
        }
    }

    return { chosen: null, tried };
}

async function pagePack(lang, title) {
    const list = await sections(lang, title);
    let club = findClubSection(list);
    let intl = findIntlSection(list);

    if (!club && lang !== 'pt' && lang !== 'en') {
        const chosen = await chooseSections(list);

        club = sectionByIndex(list, chosen.club);
        intl = sectionByIndex(list, chosen.international);
    }

    return { lang, title, list, club, intl };
}

async function readClubRows(page, enRows) {
    const text = await sectionText(page.lang, page.title, page.club.index);

    if (page.lang === 'pt') {
        return parseClubTable(text, 'pt');
    }

    console.log(`  reading ${page.lang} club table`);

    return modelClubRows(text, enRows);
}

async function readIntlRows(page) {
    const text = await sectionText(page.lang, page.title, page.intl.index);

    if (page.lang === 'pt') {
        return parseInternational(text, 'pt');
    }

    console.log(`  reading ${page.lang} international table`);

    return modelIntlRows(text);
}

function sectionByIndex(list, index) {
    if (index == null || index === '' || index === 'null') {
        return null;
    }

    return list.find((section) => String(section.index) === String(index)) || null;
}

function skipPlayer(player, reason, detail) {
    console.log(`Skip ${player.id} ${player.name}: ${reason}`);

    if (detail) {
        console.log(detail);
    }

    fs.appendFileSync(SKIP_LOG, `${new Date().toISOString()} ${player.id} ${player.name}: ${reason}\n`);

    return { inserted: 0, skipped: 1 };
}

function wikiUrl(lang, title) {
    return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function resumeCommand(args, playerId) {
    const flags = [];

    if (args.all) {
        flags.push('--all');
    }

    if (args.live) {
        flags.push('--live');
    }

    if (args.dryRun) {
        flags.push('--dry-run');
    }

    if (args.before != null) {
        flags.push(`--before ${args.before}`);
    }

    flags.push(`--from ${playerId}`);

    return `node scripts/backfill-career-seasons.js ${flags.join(' ')}`;
}

async function sections(lang, title) {
    const data = await wiki(lang, {
        action: 'parse',
        page: title,
        prop: 'sections',
        redirects: '1'
    });

    return data.parse?.sections || [];
}

async function sectionText(lang, title, index) {
    const data = await wiki(lang, {
        action: 'parse',
        page: title,
        prop: 'wikitext',
        section: String(index),
        redirects: '1'
    });

    return data.parse?.wikitext?.['*'] || '';
}

function findIntlSection(list) {
    const statsHeading = careerHeading(list);

    if (!statsHeading) {
        return null;
    }

    const prefix = `${statsHeading.number}.`;

    return list.find((section) => (
        Number(section.toclevel) === Number(statsHeading.toclevel) + 1
        && String(section.number).startsWith(prefix)
        && /^(international|sele[cç][aã]o)\b/i.test(section.line)
    )) || null;
}

function careerHeading(list) {
    return list.find((section) => (
        /career statistics|estat[ií]sticas/i.test(section.line)
        && !/international|record/i.test(section.line)
    ));
}

function findClubSection(list) {
    const statsHeading = careerHeading(list);

    if (!statsHeading) {
        return null;
    }

    const prefix = `${statsHeading.number}.`;

    return list.find((section) => (
        Number(section.toclevel) === Number(statsHeading.toclevel) + 1
        && String(section.number).startsWith(prefix)
        && /^(club|clubes)\b/i.test(section.line)
    )) || null;
}

function birthYear(value) {
    if (!value) {
        return '';
    }

    if (value instanceof Date) {
        return String(value.getUTCFullYear());
    }

    const match = String(value).match(/\d{4}/);

    return match ? match[0] : '';
}

function titleMatches(title, label) {
    const tokens = String(label).split(/\s+/).filter((part) => part.replace(/\./g, '').length > 1);

    return tokens.every((part) => title.toLowerCase().includes(part.toLowerCase().replace(/\./g, '')));
}

function sectionLabels(list) {
    return list
        .filter((section) => /career|club|estat/i.test(section.line))
        .map((section) => `${section.number} ${section.line}`)
        .join(' | ') || '(none)';
}

async function chooseSections(list) {
    const lines = list.map((section) => `${section.index} ${section.number} ${section.line}`).join('\n');
    const chosen = await askModel(
        'Pick Wikipedia section indexes from the list. Return JSON {"club":"<index or null>","international":"<index or null>"}. club is the senior club season statistics table, with years, clubs, appearances and goals. international is the senior national-team year table. Ignore youth tables, honours, and narrative career sections. Copy the index, the first number on each line. Use null when that table is not listed.',
        lines
    );

    return {
        club: chosen.club == null ? null : String(chosen.club),
        international: chosen.international == null ? null : String(chosen.international)
    };
}

async function modelClubRows(wikitext, enRows) {
    const clubs = [...new Set(enRows.map((row) => row.club))];
    const parsed = await askModel(
        `Copy the senior club season table into JSON {"rows":[...]}. Each row has club, year, leagueApps, leagueGoals, leagueAssists, cupApps, cupGoals, cupAssists, continentalApps, continentalGoals, continentalAssists, otherApps, otherGoals, otherAssists. year is the season start year. When the club is one of these, use that exact name: ${clubs.join(', ')}. Copy numbers from the wikitext only. Use null when a column is absent. Skip reserve teams, youth teams, and total rows.`,
        String(wikitext || '').slice(0, 24000)
    );

    return (parsed.rows || []).map((row) => modelClubRow(row, clubs)).filter(Boolean);
}

function modelClubRow(raw, clubs) {
    const year = countOrNull(raw && raw.year);
    const club = alignClub(raw && raw.club, clubs);

    if (!club || year == null || year < 1930 || year > 2100) {
        return null;
    }

    const row = { club, year };

    for (const field of PT_FIELDS) {
        row[field] = countOrNull(raw[field]);
    }

    return row;
}

async function modelIntlRows(wikitext) {
    const parsed = await askModel(
        'Copy the senior national-team year table into JSON {"rows":[...]}. Each row has year, appearances, goals, assists, youth. youth is true for under-21, under-23, and Olympic rows. year is the calendar year. Copy numbers from the wikitext only. Use null when a column is absent. Skip total rows.',
        String(wikitext || '').slice(0, 24000)
    );

    return (parsed.rows || []).map((row) => {
        const year = countOrNull(row && row.year);
        const goals = countOrNull(row && row.goals);

        if (year == null || goals == null) {
            return null;
        }

        return {
            team: 'senior',
            year,
            appearances: countOrNull(row.appearances),
            goals,
            assists: countOrNull(row.assists),
            youth: Boolean(row.youth)
        };
    }).filter(Boolean);
}

function alignClub(label, clubs) {
    const text = String(label || '').trim();

    if (!text) {
        return null;
    }

    const key = clubKey(text);

    return clubs.find((candidate) => clubKey(candidate) === key) || text;
}

function countOrNull(value) {
    if (value == null || value === '') {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

async function askModel(instructions, input) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is missing');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: instructions },
                { role: 'user', content: input }
            ]
        }),
        signal: AbortSignal.timeout(60000)
    });
    const body = await response.text();

    if (!response.ok) {
        throw new Error(`OpenAI returned ${response.status}: ${body.slice(0, 180)}`);
    }

    const data = JSON.parse(body);
    const content = data.choices?.[0]?.message?.content || '{}';

    return JSON.parse(content);
}

async function wiki(lang, params, attempt = 0) {
    await pace();

    const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);

    url.search = new URLSearchParams({ ...params, format: 'json' });

    try {
        const response = await fetch(url, {
            headers: {
                'user-agent': USER_AGENT,
                accept: 'application/json'
            }
        });
        const body = await response.text();

        if ((response.status === 429 || response.status >= 500) && attempt < 4) {
            const pause = Number(response.headers.get('retry-after')) || 20 * (attempt + 1);

            console.log(`Wikipedia asked for a ${pause}s pause`);
            await sleep(pause * 1000);

            return wiki(lang, params, attempt + 1);
        }

        if (!response.ok || body.startsWith('You are making')) {
            throw new Error(`Wikipedia ${lang} returned ${response.status}: ${body.slice(0, 120)}`);
        }

        return JSON.parse(body);
    } catch (error) {
        if (error.message.startsWith('Wikipedia ') || attempt >= 4) {
            throw error;
        }

        const pause = 15 * (attempt + 1);

        console.log(`Wikipedia connection failed, retrying in ${pause}s`);
        await sleep(pause * 1000);

        return wiki(lang, params, attempt + 1);
    }
}

let nextRequestAt = 0;

async function pace() {
    const wait = nextRequestAt - Date.now();

    nextRequestAt = Date.now() + Math.max(wait, 0) + 1500;

    if (wait > 0) {
        await sleep(wait);
    }
}

function parseArgs(argv) {
    const args = {
        smoke: false,
        live: false,
        all: false,
        dryRun: false,
        player: null,
        limit: null,
        from: null,
        before: null,
        fbref: null
    };

    for (let index = 2; index < argv.length; index += 1) {
        const flag = argv[index];

        if (flag === '--smoke') {
            args.smoke = true;
        } else if (flag === '--live') {
            args.live = true;
        } else if (flag === '--all') {
            args.all = true;
        } else if (flag === '--dry-run') {
            args.dryRun = true;
        } else if (flag === '--player') {
            args.player = Number(argv[index + 1]);
            index += 1;
        } else if (flag === '--limit') {
            args.limit = Number(argv[index + 1]);
            index += 1;
        } else if (flag === '--from') {
            args.from = Number(argv[index + 1]);
            index += 1;
        } else if (flag === '--before') {
            args.before = Number(argv[index + 1]);
            index += 1;
        } else if (flag === '--fbref') {
            args.fbref = argv[index + 1];
            index += 1;
        } else {
            throw new Error(`Unknown argument: ${flag}`);
        }
    }

    if (!args.smoke && !args.all && args.player == null) {
        throw new Error('Use --smoke, --player <id>, or --all. Add --dry-run to print without writing.');
    }

    if (args.player != null && !Number.isFinite(args.player)) {
        throw new Error('--player must be a number');
    }

    if (args.from != null && !Number.isFinite(args.from)) {
        throw new Error('--from must be a player id');
    }

    if (args.before != null && !Number.isFinite(args.before)) {
        throw new Error('--before must be a player id');
    }

    if (args.from != null && args.before != null && args.from >= args.before) {
        throw new Error('--from must be lower than --before');
    }

    if (args.fbref && !fs.existsSync(args.fbref)) {
        throw new Error(`FBref file not found: ${args.fbref}`);
    }

    return args;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
