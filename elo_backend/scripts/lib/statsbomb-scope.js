'use strict';

/**
 * Open-data seasons we actually load. Not the full GitHub dump.
 * La Liga 2004/05–2020/21 covers Messi and Ronaldo’s Madrid league years.
 * World Cups 1958 / 1970 / 1986 are Pelé / Maradona peaks.
 * All women’s competitions in the dump are in.
 */

const LA_LIGA_ID = 11;
const WORLD_CUP_ID = 43;
const LA_LIGA_FROM = 2004;
const LA_LIGA_TO = 2020;
const WORLD_CUPS = new Set(['1958', '1970', '1986']);

function seasonStartYear(seasonName) {
    const match = String(seasonName || '').match(/^(\d{4})/);

    return match ? Number(match[1]) : null;
}

function inScope(row) {
    if (!row) {
        return false;
    }

    if (row.competition_gender === 'female') {
        return true;
    }

    if (Number(row.competition_id) === LA_LIGA_ID) {
        const year = seasonStartYear(row.season_name);

        return year != null && year >= LA_LIGA_FROM && year <= LA_LIGA_TO;
    }

    if (Number(row.competition_id) === WORLD_CUP_ID) {
        return WORLD_CUPS.has(String(row.season_name));
    }

    return false;
}

function scopedCompetitions(rows, { everything = false } = {}) {
    if (everything) {
        return rows;
    }

    return rows.filter(inScope);
}

module.exports = {
    LA_LIGA_ID,
    WORLD_CUP_ID,
    inScope,
    scopedCompetitions,
    seasonStartYear
};
