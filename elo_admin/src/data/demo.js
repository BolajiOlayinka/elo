export const STATS = {
  users: 1842,
  usersLogin: 327,
  pageVisits: 48190,
  players: 12864,
  leagues: 214,
  coaches: 1903,
  competitions: 96,
  clubs: 4120,
  nations: 211
};

export const VISITS = [18, 22, 19, 28, 31, 26, 34, 29, 41, 38, 44, 52, 47, 55];

export const USERS = [
  {
    id: 'u1',
    firstName: 'Amaka',
    lastName: 'Okonkwo',
    email: 'amaka.okonkwo@example.com',
    phone: '+234 803 441 2290',
    country: 'Nigeria',
    city: 'Lagos',
    roles: ['member'],
    isVerified: true,
    lastLogin: '2026-10-12 09:14',
    createdAt: '2026-03-11',
    visits: 84
  },
  {
    id: 'u2',
    firstName: 'James',
    lastName: 'Whitaker',
    email: 'james.whitaker@example.com',
    phone: '+44 7700 900214',
    country: 'England',
    city: 'Manchester',
    roles: ['member', 'analyst'],
    isVerified: true,
    lastLogin: '2026-10-12 08:02',
    createdAt: '2025-11-02',
    visits: 210
  },
  {
    id: 'u3',
    firstName: 'Sofia',
    lastName: 'Almeida',
    email: 'sofia.almeida@example.com',
    phone: '+351 912 334 881',
    country: 'Portugal',
    city: 'Porto',
    roles: ['member'],
    isVerified: false,
    lastLogin: '2026-10-09 21:40',
    createdAt: '2026-07-19',
    visits: 12
  },
  {
    id: 'u4',
    firstName: 'Kenji',
    lastName: 'Sato',
    email: 'kenji.sato@example.com',
    phone: '+81 90 1234 7788',
    country: 'Japan',
    city: 'Tokyo',
    roles: ['member'],
    isVerified: true,
    lastLogin: '2026-10-11 16:28',
    createdAt: '2026-01-08',
    visits: 56
  },
  {
    id: 'u5',
    firstName: 'Camila',
    lastName: 'Rojas',
    email: 'camila.rojas@example.com',
    phone: '+54 11 5550 4412',
    country: 'Argentina',
    city: 'Buenos Aires',
    roles: ['member'],
    isVerified: true,
    lastLogin: '2026-10-12 11:05',
    createdAt: '2026-04-22',
    visits: 133
  },
  {
    id: 'u6',
    firstName: 'Omar',
    lastName: 'Haddad',
    email: 'omar.haddad@example.com',
    phone: '+212 661 220 194',
    country: 'Morocco',
    city: 'Casablanca',
    roles: ['member'],
    isVerified: true,
    lastLogin: '2026-10-08 19:51',
    createdAt: '2025-12-14',
    visits: 41
  },
  {
    id: 'u7',
    firstName: 'Elena',
    lastName: 'Novak',
    email: 'elena.novak@example.com',
    phone: '+385 91 555 0182',
    country: 'Croatia',
    city: 'Zagreb',
    roles: ['member'],
    isVerified: false,
    lastLogin: 'Never',
    createdAt: '2026-10-01',
    visits: 3
  },
  {
    id: 'u8',
    firstName: 'Marcus',
    lastName: 'Berg',
    email: 'marcus.berg@example.com',
    phone: '+46 70 123 9981',
    country: 'Sweden',
    city: 'Gothenburg',
    roles: ['member'],
    isVerified: true,
    lastLogin: '2026-10-10 07:33',
    createdAt: '2026-02-17',
    visits: 67
  }
];

