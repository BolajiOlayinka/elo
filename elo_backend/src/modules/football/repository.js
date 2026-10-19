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

const BOARD_ENTITIES = ['players', 'keepers', 'coaches', 'leagues', 'countries', 'competitions'];

async function catalogCounts() {
    const [tracked, scoped, leagues, matches, ratedPlayers, players, years] = await Promise.all([
        db('matches')
            .whereIn('status_short', FINISHED)
            .whereNotNull('home_goals')
            .countDistinct('league_id as count')
            .first(),
        db('leagues').where({ kind: 'league', in_scope: true }).count('* as count').first(),
        db('leagues').where({ kind: 'league' }).count('* as count').first(),
        db('matches')
            .whereIn('status_short', FINISHED)
            .whereNotNull('home_goals')
            .whereNotNull('away_goals')
            .count('* as count')
            .first(),
        db('player_season_stats').countDistinct('player_id as count').first(),
        db('players').count('* as count').first(),
        db('matches').whereNotNull('season_year').min('season_year as min').max('season_year as max').first()
    ]);

    return {
        leagues: Number(tracked?.count) || Number(scoped?.count) || Number(leagues?.count) || 0,
        matches: Number(matches?.count) || 0,
        players: Number(ratedPlayers?.count) || Number(players?.count) || 0,
        yearFrom: years?.min == null ? null : Number(years.min),
        yearTo: years?.max == null ? null : Number(years.max)
    };
}

async function getBoardMeta() {
    return db('rating_board_meta').where({ id: 'current' }).first();
}

async function setBoardMeta(payload) {
    const row = {
        id: 'current',
        status: payload.status,
        built_at: payload.built_at || null,
        matches: payload.matches || 0,
        error: payload.error || null,
        updated_at: new Date()
    };
    const existing = await getBoardMeta();

    if (existing) {
        return db('rating_board_meta').where({ id: 'current' }).update(row);
    }

    return db('rating_board_meta').insert(row);
}

function parsePayload(value) {
    if (!value) {
        return null;
    }

    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    return value;
}

async function replaceBoard(snapshot) {
    await db.transaction(async (trx) => {
        await trx('rating_board').del();

        for (const entity of BOARD_ENTITIES) {
            const rows = snapshot[entity] || [];
            const chunkSize = 250;

            for (let index = 0; index < rows.length; index += chunkSize) {
                const chunk = rows.slice(index, index + chunkSize).map((row) => ({
                    entity,
                    entity_id: Number(row.id),
                    rank: Number(row.rank) || 0,
                    name: row.name || '',
                    payload: JSON.stringify(row),
                    updated_at: new Date()
                })).filter((row) => Number.isFinite(row.entity_id));

                if (chunk.length) {
                    await trx('rating_board').insert(chunk);
                }
            }
        }

        await trx('rating_board_meta').del();
        await trx('rating_board_meta').insert({
            id: 'current',
            status: 'ready',
            built_at: snapshot.builtAt,
            matches: snapshot.matches || 0,
            error: null,
            updated_at: new Date()
        });
    });
}

async function listBoard({ entity, page, limit, q }) {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 20);
    const query = db('rating_board').where({ entity });
    const needle = String(q || '').trim();

    if (needle) {
        query.andWhere('name', 'ilike', `%${needle.replace(/[%_]/g, '')}%`);
    }

    const [totalRow, rows] = await Promise.all([
        query.clone().count('* as count').first(),
        query.clone()
            .select('payload')
            .orderBy('rank', 'asc')
            .limit(pageSize)
            .offset((currentPage - 1) * pageSize)
    ]);
    const total = Number(totalRow?.count) || 0;

    return {
        data: rows.map((row) => parsePayload(row.payload)).filter(Boolean),
        meta: {
            page: currentPage,
            limit: pageSize,
            total,
            pages: Math.max(1, Math.ceil(total / pageSize))
        }
    };
}

async function getBoardRow(entity, id) {
    const row = await db('rating_board')
        .where({ entity, entity_id: Number(id) })
        .first();

    return parsePayload(row?.payload);
}

async function listBoardRivals(entity, rank, id) {
    const rows = await db('rating_board')
        .where({ entity })
        .andWhere('rank', '>=', Math.max(1, rank - 2))
        .andWhere('rank', '<=', rank + 2)
        .andWhereNot('entity_id', Number(id))
        .orderBy('rank', 'asc')
        .limit(3)
        .select('payload');

    return rows.map((row) => parsePayload(row.payload)).filter(Boolean);
}

async function boardByIds(entity, ids) {
    if (!ids.length) {
        return [];
    }

    const rows = await db('rating_board')
        .where({ entity })
        .whereIn('entity_id', ids)
        .select('entity_id', 'payload');

    return rows.map((row) => ({
        id: row.entity_id,
        row: parsePayload(row.payload)
    }));
}

async function boardHasRows(entity) {
    const row = await db('rating_board').where({ entity }).count('* as count').first();

    return Number(row?.count) > 0;
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
    loadLatestStandingTeams,
    catalogCounts,
    getBoardMeta,
    setBoardMeta,
    replaceBoard,
    listBoard,
    getBoardRow,
    listBoardRivals,
    boardByIds,
    boardHasRows
};
