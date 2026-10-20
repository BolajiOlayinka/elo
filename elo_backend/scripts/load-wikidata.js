'use strict';

/**
 * Load extracted Wikidata identity, stints, and honours into Postgres.
 * Matches name + date of birth onto existing players/coaches. Mints reserved
 * ids when nobody matches (Pelé, Maradona, …). Does not write Career Points.
 *
 *   node scripts/load-wikidata.js --smoke
 *   node scripts/load-wikidata.js --all
 *   node scripts/load-wikidata.js --year 1960 --live
 */

const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const knexLib = require('knex');
const knexConfig = require('../src/infra/database/knexfile');
const { parseIngestArgs } = require('./lib/cli');
const { fileExists, readJson } = require('./lib/json-store');
const { WIKIDATA_RAW_DIR, wikidataExtractedFile } = require('./lib/paths');
const { createProgress, describeDbTarget } = require('./lib/progress');
const { batchInsert, batchUpsert } = require('./lib/upsert');

const RESERVED_ID_FLOOR = 1000000000;
const WIKI_BASE = 'https://www.wikidata.org/wiki/';

let knex = null;
let stopRequested = false;

process.on('SIGINT', () => {
    if (stopRequested) {
        process.exit(1);
    }

    stopRequested = true;
    console.log('\nStop requested — finishing the current year, then exiting. Ctrl+C again aborts now.');
});

async function main() {
    const args = parseIngestArgs(process.argv);

    if (!args.smoke && !args.all && args.year == null) {
        throw new Error('Use --smoke, --year 1960, or --all. Add --live for Heroku.');
    }

    if (args.live && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is missing (needed for --live)');
    }

    knex = knexLib(args.live ? knexConfig.production : knexConfig.development);

    try {
        await assertColumns();
        const files = await listExtracted(args);

        if (!files.length) {
            throw new Error('No extracted Wikidata files. Run npm run ingest:wikidata:extract first.');
        }

        const progress = createProgress({
            mode: args.smoke ? 'wikidata-load-smoke' : 'wikidata-load',
            total: files.length,
            dir: WIKIDATA_RAW_DIR
        });

        await progress.log(`Load ${files.length} file(s) → ${describeDbTarget(args.live, knexConfig)}`);

        const context = await buildContext();
        let done = 0;

        for (const filePath of files) {
            if (stopRequested) {
                break;
            }

            const payload = await readJson(filePath);

            await loadYear(context, payload.people || []);
            done += 1;
            progress.tick(done, files.length, `born-${payload.birthYear || '?'}`);
        }

        progress.clearBar();

        if (stopRequested) {
            await progress.log('Stopped by user. Re-run npm run ingest:wikidata:load to resume.');

            return;
        }

        await progress.log(
            `Done. years=${done} players+${context.created.players} coaches+${context.created.coaches}`
            + ` skipped=${context.skipped}`
        );
    } finally {
        await knex.destroy();
    }
}

async function listExtracted(args) {
    if (args.smoke) {
        const dest = wikidataExtractedFile('_smoke.json');

        return await fileExists(dest) ? [dest] : [];
    }

    if (args.year != null) {
        return [wikidataExtractedFile(`born-${args.year}.json`)];
    }

    const root = wikidataExtractedFile();

    if (!await fileExists(root)) {
        return [];
    }

    const names = await fs.readdir(root);

    return names
        .filter((fileName) => /^born-\d{4}\.json$/.test(fileName))
        .sort()
        .map((fileName) => path.join(root, fileName));
}

async function assertColumns() {
    const hasQid = await knex.schema.hasColumn('players', 'wikidata_qid');
    const hasStints = await knex.schema.hasTable('player_stints');

    if (!hasQid || !hasStints) {
        throw new Error('Wikidata columns are missing. Run npm run mg:latest or npm run mg:latest:live.');
    }
}

async function buildContext() {
    const [players, coaches, teams, playerMax, coachMax] = await Promise.all([
        knex('players').select([
            'id', 'name', 'first_name', 'last_name', 'birth_date', 'nationality',
            'wikidata_qid', 'wikipedia_title'
        ]),
        knex('coaches').select('id', 'name', 'first_name', 'last_name', 'birth_date', 'nationality', 'wikidata_qid'),
        knex('teams').select('id', 'name'),
        knex('players').max('id as max').first(),
        knex('coaches').max('id as max').first()
    ]);

    let nextId = Math.max(
        RESERVED_ID_FLOOR,
        Number(playerMax.max) || 0,
        Number(coachMax.max) || 0
    );

    const context = {
        nextId() {
            nextId += 1;

            return nextId;
        },
        playersByQid: new Map(),
        coachesByQid: new Map(),
        playersByDobName: new Map(),
        coachesByDobName: new Map(),
        teamsByName: new Map(),
        created: { players: 0, coaches: 0 },
        skipped: 0
    };

    for (const row of players) {
        indexPerson(context.playersByQid, context.playersByDobName, row);
    }

    for (const row of coaches) {
        indexPerson(context.coachesByQid, context.coachesByDobName, row);
    }

    for (const row of teams) {
        const key = foldName(row.name);

        if (key && !context.teamsByName.has(key)) {
            context.teamsByName.set(key, row);
        }
    }

    return context;
}

