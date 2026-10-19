import { useEffect, useState } from 'react';
import {
  createAnalysisTag,
  deleteAnalysisTag,
  loadAnalysisTags,
  loadEssays
} from '../data/analysis.js';
import { slugify } from '../data/posts.js';

export default function AnalysisTags() {
  const [rows, setRows] = useState([]);
  const [posts, setPosts] = useState([]);
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    const [tags, essays] = await Promise.all([loadAnalysisTags(), loadEssays()]);
    setRows(tags);
    setPosts(essays);
  }

  useEffect(() => {
    refresh().catch((err) => setNotice(err.message));
  }, []);

  async function add(event) {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    try {
      await createAnalysisTag({ name: trimmed, slug: slugify(trimmed) });
      setName('');
      await refresh();
      setNotice(`${trimmed} added. Tick it on a post from the editor.`);
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function remove(id) {
    try {
      await deleteAnalysisTag(id);
      await refresh();
      setNotice('Removed.');
    } catch (err) {
      setNotice(err.message);
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Tags</h1>
          <p>Free-form labels you can tick on each analysis post.</p>
        </div>
      </div>

      <form className="panel blog-tax-form" onSubmit={add}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="keepers" />
        </label>
        <button type="submit" className="btn lime">Add tag</button>
      </form>
      {notice ? <p className="notice">{notice}</p> : null}

      <article className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Posts</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td className="muted">{row.slug}</td>
                <td>{posts.filter((post) => (post.tags || []).includes(row.slug) || (post.tags || []).includes(row.name)).length}</td>
                <td>
                  <button type="button" className="btn ghost" onClick={() => remove(row.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="empty">None yet.</p> : null}
      </article>
    </section>
  );
}
