'use strict';

const { toDate, toDecimal, toInt, uniqueBy } = require('./upsert');

const TEAM_STAT_MAP = {
    'Shots on Goal': 'shots_on_goal',
    'Shots off Goal': 'shots_off_goal',
    'Total Shots': 'shots_total',
    'Blocked Shots': 'shots_blocked',
    'Shots insidebox': 'shots_inside_box',
    'Shots outsidebox': 'shots_outside_box',
    Fouls: 'fouls',
    'Corner Kicks': 'corners',
    Offsides: 'offsides',
    'Ball Possession': 'ball_possession',
    'Yellow Cards': 'yellow_cards',
    'Red Cards': 'red_cards',
    'Goalkeeper Saves': 'goalkeeper_saves',
    'Total passes': 'passes_total',
    'Passes accurate': 'passes_accurate',
    'Passes %': 'passes_accuracy'
};

function mapVenues(teamRows, fixtureRows, countryByName) {
    const now = new Date();
    const venues = [];

    for (const row of fixtureRows) {
        const venue = row.fixture?.venue || {};

        if (!venue.id) {
            continue;
        }

        venues.push(venueRow(venue, null, now));
    }

    for (const row of teamRows) {
        const venue = row.venue || {};
        const countryName = row.team?.country || venue.country;

        if (!venue.id) {
            continue;
        }

        venues.push(venueRow(venue, countryByName.get(countryName) || null, now));
    }

    return uniqueBy(venues, (row) => row.id);
}

function venueRow(venue, countryId, now) {
    return {
        id: venue.id,
        name: venue.name || null,
        address: venue.address || null,
        city: venue.city || null,
        country_id: countryId,
        capacity: toInt(venue.capacity),
        surface: venue.surface || null,
        image_url: venue.image || null,
        updated_at: now
    };
}

function mapTeams(teamRows, countryByName) {
    const now = new Date();
    const teams = [];

    for (const row of teamRows) {
        const team = row.team || {};

        if (!team.id) {
            continue;
        }

        teams.push({
            id: team.id,
            name: team.name,
            code: team.code || null,
            founded: toInt(team.founded),
            is_national: Boolean(team.national),
            logo_url: team.logo || null,
            country_id: countryByName.get(team.country) || null,
            country_name: team.country || null,
            venue_id: row.venue?.id || null,
            updated_at: now
        });
    }

    return uniqueBy(teams, (row) => row.id);
}

function mapMatches(fixtureRows) {
    const now = new Date();
    const matches = [];

    for (const row of fixtureRows) {
        const fixture = row.fixture || {};
        const league = row.league || {};
        const teams = row.teams || {};
        const goals = row.goals || {};
        const score = row.score || {};

        if (!fixture.id || !teams.home?.id || !teams.away?.id) {
            continue;
        }

        matches.push({
            id: fixture.id,
            league_id: league.id,
            season_year: league.season,
            round: league.round || null,
            venue_id: fixture.venue?.id || null,
            venue_name: fixture.venue?.name || null,
            venue_city: fixture.venue?.city || null,
            referee: fixture.referee || null,
            kickoff_at: fixture.date || null,
            kickoff_unix: fixture.timestamp || null,
            timezone: fixture.timezone || null,
            status_short: fixture.status?.short || 'NS',
            status_long: fixture.status?.long || null,
            elapsed_minutes: toInt(fixture.status?.elapsed),
            home_team_id: teams.home.id,
            away_team_id: teams.away.id,
            home_goals: toInt(goals.home),
            away_goals: toInt(goals.away),
            home_goals_ht: toInt(score.halftime?.home),
            away_goals_ht: toInt(score.halftime?.away),
            home_goals_et: toInt(score.extratime?.home),
            away_goals_et: toInt(score.extratime?.away),
            home_penalties: toInt(score.penalty?.home),
            away_penalties: toInt(score.penalty?.away),
            home_winner: teams.home.winner == null ? null : Boolean(teams.home.winner),
            updated_at: now
        });
    }

    return uniqueBy(matches, (row) => row.id);
}

function rememberPlayer(players, playerId, patch) {
    if (!playerId) {
        return;
    }

    const previous = players.get(playerId) || { id: playerId, name: 'Unknown' };
    const nextName = patch.name && patch.name !== 'Unknown' ? patch.name : previous.name;

    players.set(playerId, {
        ...previous,
        ...patch,
        id: playerId,
        name: nextName
    });
}

