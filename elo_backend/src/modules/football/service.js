'use strict';

const { NotFoundException } = require('../../shared/exceptions');
const board = require('./board');
const remember = require('./remember');
const repository = require('./repository');

let boardBuild = null;

function publicLeague(row) {
    return {
        id: row.id,
        name: row.name,
        kind: row.kind,
        tier: row.tier,
        gender: row.gender,
        ageGroup: row.age_group,
        inScope: row.in_scope,
        logo: row.logo_url,
        country: row.country_name,
        countryCode: row.country_code ? String(row.country_code).toLowerCase() : null
    };
}

function paginate(rows, { page, limit, q }) {
    const needle = String(q || '').trim().toLowerCase();
    const filtered = needle
        ? rows.filter((row) => [row.name, row.club, row.place, row.country, row.nationality, row.kind]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle))
        : rows;
    const start = (page - 1) * limit;

    return {
        data: filtered.slice(start, start + limit),
        meta: {
            page,
            limit,
            total: filtered.length,
            pages: Math.max(1, Math.ceil(filtered.length / limit))
        }
    };
}

function startBoardBuild() {
    if (boardBuild) {
        return boardBuild;
    }

    boardBuild = repository.setBoardMeta({ status: 'building' })
        .then(() => board.build())
        .then((snapshot) => repository.replaceBoard(snapshot))
        .then(() => remember.clear('ratings:*'))
        .catch(async (error) => {
            await repository.setBoardMeta({
                status: 'error',
                error: error.message
            });
            throw error;
        })
        .finally(() => {
            boardBuild = null;
        });

    return boardBuild;
}

async function ratings(query) {
    if (query.refresh) {
        startBoardBuild();
    }

    const cacheKey = `ratings:${query.entity}:${query.page}:${query.limit}:${query.q || ''}`;

    if (!query.refresh) {
        const cached = await remember.get(cacheKey);

        if (cached) {
            return cached;
        }
    }

    const [meta, hasRows] = await Promise.all([
        repository.getBoardMeta(),
        repository.boardHasRows(query.entity)
    ]);

    if (!hasRows) {
        startBoardBuild();

        return {
            data: [],
            meta: {
                page: query.page,
                limit: query.limit,
                total: 0,
                pages: 1,
                entity: query.entity,
                builtAt: meta?.built_at || null,
                matches: meta?.matches || 0,
                building: true
            }
        };
    }

    const page = await repository.listBoard(query);
    const result = {
        ...page,
        meta: {
            ...page.meta,
            entity: query.entity,
            builtAt: meta?.built_at || null,
            matches: meta?.matches || 0,
            building: meta?.status === 'building'
        }
    };

    await remember.set(cacheKey, result, 90);

    return result;
}

async function profile(type, id) {
    const row = await repository.getBoardRow(type, id);

    if (!row) {
        const hasBoard = await repository.boardHasRows(type);

        if (!hasBoard) {
            startBoardBuild();
        }

        throw new NotFoundException('Profile not found');
    }

    const rivals = await repository.listBoardRivals(type, row.rank, id);
    const trophies = await repository.listTrophies(type, id);

    return {
        ...row,
        rivals,
        trophies: trophies.map((trophy) => ({
            competition: trophy.competition_name,
            country: trophy.country,
            season: trophy.season,
            place: trophy.place
        }))
    };
}

async function stats() {
    const cached = await remember.get('catalog:stats:v2');

    if (cached) {
        return cached;
    }

    const counts = await repository.catalogCounts();
    const span = counts.yearFrom != null && counts.yearTo != null
        ? Math.max(1, counts.yearTo - counts.yearFrom + 1)
        : 0;
    const result = {
        leagues: counts.leagues,
        matches: counts.matches,
        players: counts.players,
        years: {
            from: counts.yearFrom,
            to: counts.yearTo,
            span
        }
    };

    await remember.set('catalog:stats:v2', result, 120);

    return result;
}

async function profiles(query) {
    return ratings({ ...query, entity: query.entity });
}

async function ratingLookup(entity, ids) {
    const rows = await repository.boardByIds(entity, ids);
    const map = new Map();

    rows.forEach((item) => {
        if (item.row) {
            map.set(Number(item.id), item.row);
        }
    });

    return map;
}

async function leagues(query) {
    const rows = await repository.listLeagues();
    const page = paginate(rows.map(publicLeague), query);
    const elo = await ratingLookup('leagues', page.data.map((row) => row.id));

    return {
        ...page,
        data: page.data.map((row) => ({
            ...row,
            elo: elo.get(row.id)?.eloNum ?? null,
            rank: elo.get(row.id)?.rank ?? null
        }))
    };
}

async function league(id) {
    const row = await repository.getLeague(id);

    if (!row || row.kind !== 'league') {
        throw new NotFoundException('League not found');
    }

    return {
        ...publicLeague(row),
        rating: await repository.getBoardRow('leagues', id)
    };
}

async function competitions(query) {
    const cached = await repository.listBoard({
        entity: 'competitions',
        page: query.page,
        limit: query.limit,
        q: query.q
    }).catch(() => null);

    if (cached?.meta?.total) {
        return cached;
    }

    const rows = (await repository.listCompetitions()).map(publicLeague);

    return paginate(rows, query);
}

async function competition(id) {
    const rated = await repository.getBoardRow('competitions', id);

    if (rated) {
        return rated;
    }

    const row = await repository.getLeague(id);

    if (!row || row.kind === 'league') {
        throw new NotFoundException('Competition not found');
    }

    return publicLeague(row);
}

async function coaches(query) {
    const rows = await repository.listCoaches();
    const page = paginate(rows, query);
    const elo = await ratingLookup('coaches', page.data.map((row) => row.id));

    return {
        ...page,
        data: page.data.map((row) => ({
            id: row.id,
            name: row.name,
            nationality: row.nationality,
            birthDate: row.birth_date,
            photo: row.photo_url,
            club: row.team_name,
            elo: elo.get(row.id)?.eloNum ?? null,
            rank: elo.get(row.id)?.rank ?? null
        }))
    };
}

async function coach(id) {
    const row = await repository.getCoach(id);

    if (!row) {
        throw new NotFoundException('Coach not found');
    }

    return {
        id: row.id,
        name: row.name,
        nationality: row.nationality,
        birthDate: row.birth_date,
        birthPlace: row.birth_place,
        photo: row.photo_url,
        club: row.team_name,
        tenures: row.tenures,
        rating: await repository.getBoardRow('coaches', id)
    };
}

module.exports = {
    ratings,
    profile,
    profiles,
    stats,
    leagues,
    league,
    competitions,
    competition,
    coaches,
    coach
};
