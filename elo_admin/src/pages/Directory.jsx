import { useEffect, useState } from 'react';
import { getCompetitions, getCoaches, getLeagues, getRatings } from '../data/api.js';

const TABS = [
  { id: 'players', label: 'Player ratings', source: 'ratings' },
  { id: 'keepers', label: 'Keeper ratings', source: 'ratings' },
  { id: 'coaches', label: 'Coach ratings', source: 'ratings' },
  { id: 'leagues', label: 'Leagues', source: 'leagues' },
  { id: 'countries', label: 'Countries', source: 'ratings' },
  { id: 'competitions', label: 'Competitions', source: 'competitions' },
  { id: 'coach-list', label: 'All coaches', source: 'coaches' }
];

export default function Directory() {
  const [tab, setTab] = useState('players');
  const [page, setPage] = useState(1);
  const [body, setBody] = useState(null);
  const [status, setStatus] = useState('loading');
  const current = TABS.find((item) => item.id === tab);

  useEffect(() => {
    let cancel = false;

    setStatus('loading');
    const request = current.source === 'leagues'
      ? getLeagues(page)
      : current.source === 'competitions'
        ? getCompetitions(page)
        : current.source === 'coaches'
          ? getCoaches(page)
          : getRatings(tab, page);

    request
      .then((payload) => {
        if (!cancel) {
          setBody(payload);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancel) {
          setStatus('error');
        }
      });

    return () => {
      cancel = true;
    };
  }, [tab, page, current.source]);

  const rows = body?.data || [];

  return (
    <section>
      <header className="page-head">
        <h1>Ratings directory</h1>
        <p className="muted">
          Live boards from the rating engine.
          {body?.meta?.builtAt ? ` Built ${body.meta.builtAt}.` : ''}
          {body?.meta?.matches != null ? ` ${body.meta.matches} matches.` : ''}
        </p>
      </header>
      <div className="row-actions">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'btn' : 'btn btn-ghost'}
            onClick={() => {
              setTab(item.id);
              setPage(1);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {status === 'loading' ? <p>Loading…</p> : null}
      {status === 'error' ? <p>Could not reach the API.</p> : null}
      {status === 'ready' ? (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Detail</th>
                <th>Elo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.rank ?? '—'}</td>
                  <td>{row.name}</td>
                  <td>{row.club || row.country || row.place || row.kind || row.role || '—'}</td>
                  <td>{row.elo ?? row.eloNum ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row-actions">
            <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>{page} / {body?.meta?.pages || 1}</span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page >= (body?.meta?.pages || 1)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
