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
    opponentPossession: 0.48,
    teamTotals: { npGoals: 52, assists: 38, keyPasses: 310 },
    stats: {
      npGoals: 28,
      penalties: 2,
      assists: 4,
      keyPasses: 12,
      tacklesWon: 8,
      interceptions: 4,
      blocks: 2,
      duelsWon: 22,
      yellow: 3,
      red: 0,
      passes: 420
    },
    honours: {},
    note: 'Volume scorer. 1340 is a transfer-prior illustration; the NPFL graph alone would sit near 1500.'
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
    opponentPossession: 0.46,
    teamTotals: { npGoals: 78, assists: 62, keyPasses: 520 },
    stats: {
      npGoals: 12,
      penalties: 1,
      assists: 5,
      keyPasses: 18,
      tacklesWon: 10,
      interceptions: 5,
      blocks: 1,
      duelsWon: 14,
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
    opponentPossession: 0.49,
    teamTotals: { npGoals: 64, assists: 48, keyPasses: 410 },
    stats: {
      npGoals: 18,
      penalties: 1,
      assists: 5,
      keyPasses: 16,
      tacklesWon: 9,
      interceptions: 5,
      blocks: 1,
      duelsWon: 18,
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
    opponentPossession: 0.38,
    teamTotals: { npGoals: 82, assists: 70, keyPasses: 540 },
    stats: {
      npGoals: 1,
      penalties: 0,
      assists: 3,
      keyPasses: 9,
      tacklesWon: 18,
      interceptions: 22,
      blocks: 6,
      duelsWon: 12,
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
    role: 'Attacking mid · chance creator',
    position: 'cam',
    minutes: 2800,
    opponentElo: 1740,
    goalsPerGame: 2.7,
    minutesShare: 0.88,
    opponentPossession: 0.42,
    teamTotals: { npGoals: 86, assists: 74, keyPasses: 560 },
    stats: {
      npGoals: 4,
      penalties: 0,
      assists: 11,
      keyPasses: 48,
      tacklesWon: 14,
      interceptions: 8,
      blocks: 2,
      duelsWon: 6,
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
    opponentPossession: 0.4,
    teamTotals: { npGoals: 90, assists: 72, keyPasses: 580 },
    stats: {
      npGoals: 1,
      penalties: 0,
      assists: 0,
      keyPasses: 2,
      tacklesWon: 1,
      interceptions: 0,
      blocks: 0,
      duelsWon: 3,
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
    opponentPossession: 0.51,
    teamTotals: { npGoals: 58, assists: 44, keyPasses: 390 },
    stats: {
      npGoals: 9,
      penalties: 0,
      assists: 6,
      keyPasses: 22,
      tacklesWon: 16,
      interceptions: 7,
      blocks: 2,
      duelsWon: 28,
      yellow: 4,
      red: 0,
      passes: 510
    },
    honours: {},
    note: 'Starter all year, no trophy'
  },
  {
    id: 'saliba',
    name: 'Ilya Moreau',
    role: 'Centre back · possession side',
    position: 'cb',
    minutes: 3000,
    opponentElo: 1760,
    goalsPerGame: 2.7,
    minutesShare: 0.92,
    opponentPossession: 0.38,
    teamTotals: { npGoals: 78, assists: 62, keyPasses: 520 },
    stats: {
      npGoals: 2,
      penalties: 0,
      assists: 1,
      keyPasses: 4,
      tacklesWon: 28,
      interceptions: 22,
      blocks: 18,
      duelsWon: 125,
      yellow: 3,
      red: 0,
      passes: 2100
    },
    honours: {},
    note: 'Few tackles because the team has the ball'
  },
  {
    id: 'relegation-cb',
    name: 'Darren Cole',
    role: 'Centre back · relegation side',
    position: 'cb',
    minutes: 3000,
    opponentElo: 1760,
    goalsPerGame: 2.7,
    minutesShare: 0.93,
    opponentPossession: 0.62,
    teamTotals: { npGoals: 36, assists: 28, keyPasses: 240 },
    stats: {
      npGoals: 1,
      penalties: 0,
      assists: 0,
      keyPasses: 2,
      tacklesWon: 52,
      interceptions: 40,
      blocks: 24,
      duelsWon: 110,
      yellow: 8,
      red: 1,
      passes: 980
    },
    honours: {},
    note: 'Volume defending; possession-adjusted, not Q-scaled'
  }
];

export const PREVIEW_KEEPERS = [
  {
    id: 'busy',
    entity: 'keeper',
    hasPsxg: true,
    name: 'Chidi Nwosu',
    role: 'Keeper · weak defence (PSxG)',
    position: 'gk',
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
    entity: 'keeper',
    hasPsxg: true,
    name: 'Erik Holm',
    role: 'Keeper · strong defence (PSxG)',
    position: 'gk',
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
  },
  {
    id: 'nopx',
    entity: 'keeper',
    hasPsxg: false,
    name: 'Kwame Boateng',
    role: 'Keeper · no PSxG coverage',
    position: 'gk',
    minutes: 3060,
    opponentElo: 1500,
    goalsPerGame: 2.4,
    minutesShare: 0.95,
    stats: {
      penaltiesSaved: 3,
      cleanSheets: 11,
      yellow: 0,
      red: 0,
      saves: 96
    },
    honours: {},
    note: 'Basic stratum: pens and clean sheets only. Not in the PSxG z-board.'
  }
];

export const PREVIEW_COACHES = [
  {
    id: 'giant',
    name: 'Stefan Keller',
    role: 'Coach · inherited 1910 squad',
    actualPoints: 86,
    expectedPoints: 82,
    frozenClubElo: 1910,
    honours: { premierLeague: 1, fifaBestCoach: 1 },
    note: 'Holds a super-team. Level counts; Δ is small.'
  },
  {
    id: 'over',
    name: 'Ibrahim Diallo',
    role: 'Coach · inherited 1610 squad',
    actualPoints: 72,
    expectedPoints: 48,
    frozenClubElo: 1610,
    honours: {},
    note: 'No trophy; large Δ over a frozen 1610 baseline'
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
  { kickoff: '2024-08-10', competition: 'league', home: 'Arsenal', away: 'Burnley', homeGoals: 3, awayGoals: 0 },
  { kickoff: '2024-08-17', competition: 'league', home: 'Burnley', away: 'Arsenal', homeGoals: 0, awayGoals: 2 },
  { kickoff: '2024-08-24', competition: 'league', home: 'Arsenal', away: 'Burnley', homeGoals: 2, awayGoals: 1 },
  { kickoff: '2024-08-31', competition: 'league', home: 'Burnley', away: 'Arsenal', homeGoals: 1, awayGoals: 1 },
  { kickoff: '2024-09-07', competition: 'league', home: 'Arsenal', away: 'Burnley', homeGoals: 4, awayGoals: 0 },
  { kickoff: '2024-09-14', competition: 'league', home: 'Leeds', away: 'Sheffield United', homeGoals: 2, awayGoals: 0 },
  { kickoff: '2024-09-21', competition: 'league', home: 'Sheffield United', away: 'Leeds', homeGoals: 1, awayGoals: 1 },
  { kickoff: '2024-09-28', competition: 'league', home: 'Leeds', away: 'Sheffield United', homeGoals: 1, awayGoals: 0 },
  { kickoff: '2024-10-05', competition: 'league', home: 'Sheffield United', away: 'Leeds', homeGoals: 0, awayGoals: 2 },
  { kickoff: '2025-01-12', competition: 'cup', home: 'Leeds', away: 'Burnley', homeGoals: 1, awayGoals: 1 },
  { kickoff: '2025-01-19', competition: 'cup', home: 'Burnley', away: 'Leeds', homeGoals: 2, awayGoals: 0 },
  { kickoff: '2025-02-02', competition: 'cup', home: 'Arsenal', away: 'Leeds', homeGoals: 2, awayGoals: 0 },
  { kickoff: '2024-09-15', competition: 'league', home: 'Enyimba', away: 'Remo Stars', homeGoals: 2, awayGoals: 1 },
  { kickoff: '2024-09-22', competition: 'league', home: 'Remo Stars', away: 'Enyimba', homeGoals: 1, awayGoals: 1 },
  { kickoff: '2024-09-29', competition: 'league', home: 'Enyimba', away: 'Remo Stars', homeGoals: 1, awayGoals: 0 },
  { kickoff: '2024-10-06', competition: 'league', home: 'Remo Stars', away: 'Enyimba', homeGoals: 2, awayGoals: 2 },
  { kickoff: '2024-10-13', competition: 'league', home: 'Enyimba', away: 'Remo Stars', homeGoals: 3, awayGoals: 1 },
  { kickoff: '2025-06-15', competition: 'continental', home: 'Enyimba', away: 'Burnley', homeGoals: 0, awayGoals: 2 },
  { kickoff: '2025-06-22', competition: 'continental', home: 'Burnley', away: 'Enyimba', homeGoals: 1, awayGoals: 0 },
  { kickoff: '2025-06-29', competition: 'continental', home: 'Arsenal', away: 'Enyimba', homeGoals: 3, awayGoals: 0 },
  { kickoff: '2025-07-06', competition: 'continental', home: 'Enyimba', away: 'Arsenal', homeGoals: 0, awayGoals: 2 },
  { kickoff: '2025-07-13', competition: 'continental', home: 'Burnley', away: 'Remo Stars', homeGoals: 2, awayGoals: 0 },
  { kickoff: '2025-07-20', competition: 'continental', home: 'Remo Stars', away: 'Burnley', homeGoals: 0, awayGoals: 1 }
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
