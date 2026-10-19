import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import footballLegends from '../assets/football_legends.png';
import {
  ArrowUpRight,
  BoltIcon,
  ChartIcon,
  CompareIcon,
  GlobeIcon,
  InfoIcon,
  PeakIcon,
  TrophyIcon,
  UserPlusIcon
} from '../components/Icons.jsx';
import { Avatar } from '../components/EntityMarks.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { getProfile } from '../data/api.js';
import { RATING_TABS } from '../data/rankings.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

const FLAG_FILES = import.meta.glob('../assets/flags/*.svg', {
  eager: true,
  import: 'default'
});

function flagSrc(code) {
  const id = String(code || '').toLowerCase() === 'en' ? 'gb' : String(code || '').toLowerCase();
  return FLAG_FILES[`../assets/flags/${id}.svg`] || null;
}

function CountryFlag({ code }) {
  const src = flagSrc(code);

  if (!src) {
    return <span className="player-flag-code">{code}</span>;
  }

  return <img className="player-flag" src={src} alt="" />;
}

function StatOrb({ value, label, tone = 'lime' }) {
  return (
    <div className={`player-orb is-${tone}`}>
      <strong>{value}</strong>
      <i />
      <span>{label}</span>
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="player-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const { type, id } = useParams();
  const [following, setFollowing] = useState(false);
  const [item, setItem] = useState(null);
  const [status, setStatus] = useState('loading');
  const tab = RATING_TABS.find((entry) => entry.id === type);
  const noun = t(`dossier.noun.${tab?.noun || 'Player'}`);
  const rivals = item?.rivals || [];
  const latest = item?.seasons?.[item.seasons.length - 1];

  useEffect(() => {
    let cancel = false;

    setStatus('loading');
    getProfile(type, id)
      .then((data) => {
        if (cancel) {
          return;
        }

        setItem(data);
        setStatus(data ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancel) {
          setStatus('error');
        }
      });

    return () => {
      cancel = true;
    };
  }, [type, id]);

  return (
    <div className="page profile-page">
      {item ? (
        <>
          <div className="wrap">
            <header className="player-ident">
              <div className="player-ident-main">
                {item.photo ? (
                  <img className="player-photo" src={item.photo} alt="" />
                ) : (
                  <Avatar initials={item.initials} size={88} />
                )}
                <div>
                  <h1>{item.name}</h1>
                  <p className="player-meta">
                    {item.club} | {item.role} | {item.place}
                    <CountryFlag code={item.flag} />
                  </p>
                  <p className="player-vitals">
                    {t('dossier.age')}: {item.age ?? '—'}
                    <span>·</span>
                    {t('dossier.height')}: {item.height || '—'}
                    <span>·</span>
                    Rank: {item.rank ?? '—'}
                  </p>
                </div>
              </div>
              <div className="player-ident-actions">
                <button
                  type="button"
                  className="player-follow"
                  onClick={() => setFollowing((value) => !value)}
                >
                  <UserPlusIcon />
                  {t(following ? 'dossier.followingPlayer' : 'dossier.followPlayer', { noun })}
                </button>
                <Link className="player-compare" to={`/compare?type=${item.type}&id=${item.id}`}>
                  <CompareIcon />
                  {t('dossier.compareStats')}
                </Link>
              </div>
            </header>

            <section className="player-kpis" aria-label={t('dossier.careerPoints')}>
              <div>
                <span><ChartIcon size={14} />{t('dossier.careerPoints')}</span>
                <strong>{item.career}</strong>
                <em>{item.matches ?? '—'} matches</em>
              </div>
              <div>
                <span><PeakIcon size={14} />{t('dossier.peakSeason')}</span>
                <strong>{item.peak}</strong>
                <em>{latest ? latest.year : '—'}</em>
              </div>
              <div>
                <span><BoltIcon size={14} />{t('dossier.currentElo')}</span>
                <strong>{item.elo}</strong>
                <em>{item.role}</em>
              </div>
              <div>
                <span><GlobeIcon size={14} />{t('dossier.universal')}</span>
                <strong>{item.goals ?? '—'}</strong>
                <em>{item.assists ?? '—'} assists</em>
              </div>
            </section>

            <section className="player-tech-shell">
              <article>
                <div className="player-panel-head">
                  <h2>{t('dossier.tech')}</h2>
                  <Link to="/ratings">{t('dossier.fullReport')} →</Link>
                </div>
                <div className="player-orbs">
                  <StatOrb value={item.goals ?? '—'} label="Goals" tone="lime" />
                  <StatOrb value={item.assists ?? '—'} label="Assists" tone="lime" />
                  <StatOrb value={item.matches ?? '—'} label="Matches" tone="mint" />
                  <StatOrb value={latest?.minutes ?? '—'} label="Latest minutes" tone="green" />
                </div>
              </article>
              <article>
                <div className="player-panel-head">
                  <h2>
                    <TrophyIcon />
                    Seasons
                  </h2>
                </div>
                <ul className="player-awards">
                  {(item.seasons || []).slice(-6).reverse().map((season) => (
                    <li key={`${season.year}-${season.club}`}>
                      <strong>{season.year}</strong>
                      <span>{season.club}</span>
                      <span>{season.elo}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            <div className="player-perf-split">
              <article className="player-panel">
                <div className="player-panel-head">
                  <h2>{t('dossier.perfTitle')}</h2>
                  <label className="player-season">
                    <span className="sr-only">{t('dossier.season')}</span>
                    <select defaultValue="current">
                      <option value="current">{t('dossier.currentSeason')}</option>
                    </select>
                  </label>
                </div>
                <div className="player-metrics">
                  <MetricTile label="Club" value={latest?.club || item.club || '—'} />
                  <MetricTile label="Goals" value={latest?.goals ?? '—'} />
                  <MetricTile label="Assists" value={latest?.assists ?? '—'} />
                  <MetricTile label="Minutes" value={latest?.minutes ?? '—'} />
                  <MetricTile label="Season Elo" value={latest?.elo ?? '—'} />
                  <MetricTile label="Peak Elo" value={item.peak} />
                </div>
              </article>

              <aside className="player-side">
                <article className="player-elo">
                  <h2>
                    <InfoIcon size={18} />
                    {t('dossier.eloAnalytics')}
                  </h2>
                  <p>{t('dossier.eloNote', { name: item.name })}</p>
                </article>
                <article className="player-rivals-wrap">
                  <h2>{t('dossier.rivals', { role: item.role })}</h2>
                  <ol className="player-rivals">
                    {rivals.map((rival, index) => (
                      <li key={rival.id}>
                        <span>{index + 1}</span>
                        <Avatar initials={rival.initials} size={28} />
                        <Link to={`/profile/${rival.type}/${rival.id}`}>{rival.name}</Link>
                        <strong>{rival.elo}</strong>
                      </li>
                    ))}
                  </ol>
                  <Link className="player-full-rank" to="/ratings">{t('dossier.fullRankings')}</Link>
                </article>
              </aside>
            </div>
          </div>

          <section className="player-window" aria-label={t('dossier.ctaTitle')}>
            <div className="player-window-pane" style={{ backgroundImage: `url(${footballLegends})` }} />
            <div className="player-window-overlay" />
            <div className="player-window-copy">
              <h2>{t('dossier.ctaTitle')}</h2>
              <p>{t('dossier.ctaLede')}</p>
              <div>
                <Link className="btn btn-lime btn-explore" to="/ratings">
                  {t('dossier.exploreRatings')}
                  <ArrowUpRight size={10} />
                </Link>
                <Link className="btn btn-ghost btn-explore" to="/analysis">
                  {t('dossier.talkAnalyst')}
                  <ArrowUpRight size={10} />
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="wrap">
          <section className="profile-card">
            <h1>{status === 'loading' ? 'Loading profile…' : status === 'error' ? 'Profile unavailable.' : t('dossier.notFound')}</h1>
            <Link className="btn btn-ghost btn-explore-profiles" to="/ratings">{t('dossier.backRatings')}</Link>
          </section>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
