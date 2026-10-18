import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HOME_HERO_PLAYERS } from '../data/homeHeroPlayers.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

const HOLD_MS = 3400;
const EXIT_MS = 700;
const FACTS = [
  ['Gender', 'gender'],
  ['Country', 'country'],
  ['Club', 'club'],
  ['Position', 'position']
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function useCountUp(value, duration) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setShown(value);

      return undefined;
    }

    let frame;
    const started = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(value * eased));
      if (t < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return shown.toLocaleString('en-US');
}

function Layer({ player, mode }) {
  const nameRef = useRef(null);

  useLayoutEffect(() => {
    const el = nameRef.current;
    const card = el?.closest('.home-hero-card');

    if (!el || !card) {
      return;
    }

    el.style.fontSize = '100px';
    const width = el.scrollWidth || 1;
    const max = card.clientWidth * 0.26;
    el.style.fontSize = `${Math.min(max, (100 * card.clientWidth * 0.92) / width)}px`;
  }, [player.id]);

  return (
    <div
      className={`home-hero-layer is-${mode}`}
      style={{ '--glow': player.glow }}
    >
      <div className="home-hero-glow" />
      <div className="home-hero-bgname" ref={nameRef}>{player.name}</div>
      <img className="home-hero-cutout" src={player.img} alt="" draggable="false" />
    </div>
  );
}

export function HomeHeroCard() {
  const { t } = useLanguage();
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(null);
  const player = HOME_HERO_PLAYERS[index];
  const points = useCountUp(player.points, 700);

  useEffect(() => {
    if (reduced) {
      return undefined;
    }

    const timer = setInterval(() => {
      setIndex((current) => {
        setLeaving(current);

        return (current + 1) % HOME_HERO_PLAYERS.length;
      });
    }, HOLD_MS);

    return () => clearInterval(timer);
  }, [reduced]);

  useEffect(() => {
    if (leaving == null) {
      return undefined;
    }

    const timer = setTimeout(() => setLeaving(null), EXIT_MS);

    return () => clearTimeout(timer);
  }, [leaving]);

  return (
    <div className="home-hero-card" aria-live="polite">
      {leaving != null ? (
        <Layer player={HOME_HERO_PLAYERS[leaving]} mode="out" />
      ) : null}
      <Layer player={player} mode="in" />
      <div className="home-hero-shade" />
      <div className="home-hero-info">
        <div className="home-hero-mask is-go" key={player.id}>
          <span className="home-hero-name">{player.name}</span>
        </div>
        <div className="home-hero-facts">
          {FACTS.map(([label, key]) => (
            <div key={key}>
              <span className="home-hero-k">{t(`home.fact.${key}`, label)}</span>
              <span className="home-hero-v">{player[key]}</span>
            </div>
          ))}
        </div>
        <div className="home-hero-label">{t('ratings.careerPointsLabel')}</div>
        <div className="home-hero-points">{points}</div>
        <div className="home-hero-line">
          <span>{t('ratings.bestSeason', { season: player.bestSeason })}</span>
          <b>{player.figure}</b>
        </div>
      </div>
    </div>
  );
}
