import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer } from '../components/Drawer.jsx';
import {
  BLOG_RANGES,
  BLOG_STATS,
  formatCount,
  PAGE_RANGES,
  TRAFFIC,
  USER_RANGES
} from '../data/analytics.js';
import { loadEssays } from '../data/analysis.js';
import { loadComments } from '../data/comments.js';
import { debateCounts, loadDebate } from '../data/debate.js';
import { STATS, USERS } from '../data/demo.js';
import { loadPosts } from '../data/posts.js';

function AreaChart({ values, height = 140 }) {
  const width = 720;
  const pad = { l: 8, r: 8, t: 12, b: 8 };
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => {
    const x = pad.l + (index / (values.length - 1)) * (width - pad.l - pad.r);
    const y = pad.t + (1 - (value - min) / (max - min || 1)) * (height - pad.t - pad.b);
    return `${x},${y}`;
  });

  return (
    <svg className="traffic-chart" style={{ height }} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polygon
        points={`${pad.l},${height - pad.b} ${points.join(' ')} ${width - pad.r},${height - pad.b}`}
        fill="rgba(188, 247, 102, 0.12)"
      />
      <polyline points={points.join(' ')} fill="none" stroke="#BCF766" strokeWidth="2.2" />
    </svg>
  );
}

function ShareBar({ value }) {
  return (
    <i className="share-bar" aria-hidden="true">
      <b style={{ width: `${Math.min(100, value)}%` }} />
    </i>
  );
}

