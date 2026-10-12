/**
 * Synthetic seasons used to check whether the three-layer model is actually
 * more objective than counting stats + trophies. Opponent Elo here is what a
 * connected results graph would produce as a season-average opponent.
 */
export const PREVIEW_PLAYERS = [
  {
    id: 'adewale',
    name: 'Adewale Okonkwo',
    role: 'Striker · NPFL',
    position: 'st',
    minutes: 2500,
    opponentElo: 1340,
    goalsPerGame: 2.55,
    minutesShare: 0.86,
    stats: {
      npGoals: 28,
      penalties: 2,
      assists: 4,
      keyPasses: 12,
      tacklesWon: 8,
      interceptions: 4,
      blocks: 2,
      aerialsWon: 22,
      yellow: 3,
      red: 0,
      passes: 420
    },
    honours: {},
    note: 'Volume scorer in a weaker league'
  },
  {
    id: 'callum',
    name: 'Callum Wright',
    role: 'Striker · Premier League',
    position: 'st',
    minutes: 2500,
    opponentElo: 1760,
    goalsPerGame: 2.72,
    minutesShare: 0.84,
    stats: {
      npGoals: 12,
      penalties: 1,
      assists: 5,
      keyPasses: 18,
      tacklesWon: 10,
      interceptions: 5,
      blocks: 1,
      aerialsWon: 14,
      yellow: 2,
      red: 0,
      passes: 380
    },
    honours: {},
    note: 'Fewer goals, much stronger opponents'
  },
  {
    id: 'reece',
    name: 'Reece Harland',
    role: 'Striker · Championship',
    position: 'st',
    minutes: 2500,
    opponentElo: 1580,
    goalsPerGame: 2.6,
    minutesShare: 0.85,
    stats: {
      npGoals: 18,
      penalties: 1,
      assists: 5,
      keyPasses: 16,
      tacklesWon: 9,
      interceptions: 5,
      blocks: 1,
      aerialsWon: 18,
      yellow: 3,
      red: 0,
      passes: 400
    },
    honours: {},
    note: 'England 2nd tier. More goals than PL, fewer than NPFL.'
  },
  {
    id: 'busquets',
    name: 'Marc Valls',
    role: 'Central mid · possession side',
    position: 'cm',
    minutes: 2800,
    opponentElo: 1740,
    goalsPerGame: 2.7,
    minutesShare: 0.9,
    stats: {
      npGoals: 1,
      penalties: 0,
      assists: 3,
      keyPasses: 9,
      tacklesWon: 18,
      interceptions: 22,
      blocks: 6,
      aerialsWon: 12,
      yellow: 4,
      red: 0,
      passes: 2100
    },
    honours: { premierLeague: 1 },
    note: 'Pass volume without chance creation'
  },
  {
    id: 'kdb',
    name: 'Jonas Hale',
    role: 'Central mid · chance creator',
    position: 'cm',
    minutes: 2800,
    opponentElo: 1740,
    goalsPerGame: 2.7,
    minutesShare: 0.88,
    stats: {
      npGoals: 4,
      penalties: 0,
      assists: 11,
      keyPasses: 48,
      tacklesWon: 14,
      interceptions: 8,
      blocks: 2,
      aerialsWon: 6,
      yellow: 3,
      red: 0,
      passes: 980
    },
    honours: {},
    note: 'Key passes, no trophy this season'
  },
  {
    id: 'bench',
    name: 'Luca Ferrer',
    role: 'Striker · UCL squad',
    position: 'st',
    minutes: 420,
    opponentElo: 1810,
    goalsPerGame: 2.8,
    minutesShare: 0.13,
    stats: {
      npGoals: 1,
      penalties: 0,
      assists: 0,
      keyPasses: 2,
      tacklesWon: 1,
      interceptions: 0,
      blocks: 0,
      aerialsWon: 3,
      yellow: 0,
      red: 0,
      passes: 40
    },
    honours: { ucl: 1 },
    note: 'Full Champions League medal, 420 minutes'
  },
  {
    id: 'workhorse',
    name: 'Tomas Balek',
    role: 'Striker · no silverware',
    position: 'st',
    minutes: 3100,
    opponentElo: 1700,
    goalsPerGame: 2.65,
    minutesShare: 0.94,
    stats: {
      npGoals: 9,
      penalties: 0,
      assists: 6,
      keyPasses: 22,
      tacklesWon: 16,
      interceptions: 7,
      blocks: 2,
      aerialsWon: 28,
      yellow: 4,
      red: 0,
      passes: 510
    },
    honours: {},
    note: 'Starter all year, no trophy'
  }
];

