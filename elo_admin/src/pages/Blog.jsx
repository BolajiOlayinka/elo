import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconEye, IconPencil, IconSearch, IconTrash } from '../components/Icons.jsx';
import { loadPosts, removePost, resetPosts } from '../data/posts.js';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' }
];

export default function Blog() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [posts, setPosts] = useState(loadPosts);
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return posts.filter((post) => {
      if (status !== 'all' && post.status !== status) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return `${post.title} ${post.excerpt} ${post.author} ${(post.tags || []).join(' ')} ${(post.categories || []).join(' ')}`
        .toLowerCase()
        .includes(needle);
    });
  }, [posts, query, status]);

  function destroy(id) {
    if (!window.confirm('Delete this post?')) {
      return;
    }

    removePost(id);
    setPosts(loadPosts());
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Posts</h1>
          <p>Open a post to read the public preview. Edit stays on its own page.</p>
        </div>
        <div className="page-head-actions">
          <label className="search">
            <IconSearch />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, author, tag"
            />
          </label>
          <Link className="btn lime" to="/blog/new">New post</Link>
        </div>
      </div>

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

      <article className="panel">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Author</th>
                <th>Categories</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link className="name-cell post-link" to={`/blog/${post.id}`}>
                      {post.thumbnail ? (
                        <img src={post.thumbnail} alt="" className="thumb" />
                      ) : (
                        <span className="thumb is-empty" />
                      )}
                      <div>
                        <strong>{post.title || 'Untitled'}</strong>
                        <p className="muted">{post.excerpt || post.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td>{post.author}</td>
                  <td>{(post.categories || []).join(', ') || '—'}</td>
                  <td>{(post.tags || []).join(', ') || '—'}</td>
                  <td>
                    <span className={post.status === 'published' ? 'tag ok' : 'tag'}>
                      {post.status}
                    </span>
                  </td>
                  <td>{post.updatedAt}</td>
                  <td>
                    <div className="row-actions">
                      <Link className="icon-btn" to={`/blog/${post.id}`} title="View" aria-label={`View ${post.title || 'post'}`}>
                        <IconEye />
                      </Link>
                      <Link className="icon-btn" to={`/blog/${post.id}/edit`} title="Edit" aria-label={`Edit ${post.title || 'post'}`}>
                        <IconPencil />
                      </Link>
                      <button
                        type="button"
                        className="icon-btn danger"
                        title="Delete"
                        aria-label={`Delete ${post.title || 'post'}`}
                        onClick={() => destroy(post.id)}
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

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={() => setPosts(resetPosts())}>Reset demo posts</button>
      </div>
    </section>
  );
}
