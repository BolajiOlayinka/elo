import { SESSION, STAFF } from './demo.js';

const POSTS_KEY = 'elo-admin-posts-v2';
const CATS_KEY = 'elo-admin-blog-categories-v1';
const TAGS_KEY = 'elo-admin-blog-tags-v1';

export const AUTHORS = STAFF.map((row) => `${row.firstName} ${row.lastName}`);

export const DEMO_CATEGORIES = [
  { id: 'cat-methodology', name: 'Methodology', slug: 'methodology', description: 'How the rating engine works.' },
  { id: 'cat-rankings', name: 'Rankings', slug: 'rankings', description: 'Leaderboards and season notes.' },
  { id: 'cat-product', name: 'Product', slug: 'product', description: 'Product updates and how-tos.' }
];

export const DEMO_TAGS = [
  { id: 'tag-methodology', name: 'methodology', slug: 'methodology' },
  { id: 'tag-clubs', name: 'clubs', slug: 'clubs' },
  { id: 'tag-engine', name: 'engine', slug: 'engine' },
  { id: 'tag-keepers', name: 'keepers', slug: 'keepers' }
];

export const DEMO_POSTS = [
  {
    id: 'post-league-strength',
    title: 'League strength is mean club Elo, not division number',
    slug: 'league-strength-is-mean-club-elo',
    excerpt: 'Why a Championship season can outrank an NPFL title without a 6/3/1 multiplier.',
    status: 'published',
    tags: ['methodology', 'clubs'],
    categories: ['Methodology'],
    author: `${SESSION.firstName} ${SESSION.lastName}`,
    headingImage: '',
    thumbnail: '',
    updatedAt: '2026-10-12 16:40',
    publishedAt: '2026-10-12',
    body: `# League strength is mean club Elo, not division number

NPFL is a first division. The Championship is a second division. A ×6 / ×3 rule would score the Nigerian season higher. That is the bug.

Club Elo is updated from **results only**: win, draw, loss, in kickoff order. FA Cup and EFL Cup connect Championship sides to the Premier League. CAF and intercontinental ties connect NPFL sides to Europe.

After that graph has run, **league strength is the mean of the clubs in it**. A player’s goal is then scaled by the opponent they actually faced.

> A 18-goal Championship striker should beat a 28-goal NPFL striker if the opponents’ Elo says so.

Honours stay on a separate sheet. They are not added into the rank.
`
  },
  {
    id: 'post-k-factor',
    title: 'What K-factor, quality scale, and era actually do',
    slug: 'k-factor-quality-scale-era',
    excerpt: 'Three knobs. Only one of them rates Tottenham.',
    status: 'draft',
    tags: ['methodology', 'engine'],
    categories: ['Methodology', 'Product'],
    author: 'Hugo Martins',
    headingImage: '',
    thumbnail: '',
    updatedAt: '2026-10-12 18:02',
    publishedAt: null,
    body: `# What K-factor, quality scale, and era actually do

**K-factor** belongs to club Elo. After each match:

\`new = old + K × (actual − expected)\`

K = 20 is a common club default. It is how far one result may move Tottenham, not a “big club” bonus.

**Quality anchor** and **quality scale** do not rate clubs. They scale a player action:

\`10^((opponentElo − anchor) / scale)\`

Anchor 1500 is par. Scale 600 is softer than classic Elo 400.

**Era reference** is goals per game in a normal season. High-scoring years shrink each goal. It applies to goals and assists, not tackles.
`
  }
];

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

function normalizePost(post) {
  return {
    headingImage: '',
    thumbnail: '',
    author: `${SESSION.firstName} ${SESSION.lastName}`,
    ...post,
    tags: Array.isArray(post.tags) ? post.tags : [],
    categories: Array.isArray(post.categories) ? post.categories : []
  };
}

export function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled';
}

export function loadPosts() {
  try {
    const raw = localStorage.getItem(POSTS_KEY) || localStorage.getItem('elo-admin-posts-v1');

    if (raw) {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(normalizePost);
      }
    }
  } catch {
    /* demo fallback */
  }

  return structuredClone(DEMO_POSTS).map(normalizePost);
}

export function savePosts(posts) {
  writeList(POSTS_KEY, posts);
}

export function getPost(id) {
  return loadPosts().find((post) => post.id === id) || null;
}

export function emptyPost() {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

  return {
    id: `post-${Date.now()}`,
    title: '',
    slug: '',
    excerpt: '',
    status: 'draft',
    tags: [],
    categories: [],
    author: `${SESSION.firstName} ${SESSION.lastName}`,
    headingImage: '',
    thumbnail: '',
    updatedAt: stamp,
    publishedAt: null,
    body: `# Heading

Write the post in Markdown.

## Section

- Point one
- Point two

![Optional image](https://)

A **bold** claim, an *italic* aside, and a [link](https://elostats.football).
`
  };
}

export function upsertPost(next) {
  const posts = loadPosts();
  const index = posts.findIndex((post) => post.id === next.id);
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const row = normalizePost({
    ...next,
    updatedAt: stamp,
    publishedAt: next.status === 'published' ? (next.publishedAt || stamp.slice(0, 10)) : null
  });

  if (index === -1) {
    posts.unshift(row);
  } else {
    posts[index] = row;
  }

  savePosts(posts);

  return row;
}

export function removePost(id) {
  savePosts(loadPosts().filter((post) => post.id !== id));
}

export function resetPosts() {
  localStorage.removeItem(POSTS_KEY);

  return loadPosts();
}

export function loadCategories() {
  return readList(CATS_KEY, DEMO_CATEGORIES);
}

export function saveCategories(rows) {
  writeList(CATS_KEY, rows);
}

export function loadTags() {
  return readList(TAGS_KEY, DEMO_TAGS);
}

export function saveTags(rows) {
  writeList(TAGS_KEY, rows);
}

export function resetTaxonomy() {
  localStorage.removeItem(CATS_KEY);
  localStorage.removeItem(TAGS_KEY);
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