function collectPlayersFromProfiles(pages, leagueId, seasonYear) {
    const players = new Map();
    const seasonStats = [];
    const now = new Date();

    for (const page of pages) {
        for (const row of page.response || []) {
            const player = row.player || {};

            if (!player.id) {
                continue;
            }

            rememberPlayer(players, player.id, {
                name: player.name || 'Unknown',
                first_name: player.firstname || null,
                last_name: player.lastname || null,
                age: toInt(player.age),
                birth_date: toDate(player.birth?.date),
                birth_place: player.birth?.place || null,
                birth_country: player.birth?.country || null,
                nationality: player.nationality || null,
                height: player.height || null,
                weight: player.weight || null,
                injured: player.injured == null ? null : Boolean(player.injured),
                photo_url: player.photo || null,
                updated_at: now
            });

            for (const stat of row.statistics || []) {
                if (stat.league?.id !== leagueId || Number(stat.league?.season) !== seasonYear) {
                    continue;
                }

                if (!stat.team?.id) {
                    continue;
                }

                seasonStats.push(mapPlayerSeasonStat(player.id, stat, now));
            }
        }
    }

    return { players, seasonStats };
}

function mapPlayerSeasonStat(playerId, stat, now) {
    const games = stat.games || {};
    const shots = stat.shots || {};
    const goals = stat.goals || {};
    const passes = stat.passes || {};
    const tackles = stat.tackles || {};
    const duels = stat.duels || {};
    const dribbles = stat.dribbles || {};
    const fouls = stat.fouls || {};
    const cards = stat.cards || {};
    const penalty = stat.penalty || {};
    const substitutes = stat.substitutes || {};

    return {
        player_id: playerId,
        team_id: stat.team.id,
        league_id: stat.league.id,
        season_year: Number(stat.league.season),
        position: games.position || null,
        rating: toDecimal(games.rating),
        captain: games.captain == null ? null : Boolean(games.captain),
        appearances: toInt(games.appearences ?? games.appearances),
        lineups: toInt(games.lineups),
        minutes: toInt(games.minutes),
        substitutes_in: toInt(substitutes.in),
        substitutes_out: toInt(substitutes.out),
        bench: toInt(substitutes.bench),
        shots_total: toInt(shots.total),
        shots_on: toInt(shots.on),
        goals: toInt(goals.total),
        goals_conceded: toInt(goals.conceded),
        assists: toInt(goals.assists),
        saves: toInt(goals.saves),
        passes_total: toInt(passes.total),
        passes_key: toInt(passes.key),
        passes_accuracy: toInt(passes.accuracy),
        tackles_total: toInt(tackles.total),
        blocks: toInt(tackles.blocks),
        interceptions: toInt(tackles.interceptions),
        duels_total: toInt(duels.total),
        duels_won: toInt(duels.won),
        dribbles_attempts: toInt(dribbles.attempts),
        dribbles_success: toInt(dribbles.success),
        fouls_drawn: toInt(fouls.drawn),
        fouls_committed: toInt(fouls.committed),
        yellow_cards: toInt(cards.yellow),
        yellow_red_cards: toInt(cards.yellowred),
        red_cards: toInt(cards.red),
        penalties_scored: toInt(penalty.scored),
        penalties_missed: toInt(penalty.missed),
        penalties_saved: toInt(penalty.saved),
        updated_at: now
    };
}

function collectFromEvents(payload, matchId, players) {
    const rows = [];

    for (const item of payload.response || []) {
        rememberPlayer(players, item.player?.id, { name: item.player?.name || 'Unknown' });
        rememberPlayer(players, item.assist?.id, { name: item.assist?.name || 'Unknown' });
        rows.push({
            match_id: matchId,
            team_id: item.team?.id || null,
            player_id: item.player?.id || null,
            assist_player_id: item.assist?.id || null,
            elapsed: toInt(item.time?.elapsed),
            extra: toInt(item.time?.extra),
            type: item.type || 'Unknown',
            detail: item.detail || null,
            comments: item.comments || null
        });
    }

    return rows;
}

