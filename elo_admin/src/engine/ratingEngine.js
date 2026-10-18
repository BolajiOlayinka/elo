const MINUS_IDS = new Set(['yellow', 'red', 'goalsConceded']);
const ATTACK_QUALITY_IDS = new Set(['npGoals', 'penalties', 'assists', 'keyPasses', 'penaltiesSaved']);
const DEFENCE_IDS = new Set(['tacklesWon', 'interceptions', 'blocks', 'duelsWon']);
const RESIDUAL_IDS = new Set(['psxgPlus', 'savePctResidual']);
const SHARE_IDS = new Set(['npGoals', 'assists', 'keyPasses']);
const TEAM_BASELINE = { npGoals: 50, assists: 40, keyPasses: 400 };

export const ROLE_GROUP = {
  st: 'st',
  cf: 'st',
  lw: 'w',
  rw: 'w',
  cam: 'am',
  cm: 'cm',
  lm: 'cm',
  rm: 'cm',
  cdm: 'dm',
  lb: 'fb',
  rb: 'fb',
  wb: 'wb',
  cb: 'cb',
  gk: 'gk'
};

const K_BY_COMPETITION = {
  league: 1,
  cup: 0.75,
  continental: 1,
  friendly: 0.5,
  international: 1
};

export function expectedScore(rating, opponentRating, homeAdvantage = 0) {
  return 1 / (1 + 10 ** ((opponentRating - (rating + homeAdvantage)) / 400));
}

