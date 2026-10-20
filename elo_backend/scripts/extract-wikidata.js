'use strict';

/**
 * Merge Wikidata people + honours JSON into one file per birth year.
 * Does not write Postgres. Stint goals stay on the person; they are not season points.
 *
 *   node scripts/extract-wikidata.js --smoke
 *   node scripts/extract-wikidata.js --all
 *   node scripts/extract-wikidata.js --year 1960
 *
 * Resume skips extracted years. --fresh rebuilds them.
 */

const fs = require('fs/promises');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { parseIngestArgs } = require('./lib/cli');
const { fileExists, readJson, writeJson } = require('./lib/json-store');
const { WIKIDATA_RAW_DIR, wikidataFile, wikidataExtractedFile } = require('./lib/paths');
const { createProgress } = require('./lib/progress');
const { toDate, toInt } = require('./lib/upsert');

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
        throw new Error('Use --smoke, --year 1960, or --all.');
    }

    const years = args.year != null
        ? [`born-${args.year}`]
        : await listBirthYears();

    if (!years.length) {
        throw new Error('No Wikidata people folders. Run npm run ingest:wikidata:download first.');
    }

    if (args.smoke) {
        await extractSmoke(years);

        return;
    }

    await extractAll(years, args);
}

async function extractSmoke(years) {
    const progress = createProgress({ mode: 'wikidata-extract-smoke', total: 1, dir: WIKIDATA_RAW_DIR });
    const preferred = years.includes('born-1960') ? 'born-1960' : years[0];
    const people = await extractYear(preferred);
    const dest = wikidataExtractedFile('_smoke.json');

    await writeJson(dest, { birthYear: Number(preferred.slice(5)), people: people.slice(0, 40) });
    await progress.log(`Smoke extract ${preferred} people=${Math.min(40, people.length)} → ${dest}`);
}

async function extractAll(years, args) {
    const progress = createProgress({
        mode: 'wikidata-extract',
        total: years.length,
        dir: WIKIDATA_RAW_DIR
    });

    await progress.log(`Extract ${years.length} birth years (identity + stints + honours)`);

    let done = 0;
    let skipped = 0;
    let peopleOut = 0;

    for (const folder of years) {
        if (stopRequested) {
            break;
        }

        const birthYear = Number(folder.slice(5));
        const dest = wikidataExtractedFile(`${folder}.json`);

        if (args.resume && await fileExists(dest)) {
            skipped += 1;
            done += 1;
            progress.tick(done, years.length, `skip ${folder}`);
            continue;
        }

        const people = await extractYear(folder);

        await writeJson(dest, { birthYear, people });
        peopleOut += people.length;
        done += 1;
        progress.tick(done, years.length, folder);
    }

    progress.clearBar();

    if (stopRequested) {
        await progress.log('Stopped by user. Re-run npm run ingest:wikidata:extract to resume.');

        return;
    }

    await writeJson(wikidataExtractedFile('_complete.json'), {
        source: 'wikidata',
        years: years.length,
        people: peopleOut,
        skipped,
        finishedAt: new Date().toISOString()
    });
    await progress.log(`Done. years=${done} skipped=${skipped} people=${peopleOut} → ${wikidataExtractedFile()}`);
}

async function extractYear(folder) {
    const peoplePath = wikidataFile('people', folder, 'people.json');

    if (!await fileExists(peoplePath)) {
        return [];
    }

    const people = await readJson(peoplePath);
    const honoursPath = wikidataFile('honours', folder, 'people.json');
    const honoursByQid = new Map();

    if (await fileExists(honoursPath)) {
        for (const row of await readJson(honoursPath)) {
            honoursByQid.set(row.qid, row.honours || []);
        }
    }

    return (people || []).map((person) => shapePerson(person, honoursByQid.get(person.qid) || []));
}

function shapePerson(person, honours) {
    const stints = (person.stints || []).map((stint) => ({
        kind: stint.kind === 'coach' ? 'coach' : 'player',
        teamQid: stint.teamQid || null,
        teamLabel: stint.teamLabel || null,
        startedOn: toDate(stint.start),
        endedOn: toDate(stint.end),
        appearances: toInt(stint.appearances),
        goals: toInt(stint.goals)
    }));

    return {
        qid: person.qid,
        label: person.label || null,
        dob: toDate(person.dob),
        aliases: person.aliases || [],
        nationality: person.citizenships?.[0]?.label || null,
        wikipediaTitle: person.wikipediaEn || null,
        externalIds: person.externalIds || {},
        playerStints: stints.filter((stint) => stint.kind === 'player'),
        coachStints: stints.filter((stint) => stint.kind === 'coach'),
        honours: (honours || []).map((item) => ({
            kind: item.kind === 'victory' ? 'victory' : 'award',
            honourQid: item.honourQid || null,
            honourLabel: item.honourLabel || null,
            when: toDate(item.when),
            season: item.when ? String(item.when).slice(0, 4) : null,
            ofQid: item.ofQid || null,
            ofLabel: item.ofLabel || null
        }))
    };
}

async function listBirthYears() {
    const dir = wikidataFile('people');

    if (!await fileExists(dir)) {
        return [];
    }

    const names = await fs.readdir(dir);

    return names.filter((folder) => /^born-\d{4}$/.test(folder)).sort();
}

main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
});
