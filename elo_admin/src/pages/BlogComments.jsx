import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { commentCounts, loadComments, removeComment, resetComments, setCommentStatus } from '../data/comments.js';

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'spam', label: 'Spam' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' }
];

export default function BlogComments() {
  const [rows, setRows] = useState(loadComments);
  const [status, setStatus] = useState('pending');
  const counts = commentCounts(rows);
  const visible = useMemo(
    () => rows.filter((row) => status === 'all' || row.status === status),
    [rows, status]
  );

  function apply(id, next) {
    setRows(setCommentStatus(id, next));
  }

  function destroy(id) {
    if (!window.confirm('Delete this comment?')) {
      return;
    }

    setRows(removeComment(id));
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Comments</h1>
          <p>Moderate Analysis and blog replies from the public site. Pending items wait here before they go live.</p>
        </div>
        <span className="pill">{counts.pending} in the queue</span>
      </div>

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
          <article key={row.id} className={`panel comment-card is-${row.status}`}>
            <header>
              <div>
                <strong>{row.author}</strong>
                <span>{row.email}</span>
              </div>
              <span className={row.status === 'approved' ? 'tag ok' : 'tag'}>{row.status}</span>
            </header>
            <p>{row.body}</p>
            <footer>
              <Link to={`/blog/${row.postId}`}>{row.postTitle}</Link>
              <time>{row.createdAt}</time>
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

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={() => setRows(resetComments())}>Reset demo comments</button>
      </div>
    </section>
  );
}