function indexPerson(byQid, byDobName, row) {
    if (row.wikidata_qid) {
        byQid.set(row.wikidata_qid, row);
    }

    const dob = dobKey(row.birth_date);
    const names = nameKeys(row.name, row.first_name, row.last_name);

    for (const label of names) {
        pushIndex(byDobName, `${dob}|${label}`, row);
    }
}

function pushIndex(map, key, row) {
    if (!key || key.startsWith('null|') || key.startsWith('|')) {
        return;
    }

    const list = map.get(key) || [];

    if (!list.some((item) => item.id === row.id)) {
        list.push(row);
    }

    map.set(key, list);
}

async function loadYear(context, people) {
    const now = new Date();
    const playerRows = [];
    const coachRows = [];
    const stints = [];
    const tenures = [];
    const trophies = [];
    const playerIds = [];
    const coachIds = [];

    for (const person of people) {
        if (!person?.qid || !person.label) {
            context.skipped += 1;
            continue;
        }

        const asPlayer = person.playerStints.length > 0 || person.coachStints.length === 0;
        const asCoach = person.coachStints.length > 0;
        let player = asPlayer
            ? matchPerson(context.playersByQid, context.playersByDobName, person)
            : null;
        let coach = asCoach
            ? matchPerson(context.coachesByQid, context.coachesByDobName, person)
            : null;

        if (player === 'ambiguous' || coach === 'ambiguous') {
            context.skipped += 1;
            continue;
        }

        if (asPlayer && !player) {
            player = makePerson(context, person, now);
            context.created.players += 1;
            indexPerson(context.playersByQid, context.playersByDobName, player);
        }

        if (asCoach && !coach) {
            coach = makePerson(context, person, now);
            context.created.coaches += 1;
            indexPerson(context.coachesByQid, context.coachesByDobName, coach);
        }

        if (player) {
            Object.assign(player, identityPatch(player, person));
            playerRows.push(playerRow(player, now));
            playerIds.push(player.id);

            for (const stint of person.playerStints) {
                stints.push({
                    player_id: player.id,
                    team_id: context.teamsByName.get(foldName(stint.teamLabel))?.id || null,
                    team_qid: stint.teamQid,
                    team_label: stint.teamLabel,
                    started_on: stint.startedOn,
                    ended_on: stint.endedOn,
                    appearances: stint.appearances,
                    goals: stint.goals,
                    source: 'wikidata',
                    updated_at: now
                });
            }
        }

        if (coach) {
            Object.assign(coach, identityPatch(coach, person));
            coachRows.push(coachRow(coach, now));
            coachIds.push(coach.id);

            for (const stint of person.coachStints) {
                tenures.push({
                    coach_id: coach.id,
                    team_id: context.teamsByName.get(foldName(stint.teamLabel))?.id || null,
                    team_name: stint.teamLabel,
                    started_on: stint.startedOn,
                    ended_on: stint.endedOn,
                    source: 'wikidata',
                    team_qid: stint.teamQid,
                    updated_at: now
                });
            }
        }

        const host = player || coach;

        if (!host) {
            continue;
        }

        for (const honour of person.honours || []) {
            if (!honour.honourLabel) {
                continue;
            }

            trophies.push({
                player_id: player ? player.id : null,
                coach_id: player ? null : coach.id,
                competition_name: honour.honourLabel,
                country: null,
                season: honour.season,
                place: honour.ofLabel || honour.kind,
                source: 'wikidata',
                source_url: honour.honourQid ? `${WIKI_BASE}${honour.honourQid}` : null,
                kind: honour.kind,
                honour_qid: honour.honourQid,
                of_qid: honour.ofQid,
                of_label: honour.ofLabel,
                created_at: now
            });
        }
    }

    if (playerRows.length) {
        await batchUpsert(knex, 'players', uniqueById(uniqueByQid(playerRows)), ['id'], [
            'name', 'first_name', 'last_name', 'birth_date', 'nationality', 'wikidata_qid',
            'wikipedia_title', 'transfermarkt_id', 'worldfootball_id', 'footballdatabase_id',
            'soccerbase_id', 'fifa_id', 'updated_at'
        ]);
    }

    if (coachRows.length) {
        await batchUpsert(knex, 'coaches', uniqueById(uniqueByQid(coachRows)), ['id'], [
            'name', 'first_name', 'last_name', 'birth_date', 'nationality', 'wikidata_qid',
            'wikipedia_title', 'updated_at'
        ]);
    }

    if (playerIds.length) {
        await knex('player_stints').where({ source: 'wikidata' }).whereIn('player_id', uniqueIds(playerIds)).del();
        await knex('trophies').where({ source: 'wikidata' }).whereIn('player_id', uniqueIds(playerIds)).del();
    }

    if (coachIds.length) {
        await knex('coach_tenures').where({ source: 'wikidata' }).whereIn('coach_id', uniqueIds(coachIds)).del();
        await knex('trophies').where({ source: 'wikidata' }).whereIn('coach_id', uniqueIds(coachIds)).del();
    }

    if (stints.length) {
        await batchInsert(knex, 'player_stints', stints);
    }

    if (tenures.length) {
        await batchInsert(knex, 'coach_tenures', tenures);
    }

    if (trophies.length) {
        await batchInsert(knex, 'trophies', uniqueTrophies(trophies));
    }
}

