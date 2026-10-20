'use strict';

/**
 * Roll StatsBomb events to per-player match counts.
 * Ignores freeze_frame and 360. Keeper quality is xG faced (pre-shot xG
 * of shots against), not true PSxG.
 */

const PITCH_X = 120;
const BOX_X = 102;
const BOX_Y_MIN = 18;
const BOX_Y_MAX = 62;
const PROGRESSIVE_X = 10;

function typeName(row) {
    return row?.type?.name || '';
}

function locationOf(row) {
    const point = row?.location;

    return Array.isArray(point) && point.length >= 2 ? point : null;
}

function endLocation(row, key) {
    const point = row?.[key]?.end_location;

    return Array.isArray(point) && point.length >= 2 ? point : null;
}

function isPenalty(row) {
    return row?.shot?.type?.name === 'Penalty';
}

function shotOnTarget(row) {
    const outcome = row?.shot?.outcome?.name;

    return outcome === 'Goal' || outcome === 'Saved' || outcome === 'Saved to Post';
}

function isProgressive(start, end) {
    if (!start || !end) {
        return false;
    }

    return (end[0] - start[0]) >= PROGRESSIVE_X;
}

function intoBox(end) {
    if (!end) {
        return false;
    }

    return end[0] >= BOX_X && end[1] >= BOX_Y_MIN && end[1] <= BOX_Y_MAX;
}

function clockToMinutes(row) {
    return Number(row?.minute || 0) + Number(row?.second || 0) / 60;
}

function parseClock(value) {
    if (!value) {
        return null;
    }

    const parts = String(value).split('.')[0].split(':').map(Number);

    if (!parts.length || parts.some((part) => !Number.isFinite(part))) {
        return null;
    }

    // Position clocks are MM:SS[:ms], not hours. "90:00:00.000" is minute 90.
    return (parts[0] || 0) + (parts[1] || 0) / 60;
}

function intervalMinutes(from, to) {
    const start = parseClock(from) || 0;
    const end = parseClock(to);

    return Math.max(0, (end == null ? 90 : end) - start);
}

function isGkPosition(position) {
    const label = String(position?.position || position?.name || '').toLowerCase();

    return label === 'goalkeeper' || Number(position?.position_id) === 1;
}

function emptyStats() {
    return {
        minutes: 0,
        shots: 0,
        shotsOn: 0,
        goals: 0,
        assists: 0,
        keyPasses: 0,
        xg: 0,
        npxg: 0,
        xa: 0,
        xgFaced: 0,
        pressures: 0,
        carries: 0,
        progressiveCarries: 0,
        progressivePasses: 0,
        passesIntoBox: 0
    };
}

function ensurePlayer(players, id, fallback) {
    const current = players.get(id);

    if (current) {
        return current;
    }

    const row = {
        statsbombPlayerId: id,
        name: fallback?.name || `Player ${id}`,
        nickname: fallback?.nickname || null,
        country: fallback?.country || null,
        statsbombTeamId: fallback?.teamId || null,
        teamName: fallback?.teamName || null,
        position: fallback?.position || null,
        isGk: Boolean(fallback?.isGk),
        stats: emptyStats()
    };

    players.set(id, row);

    return row;
}

function addLineups(players, lineups) {
    for (const team of lineups || []) {
        for (const person of team.lineup || []) {
            const positions = person.positions || [];
            const gk = positions.some(isGkPosition);
            const minutes = positions.length
                ? Math.round(positions.reduce((sum, position) => (
                    sum + intervalMinutes(position.from, position.to)
                ), 0))
                : 0;
            const primary = positions[0];
            const row = ensurePlayer(players, person.player_id, {
                name: person.player_name,
                nickname: person.player_nickname,
                country: person.country?.name || null,
                teamId: team.team_id,
                teamName: team.team_name,
                position: primary?.position || null,
                isGk: gk
            });

            row.stats.minutes = minutes;
            row.isGk = row.isGk || gk;
            row.positions = positions;
        }
    }
}

