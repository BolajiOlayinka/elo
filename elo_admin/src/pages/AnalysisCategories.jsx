import { useEffect, useState } from 'react';
import {
  createAnalysisCategory,
  deleteAnalysisCategory,
  loadAnalysisCategories,
  loadEssays,
  updateAnalysisCategory
} from '../data/analysis.js';
import { slugify } from '../data/posts.js';

export default function AnalysisCategories() {
  const [rows, setRows] = useState([]);
  const [essays, setEssays] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    const [categories, posts] = await Promise.all([loadAnalysisCategories(), loadEssays()]);
    setRows(categories);
    setEssays(posts);
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
      await createAnalysisCategory({
        label: trimmed,
        slug: slugify(trimmed),
        description: description.trim()
      });
      setName('');
      setDescription('');
      await refresh();
      setNotice(`${trimmed} added. It is now a tab on the public Analysis page.`);
    } catch (err) {
      setNotice(err.message);
    }
  }

  function patchLocal(id, partial) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...partial } : row)));
  }

  async function commit(id, partial) {
    try {
      await updateAnalysisCategory(id, partial);
      await refresh();
      setNotice('Saved. The public /analysis tabs read this list.');
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function remove(id) {
    const used = essays.filter((essay) => essay.categoryId === id || essay.category === id).length;

    if (used && !window.confirm(`${used} post${used === 1 ? '' : 's'} still use this category. Delete it anyway?`)) {
      return;
    }

    try {
      await deleteAnalysisCategory(id);
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
          <h1>Analysis categories</h1>
          <p>These are the public tabs on /analysis. Add, rename, or delete any of them — nothing is hardcoded.</p>
        </div>
      </div>

      <form className="panel blog-tax-form" onSubmit={add}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Derbies" />
        </label>
        <label>
          Description
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Shown in the editor and on the public tabs." />
        </label>
        <button type="submit" className="btn lime">Add category</button>
      </form>
      {notice ? <p className="notice">{notice}</p> : null}

      <article className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Posts</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    value={row.label}
                    onChange={(event) => patchLocal(row.id, { label: event.target.value })}
                    onBlur={(event) => commit(row.id, { label: event.target.value, description: row.description })}
                  />
                </td>
                <td className="muted">{row.slug}</td>
                <td>
                  <input
                    value={row.description || ''}
                    onChange={(event) => patchLocal(row.id, { description: event.target.value })}
                    onBlur={(event) => commit(row.id, { label: row.label, description: event.target.value })}
                  />
                </td>
                <td>{essays.filter((essay) => essay.categoryId === row.id || essay.category === row.slug).length}</td>
                <td>
                  <button type="button" className="btn ghost" onClick={() => remove(row.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="empty">No categories yet. Add the desks the public page should show.</p> : null}
      </article>
    </section>
  );
}
