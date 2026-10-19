'use strict';

/* eslint-disable no-use-before-define */

const engine = require('./rating-engine');
const repository = require('./repository');

const ENGINE = {
    startRating: 1500,
    kFactor: 20,
    homeAdvantage: 60,
    scaleAnchor: 1500,
    qualityScale: 800,
    qualityFloor: 0.45,
    qualityCap: 2.5,
    eloSigma: 200,
    minutesPrior: 1200,
    minutesFloor: 900,
    drawRate: 0.28,
    useGoalDifference: true
};

const OUTFIELD = {
    st: {
        npGoals: 8, penalties: 3, assists: 5, keyPasses: 1.2,
        tacklesWon: 0.8, interceptions: 0.8, blocks: 0.5, duelsWon: 1, yellow: 1.5, red: 6
    },
    cm: {
        npGoals: 4, penalties: 1.5, assists: 5, keyPasses: 1.8,
        tacklesWon: 2.2, interceptions: 2.2, blocks: 1, duelsWon: 1.2, yellow: 1.5, red: 6
    },
    cb: {
        npGoals: 2, penalties: 1, assists: 1, keyPasses: 0.4,
        tacklesWon: 3, interceptions: 3, blocks: 2.8, duelsWon: 2.5, yellow: 1.5, red: 6
    }
};

const KEEPER = { penaltiesSaved: 8, yellow: 1.5, red: 8 };
const COACH = { overperformance: 2.5, level: 8, yellow: 0, red: 0 };
const YOUTH_NAME = /\bU-?\d{2}\b|Olympic/i;

let cached = null;
let pending = null;

function num(value) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

function roleOf(position) {
    const value = String(position || '').toLowerCase();

    if (value.includes('goal') || value === 'g') {
        return 'gk';
    }

    if (value.includes('def') || value === 'd') {
        return 'cb';
    }

    if (value.includes('mid') || value === 'm') {
        return 'cm';
    }

    if (value.includes('att') || value.includes('forw') || value === 'f' || value === 'a') {
        return 'st';
    }

    return 'cm';
}

function initials(label) {
    const parts = String(label || '').split(/\s+/).filter(Boolean);

    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
}

function ageOf(birthDate) {
    if (!birthDate) {
        return null;
    }

    const born = new Date(birthDate);

    if (Number.isNaN(born.getTime())) {
        return null;
    }

    const now = new Date();
    let age = now.getUTCFullYear() - born.getUTCFullYear();
    const beforeBirthday = now.getUTCMonth() < born.getUTCMonth()
        || (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate());

    if (beforeBirthday) {
        age -= 1;
    }

    return age;
}

function round(value) {
    return Math.round(num(value));
}

function addOpp(buckets, teamId, leagueId, season, elo) {
    const key = `${teamId}:${leagueId}:${season}`;
    const bucket = buckets.get(key) || { sum: 0, n: 0 };

    bucket.sum += elo;
    bucket.n += 1;
    buckets.set(key, bucket);
}

function meanOpp(buckets, teamId, leagueId, season) {
    const bucket = buckets.get(`${teamId}:${leagueId}:${season}`);

    if (!bucket || !bucket.n) {
        return ENGINE.startRating;
    }

    return bucket.sum / bucket.n;
}

