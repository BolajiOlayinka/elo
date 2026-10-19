'use strict';

const { NotFoundException } = require('../../shared/exceptions');
const board = require('./board');
const repository = require('./repository');

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

async function ratings(query) {
    const snapshot = await board.ensure(query.refresh);
    const rows = snapshot[query.entity] || [];
    const page = paginate(rows, query);

    return {
        ...page,
        meta: {
            ...page.meta,
            entity: query.entity,
            builtAt: snapshot.builtAt,
            matches: snapshot.matches
        }
    };
}

async function profile(type, id) {
    const snapshot = await board.ensure(false);
    const row = snapshot.index.get(`${type}:${id}`);

    if (!row) {
        throw new NotFoundException('Profile not found');
    }

    const rivals = (snapshot[type] || [])
        .filter((item) => item.id !== row.id)
        .slice(Math.max(0, row.rank - 2), row.rank + 2)
        .filter((item) => item.id !== row.id)
        .slice(0, 3);

    return { ...row, rivals };
}

async function profiles(query) {
    return ratings({ ...query, entity: query.entity });
}

async function leagues(query) {
    const [rows, snapshot] = await Promise.all([
        repository.listLeagues(),
        board.ensure(false).catch(() => null)
    ]);
    const elo = new Map((snapshot?.leagues || []).map((row) => [Number(row.id), row]));
    const shaped = rows.map((row) => ({
        ...publicLeague(row),
        elo: elo.get(row.id)?.eloNum ?? null,
        rank: elo.get(row.id)?.rank ?? null
    }));

    return paginate(shaped, query);
}

async function league(id) {
    const row = await repository.getLeague(id);

    if (!row || row.kind !== 'league') {
        throw new NotFoundException('League not found');
    }

    const snapshot = await board.ensure(false).catch(() => null);

    return {
        ...publicLeague(row),
        rating: snapshot?.index.get(`leagues:${id}`) || null
    };
}

async function competitions(query) {
    const snapshot = await board.ensure(false).catch(() => null);
    const rows = snapshot
        ? snapshot.competitions
        : (await repository.listCompetitions()).map(publicLeague);

    return paginate(rows, query);
}

async function competition(id) {
    const row = await repository.getLeague(id);

    if (!row || row.kind === 'league') {
        throw new NotFoundException('Competition not found');
    }

    const snapshot = await board.ensure(false).catch(() => null);
    const rated = (snapshot?.competitions || []).find((item) => item.id === row.id);

    return rated || publicLeague(row);
}

async function coaches(query) {
    const [rows, snapshot] = await Promise.all([
        repository.listCoaches(),
        board.ensure(false).catch(() => null)
    ]);
    const elo = new Map((snapshot?.coaches || []).map((row) => [Number(row.id), row]));
    const shaped = rows.map((row) => ({
        id: row.id,
        name: row.name,
        nationality: row.nationality,
        birthDate: row.birth_date,
        photo: row.photo_url,
        club: row.team_name,
        elo: elo.get(row.id)?.eloNum ?? null,
        rank: elo.get(row.id)?.rank ?? null
    }));

    return paginate(shaped, query);
}

async function coach(id) {
    const row = await repository.getCoach(id);

    if (!row) {
        throw new NotFoundException('Coach not found');
    }

    const snapshot = await board.ensure(false).catch(() => null);

    return {
        id: row.id,
        name: row.name,
        nationality: row.nationality,
        birthDate: row.birth_date,
        birthPlace: row.birth_place,
        photo: row.photo_url,
        club: row.team_name,
        tenures: row.tenures,
        rating: snapshot?.index.get(`coaches:${id}`) || null
    };
}

module.exports = {
    ratings,
    profile,
    profiles,
    leagues,
    league,
    competitions,
    competition,
    coaches,
    coach
};
