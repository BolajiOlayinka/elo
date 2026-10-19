'use strict';

/**
 * Derive competition metadata (kind / tier / gender / age_group) from the API-Football
 * catalog row. Heuristics first, explicit id overrides last. Values are seeds; the
 * admin can correct them in the leagues table, and the loader only writes these
 * columns when a season is loaded for that league.
 *
 * kind: league | cup | continental | international | friendly | super_cup
 */

const CONTINENTAL_CLUB_IDS = new Set([
    2, // UEFA Champions League
    3, // UEFA Europa League
    848, // UEFA Europa Conference League
    525, // UEFA Champions League Women
    13, // CONMEBOL Libertadores
    11, // CONMEBOL Sudamericana
    12, // CAF Champions League
    20, // CAF Confederation Cup
    16, // CONCACAF Champions League
    17, // AFC Champions League Elite
    18, // AFC Champions League Two
    768, // Arab Club Champions Cup
    772, // Leagues Cup
    15, // FIFA Club World Cup
    1168 // FIFA Intercontinental Cup
]);

const SUPER_CUP_IDS = new Set([
    531, // UEFA Super Cup
    533 // CAF Super Cup
]);

const TIER_OVERRIDES = {
    62: 2, // Ligue 2
    40: 2, // Championship
    41: 3, // League One
    42: 4, // League Two
    79: 2, // 2. Bundesliga
    80: 3, // 3. Liga
    72: 2, // Brazil Serie B
    75: 3, // Brazil Serie C
    141: 2, // Segunda División
    136: 2, // Serie B
    89: 2, // Eerste Divisie
    95: 2, // Segunda Liga
    114: 2, // Superettan
    145: 2, // Challenger Pro League
    204: 2, // Turkey 1. Lig
    219: 2, // Austria 2. Liga
    236: 2, // Russia First League
    293: 2, // K League 2
    255: 2 // USL Championship
};

// Brazilian state championships are not a national tier.
const STATE_LEAGUE_PATTERN = /paulista|carioca|pernambucano|mineiro|ga[uú]cho|baiano|cearense|paranaense/i;
const WOMEN_PATTERN = /women|feminine|femenin|frauen|\bwsl\b|nwsl|damallsvenskan|liga f\b/i;
const YOUTH_PATTERN = /\bu-?1\d\b|\bu-?2\d\b|olympics|youth/i;
const FRIENDLY_PATTERN = /friendl/i;
const SUPER_CUP_PATTERN = /super cup|supercopa|supercoppa|community shield|troph[ée]e des champions|supertaça/i;
const CONTINENTAL_PATTERN = new RegExp(
    [
        'champions league', 'europa', 'conference league', 'libertadores', 'sudamericana',
        'confederation cup', 'club world cup', 'intercontinental cup', 'arab club', 'leagues cup'
    ].join('|'),
    'i'
);

function deriveGender(leagueName) {
    return WOMEN_PATTERN.test(leagueName) ? 'women' : 'men';
}

function deriveAgeGroup(leagueName) {
    return YOUTH_PATTERN.test(leagueName) ? 'youth' : 'senior';
}

function deriveKind(league, countryName) {
    const id = Number(league.id);
    const leagueName = league.name || '';

    if (league.type === 'League') {
        return 'league';
    }

    if (FRIENDLY_PATTERN.test(leagueName)) {
        return 'friendly';
    }

    if (SUPER_CUP_IDS.has(id) || SUPER_CUP_PATTERN.test(leagueName)) {
        return 'super_cup';
    }

    if (CONTINENTAL_CLUB_IDS.has(id) || CONTINENTAL_PATTERN.test(leagueName)) {
        return 'continental';
    }

    if (countryName === 'World') {
        return 'international';
    }

    return 'cup';
}

function deriveTier(league, kind) {
    if (kind !== 'league') {
        return null;
    }

    const id = Number(league.id);

    if (TIER_OVERRIDES[id] != null) {
        return TIER_OVERRIDES[id];
    }

    if (STATE_LEAGUE_PATTERN.test(league.name || '')) {
        return null;
    }

    return 1;
}

function deriveLeagueMeta(league, countryName) {
    const leagueName = league.name || '';
    const kind = deriveKind(league, countryName);

    return {
        kind,
        tier: deriveTier(league, kind),
        gender: deriveGender(leagueName),
        age_group: deriveAgeGroup(leagueName)
    };
}

module.exports = {
    deriveLeagueMeta
};
