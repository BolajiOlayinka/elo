import { useState } from 'react';
import {
  loadCategories,
  loadPosts,
  loadTags,
  saveCategories,
  saveTags,
  slugify
} from '../data/posts.js';

export default function BlogTaxonomy({ type }) {
  const isCategory = type === 'categories';
  const [rows, setRows] = useState(() => (isCategory ? loadCategories() : loadTags()));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');
  const posts = loadPosts();
  const title = isCategory ? 'Categories' : 'Tags';

  function persist(next) {
    setRows(next);
    if (isCategory) {
      saveCategories(next);
    } else {
      saveTags(next);
    }
  }

  function add(event) {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    persist([
      ...rows,
      {
        id: `${isCategory ? 'cat' : 'tag'}-${Date.now()}`,
        name: trimmed,
        slug: slugify(trimmed),
        description: isCategory ? description.trim() : undefined
      }
    ]);
    setName('');
    setDescription('');
    setNotice(`${trimmed} added.`);
  }

  function remove(id) {
    persist(rows.filter((row) => row.id !== id));
    setNotice('Removed.');
  }

  function usage(row) {
    const key = isCategory ? 'categories' : 'tags';

    return posts.filter((post) => (post[key] || []).includes(row.name)).length;
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p>
            {isCategory
              ? 'Assign a post to one or more categories from the editor.'
              : 'Free-form labels you can tick on each post.'}
          </p>
        </div>
      </div>

      <form className="panel blog-tax-form" onSubmit={add}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={isCategory ? 'Methodology' : 'keepers'} />
        </label>
        {isCategory ? (
          <label>
            Description
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="How the rating engine works." />
          </label>
        ) : null}
        <button type="submit" className="btn lime">Add {isCategory ? 'category' : 'tag'}</button>
      </form>
      {notice ? <p className="notice">{notice}</p> : null}

      <article className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              {isCategory ? <th>Description</th> : null}
              <th>Posts</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td className="muted">{row.slug}</td>
                {isCategory ? <td>{row.description || '—'}</td> : null}
                <td>{usage(row)}</td>
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
