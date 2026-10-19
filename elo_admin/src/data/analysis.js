import { api } from '../lib/api.js';
import { SESSION, STAFF } from './demo.js';
import { slugify } from './posts.js';
import { emptyMedia, normalizeMedia } from './uploads.js';

const ESSAYS_KEY = 'elo-admin-analysis-essays-v3';
export const ANALYSIS_CATEGORIES_KEY = 'elo-analysis-categories-v1';
const CATS_KEY = ANALYSIS_CATEGORIES_KEY;
const TAGS_KEY = 'elo-analysis-tags-v1';

const HERO_URL = `${import.meta.env.BASE_URL}analysis-hero.svg`;
const THUMB_URL = `${import.meta.env.BASE_URL}analysis-thumb.svg`;

const MAYAYA = { name: 'Mayaya Cheneh', role: 'Analyst', initials: 'MC' };

export const LOCALES = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
  { id: 'de', label: 'Deutsch' },
  { id: 'pt', label: 'Português' }
];

export const DEMO_ANALYSIS_TAGS = [
  { id: 'tag-peak', name: 'peak', slug: 'peak' },
  { id: 'tag-comparison', name: 'comparison', slug: 'comparison' },
  { id: 'tag-methodology', name: 'methodology', slug: 'methodology' },
  { id: 'tag-keepers', name: 'keepers', slug: 'keepers' },
  { id: 'tag-midfield', name: 'midfield', slug: 'midfield' }
];

export const DEMO_ANALYSIS_CATEGORIES = [
  { id: 'peak', label: 'Peak Seasons', slug: 'peak', description: 'One season, one peak claim.' },
  { id: 'compare', label: 'Player Comparisons', slug: 'compare', description: 'Head-to-head essays.' },
  { id: 'roles', label: 'Tactical roles', slug: 'roles', description: 'Position-fair arguments.' },
  { id: 'notes', label: 'Ranking Notes', slug: 'notes', description: 'Method and board notes.' }
];

export function bodyToMarkdown(body) {
  if (typeof body === 'string') {
    return body;
  }

  return (Array.isArray(body) ? body : [])
    .map((block) => {
      const parts = [];

      if (block?.heading) {
        parts.push(`## ${block.heading}`);
      }

      if (block?.text) {
        parts.push(block.text);
      }

      const src = block?.image?.file_url || (typeof block?.image === 'string' ? block.image : '');

      if (src) {
        parts.push(`![Image](${src})`);
      }

      return parts.join('\n\n');
    })
    .filter(Boolean)
    .join('\n\n');
}

function seededMedia(kind) {
  return {
    upload_id: `upl_demo_${kind}`,
    file_url: kind === 'hero' ? HERO_URL : THUMB_URL
  };
}

const TAGS_BY_CATEGORY = {
  peak: ['peak', 'comparison'],
  compare: ['comparison'],
  roles: ['midfield'],
  notes: ['methodology']
};

function essay(partial) {
  return {
    comparison: false,
    arguments: 0,
    clips: 0,
    readMinutes: 6,
    status: 'published',
    translations: {},
    tags: TAGS_BY_CATEGORY[partial.category] || [],
    author: MAYAYA,
    thumbnail: seededMedia('thumb'),
    hero: seededMedia('hero'),
    metrics: [],
    metricNames: { left: '', right: '' },
    body: [],
    ...partial
  };
}

