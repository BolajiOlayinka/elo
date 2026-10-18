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
  blendEloWithHonours,
  coachPerformance,
  countingScore,
  honoursScore,
  individualHonoursScore,
  mapRatesToElo,
  performanceFromStats,
  rankBy,
  rateMatches
} from './ratingEngine.js';

function withRanks(rows) {
  const byOld = rankBy(rows, 'old');
  const byRate = rankBy(rows, 'playerElo');
  const byHonours = rankBy(rows, 'honours');
  const byPlus = rankBy(rows, 'eloPlus');

  return rows.map((row) => ({
    ...row,
    oldRank: byOld.get(row.id),
    rateRank: byRate.get(row.id),
    honoursRank: byHonours.get(row.id),
    plusRank: byPlus.get(row.id),
    delta: byOld.get(row.id) - byRate.get(row.id)
  }));
}

function finishPeople(rows, config, honoursWeights, thinCoverage = false) {
  const withHonours = rows.map((row) => {
    const cabinet = honoursScore(
      row.honours,
      honoursWeights,
      { minutesShare: row.minutesShare },
      TEAM_HONOUR_IDS,
      config.engine.minutesShareHonours
    );
    const individual = individualHonoursScore(row.honours, honoursWeights, TEAM_HONOUR_IDS);
    const mapped = { ...row, honours: cabinet, individualHonours: individual };

    return mapped;
  });
  const withElo = mapRatesToElo(withHonours, config.engine);

  return withRanks(withElo.map((row) => ({
    ...row,
    eloPlus: blendEloWithHonours(row.playerElo, row.individualHonours, config.engine, { thinCoverage }),
    old: countingScore(row, COUNTING_WEIGHTS)
  })));
}

export function previewPlayers(config) {
  const rows = PREVIEW_PLAYERS.map((row) => {
    const performance = performanceFromStats({
      stats: row.stats,
      weights: config.players.performance[row.position] || {},
      minutes: row.minutes,
      opponentElo: row.opponentElo,
      opponentPossession: row.opponentPossession,
      teamTotals: row.teamTotals
    }, config.engine);

    return { ...row, ...performance };
  });

  return finishPeople(rows, config, config.players.honours, false);
}

export function previewKeepers(config) {
  const rows = PREVIEW_KEEPERS.map((row) => {
    const performance = performanceFromStats({
      stats: row.stats,
      weights: config.keepers.performance,
      minutes: row.minutes,
      opponentElo: row.opponentElo,
      opponentPossession: row.opponentPossession
    }, config.engine);

    return { ...row, ...performance };
  });

  return finishPeople(rows, config, config.keepers.honours, false);
}

export function previewCoaches(config) {
  const rows = PREVIEW_COACHES.map((row) => {
    const rate = coachPerformance(row, config.coaches.performance, config.engine);
    const cabinet = honoursScore(
      row.honours,
      config.coaches.honours,
      { minutesShare: 1 },
      TEAM_HONOUR_IDS,
      false
    );
    const individual = individualHonoursScore(row.honours, config.coaches.honours, TEAM_HONOUR_IDS);

    return {
      ...row,
      rate,
      seasonPoints: rate,
      honours: cabinet,
      individualHonours: individual,
      old: countingScore(row, COUNTING_WEIGHTS)
    };
  });

  const withElo = mapRatesToElo(
    rows.map((row) => ({ ...row, minutes: 3420, position: 'coach', coverage: 'coach' })),
    config.engine
  );

  return withRanks(withElo.map((row) => ({
    ...row,
    eloPlus: blendEloWithHonours(row.playerElo, row.individualHonours, config.engine)
  })));
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
