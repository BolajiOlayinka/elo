import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import bellingham from '../assets/players/jude-bellingham.webp';
import haaland from '../assets/players/erling-haaland.webp';
import henry from '../assets/players/henry.webp';
import mbappe from '../assets/players/kylian-mbappe.webp';
import messi from '../assets/players/lionel-messi.webp';
import neymar from '../assets/players/neymar-jr.webp';
import rashford from '../assets/players/marcus-rashford.webp';
import ronaldo from '../assets/players/cristiano-ronaldo.webp';
import vinicius from '../assets/players/vinicius-jr.webp';
import { CalcSidebar, PlayerPicker } from '../components/CompareTools.jsx';
import { LineChart } from '../components/EntityMarks.jsx';
import { InfoIcon, SearchIcon, ShareIcon, SwapIcon } from '../components/Icons.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { getAwardImage } from '../data/awards.js';
import { getRankingItem, getRankings } from '../data/rankings.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

const COLORS = ['#5B8DEF', '#BCF766', '#F3B46A'];
const PORTRAITS = [rashford, vinicius, mbappe, bellingham, haaland, messi, ronaldo, neymar, henry];
const FLAG_FILES = import.meta.glob('../assets/flags/*.svg', {
  eager: true,
  import: 'default'
});

function flagSrc(code) {
  const id = String(code || '').toLowerCase() === 'en' ? 'gb' : String(code || '').toLowerCase();
  return FLAG_FILES[`../assets/flags/${id}.svg`] || null;
}

function enrich(item) {
  if (!item) {
    return null;
  }

  const n = item.rank;

  return {
    ...item,
    photo: PORTRAITS[(n - 1) % PORTRAITS.length],
    universal: Math.max(62, 90 - Math.floor(n / 2)),
    dribbleNum: 25 - (n % 7),
    timeline: item.timeline.map((value, index) => Math.round(value - (n - 1) * 140 - index * 18))
  };
}

function signed(value) {
  if (value === 0) {
    return '0';
  }

  return value > 0 ? `+${value}` : String(value);
}

function CountryFlag({ code }) {
  const src = flagSrc(code);

  return src ? <img className="player-flag" src={src} alt="" /> : <span className="player-flag-code">{code}</span>;
}

function DuelCard({ item, color, t, side, lead, onSearch, onExplain }) {
  const awards = item.accolades.filter((award) => (award.count || 0) > 0).slice(0, 4);

  return (
    <article className={`cmp-card is-${side}${lead ? ' is-lead' : ''}`}>
      <i className="cmp-card-accent" style={{ background: color }} />
      {lead ? <em className="cmp-lead">{t('compare.leads')}</em> : null}
      <div className="cmp-card-top">
        <img className="cmp-photo" src={item.photo} alt="" />
        <div>
          <button type="button" className="cmp-name" onClick={onSearch}>
            <span>{item.name}</span>
            <SearchIcon size={14} />
          </button>
          <p>
            {item.club} · {item.role}
            <CountryFlag code={item.flag} />
            {item.place}
          </p>
          <p>{t('compare.age', { age: item.age, height: item.height, foot: item.foot })}</p>
          <button type="button" className="cmp-change" onClick={onSearch}>
            {t('compare.changePlayer')}
          </button>
        </div>
      </div>
      <div className="cmp-hero">
        <span>{t('compare.currentElo')}</span>
        <strong style={{ color }}>{item.elo}</strong>
        <button type="button" className="cmp-how" onClick={onExplain}>
          <InfoIcon />
          {t('compare.howCalculated')}
        </button>
      </div>
      <div className="cmp-card-kpis">
        <div>
          <span>{t('compare.careerPoints')}</span>
          <b>{item.career}</b>
        </div>
        <div>
          <span>{t('compare.peakElo')}</span>
          <b>{item.peakElo}</b>
        </div>
        <div>
          <span>{t('compare.universal')}</span>
          <b>{item.universal}</b>
        </div>
      </div>
      {awards.length ? (
        <ul className="cmp-awards">
          {awards.map((award) => {
            const image = getAwardImage(award.name);

            return (
              <li key={award.name} title={award.name}>
                {image ? <img src={image} alt="" /> : <span>{award.name}</span>}
                <em>×{award.count}</em>
              </li>
            );
          })}
        </ul>
      ) : null}
      <Link to={`/profile/${item.type}/${item.id}`}>{t('compare.viewProfile')}</Link>
    </article>
  );
}