export const DEMO_ESSAYS = [
  essay({
    id: 'henry-salah-peak',
    slug: 'henry-2003-04-peak-vs-salah-2017-18',
    category: 'peak',
    comparison: true,
    title: 'Henry’s 2003–04 peak was more complete; Salah’s 2017–18 was the higher-volume scoring season.',
    cardTitle: 'Henry’s 2003–04 peak vs Salah’s 2017–18 scoring season',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 8,
    arguments: 38,
    clips: 12864,
    publishedAt: '2026-10-04',
    updatedAt: '2026-10-04 09:20',
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
    ]
  }),
  essay({
    id: 'modric-2018',
    slug: 'modric-2017-18-progression',
    category: 'roles',
    comparison: true,
    title: 'The midfielder who turned pressure into progression: Modrić’s 2017–18',
    cardTitle: 'The midfielder who turned pressure into progression: Modrić’s 2017–18',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 6,
    arguments: 62,
    clips: 4201,
    publishedAt: '2026-10-03',
    updatedAt: '2026-10-03 14:10',
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
    ]
  }),
  essay({
    id: 'kdb-2019',
    slug: 'de-bruyne-2019-20-creative-season',
    category: 'compare',
    comparison: true,
    title: 'De Bruyne’s 2019–20 is still the best creative league season in the record.',
    cardTitle: 'De Bruyne’s 2019–20 is still the best creative league season in the record',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 7,
    arguments: 62,
    clips: 6102,
    publishedAt: '2026-10-02',
    updatedAt: '2026-10-02 11:40',
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
    ]
  }),
  essay({
    id: 'bergkamp-connective',
    slug: 'bergkamp-connective-genius',
    category: 'notes',
    comparison: true,
    title: 'The case for Bergkamp as Arsenal’s connective genius',
    cardTitle: 'The case for Bergkamp as Arsenal’s connective genius',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 5,
    arguments: 41,
    clips: 2904,
    publishedAt: '2026-09-28',
    updatedAt: '2026-09-28 16:05',
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
    ]
  }),
  essay({
    id: 'npfl-championship',
    slug: 'npfl-and-championship-are-not-the-same-1500',
    category: 'notes',
    comparison: true,
    title: 'NPFL and the Championship are not the same 1500.',
    cardTitle: 'NPFL and the Championship are not the same 1500',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 9,
    arguments: 28,
    clips: 8011,
    publishedAt: '2026-09-22',
    updatedAt: '2026-09-22 08:55',
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
    ]
  }),
  essay({
    id: 'keeper-psxg',
    slug: 'keepers-without-psxg-are-another-board',
    category: 'roles',
    comparison: true,
    title: 'Keepers without PSxG are another board.',
    cardTitle: 'Keepers without PSxG are another board',
    excerpt: 'The all-round argument, the finishing argument, and the evidence that separated them.',
    readMinutes: 4,
    arguments: 19,
    clips: 1560,
    publishedAt: null,
    updatedAt: '2026-09-18 12:30',
    status: 'draft',
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
    ]
  })
];

export function analysisAuthors() {
  const staff = STAFF.filter((row) => row.status === 'Active').map((row) => ({
    name: `${row.firstName} ${row.lastName}`,
    role: row.department === 'Ratings' ? 'Analyst' : 'Editor',
    initials: `${row.firstName[0]}${row.lastName[0]}`
  }));

  return [MAYAYA, ...staff.filter((row) => row.name !== MAYAYA.name)];
}

export function defaultAuthor() {
  return {
    name: `${SESSION.firstName} ${SESSION.lastName}`,
    role: 'Editor',
    initials: `${SESSION.firstName[0]}${SESSION.lastName[0]}`
  };
}

