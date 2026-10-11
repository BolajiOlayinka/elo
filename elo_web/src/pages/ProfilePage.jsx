import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CompareIcon } from '../components/Icons.jsx';
import { Avatar, LineChart } from '../components/EntityMarks.jsx';
import { SiteNav } from '../components/SiteNav.jsx';
import { getRankingItem, RATING_TABS } from '../data/rankings.js';
import { SiteFooter } from '../components/SiteFooter.jsx';

export default function ProfilePage() {
  const { type, id } = useParams();
  const [following, setFollowing] = useState(false);
  const item = getRankingItem(type, id);
  const tab = RATING_TABS.find((entry) => entry.id === type);

  return (
    <div className="page profile-page">
      <div className="wrap">
        <SiteNav />
        {item ? (
          <section className="dossier">
            <header className="dossier-top">
              <Avatar initials={item.initials} size={72} />
              <div>
                <h1>{item.name}</h1>
                <p>{item.club} | {item.role} | {item.place}</p>
                <p className="dossier-vitals">
                  Age {item.age} · Height {item.height} · Foot {item.foot} · Active since {item.since}
                </p>
                <div className="profile-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-explore"
                    onClick={() => setFollowing((value) => !value)}
                  >
                    {following ? 'Following' : 'Follow'} {tab?.noun || 'record'}
                  </button>
                  <Link className="btn btn-lime btn-explore" to={`/compare?type=${item.type}&id=${item.id}`}>
                    <CompareIcon />
                    Compare stats
                  </Link>
                </div>
              </div>
              <div className="crest">{item.club.slice(0, 1)}</div>
            </header>

            <div className="dossier-kpis">
              <div>
                <span>Career Points</span>
                <strong>{item.career}</strong>
                <em>Lifetime position</em>
              </div>
              <div>
                <span>Current Elo</span>
                <strong>{item.elo}</strong>
                <em>Peak {item.peakElo}</em>
              </div>
              <div>
                <span>Rank</span>
                <strong>#{item.rank}</strong>
                <em>Leading division</em>
              </div>
            </div>

            <div className="dossier-split">
              <article className="panel">
                <div className="panel-head">
                  <h2>Career timeline</h2>
                </div>
                <LineChart
                  series={[{ name: item.name, points: item.timeline, color: '#5B8DEF' }]}
                  years={['2004', '2008', '2012', '2016', '2020', '2024']}
                />
              </article>
              <article className="panel">
                <h2>Trophy cabinet</h2>
                <ul className="trophy-grid">
                  {item.trophies.map((trophy) => (
                    <li key={trophy.name}>
                      <span>🏆</span>
                      <strong>{trophy.name}</strong>
                      <em>×{trophy.count}</em>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="dossier-split">
              <article className="panel">
                <h2>2023/24 Performance metrics</h2>
                <div className="metric-grid">
                  <div><span>Goals</span><strong>{item.goals}</strong></div>
                  <div><span>Assists</span><strong>{item.assists}</strong></div>
                  <div><span>Matches</span><strong>{item.matches}</strong></div>
                  <div><span>Dribble</span><strong>{item.dribble}</strong></div>
                  <div><span>Red cards</span><strong>{item.red}</strong></div>
                  <div><span>Yellow cards</span><strong>{item.yellow}</strong></div>
                </div>
              </article>
              <article className="panel">
                <h2>Individual accolades</h2>
                <ul className="accolade-list">
                  {item.accolades.map((award) => (
                    <li key={award.name}>
                      <span>★</span>
                      {award.name}
                      <em>×{award.count}</em>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="panel">
              <h2>Career performance</h2>
              <table className="ratings-table">
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Club</th>
                    <th>Competition level</th>
                  </tr>
                </thead>
                <tbody>
                  {item.seasons.map((season) => (
                    <tr key={season.year}>
                      <td>{season.year}</td>
                      <td>{season.club}</td>
                      <td>{season.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>
        ) : (
          <section className="profile-card">
            <h1>Profile not found</h1>
            <Link className="btn btn-ghost btn-explore-profiles" to="/ratings">Back to ratings</Link>
          </section>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