function MetricPair({ label, left, right, leftLabel, rightLabel, invert = false }) {
  const leftNum = typeof left === 'number' ? left : parseFloat(String(left).replace(/[^0-9.+-]/g, '')) || 0;
  const rightNum = typeof right === 'number' ? right : parseFloat(String(right).replace(/[^0-9.+-]/g, '')) || 0;
  const leftScore = invert ? -leftNum : leftNum;
  const rightScore = invert ? -rightNum : rightNum;
  const max = Math.max(leftNum, rightNum, 0.001);
  const winner = leftScore === rightScore ? 'tie' : leftScore > rightScore ? 'left' : 'right';

  return (
    <div className={`cmp-metric is-${winner}`}>
      <span>{label}</span>
      <div className="cmp-metric-row">
        <strong className={winner === 'left' ? 'is-win' : ''}>{leftLabel ?? left}</strong>
        <div className="cmp-bars">
          <i className="is-left" style={{ width: `${Math.max(10, (leftNum / max) * 100)}%` }} />
          <i className="is-right" style={{ width: `${Math.max(10, (rightNum / max) * 100)}%` }} />
        </div>
        <strong className={winner === 'right' ? 'is-win' : ''}>{rightLabel ?? right}</strong>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const type = params.get('type') || 'players';
  const rows = getRankings(type);
  const incoming = params.get('id');
  const [leftId, setLeftId] = useState(incoming || rows[0].id);
  const [rightId, setRightId] = useState(rows.find((row) => row.id !== (incoming || rows[0].id))?.id || rows[1].id);
  const [extraId, setExtraId] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [picker, setPicker] = useState(() => {
    const side = params.get('picker');
    return side === 'left' || side === 'right' || side === 'extra' ? side : null;
  });
  const [mathSide, setMathSide] = useState(() => {
    const side = params.get('math');
    return side === 'left' || side === 'right' ? side : null;
  });

  const left = enrich(getRankingItem(type, leftId) || rows[0]);
  const right = enrich(getRankingItem(type, rightId) || rows[1]);
  const extra = extraId ? enrich(getRankingItem(type, extraId)) : null;
  const selected = useMemo(() => [left, right, extra].filter(Boolean), [left, right, extra]);
  const eloGap = Math.round((left.eloNum || 0) - (right.eloNum || 0));
  const leader = eloGap >= 0 ? left : right;
  const seasonMetrics = [
    [left.goals, right.goals],
    [left.assists, right.assists],
    [left.matches, right.matches],
    [left.dribbleNum, right.dribbleNum]
  ];
  const seasonWins = seasonMetrics.filter(([a, b]) => (eloGap >= 0 ? a > b : b > a)).length;
  const seasonTotal = seasonMetrics.length;

  function photoOf(row) {
    return PORTRAITS[(row.rank - 1) % PORTRAITS.length];
  }

  function pickPlayer(id) {
    if (picker === 'left') {
      setLeftId(id);
    } else if (picker === 'right') {
      setRightId(id);
    } else if (picker === 'extra') {
      setExtraId(id);
      setShowExtra(true);
    }

    setPicker(null);
  }

  function swap() {
    setLeftId(rightId);
    setRightId(leftId);
  }

  const pickerTitle = {
    left: t('compare.selected'),
    right: t('compare.other'),
    extra: t('compare.another')
  }[picker] || t('compare.searchPlayer');
  const mathItem = mathSide === 'right' ? right : mathSide === 'left' ? left : null;
  const mathColor = mathSide === 'right' ? COLORS[1] : COLORS[0];

  const glance = [
    [t('compare.currentElo'), 'eloNum', 'elo'],
    [t('compare.peakElo'), 'peakEloNum', 'peakElo'],
    [t('compare.careerPoints'), 'careerNum', 'career'],
    [t('compare.universal'), 'universal', 'universal']
  ];

  return (
    <div className="page compare-page">
      <div className="wrap">
        <p className="crumb">
          <Link to={`/profile/${type}/${left.id}`}>{t('compare.profile')}</Link>
          <span> / {t('nav.compare')}</span>
        </p>

        <header className="cmp-head">
          <div>
            <h1>{t('compare.title')}</h1>
            <p>{t('compare.lede')}</p>
          </div>
          <button type="button" className="cmp-share">
            <ShareIcon />
            {t('compare.share')}
          </button>
        </header>

        <section className="cmp-duel">
          <DuelCard
            item={left}
            color={COLORS[0]}
            t={t}
            side="left"
            lead={eloGap >= 0}
            onSearch={() => setPicker('left')}
            onExplain={() => setMathSide('left')}
          />
          <div className="cmp-spine">
            <i />
            <button type="button" className="cmp-vs" onClick={swap} title={t('compare.swap')}>
              <span>{t('compare.vs')}</span>
              <SwapIcon />
            </button>
            <i />
          </div>
          <DuelCard
            item={right}
            color={COLORS[1]}
            t={t}
            side="right"
            lead={eloGap < 0}
            onSearch={() => setPicker('right')}
            onExplain={() => setMathSide('right')}
          />
        </section>

        {showExtra && extra ? (
          <div className="cmp-third">
            <button type="button" className="cmp-third-pick" onClick={() => setPicker('extra')}>
              <img src={extra.photo} alt="" />
              <span>{extra.name}</span>
              <SearchIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowExtra(false);
                setExtraId('');
              }}
            >
              {t('compare.remove')}
            </button>
          </div>
        ) : (
          <button type="button" className="cmp-add" onClick={() => setPicker('extra')}>
            {t('compare.add')}
          </button>
        )}

        <section className="cmp-kpis">
          {glance.map(([label, numKey, textKey]) => {
            const delta = (left[numKey] || 0) - (right[numKey] || 0);

            return (
              <div key={numKey}>
                <span>{label}</span>
                <div>
                  <b style={{ color: COLORS[0] }}>{left[textKey]}</b>
                  <em className={delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''}>{signed(Math.round(delta))}</em>
                  <b style={{ color: COLORS[1] }}>{right[textKey]}</b>
                </div>
              </div>
            );
          })}
        </section>

        <div className="cmp-split">
          <article className="cmp-panel">
            <div className="cmp-panel-head">
              <h2>{t('compare.headToHead')}</h2>
              <span>2023/24</span>
            </div>
            <MetricPair label={t('compare.goals')} left={left.goals} right={right.goals} />
            <MetricPair label={t('compare.assists')} left={left.assists} right={right.assists} />
            <MetricPair label={t('compare.matches')} left={left.matches} right={right.matches} />
            <MetricPair label={t('compare.yellow')} left={left.yellow} right={right.yellow} invert />
            <MetricPair
              label={t('compare.dribble')}
              left={left.dribbleNum}
              right={right.dribbleNum}
              leftLabel={left.dribble}
              rightLabel={right.dribble}
            />
          </article>

          <article className="cmp-panel cmp-verdict">
            <h2>{t('compare.verdict')}</h2>
            <p className="cmp-verdict-name">{leader.name}</p>
            <strong>{signed(Math.abs(eloGap))}</strong>
            <span className="cmp-verdict-gap">{t('compare.eloGap')}</span>
            <p>
              {t('compare.verdictBody', {
                leader: leader.name,
                elo: leader.elo
              })}
            </p>
            <em>{t('compare.seasonEdge', { count: seasonWins, total: seasonTotal })}</em>
          </article>
        </div>

        <article className="cmp-panel">
          <div className="cmp-panel-head">
            <h2>{t('compare.trajectory')}</h2>
            <ul className="cmp-legend">
              {selected.map((item, index) => (
                <li key={item.id}>
                  <i style={{ background: COLORS[index] }} />
                  {item.name}
                </li>
              ))}
            </ul>
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

        <article className="cmp-panel">
          <div className="cmp-panel-head">
            <h2>{t('compare.glance')}</h2>
            <span>{t('compare.illustrative')}</span>
          </div>
          <div className="cmp-glance" style={{ '--n': selected.length }}>
            <div className="is-head">
              <span>{t('compare.metric')}</span>
              {selected.map((item) => (
                <b key={item.id}>{item.name}</b>
              ))}
              <em>{t('compare.diff')}</em>
            </div>
            {glance.map(([label, numKey, textKey]) => (
              <div key={`glance-${numKey}`}>
                <span>{label}</span>
                {selected.map((item, index) => (
                  <b key={item.id} style={{ color: COLORS[index] }}>{item[textKey]}</b>
                ))}
                <em>{signed(Math.round((left[numKey] || 0) - (right[numKey] || 0)))}</em>
              </div>
            ))}
          </div>
        </article>

        <div className="cmp-foot">
          <p>{t('compare.foot')}</p>
          <div>
            <Link className="btn btn-ghost btn-explore" to="/ratings">{t('compare.change')}</Link>
            <button type="button" className="btn btn-lime btn-explore">{t('compare.save')}</button>
          </div>
        </div>
      </div>
      <SiteFooter />
      <PlayerPicker
        open={Boolean(picker)}
        title={pickerTitle}
        rows={rows}
        exclude={picker === 'extra' ? [leftId, rightId] : picker === 'left' ? [rightId, extraId] : [leftId, extraId]}
        photoOf={photoOf}
        onPick={pickPlayer}
        onClose={() => setPicker(null)}
        t={t}
      />
      <CalcSidebar item={mathItem} color={mathColor} onClose={() => setMathSide(null)} t={t} />
    </div>
  );
}
