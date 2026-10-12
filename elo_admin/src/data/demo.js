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
    hint: 'Unseen clubs and nations start here. Continental games are the bridges between leagues.'
  },
  {
    id: 'kFactor',
    label: 'K-factor',
    hint: 'How far one result moves a rating. 20 is a common club default.'
  },
  {
    id: 'homeAdvantage',
    label: 'Home advantage (Elo pts)',
    hint: 'Added to the home club before expected score.'
  },
  {
    id: 'scaleAnchor',
    label: 'Quality anchor',
    hint: 'Opponent Elo equal to this → multiplier 1.0 on performance.'
  },
  {
    id: 'qualityScale',
    label: 'Quality scale',
    hint: 'Smaller is harsher between leagues. 400 is classic Elo; 600 is softer.'
  },
  {
    id: 'eraReferenceGpg',
    label: 'Era reference (goals/game)',
    hint: 'Scoring environment is divided into this. High-scoring eras shrink each goal.'
  }
];

const PLAYER_PERFORMANCE = [
  { id: 'npGoals', label: 'Non-penalty goals', hint: 'Open-play and set-piece goals. Scaled by opponent Elo and era.' },
  { id: 'penalties', label: 'Penalties scored', hint: 'Mostly a role. Keep this below open-play goals.' },
  { id: 'assists', label: 'Assists', hint: 'Final pass. Same quality/era scaling as goals.' },
  { id: 'keyPasses', label: 'Key passes', hint: 'Chances created. Replaces successful-pass volume.' },
  { id: 'tacklesWon', label: 'Tackles won' },
  { id: 'interceptions', label: 'Interceptions' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'aerialsWon', label: 'Aerials won' }
];

const DISCIPLINE = [
  { id: 'yellow', label: 'Yellow card', hint: 'Per 90, subtracted. Biased by era and position.', sign: 'minus' },
  { id: 'red', label: 'Red card', hint: 'Per 90, subtracted.', sign: 'minus' }
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
  { id: 'attack', title: 'Attack (per 90, opponent-scaled)', metrics: PLAYER_PERFORMANCE.slice(0, 4) },
  { id: 'defence', title: 'Defence (per 90, opponent-scaled)', metrics: PLAYER_PERFORMANCE.slice(4) },
  { id: 'discipline', title: 'Discipline', metrics: DISCIPLINE }
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
        hint: 'Season residual. Positive means the keeper beat expected goals on target.',
        kind: 'rate'
      },
      {
        id: 'savePctResidual',
        label: 'Save % vs expected',
        hint: 'Percentage points above or below expected. Not save volume.',
        kind: 'rate'
      },
      { id: 'penaltiesSaved', label: 'Penalties saved' }
    ]
  },
  {
    id: 'shared',
    title: 'Team-shared (keep small)',
    metrics: [
      { id: 'cleanSheets', label: 'Clean sheets', hint: 'A defensive unit stat with the keeper’s name on it.' }
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
        hint: 'Actual table points minus what the pre-season squad Elo implied. This is the coach spine.',
        kind: 'total'
      }
    ]
  },
  { id: 'discipline', title: 'Discipline', metrics: DISCIPLINE }
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

function playerPerformanceFor(positionId) {
  const fwd = ['st', 'cf', 'lw', 'rw'].includes(positionId);
  const mid = ['cam', 'cm', 'cdm', 'lm', 'rm'].includes(positionId);
  const wide = ['lw', 'rw', 'lm', 'rm', 'lb', 'rb', 'wb'].includes(positionId);

  return fillWeights(allMetrics(PLAYER_PERFORMANCE_GROUPS), {
    npGoals: fwd ? 8 : mid ? 4 : 3,
    penalties: fwd ? 3 : 1.5,
    assists: fwd || wide ? 5 : mid ? 6 : 2,
    keyPasses: fwd ? 1.2 : mid ? 2 : 0.6,
    tacklesWon: fwd ? 1 : mid ? 2 : 3,
    interceptions: fwd ? 0.8 : mid ? 2 : 3,
    blocks: fwd ? 0.5 : mid ? 1 : 2.5,
    aerialsWon: fwd ? 1 : mid ? 0.8 : 2,
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
    qualityScale: 600,
    eraReferenceGpg: 2.7,
    minutesShareHonours: true
  },
  players: {
    selected: ['st', 'cm', 'cb'],
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
      yellow: 1,
      red: 4
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