function walkMatches(matches, coachByMatch) {
    const start = ENGINE.startRating;
    const ratings = {};
    const names = {};
    const nationals = {};
    const opp = new Map();
    const coaches = new Map();
    const leagueTeams = new Map();

    for (const match of matches) {
        names[match.home_team_id] = match.home_name;
        names[match.away_team_id] = match.away_name;
        noteSide(nationals, match.home_team_id, match.home_name, match.home_country, match);
        noteSide(nationals, match.away_team_id, match.away_name, match.away_country, match);

        ratings[match.home_team_id] ??= start;
        ratings[match.away_team_id] ??= start;

        const home = ratings[match.home_team_id];
        const away = ratings[match.away_team_id];
        const neutral = match.is_neutral === true
            || (match.is_neutral == null && (match.kind === 'international' || match.kind === 'continental'));

        addOpp(opp, match.home_team_id, match.league_id, match.season_year, away);
        addOpp(opp, match.away_team_id, match.league_id, match.season_year, home);
        creditCoach(coaches, coachByMatch, match, home, away, neutral);

        const seasonTeams = leagueTeams.get(match.league_id) || { year: match.season_year, teams: new Set() };

        if (match.season_year > seasonTeams.year) {
            seasonTeams.year = match.season_year;
            seasonTeams.teams = new Set();
        }

        if (match.season_year === seasonTeams.year) {
            seasonTeams.teams.add(match.home_team_id);
            seasonTeams.teams.add(match.away_team_id);
        }

        leagueTeams.set(match.league_id, seasonTeams);

        const expectedHome = engine.expectedScore(home, away, neutral ? 0 : ENGINE.homeAdvantage);
        const actual = match.home_goals > match.away_goals ? 1 : match.home_goals < match.away_goals ? 0 : 0.5;
        const k = engine.competitionK({ competition: match.kind === 'league' ? 'league' : match.kind }, ENGINE)
            * engine.goalDiffFactor(match.home_goals, match.away_goals, ENGINE);

        ratings[match.home_team_id] = home + k * (actual - expectedHome);
        ratings[match.away_team_id] = away + k * ((1 - actual) - (1 - expectedHome));
    }

    return { ratings, names, nationals, opp, coaches, leagueTeams };
}

function noteSide(nationals, teamId, sideName, country, match) {
    const women = match.gender === 'women';
    const youth = match.age_group === 'youth';
    const previous = nationals[teamId];

    if (!previous) {
        nationals[teamId] = {
            national: Boolean(match.home_team_id === teamId ? match.home_national : match.away_national),
            name: sideName,
            country,
            women,
            youth
        };

        return;
    }

    previous.women = previous.women && women;
    previous.youth = previous.youth && youth;
}

function creditCoach(coaches, coachByMatch, match, homeElo, awayElo, neutral) {
    const homeCoach = coachByMatch.get(`${match.id}:${match.home_team_id}`);
    const awayCoach = coachByMatch.get(`${match.id}:${match.away_team_id}`);
    const homeActual = tablePoints(match.home_goals, match.away_goals);
    const awayActual = tablePoints(match.away_goals, match.home_goals);

    addCoach(coaches, homeCoach, homeElo, engine.expectedPointsFromMatch(
        homeElo,
        awayElo,
        { isHome: true, neutral },
        ENGINE
    ), homeActual);
    addCoach(coaches, awayCoach, awayElo, engine.expectedPointsFromMatch(
        awayElo,
        homeElo,
        { isHome: false, neutral },
        ENGINE
    ), awayActual);
}

function tablePoints(goalsFor, goalsAgainst) {
    if (goalsFor > goalsAgainst) {
        return 3;
    }

    if (goalsFor === goalsAgainst) {
        return 1;
    }

    return 0;
}

function addCoach(coaches, coachId, clubElo, expected, actual) {
    if (!coachId) {
        return;
    }

    const row = coaches.get(coachId) || { actual: 0, expected: 0, eloSum: 0, matches: 0 };

    row.actual += actual;
    row.expected += expected;
    row.eloSum += clubElo;
    row.matches += 1;
    coaches.set(coachId, row);
}