export const STAFF = [
  {
    id: 's1',
    firstName: 'Bolaji',
    lastName: 'Olayinka',
    email: 'bolaji@elostats.football',
    role: 'Super admin',
    department: 'Product',
    status: 'Active',
    lastLogin: '2026-10-12 13:40'
  },
  {
    id: 's2',
    firstName: 'Nina',
    lastName: 'Adeyemi',
    email: 'nina@elostats.football',
    role: 'Admin',
    department: 'Operations',
    status: 'Active',
    lastLogin: '2026-10-12 10:18'
  },
  {
    id: 's3',
    firstName: 'Hugo',
    lastName: 'Martins',
    email: 'hugo@elostats.football',
    role: 'Analyst',
    department: 'Ratings',
    status: 'Active',
    lastLogin: '2026-10-11 17:02'
  },
  {
    id: 's4',
    firstName: 'Priya',
    lastName: 'Shah',
    email: 'priya@elostats.football',
    role: 'Editor',
    department: 'Content',
    status: 'Invited',
    lastLogin: 'Never'
  },
  {
    id: 's5',
    firstName: 'Theo',
    lastName: 'Laurent',
    email: 'theo@elostats.football',
    role: 'Viewer',
    department: 'Support',
    status: 'Disabled',
    lastLogin: '2026-09-02 12:11'
  }
];

export const PERMISSIONS = [
  'View dashboard',
  'Manage users',
  'Edit point weights',
  'Manage staff',
  'Manage roles',
  'Publish ratings',
  'Run ingest'
];

export const ROLES = [
  {
    id: 'super-admin',
    name: 'Super admin',
    description: 'Full access, including staff and roles.',
    permissions: PERMISSIONS
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Operate the product except role assignment.',
    permissions: PERMISSIONS.filter((item) => item !== 'Manage roles')
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Tune point weights and inspect ratings.',
    permissions: ['View dashboard', 'Edit point weights', 'Publish ratings']
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Update copy and public-facing records.',
    permissions: ['View dashboard', 'Publish ratings']
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to statistics.',
    permissions: ['View dashboard']
  }
];

export const POINT_TABS = [
  { id: 'players', label: 'Players' },
  { id: 'keepers', label: 'Keepers' },
  { id: 'coaches', label: 'Coaches' },
  { id: 'clubs', label: 'Clubs' }
];

export const SHEET_TABS = [
  { id: 'performance', label: 'Performance' },
  { id: 'honours', label: 'Honours' }
];

export const PLAYER_POSITIONS = [
  { id: 'st', label: 'Striker' },
  { id: 'cf', label: 'Centre forward' },
  { id: 'lw', label: 'Left winger' },
  { id: 'rw', label: 'Right winger' },
  { id: 'cam', label: 'Attacking mid' },
  { id: 'cm', label: 'Central mid' },
  { id: 'cdm', label: 'Defensive mid' },
  { id: 'lm', label: 'Left mid' },
  { id: 'rm', label: 'Right mid' },
  { id: 'lb', label: 'Left back' },
  { id: 'rb', label: 'Right back' },
  { id: 'wb', label: 'Wing back' },
  { id: 'cb', label: 'Centre back' }
];

export const ENGINE_FIELDS = [
  {
    id: 'startRating',
    label: 'Starting Elo',
    hint: 'Unseen clubs and nations start here. Isolated leagues stay near this until cups, promotion, or transfer priors.'
  },
  {
    id: 'kFactor',
    label: 'K-factor',
    hint: 'League match step. Cups use 0.75×, friendlies 0.5×.'
  },
  {
    id: 'homeAdvantage',
    label: 'Home advantage (Elo pts)',
    hint: 'Added to the home club. Neutral venues use 0. Away players see opponent Elo + this in Q.'
  },
  {
    id: 'scaleAnchor',
    label: 'Quality anchor',
    hint: 'Opponent Elo equal to this → Q = 1 on attacking actions.'
  },
  {
    id: 'qualityScale',
    label: 'Quality scale S',
    hint: 'Placeholder until fitted on transfers. Larger is softer. Caps still apply.'
  },
  {
    id: 'qualityCap',
    label: 'Q cap',
    hint: 'Maximum opponent-quality multiplier on goals/assists/key passes.'
  },
  {
    id: 'eloSigma',
    label: 'z → Elo (σ)',
    hint: 'Player Elo = 1500 + σ × shrunk z. 200 means +2σ → 1900.'
  },
  {
    id: 'minutesPrior',
    label: 'Minutes prior M₀',
    hint: 'Shrinkage z × M / (M + M₀). Softens short seasons instead of a 900′ cliff.'
  },
  {
    id: 'honoursBlend',
    label: 'Honours blend λ',
    hint: 'Elo+honours = (1−λ) Performance + λ (Performance + capped individual awards). Rich stats: keep small.'
  }
];