function matchPerson(byQid, byDobName, person) {
    const linked = byQid.get(person.qid);

    if (linked) {
        return linked;
    }

    const dob = dobKey(person.dob);
    const keys = nameKeys(person.label, null, null);

    for (const alias of person.aliases || []) {
        for (const key of nameKeys(alias, null, null)) {
            keys.add(key);
        }
    }

    const hits = [];

    for (const label of keys) {
        for (const row of byDobName.get(`${dob}|${label}`) || []) {
            if (!hits.some((item) => item.id === row.id)) {
                hits.push(row);
            }
        }
    }

    if (hits.length === 1) {
        return hits[0];
    }

    if (hits.length > 1) {
        return 'ambiguous';
    }

    return null;
}

function makePerson(context, person, now) {
    const parts = String(person.label).trim().split(/\s+/);
    const row = {
        id: context.nextId(),
        name: person.label,
        first_name: parts[0] || null,
        last_name: parts.length > 1 ? parts[parts.length - 1] : null,
        birth_date: person.dob,
        nationality: person.nationality,
        wikidata_qid: person.qid,
        wikipedia_title: person.wikipediaTitle,
        transfermarkt_id: person.externalIds?.transfermarkt || null,
        worldfootball_id: person.externalIds?.worldfootball || null,
        footballdatabase_id: person.externalIds?.footballdatabase || null,
        soccerbase_id: person.externalIds?.soccerbase || null,
        fifa_id: person.externalIds?.fifa || null,
        updated_at: now
    };

    return row;
}

function identityPatch(row, person) {
    return {
        wikidata_qid: row.wikidata_qid || person.qid,
        wikipedia_title: row.wikipedia_title || person.wikipediaTitle,
        transfermarkt_id: row.transfermarkt_id || person.externalIds?.transfermarkt || null,
        worldfootball_id: row.worldfootball_id || person.externalIds?.worldfootball || null,
        footballdatabase_id: row.footballdatabase_id || person.externalIds?.footballdatabase || null,
        soccerbase_id: row.soccerbase_id || person.externalIds?.soccerbase || null,
        fifa_id: row.fifa_id || person.externalIds?.fifa || null,
        birth_date: row.birth_date || person.dob,
        nationality: row.nationality || person.nationality
    };
}

function playerRow(row, now) {
    return {
        id: row.id,
        name: row.name,
        first_name: row.first_name,
        last_name: row.last_name,
        birth_date: dobKey(row.birth_date),
        nationality: row.nationality,
        wikidata_qid: row.wikidata_qid,
        wikipedia_title: row.wikipedia_title,
        transfermarkt_id: row.transfermarkt_id || null,
        worldfootball_id: row.worldfootball_id || null,
        footballdatabase_id: row.footballdatabase_id || null,
        soccerbase_id: row.soccerbase_id || null,
        fifa_id: row.fifa_id || null,
        updated_at: now
    };
}

function coachRow(row, now) {
    return {
        id: row.id,
        name: row.name,
        first_name: row.first_name,
        last_name: row.last_name,
        birth_date: dobKey(row.birth_date),
        nationality: row.nationality,
        wikidata_qid: row.wikidata_qid,
        wikipedia_title: row.wikipedia_title,
        updated_at: now
    };
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

        if (parts[0][0]) {
            keys.add(`${parts[0][0]} ${parts[parts.length - 1]}`);
        }
    }

    const combo = foldName([first, last].filter(Boolean).join(' '));

    if (combo) {
        keys.add(combo);
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

function dobKey(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    const text = String(value).slice(0, 10);

    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function uniqueById(rows) {
    const seen = new Map();

    for (const row of rows) {
        seen.set(row.id, row);
    }

    return [...seen.values()];
}

function uniqueByQid(rows) {
    const seen = new Map();

    for (const row of rows) {
        seen.set(row.wikidata_qid || `id:${row.id}`, row);
    }

    return [...seen.values()];
}

function uniqueIds(ids) {
    return [...new Set(ids)];
}

function uniqueTrophies(rows) {
    const seen = new Map();

    for (const row of rows) {
        const key = `${row.player_id}|${row.coach_id}|${row.honour_qid}|${row.season}|${row.of_qid}`;

        seen.set(key, row);
    }

    return [...seen.values()];
}

main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
});