function collectFromLineups(payload, matchId, players, coaches) {
    const now = new Date();
    const lineupRows = [];
    const coachRows = [];

    for (const item of payload.response || []) {
        const teamId = item.team?.id;
        const coach = item.coach || {};

        if (coach.id) {
            rememberCoach(coaches, coach, now);
            coachRows.push({
                match_id: matchId,
                team_id: teamId,
                coach_id: coach.id,
                formation: item.formation || null,
                updated_at: now
            });
        }

        pushLineupSide(lineupRows, players, matchId, teamId, item.startXI, true);
        pushLineupSide(lineupRows, players, matchId, teamId, item.substitutes, false);
    }

    return { lineupRows, coachRows };
}

function pushLineupSide(lineupRows, players, matchId, teamId, side, isStarter) {
    for (const slot of side || []) {
        const player = slot.player || {};

        rememberPlayer(players, player.id, { name: player.name || 'Unknown' });
        lineupRows.push({
            match_id: matchId,
            team_id: teamId,
            player_id: player.id || null,
            player_name: player.name || null,
            shirt_number: toInt(player.number),
            position: player.pos || null,
            grid: player.grid || null,
            is_starter: isStarter
        });
    }
}

function collectFromMatchPlayers(payload, matchId, players) {
    const now = new Date();
    const rows = [];

    for (const side of payload.response || []) {
        const teamId = side.team?.id;

        for (const entry of side.players || []) {
            const player = entry.player || {};
            const stats = (entry.statistics || [])[0] || {};
            const games = stats.games || {};
            const shots = stats.shots || {};
            const goals = stats.goals || {};
            const passes = stats.passes || {};
            const tackles = stats.tackles || {};
            const duels = stats.duels || {};
            const dribbles = stats.dribbles || {};
            const fouls = stats.fouls || {};
            const cards = stats.cards || {};
            const penalty = stats.penalty || {};

            if (!player.id) {
                continue;
            }

            rememberPlayer(players, player.id, {
                name: player.name || 'Unknown',
                photo_url: player.photo || null
            });

            rows.push({
                match_id: matchId,
                team_id: teamId,
                player_id: player.id,
                minutes: toInt(games.minutes),
                shirt_number: toInt(games.number),
                position: games.position || null,
                rating: toDecimal(games.rating),
                captain: Boolean(games.captain),
                substitute: Boolean(games.substitute),
                offsides: toInt(stats.offsides),
                shots_total: toInt(shots.total),
                shots_on: toInt(shots.on),
                goals: toInt(goals.total),
                goals_conceded: toInt(goals.conceded),
                assists: toInt(goals.assists),
                saves: toInt(goals.saves),
                passes_total: toInt(passes.total),
                passes_key: toInt(passes.key),
                passes_accuracy: toInt(passes.accuracy),
                tackles_total: toInt(tackles.total),
                blocks: toInt(tackles.blocks),
                interceptions: toInt(tackles.interceptions),
                duels_total: toInt(duels.total),
                duels_won: toInt(duels.won),
                dribbles_attempts: toInt(dribbles.attempts),
                dribbles_success: toInt(dribbles.success),
                dribbles_past: toInt(dribbles.past),
                fouls_drawn: toInt(fouls.drawn),
                fouls_committed: toInt(fouls.committed),
                yellow_cards: toInt(cards.yellow),
                red_cards: toInt(cards.red),
                penalties_won: toInt(penalty.won),
                penalties_committed: toInt(penalty.commited ?? penalty.committed),
                penalties_scored: toInt(penalty.scored),
                penalties_missed: toInt(penalty.missed),
                penalties_saved: toInt(penalty.saved),
                updated_at: now
            });
        }
    }

    return rows;
}

function collectFromTeamStats(payload, matchId) {
    const now = new Date();
    const rows = [];

    for (const side of payload.response || []) {
        const teamId = side.team?.id;
        const mapped = {
            match_id: matchId,
            team_id: teamId,
            extras: {},
            updated_at: now
        };

        for (const stat of side.statistics || []) {
            const column = TEAM_STAT_MAP[stat.type];

            if (column) {
                mapped[column] = toInt(stat.value);
            } else if (stat.type) {
                mapped.extras[stat.type] = stat.value;
            }
        }

        if (Object.keys(mapped.extras).length === 0) {
            mapped.extras = null;
        }

        rows.push(mapped);
    }

    return rows;
}