const PLAYER_PERFORMANCE = [
  { id: 'npGoals', label: 'Non-penalty goals', hint: 'Q-scaled. Mix with share of team goals so super-team strikers are damped.' },
  { id: 'penalties', label: 'Penalties scored', hint: 'Mostly a role. Keep this below open-play goals. Q-scaled.' },
  { id: 'assists', label: 'Assists', hint: 'Final pass. Q-scaled and share-damped.' },
  { id: 'keyPasses', label: 'Key passes', hint: 'Chances created. Q-scaled. Replaces pass volume.' },
  { id: 'tacklesWon', label: 'Tackles won', hint: 'Not Q-scaled. Possession-adjusted so low-block volume does not win.' },
  { id: 'interceptions', label: 'Interceptions', hint: 'Not Q-scaled. Possession-adjusted.' },
  { id: 'blocks', label: 'Blocks', hint: 'Not Q-scaled. Possession-adjusted.' },
  { id: 'duelsWon', label: 'Duels won', hint: 'API-Football duels.won. Not Q-scaled. Possession-adjusted.' }
];

const DISCIPLINE = [
  { id: 'yellow', label: 'Yellow card', hint: 'Unscaled. A card vs Arsenal is not 2.5× a card vs Derby.', sign: 'minus' },
  { id: 'red', label: 'Red card', hint: 'Unscaled. Subtracted from season points.', sign: 'minus' }
];

const INDIVIDUAL_AWARDS = [
  { id: 'motm', label: 'Man of the Match', hint: 'Vote. Often missing historically.' },
  { id: 'ballonDor', label: "Ballon d'Or" },
  { id: 'fifaBest', label: 'FIFA Best Player' },
  { id: 'otherIndividual', label: 'Other individual awards', hint: 'Puskas, Golden Boot, World Cup awards, etc.' },
  { id: 'africanBest', label: 'African Best Player' },
  { id: 'europeanBest', label: 'European Best Player' },
  { id: 'asianBest', label: 'Asian Best Player' },
  { id: 'southAmericanBest', label: 'South American Best Player' },
  { id: 'concacafBest', label: 'CONCACAF Best Player' }
];

const TEAM_AWARDS = [
  { id: 'worldCup', label: 'World Cup' },
  { id: 'euros', label: 'European Championship' },
  { id: 'copaAmerica', label: 'Copa América' },
  { id: 'afcon', label: 'Africa Cup of Nations' },
  { id: 'asianCup', label: 'Asian Cup' },
  { id: 'goldCup', label: 'CONCACAF Gold Cup' },
  { id: 'ucl', label: 'UEFA Champions League' },
  { id: 'libertadores', label: 'Copa Libertadores' },
  { id: 'uel', label: 'UEFA Europa League' },
  { id: 'cafCl', label: 'CAF Champions League' },
  { id: 'clubWorldCup', label: 'Club World Cup' },
  { id: 'premierLeague', label: 'Premier League' },
  { id: 'laLiga', label: 'La Liga' },
  { id: 'bundesliga', label: 'Bundesliga' },
  { id: 'serieA', label: 'Serie A' },
  { id: 'ligue1', label: 'Ligue 1' },
  { id: 'domesticCup', label: 'Domestic cup (FA, Copa del Rey, …)' }
];

export const TEAM_HONOUR_IDS = new Set(TEAM_AWARDS.map((item) => item.id));

export const PLAYER_PERFORMANCE_GROUPS = [
  { id: 'attack', title: 'Attack (Q-scaled, share-damped)', metrics: PLAYER_PERFORMANCE.slice(0, 4) },
  { id: 'defence', title: 'Defence (possession-adjusted, no Q)', metrics: PLAYER_PERFORMANCE.slice(4) },
  { id: 'discipline', title: 'Discipline (unscaled)', metrics: DISCIPLINE }
];

export const PLAYER_HONOURS_GROUPS = [
  { id: 'individual', title: 'Individual awards (votes)', metrics: INDIVIDUAL_AWARDS },
  { id: 'team', title: 'Team awards (minutes-shared)', metrics: TEAM_AWARDS }
];

