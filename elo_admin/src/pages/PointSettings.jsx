import { useState } from 'react';
import {
  COACH_HONOURS_GROUPS,
  COACH_PERFORMANCE_GROUPS,
  DEFAULT_POINT_CONFIG,
  ENGINE_FIELDS,
  KEEPER_HONOURS_GROUPS,
  KEEPER_PERFORMANCE_GROUPS,
  PLAYER_HONOURS_GROUPS,
  PLAYER_PERFORMANCE_GROUPS,
  PLAYER_POSITIONS,
  POINT_TABS,
  SHEET_TABS
} from '../data/demo.js';
import { previewForTab } from '../engine/scorePreview.js';

const STORAGE_KEY = 'elo-admin-point-config-v3';

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? JSON.parse(raw) : structuredClone(DEFAULT_POINT_CONFIG);
  } catch {
    return structuredClone(DEFAULT_POINT_CONFIG);
  }
}

function setNumber(raw) {
  const next = Number(raw);

  return Number.isFinite(next) ? next : 0;
}

function fmt(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

function WeightInput({ minus, value, onChange, label, step = '0.5' }) {
  return (
    <label className={minus ? 'weight-field is-minus' : 'weight-field'}>
      <span>{label}</span>
      <span className="weight-input">
        {minus ? <em aria-hidden="true">−</em> : null}
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
}

function MetricGroups({ groups, values, onChange }) {
  return groups.map((group) => (
    <fieldset key={group.id} className="metric-group">
      <legend>{group.title}</legend>
      <div className="metric-grid">
        {group.metrics.map((metric) => (
          <div key={metric.id}>
            <WeightInput
              minus={metric.sign === 'minus'}
              label={metric.label}
              value={values[metric.id] ?? 0}
              onChange={(next) => onChange(metric.id, next)}
            />
            {metric.hint ? <p className="muted">{metric.hint}</p> : null}
          </div>
        ))}
      </div>
    </fieldset>
  ));
}

function SheetTabs({ sheet, onChange }) {
  return (
    <div className="sheet-tabs" role="tablist" aria-label="Layer">
      {SHEET_TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={sheet === item.id}
          className={sheet === item.id ? 'is-active' : ''}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ObjectivityPreview({ tab, config }) {
  const rows = previewForTab(tab, config);

  if (tab === 'clubs') {
    return (
      <article className="panel">
        <h2>Club Elo from results</h2>
        <p className="muted">
          NPFL first division is not automatically stronger than the Championship. League
          strength is the mean club Elo after results. Bridges are FA Cup / EFL Cup /
          promotion (Championship ↔ Premier League) and continental ties (NPFL ↔ Europe).
          A player’s goal is scaled by the opponent they actually faced, not by “1st” or “2nd”.
        </p>
        <h3 className="preview-sub">Derived league strength</h3>
        <div className="table-scroll">
          <table className="table compact">
            <thead>
              <tr>
                <th>League</th>
                <th>Mean club Elo</th>
              </tr>
            </thead>
            <tbody>
              {rows.leagues.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{Math.round(row.elo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="preview-sub">Clubs</h3>
        <div className="table-scroll">
          <table className="table compact">
            <thead>
              <tr>
                <th>Club</th>
                <th>Division label</th>
                <th>Elo</th>
              </tr>
            </thead>
            <tbody>
              {rows.clubs.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.league}</td>
                  <td>{Math.round(row.elo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    );
  }

  return (
    <article className="panel">
      <h2>Does this rank more objectively?</h2>
      <p className="muted">
        Live demo seasons. Counting is the old model (goals, pass volume, saves, full trophies).
        Performance is per 90 × opponent Elo. Honours stay on their own column and are not added in.
        Change a weight above and this table moves.
      </p>
      <div className="table-scroll">
        <table className="table compact preview-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Counting</th>
              <th>Performance</th>
              <th>Honours</th>
              <th>Move</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .slice()
              .sort((a, b) => a.rateRank - b.rateRank)
              .map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <p className="muted">{row.role}</p>
                    <p className="muted">{row.note}</p>
                  </td>
                  <td>
                    {fmt(row.old)}
                    <p className="muted">#{row.oldRank}</p>
                  </td>
                  <td>
                    {fmt(row.rate)}
                    <p className="muted">#{row.rateRank} · season {fmt(row.seasonPoints)}</p>
                  </td>
                  <td>{fmt(row.honours)}</td>
                  <td>
                    <span className={row.delta > 0 ? 'rank-up' : row.delta < 0 ? 'rank-down' : 'muted'}>
                      {row.delta > 0 ? `↑ ${row.delta}` : row.delta < 0 ? `↓ ${Math.abs(row.delta)}` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default function PointSettings() {
  const [tab, setTab] = useState('players');
  const [sheet, setSheet] = useState('performance');
  const [config, setConfig] = useState(loadConfig);
  const [activePosition, setActivePosition] = useState(
    () => loadConfig().players.selected[0] || PLAYER_POSITIONS[0].id
  );
  const [notice, setNotice] = useState('');
  const selected = config.players.selected;
  const position = PLAYER_POSITIONS.find((item) => item.id === activePosition);

  function togglePosition(id) {
    setConfig((current) => {
      const has = current.players.selected.includes(id);
      const nextSelected = has
        ? current.players.selected.filter((item) => item !== id)
        : [...current.players.selected, id];
      const selectedIds = nextSelected.length ? nextSelected : [id];

      if (!has || id === activePosition) {
        setActivePosition(has ? selectedIds[0] : id);
      }

      return {
        ...current,
        players: { ...current.players, selected: selectedIds }
      };
    });
    setNotice('');
  }

  function updatePlayer(metricId, raw) {
    const bucket = sheet === 'honours' ? 'honours' : 'performance';

    setConfig((current) => {
      if (bucket === 'honours') {
        return {
          ...current,
          players: {
            ...current.players,
            honours: { ...current.players.honours, [metricId]: setNumber(raw) }
          }
        };
      }

      return {
        ...current,
        players: {
          ...current.players,
          performance: {
            ...current.players.performance,
            [activePosition]: {
              ...current.players.performance[activePosition],
              [metricId]: setNumber(raw)
            }
          }
        }
      };
    });
    setNotice('');
  }

  function updateNested(section, bucket, metricId, raw) {
    setConfig((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [bucket]: {
          ...current[section][bucket],
          [metricId]: setNumber(raw)
        }
      }
    }));
    setNotice('');
  }

  function updateEngine(field, raw) {
    setConfig((current) => ({
      ...current,
      engine: { ...current.engine, [field]: setNumber(raw) }
    }));
    setNotice('');
  }

  function save(event) {
    event.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setNotice('Saved locally. The ingest pipeline is not connected yet — this preview uses demo seasons.');
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setConfig(structuredClone(DEFAULT_POINT_CONFIG));
    setNotice('Restored demo defaults.');
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Point settings</h1>
          <p>
            Three layers. Clubs are rated from match results. People are rated per 90 against
            opponent Elo. Honours are a separate record — they do not feed the ranking.
          </p>
        </div>
      </div>

      <div className="layer-grid">
        <article>
          <span>1 · Quality</span>
          <strong>Club / nation Elo</strong>
          <p>Wins, draws, losses. Continental games connect leagues. This is how a NPFL goal and a Premier League goal become comparable.</p>
        </article>
        <article>
          <span>2 · Performance</span>
          <strong>Per 90 × opponent</strong>
          <p>Actions, not medals. Minutes are the denominator. Position weights apply only to minutes in that role.</p>
        </article>
        <article>
          <span>3 · Honours</span>
          <strong>Votes and trophies</strong>
          <p>Shown beside the ranking. Team medals are scaled by minutes share so a 12-minute substitute is not a starter.</p>
        </article>
      </div>

      <div className="point-tabs" role="tablist" aria-label="Entity">
        {POINT_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'is-active' : ''}
            onClick={() => {
              setTab(item.id);
              setSheet('performance');
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={save}>
        {tab === 'players' ? (
          <>
            <article className="panel">
              <h2>Positions they play</h2>
              <p className="muted">Tick every role this sheet covers. Performance weights below are for the selected highlight. Honours are shared across positions.</p>
              <ul className="pos-grid">
                {PLAYER_POSITIONS.map((item) => (
                  <li key={item.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => togglePosition(item.id)}
                      />
                      {item.label}
                    </label>
                  </li>
                ))}
              </ul>
              {selected.length && sheet === 'performance' ? (
                <div className="pos-pills" role="tablist" aria-label="Edit position">
                  {selected.map((id) => {
                    const item = PLAYER_POSITIONS.find((row) => row.id === id);

                    return (
                      <button
                        key={id}
                        type="button"
                        className={id === activePosition ? 'is-active' : ''}
                        onClick={() => setActivePosition(id)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </article>

            <article className="panel">
              <SheetTabs sheet={sheet} onChange={setSheet} />
              <h2>
                {sheet === 'honours'
                  ? 'Honours'
                  : `${position ? position.label : 'Player'} performance`}
              </h2>
              <MetricGroups
                groups={sheet === 'honours' ? PLAYER_HONOURS_GROUPS : PLAYER_PERFORMANCE_GROUPS}
                values={
                  sheet === 'honours'
                    ? config.players.honours
                    : config.players.performance[activePosition] || {}
                }
                onChange={updatePlayer}
              />
            </article>
          </>
        ) : null}

        {tab === 'keepers' ? (
          <article className="panel">
            <SheetTabs sheet={sheet} onChange={setSheet} />
            <h2>{sheet === 'honours' ? 'Honours' : 'Goalkeeper performance'}</h2>
            <MetricGroups
              groups={sheet === 'honours' ? KEEPER_HONOURS_GROUPS : KEEPER_PERFORMANCE_GROUPS}
              values={sheet === 'honours' ? config.keepers.honours : config.keepers.performance}
              onChange={(metricId, raw) => updateNested('keepers', sheet === 'honours' ? 'honours' : 'performance', metricId, raw)}
            />
          </article>
        ) : null}

        {tab === 'coaches' ? (
          <article className="panel">
            <SheetTabs sheet={sheet} onChange={setSheet} />
            <h2>{sheet === 'honours' ? 'Honours' : 'Coach performance'}</h2>
            <MetricGroups
              groups={sheet === 'honours' ? COACH_HONOURS_GROUPS : COACH_PERFORMANCE_GROUPS}
              values={sheet === 'honours' ? config.coaches.honours : config.coaches.performance}
              onChange={(metricId, raw) => updateNested('coaches', sheet === 'honours' ? 'honours' : 'performance', metricId, raw)}
            />
          </article>
        ) : null}

        {tab === 'clubs' ? (
          <article className="panel">
            <h2>Results Elo</h2>
            <p className="muted">
              No division multipliers. A Championship season is not ×3 and NPFL is not ×6.
              After results, mean club Elo is the league strength. Players inherit that
              through the opponents they faced (and through cups, promotion, and continental
              games that connect the graph). National teams use the same engine.
            </p>
            <div className="metric-grid">
              {ENGINE_FIELDS.map((field) => (
                <div key={field.id}>
                  <WeightInput
                    label={field.label}
                    value={config.engine[field.id]}
                    step={field.id === 'eraReferenceGpg' ? '0.05' : '1'}
                    onChange={(raw) => updateEngine(field.id, raw)}
                  />
                  <p className="muted">{field.hint}</p>
                </div>
              ))}
            </div>
            <label className="engine-check">
              <input
                type="checkbox"
                checked={Boolean(config.engine.minutesShareHonours)}
                onChange={(event) => setConfig((current) => ({
                  ...current,
                  engine: { ...current.engine, minutesShareHonours: event.target.checked }
                }))}
              />
              Weight team honours by minutes share
            </label>
          </article>
        ) : null}

        <ObjectivityPreview tab={tab} config={config} />

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={reset}>Reset demo defaults</button>
          <button type="submit" className="btn lime">Save weights</button>
        </div>
        {notice ? <p className="notice">{notice}</p> : null}
      </form>
    </section>
  );
}
