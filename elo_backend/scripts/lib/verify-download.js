'use strict';

const path = require('path');
const { downloadCompletePath, listPlayerStatSeasons, seasonDir } = require('./coverage');
const { fileExists, readJson } = require('./json-store');
const { rawFile } = require('./paths');

const FIXTURE_FILES = ['events.json', 'lineups.json', 'statistics.json', 'players.json'];

async function verifyDownloadedSeasons() {
    const leaguesPath = rawFile('leagues.json');

    if (!await fileExists(leaguesPath)) {
        return {
            total: 0,
            complete: 0,
            incomplete: 0,
            issues: [{ reason: 'missing leagues.json — run ingest:download:all first' }]
        };
    }

    const seasons = listPlayerStatSeasons(await readJson(leaguesPath));
    const issues = [];

    for (const season of seasons) {
        const problem = await verifyOneSeason(season);

        if (problem) {
            issues.push(problem);
        }
    }

    return {
        total: seasons.length,
        complete: seasons.length - issues.length,
        incomplete: issues.length,
        issues: issues.slice(0, 25)
    };
}

async function verifyOneSeason(season) {
    const dir = seasonDir(season.leagueId, season.year);
    const marker = downloadCompletePath(season.leagueId, season.year);
    const label = `${season.leagueName} ${season.year} (league=${season.leagueId})`;

    if (!await fileExists(marker)) {
        return { label, reason: 'no _complete.json (download not finished)' };
    }

    const required = [
        path.join(dir, 'teams.json'),
        path.join(dir, 'fixtures.json'),
        path.join(dir, 'standings.json'),
        path.join(dir, 'players', 'page-1.json')
    ];

    for (const filePath of required) {
        if (!await fileExists(filePath)) {
            return { label, reason: `missing ${path.basename(filePath)}` };
        }
    }

    const fixtures = await readJson(path.join(dir, 'fixtures.json'));
    const rows = fixtures.response || [];

    for (const row of rows) {
        const fixtureId = row.fixture?.id;

        if (!fixtureId) {
            continue;
        }

        for (const fileName of FIXTURE_FILES) {
            const filePath = rawFile('fixtures', String(fixtureId), fileName);

            if (!await fileExists(filePath)) {
                return { label, reason: `missing fixtures/${fixtureId}/${fileName}` };
            }
        }
    }

    return null;
}

function formatVerifyReport(report) {
    const lines = [
        `Download completeness: ${report.complete}/${report.total} seasons`
    ];

    if (report.incomplete > 0) {
        lines.push(`${report.incomplete} season(s) incomplete. Finish npm run ingest:download:all (it resumes).`);

        for (const issue of report.issues) {
            lines.push(`  - ${issue.label ? `${issue.label}: ` : ''}${issue.reason}`);
        }

        if (report.incomplete > report.issues.length) {
            lines.push(`  … ${report.incomplete - report.issues.length} more`);
        }
    }

    return lines.join('\n');
}

module.exports = {
    verifyDownloadedSeasons,
    formatVerifyReport
};