function mergeSeason(groups, row, role, opp) {
    const key = `${row.player_id}:${role}:${row.season_year}`;
    const current = groups.get(key) || {
        id: row.player_id,
        name: row.name,
        position: role,
        entity: role === 'gk' ? 'keeper' : 'player',
        season: row.season_year,
        minutes: 0,
        appearances: 0,
        goals: 0,
        assists: 0,
        eloWeight: 0,
        eloSum: 0,
        club: row.team_name,
        clubMinutes: 0,
        nationality: row.nationality,
        countryCode: row.country_code,
        birthDate: row.birth_date,
        height: row.height,
        photo: row.photo_url,
        stats: emptyStats()
    };
    const minutes = num(row.minutes);
    const opponent = meanOpp(opp, row.team_id, row.league_id, row.season_year);

    current.minutes += minutes;
    current.appearances += num(row.appearances);
    current.goals += num(row.goals);
    current.assists += num(row.assists);
    current.eloSum += opponent * minutes;
    current.eloWeight += minutes;
    addStats(current.stats, row);

    if (minutes >= current.clubMinutes) {
        current.club = row.team_name;
        current.clubMinutes = minutes;
    }

    groups.set(key, current);
}

function emptyStats() {
    return {
        npGoals: 0,
        penalties: 0,
        assists: 0,
        keyPasses: 0,
        tacklesWon: 0,
        interceptions: 0,
        blocks: 0,
        duelsWon: 0,
        yellow: 0,
        red: 0,
        penaltiesSaved: 0,
        saves: 0,
        goalsConceded: 0
    };
}

function addStats(stats, row) {
    const goals = num(row.goals);
    const penalties = num(row.penalties_scored);

    stats.npGoals += Math.max(0, goals - penalties);
    stats.penalties += penalties;
    stats.assists += num(row.assists);
    stats.keyPasses += num(row.passes_key);
    stats.tacklesWon += num(row.tackles_total);
    stats.interceptions += num(row.interceptions);
    stats.blocks += num(row.blocks);
    stats.duelsWon += num(row.duels_won);
    stats.yellow += num(row.yellow_cards);
    stats.red += num(row.red_cards);
    stats.penaltiesSaved += num(row.penalties_saved);
    stats.saves += num(row.saves);
    stats.goalsConceded += num(row.goals_conceded);
}

function ratePeople(groups) {
    const bySeason = new Map();

    for (const row of groups.values()) {
        const opponentElo = row.eloWeight ? row.eloSum / row.eloWeight : ENGINE.startRating;
        const weights = row.position === 'gk' ? KEEPER : OUTFIELD[row.position];
        const scored = engine.performanceFromStats({
            stats: row.stats,
            weights,
            minutes: row.minutes,
            opponentElo
        }, ENGINE);
        const bucket = bySeason.get(row.season) || [];

        bucket.push({ ...row, ...scored, opponentElo });
        bySeason.set(row.season, bucket);
    }

    const seasons = [];

    for (const rows of bySeason.values()) {
        seasons.push(...engine.mapRatesToElo(rows, ENGINE));
    }

    return seasons;
}

function careerOf(seasons, type) {
    const people = new Map();

    for (const row of seasons) {
        if ((type === 'keepers') !== (row.position === 'gk')) {
            continue;
        }

        const person = people.get(row.id) || {
            ...row,
            type,
            minutes: 0,
            eloSum: 0,
            peakEloNum: 0,
            goals: 0,
            assists: 0,
            matches: 0,
            seasons: []
        };

        person.minutes += row.minutes;
        person.eloSum += row.playerElo * row.minutes;
        person.goals += row.goals;
        person.assists += row.assists;
        person.matches += row.appearances;
        person.peakEloNum = Math.max(person.peakEloNum, row.playerElo);
        person.seasons.push({
            year: String(row.season),
            club: row.club,
            elo: round(row.playerElo),
            minutes: row.minutes,
            goals: row.goals,
            assists: row.assists
        });

        if (row.minutes >= (person.clubMinutes || 0)) {
            person.club = row.club;
            person.clubMinutes = row.minutes;
            person.photo = row.photo;
            person.nationality = row.nationality;
            person.countryCode = row.countryCode;
        }

        people.set(row.id, person);
    }

    return [...people.values()].map((person) => shapePerson(person));
}