function rememberCoach(coaches, coach, now) {
    if (!coach?.id) {
        return;
    }

    const previous = coaches.get(coach.id) || { id: coach.id, name: 'Unknown' };

    coaches.set(coach.id, {
        ...previous,
        id: coach.id,
        name: coach.name || previous.name,
        first_name: coach.firstname ?? previous.first_name ?? null,
        last_name: coach.lastname ?? previous.last_name ?? null,
        age: toInt(coach.age) ?? previous.age ?? null,
        birth_date: toDate(coach.birth?.date) ?? previous.birth_date ?? null,
        birth_place: coach.birth?.place || previous.birth_place || null,
        birth_country: coach.birth?.country || previous.birth_country || null,
        nationality: coach.nationality || previous.nationality || null,
        height: coach.height || previous.height || null,
        weight: coach.weight || previous.weight || null,
        photo_url: coach.photo || previous.photo_url || null,
        current_team_id: coach.team?.id || previous.current_team_id || null,
        updated_at: now
    });
}

function collectCoachesFromFiles(payloads, knownTeamIds) {
    const now = new Date();
    const coaches = new Map();
    const tenures = [];

    for (const payload of payloads) {
        for (const coach of payload.response || []) {
            rememberCoach(coaches, coach, now);

            for (const stint of coach.career || []) {
                const teamId = stint.team?.id || null;

                tenures.push({
                    coach_id: coach.id,
                    team_id: teamId && knownTeamIds.has(teamId) ? teamId : null,
                    team_name: stint.team?.name || null,
                    started_on: toDate(stint.start),
                    ended_on: toDate(stint.end),
                    updated_at: now
                });
            }
        }
    }

    return {
        coaches,
        tenures: uniqueBy(
            tenures,
            (row) => `${row.coach_id}:${row.team_id}:${row.started_on}:${row.ended_on}`
        )
    };
}

function mapStandings(payload, leagueId, seasonYear) {
    const now = new Date();
    const rows = [];
    const league = (payload.response || [])[0]?.league || {};
    const groups = league.standings || [];

    for (const group of groups) {
        for (const item of group) {
            if (!item.team?.id) {
                continue;
            }

            const all = item.all || {};
            const home = item.home || {};
            const away = item.away || {};

            rows.push({
                league_id: leagueId,
                season_year: seasonYear,
                group_name: item.group || '',
                team_id: item.team.id,
                rank: toInt(item.rank),
                points: toInt(item.points),
                goal_diff: toInt(item.goalsDiff),
                form: item.form || null,
                status: item.status || null,
                description: item.description || null,
                played: toInt(all.played),
                wins: toInt(all.win),
                draws: toInt(all.draw),
                losses: toInt(all.lose),
                goals_for: toInt(all.goals?.for),
                goals_against: toInt(all.goals?.against),
                home_played: toInt(home.played),
                home_wins: toInt(home.win),
                home_draws: toInt(home.draw),
                home_losses: toInt(home.lose),
                home_goals_for: toInt(home.goals?.for),
                home_goals_against: toInt(home.goals?.against),
                away_played: toInt(away.played),
                away_wins: toInt(away.win),
                away_draws: toInt(away.draw),
                away_losses: toInt(away.lose),
                away_goals_for: toInt(away.goals?.for),
                away_goals_against: toInt(away.goals?.against),
                updated_at: now
            });
        }
    }

    return uniqueBy(rows, (row) => `${row.league_id}:${row.season_year}:${row.team_id}:${row.group_name}`);
}

function playersToRows(players) {
    return [...players.values()].map((row) => ({
        id: row.id,
        name: row.name || 'Unknown',
        first_name: row.first_name || null,
        last_name: row.last_name || null,
        age: row.age ?? null,
        birth_date: row.birth_date || null,
        birth_place: row.birth_place || null,
        birth_country: row.birth_country || null,
        nationality: row.nationality || null,
        height: row.height || null,
        weight: row.weight || null,
        injured: row.injured ?? null,
        photo_url: row.photo_url || null,
        updated_at: row.updated_at || new Date()
    }));
}

function coachesToRows(coaches) {
    return [...coaches.values()];
}

module.exports = {
    mapVenues,
    mapTeams,
    mapMatches,
    collectPlayersFromProfiles,
    collectFromEvents,
    collectFromLineups,
    collectFromMatchPlayers,
    collectFromTeamStats,
    collectCoachesFromFiles,
    mapStandings,
    playersToRows,
    coachesToRows,
    rememberPlayer
};
