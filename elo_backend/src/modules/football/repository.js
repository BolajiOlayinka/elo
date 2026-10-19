'use strict';

const db = require('../../infra/database');

const FINISHED = ['FT', 'AET', 'PEN'];

function listCompetitionsQuery(kind) {
    const query = db('leagues as l')
        .leftJoin('countries as c', 'c.id', 'l.country_id')
        .select(
            'l.id',
            'l.name',
            'l.type',
            'l.kind',
            'l.tier',
            'l.gender',
            'l.age_group',
            'l.in_scope',
            'l.logo_url',
            'c.name as country_name',
            'c.code as country_code'
        )
        .orderBy('l.name');

    if (kind) {
        query.where('l.kind', kind);
    }

    return query;
}

async function listLeagues() {
    return listCompetitionsQuery('league');
}

async function listCompetitions() {
    return db('leagues as l')
        .leftJoin('countries as c', 'c.id', 'l.country_id')
        .select(
            'l.id',
            'l.name',
            'l.type',
            'l.kind',
            'l.tier',
            'l.gender',
            'l.age_group',
            'l.in_scope',
            'l.logo_url',
            'c.name as country_name',
            'c.code as country_code'
        )
        .whereNot('l.kind', 'league')
        .orderBy('l.name');
}

async function getLeague(id) {
    return db('leagues as l')
        .leftJoin('countries as c', 'c.id', 'l.country_id')
        .select(
            'l.id',
            'l.name',
            'l.type',
            'l.kind',
            'l.tier',
            'l.gender',
            'l.age_group',
            'l.in_scope',
            'l.logo_url',
            'c.name as country_name',
            'c.code as country_code'
        )
        .where('l.id', id)
        .first();
}

async function listCoaches() {
    return db('coaches as c')
        .leftJoin('teams as t', 't.id', 'c.current_team_id')
        .select(
            'c.id',
            'c.name',
            'c.nationality',
            'c.birth_date',
            'c.photo_url',
            'c.current_team_id',
            't.name as team_name'
        )
        .orderBy('c.name');
}

async function getCoach(id) {
    const coach = await db('coaches as c')
        .leftJoin('teams as t', 't.id', 'c.current_team_id')
        .select(
            'c.id',
            'c.name',
            'c.first_name',
            'c.last_name',
            'c.nationality',
            'c.birth_date',
            'c.birth_place',
            'c.photo_url',
            'c.current_team_id',
            't.name as team_name'
        )
        .where('c.id', id)
        .first();

    if (!coach) {
        return null;
    }

    const tenures = await db('coach_tenures')
        .select('team_id', 'team_name', 'started_on', 'ended_on')
        .where('coach_id', id)
        .orderBy('started_on', 'desc');

    return { ...coach, tenures };
}

async function getPlayer(id) {
    return db('players')
        .select(
            'id',
            'name',
            'first_name',
            'last_name',
            'birth_date',
            'nationality',
            'height',
            'photo_url'
        )
        .where('id', id)
        .first();
}

async function loadFinishedMatches() {
    return db('matches as m')
        .join('leagues as l', 'l.id', 'm.league_id')
        .join('teams as ht', 'ht.id', 'm.home_team_id')
        .join('teams as at', 'at.id', 'm.away_team_id')
        .select(
            'm.id',
            'm.kickoff_at',
            'm.league_id',
            'm.season_year',
            'm.home_team_id',
            'm.away_team_id',
            'm.home_goals',
            'm.away_goals',
            'm.is_neutral',
            'l.kind',
            'l.gender',
            'l.age_group',
            'l.name as league_name',
            'ht.name as home_name',
            'ht.is_national as home_national',
            'ht.country_name as home_country',
            'at.name as away_name',
            'at.is_national as away_national',
            'at.country_name as away_country'
        )
        .whereIn('m.status_short', FINISHED)
        .whereNotNull('m.home_goals')
        .whereNotNull('m.away_goals')
        .orderByRaw('m.kickoff_at asc nulls last, m.id asc');
}

async function loadPlayerSeasons() {
    return db('player_season_stats as s')
        .join('players as p', 'p.id', 's.player_id')
        .join('teams as t', 't.id', 's.team_id')
        .leftJoin('countries as c', db.raw('lower(c.name) = lower(p.nationality)'))
        .select(
            's.player_id',
            's.team_id',
            's.league_id',
            's.season_year',
            's.position',
            's.minutes',
            's.appearances',
            's.goals',
            's.assists',
            's.passes_key',
            's.tackles_total',
            's.interceptions',
            's.blocks',
            's.duels_won',
            's.yellow_cards',
            's.red_cards',
            's.penalties_scored',
            's.penalties_saved',
            's.saves',
            's.goals_conceded',
            'p.name',
            'p.nationality',
            'p.birth_date',
            'p.height',
            'p.photo_url',
            't.name as team_name',
            'c.code as country_code'
        )
        .where('s.minutes', '>', 0);
}

async function loadMatchCoaches() {
    return db('match_coaches')
        .select('match_id', 'team_id', 'coach_id')
        .whereNotNull('coach_id');
}

async function loadCoachIdentities() {
    return db('coaches as c')
        .leftJoin('teams as t', 't.id', 'c.current_team_id')
        .leftJoin('countries as n', db.raw('lower(n.name) = lower(c.nationality)'))
        .select(
            'c.id',
            'c.name',
            'c.nationality',
            'c.birth_date',
            'c.photo_url',
            't.name as team_name',
            'n.code as country_code'
        );
}

async function loadLeagueDirectory() {
    return db('leagues as l')
        .leftJoin('countries as c', 'c.id', 'l.country_id')
        .select(
            'l.id',
            'l.name',
            'l.kind',
            'l.tier',
            'l.gender',
            'l.age_group',
            'l.in_scope',
            'l.logo_url',
            'c.name as country_name',
            'c.code as country_code'
        );
}

async function loadLatestStandingTeams() {
    const latest = db('standings')
        .select('league_id')
        .max('season_year as season_year')
        .groupBy('league_id')
        .as('latest');

    return db('standings as s')
        .join(latest, function joinLatest() {
            this.on('latest.league_id', 's.league_id').andOn('latest.season_year', 's.season_year');
        })
        .select('s.league_id', 's.team_id', 's.season_year');
}

module.exports = {
    listLeagues,
    listCompetitions,
    getLeague,
    listCoaches,
    getCoach,
    getPlayer,
    loadFinishedMatches,
    loadPlayerSeasons,
    loadMatchCoaches,
    loadCoachIdentities,
    loadLeagueDirectory,
    loadLatestStandingTeams
};