function shapePerson(person) {
    const elo = person.minutes ? person.eloSum / person.minutes : person.playerElo;
    const seasons = person.seasons
        .filter((season) => season.year !== '0')
        .sort((left, right) => left.year.localeCompare(right.year));

    return card({
        id: person.id,
        type: person.type,
        name: person.name,
        place: person.nationality,
        flag: person.countryCode,
        club: person.club,
        role: roleLabel(person.position),
        photo: person.photo,
        age: ageOf(person.birthDate),
        height: person.height,
        elo,
        peakElo: person.peakEloNum,
        goals: person.goals,
        assists: person.assists,
        matches: person.matches,
        seasons,
        timeline: seasons.map((season) => season.elo)
    });
}

function roleLabel(position) {
    if (position === 'gk') {
        return 'Goalkeeper';
    }

    if (position === 'cb') {
        return 'Defender';
    }

    if (position === 'cm') {
        return 'Midfielder';
    }

    return 'Forward';
}

function card(row) {
    const elo = round(row.elo);
    const peak = round(row.peakElo || row.elo);

    return {
        id: String(row.id),
        type: row.type,
        name: row.name,
        initials: initials(row.name),
        place: row.place || null,
        flag: row.flag ? String(row.flag).toLowerCase() : null,
        club: row.club || null,
        role: row.role,
        photo: row.photo || null,
        age: row.age ?? null,
        height: row.height || null,
        career: elo.toLocaleString('en-GB'),
        careerNum: elo,
        peak: peak.toLocaleString('en-GB'),
        peakNum: peak,
        era: row.era || null,
        elo: elo.toLocaleString('en-GB'),
        eloNum: elo,
        peakElo: peak.toLocaleString('en-GB'),
        peakEloNum: peak,
        goals: row.goals ?? null,
        assists: row.assists ?? null,
        matches: row.matches ?? null,
        seasons: row.seasons || [],
        timeline: row.timeline || [],
        kind: row.kind || null,
        tier: row.tier ?? null,
        gender: row.gender || null
    };
}

function rank(rows) {
    return rows
        .sort((left, right) => right.eloNum - left.eloNum || left.name.localeCompare(right.name))
        .map((row, index) => ({ ...row, rank: index + 1 }));
}

function leagueCards(directory, ratings, standingTeams, leagueTeams) {
    const members = new Map();

    for (const row of standingTeams) {
        const set = members.get(row.league_id) || new Set();

        set.add(row.team_id);
        members.set(row.league_id, set);
    }

    return directory.filter((league) => league.kind === 'league').map((league) => {
        const fromStandings = members.get(league.id);
        const fromMatches = leagueTeams.get(league.id)?.teams;
        const teamIds = fromStandings && fromStandings.size ? fromStandings : (fromMatches || new Set());
        const elos = [...teamIds].map((id) => ratings[id]).filter((value) => value != null);

        if (!elos.length) {
            return null;
        }

        const mean = elos.reduce((sum, value) => sum + value, 0) / elos.length;
        const peak = Math.max(...elos);

        return card({
            id: league.id,
            type: 'leagues',
            name: league.name,
            place: league.country_name,
            flag: league.country_code,
            role: league.tier ? `Tier ${league.tier}` : 'League',
            elo: mean,
            peakElo: peak,
            matches: elos.length,
            kind: league.kind,
            tier: league.tier,
            gender: league.gender,
            photo: league.logo_url
        });
    }).filter(Boolean);
}

function competitionCards(directory, ratings, leagueTeams) {
    return directory.filter((league) => league.kind && league.kind !== 'league').map((league) => {
        const teamIds = leagueTeams.get(league.id)?.teams || new Set();
        const elos = [...teamIds].map((id) => ratings[id]).filter((value) => value != null);
        const mean = elos.length
            ? elos.reduce((sum, value) => sum + value, 0) / elos.length
            : null;

        return {
            id: league.id,
            name: league.name,
            kind: league.kind,
            tier: league.tier,
            gender: league.gender,
            ageGroup: league.age_group,
            inScope: league.in_scope,
            logo: league.logo_url,
            country: league.country_name,
            countryCode: league.country_code ? String(league.country_code).toLowerCase() : null,
            teams: teamIds.size,
            elo: mean == null ? null : round(mean)
        };
    });
}

