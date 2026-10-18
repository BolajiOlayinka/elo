const KEY = 'elo-admin-comments-v1';

export const DEMO_COMMENTS = [
  {
    id: 'c1',
    postId: 'post-league-strength',
    postTitle: 'League strength is mean club Elo, not division number',
    userId: 'u2',
    author: 'James Whitaker',
    email: 'james.whitaker@example.com',
    body: 'This is the right argument. A ×6 NPFL multiplier would have broken the Championship bridge.',
    status: 'approved',
    createdAt: '2026-10-13 09:12',
    flagged: false
  },
  {
    id: 'c2',
    postId: 'post-league-strength',
    postTitle: 'League strength is mean club Elo, not division number',
    userId: 'u5',
    author: 'Camila Rojas',
    email: 'camila.rojas@example.com',
    body: 'Does CAF ever touch UEFA in this graph, or is that only through transfers?',
    status: 'pending',
    createdAt: '2026-10-14 18:41',
    flagged: false
  },
  {
    id: 'c3',
    postId: 'post-k-factor',
    postTitle: 'What K-factor, quality scale, and era actually do',
    userId: 'u1',
    author: 'Amaka Okonkwo',
    email: 'amaka.okonkwo@example.com',
    body: 'Please publish the fitted S once the transfer prior lands. The placeholder is too easy to over-read.',
    status: 'pending',
    createdAt: '2026-10-15 11:04',
    flagged: false
  },
  {
    id: 'c4',
    postId: 'post-league-strength',
    postTitle: 'League strength is mean club Elo, not division number',
    userId: null,
    author: 'promo-bot',
    email: 'odds@spam.example',
    body: 'Best betting tips today click here for guaranteed acca!!!',
    status: 'spam',
    createdAt: '2026-10-15 14:22',
    flagged: true
  },
  {
    id: 'c5',
    postId: 'post-k-factor',
    postTitle: 'What K-factor, quality scale, and era actually do',
    userId: 'u8',
    author: 'Marcus Berg',
    email: 'marcus.berg@example.com',
    body: 'K = 20 on friendlies still feels high even at 0.5×. Hold or cut further?',
    status: 'approved',
    createdAt: '2026-10-16 07:55',
    flagged: false
  },
  {
    id: 'c6',
    postId: 'post-league-strength',
    postTitle: 'League strength is mean club Elo, not division number',
    userId: 'u3',
    author: 'Sofia Almeida',
    email: 'sofia.almeida@example.com',
    body: 'This reads as if isolated leagues are unsolvable. Say that louder on the public essay.',
    status: 'rejected',
    createdAt: '2026-10-16 19:08',
    flagged: false
  }
];

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEMO_COMMENTS;
  } catch {
    return DEMO_COMMENTS;
  }
}

function write(rows) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  return rows;
}

export function loadComments() {
  return read();
}

export function setCommentStatus(id, status) {
  const next = read().map((row) => (row.id === id ? { ...row, status, flagged: status === 'spam' } : row));
  return write(next);
}

export function removeComment(id) {
  return write(read().filter((row) => row.id !== id));
}

export function resetComments() {
  localStorage.removeItem(KEY);
  return DEMO_COMMENTS;
}

export function commentCounts(rows = read()) {
  return {
    all: rows.length,
    pending: rows.filter((row) => row.status === 'pending').length,
    approved: rows.filter((row) => row.status === 'approved').length,
    spam: rows.filter((row) => row.status === 'spam').length,
    rejected: rows.filter((row) => row.status === 'rejected').length
  };
}
