import { HERO_PLAYERS } from '../data/heroPlayers.js';

function HeroCard({ row, index }) {
  return (
    <article className="ratings-pcard" style={{ '--i': index }}>
      <img src={row.img} alt="" draggable="false" />
      <div className="ratings-pcard-info">
        <div className="ratings-pcard-name">{row.name}</div>
        <div className="ratings-pcard-meta">{row.country}</div>
        <div className="ratings-pcard-label">Career points</div>
        <div className="ratings-pcard-points">{row.points}</div>
        <div className="ratings-pcard-line">
          <span>Best season · {row.bestSeason}</span>
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
  const offset = Math.floor(HERO_PLAYERS.length / 2);
  const second = [...HERO_PLAYERS.slice(offset), ...HERO_PLAYERS.slice(0, offset)];

  return (
    <section className="ratings-hero">
      <div className="ratings-hero-stage" aria-hidden="true">
        <MarqueeRow rows={HERO_PLAYERS} />
        <MarqueeRow rows={second} reverse />
      </div>
      <div className="ratings-hero-copy">
        <h1>Every ranking starts with a question.</h1>
        <p>Switch the entity. Read the order. Open a profile or put two records side by side.</p>
      </div>
    </section>
  );
}
