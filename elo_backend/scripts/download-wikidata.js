'use strict';

/**
 * Download Wikidata footballer/manager identity + club stints to data/raw/wikidata.
 * Does not call API-Football, does not write Postgres, does not touch data/raw/api-football.
 *
 * Window: people born 1935–1993 with a club or tenure (covers careers ~1980–2008).
 *
 *   npm run ingest:wikidata:smoke
 *   npm run ingest:wikidata:download
 *   node scripts/download-wikidata.js --year 1985
 *
 * Resume is on by default (skip birth years with _complete.json). Re-run to continue.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { fileExists, writeJson } = require('./lib/json-store');
const { WIKIDATA_RAW_DIR, wikidataFile } = require('./lib/paths');
const { createProgress } = require('./lib/progress');
const {
    createWikidataClient,
    literal,
    qidFromUri,
    qidNumber,
    resolveUserAgent
} = require('./lib/wikidata-client');
const { identityQuery, personIdQuery, stintQuery } = require('./lib/wikidata-queries');

const WINDOW_FROM = 1980;
const WINDOW_TO = 2008;
const BIRTH_FROM = 1935;
const BIRTH_TO = 1993;
const ID_PAGE_SIZE = 400;
const DETAIL_BATCH_SIZE = 40;
const SMOKE_BIRTH_YEAR = 1985;
const SMOKE_ID_LIMIT = 40;

let stopRequested = false;

process.on('SIGINT', () => {
    if (stopRequested) {
        process.exit(1);
    }

    stopRequested = true;
    console.log('\nStop requested — finishing the current birth year, then exiting. Ctrl+C again aborts now.');
});

async function main() {
    const args = parseArgs(process.argv);
    const userAgent = resolveUserAgent();
    const client = createWikidataClient({ userAgent });

    if (args.smoke) {
        await downloadBirthYear(client, {
            ...args,
            smoke: true
        }, SMOKE_BIRTH_YEAR);

        return;
    }

    const years = args.year != null
        ? [args.year]
        : range(BIRTH_FROM, BIRTH_TO);

    const progress = createProgress({
        mode: args.year != null ? 'wikidata-year' : 'wikidata-all',
        total: years.length,
        dir: WIKIDATA_RAW_DIR
    });

    await writeJson(wikidataFile('_manifest.json'), {
        source: 'wikidata',
        endpoint: 'https://query.wikidata.org/sparql',
        window: { from: WINDOW_FROM, to: WINDOW_TO },
        birthYears: { from: BIRTH_FROM, to: BIRTH_TO },
        occupations: ['Q937857 association football player', 'Q628099 association football manager'],
        resume: args.resume,
        startedAt: new Date().toISOString()
    });

    await progress.log(
        `Wikidata download birth ${years[0]}–${years[years.length - 1]} (careers ${WINDOW_FROM}–${WINDOW_TO}, resume=${args.resume}). Files: ${WIKIDATA_RAW_DIR}`
    );

    try {
        for (const year of years) {
            if (stopRequested) {
                await progress.log('Stopped by user. Re-run to resume.');
                process.exitCode = 2;

                return;
            }

            await downloadBirthYear(client, args, year, progress);
        }

        await progress.log(`Done. SPARQL calls=${client.state.used}`);
    } finally {
        progress.clearBar();
    }
}

async function downloadBirthYear(client, args, birthYear, progress) {
    const yearDir = wikidataFile('people', `born-${birthYear}`);
    const completePath = path.join(yearDir, '_complete.json');

    if (args.resume && !args.smoke && await fileExists(completePath)) {
        if (progress) {
            progress.state.skipped += 1;
            progress.state.completed += 1;
            progress.tick(progress.state.completed, progress.state.total, `born-${birthYear} skip`);
            await progress.snapshot({ current: `born-${birthYear}` });
        } else {
            console.log(`born-${birthYear}: already complete, skip`);
        }

        return;
    }

    const log = progress
        ? (message) => progress.log(message)
        : async (message) => console.log(message);

    await log(`born-${birthYear}: listing people`);

    const idLimit = args.smoke ? SMOKE_ID_LIMIT : ID_PAGE_SIZE;
    const qids = await listPeople(client, birthYear, idLimit, args.smoke);
    const idPath = path.join(yearDir, '_ids.json');
    await writeJson(idPath, { birthYear, count: qids.length, qids });

    await log(`born-${birthYear}: ${qids.length} people, fetching identity + stints`);

    const people = [];
    const batchSize = args.smoke ? 20 : DETAIL_BATCH_SIZE;

    for (const batch of chunk(qids, batchSize)) {
        if (stopRequested) {
            break;
        }

        const detailed = await loadPeople(client, batch);
        people.push(...detailed);

        const batchIndex = String(Math.ceil(people.length / batchSize)).padStart(4, '0');
        await writeJson(path.join(yearDir, `batch-${batchIndex}.json`), detailed);
    }

    const summary = summarizeYear(birthYear, people);
    await writeJson(path.join(yearDir, '_summary.json'), summary);
    await writeJson(path.join(yearDir, 'people.json'), people);

    if (!args.smoke && !stopRequested) {
        await writeJson(completePath, {
            birthYear,
            personCount: people.length,
            withStintInWindow: summary.withStintInWindow,
            completedAt: new Date().toISOString()
        });
    }

    if (progress) {
        progress.state.completed += 1;
        progress.tick(progress.state.completed, progress.state.total, `born-${birthYear}`);
        await progress.snapshot({ current: `born-${birthYear}`, apiUsed: client.state.used });
    }

    const smokeNote = args.smoke ? ' [smoke, not marked complete]' : '';
    await log(
        `born-${birthYear}: saved ${people.length} people (${summary.withStintInWindow} with a ${WINDOW_FROM}–${WINDOW_TO} stint)${smokeNote}`
    );
}

async function listPeople(client, birthYear, pageSize, smoke) {
    const qids = [];
    let afterQid = 0;
    let pageLimit = pageSize;

    while (!stopRequested) {
        let bindings;

        try {
            bindings = await client.sparql(personIdQuery({
                birthYear,
                afterQid,
                limit: pageLimit
            }));
        } catch (err) {
            if (err.timedOut && pageLimit > 50) {
                pageLimit = Math.max(50, Math.floor(pageLimit / 2));
                console.log(`  timed out; retrying born-${birthYear} with page size ${pageLimit}`);
                continue;
            }

            throw err;
        }

        if (!bindings.length) {
            break;
        }

        for (const row of bindings) {
            const qid = qidFromUri(row.person && row.person.value);

            if (qid) {
                qids.push(qid);
                afterQid = Math.max(afterQid, qidNumber(qid));
            }
        }

        if (smoke || bindings.length < pageLimit) {
            break;
        }
    }

    return [...new Set(qids)];
}

async function loadPeople(client, qids) {
    if (!qids.length) {
        return [];
    }

    const identityRows = await client.sparql(identityQuery(qids));
    const stintRows = await client.sparql(stintQuery(qids));
    const people = new Map();

    for (const qid of qids) {
        people.set(qid, emptyPerson(qid));
    }

    for (const row of identityRows) {
        mergeIdentity(people, row);
    }

    for (const row of stintRows) {
        mergeStint(people, row);
    }

    return [...people.values()].map(finalizePerson);
}

function emptyPerson(qid) {
    return {
        qid,
        label: null,
        dob: null,
        aliases: [],
        citizenships: [],
        positions: [],
        wikipediaEn: null,
        externalIds: {
            transfermarkt: null,
            worldfootball: null,
            footballdatabase: null,
            soccerbase: null,
            fifa: null
        },
        stints: []
    };
}

function mergeIdentity(people, row) {
    const qid = qidFromUri(row.person && row.person.value);
    const person = people.get(qid);

    if (!person) {
        return;
    }

    person.label = person.label || literal(row.personLabel);
    person.dob = person.dob || literal(row.dob);
    person.wikipediaEn = person.wikipediaEn || literal(row.wikiTitle);
    person.externalIds.transfermarkt = person.externalIds.transfermarkt || literal(row.transfermarkt);
    person.externalIds.worldfootball = person.externalIds.worldfootball || literal(row.worldfootball);
    person.externalIds.footballdatabase = person.externalIds.footballdatabase || literal(row.footballdatabase);
    person.externalIds.soccerbase = person.externalIds.soccerbase || literal(row.soccerbase);
    person.externalIds.fifa = person.externalIds.fifa || literal(row.fifa);
    pushUnique(person.aliases, literal(row.alias));
    pushEntity(person.citizenships, row.citizenship, row.citizenshipLabel);
    pushEntity(person.positions, row.position, row.positionLabel);
}

function mergeStint(people, row) {
    const qid = qidFromUri(row.person && row.person.value);
    const person = people.get(qid);
    const teamQid = qidFromUri(row.team && row.team.value);

    if (!person || !teamQid) {
        return;
    }

    const stint = {
        kind: literal(row.kind) || 'player',
        teamQid,
        teamLabel: literal(row.teamLabel),
        start: literal(row.start),
        end: literal(row.end),
        appearances: toInt(literal(row.apps)),
        goals: toInt(literal(row.goals)),
        inWindow: overlapsWindow(literal(row.start), literal(row.end), WINDOW_FROM, WINDOW_TO)
    };
    const key = `${stint.kind}|${stint.teamQid}|${stint.start}|${stint.end}`;

    if (!person.stints.some((item) => `${item.kind}|${item.teamQid}|${item.start}|${item.end}` === key)) {
        person.stints.push(stint);
    }
}

function finalizePerson(person) {
    person.aliases = person.aliases.filter((alias) => alias && alias !== person.label);
    person.stints.sort(compareStints);

    return person;
}

function summarizeYear(birthYear, people) {
    return {
        birthYear,
        personCount: people.length,
        withDob: people.filter((person) => person.dob).length,
        withTransfermarkt: people.filter((person) => person.externalIds.transfermarkt).length,
        withStintInWindow: people.filter((person) => person.stints.some((stint) => stint.inWindow)).length
    };
}

function overlapsWindow(start, end, fromYear, toYear) {
    const from = `${fromYear}-01-01`;
    const to = `${toYear}-12-31`;

    if (end && end < from) {
        return false;
    }

    if (start && start > to) {
        return false;
    }

    return true;
}

function pushUnique(list, value) {
    if (value && !list.includes(value)) {
        list.push(value);
    }
}

function pushEntity(list, qidBinding, labelBinding) {
    const qid = qidFromUri(qidBinding && qidBinding.value);

    if (!qid || list.some((item) => item.qid === qid)) {
        return;
    }

    list.push({ qid, label: literal(labelBinding) });
}

function compareStints(left, right) {
    return String(left.start || '9999').localeCompare(String(right.start || '9999'));
}

function toInt(value) {
    if (value == null || value === '') {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}

function chunk(items, size) {
    const groups = [];

    for (let index = 0; index < items.length; index += size) {
        groups.push(items.slice(index, index + size));
    }

    return groups;
}

function range(from, to) {
    const years = [];

    for (let year = from; year <= to; year += 1) {
        years.push(year);
    }

    return years;
}

function parseArgs(argv) {
    const args = {
        smoke: false,
        resume: true,
        year: null
    };

    for (let index = 2; index < argv.length; index += 1) {
        const flag = argv[index];

        if (flag === '--smoke') {
            args.smoke = true;
        } else if (flag === '--all') {
            args.year = null;
        } else if (flag === '--resume') {
            args.resume = true;
        } else if (flag === '--fresh') {
            args.resume = false;
        } else if (flag === '--year') {
            args.year = Number(argv[index + 1]);
            index += 1;
        } else {
            throw new Error(`Unknown argument: ${flag}`);
        }
    }

    if (args.year != null && !Number.isFinite(args.year)) {
        throw new Error('--year must be a birth year (e.g. 1985)');
    }

    if (!args.smoke && args.year == null && !argv.includes('--all')) {
        throw new Error('Use --smoke, --year <birthYear>, or --all.');
    }

    return args;
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
