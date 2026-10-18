import { HERO_PLAYERS } from '../data/heroPlayers.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

function HeroCard({ row, index }) {
  const { t } = useLanguage();

  return (
    <article className="ratings-pcard" style={{ '--i': index }}>
      <img src={row.img} alt="" draggable="false" />
      <div className="ratings-pcard-info">
        <div className="ratings-pcard-name">{row.name}</div>
        <div className="ratings-pcard-meta">{row.country}</div>
        <div className="ratings-pcard-label">{t('ratings.careerPointsLabel')}</div>
        <div className="ratings-pcard-points">{row.points}</div>
        <div className="ratings-pcard-line">
          <span>{t('ratings.bestSeason', { season: row.bestSeason })}</span>
          <b>{row.figure}</b>
        </div>
      </div>
    </article>
  );
}

function MarqueeRow({ rows, reverse }) {
  const loop = [...rows, ...rows];

  return (
    <div className={reverse ? 'ratings-marquee-row is-reverse' : 'ratings-marquee-row'}>
      {loop.map((row, index) => (
        <HeroCard key={`${reverse ? 'b' : 'a'}-${row.id}-${index}`} row={row} index={index % rows.length} />
      ))}
    </div>
  );
}

export function RatingsHero() {
  const { t } = useLanguage();
  const offset = Math.floor(HERO_PLAYERS.length / 2);
  const second = [...HERO_PLAYERS.slice(offset), ...HERO_PLAYERS.slice(0, offset)];

  return (
    <section className="ratings-hero">
      <div className="ratings-hero-stage" aria-hidden="true">
        <MarqueeRow rows={HERO_PLAYERS} />
        <MarqueeRow rows={second} reverse />
      </div>
      <div className="ratings-hero-copy">
        <h1>{t('ratings.heroTitle')}</h1>
        <p>{t('ratings.heroLede')}</p>
      </div>
    </section>
  );
}