function countryCards(nationals, ratings) {
    const rows = [];

    for (const [teamId, meta] of Object.entries(nationals)) {
        if (!meta.national || meta.women || meta.youth || YOUTH_NAME.test(meta.name || '')) {
            continue;
        }

        if (ratings[teamId] == null) {
            continue;
        }

        rows.push(card({
            id: teamId,
            type: 'countries',
            name: meta.name,
            place: meta.country || meta.name,
            role: 'National team',
            elo: ratings[teamId],
            peakElo: ratings[teamId]
        }));
    }

    return rows;
}

function coachCards(totals, identities) {
    const byId = new Map(identities.map((row) => [row.id, row]));
    const rows = [];

    for (const [coachId, total] of totals) {
        if (total.matches < 5) {
            continue;
        }

        const identity = byId.get(coachId) || { id: coachId, name: `Coach ${coachId}` };
        const score = engine.coachPerformance({
            actualPoints: total.actual,
            expectedPoints: total.expected,
            frozenClubElo: total.eloSum / total.matches
        }, COACH, ENGINE);

        rows.push({
            id: coachId,
            name: identity.name,
            position: 'coach',
            entity: 'coach',
            minutes: total.matches * 90,
            rate: score,
            club: identity.team_name,
            nationality: identity.nationality,
            countryCode: identity.country_code,
            birthDate: identity.birth_date,
            photo: identity.photo_url,
            matches: total.matches
        });
    }

    return careerOf(engine.mapRatesToElo(rows, ENGINE).map((row) => ({
        ...row,
        playerElo: row.playerElo,
        season: 0,
        goals: 0,
        assists: 0,
        appearances: row.matches,
        clubMinutes: row.minutes
    })), 'coaches').map((row) => ({ ...row, role: 'Manager' }));
}

async function build() {
    const [matches, seasons, matchCoaches, coaches, directory, standingTeams] = await Promise.all([
        repository.loadFinishedMatches(),
        repository.loadPlayerSeasons(),
        repository.loadMatchCoaches(),
        repository.loadCoachIdentities(),
        repository.loadLeagueDirectory(),
        repository.loadLatestStandingTeams()
    ]);
    const coachByMatch = new Map(matchCoaches.map((row) => [`${row.match_id}:${row.team_id}`, row.coach_id]));
    const walked = walkMatches(matches, coachByMatch);
    const groups = new Map();

    for (const row of seasons) {
        mergeSeason(groups, row, roleOf(row.position), walked.opp);
    }

    const rated = ratePeople(groups);
    const players = rank(careerOf(rated, 'players'));
    const keepers = rank(careerOf(rated, 'keepers'));
    const coachRows = rank(coachCards(walked.coaches, coaches));
    const leagues = rank(leagueCards(directory, walked.ratings, standingTeams, walked.leagueTeams));
    const countries = rank(countryCards(walked.nationals, walked.ratings));
    const index = new Map();

    for (const list of [players, keepers, coachRows, leagues, countries]) {
        for (const row of list) {
            index.set(`${row.type}:${row.id}`, row);
        }
    }

    return {
        builtAt: new Date().toISOString(),
        matches: matches.length,
        players,
        keepers,
        coaches: coachRows,
        leagues,
        countries,
        competitions: competitionCards(directory, walked.ratings, walked.leagueTeams),
        index
    };
}

function ensure(refresh) {
    if (refresh) {
        cached = null;
    }

    if (cached) {
        return Promise.resolve(cached);
    }

    if (!pending) {
        pending = build()
            .then((board) => {
                cached = board;
                pending = null;

                return board;
            })
            .catch((error) => {
                pending = null;
                throw error;
            });
    }

    return pending;
}

module.exports = {
    ensure
};
