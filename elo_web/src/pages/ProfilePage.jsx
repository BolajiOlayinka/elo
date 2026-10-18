import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import bellingham from '../assets/players/jude-bellingham.webp';
import haaland from '../assets/players/erling-haaland.webp';
import henry from '../assets/players/henry.webp';
import mbappe from '../assets/players/kylian-mbappe.webp';
import messi from '../assets/players/lionel-messi.webp';
import neymar from '../assets/players/neymar-jr.webp';
import rashford from '../assets/players/marcus-rashford.webp';
import ronaldo from '../assets/players/cristiano-ronaldo.webp';
import vinicius from '../assets/players/vinicius-jr.webp';
import footballLegends from '../assets/football_legends.png';
import {
  ArrowUpRight,
  BoltIcon,
  ChartIcon,
  CompareIcon,
  GlobeIcon,
  InfoIcon,
  MedalIcon,
  PeakIcon,
  TrophyIcon,
  UserPlusIcon
} from '../components/Icons.jsx';
import { Avatar } from '../components/EntityMarks.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { getAwardImage } from '../data/awards.js';
import { getRankingItem, getRankings, RATING_TABS } from '../data/rankings.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

const PORTRAITS = [rashford, vinicius, mbappe, bellingham, haaland, messi, ronaldo, neymar, henry];

const FLAG_FILES = import.meta.glob('../assets/flags/*.svg', {
  eager: true,
  import: 'default'
});

function flagSrc(code) {
  const id = String(code || '').toLowerCase() === 'en' ? 'gb' : String(code || '').toLowerCase();
  return FLAG_FILES[`../assets/flags/${id}.svg`] || null;
}

function jitter(index, salt) {
  return ((index * 47 + salt * 13) % 97) / 97;
}

