'use strict';

const path = require('path');
const { rawFile } = require('./paths');

function listPlayerStatSeasons(leaguesPayload) {
    const seen = new Map();

    for (const row of leaguesPayload.response || []) {
        const leagueId = row.league?.id;
        const leagueName = row.league?.name || String(leagueId);

        if (!leagueId) {
            continue;
        }

        for (const season of row.seasons || []) {
            if (season.year == null || !season.coverage?.fixtures?.statistics_players) {
                continue;
            }

            seen.set(`${leagueId}:${season.year}`, {
                leagueId,
                leagueName,
                year: season.year
            });
        }
    }

    return [...seen.values()].sort((left, right) => {
        if (left.leagueId !== right.leagueId) {
            return left.leagueId - right.leagueId;
        }

        return left.year - right.year;
    });
}

function seasonDir(leagueId, year) {
    return rawFile('leagues', String(leagueId), String(year));
}

function downloadCompletePath(leagueId, year) {
    return path.join(seasonDir(leagueId, year), '_complete.json');
}

function loadCompletePath(leagueId, year, live) {
    const suffix = live ? 'production' : 'development';

    return path.join(seasonDir(leagueId, year), `_load_complete.${suffix}.json`);
}

module.exports = {
    listPlayerStatSeasons,
    seasonDir,
    downloadCompletePath,
    loadCompletePath
};
