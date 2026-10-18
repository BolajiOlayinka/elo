import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CompareIcon } from '../components/Icons.jsx';
import { Avatar, LineChart } from '../components/EntityMarks.jsx';
import { getRankingItem, RATING_TABS } from '../data/rankings.js';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { type, id } = useParams();
  const [following, setFollowing] = useState(false);
  const item = getRankingItem(type, id);
  const tab = RATING_TABS.find((entry) => entry.id === type);

  return (
    <div className="page profile-page">
      <div className="wrap">
        {item ? (
          <section className="dossier">
            <header className="dossier-top">
              <Avatar initials={item.initials} size={72} />
              <div>
                <h1>{item.name}</h1>
                <p>{item.club} | {item.role} | {item.place}</p>
                <p className="dossier-vitals">
                  {t('dossier.vitals', { age: item.age, height: item.height, foot: item.foot, since: item.since })}
                </p>
                <div className="profile-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-explore"
                    onClick={() => setFollowing((value) => !value)}
                  >
                    {t(following ? 'dossier.following' : 'dossier.follow', { noun: t(`dossier.noun.${tab?.noun || 'Player'}`) })}
                  </button>
                  <Link className="btn btn-lime btn-explore" to={`/compare?type=${item.type}&id=${item.id}`}>
                    <CompareIcon />
                    {t('dossier.compare')}
                  </Link>
                </div>
              </div>
              <div className="crest">{item.club.slice(0, 1)}</div>
            </header>

            <div className="dossier-kpis">
              <div>
                <span>{t('dossier.careerPoints')}</span>
                <strong>{item.career}</strong>
                <em>{t('dossier.lifetime')}</em>
              </div>
              <div>
                <span>{t('dossier.currentElo')}</span>
                <strong>{item.elo}</strong>
                <em>{t('dossier.peak', { value: item.peakElo })}</em>
              </div>
              <div>
                <span>{t('dossier.rank')}</span>
                <strong>#{item.rank}</strong>
                <em>{t('dossier.division')}</em>
              </div>
            </div>

            <div className="dossier-split">
              <article className="panel">
                <div className="panel-head">
                  <h2>{t('dossier.timeline')}</h2>
                </div>
                <LineChart
                  series={[{ name: item.name, points: item.timeline, color: '#5B8DEF' }]}
                  years={['2004', '2008', '2012', '2016', '2020', '2024']}
                />
              </article>
              <article className="panel">
                <h2>{t('dossier.cabinet')}</h2>
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
                <h2>{t('dossier.perfTitle')}</h2>
                <div className="metric-grid">
                  <div><span>{t('dossier.goals')}</span><strong>{item.goals}</strong></div>
                  <div><span>{t('dossier.assists')}</span><strong>{item.assists}</strong></div>
                  <div><span>{t('dossier.matches')}</span><strong>{item.matches}</strong></div>
                  <div><span>{t('dossier.dribble')}</span><strong>{item.dribble}</strong></div>
                  <div><span>{t('dossier.red')}</span><strong>{item.red}</strong></div>
                  <div><span>{t('dossier.yellow')}</span><strong>{item.yellow}</strong></div>
                </div>
              </article>
              <article className="panel">
                <h2>{t('dossier.accolades')}</h2>
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
              <h2>{t('dossier.careerPerf')}</h2>
              <table className="ratings-table">
                <thead>
                  <tr>
                    <th>{t('dossier.season')}</th>
                    <th>{t('dossier.club')}</th>
                    <th>{t('dossier.level')}</th>
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
            <h1>{t('dossier.notFound')}</h1>
            <Link className="btn btn-ghost btn-explore-profiles" to="/ratings">{t('dossier.backRatings')}</Link>
          </section>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