function enrich(item) {
  const n = item.rank;
  const ovr = Math.max(68, 93 - Math.floor(n / 3));
  const tech = {
    ovr,
    pac: Math.max(62, ovr - 2 + Math.round(jitter(n, 1) * 6)),
    sho: Math.max(58, ovr - 18 + Math.round(jitter(n, 2) * 8)),
    pas: Math.max(64, ovr - 10 + Math.round(jitter(n, 3) * 6)),
    dri: Math.max(66, ovr - 6 + Math.round(jitter(n, 4) * 5)),
    def: Math.max(60, ovr - 12 + Math.round(jitter(n, 5) * 8)),
    phy: Math.max(68, ovr - 8 + Math.round(jitter(n, 6) * 6)),
    acceleration: Math.max(70, ovr - 1 + Math.round(jitter(n, 7) * 4)),
    crossing: Math.max(64, ovr - 9 + Math.round(jitter(n, 8) * 6)),
    tackle: Math.max(62, ovr - 11 + Math.round(jitter(n, 9) * 7)),
    sprint: Math.max(68, ovr - 3 + Math.round(jitter(n, 12) * 5)),
    vision: Math.max(63, ovr - 10 + Math.round(jitter(n, 13) * 6)),
    strength: Math.max(66, ovr - 7 + Math.round(jitter(n, 14) * 5))
  };

  return {
    ...item,
    photo: PORTRAITS[(n - 1) % PORTRAITS.length],
    market: `€${Math.max(4, 48 - n)}M`,
    universal: Math.max(62, 90 - Math.floor(n / 2)),
    elitePct: Math.max(1, Math.min(18, 1 + Math.floor(n / 3))),
    seasonDelta: Math.round(80 + jitter(n, 10) * 90),
    eraDelta: (3.2 + jitter(n, 11) * 1.8).toFixed(1),
    tech,
    perf: {
      defensive: (980 - n * 3).toLocaleString(),
      tackles: (91.1 - n * 0.12).toFixed(1),
      interceptions: (85.5 - n * 0.08).toFixed(0),
      clearance: item.career,
      recoveries: (980 - n * 2).toLocaleString(),
      passes: (91.4 - n * 0.09).toFixed(1),
      fouls: String(Math.max(8, 18 - (n % 7))),
      careerDef: (11920 - n * 40).toLocaleString(),
      attacking: (980 - n * 4).toLocaleString(),
      positioning: (91.4 - n * 0.07).toFixed(1),
      duels: (85.5 - n * 0.1).toFixed(0)
    }
  };
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

function TechBar({ label, value }) {
  return (
    <div className="player-tech-bar">
      <div>
        <span>{label}</span>
        <em>{value}</em>
      </div>
      <i><b style={{ width: `${value}%` }} /></i>
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
  const raw = getRankingItem(type, id);
  const tab = RATING_TABS.find((entry) => entry.id === type);
  const item = raw ? enrich(raw) : null;
  const noun = t(`dossier.noun.${tab?.noun || 'Player'}`);
  const rivals = item
    ? getRankings(item.type).filter((row) => row.id !== item.id).slice(0, 3)
    : [];
  const techKeys = [
    ['ovr', 'dossier.ovr'],
    ['pac', 'dossier.pac'],
    ['sho', 'dossier.sho'],
    ['pas', 'dossier.pas'],
    ['dri', 'dossier.dri'],
    ['def', 'dossier.def'],
    ['phy', 'dossier.phy']
  ];

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
                    {t('dossier.age')}: {item.age}
                    <span>·</span>
                    {t('dossier.height')}: {item.height}
                    <span>·</span>
                    {t('dossier.footLabel')}: {item.foot}
                    <span>·</span>
                    {t('dossier.market')}: {item.market}
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
                <em>{t('dossier.ptsSeason', { n: item.seasonDelta })}</em>
              </div>
              <div>
                <span><PeakIcon size={14} />{t('dossier.peakSeason')}</span>
                <strong>{item.peak}</strong>
                <em>{t('dossier.ptsEra', { n: item.eraDelta })}</em>
              </div>
              <div>
                <span><BoltIcon size={14} />{t('dossier.currentElo')}</span>
                <strong>{item.elo}</strong>
                <em>{t('dossier.lastTen')}</em>
              </div>
              <div>
                <span><GlobeIcon size={14} />{t('dossier.universal')}</span>
                <strong>{item.universal}</strong>
                <em>{t('dossier.eliteTier', { n: item.elitePct })}</em>
              </div>
            </section>

            <section className="player-tech-shell">
              <article>
                <div className="player-panel-head">
                  <h2>{t('dossier.tech')}</h2>
                  <Link to="/ratings">{t('dossier.fullReport')} →</Link>
                </div>
                <div className="player-orbs">
                  {techKeys.map(([key, label], index) => (
                    <StatOrb
                      key={key}
                      value={item.tech[key]}
                      label={t(label)}
                      tone={index < 2 ? 'lime' : index < 5 ? 'mint' : 'green'}
                    />
                  ))}
                </div>
                <div className="player-tech-bars">
                  <TechBar label={t('dossier.acceleration')} value={item.tech.acceleration} />
                  <TechBar label={t('dossier.crossing')} value={item.tech.crossing} />
                  <TechBar label={t('dossier.tackle')} value={item.tech.tackle} />
                  <TechBar label={t('dossier.sprint')} value={item.tech.sprint} />
                  <TechBar label={t('dossier.vision')} value={item.tech.vision} />
                  <TechBar label={t('dossier.strength')} value={item.tech.strength} />
                </div>
              </article>
              <article>
                <div className="player-panel-head">
                  <h2>
                    <TrophyIcon />
                    {t('dossier.accolades')}
                  </h2>
                  <button type="button">{t('dossier.seeMore')}</button>
                </div>
                <ul className="player-awards">
                  {item.accolades.map((award) => {
                    const image = getAwardImage(award.name);

                    return (
                      <li key={award.name}>
                        {image ? <img src={image} alt="" /> : <MedalIcon />}
                        <strong>{award.name}</strong>
                        <span>×{award.count || 1}</span>
                      </li>
                    );
                  })}
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
                  <MetricTile label={t('dossier.defActions')} value={item.perf.defensive} />
                  <MetricTile label={t('dossier.tacklesWon')} value={item.perf.tackles} />
                  <MetricTile label={t('dossier.interceptions')} value={item.perf.interceptions} />
                  <MetricTile label={t('dossier.clearance')} value={item.perf.clearance} />
                  <MetricTile label={t('dossier.recoveries')} value={item.perf.recoveries} />
                  <MetricTile label={t('dossier.passCompleted')} value={item.perf.passes} />
                  <MetricTile label={t('dossier.fouls')} value={item.perf.fouls} />
                  <MetricTile label={t('dossier.careerDef')} value={item.perf.careerDef} />
                  <MetricTile label={t('dossier.attacking')} value={item.perf.attacking} />
                  <MetricTile label={t('dossier.positioning')} value={item.perf.positioning} />
                  <MetricTile label={t('dossier.duels')} value={item.perf.duels} />
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
            <h1>{t('dossier.notFound')}</h1>
            <Link className="btn btn-ghost btn-explore-profiles" to="/ratings">{t('dossier.backRatings')}</Link>
          </section>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
