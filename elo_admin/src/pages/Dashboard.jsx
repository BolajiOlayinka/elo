import { STATS, USERS, VISITS } from '../data/demo.js';

const CARDS = [
  { key: 'users', label: 'Users', value: STATS.users, delta: '+42 this week' },
  { key: 'usersLogin', label: 'Users logged in', value: STATS.usersLogin, delta: 'Last 24 hours' },
  { key: 'pageVisits', label: 'Website page visits', value: STATS.pageVisits, delta: '+8.4% vs last week' },
  { key: 'players', label: 'Players', value: STATS.players, delta: 'In the catalogue' },
  { key: 'leagues', label: 'Leagues', value: STATS.leagues, delta: 'Covered seasons' },
  { key: 'coaches', label: 'Coaches', value: STATS.coaches, delta: 'Managers on record' },
  { key: 'competitions', label: 'Competitions', value: STATS.competitions, delta: 'Cups & internationals' }
];

function Sparkline({ values }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const width = 320;
  const height = 88;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / (max - min || 1)) * (height - 8) - 4;

    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke="#BCF766" strokeWidth="2.2" points={points} />
    </svg>
  );
}

function format(value) {
  return value.toLocaleString('en-GB');
}

export default function Dashboard() {
  const recent = USERS.filter((user) => user.lastLogin !== 'Never').slice(0, 5);

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Snapshot of product usage and catalogue size. Figures are demo data.</p>
        </div>
      </div>

      <div className="stat-grid">
        {CARDS.map((card) => (
          <article key={card.key} className="stat-card">
            <p>{card.label}</p>
            <strong>{format(card.value)}</strong>
            <span>{card.delta}</span>
          </article>
        ))}
      </div>

      <div className="split">
        <article className="panel">
          <div className="panel-head">
            <h2>Page visits</h2>
            <span>Last 14 days</span>
          </div>
          <Sparkline values={VISITS} />
          <p className="muted">Peak index {Math.max(...VISITS)} in the 14-day demo series.</p>
        </article>
        <article className="panel">
          <div className="panel-head">
            <h2>Recent logins</h2>
            <span>Demo accounts</span>
          </div>
          <table className="table compact">
            <thead>
              <tr>
                <th>User</th>
                <th>Last login</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="name-cell">
                      <span className="avatar sm">{user.firstName[0]}{user.lastName[0]}</span>
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td>{user.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