export function qualityMultiplier(opponentElo, engine, { isAway = false, neutral = false } = {}) {
  const anchor = Number(engine.scaleAnchor) || 1500;
  const scale = Number(engine.qualityScale) || 800;
  const floor = Number(engine.qualityFloor) || 0.45;
  const cap = Number(engine.qualityCap) || 2.5;
  let opp = Number(opponentElo);

  if (!Number.isFinite(opp)) {
    return 1;
  }

  if (isAway && !neutral) {
    opp += Number(engine.homeAdvantage) || 0;
  }

  const raw = 10 ** ((opp - anchor) / scale);

  return Math.min(cap, Math.max(floor, raw));
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

function appliesQuality(id) {
  return ATTACK_QUALITY_IDS.has(id);
}

function possessionAdjusted(id, raw, opponentPossession) {
  if (!DEFENCE_IDS.has(id)) {
    return raw;
  }

  const oppShare = Number(opponentPossession);
  const clipped = Number.isFinite(oppShare) ? Math.min(0.8, Math.max(0.2, oppShare)) : 0.5;

  return raw * (0.5 / clipped);
}

function shareAdjusted(id, raw, teamTotals) {
  if (!SHARE_IDS.has(id)) {
    return raw;
  }

  const team = Number(teamTotals?.[id]);
  const baseline = TEAM_BASELINE[id];

  if (!team || team <= 0 || !baseline) {
    return raw;
  }

  return 0.7 * raw + 0.3 * (raw / team) * baseline;
}

function adjustedCount(id, raw, { opponentPossession, teamTotals } = {}) {
  const possessed = possessionAdjusted(id, Number(raw) || 0, opponentPossession);

  return shareAdjusted(id, possessed, teamTotals);
}

/**
 * Role-native season rate. Q applies only to attacking output.
 * Defence is possession-adjusted. Cards and residuals are unscaled.
 * Era is omitted: z is within position-season.
 */
export function performanceFromStats(input, engine) {
  const {
    stats,
    weights,
    minutes,
    opponentElo,
    opponentPossession,
    teamTotals,
    isAway = false,
    neutral = false
  } = input;
  const quality = qualityMultiplier(opponentElo, engine, { isAway, neutral });
  const nineties = Number(minutes) > 0 ? Number(minutes) / 90 : 0;
  let seasonPoints = 0;

  for (const [id, weight] of Object.entries(weights || {})) {
    if (RESIDUAL_IDS.has(id) && (stats?.[id] == null || stats[id] === '')) {
      continue;
    }

    const raw = adjustedCount(id, stats?.[id] ?? 0, { opponentPossession, teamTotals });
    const q = appliesQuality(id) ? quality : 1;
    seasonPoints += signedWeight(id, weight) * raw * q;
  }

  return {
    rate: nineties > 0 ? seasonPoints / nineties : seasonPoints,
    seasonPoints,
    quality,
    era: 1,
    nineties
  };
}

export function roleGroupOf(position) {
  return ROLE_GROUP[position] || position || 'unknown';
}

export function coverageKey(row) {
  if (row.coverage) {
    return row.coverage;
  }

  const keeper = row.entity === 'keeper' || row.position === 'gk';

  if (keeper) {
    const hasPsxg = row.hasPsxg !== false && (row.stats?.psxgPlus != null || row.stats?.savePctResidual != null);

    return hasPsxg ? 'gk-psxg' : 'gk-basic';
  }

  return 'full';
}

export function peerKey(row) {
  return `${roleGroupOf(row.position)}:${coverageKey(row)}`;
}

export function meanStd(values) {
  const n = values.length;

  if (!n) {
    return { mean: 0, std: 0 };
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / n;

  if (n < 2) {
    return { mean, std: 0 };
  }

  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);

  return { mean, std: Math.sqrt(variance) };
}

export function shrinkZ(z, minutes, engine) {
  const prior = Number(engine.minutesPrior) || 1200;
  const played = Math.max(0, Number(minutes) || 0);

  return z * (played / (played + prior));
}

export function eloFromZ(z, engine) {
  const start = Number(engine.startRating) || 1500;
  const sigma = Number(engine.eloSigma) || 200;

  return start + sigma * z;
}

export function mapRatesToElo(rows, engine) {
  const groups = new Map();

  for (const row of rows) {
    const key = peerKey(row);
    const bucket = groups.get(key) || [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  const floor = Number(engine.minutesFloor) || 900;
  const mapped = [];

  for (const members of groups.values()) {
    const peerRates = members
      .filter((row) => Number(row.minutes) >= floor)
      .map((row) => row.rate);
    const { mean, std } = meanStd(peerRates.length ? peerRates : members.map((row) => row.rate));

    for (const row of members) {
      const z = std > 0 ? (row.rate - mean) / std : 0;
      const zShrunk = shrinkZ(z, row.minutes, engine);
      mapped.push({
        ...row,
        z,
        zShrunk,
        peerMean: mean,
        peerStd: std,
        playerElo: eloFromZ(zShrunk, engine)
      });
    }
  }

  return mapped;
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

export function individualHonoursScore(counts, weights, teamIds) {
  let score = 0;

  for (const [id, weight] of Object.entries(weights || {})) {
    if (teamIds?.has(id)) {
      continue;
    }

    score += (Number(weight) || 0) * Number(counts?.[id] ?? 0);
  }

  return score;
}

export function blendEloWithHonours(playerElo, individualHonours, engine, { thinCoverage = false } = {}) {
  const lambda = thinCoverage
    ? Number(engine.honoursBlendThin) || 0.45
    : Number(engine.honoursBlend) || 0.15;
  const cap = Number(engine.honoursBoostCap) || 100;
  const boost = Math.min(cap, 0.5 * Number(individualHonours || 0));
  const stats = Number(playerElo) || 1500;

  return (1 - lambda) * stats + lambda * (stats + boost);
}

function drawProbability(expected, engine) {
  const base = Number(engine.drawRate) || 0.28;
  const p = 4 * base * expected * (1 - expected);

  return Math.min(0.45, Math.max(0.12, p));
}

export function expectedPointsFromMatch(clubElo, opponentElo, { isHome = true, neutral = false } = {}, engine) {
  const homeAdv = neutral ? 0 : Number(engine.homeAdvantage) || 0;
  const expected = isHome
    ? expectedScore(clubElo, opponentElo, homeAdv)
    : 1 - expectedScore(opponentElo, clubElo, homeAdv);
  const pDraw = drawProbability(expected, engine);
  const pWin = Math.max(0, expected - 0.5 * pDraw);
  const pLoss = Math.max(0, 1 - pWin - pDraw);
  const pWinClipped = pWin / (pWin + pDraw + pLoss || 1);
  const pDrawClipped = pDraw / (pWin + pDraw + pLoss || 1);

  return 3 * pWinClipped + pDrawClipped;
}

export function expectedTablePoints(schedule, engine) {
  if (!schedule?.length) {
    return 0;
  }

  return schedule.reduce(
    (sum, match) => sum + expectedPointsFromMatch(
      match.clubElo,
      match.opponentElo,
      { isHome: match.isHome, neutral: match.neutral },
      engine
    ),
    0
  );
}

export function coachPerformance(row, weights, engine = {}) {
  const frozen = Number(row.frozenClubElo);
  const expected = Number.isFinite(Number(row.expectedPoints))
    ? Number(row.expectedPoints)
    : expectedTablePoints(row.schedule, engine);
  const over = Number(row.actualPoints) - expected;
  const plus = (Number(weights.overperformance) || 0) * over;
  const level = Number.isFinite(frozen)
    ? (Number(weights.level) || 0) * ((frozen - 1500) / 100)
    : 0;
  const touchline = (Number(weights.yellow) || 0) * Number(row.touchlineYellow || 0)
    + (Number(weights.red) || 0) * Number(row.touchlineRed || 0);

  return plus + level - touchline;
}

function competitionK(match, engine) {
  const base = Number(engine.kFactor) || 20;
  const kind = match.competition || 'league';
  const factor = K_BY_COMPETITION[kind] ?? 1;

  return base * factor;
}

function goalDiffFactor(homeGoals, awayGoals, engine) {
  if (engine.useGoalDifference === false) {
    return 1;
  }

  const gd = Math.abs(Number(homeGoals) - Number(awayGoals));

  return Math.log(1 + gd) / Math.LN2;
}

function homeAdvantageFor(match, engine) {
  if (match.neutral) {
    return 0;
  }

  return Number(engine.homeAdvantage) || 0;
}

function sortMatches(matches) {
  return [...matches].sort((left, right) => {
    if (left.kickoff && right.kickoff && left.kickoff !== right.kickoff) {
      return String(left.kickoff).localeCompare(String(right.kickoff));
    }

    return (left.order ?? 0) - (right.order ?? 0);
  });
}

export function rateMatches(matches, engine) {
  const start = Number(engine.startRating) || 1500;
  const ratings = {};

  for (const match of sortMatches(matches)) {
    ratings[match.home] ??= start;
    ratings[match.away] ??= start;

    const home = ratings[match.home];
    const away = ratings[match.away];
    const expectedHome = expectedScore(home, away, homeAdvantageFor(match, engine));
    const actual = match.homeGoals > match.awayGoals ? 1 : match.homeGoals < match.awayGoals ? 0 : 0.5;
    const k = competitionK(match, engine) * goalDiffFactor(match.homeGoals, match.awayGoals, engine);

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