function gkForShot(players, defendingTeamId, row) {
    const minute = clockToMinutes(row);
    const keepers = [...players.values()].filter((person) => (
        person.statsbombTeamId === defendingTeamId && person.isGk
    ));

    for (const keeper of keepers) {
        for (const position of keeper.positions || []) {
            if (!isGkPosition(position)) {
                continue;
            }

            const from = parseClock(position.from) || 0;
            const to = parseClock(position.to);
            const end = to == null ? 130 : to;

            if (minute >= from && minute <= end) {
                return keeper;
            }
        }
    }

    return keepers[0] || null;
}

function aggregateMatch(events, lineups, homeTeamId, awayTeamId) {
    const players = new Map();

    addLineups(players, lineups);

    const shotsByKeyPass = new Map();

    for (const row of events || []) {
        if (typeName(row) !== 'Shot' || row.shot?.statsbomb_xg == null) {
            continue;
        }

        const key = row.shot.key_pass_id;

        if (key) {
            shotsByKeyPass.set(key, Number(row.shot.statsbomb_xg) || 0);
        }
    }

    for (const row of events || []) {
        const kind = typeName(row);
        const playerId = row.player?.id;

        if (kind === 'Shot') {
            const xg = Number(row.shot?.statsbomb_xg) || 0;
            const teamId = row.team?.id;
            const defendingId = teamId === homeTeamId ? awayTeamId : homeTeamId;
            const keeper = gkForShot(players, defendingId, row);

            if (keeper) {
                keeper.stats.xgFaced += xg;
            }

            if (!playerId) {
                continue;
            }

            const person = ensurePlayer(players, playerId, {
                name: row.player?.name,
                teamId,
                teamName: row.team?.name
            });

            person.stats.shots += 1;
            person.stats.xg += xg;

            if (!isPenalty(row)) {
                person.stats.npxg += xg;
            }

            if (shotOnTarget(row)) {
                person.stats.shotsOn += 1;
            }

            if (row.shot?.outcome?.name === 'Goal') {
                person.stats.goals += 1;
            }

            continue;
        }

        if (!playerId) {
            continue;
        }

        const person = ensurePlayer(players, playerId, {
            name: row.player?.name,
            teamId: row.team?.id,
            teamName: row.team?.name
        });

        if (kind === 'Pressure') {
            person.stats.pressures += 1;
        } else if (kind === 'Carry') {
            person.stats.carries += 1;

            if (isProgressive(locationOf(row), endLocation(row, 'carry'))) {
                person.stats.progressiveCarries += 1;
            }
        } else if (kind === 'Pass') {
            const end = endLocation(row, 'pass') || row.pass?.end_location;

            if (isProgressive(locationOf(row), end)) {
                person.stats.progressivePasses += 1;
            }

            if (intoBox(end)) {
                person.stats.passesIntoBox += 1;
            }

            if (row.pass?.shot_assist) {
                person.stats.keyPasses += 1;
                person.stats.xa += shotsByKeyPass.get(row.id) || 0;
            }

            if (row.pass?.goal_assist) {
                person.stats.assists += 1;
            }
        }
    }

    return [...players.values()].map((row) => {
        delete row.positions;

        return row;
    });
}

function roundStat(value, digits) {
    if (!value) {
        return 0;
    }

    const factor = 10 ** digits;

    return Math.round(value * factor) / factor;
}

function finalizeStats(stats) {
    return {
        minutes: Math.round(stats.minutes || 0),
        shots: stats.shots,
        shotsOn: stats.shotsOn,
        goals: stats.goals,
        assists: stats.assists,
        keyPasses: stats.keyPasses,
        xg: roundStat(stats.xg, 3),
        npxg: roundStat(stats.npxg, 3),
        xa: roundStat(stats.xa, 3),
        xgFaced: roundStat(stats.xgFaced, 3),
        pressures: stats.pressures,
        carries: stats.carries,
        progressiveCarries: stats.progressiveCarries,
        progressivePasses: stats.progressivePasses,
        passesIntoBox: stats.passesIntoBox
    };
}

module.exports = {
    PITCH_X,
    aggregateMatch,
    finalizeStats
};