function readList(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return structuredClone(fallback);
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function writeList(key, rows) {
  localStorage.setItem(key, JSON.stringify(rows));
}

export function formatPublishedLabel(date) {
  if (!date) {
    return '';
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function categoryLabel(categoryId, categories = []) {
  return categories.find((row) => row.id === categoryId || row.slug === categoryId)?.label || 'Analysis';
}

function isTempEssayId(id) {
  return !id || String(id).startsWith('essay-');
}

function normalizeEssay(essayRow, categories = DEMO_ANALYSIS_CATEGORIES) {
  const author = essayRow.author && typeof essayRow.author === 'object'
    ? essayRow.author
    : { name: essayRow.author || defaultAuthor().name, role: 'Editor', initials: 'ED' };

  return {
    comparison: false,
    arguments: 0,
    clips: 0,
    readMinutes: 6,
    translations: {},
    metrics: [],
    metricNames: { left: '', right: '' },
    body: '',
    tags: [],
    status: 'draft',
    ...essayRow,
    author,
    tags: Array.isArray(essayRow.tags)
      ? essayRow.tags
      : (TAGS_BY_CATEGORY[essayRow.category] || []),
    thumbnail: normalizeMedia(essayRow.thumbnail),
    hero: normalizeMedia(essayRow.hero),
    categoryLabel: categoryLabel(essayRow.category, categories),
    publishedLabel: formatPublishedLabel(essayRow.publishedAt),
    metrics: (essayRow.metrics || []).map((metric, index) => ({
      id: metric.id || `metric-${index}`,
      label: metric.label || '',
      left: metric.left || '',
      right: metric.right || '',
      winner: metric.winner || 'none',
      unit: metric.unit || ''
    })),
    body: bodyToMarkdown(essayRow.body)
  };
}

export async function loadAnalysisCategories() {
  const { data } = await api('/admin/analysis/categories');
  return data.categories;
}

export async function createAnalysisCategory(payload) {
  const { data } = await api('/admin/analysis/categories', { method: 'POST', body: payload });
  return data.category;
}

export async function updateAnalysisCategory(id, payload) {
  const { data } = await api(`/admin/analysis/categories/${id}`, { method: 'PATCH', body: payload });
  return data.category;
}

export async function deleteAnalysisCategory(id) {
  await api(`/admin/analysis/categories/${id}`, { method: 'DELETE' });
}

export async function loadAnalysisTags() {
  const { data } = await api('/admin/analysis/tags');
  return data.tags;
}

export async function createAnalysisTag(payload) {
  const { data } = await api('/admin/analysis/tags', { method: 'POST', body: payload });
  return data.tag;
}

export async function deleteAnalysisTag(id) {
  await api(`/admin/analysis/tags/${id}`, { method: 'DELETE' });
}

export async function loadEssays() {
  const { data } = await api('/admin/analysis/posts');
  return data.posts;
}

export async function getEssay(id) {
  const { data } = await api(`/admin/analysis/posts/${id}`);
  return data.post;
}

export function emptyEssay(desks = DEMO_ANALYSIS_CATEGORIES) {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

  return normalizeEssay({
    id: `essay-${Date.now()}`,
    slug: '',
    category: desks[0]?.slug || desks[0]?.id || '',
    categoryId: desks[0]?.id || '',
    tags: [],
    comparison: true,
    title: '',
    cardTitle: '',
    excerpt: '',
    readMinutes: 6,
    arguments: 0,
    clips: 0,
    publishedAt: null,
    author: defaultAuthor(),
    thumbnail: emptyMedia(),
    hero: emptyMedia(),
    metrics: [
      { id: `metric-${Date.now()}`, label: 'Peak Elo score', left: '', right: '', winner: 'none', unit: '' }
    ],
    metricNames: { left: '', right: '' },
    body: `## Heading

Write the essay in Markdown, the same way as a blog post.

## Section

- Point one
- Point two

A **bold** claim, an *italic* aside, and a [link](https://elostats.football).
`,
    translations: {},
    status: 'draft',
    updatedAt: stamp
  });
}

export function emptyMetric() {
  return { id: `metric-${Date.now()}`, label: '', left: '', right: '', winner: 'none', unit: '' };
}

export function emptyBodyBlock() {
  return { heading: '', text: '', image: emptyMedia() };
}

export async function upsertEssay(next) {
  const title = String(next.title || '').trim() || String(next.cardTitle || '').trim() || 'Untitled essay';
  const payload = {
    title,
    cardTitle: String(next.cardTitle || '').trim() || title,
    slug: String(next.slug || '').trim() || slugify(next.cardTitle || title),
    excerpt: next.excerpt || '',
    body: next.body || '',
    category: next.category,
    categoryId: next.categoryId,
    status: next.status,
    comparison: Boolean(next.comparison),
    readMinutes: next.readMinutes,
    clips: next.clips,
    publishedAt: next.publishedAt,
    author: next.author,
    thumbnail: next.thumbnail,
    hero: next.hero,
    metrics: next.metrics,
    metricNames: next.metricNames,
    tags: next.tags,
    translations: next.translations
  };

  if (isTempEssayId(next.id)) {
    const { data } = await api('/admin/analysis/posts', { method: 'POST', body: payload });
    return data.post;
  }

  const { data } = await api(`/admin/analysis/posts/${next.id}`, { method: 'PATCH', body: payload });
  return data.post;
}

export async function removeEssay(id) {
  if (isTempEssayId(id)) {
    return;
  }

  await api(`/admin/analysis/posts/${id}`, { method: 'DELETE' });
}

export function essayCounts(rows = []) {
  return {
    all: rows.length,
    published: rows.filter((row) => row.status === 'published').length,
    draft: rows.filter((row) => row.status === 'draft').length
  };
}