export const KEEPER_PERFORMANCE_GROUPS = [
  {
    id: 'shotstopping',
    title: 'Shot-stopping',
    metrics: [
      {
        id: 'psxgPlus',
        label: 'PSxG − goals conceded',
        hint: 'Season residual. Not Q-scaled. Drop if missing; never impute. Own z-stratum.',
        kind: 'rate'
      },
      {
        id: 'savePctResidual',
        label: 'Save % vs expected',
        hint: 'Only if an expected-saves model exists. Not Q-scaled. Do not mix with no-PSxG keepers.',
        kind: 'rate'
      },
      { id: 'penaltiesSaved', label: 'Penalties saved' }
    ]
  },
  {
    id: 'shared',
    title: 'Team-shared (keep small)',
    metrics: [
      { id: 'cleanSheets', label: 'Clean sheets', hint: 'Team stat. Not Q-scaled. Keep the weight small.' }
    ]
  },
  { id: 'discipline', title: 'Discipline', metrics: DISCIPLINE }
];

export const KEEPER_HONOURS_GROUPS = [
  {
    id: 'individual',
    title: 'Individual awards (votes)',
    metrics: [
      { id: 'goldenGlove', label: 'Golden Glove' },
      { id: 'bestKeeper', label: 'Best goalkeeper (Yashin, FIFA, confederation)' }
    ]
  },
  { id: 'team', title: 'Team awards (minutes-shared)', metrics: TEAM_AWARDS }
];

export const COACH_PERFORMANCE_GROUPS = [
  {
    id: 'results',
    title: 'Results vs expected',
    metrics: [
      {
        id: 'overperformance',
        label: 'League points vs expected',
        hint: 'Actual table points minus frozen pre-season club Elo over the real schedule. Change, not level.',
        kind: 'total'
      },
      {
        id: 'level',
        label: 'Frozen club Elo (per 100 pts above 1500)',
        hint: 'Stops a 1900-club coach looking average for holding 1900. Pre-season snapshot only.',
        kind: 'total'
      }
    ]
  },
  { id: 'discipline', title: 'Touchline cards only', metrics: DISCIPLINE }
];

export const COACH_HONOURS_GROUPS = [
  { id: 'team', title: 'Team awards and trophies', metrics: TEAM_AWARDS },
  {
    id: 'individual',
    title: 'Individual awards (votes)',
    metrics: [
      { id: 'fifaBestCoach', label: 'FIFA Best Coach' },
      { id: 'leagueManager', label: 'League manager of the year' }
    ]
  }
];

function fillWeights(metrics, values) {
  const row = {};
  for (const metric of metrics) {
    row[metric.id] = values[metric.id] ?? 0;
  }
  return row;
}

function allMetrics(groups) {
  return groups.flatMap((group) => group.metrics);
}

const HONOURS_DEFAULTS = {
  motm: 8,
  ballonDor: 80,
  fifaBest: 70,
  otherIndividual: 25,
  africanBest: 40,
  europeanBest: 40,
  asianBest: 40,
  southAmericanBest: 40,
  concacafBest: 35,
  worldCup: 90,
  euros: 55,
  copaAmerica: 50,
  afcon: 45,
  asianCup: 45,
  goldCup: 40,
  ucl: 70,
  libertadores: 65,
  uel: 35,
  cafCl: 40,
  clubWorldCup: 25,
  premierLeague: 50,
  laLiga: 50,
  bundesliga: 45,
  serieA: 45,
  ligue1: 40,
  domesticCup: 18,
  goldenGlove: 35,
  bestKeeper: 50,
  fifaBestCoach: 45,
  leagueManager: 20
};

