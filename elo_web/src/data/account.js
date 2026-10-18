const KEY = 'elo-web-activity-v1';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

function seed(name) {
  return [
    {
      id: 'seed-1',
      kind: 'argument',
      essaySlug: 'henry-2003-04-peak-vs-salah-2017-18',
      essayTitle: 'Henry’s 2003–04 peak vs Salah’s 2017–18 scoring season',
      text: 'Henry’s 0.41 xA/90 is decisive. Completeness is not a vibe — it is chance share plus opponent Elo.',
      points: 42,
      agrees: 12,
      when: '2 days ago'
    },
    {
      id: 'seed-2',
      kind: 'reply',
      essaySlug: 'henry-2003-04-peak-vs-salah-2017-18',
      essayTitle: 'Henry’s 2003–04 peak vs Salah’s 2017–18 scoring season',
      text: 'Gravity still has to show up in a measurable proxy. Off-ball pull without chance share is a story, not a score.',
      points: 18,
      agrees: 4,
      when: '2 days ago'
    },
    {
      id: 'seed-3',
      kind: 'argument',
      essaySlug: 'de-bruyne-2019-20-creative-season',
      essayTitle: 'De Bruyne’s 2019–20 is still the best creative league season in the record',
      text: 'Twenty assists in a 1760 opponent pool survives Q. Volume that does not survive quality is just a counting stat.',
      points: 31,
      agrees: 9,
      when: '5 days ago'
    },
    {
      id: 'seed-4',
      kind: 'argument',
      essaySlug: 'modric-2017-18-progression',
      essayTitle: 'The midfielder who turned pressure into progression: Modrić’s 2017–18',
      text: 'CM and AM cannot share μ and σ. This season is the product copy for the role split.',
      points: 24,
      agrees: 7,
      when: '1 week ago'
    }
  ].map((row) => ({ ...row, name }));
}

export function getActivity(email, name = 'You') {
  if (!email) {
    return [];
  }

  const all = readAll();

  if (!all[email]) {
    all[email] = seed(name);
    writeAll(all);
  }

  return all[email];
}

export function addActivity(email, item) {
  if (!email) {
    return;
  }

  const all = readAll();
  const current = all[email] || seed(item.name || 'You');
  all[email] = [item, ...current];
  writeAll(all);
}

export function summarizeActivity(items) {
  const essays = new Map();

  items.forEach((row) => {
    if (!essays.has(row.essaySlug)) {
      essays.set(row.essaySlug, {
        slug: row.essaySlug,
        title: row.essayTitle,
        arguments: 0,
        replies: 0,
        points: 0
      });
    }

    const essay = essays.get(row.essaySlug);
    essay.points += row.points || 0;
    if (row.kind === 'reply') {
      essay.replies += 1;
    } else {
      essay.arguments += 1;
    }
  });

  return {
    reputation: items.reduce((sum, row) => sum + (row.points || 0), 0),
    arguments: items.filter((row) => row.kind !== 'reply').length,
    replies: items.filter((row) => row.kind === 'reply').length,
    essays: [...essays.values()]
  };
}
