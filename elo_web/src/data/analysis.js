import heroSrc from '../assets/blog_hero.png';
import thumbSrc from '../assets/blog_thumbnail.png';

export const ANALYSIS_CATEGORIES = [
  { id: 'all', label: 'Analyze' },
  { id: 'peak', label: 'Peak Seasons' },
  { id: 'compare', label: 'Player Comparisons' },
  { id: 'roles', label: 'Tactical roles' },
  { id: 'notes', label: 'Ranking Notes' }
];

export const ANALYSIS_ARTICLES = [
  {
    id: 'henry-salah-peak',
    slug: 'henry-2003-04-peak-vs-salah-2017-18',
    category: 'peak',
    categoryLabel: 'Analysis essay',
    comparison: true,
    title: 'Henry’s 2003–04 peak was more complete; Salah’s 2017–18 was the higher-volume scoring season.',
    cardTitle: 'Henry’s 2003–04 peak vs Salah’s 2017–18 scoring season',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 8,
    arguments: 38,
    clips: 12864,
    publishedAt: '2026-10-04',
    publishedLabel: '4 Oct 2026',
    author: {
      name: 'Mayaya Cheneh',
      role: 'Analyst',
      initials: 'MC'
    },
    thumbnail: thumbSrc,
    hero: heroSrc,
    metrics: [
      { id: 'peak', label: 'Peak Elo score', left: '14.88', right: '13.10', winner: 'left' },
      { id: 'npg', label: 'NPG / 90', left: '0.94', right: '0.97', winner: 'right' },
      { id: 'xa', label: 'Chance creation', left: '0.41', right: '0.33', winner: 'left', unit: 'xA/90' }
    ],
    metricNames: { left: 'Henry', right: 'Salah' },
    body: [
      {
        heading: 'The verdict is close, but the shape of dominance is different.',
        text: 'Salah’s 2017–18 is the more relentless scoring campaign. Henry’s 2003–04 asks more of a forward and delivers a broader pitch total. League strength, chance creation, ball progression, and finishing all sit in the same model — not a volume table with a league multiplier taped on.'
      },
      {
        heading: 'The argument for Henry',
        text: 'Henry carried more of the creative burden in a lower-scoring league environment. He headed the ball into danger, created for teammates, and still produced elite finishing. Era normalization raises his attacking impact by about 8% against a 2.7 goals-per-game reference. The chance-creation gap is not a footnote: 0.41 xA/90 is a creative hub still delivering an elite scoring season.'
      },
      {
        heading: 'The counterpoint',
        text: 'Scoring volume is not a footnote. Salah’s shot generation forced teams to defend a different Liverpool attack, and 0.94–0.97 NPG/90 is historically rare. The model does not erase that. It asks whether the rest of the pitch — progression, chance share, opponent Elo — still leaves 2003–04 ahead on peak completeness.'
      }
    ],
    comments: [
      {
        id: 'c1',
        name: 'Rory Patel',
        initials: 'RP',
        when: '18 min ago',
        stance: 'challenge',
        text: 'The model underrates Salah’s off-ball gravity. Liverpool’s right-sided overload was designed around the space he created by receiving, which the chance-creation score does not capture.',
        upvotes: 12,
        downvotes: 2,
        match: { label: 'Liverpool 5–0 Watford', clock: '18:42' },
        replies: [
          {
            id: 'c1r1',
            name: 'Kenji Sato',
            initials: 'KS',
            when: '10 min ago',
            stance: 'support',
            text: 'Gravity is real, but it still has to show up in chance share. The essay is asking for a measurable proxy, not a vibe.',
            upvotes: 4,
            downvotes: 0
          }
        ]
      },
      {
        id: 'c2',
        name: 'Aisha Bell',
        initials: 'AB',
        when: '42 min ago',
        stance: 'support',
        text: 'Henry’s 0.41 xA/90 is decisive for me. The gap is not only about output; he was the creative hub while still delivering an elite scoring season.',
        upvotes: 9,
        downvotes: 1
      },
      {
        id: 'c3',
        name: 'Luis Moreira',
        initials: 'LM',
        when: '1 h ago',
        stance: 'challenge',
        text: 'If you hold finishing constant, Salah’s volume still moves the series. Completeness is doing too much work in the verdict.',
        upvotes: 6,
        downvotes: 3
      },
      {
        id: 'c4',
        name: 'Nora Adeyemi',
        initials: 'NA',
        when: '3 h ago',
        stance: 'support',
        text: 'The Q adjustment is the point. Raw NPG/90 without opponent Elo is how this comparison used to get shouted, not tested.',
        upvotes: 11,
        downvotes: 0
      }
    ]
  },
  {
    id: 'modric-2018',
    slug: 'modric-2017-18-progression',
    category: 'roles',
    categoryLabel: 'Tactical roles',
    comparison: true,
    title: 'The midfielder who turned pressure into progression: Modrić’s 2017–18',
    cardTitle: 'The midfielder who turned pressure into progression: Modrić’s 2017–18',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 6,
    arguments: 62,
    clips: 4201,
    publishedAt: '2026-10-03',
    publishedLabel: '3 Oct 2026',
    author: {
      name: 'Mayaya Cheneh',
      role: 'Analyst',
      initials: 'MC'
    },
    thumbnail: thumbSrc,
    hero: heroSrc,
    metrics: [
      { id: 'peak', label: 'Peak Elo score', left: '12.40', right: '11.10', winner: 'left' },
      { id: 'prog', label: 'Progressive actions / 90', left: '8.2', right: '6.4', winner: 'left' },
      { id: 'press', label: 'Pressure received', left: '24', right: '19', winner: 'left' }
    ],
    metricNames: { left: 'Modrić', right: 'Peer CM' },
    body: [
      {
        heading: 'A 10 who still did the 8’s job',
        text: 'Modrić’s 2017–18 is the case for an attacking-mid peer group of its own. Compared with box-to-box eights, the chance-creation weights finally match the job. Compared with pure 10s, the pressure he received still shows up in progressive actions, not in a tackle volume contest.'
      },
      {
        heading: 'Why the role split matters',
        text: 'A single “midfield” z-score would put him in Rodri’s peer group. The model does not. Minutes in AM use AM weights. That is the whole point of position-fair Elo.'
      }
    ],
    comments: [
      {
        id: 'c1',
        name: 'Kenji Sato',
        initials: 'KS',
        when: '2 h ago',
        text: 'This is why CM and AM cannot share μ and σ. The essay is the product copy for the rating spec.',
        agrees: 7
      }
    ]
  },
  {
    id: 'kdb-2019',
    slug: 'de-bruyne-2019-20-creative-season',
    category: 'compare',
    categoryLabel: 'Player Comparisons',
    comparison: true,
    title: 'De Bruyne’s 2019–20 is still the best creative league season in the record.',
    cardTitle: 'De Bruyne’s 2019–20 is still the best creative league season in the record',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 7,
    arguments: 62,
    clips: 6102,
    publishedAt: '2026-10-02',
    publishedLabel: '2 Oct 2026',
    author: {
      name: 'Mayaya Cheneh',
      role: 'Analyst',
      initials: 'MC'
    },
    thumbnail: thumbSrc,
    hero: heroSrc,
    metrics: [
      { id: 'kp', label: 'Key passes / 90', left: '3.4', right: '2.1', winner: 'left' },
      { id: 'ast', label: 'Assists', left: '20', right: '12', winner: 'left' },
      { id: 'q', label: 'Mean opponent Elo', left: '1760', right: '1740', winner: 'left' }
    ],
    metricNames: { left: 'De Bruyne', right: 'League AM' },
    body: [
      {
        heading: 'Volume that survives Q',
        text: 'Twenty assists in a 1760 opponent pool is not the same as twenty in a 1500 pool. The essay walks the quality multiplier and the share-of-team dampener so a City creator is not credited for the whole attack.'
      }
    ],
    comments: []
  },
  {
    id: 'bergkamp-connective',
    slug: 'bergkamp-connective-genius',
    category: 'notes',
    categoryLabel: 'Ranking Notes',
    comparison: true,
    title: 'The case for Bergkamp as Arsenal’s connective genius',
    cardTitle: 'The case for Bergkamp as Arsenal’s connective genius',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 5,
    arguments: 41,
    clips: 2904,
    publishedAt: '2026-09-28',
    publishedLabel: '28 Sep 2026',
    author: {
      name: 'Mayaya Cheneh',
      role: 'Analyst',
      initials: 'MC'
    },
    thumbnail: thumbSrc,
    hero: heroSrc,
    metrics: [
      { id: 'peak', label: 'Peak Elo score', left: '13.20', right: '12.80', winner: 'left' },
      { id: 'link', label: 'Key passes / 90', left: '2.6', right: '1.9', winner: 'left' },
      { id: 'goals', label: 'NP goals', left: '16', right: '22', winner: 'right' }
    ],
    metricNames: { left: 'Bergkamp', right: 'Henry' },
    body: [
      {
        heading: 'Not the volume king',
        text: 'Bergkamp’s case is connective. The ranking note is here so a second-highest scorer can still win a peak argument on chance share and opponent quality.'
      }
    ],
    comments: []
  },
  {
    id: 'npfl-championship',
    slug: 'npfl-and-championship-are-not-the-same-1500',
    category: 'notes',
    categoryLabel: 'Ranking Notes',
    title: 'NPFL and the Championship are not the same 1500.',
    cardTitle: 'NPFL and the Championship are not the same 1500',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 9,
    arguments: 28,
    clips: 8011,
    publishedAt: '2026-09-22',
    publishedLabel: '22 Sep 2026',
    author: {
      name: 'Mayaya Cheneh',
      role: 'Analyst',
      initials: 'MC'
    },
    thumbnail: thumbSrc,
    hero: heroSrc,
    metrics: [
      { id: 'q', label: 'Typical Q', left: '1.00', right: '1.00', winner: 'none' },
      { id: 'bridge', label: 'Club bridges', left: 'CAF only', right: 'Cups + promotion', winner: 'right' },
      { id: 'offset', label: 'Transfer prior', left: 'Needed', right: 'Weakly identified', winner: 'right' }
    ],
    metricNames: { left: 'NPFL', right: 'Championship' },
    body: [
      {
        heading: 'The graph does not save the headline on its own',
        text: 'Cups and promotion identify PL versus Championship, noisily. CAF does not touch UEFA. Until transfer offsets are fitted, both means can sit near 1500. That is a data problem, not a ×6 table.'
      }
    ],
    comments: []
  },
  {
    id: 'keeper-psxg',
    slug: 'keepers-without-psxg-are-another-board',
    category: 'roles',
    categoryLabel: 'Tactical roles',
    title: 'Keepers without PSxG are another board.',
    cardTitle: 'Keepers without PSxG are another board',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 4,
    arguments: 19,
    clips: 1560,
    publishedAt: '2026-09-18',
    publishedLabel: '18 Sep 2026',
    author: {
      name: 'Mayaya Cheneh',
      role: 'Analyst',
      initials: 'MC'
    },
    thumbnail: thumbSrc,
    hero: heroSrc,
    metrics: [
      { id: 'psxg', label: 'PSxG+', left: '+7.1', right: '—', winner: 'left' },
      { id: 'saves', label: 'Saves', left: '72', right: '148', winner: 'right' },
      { id: 'cs', label: 'Clean sheets', left: '16', right: '4', winner: 'left' }
    ],
    metricNames: { left: 'Holm', right: 'Nwosu' },
    body: [
      {
        heading: 'Save volume is not the spine',
        text: 'Open StatsBomb covers a sliver. Keepers without PSxG stay on a basic stratum: penalties, clean sheets, cards. They are not dropped into the same z as PSxG keepers.'
      }
    ],
    comments: []
  }
];

