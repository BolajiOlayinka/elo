import { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import ellipseSrc from './assets/ellipse.png';
import heroVid from './assets/vids/hero_vid.mp4';
import { ArrowUpRight } from './components/Icons.jsx';
import { SiteFooter } from './components/SiteFooter.jsx';
import { SiteNav } from './components/SiteNav.jsx';
import ComparePage from './pages/ComparePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RatingsPage from './pages/RatingsPage.jsx';
import './App.css';

// const messiPhotos = import.meta.glob('./assets/messi.png', {
//   eager: true,
//   query: '?url',
//   import: 'default'
// });
// const messiSrc = Object.values(messiPhotos)[0] || null;

const ENTITIES = [
  { id: 'players', label: 'Players' },
  { id: 'coaches', label: 'Coaches / Managers' },
  { id: 'clubs', label: 'Clubs' },
  { id: 'teams', label: 'National Teams' },
  { id: 'leagues', label: 'Leagues' }
];

const LENSES = ['Career', 'Elite', 'Peak', 'Era'];

const FAQS = [
  {
    question: 'Do Career Points ever go down?',
    answer:
      'No. Cumulative Career Points reward lifetime achievement and consistency; they do not decay with form. Season Points are separate and reset to zero each year.'
  },
  {
    question: 'How can players from different eras be compared?',
    answer:
      'Era Normalization scores a season against its own peer distribution, so dominance is compared in context rather than raw totals.'
  },
  {
    question: 'Is normalized peak the same as Career Points?',
    answer:
      'No. Career Points accumulate a lifetime record. Normalized peak is a z-score of the best season against contemporaries.'
  },
  {
    question: 'What does “grounded” AI actually mean?',
    answer:
      'The Analyst answers from the ratings record you can see on the page, not from unsourced opinion.'
  },
  {
    question: 'Are ratings on this page official?',
    answer:
      'No. These are independent model outputs. They are not affiliated with any club or league.'
  }
];

const STORIES = {
  players: {
    name: 'Player A',
    initials: 'PA',
    rank: '10',
    role: 'Forward',
    Career: {
      stats: [
        { label: 'Career Points', value: '14,250', note: 'Cumulative legacy' },
        { label: 'Best season', value: '980', note: '2011/12 Season Points' },
        { label: 'Normalized peak', value: '+3.42 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Season-by-season Season Points',
      chartScale: '0–1,000 pts',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [220, 310, 410, 980, 740, 690, 760, 480],
      peak: { label: '2011/12 · 980', at: 3 }
    },
    Elite: {
      stats: [
        { label: 'Career Points', value: '14,250', note: 'Lifetime total' },
        { label: 'Elite seasons', value: '7', note: 'Above the 90th percentile' },
        { label: 'Normalized peak', value: '+3.42 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Elite-season trajectory',
      chartScale: '0–1,000 pts',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [260, 420, 610, 860, 840, 800, 770, 620],
      peak: { label: '2011/12 · 860', at: 3 }
    },
    Peak: {
      stats: [
        { label: 'Career Points', value: '14,250', note: 'Cumulative legacy' },
        { label: 'Best season', value: '980', note: '2011/12 Season Points' },
        { label: 'Normalized peak', value: '+3.42 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Peak season isolation',
      chartScale: '0–1,000 pts',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [180, 240, 300, 980, 420, 360, 390, 220],
      peak: { label: '2011/12 · 980', at: 3 }
    },
    Era: {
      stats: [
        { label: 'Career Points', value: '14,250', note: 'Cumulative legacy' },
        { label: 'Best season', value: '980', note: '2011/12 Season Points' },
        { label: 'Normalized peak', value: '+3.42 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Era-normalized dominance',
      chartScale: '−1 to +4 σ',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [40, 90, 130, 342, 280, 210, 160, 80],
      peak: { label: '2011/12 · +3.42 σ', at: 3 }
    }
  },
  coaches: {
    name: 'Coach A',
    initials: 'CA',
    rank: '08',
    role: 'Manager',
    Career: {
      stats: [
        { label: 'Career Points', value: '9,640', note: 'Cumulative legacy' },
        { label: 'Best season', value: '720', note: '2012/13 Season Points' },
        { label: 'Normalized peak', value: '+2.86 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Season-by-season Season Points',
      chartScale: '0–800 pts',
      years: ['2008/09', '2012/13', '2018/19', '2024/25'],
      points: [180, 260, 340, 720, 540, 480, 510, 360],
      peak: { label: '2012/13 · 720', at: 3 }
    },
    Elite: {
      stats: [
        { label: 'Career Points', value: '9,640', note: 'Lifetime total' },
        { label: 'Elite seasons', value: '5', note: 'Above the 90th percentile' },
        { label: 'Normalized peak', value: '+2.86 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Elite-season trajectory',
      chartScale: '0–800 pts',
      years: ['2008/09', '2012/13', '2018/19', '2024/25'],
      points: [220, 360, 480, 680, 650, 610, 580, 440],
      peak: { label: '2012/13 · 680', at: 3 }
    },
    Peak: {
      stats: [
        { label: 'Career Points', value: '9,640', note: 'Cumulative legacy' },
        { label: 'Best season', value: '720', note: '2012/13 Season Points' },
        { label: 'Normalized peak', value: '+2.86 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Peak season isolation',
      chartScale: '0–800 pts',
      years: ['2008/09', '2012/13', '2018/19', '2024/25'],
      points: [140, 200, 250, 720, 310, 270, 300, 180],
      peak: { label: '2012/13 · 720', at: 3 }
    },
    Era: {
      stats: [
        { label: 'Career Points', value: '9,640', note: 'Cumulative legacy' },
        { label: 'Best season', value: '720', note: '2012/13 Season Points' },
        { label: 'Normalized peak', value: '+2.86 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Era-normalized dominance',
      chartScale: '−1 to +4 σ',
      years: ['2008/09', '2012/13', '2018/19', '2024/25'],
      points: [30, 70, 110, 286, 220, 170, 130, 70],
      peak: { label: '2012/13 · +2.86 σ', at: 3 }
    }
  },
  clubs: {
    name: 'Club A',
    initials: 'CL',
    rank: '04',
    role: 'Club',
    Career: {
      stats: [
        { label: 'Career Points', value: '21,400', note: 'Cumulative legacy' },
        { label: 'Best season', value: '1,240', note: '2011/12 Season Points' },
        { label: 'Normalized peak', value: '+4.10 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Season-by-season Season Points',
      chartScale: '0–1,400 pts',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [380, 520, 680, 1240, 980, 860, 920, 640],
      peak: { label: '2011/12 · 1,240', at: 3 }
    },
    Elite: {
      stats: [
        { label: 'Career Points', value: '21,400', note: 'Lifetime total' },
        { label: 'Elite seasons', value: '11', note: 'Above the 90th percentile' },
        { label: 'Normalized peak', value: '+4.10 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Elite-season trajectory',
      chartScale: '0–1,400 pts',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [420, 610, 800, 1100, 1040, 980, 940, 720],
      peak: { label: '2011/12 · 1,100', at: 3 }
    },
    Peak: {
      stats: [
        { label: 'Career Points', value: '21,400', note: 'Cumulative legacy' },
        { label: 'Best season', value: '1,240', note: '2011/12 Season Points' },
        { label: 'Normalized peak', value: '+4.10 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Peak season isolation',
      chartScale: '0–1,400 pts',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [300, 360, 440, 1240, 520, 400, 460, 280],
      peak: { label: '2011/12 · 1,240', at: 3 }
    },
    Era: {
      stats: [
        { label: 'Career Points', value: '21,400', note: 'Cumulative legacy' },
        { label: 'Best season', value: '1,240', note: '2011/12 Season Points' },
        { label: 'Normalized peak', value: '+4.10 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Era-normalized dominance',
      chartScale: '−1 to +5 σ',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [50, 110, 180, 410, 320, 240, 190, 90],
      peak: { label: '2011/12 · +4.10 σ', at: 3 }
    }
  },
  teams: {
    name: 'Team A',
    initials: 'TA',
    rank: '06',
    role: 'National team',
    Career: {
      stats: [
        { label: 'Career Points', value: '16,820', note: 'Cumulative legacy' },
        { label: 'Best cycle', value: '860', note: '2014 cycle' },
        { label: 'Normalized peak', value: '+3.05 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Cycle-by-cycle Season Points',
      chartScale: '0–1,000 pts',
      years: ['2006', '2010', '2014', '2022'],
      points: [240, 360, 480, 860, 620, 540, 580, 400],
      peak: { label: '2014 · 860', at: 3 }
    },
    Elite: {
      stats: [
        { label: 'Career Points', value: '16,820', note: 'Lifetime total' },
        { label: 'Elite cycles', value: '4', note: 'Above the 90th percentile' },
        { label: 'Normalized peak', value: '+3.05 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Elite-cycle trajectory',
      chartScale: '0–1,000 pts',
      years: ['2006', '2010', '2014', '2022'],
      points: [280, 410, 560, 780, 740, 690, 650, 480],
      peak: { label: '2014 · 780', at: 3 }
    },
    Peak: {
      stats: [
        { label: 'Career Points', value: '16,820', note: 'Cumulative legacy' },
        { label: 'Best cycle', value: '860', note: '2014 cycle' },
        { label: 'Normalized peak', value: '+3.05 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Peak cycle isolation',
      chartScale: '0–1,000 pts',
      years: ['2006', '2010', '2014', '2022'],
      points: [160, 220, 280, 860, 340, 260, 300, 180],
      peak: { label: '2014 · 860', at: 3 }
    },
    Era: {
      stats: [
        { label: 'Career Points', value: '16,820', note: 'Cumulative legacy' },
        { label: 'Best cycle', value: '860', note: '2014 cycle' },
        { label: 'Normalized peak', value: '+3.05 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Era-normalized dominance',
      chartScale: '−1 to +4 σ',
      years: ['2006', '2010', '2014', '2022'],
      points: [35, 80, 140, 305, 230, 170, 120, 60],
      peak: { label: '2014 · +3.05 σ', at: 3 }
    }
  },
  leagues: {
    name: 'League A',
    initials: 'LA',
    rank: '03',
    role: 'League',
    Career: {
      stats: [
        { label: 'Career Points', value: '28,600', note: 'Cumulative strength' },
        { label: 'Best season', value: '1,560', note: '2018/19 Season Points' },
        { label: 'Normalized peak', value: '+4.62 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Season-by-season Season Points',
      chartScale: '0–1,800 pts',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [520, 680, 840, 1180, 1560, 1320, 1240, 980],
      peak: { label: '2018/19 · 1,560', at: 4 }
    },
    Elite: {
      stats: [
        { label: 'Career Points', value: '28,600', note: 'Lifetime total' },
        { label: 'Elite seasons', value: '14', note: 'Above the 90th percentile' },
        { label: 'Normalized peak', value: '+4.62 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Elite-season trajectory',
      chartScale: '0–1,800 pts',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [580, 760, 920, 1280, 1480, 1400, 1340, 1100],
      peak: { label: '2018/19 · 1,480', at: 4 }
    },
    Peak: {
      stats: [
        { label: 'Career Points', value: '28,600', note: 'Cumulative strength' },
        { label: 'Best season', value: '1,560', note: '2018/19 Season Points' },
        { label: 'Normalized peak', value: '+4.62 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Peak season isolation',
      chartScale: '0–1,800 pts',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [400, 480, 560, 720, 1560, 680, 620, 500],
      peak: { label: '2018/19 · 1,560', at: 4 }
    },
    Era: {
      stats: [
        { label: 'Career Points', value: '28,600', note: 'Cumulative strength' },
        { label: 'Best season', value: '1,560', note: '2018/19 Season Points' },
        { label: 'Normalized peak', value: '+4.62 σ', note: 'Relative to era peers' }
      ],
      chartTitle: 'Era-normalized dominance',
      chartScale: '−1 to +5 σ',
      years: ['2004/05', '2011/12', '2018/19', '2025/26'],
      points: [70, 140, 210, 330, 462, 380, 260, 140],
      peak: { label: '2018/19 · +4.62 σ', at: 4 }
    }
  }
};

function Sparkline({ points, className = 'sparkline' }) {
  const width = 320;
  const height = 72;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coords = points.map((value, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - 8 - ((value - min) / (max - min || 1)) * (height - 16);

    return `${x},${y}`;
  });
  const path = coords
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.replace(',', ' ')}`)
    .join(' ');

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path className="sparkline-draw" d={path} fill="none" stroke="#BCF766" strokeWidth="2.2" pathLength="1" />
    </svg>
  );
}

function StoryChart({ points, years, peak, scale, title }) {
  const width = 640;
  const height = 188;
  const left = 8;
  const right = 8;
  const top = 36;
  const bottom = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coords = points.map((value, index) => {
    const x = left + (index / (points.length - 1)) * (width - left - right);
    const y = height - bottom - ((value - min) / (max - min || 1)) * (height - top - bottom);

    return { x, y };
  });
  const path = coords
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const mark = coords[peak.at] || coords[Math.floor(coords.length / 2)];

  return (
    <div className="story-chart">
      <div className="story-chart-meta">
        <span>{title}</span>
        <span>{scale}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => {
          const y = top + (index / 4) * (height - top - bottom);

          return (
            <line
              key={index}
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
              stroke="#1E2E3D"
              strokeWidth="1"
            />
          );
        })}
        <path className="sparkline-draw" d={path} fill="none" stroke="#BCF766" strokeWidth="2.4" pathLength="1" />
        <circle cx={mark.x} cy={mark.y} r="3.5" fill="#BCF766" />
      </svg>
      <div className="story-peak" style={{ left: `${(mark.x / width) * 100}%` }}>
        {peak.label}
      </div>
      <div className="story-years">
        {years.map((year) => (
          <span key={year}>{year}</span>
        ))}
      </div>
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M5.4 10.2 2.2 7l1.1-1.1 2.1 2.1 5.2-5.2L11.7 4z"
        fill="#BCF766"
      />
    </svg>
  );
}

function StorySection() {
  const [entity, setEntity] = useState('players');
  const [lens, setLens] = useState('Career');
  const profile = STORIES[entity];
  const view = profile[lens];
  const chartKey = `${entity}-${lens}`;

  return (
    <section className="story" id="ratings">
      <div className="wrap">
        <h2 className="story-title">Every career has a story.</h2>

        <div className="story-tabs" role="tablist" aria-label="Entity type">
          {ENTITIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={entity === item.id}
              className={entity === item.id ? 'is-active' : ''}
              onClick={() => setEntity(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="story-layout">
          <article className="story-card">
            <div className="story-identity">
              <div>
                <h3>{profile.name}</h3>
                <p>Country · {profile.role} · Modern era</p>
              </div>
              <strong>
                {profile.initials} <span>/</span> {profile.rank}
              </strong>
            </div>

            <div className="story-lenses" role="tablist" aria-label="Rating lens">
              {LENSES.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={lens === item}
                  className={lens === item ? 'is-active' : ''}
                  onClick={() => setLens(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="story-stats">
              {view.stats.map((stat) => (
                <div key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <em>{stat.note}</em>
                </div>
              ))}
            </div>

            <StoryChart
              key={chartKey}
              points={view.points}
              years={view.years}
              peak={view.peak}
              scale={view.chartScale}
              title={view.chartTitle}
            />
            <p className="story-footnote">
              Illustrative demo data · Hero badges and season history are examples.
            </p>
          </article>

          <aside className="story-aside">
            <h3>Not a snapshot. A living football record.</h3>
            <p>
              Follow the arc from breakthrough to best season. Keep career
              achievement, peak form, and context in the same view.
            </p>
            <ul>
              <li><CheckMark /> Distinct lenses for every role</li>
              <li><CheckMark /> Season history with visible peaks</li>
              <li><CheckMark /> Shared context across the graph</li>
            </ul>
            <div className="story-aside-actions">
              <Link className="btn btn-ghost btn-explore-profiles" to="/compare">
                Compare
              </Link>
              <Link className="btn btn-ghost btn-explore-profiles" to="/ratings">
                Explore Profiles
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </aside>
        </div>

        <div className="compare">
          <h2>Better comparisons in three moves.</h2>
          <div className="compare-grid">
            <article>
              <span>01</span>
              <h3>Choose the question</h3>
              <p>
                Compare two legends, a pair of peak seasons, or a cohort.
                Start with the entities that matter to you.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Choose the lens</h3>
              <p>
                Switch between Career Points, Season Points, and normalized
                peak. Make the comparison explicit.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Inspect the context</h3>
              <p>
                Read the peer group, follow the record, and ask the Analyst
                why the numbers differ.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="closing" id="faq">
      <div className="wrap">
        <div className="faq">
          <div className="faq-intro">
            <h2>Before you dive in.</h2>
            <p>A little clarity on what the engine measures—and what it doesn&apos;t.</p>
          </div>
          <FaqList />
        </div>

        <div className="cta" id="analyst">
          <img className="cta-ellipse" src={ellipseSrc} alt="" />
          <p className="cta-eyebrow">Less guesswork. More football.</p>
          <h2>Bringing a better lens to the beautiful game.</h2>
          <p className="cta-lede">Explore the records. Compare the eras. Ask the next question.</p>
          <div className="cta-actions">
            <Link className="btn btn-lime btn-explore" to="/ratings">
              Explore Ratings
              <ArrowUpRight size={10} />
            </Link>
            <a className="btn btn-lime btn-explore" href="#analyst">
              Try AI Analyst
              <ArrowUpRight size={10} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqList() {
  const [open, setOpen] = useState(0);

  return (
    <div className="faq-list">
      {FAQS.map((item, index) => {
        const isOpen = open === index;

        return (
          <article key={item.question} className={isOpen ? 'is-open' : ''}>
            <button type="button" onClick={() => setOpen(isOpen ? -1 : index)}>
              <span>{item.question}</span>
              <em aria-hidden="true">{isOpen ? '–' : '+'}</em>
            </button>
            {isOpen ? <p>{item.answer}</p> : null}
          </article>
        );
      })}
    </div>
  );
}

function LandingPage() {
  return (
    <div className="page">
      <div className="wrap">
      <SiteNav />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Football, beyond the scoreline.</p>
          <h1>The Universal Football Rating Engine</h1>
          <p className="lede">
            Compare careers, peak seasons, and eras with Career Points, Era
            Normalization, and a grounded AI Analyst.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-lime btn-explore" to="/ratings">
              Explore Ratings
              <ArrowUpRight size={10} />
            </Link>
            <a className="btn btn-lime btn-explore" href="#analyst">
              Launch AI Analyst
              <ArrowUpRight size={10} />
            </a>
          </div>
          <p className="fineprint">One persistent record. Different eras. More meaningful debate.</p>
        </div>

        <div className="hero-media">
          <video
            className="hero-video"
            src={heroVid}
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

        {/*
        <article className="player-card">
          <div className="card-top">
            <span>Player Search</span>
            <label className="search">
              <span className="sr-only">Search for a player</span>
              <input type="search" placeholder="Search for a player" disabled />
            </label>
          </div>
          <div className="tabs">
            <button type="button" className="tab is-active">Career &amp; peak</button>
            <button type="button" className="tab">Season comparison</button>
          </div>
          <div className={`portrait${messiSrc ? '' : ' is-empty'}`}>
            {messiSrc ? (
              <img src={messiSrc} alt="Player A" />
            ) : (
              <span>Player photo</span>
            )}
          </div>
          <div className="player-meta">
            <h2>Player A</h2>
            <p>Country</p>
            <p className="points-label">Career Points</p>
            <p className="points">14,250</p>
            <div className="split">
              <div>
                <span>Best season · 2011/12</span>
                <strong>980</strong>
              </div>
              <div>
                <span>Normalized peak</span>
                <strong>+3.42</strong>
              </div>
            </div>
          </div>
        </article>
        */}
      </section>

      <ul className="proof">
        <li>A lasting record of achievement</li>
        <li>Peak performance, not just longevity</li>
        <li>Context before conclusions</li>
      </ul>

      </div>

      <section className="stats">
        <div className="wrap stats-inner">
          <div>
            <strong>50+</strong>
            <span>Major leagues tracked</span>
          </div>
          <div>
            <strong>100,000+</strong>
            <span>Matches normalized</span>
          </div>
          <div>
            <strong>12,000+</strong>
            <span>Player profiles built</span>
          </div>
          <div>
            <strong>100 years</strong>
            <span>Historical depth</span>
          </div>
        </div>
      </section>

      <section className="features wrap" id="method">
        <div className="features-heading">
          <h2>Greatness is more than one number.</h2>
          <p className="features-lede">
            Separate the body of work from the moment of brilliance. Then put both in context.
          </p>
        </div>
        <div className="feature-grid">
          <article>
            <div className="feature-top">
              <span>The long view</span>
              <span className="feature-tag">Career</span>
            </div>
            <h3>Cumulative Career Points</h3>
            <p>A cumulative legacy score that never decreases. Rewards lifetime achievement and consistency.</p>
            <p className="feature-value">14,250</p>
            <p className="chart-caption">Career Points · Player&apos;s name</p>
            <Sparkline points={[18, 22, 28, 34, 42, 52, 64, 78]} />
          </article>
          <article>
            <div className="feature-top">
              <span>The high watermark</span>
              <span className="feature-tag">Peak</span>
            </div>
            <h3>Season Points &amp; Peak Score</h3>
            <p>A season-bounded rating resetting to zero each year. Evaluates true peak performance.</p>
            <p className="feature-value">980</p>
            <p className="chart-caption">Best season · 2011/12</p>
            <Sparkline points={[28, 32, 36, 70, 54, 48, 52, 40]} />
          </article>
          <article>
            <div className="feature-top">
              <span>The level playing field</span>
              <span className="feature-tag">Era</span>
            </div>
            <h3>Era &amp; Context Normalization</h3>
            <p>Standardized z-score comparing dominance against peer distributions, era rules, and league strength.</p>
            <p className="feature-value">+3.42 σ</p>
            <p className="chart-caption">Normalized peak · Player&apos;s name</p>
            <Sparkline points={[24, 30, 28, 46, 72, 66, 42, 30]} />
          </article>
        </div>
      </section>

      <StorySection />
      <ClosingSection />
      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ratings" element={<RatingsPage />} />
      <Route path="/profile/:type/:id" element={<ProfilePage />} />
      <Route path="/compare" element={<ComparePage />} />
    </Routes>
  );
}
