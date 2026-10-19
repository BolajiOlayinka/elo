import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { debateCounts, loadDebate, removeDebate, setDebateStatus } from '../data/debate.js';

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'spam', label: 'Spam' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' }
];

export default function AnalysisDebate() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const counts = debateCounts(rows);
  const visible = useMemo(
    () => rows.filter((row) => status === 'all' || row.status === status),
    [rows, status]
  );

  useEffect(() => {
    loadDebate().then(setRows).catch((err) => setError(err.message));
  }, []);

  async function apply(id, next) {
    try {
      setRows(await setDebateStatus(id, next));
    } catch (err) {
      setError(err.message);
    }
  }

  async function destroy(id) {
    if (!window.confirm('Delete this argument? Replies attached to it will go too.')) {
      return;
    }

    try {
      setRows(await removeDebate(id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Comments</h1>
          <p>Stance, votes, nested replies, and optional match clips from the public post. Pending stays off the live thread.</p>
        </div>
        <span className="pill">{counts.pending} in the queue</span>
      </div>

      {error ? <p className="login-error">{error}</p> : null}

      <div className="sheet-tabs" role="tablist" aria-label="Comment status">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={status === item.id}
            className={status === item.id ? 'is-active' : ''}
            onClick={() => setStatus(item.id)}
          >
            {item.label}
            <em>{counts[item.id] ?? counts.all}</em>
          </button>
        ))}
      </div>

      <div className="comment-list">
        {visible.map((row) => (
          <article key={row.id} className={`panel comment-card is-${row.status} debate-card is-${row.stance}`}>
            <header>
              <div>
                <strong>{row.name}</strong>
                <span>{row.email}{row.parentId ? ' · reply' : ''}</span>
              </div>
              <span className={row.status === 'approved' ? 'tag ok' : 'tag'}>{row.status}</span>
            </header>
            <p className="debate-stance">
              <span className={`tag ${row.stance === 'support' ? 'ok' : ''}`}>{row.stance}</span>
              <span>{row.upvotes} up · {row.downvotes} down</span>
            </p>
            <p>{row.text}</p>
            {row.match ? (
              <p className="muted">Clip · {row.match.label} · {row.match.clock}</p>
            ) : null}
            <footer>
              <Link to={`/analysis/${row.essayId}`}>{row.essayTitle}</Link>
              <time>{row.when || row.createdAt}</time>
            </footer>
            <div className="row-actions">
              {row.status !== 'approved' ? (
                <button type="button" className="btn lime" onClick={() => apply(row.id, 'approved')}>Approve</button>
              ) : null}
              {row.status !== 'rejected' ? (
                <button type="button" className="btn ghost" onClick={() => apply(row.id, 'rejected')}>Reject</button>
              ) : null}
              {row.status !== 'spam' ? (
                <button type="button" className="btn ghost" onClick={() => apply(row.id, 'spam')}>Spam</button>
              ) : null}
              {row.userId ? <Link className="btn ghost" to={`/users/${row.userId}`}>Profile</Link> : null}
              <button type="button" className="btn ghost" onClick={() => destroy(row.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>

      {visible.length === 0 ? <p className="empty">Nothing in this queue.</p> : null}
    </section>
  );
}