const ROLE_PRIORS = {
  st: { npGoals: 8, penalties: 3, assists: 5, keyPasses: 1.2, tacklesWon: 0.8, interceptions: 0.8, blocks: 0.5, duelsWon: 1 },
  cf: { npGoals: 8, penalties: 3, assists: 4.5, keyPasses: 1.3, tacklesWon: 0.9, interceptions: 0.9, blocks: 0.6, duelsWon: 1.2 },
  lw: { npGoals: 6, penalties: 2, assists: 6, keyPasses: 1.8, tacklesWon: 1.2, interceptions: 1, blocks: 0.6, duelsWon: 1 },
  rw: { npGoals: 6, penalties: 2, assists: 6, keyPasses: 1.8, tacklesWon: 1.2, interceptions: 1, blocks: 0.6, duelsWon: 1 },
  cam: { npGoals: 5, penalties: 2, assists: 6, keyPasses: 2.4, tacklesWon: 1.2, interceptions: 1, blocks: 0.6, duelsWon: 0.8 },
  cm: { npGoals: 4, penalties: 1.5, assists: 5, keyPasses: 1.8, tacklesWon: 2.2, interceptions: 2.2, blocks: 1, duelsWon: 1.2 },
  cdm: { npGoals: 2, penalties: 1, assists: 3, keyPasses: 1.2, tacklesWon: 3, interceptions: 3.2, blocks: 2, duelsWon: 1.8 },
  lm: { npGoals: 4, penalties: 1.5, assists: 5, keyPasses: 1.8, tacklesWon: 2, interceptions: 1.8, blocks: 0.8, duelsWon: 1.1 },
  rm: { npGoals: 4, penalties: 1.5, assists: 5, keyPasses: 1.8, tacklesWon: 2, interceptions: 1.8, blocks: 0.8, duelsWon: 1.1 },
  lb: { npGoals: 2, penalties: 1, assists: 3.5, keyPasses: 1, tacklesWon: 2.5, interceptions: 2.5, blocks: 1.5, duelsWon: 1.8 },
  rb: { npGoals: 2, penalties: 1, assists: 3.5, keyPasses: 1, tacklesWon: 2.5, interceptions: 2.5, blocks: 1.5, duelsWon: 1.8 },
  wb: { npGoals: 3, penalties: 1, assists: 5, keyPasses: 1.6, tacklesWon: 2.2, interceptions: 2, blocks: 1.2, duelsWon: 1.5 },
  cb: { npGoals: 2, penalties: 1, assists: 1, keyPasses: 0.4, tacklesWon: 3, interceptions: 3, blocks: 2.8, duelsWon: 2.5 }
};

function playerPerformanceFor(positionId) {
  return fillWeights(allMetrics(PLAYER_PERFORMANCE_GROUPS), {
    ...(ROLE_PRIORS[positionId] || ROLE_PRIORS.cm),
    yellow: 1.5,
    red: 6
  });
}

export const DEFAULT_POINT_CONFIG = {
  engine: {
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
    honoursBlend: 0.15,
    honoursBlendThin: 0.45,
    honoursBoostCap: 100,
    drawRate: 0.28,
    useGoalDifference: true,
    minutesShareHonours: true
  },
  players: {
    selected: ['st', 'cam', 'cm', 'cdm', 'cb'],
    performance: Object.fromEntries(
      PLAYER_POSITIONS.map((position) => [position.id, playerPerformanceFor(position.id)])
    ),
    honours: fillWeights(allMetrics(PLAYER_HONOURS_GROUPS), HONOURS_DEFAULTS)
  },
  keepers: {
    performance: fillWeights(allMetrics(KEEPER_PERFORMANCE_GROUPS), {
      psxgPlus: 6,
      savePctResidual: 4,
      penaltiesSaved: 8,
      cleanSheets: 1.5,
      yellow: 1.5,
      red: 8
    }),
    honours: fillWeights(allMetrics(KEEPER_HONOURS_GROUPS), HONOURS_DEFAULTS)
  },
  coaches: {
    performance: fillWeights(allMetrics(COACH_PERFORMANCE_GROUPS), {
      overperformance: 2.5,
      level: 8,
      yellow: 0,
      red: 0
    }),
    honours: fillWeights(allMetrics(COACH_HONOURS_GROUPS), {
      ...HONOURS_DEFAULTS,
      worldCup: 100,
      euros: 70,
      copaAmerica: 65,
      afcon: 55,
      asianCup: 55,
      goldCup: 50,
      ucl: 85,
      libertadores: 80,
      premierLeague: 60,
      laLiga: 60,
      bundesliga: 55,
      serieA: 55,
      ligue1: 50,
      domesticCup: 22
    })
  }
};

export const SESSION = {
  firstName: 'Bolaji',
  lastName: 'Olayinka',
  email: 'bolaji@elostats.football',
  role: 'Super admin',
  country: 'Nigeria',
  city: 'Lagos'
};

export function getUser(id) {
  return USERS.find((user) => user.id === id) || null;
}
