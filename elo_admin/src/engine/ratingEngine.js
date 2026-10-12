const MINUS_IDS = new Set(['yellow', 'red', 'goalsConceded']);
const SCORING_IDS = new Set(['npGoals', 'penalties', 'assists']);

export function expectedScore(rating, opponentRating, homeAdvantage = 0) {
  return 1 / (1 + 10 ** ((opponentRating - (rating + homeAdvantage)) / 400));
}

export function qualityMultiplier(opponentElo, engine) {
  const anchor = Number(engine.scaleAnchor) || 1500;
  const scale = Number(engine.qualityScale) || 600;

  return 10 ** ((Number(opponentElo) - anchor) / scale);
}

export function eraMultiplier(seasonGoalsPerGame, engine) {
  const reference = Number(engine.eraReferenceGpg);
  const season = Number(seasonGoalsPerGame);

  if (!reference || !season) {
    return 1;
  }

  return reference / season;
}

export function per90(value, minutes) {
  if (!minutes) {
    return 0;
  }

  return (Number(value) * 90) / Number(minutes);
}

function signedWeight(id, weight) {
  const magnitude = Number(weight) || 0;

  return MINUS_IDS.has(id) ? -magnitude : magnitude;
}

/**
 * Count stats become season points as weight × count × quality × era.
 * Rate = season points / 90s played. Residuals (PSxG+, overperformance)
 * are already season totals and use the same product.
 */
export function performanceFromStats({ stats, weights, minutes, opponentElo, goalsPerGame }, engine) {
  const quality = Number.isFinite(Number(opponentElo))
    ? qualityMultiplier(opponentElo, engine)
    : 1;
  const era = eraMultiplier(goalsPerGame, engine);
  const nineties = Number(minutes) > 0 ? Number(minutes) / 90 : 0;
  let seasonPoints = 0;

  for (const [id, weight] of Object.entries(weights || {})) {
    const raw = Number(stats?.[id] ?? 0);
    const eraApply = SCORING_IDS.has(id) ? era : 1;
    seasonPoints += signedWeight(id, weight) * raw * eraApply * quality;
  }

  return {
    rate: nineties > 0 ? seasonPoints / nineties : seasonPoints,
    seasonPoints,
    quality,
    era,
    nineties
  };
}

export function honoursScore(counts, weights, { minutesShare = 1 } = {}, teamIds, minutesShareHonours) {
  let score = 0;

  for (const [id, weight] of Object.entries(weights || {})) {
    const count = Number(counts?.[id] ?? 0);
    const team = teamIds?.has(id);
    const share = team && minutesShareHonours ? Number(minutesShare) || 0 : 1;

    score += (Number(weight) || 0) * count * share;
  }

  return score;
}

export function coachPerformance({ actualPoints, expectedPoints, yellow = 0, red = 0 }, weights) {
  const over = Number(actualPoints) - Number(expectedPoints);
  const plus = (Number(weights.overperformance) || 0) * over;
  const minus = (Number(weights.yellow) || 0) * yellow + (Number(weights.red) || 0) * red;

  return plus - minus;
}

export function rateMatches(matches, engine) {
  const start = Number(engine.startRating) || 1500;
  const k = Number(engine.kFactor) || 20;
  const homeAdv = Number(engine.homeAdvantage) || 0;
  const ratings = {};

  for (const match of matches) {
    ratings[match.home] ??= start;
    ratings[match.away] ??= start;

    const home = ratings[match.home];
    const away = ratings[match.away];
    const expectedHome = expectedScore(home, away, homeAdv);
    const actual = match.homeGoals > match.awayGoals ? 1 : match.homeGoals < match.awayGoals ? 0 : 0.5;

    ratings[match.home] = home + k * (actual - expectedHome);
    ratings[match.away] = away + k * ((1 - actual) - (1 - expectedHome));
  }

  return ratings;
}

export function countingScore(row, counting) {
  const stats = row.stats || {};
  let score = 0;

  score += (counting.goals || 0) * Number(stats.npGoals ?? stats.goals ?? 0);
  score += (counting.passes || 0) * Number(stats.passes ?? 0);
  score += (counting.saves || 0) * Number(stats.saves ?? 0);
  score += (counting.cleanSheets || 0) * Number(stats.cleanSheets ?? 0);
  score += (counting.performance?.assists || 0) * Number(stats.assists ?? 0);
  score -= (counting.performance?.yellow || 0) * Number(stats.yellow ?? row.yellow ?? 0);
  score -= (counting.performance?.red || 0) * Number(stats.red ?? row.red ?? 0);

  for (const [id, weight] of Object.entries(counting.honours || {})) {
    score += (Number(weight) || 0) * Number(row.honours?.[id] ?? 0);
  }

  return score;
}

export function rankBy(rows, key) {
  const sorted = [...rows].sort((a, b) => b[key] - a[key] || a.name.localeCompare(b.name));

  return new Map(sorted.map((row, index) => [row.id, index + 1]));
}
