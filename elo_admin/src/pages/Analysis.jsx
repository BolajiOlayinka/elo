import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconEye, IconPencil, IconSearch, IconTrash } from '../components/Icons.jsx';
import { loadAnalysisCategories, loadEssays, removeEssay } from '../data/analysis.js';
import { mediaUrl } from '../data/uploads.js';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' }
];

export default function Analysis() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [essays, setEssays] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return essays.filter((essay) => {
      if (status !== 'all' && essay.status !== status) {
        return false;
      }

      if (category !== 'all' && essay.category !== category && essay.categoryId !== category) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return `${essay.title} ${essay.cardTitle} ${essay.excerpt} ${essay.author?.name} ${essay.slug} ${(essay.tags || []).join(' ')}`
        .toLowerCase()
        .includes(needle);
    });
  }, [essays, query, status, category]);

  useEffect(() => {
    Promise.all([loadEssays(), loadAnalysisCategories()])
      .then(([posts, desks]) => {
        setEssays(posts);
        setCategories(desks);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function destroy(id) {
    if (!window.confirm('Delete this post and its comments?')) {
      return;
    }

    try {
      await removeEssay(id);
      setEssays((current) => current.filter((row) => row.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Posts</h1>
          <p>What the public Analysis page renders: card title, headline, comparison metrics, Markdown body, and comments.</p>
        </div>
        <div className="page-head-actions">
          <label className="search">
            <IconSearch />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, author, tag, slug"
            />
          </label>
          <Link className="btn ghost" to="/analysis/new?ai=1">Create with AI</Link>
          <Link className="btn lime" to="/analysis/new">New post</Link>
        </div>
      </div>

      {error ? <p className="login-error">{error}</p> : null}

      <div className="sheet-tabs" role="tablist" aria-label="Status">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={status === item.id}
            className={status === item.id ? 'is-active' : ''}
            onClick={() => setStatus(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="sheet-tabs analysis-cat-tabs" role="tablist" aria-label="Category">
        <button
          type="button"
          role="tab"
          aria-selected={category === 'all'}
          className={category === 'all' ? 'is-active' : ''}
          onClick={() => setCategory('all')}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={category === item.id}
            className={category === item.id ? 'is-active' : ''}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <article className="panel">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Category</th>
                <th>Tags</th>
                <th>Author</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((essay) => (
                <tr key={essay.id}>
                  <td>
                    <Link className="name-cell post-link" to={`/analysis/${essay.id}`}>
                      {mediaUrl(essay.thumbnail) ? (
                        <img src={mediaUrl(essay.thumbnail)} alt="" className="thumb" />
                      ) : (
                        <span className="thumb is-empty" />
                      )}
                      <div>
                        <strong>{essay.cardTitle || essay.title || 'Untitled'}</strong>
                        <p className="muted">{essay.excerpt || essay.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td>{essay.categoryLabel}</td>
                  <td>{(essay.tags || []).join(', ') || '—'}</td>
                  <td>{essay.author?.name}</td>
                  <td>
                    <span className={essay.status === 'published' ? 'tag ok' : 'tag'}>
                      {essay.status}
                    </span>
                  </td>
                  <td>{essay.updatedAt ? new Date(essay.updatedAt).toLocaleString() : '—'}</td>
                  <td>
                    <div className="row-actions">
                      <Link className="icon-btn" to={`/analysis/${essay.id}`} title="Preview" aria-label={`Preview ${essay.cardTitle || 'essay'}`}>
                        <IconEye />
                      </Link>
                      <Link className="icon-btn" to={`/analysis/${essay.id}/edit`} title="Edit" aria-label={`Edit ${essay.cardTitle || 'essay'}`}>
                        <IconPencil />
                      </Link>
                      <button
                        type="button"
                        className="icon-btn danger"
                        title="Delete"
                        aria-label={`Delete ${essay.cardTitle || 'essay'}`}
                        onClick={() => destroy(essay.id)}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p className="empty">No posts match that filter.</p> : null}
      </article>
    </section>
  );
}
