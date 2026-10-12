import { TEAM_HONOUR_IDS } from '../data/demo.js';
import {
  CLUB_LEAGUES,
  COUNTING_WEIGHTS,
  PREVIEW_COACHES,
  PREVIEW_KEEPERS,
  PREVIEW_MATCHES,
  PREVIEW_PLAYERS
} from '../data/previewCases.js';
import {
  coachPerformance,
  countingScore,
  honoursScore,
  performanceFromStats,
  rankBy,
  rateMatches
} from './ratingEngine.js';

function withRanks(rows) {
  const byOld = rankBy(rows, 'old');
  const byRate = rankBy(rows, 'rate');
  const byHonours = rankBy(rows, 'honours');

  return rows.map((row) => ({
    ...row,
    oldRank: byOld.get(row.id),
    rateRank: byRate.get(row.id),
    honoursRank: byHonours.get(row.id),
    delta: byOld.get(row.id) - byRate.get(row.id)
  }));
}

export function previewPlayers(config) {
  const rows = PREVIEW_PLAYERS.map((row) => {
    const performance = performanceFromStats({
      stats: row.stats,
      weights: config.players.performance[row.position] || {},
      minutes: row.minutes,
      opponentElo: row.opponentElo,
      goalsPerGame: row.goalsPerGame
    }, config.engine);

    return {
      ...row,
      ...performance,
      honours: honoursScore(
        row.honours,
        config.players.honours,
        { minutesShare: row.minutesShare },
        TEAM_HONOUR_IDS,
        config.engine.minutesShareHonours
      ),
      old: countingScore(row, COUNTING_WEIGHTS)
    };
  });

  return withRanks(rows);
}

export function previewKeepers(config) {
  const rows = PREVIEW_KEEPERS.map((row) => {
    const performance = performanceFromStats({
      stats: row.stats,
      weights: config.keepers.performance,
      minutes: row.minutes,
      opponentElo: row.opponentElo,
      goalsPerGame: row.goalsPerGame
    }, config.engine);

    return {
      ...row,
      ...performance,
      honours: honoursScore(
        row.honours,
        config.keepers.honours,
        { minutesShare: row.minutesShare },
        TEAM_HONOUR_IDS,
        config.engine.minutesShareHonours
      ),
      old: countingScore(row, COUNTING_WEIGHTS)
    };
  });

  return withRanks(rows);
}

export function previewCoaches(config) {
  const rows = PREVIEW_COACHES.map((row) => {
    const rate = coachPerformance(row, config.coaches.performance);

    return {
      ...row,
      rate,
      seasonPoints: rate,
      honours: honoursScore(
        row.honours,
        config.coaches.honours,
        { minutesShare: 1 },
        TEAM_HONOUR_IDS,
        false
      ),
      old: countingScore(row, COUNTING_WEIGHTS)
    };
  });

  return withRanks(rows);
}

export function previewClubs(config) {
  const ratings = rateMatches(PREVIEW_MATCHES, config.engine);
  const clubs = Object.entries(ratings)
    .map(([name, elo]) => ({
      id: name,
      name,
      league: CLUB_LEAGUES[name] || 'Unknown',
      elo
    }))
    .sort((a, b) => b.elo - a.elo);

  const grouped = new Map();

  for (const club of clubs) {
    const bucket = grouped.get(club.league) || [];
    bucket.push(club.elo);
    grouped.set(club.league, bucket);
  }

  const leagues = [...grouped.entries()]
    .map(([name, elos]) => ({
      id: name,
      name,
      elo: elos.reduce((sum, value) => sum + value, 0) / elos.length
    }))
    .sort((a, b) => b.elo - a.elo);

  return { clubs, leagues };
}

export function previewForTab(tab, config) {
  if (tab === 'keepers') {
    return previewKeepers(config);
  }

  if (tab === 'coaches') {
    return previewCoaches(config);
  }

  if (tab === 'clubs') {
    return previewClubs(config);
  }

  return previewPlayers(config);
}
