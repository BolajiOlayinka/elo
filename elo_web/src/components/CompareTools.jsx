import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CloseIcon, InfoIcon, SearchIcon } from './Icons.jsx';

const M0 = 1200;
const ANCHOR = 1500;
const SCALE = 800;
const SIGMA_R = 200;
const K = 20;
const Q_MIN = 0.45;
const Q_MAX = 2.5;

export function searchEntities(rows, query, exclude = []) {
  const blocked = new Set(exclude.filter(Boolean));
  const available = rows.filter((row) => !blocked.has(row.id));
  const q = String(query || '').trim().toLowerCase();

  if (!q) {
    return available.slice(0, 8);
  }

  return available
    .filter((row) => {
      const hay = `${row.name} ${row.club} ${row.place} ${row.role} ${row.flag}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 12);
}

export function buildCalcSheet(item) {
  const R = item.eloNum;
  const peak = item.peakEloNum;
  const matches = item.matches || 34;
  const minutes = matches * 86;
  const shrink = minutes / (minutes + M0);
  const zShrunk = (R - ANCHOR) / SIGMA_R;
  const z = zShrunk / (shrink || 1);
  const mu = 7.6 + ((item.rank % 5) * 0.15);
  const sigma = 1.85;
  const rho = mu + z * sigma;
  const opp = 1780 + ((item.rank * 11) % 90);
  const qRaw = 10 ** ((opp - ANCHOR) / SCALE);
  const q = Math.min(Q_MAX, Math.max(Q_MIN, qRaw));
  const expected = 1 / (1 + 10 ** ((opp - R) / 400));
  const result = 1;
  const g = 1;
  const delta = K * g * (result - expected);
  const seasonPoints = Math.round(rho * (minutes / 90));

  return {
    name: item.name,
    photo: item.photo,
    role: item.role,
    club: item.club,
    R,
    peak,
    career: item.careerNum,
    matches,
    minutes,
    shrink,
    zShrunk,
    z,
    mu,
    sigma,
    rho,
    opp,
    qRaw,
    q,
    expected,
    result,
    g,
    delta,
    seasonPoints,
    goals: item.goals,
    assists: item.assists
  };
}

function fmt(value, digits = 2) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function Formula({ children }) {
  return <pre className="cmp-formula">{children}</pre>;
}

export function PlayerPicker({ open, title, rows, exclude, photoOf, onPick, onClose, t }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchEntities(rows, query, exclude), [rows, query, exclude]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setQuery('');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);

    function onKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="cmp-overlay" role="dialog" aria-modal="true" aria-labelledby={inputId}>
      <button className="cmp-overlay-backdrop" type="button" aria-label={t('compare.close')} onClick={onClose} />
      <div className="cmp-picker">
        <div className="cmp-picker-head">
          <div>
            <p>{title}</p>
            <h2 id={inputId}>{t('compare.searchPlayer')}</h2>
          </div>
          <button type="button" className="cmp-icon-btn" onClick={onClose} aria-label={t('compare.close')}>
            <CloseIcon />
          </button>
        </div>
        <label className="cmp-picker-search">
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results[0]) {
                event.preventDefault();
                onPick(results[0].id);
              }
            }}
            placeholder={t('compare.searchPlaceholder')}
            autoComplete="off"
          />
        </label>
        <p className="cmp-picker-hint">{t('compare.searchHint')}</p>
        <ul className="cmp-picker-list">
          {results.length ? results.map((row) => (
            <li key={row.id}>
              <button type="button" onClick={() => onPick(row.id)}>
                <img src={photoOf(row)} alt="" />
                <span>
                  <b>{row.name}</b>
                  <em>{row.club} · {row.role} · {row.place}</em>
                </span>
                <strong>{row.elo}</strong>
              </button>
            </li>
          )) : (
            <li className="is-empty">{t('compare.noResults')}</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function CalcSidebar({ item, color, onClose, t }) {
  const sheet = useMemo(() => (item ? buildCalcSheet(item) : null), [item]);
  const titleId = useId();

  useEffect(() => {
    if (!item) {
      return undefined;
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [item, onClose]);

  if (!item || !sheet) {
    return null;
  }

  return (
    <div className="cmp-overlay is-sidebar" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button className="cmp-overlay-backdrop" type="button" aria-label={t('compare.close')} onClick={onClose} />
      <aside className="cmp-math">
        <header className="cmp-math-head">
          <div>
            <p>{t('compare.howCalculated')}</p>
            <h2 id={titleId}>{sheet.name}</h2>
          </div>
          <button type="button" className="cmp-icon-btn" onClick={onClose} aria-label={t('compare.close')}>
            <CloseIcon />
          </button>
        </header>

        <div className="cmp-math-ident">
          <img src={sheet.photo} alt="" />
          <div>
            <b>{sheet.club}</b>
            <span>{sheet.role}</span>
          </div>
          <strong style={{ color }}>{sheet.R.toLocaleString()}</strong>
        </div>

        <p className="cmp-math-lede">{t('compare.calcLede')}</p>

        <section>
          <h3>{t('compare.calcElo')}</h3>
          <p>{t('compare.calcEloBody')}</p>
          <Formula>
            {`R = 1500 + 200 × z_shrunk
  = 1500 + 200 × ${fmt(sheet.zShrunk)}
  = ${sheet.R.toLocaleString()}`}
          </Formula>
        </section>

        <section>
          <h3>{t('compare.calcZ')}</h3>
          <p>{t('compare.calcZBody', { minutes: sheet.minutes.toLocaleString(), m0: M0 })}</p>
          <Formula>
            {`z = (ρ − μ) / σ
  = (${fmt(sheet.rho)} − ${fmt(sheet.mu)}) / ${fmt(sheet.sigma)}
  = ${fmt(sheet.z)}

z_shrunk = z × M / (M + M₀)
         = ${fmt(sheet.z)} × ${sheet.minutes} / (${sheet.minutes} + ${M0})
         = ${fmt(sheet.zShrunk)}`}
          </Formula>
        </section>

        <section>
          <h3>{t('compare.calcRate')}</h3>
          <p>{t('compare.calcRateBody', { goals: sheet.goals, assists: sheet.assists })}</p>
          <Formula>
            {`P_m = Σ sign(i) · wᵢ · x̃ᵢ · Qᵢ
ρ   = P / (M / 90)
    = ${sheet.seasonPoints.toLocaleString()} / (${sheet.minutes} / 90)
    = ${fmt(sheet.rho)}`}
          </Formula>
        </section>

        <section>
          <h3>{t('compare.calcQ')}</h3>
          <p>{t('compare.calcQBody', { opp: sheet.opp.toLocaleString() })}</p>
          <Formula>
            {`Q_raw = 10^((R_opp − 1500) / 800)
      = 10^((${sheet.opp} − 1500) / 800)
      = ${fmt(sheet.qRaw, 3)}

Q = clip(Q_raw, 0.45, 2.50)
  = ${fmt(sheet.q, 3)}`}
          </Formula>
        </section>

        <section>
          <h3>{t('compare.calcExpected')}</h3>
          <p>{t('compare.calcExpectedBody')}</p>
          <Formula>
            {`E = 1 / (1 + 10^((R_opp − R) / 400))
  = 1 / (1 + 10^((${sheet.opp} − ${sheet.R}) / 400))
  = ${fmt(sheet.expected, 3)}

ΔR = K · G · (S − E)
   = ${K} · ${sheet.g} · (1 − ${fmt(sheet.expected, 3)})
   = ${fmt(sheet.delta, 2)}`}
          </Formula>
        </section>

        <section>
          <h3>{t('compare.calcCareer')}</h3>
          <p>{t('compare.calcCareerBody')}</p>
          <Formula>
            {`Career Elo = minutes-weighted mean of season R
Peak Elo   = 90th percentile of rolling 38-game windows
           = ${sheet.peak.toLocaleString()}

Career Points = Σ P_m
              = ${sheet.career.toLocaleString()}`}
          </Formula>
        </section>

        <p className="cmp-math-note">
          <InfoIcon />
          {t('compare.calcNote')}
        </p>
      </aside>
    </div>
  );
}