export const PREVIEW_KEEPERS = [
  {
    id: 'busy',
    name: 'Chidi Nwosu',
    role: 'Keeper · weak defence',
    minutes: 3200,
    opponentElo: 1320,
    goalsPerGame: 2.5,
    minutesShare: 1,
    stats: {
      psxgPlus: -6.2,
      savePctResidual: -3,
      penaltiesSaved: 1,
      cleanSheets: 4,
      yellow: 1,
      red: 0,
      saves: 148
    },
    honours: {},
    note: 'Save volume from a leaking team'
  },
  {
    id: 'quiet',
    name: 'Erik Holm',
    role: 'Keeper · strong defence',
    minutes: 3200,
    opponentElo: 1780,
    goalsPerGame: 2.7,
    minutesShare: 1,
    stats: {
      psxgPlus: 7.1,
      savePctResidual: 4,
      penaltiesSaved: 2,
      cleanSheets: 16,
      yellow: 0,
      red: 0,
      saves: 72
    },
    honours: { goldenGlove: 1 },
    note: 'Fewer saves, stops more than expected'
  }
];

export const PREVIEW_COACHES = [
  {
    id: 'giant',
    name: 'Stefan Keller',
    role: 'Coach · inherited 1910 squad',
    actualPoints: 86,
    expectedPoints: 82,
    yellow: 4,
    red: 0,
    honours: { premierLeague: 1, fifaBestCoach: 1 },
    note: 'Won the league by sitting on a super-team'
  },
  {
    id: 'over',
    name: 'Ibrahim Diallo',
    role: 'Coach · inherited 1610 squad',
    actualPoints: 72,
    expectedPoints: 48,
    yellow: 6,
    red: 1,
    honours: {},
    note: 'No trophy; huge points over expected'
  }
];

export const CLUB_LEAGUES = {
  Arsenal: 'Premier League · 1st',
  Burnley: 'Premier League · 1st',
  Leeds: 'Championship · 2nd',
  'Sheffield United': 'Championship · 2nd',
  Enyimba: 'NPFL · 1st',
  'Remo Stars': 'NPFL · 1st'
};

/**
 * Closed leagues plus the real bridges: FA Cup (Championship–PL) and
 * intercontinental (PL–NPFL). Division number is not an input.
 */
export const PREVIEW_MATCHES = [
  { home: 'Arsenal', away: 'Burnley', homeGoals: 3, awayGoals: 0 },
  { home: 'Burnley', away: 'Arsenal', homeGoals: 0, awayGoals: 2 },
  { home: 'Arsenal', away: 'Burnley', homeGoals: 2, awayGoals: 1 },
  { home: 'Burnley', away: 'Arsenal', homeGoals: 1, awayGoals: 1 },
  { home: 'Arsenal', away: 'Burnley', homeGoals: 4, awayGoals: 0 },
  { home: 'Leeds', away: 'Sheffield United', homeGoals: 2, awayGoals: 0 },
  { home: 'Sheffield United', away: 'Leeds', homeGoals: 1, awayGoals: 1 },
  { home: 'Leeds', away: 'Sheffield United', homeGoals: 1, awayGoals: 0 },
  { home: 'Sheffield United', away: 'Leeds', homeGoals: 0, awayGoals: 2 },
  { home: 'Leeds', away: 'Burnley', homeGoals: 1, awayGoals: 1 },
  { home: 'Burnley', away: 'Leeds', homeGoals: 2, awayGoals: 0 },
  { home: 'Arsenal', away: 'Leeds', homeGoals: 2, awayGoals: 0 },
  { home: 'Enyimba', away: 'Remo Stars', homeGoals: 2, awayGoals: 1 },
  { home: 'Remo Stars', away: 'Enyimba', homeGoals: 1, awayGoals: 1 },
  { home: 'Enyimba', away: 'Remo Stars', homeGoals: 1, awayGoals: 0 },
  { home: 'Remo Stars', away: 'Enyimba', homeGoals: 2, awayGoals: 2 },
  { home: 'Enyimba', away: 'Remo Stars', homeGoals: 3, awayGoals: 1 },
  { home: 'Enyimba', away: 'Burnley', homeGoals: 0, awayGoals: 2 },
  { home: 'Burnley', away: 'Enyimba', homeGoals: 1, awayGoals: 0 },
  { home: 'Arsenal', away: 'Enyimba', homeGoals: 3, awayGoals: 0 },
  { home: 'Enyimba', away: 'Arsenal', homeGoals: 0, awayGoals: 2 },
  { home: 'Burnley', away: 'Remo Stars', homeGoals: 2, awayGoals: 0 },
  { home: 'Remo Stars', away: 'Burnley', homeGoals: 0, awayGoals: 1 }
];

export const COUNTING_WEIGHTS = {
  goals: 8,
  passes: 0.5,
  saves: 1,
  cleanSheets: 3,
  performance: {
    assists: 5,
    yellow: 2,
    red: 8
  },
  honours: {
    ucl: 70,
    premierLeague: 50,
    goldenGlove: 35,
    fifaBestCoach: 45
  }
};