export function getAnalysisArticles(categoryId = 'all') {
  if (!categoryId || categoryId === 'all') {
    return ANALYSIS_ARTICLES;
  }

  return ANALYSIS_ARTICLES.filter((row) => row.category === categoryId);
}

export function getAnalysisArticle(slug) {
  return ANALYSIS_ARTICLES.find((row) => row.slug === slug) || null;
}

export function getCategoryLabel(categoryId) {
  return ANALYSIS_CATEGORIES.find((item) => item.id === categoryId)?.label || 'Analysis';
}

export function getDiscussedArticles(excludeSlug, limit = 3) {
  return ANALYSIS_ARTICLES
    .filter((row) => row.slug !== excludeSlug)
    .sort((left, right) => (right.arguments || 0) - (left.arguments || 0))
    .slice(0, limit);
}

export function getRelatedArticles(excludeSlug, limit = 3) {
  const current = getAnalysisArticle(excludeSlug);
  const others = ANALYSIS_ARTICLES.filter((row) => row.slug !== excludeSlug);
  const same = others.filter((row) => row.category === current?.category);
  const rest = others.filter((row) => row.category !== current?.category);

  return [...same, ...rest].slice(0, limit);
}

export function normalizeComment(comment) {
  return {
    ...comment,
    stance: comment.stance || 'challenge',
    upvotes: comment.upvotes ?? comment.agrees ?? 0,
    downvotes: comment.downvotes ?? 0,
    replies: (comment.replies || []).map(normalizeComment),
    match: comment.match || null
  };
}

export function getAllArguments() {
  return ANALYSIS_ARTICLES.flatMap((article) => (
    (article.comments || []).map((comment) => ({
      ...normalizeComment(comment),
      articleSlug: article.slug,
      articleTitle: article.cardTitle || article.title
    }))
  ));
}
