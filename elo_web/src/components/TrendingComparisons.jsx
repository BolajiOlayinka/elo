import entityMeta from '../data/compareEntities.json';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

const PORTRAIT_FILES = import.meta.glob([
  '../assets/players/*.webp',
  '../assets/coaches/*.webp',
  '../assets/keepers/*.webp'
], {
  eager: true,
  import: 'default'
});

const PORTRAITS = Object.fromEntries(
  Object.entries(PORTRAIT_FILES).map(([path, src]) => {
    const file = path.split('/').pop().replace('.webp', '');

    return [file, src];
  })
);

const MATCHUPS = [
  ['messi', 'ronaldo'],
  ['messi', 'pele'],
  ['ronaldo', 'maradona'],
  ['henry', 'haaland'],
  ['ronaldinho', 'neymar'],
  ['okocha', 'debruyne'],
  ['zidane', 'rodri'],
  ['debruyne', 'rodri'],
  ['beckham', 'lampard', 'zidane', 'debruyne'],
  ['rooney', 'kane'],
  ['raya', 'courtois'],
  ['buffon', 'neuer', 'courtois'],
  ['ferguson', 'guardiola'],
  ['ancelotti', 'mourinho', 'klopp']
];

const GROUP = {
  attacker: 'Attackers',
  midfielder: 'Midfielders',
  defender: 'Defenders',
  keeper: 'Goalkeepers',
  coach: 'Coaches',
  country: 'Nations'
};

function hash(value) {
  let h = 2166136261;
  for (const char of value) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }

  return (h >>> 0) / 4294967295;
}

function entity(id) {
  const meta = entityMeta[id];

  return {
    id,
    ...meta,
    img: PORTRAITS[id],
    zoom: meta.zoom || 1
  };
}

function shortName(name) {
  const trimmed = name.replace(/\s+Jr\.?$/, '');
  const parts = trimmed.split(' ');

  return parts.slice(1).join(' ') || trimmed;
}

function years(item, nowLabel) {
  return `${item.from}–${item.to || nowLabel}`;
}

function CompareCard({ ids, index }) {
  const { t } = useLanguage();
  const people = ids.map(entity);
  const count = people.length;
  const gap = Math.round(Math.max(...people.map((item) => (item.from + (item.to || 2026)) / 2))
    - Math.min(...people.map((item) => (item.from + (item.to || 2026)) / 2)));
  const fontScale = count === 2 ? 0.052 : count === 3 ? 0.044 : 0.036;
  const zoomBoost = count === 4 ? 1.3 : count === 3 ? 1.12 : 1;

  return (
    <article className="trend-ccard" style={{ '--i': index }}>
      <div className="trend-cols" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
        {people.map((person) => (
          <div
            key={person.id}
            className="trend-col"
            style={{
              '--c': person.glow,
              '--z': person.zoom * zoomBoost,
              '--fs': fontScale
            }}
          >
            <div className="trend-glow" />
            <img src={person.img} alt="" draggable="false" />
            <div className="trend-nm">{count > 2 ? shortName(person.name) : person.name}</div>
            <div className="trend-mt">
              {count > 2 ? years(person, t('trend.now')) : `${person.country} · ${person.club}`}
            </div>
          </div>
        ))}
      </div>
      <div className="trend-fade" />
      {people.slice(1).map((person, sepIndex) => (
        <div
          key={`sep-${person.id}`}
          className="trend-sep"
          style={{ left: `${((sepIndex + 1) * 100) / count}%` }}
        />
      ))}
      {count === 2 ? <div className="trend-vs">VS</div> : null}
      <div className="trend-top">
        <span className="trend-chip">{t(`trend.group.${people[0].group}`, GROUP[people[0].group])}</span>
        {gap > 12 ? (
          <span className="trend-chip is-ok">{t('trend.apart', { n: gap })}</span>
        ) : (
          <span className="trend-chip">{t('trend.sameEra')}</span>
        )}
      </div>
      <div className="trend-stat">
        <div className="trend-lab">{t('trend.normalized')}</div>
        <div className="trend-bars" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
          {people.map((person) => {
            const sigma = (0.8 + hash(`${person.name}σ`) * 2.4).toFixed(2);

            return (
              <div
                key={person.id}
                className="trend-it"
                style={{ '--c': person.glow, '--v': 0.4 + 0.55 * hash(`${person.name}σ`) }}
              >
                <div className="trend-tk"><i /></div>
                <b>+{sigma}</b>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function MarqueeRow({ matchups, reverse }) {
  const loop = [...matchups, ...matchups];

  return (
    <div className={reverse ? 'trend-row is-reverse' : 'trend-row'}>
      {loop.map((ids, index) => (
        <CompareCard
          key={`${reverse ? 'b' : 'a'}-${ids.join('-')}-${index}`}
          ids={ids}
          index={index % matchups.length}
        />
      ))}
    </div>
  );
}

export function TrendingComparisons() {
  const { t } = useLanguage();
  const offset = Math.floor(MATCHUPS.length / 2);
  const second = [...MATCHUPS.slice(offset), ...MATCHUPS.slice(0, offset)];

  return (
    <div className="trend-showcase" aria-label={t('trend.featured')}>
      <MarqueeRow matchups={MATCHUPS} />
      <MarqueeRow matchups={second} reverse />
    </div>
  );
}
