import { bodyToMarkdown, emptyMetric, loadAnalysisCategories } from './analysis.js';

function desks() {
  return loadAnalysisCategories();
}

export function welcomeMessage(categories = desks()) {
  return {
    id: 'welcome',
    role: 'assistant',
    kind: 'text',
    text: 'I draft EloStats analysis essays. Pick a category from the desks you created, then tell me the topic. Accepting a draft writes Markdown into the body — the same template as a blog post. ## headings become the sections on the public essay.',
    chips: categories.map((row) => ({ id: row.id, label: row.label }))
  };
}

function titleCase(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function flavorFor(categoryId, categories = desks()) {
  const row = categories.find((item) => item.id === categoryId);
  const hay = `${categoryId} ${row?.label || ''} ${row?.description || ''}`.toLowerCase();

  if (/peak/.test(hay)) {
    return 'peak';
  }

  if (/role|tactic/.test(hay)) {
    return 'roles';
  }

  if (/note|rank|method/.test(hay)) {
    return 'notes';
  }

  if (/compar/.test(hay)) {
    return 'compare';
  }

  return 'compare';
}

function inferDesk(text, current, categories = desks()) {
  if (current && categories.some((row) => row.id === current)) {
    return current;
  }

  const lower = text.toLowerCase();
  const hit = categories.find((row) => (
    lower.includes(row.id) || lower.includes(String(row.label || '').toLowerCase())
  ));

  if (hit) {
    return hit.id;
  }

  const flavor = flavorFor('', [{ id: '', label: lower, description: lower }]);
  const byFlavor = categories.find((row) => flavorFor(row.id, categories) === flavor);

  return byFlavor?.id || categories[0]?.id || '';
}

export function parseTopic(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(/\s+(?:vs\.?|versus)\s+/i);

  if (parts.length >= 2) {
    return { topic: cleaned, left: titleCase(parts[0]), right: titleCase(parts.slice(1).join(' vs ')) };
  }

  return { topic: cleaned, left: titleCase(cleaned), right: '' };
}

function sectionsFor({ flavor, topic, left, right }) {
  const a = left || 'Left';
  const b = right || (flavor === 'notes' ? 'The field' : 'The peer group');

  const bodies = {
    peak: [
      {
        heading: 'The verdict is close, but the shape of dominance is different.',
        text: `${a} asks more of the pitch total. ${b} is the more relentless scoring or volume season. League strength, chance creation, ball progression, and finishing sit in the same model — not a volume table with a league multiplier taped on.`
      },
      {
        heading: `The argument for ${a}`,
        text: `${a} carried more of the creative or progressive burden in the environment the model actually saw. Era and opponent Elo raise or shrink the actions. The gap that is not a footnote is the one that shows up in chance share and Q, not in a raw count.`
      },
      {
        heading: 'The counterpoint',
        text: `Volume is not a footnote. ${b} forced a different defensive problem. The model does not erase that. It asks whether the rest of the pitch — progression, chance share, opponent Elo — still leaves ${a} ahead on peak completeness.`
      }
    ],
    compare: [
      {
        heading: 'Put them on one board, then read the leftover.',
        text: `${a} and ${b} only belong in the same paragraph if minutes, role, and opponent pool are honest. The leftover after Q and share-of-team is the essay, not the raw table.`
      },
      {
        heading: `Where ${a} wins`,
        text: `The case for ${a} is the action the peer group actually pays for — chance share, progression, or finishing after the quality multiplier. That is the number the public card should lead with.`
      },
      {
        heading: `Where ${b} still moves the series`,
        text: `${b} can win a single row and still lose the verdict. Say which row, and whether the model is asking for completeness or for a specialist peak.`
      }
    ],
    roles: [
      {
        heading: 'The job has to pick the peer group.',
        text: `${a} is the case for a role split. Minutes in that job use that job’s weights. A single “midfield” or “keeper” z-score would drop them in the wrong μ and σ.`
      },
      {
        heading: 'Why the split matters',
        text: `Compared with the wrong peers, the chance-creation or shot-stopping weights fight the job. Compared with the right ones, pressure, progression, or PSxG finally show up as the thing the role is paid for.`
      },
      {
        heading: 'What the model refuses to do',
        text: 'It will not average two jobs into one board. Keepers without PSxG stay on a basic stratum. An AM is not scored as an 8 because the minutes were in a 10.'
      }
    ],
    notes: [
      {
        heading: 'The headline and the graph are not the same claim.',
        text: `${topic} is a data and identification note, not a multiplier table. Isolated leagues, missing event files, and unfitted transfer offsets can sit near 1500 without the rank being “solved.”`
      },
      {
        heading: 'What the graph can and cannot identify',
        text: 'Cups and promotion identify some bridges, noisily. Continental paths that never meet do not. Until the offset is fitted, say that louder than a ×6 rule.'
      },
      {
        heading: 'What the public essay should leave the reader with',
        text: 'Honours stay on a separate sheet. The rating board reports what the match graph and the event file can support. The rest is a gap, not a vibe.'
      }
    ]
  };

  return bodies[flavor] || bodies.compare;
}

export function generateDraft({ desk, topic, left, right, categories = desks() }) {
  const category = desk || categories[0]?.id || '';
  const flavor = flavorFor(category, categories);
  const a = left || 'Left';
  const b = right || (flavor === 'notes' ? 'The field' : 'The peer group');
  const comparison = Boolean(right) || flavor === 'peak' || flavor === 'compare';
  const cardTitle = right ? `${a} vs ${b}` : topic;
  const title = right
    ? `${a} is the more complete case; ${b} is the volume or peer-group counter.`
    : `${String(topic || '').replace(/\.$/, '')}.`;
  const sections = sectionsFor({ flavor, topic, left: a, right: b });

  return {
    category,
    comparison,
    cardTitle,
    title,
    excerpt: 'The all-round argument, the finishing or role argument, and the evidence that separated them.',
    readMinutes: flavor === 'notes' ? 8 : 6,
    metricNames: { left: a, right: b },
    metrics: comparison
      ? [
        { ...emptyMetric(), id: 'peak', label: 'Peak Elo score', left: '13.40', right: '12.10', winner: 'left' },
        { ...emptyMetric(), id: 'share', label: 'Chance share', left: '0.38', right: '0.31', winner: 'left' },
        { ...emptyMetric(), id: 'q', label: 'Mean opponent Elo', left: '1720', right: '1680', winner: 'left' }
      ]
      : [],
    sections,
    body: bodyToMarkdown(sections)
  };
}

export function replyToUser({ text, chipId, state, categories = desks() }) {
  const next = { ...state };
  const trimmed = String(text || '').trim();
  const chosen = categories.find((row) => row.id === chipId);

  if (chosen) {
    next.desk = chosen.id;
    return {
      state: next,
      messages: [
        {
          role: 'assistant',
          kind: 'text',
          text: `Category set to ${chosen.label}. Give me the topic. A “vs” in the line is enough to name both sides.`
        }
      ]
    };
  }

  const parsed = parseTopic(trimmed);
  next.topic = parsed.topic || next.topic;
  next.desk = inferDesk(trimmed, next.desk, categories);

  if (parsed.left && parsed.right) {
    next.left = parsed.left;
    next.right = parsed.right;
  } else if (parsed.left && !next.left) {
    next.left = parsed.left;
  }

  const needsSides = !next.right && trimmed.length < 80 && !/\bvs\.?\b/i.test(next.topic || '');

  if (!next.topic) {
    return {
      state: next,
      messages: [
        {
          role: 'assistant',
          kind: 'text',
          text: 'I need a topic first — a player-season, a vs line, or a ranking note.'
        }
      ]
    };
  }

  if (needsSides && !next.askedSides) {
    next.askedSides = true;
    return {
      state: next,
      messages: [
        {
          role: 'assistant',
          kind: 'text',
          text: `I have ${next.left || next.topic}. Who sits on the other side of the card? Reply like “Salah 2017–18” or write “skip” to draft against the peer group.`
        }
      ]
    };
  }

  if (/^skip$/i.test(trimmed) && !next.right) {
    next.right = 'Peer group';
  } else if (next.askedSides && !next.right && parsed.left) {
    next.right = parsed.left;
  }

  const draft = generateDraft({ ...next, categories });
  next.draft = draft;
  const label = categories.find((row) => row.id === draft.category)?.label || 'Analysis';

  return {
    state: next,
    messages: [
      {
        role: 'assistant',
        kind: 'draft',
        text: `Draft for ${label}. Accepting this writes Markdown into the body editor.`,
        draft
      }
    ]
  };
}
