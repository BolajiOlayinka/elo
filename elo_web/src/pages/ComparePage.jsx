import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, LineChart } from '../components/EntityMarks.jsx';
import { ShareIcon, SwapIcon } from '../components/Icons.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { SiteNav } from '../components/SiteNav.jsx';
import { getRankingItem, getRankings } from '../data/rankings.js';

const COLORS = ['#5B8DEF', '#BCF766', '#F3B46A'];

function diff(left, right) {
  return left - right;
}

function signed(value) {
  if (value === 0) {
    return '0';
  }

  return value > 0 ? `+${value}` : String(value);
}

export default function ComparePage() {
  const [params] = useSearchParams();
  const type = params.get('type') || 'players';
  const rows = getRankings(type);
  const incoming = params.get('id');
  const [leftId, setLeftId] = useState(incoming || rows[0].id);
  const [rightId, setRightId] = useState(rows.find((row) => row.id !== (incoming || rows[0].id))?.id || rows[1].id);
  const [extraId, setExtraId] = useState('');
  const [showExtra, setShowExtra] = useState(false);

  const left = getRankingItem(type, leftId) || rows[0];
  const right = getRankingItem(type, rightId) || rows[1];
  const extra = extraId ? getRankingItem(type, extraId) : null;
  const selected = useMemo(() => [left, right, extra].filter(Boolean), [left, right, extra]);

  function swap() {
    setLeftId(rightId);
    setRightId(leftId);
  }

  return (
    <div className="page compare-page">
      <div className="wrap">
        <SiteNav />

        <p className="crumb">
          <Link to={left ? `/profile/${type}/${left.id}` : '/ratings'}>Profile</Link>
          <span> / Compare</span>
        </p>

        <section className="compare-head">
          <div>
            <h1>Player comparison</h1>
            <p>Compare ratings, career trajectories, and season performance. Illustrative demo data.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-explore">
            <ShareIcon />
            Share comparison
          </button>
        </section>

        <section className="compare-picker">
          <div className="picker-col">
            <label>Selected player</label>
            <select value={leftId} onChange={(event) => setLeftId(event.target.value)}>
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
            <div className="picker-filters">
              <select defaultValue="all"><option value="all">All competitions</option></select>
              <select defaultValue="career"><option value="career">Season</option></select>
            </div>
          </div>

          <button type="button" className="swap-btn" onClick={swap}>
            <SwapIcon />
            Swap
          </button>

          <div className="picker-col">
            <label>Comparison player</label>
            <select value={rightId} onChange={(event) => setRightId(event.target.value)}>
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
            <div className="picker-filters">
              <select defaultValue="all"><option value="all">All competitions</option></select>
              <select defaultValue="career"><option value="career">Season</option></select>
            </div>
          </div>
        </section>

        {showExtra ? (
          <div className="picker-col extra-picker">
            <label>Another player</label>
            <select value={extraId} onChange={(event) => setExtraId(event.target.value)}>
              <option value="">Choose a player</option>
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost add-player" onClick={() => setShowExtra(true)}>
            Add another player
          </button>
        )}

        <div className={`compare-mini ${extra ? 'has-three' : ''}`}>
          {selected.map((item, index) => (
            <article key={item.id} className="mini-card">
              <Avatar initials={item.initials} size={44} />
              <div>
                <h3>{item.name}</h3>
                <p>{item.club} | {item.role} | {item.place}</p>
                <p>Age {item.age} · {item.height} · {item.foot}</p>
                <Link to={`/profile/${item.type}/${item.id}`}>View profile</Link>
              </div>
              <span className="dot" style={{ background: COLORS[index] }} />
            </article>
          ))}
        </div>

        <article className="panel">
          <div className="panel-head">
            <h2>Ratings at a glance</h2>
            <span>Illustrative comparison</span>
          </div>
          <table className="ratings-table glance-table">
            <thead>
              <tr>
                <th>Rating metric</th>
                {selected.map((item) => <th key={item.id}>{item.name}</th>)}
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Current Elo</td>
                {selected.map((item) => <td key={`${item.id}-elo`}>{item.elo}</td>)}
                <td>{signed(diff(left.eloNum, right.eloNum))}</td>
              </tr>
              <tr>
                <td>Peak Elo</td>
                {selected.map((item) => <td key={`${item.id}-peak`}>{item.peakElo}</td>)}
                <td>{signed(diff(left.peakEloNum, right.peakEloNum))}</td>
              </tr>
              <tr>
                <td>Career Points</td>
                {selected.map((item) => <td key={`${item.id}-career`}>{item.career}</td>)}
                <td>{signed(diff(left.careerNum, right.careerNum))}</td>
              </tr>
            </tbody>
          </table>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Career Elo rating</h2>
          </div>
          <LineChart
            series={selected.map((item, index) => ({
              name: item.name,
              points: item.timeline,
              color: COLORS[index]
            }))}
            years={['2004', '2008', '2012', '2016', '2020', '2024']}
          />
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>2023/24 Performance metrics</h2>
          </div>
          {[
            ['Goals', 'goals'],
            ['Assists', 'assists'],
            ['Matches', 'matches']
          ].map(([label, key]) => (
            <div className="bar-row" key={key}>
              <strong>{left[key]}</strong>
              <div className="bar left" style={{ width: `${Math.min(100, left[key] * 3)}%` }} />
              <span>{label}</span>
              <div className="bar right" style={{ width: `${Math.min(100, right[key] * 3)}%` }} />
              <strong>{right[key]}</strong>
            </div>
          ))}
        </article>

        <div className="compare-foot">
          <p>Keep exploring the comparison. Save this pairing or choose a different opponent.</p>
          <div>
            <Link className="btn btn-ghost btn-explore" to="/ratings">Change players</Link>
            <button type="button" className="btn btn-lime btn-explore">Save comparison</button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
