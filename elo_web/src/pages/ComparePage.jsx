import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, LineChart } from '../components/EntityMarks.jsx';
import { ShareIcon, SwapIcon } from '../components/Icons.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { getRankingItem, getRankings } from '../data/rankings.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

const COLORS = ['#5B8DEF', '#BCF766', '#F3B46A'];

function diff(left, right) {
  return left - right;
}

function signed(value) {
  if (value === 0) {
    return '0';
  }

  return value > 0 ? `+${value}` : String(value);
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

  const left = getRankingItem(type, leftId) || rows[0];
  const right = getRankingItem(type, rightId) || rows[1];
  const extra = extraId ? getRankingItem(type, extraId) : null;
  const selected = useMemo(() => [left, right, extra].filter(Boolean), [left, right, extra]);

  function swap() {
    setLeftId(rightId);
    setRightId(leftId);
  }

  return (
    <div className="page compare-page">
      <div className="wrap">
        <p className="crumb">
          <Link to={left ? `/profile/${type}/${left.id}` : '/ratings'}>{t('compare.profile')}</Link>
          <span> / {t('nav.compare')}</span>
        </p>

        <section className="compare-head">
          <div>
            <h1>{t('compare.title')}</h1>
            <p>{t('compare.lede')}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-explore">
            <ShareIcon />
            {t('compare.share')}
          </button>
        </section>

        <section className="compare-picker">
          <div className="picker-col">
            <label>{t('compare.selected')}</label>
            <select value={leftId} onChange={(event) => setLeftId(event.target.value)}>
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
            <div className="picker-filters">
              <select defaultValue="all"><option value="all">{t('compare.allComps')}</option></select>
              <select defaultValue="career"><option value="career">{t('compare.season')}</option></select>
            </div>
          </div>

          <button type="button" className="swap-btn" onClick={swap}>
            <SwapIcon />
            {t('compare.swap')}
          </button>

          <div className="picker-col">
            <label>{t('compare.other')}</label>
            <select value={rightId} onChange={(event) => setRightId(event.target.value)}>
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
            <div className="picker-filters">
              <select defaultValue="all"><option value="all">{t('compare.allComps')}</option></select>
              <select defaultValue="career"><option value="career">{t('compare.season')}</option></select>
            </div>
          </div>
        </section>

        {showExtra ? (
          <div className="picker-col extra-picker">
            <label>{t('compare.another')}</label>
            <select value={extraId} onChange={(event) => setExtraId(event.target.value)}>
              <option value="">{t('compare.choose')}</option>
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost add-player" onClick={() => setShowExtra(true)}>
            {t('compare.add')}
          </button>
        )}

        <div className={`compare-mini ${extra ? 'has-three' : ''}`}>
          {selected.map((item, index) => (
            <article key={item.id} className="mini-card">
              <Avatar initials={item.initials} size={44} />
              <div>
                <h3>{item.name}</h3>
                <p>{t('compare.meta', { club: item.club, role: item.role, place: item.place })}</p>
                <p>{t('compare.age', { age: item.age, height: item.height, foot: item.foot })}</p>
                <Link to={`/profile/${item.type}/${item.id}`}>{t('compare.viewProfile')}</Link>
              </div>
              <span className="dot" style={{ background: COLORS[index] }} />
            </article>
          ))}
        </div>

        <article className="panel">
          <div className="panel-head">
            <h2>{t('compare.glance')}</h2>
            <span>{t('compare.illustrative')}</span>
          </div>
          <table className="ratings-table glance-table">
            <thead>
              <tr>
                <th>{t('compare.metric')}</th>
                {selected.map((item) => <th key={item.id}>{item.name}</th>)}
                <th>{t('compare.diff')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t('compare.currentElo')}</td>
                {selected.map((item) => <td key={`${item.id}-elo`}>{item.elo}</td>)}
                <td>{signed(diff(left.eloNum, right.eloNum))}</td>
              </tr>
              <tr>
                <td>{t('compare.peakElo')}</td>
                {selected.map((item) => <td key={`${item.id}-peak`}>{item.peakElo}</td>)}
                <td>{signed(diff(left.peakEloNum, right.peakEloNum))}</td>
              </tr>
              <tr>
                <td>{t('compare.careerPoints')}</td>
                {selected.map((item) => <td key={`${item.id}-career`}>{item.career}</td>)}
                <td>{signed(diff(left.careerNum, right.careerNum))}</td>
              </tr>
            </tbody>
          </table>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>{t('compare.careerElo')}</h2>
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

        <article className="panel">
          <div className="panel-head">
            <h2>{t('compare.perfTitle')}</h2>
          </div>
          {[
            [t('compare.goals'), 'goals'],
            [t('compare.assists'), 'assists'],
            [t('compare.matches'), 'matches']
          ].map(([label, key]) => (
            <div className="bar-row" key={key}>
              <strong>{left[key]}</strong>
              <div className="bar left" style={{ width: `${Math.min(100, left[key] * 3)}%` }} />
              <span>{label}</span>
              <div className="bar right" style={{ width: `${Math.min(100, right[key] * 3)}%` }} />
              <strong>{right[key]}</strong>
            </div>
          ))}
        </article>

        <div className="compare-foot">
          <p>{t('compare.foot')}</p>
          <div>
            <Link className="btn btn-ghost btn-explore" to="/ratings">{t('compare.change')}</Link>
            <button type="button" className="btn btn-lime btn-explore">{t('compare.save')}</button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