function SourceRing({ sources }) {
  const total = sources.reduce((sum, row) => sum + row.share, 0);
  let offset = 0;
  const colors = ['#BCF766', '#5B8DEF', '#F3B46A', '#7EE0C6', '#C4B5FD', '#94A3B8'];

  return (
    <div className="source-visual">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        {sources.map((source, index) => {
          const length = (source.share / total) * 100;
          const dash = `${length} ${100 - length}`;
          const node = (
            <circle
              key={source.id}
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth="12"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              pathLength="100"
            />
          );
          offset += length;
          return node;
        })}
      </svg>
      <ul>
        {sources.map((source, index) => (
          <li key={source.id}>
            <i style={{ background: colors[index % colors.length] }} />
            <span>{source.label}</span>
            <em>{source.share}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CountryMap({ countries }) {
  const max = Math.max(...countries.map((row) => row.views));

  return (
    <div className="world-map">
      <svg viewBox="0 0 800 420" aria-hidden="true">
        <g className="world-grid">
          {[1, 2, 3, 4].map((n) => (
            <line key={`h${n}`} x1="0" x2="800" y1={n * 84} y2={n * 84} />
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <line key={`v${n}`} y1="0" y2="420" x1={n * 100} x2={n * 100} />
          ))}
        </g>
        <g className="world-land" fill="#2a4552" stroke="#3d6a6c" strokeWidth="1.4">
          <ellipse cx="190" cy="150" rx="118" ry="78" />
          <ellipse cx="250" cy="278" rx="52" ry="86" />
          <ellipse cx="410" cy="230" rx="62" ry="98" />
          <ellipse cx="430" cy="122" rx="54" ry="42" />
          <ellipse cx="590" cy="150" rx="150" ry="88" />
          <ellipse cx="680" cy="300" rx="48" ry="32" />
        </g>
        {countries.map((row, index) => {
          const x = (row.x / 100) * 800;
          const y = (row.y / 100) * 420;
          const r = 10 + (row.views / max) * 14;

          return (
            <g key={row.id} className="map-mark" style={{ animationDelay: `${index * 0.2}s` }}>
              <circle className="map-pulse" cx={x} cy={y} r={r + 12} />
              <circle className="map-core" cx={x} cy={y} r={r} />
              <text x={x + r + 8} y={y + 4}>{row.id}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RangeTabs({ value, onChange }) {
  return (
    <div className="sheet-tabs drawer-ranges" role="tablist" aria-label="Date range">
      {Object.entries(PAGE_RANGES).map(([id, item]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          className={value === id ? 'is-active' : ''}
          onClick={() => onChange(id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, note, onMore }) {
  return (
    <article className="stat-card has-more">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
      {onMore ? (
        <button type="button" className="view-more" onClick={onMore}>View more</button>
      ) : null}
    </article>
  );
}

export default function Dashboard() {
  const [drawer, setDrawer] = useState(null);
  const [range, setRange] = useState('30d');
  const recent = USERS.filter((user) => user.lastLogin !== 'Never').slice(0, 3);
  const logged = USERS.filter((user) => user.lastLogin !== 'Never');
  const pageSlice = PAGE_RANGES[range];
  const userSlice = USER_RANGES[range];
  const blogSlice = BLOG_RANGES[range];
  const posts = loadPosts();
  const comments = loadComments();
  const [essays, setEssays] = useState([]);
  const [debate, setDebate] = useState([]);

  useEffect(() => {
    Promise.all([loadEssays(), loadDebate()])
      .then(([nextEssays, nextDebate]) => {
        setEssays(nextEssays);
        setDebate(nextDebate);
      })
      .catch(() => {
        setEssays([]);
        setDebate([]);
      });
  }, []);

  const analysisCount = essays.length + posts.length;
  const commentCount = comments.length + debate.length;

  const ingest = useMemo(() => [
    { key: 'players', label: 'Players', value: STATS.players },
    { key: 'coaches', label: 'Coaches', value: STATS.coaches },
    { key: 'leagues', label: 'Leagues', value: STATS.leagues },
    { key: 'competitions', label: 'Competitions', value: STATS.competitions },
    { key: 'clubs', label: 'Clubs', value: STATS.clubs },
    { key: 'nations', label: 'Nations', value: STATS.nations }
  ], []);

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Usage, members, publishing, and what has been ingested. Demo figures until the public site reports in.</p>
        </div>
      </div>

      <div className="hero-stats">
        <StatCard
          label="Page visits · 30 days"
          value={formatCount(TRAFFIC.visits30)}
          note={`+${TRAFFIC.visitsDelta}% vs previous 30 days`}
          onMore={() => setDrawer('visits')}
        />
        <StatCard
          label="All users"
          value={STATS.users.toLocaleString('en-GB')}
          note={`${TRAFFIC.liveNow} online now · ${STATS.signups30} new this month`}
          onMore={() => setDrawer('users')}
        />
        <StatCard
          label="Blog & Analysis"
          value={analysisCount}
          note={`${essays.length} analysis posts · ${commentCount} comments`}
          onMore={() => setDrawer('blog')}
        />
      </div>

      <div className="ingest-grid">
        {ingest.map((item) => (
          <article key={item.key} className="stat-card">
            <p>{item.label}</p>
            <strong>{item.value.toLocaleString('en-GB')}</strong>
            <span>Ingested into the catalogue</span>
          </article>
        ))}
      </div>

      <div className="split map-split">
        <article className="panel map-panel">
          <div className="panel-head">
            <h2>Where people read</h2>
            <button type="button" className="text-btn" onClick={() => setDrawer('geo')}>View more</button>
          </div>
          <CountryMap countries={TRAFFIC.countries} />
        </article>
        <article className="panel">
          <div className="panel-head">
            <h2>Sources</h2>
            <span>How they arrive</span>
          </div>
          <SourceRing sources={TRAFFIC.sources} />
        </article>
      </div>

      <article className="panel">
        <div className="panel-head">
          <h2>Last logins</h2>
          <Link to="/users">All users</Link>
        </div>
        <table className="table compact">
          <thead>
            <tr>
              <th>User</th>
              <th>Language</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((user) => (
              <tr key={user.id}>
                <td>
                  <Link className="name-cell" to={`/users/${user.id}`}>
                    <span className="avatar sm">{user.firstName[0]}{user.lastName[0]}</span>
                    {user.firstName} {user.lastName}
                  </Link>
                </td>
                <td>{(user.language || 'en').toUpperCase()}</td>
                <td>{user.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <Drawer
        open={drawer === 'visits'}
        title="Page visits"
        lede="Top pages, filterable by date range."
        tools={<RangeTabs value={range} onChange={setRange} />}
        onClose={() => setDrawer(null)}
      >
        <p className="drawer-total">{formatCount(pageSlice.visits)} sessions</p>
        <ul className="rank-list">
          {pageSlice.pages.map((page) => (
            <li key={page.path}>
              <div>
                <strong>{page.label}</strong>
                <span>{page.path}</span>
              </div>
              <em>{formatCount(page.views)}</em>
              <ShareBar value={page.share} />
            </li>
          ))}
        </ul>
      </Drawer>

      <Drawer
        open={drawer === 'users'}
        title="All users"
        lede="Presence, growth, new accounts, and who logged in."
        tools={<RangeTabs value={range} onChange={setRange} />}
        onClose={() => setDrawer(null)}
      >
        <div className="drawer-cards">
          <article className="stat-card">
            <p>Online now</p>
            <strong><i className="live-dot" />{userSlice.online}</strong>
            <span>Guests + members</span>
          </article>
          <article className="stat-card">
            <p>Logged in</p>
            <strong>{userSlice.loggedIn}</strong>
            <span>In this range</span>
          </article>
          <article className="stat-card">
            <p>New</p>
            <strong>{userSlice.signups}</strong>
            <span>Accounts created</span>
          </article>
          <article className="stat-card">
            <p>Signed in</p>
            <strong>{userSlice.signedIn}</strong>
            <span>Members online now</span>
          </article>
        </div>
        <h3 className="drawer-h">User growth</h3>
        <AreaChart values={userSlice.growth} />
        <h3 className="drawer-h">New accounts</h3>
        <AreaChart values={userSlice.signupsSeries} height={110} />
        <h3 className="drawer-h">Logged in recently</h3>
        <ul className="live-list">
          {logged.map((user) => (
            <li key={user.id}>
              <Link to={`/users/${user.id}`} onClick={() => setDrawer(null)}>
                <span className="avatar sm">{user.firstName[0]}{user.lastName[0]}</span>
                <div>
                  <strong>{user.firstName} {user.lastName}</strong>
                  <span>{user.lastLogin}</span>
                </div>
                {user.online ? <i className="live-dot" /> : null}
              </Link>
            </li>
          ))}
        </ul>
      </Drawer>

      <Drawer
        open={drawer === 'blog'}
        title="Blog & Analysis"
        lede="Publishing volume and comments sitting on each piece."
        tools={<RangeTabs value={range} onChange={setRange} />}
        onClose={() => setDrawer(null)}
      >
        <div className="drawer-cards">
          <article className="stat-card">
            <p>Analysis posts</p>
            <strong>{essays.length}</strong>
            <span>{essays.filter((row) => row.status === 'published').length} published on the magazine</span>
          </article>
          <article className="stat-card">
            <p>Blog posts</p>
            <strong>{blogSlice.posts}</strong>
            <span>In this range</span>
          </article>
          <article className="stat-card">
            <p>Comments</p>
            <strong>{blogSlice.comments}</strong>
            <span>On posts and essays</span>
          </article>
          <article className="stat-card">
            <p>Pending</p>
            <strong>{debateCounts(debate).pending + comments.filter((row) => row.status === 'pending').length}</strong>
            <span>Waiting in moderation</span>
          </article>
        </div>
        <h3 className="drawer-h">Comments by piece</h3>
        <ul className="rank-list">
          {[
            ...essays.map((essay) => ({
              title: essay.cardTitle || essay.title,
              comments: debate.filter((row) => row.essayId === essay.id).length,
              kind: 'analysis'
            })),
            ...BLOG_STATS.perPost.filter((row) => row.kind !== 'analysis')
          ]
            .sort((left, right) => right.comments - left.comments)
            .map((row) => (
              <li key={row.title}>
                <div>
                  <strong>{row.title}</strong>
                  <span>{row.kind === 'analysis' ? 'Analysis' : 'Blog'}</span>
                </div>
                <em>{row.comments}</em>
              </li>
            ))}
        </ul>
        <div className="form-actions">
          <Link className="btn ghost" to="/analysis" onClick={() => setDrawer(null)}>Open Analysis posts</Link>
          <Link className="btn ghost" to="/analysis/comments" onClick={() => setDrawer(null)}>Comments</Link>
        </div>
      </Drawer>

      <Drawer
        open={drawer === 'geo'}
        title="Countries & language"
        lede="Where sessions come from, and which language people chose."
        onClose={() => setDrawer(null)}
      >
        <h3 className="drawer-h">Countries</h3>
        <ul className="rank-list">
          {TRAFFIC.countries.map((row) => (
            <li key={row.id}>
              <div>
                <strong>{row.label}</strong>
                <span>{row.id}</span>
              </div>
              <em>{formatCount(row.views)}</em>
              <ShareBar value={(row.views / TRAFFIC.countries[0].views) * 100} />
            </li>
          ))}
        </ul>
        <h3 className="drawer-h">Language</h3>
        <ul className="rank-list">
          {TRAFFIC.languages.map((row) => (
            <li key={row.id}>
              <div>
                <strong>{row.label}</strong>
                <span>{row.share}% of sessions</span>
              </div>
              <ShareBar value={row.share} />
            </li>
          ))}
        </ul>
      </Drawer>
    </section>
  );
}
