import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ImageField } from '../components/ImageField.jsx';
import { MilkdownEditor } from '../components/MilkdownEditor.jsx';
import {
  AUTHORS,
  emptyPost,
  getPost,
  loadCategories,
  loadTags,
  readFileAsDataUrl,
  removePost,
  slugify,
  upsertPost
} from '../data/posts.js';

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const markdownRef = useRef(null);
  const isNew = id === 'new' || id == null;
  const existing = isNew ? null : getPost(id);
  const [post, setPost] = useState(() => existing || emptyPost());
  const [notice, setNotice] = useState('');
  const [view, setView] = useState('markdown');
  const [visualKey, setVisualKey] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const categories = loadCategories();
  const tags = loadTags();

  if (!isNew && !existing) {
    return (
      <section>
        <h1>Post not found</h1>
        <p className="muted">This demo post is not in local storage.</p>
        <Link className="btn ghost" to="/blog">Back to posts</Link>
      </section>
    );
  }

  function patch(partial) {
    setPost((current) => ({ ...current, ...partial }));
    setNotice('');
  }

  function toggleList(key, value) {
    const current = post[key] || [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    patch({ [key]: next });
  }

  function currentBody() {
    if (view === 'visual') {
      return editorRef.current?.getMarkdown() || post.body;
    }

    return post.body;
  }

  function persist(status) {
    const body = currentBody();
    const title = post.title.trim() || 'Untitled';
    const saved = upsertPost({
      ...post,
      title,
      slug: post.slug.trim() || slugify(title),
      body,
      status
    });

    setPost(saved);
    setNotice(status === 'published' ? 'Published locally (demo).' : 'Draft saved locally.');

    if (isNew) {
      navigate(`/blog/${saved.id}/edit`, { replace: true });
    }
  }

  function onTitle(value) {
    patch({
      title: value,
      slug: isNew || !post.slug ? slugify(value) : post.slug
    });
  }

  function setEditorView(next) {
    if (next === view) {
      return;
    }

    if (view === 'visual' && next === 'markdown') {
      patch({ body: editorRef.current?.getMarkdown() || post.body });
    }

    if (next === 'visual') {
      setVisualKey((value) => value + 1);
    }

    setView(next);
  }

  function insertMarkdown(snippet) {
    const field = markdownRef.current;
    const body = view === 'visual' ? currentBody() : post.body;

    if (view === 'markdown' && field) {
      const start = field.selectionStart ?? body.length;
      const end = field.selectionEnd ?? start;
      const next = `${body.slice(0, start)}${snippet}${body.slice(end)}`;
      patch({ body: next });
      requestAnimationFrame(() => {
        field.focus();
        const caret = start + snippet.length;
        field.setSelectionRange(caret, caret);
      });

      return;
    }

    patch({ body: `${body.trim()}\n\n${snippet}\n` });
    setVisualKey((value) => value + 1);
  }

  async function insertFile(event) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    const src = await readFileAsDataUrl(file);
    insertMarkdown(`![${file.name}](${src})`);
  }

  function insertFromUrl() {
    const src = imageUrl.trim();

    if (!src) {
      return;
    }

    insertMarkdown(`![Image](${src})`);
    setImageUrl('');
  }

  function destroy() {
    if (!window.confirm('Delete this post?')) {
      return;
    }

    if (!isNew) {
      removePost(post.id);
    }

    navigate('/blog');
  }

  return (
    <section>
      <p className="back"><Link to="/blog">Posts</Link> / {isNew ? 'New' : 'Edit'}</p>
      <div className="page-head">
        <div>
          <h1>{isNew ? 'New post' : 'Edit post'}</h1>
          <p>Slug and excerpt sit under the title. Tags, categories, author and status stay to the right.</p>
        </div>
        {!isNew ? <Link className="btn ghost" to={`/blog/${post.id}`}>Preview</Link> : null}
      </div>

      <form
        className="blog-editor"
        onSubmit={(event) => {
          event.preventDefault();
          persist(post.status === 'published' ? 'published' : 'draft');
        }}
      >
        <article className="panel">
          <div className="blog-fields">
            <label className="field-title">
              Title
              <input
                value={post.title}
                onChange={(event) => onTitle(event.target.value)}
                placeholder="League strength is not a division label"
              />
            </label>
            <label className="field-slug">
              Slug
              <input
                value={post.slug}
                onChange={(event) => patch({ slug: slugify(event.target.value) })}
              />
            </label>
            <label className="field-excerpt">
              Excerpt
              <input
                value={post.excerpt}
                onChange={(event) => patch({ excerpt: event.target.value })}
                placeholder="One line for the index."
              />
            </label>
            <div className="field-tags">
              <span className="field-label">Tags</span>
              <div className="chip-picks">
                {tags.map((tag) => (
                  <label key={tag.id} className={(post.tags || []).includes(tag.name) ? 'is-on' : ''}>
                    <input
                      type="checkbox"
                      checked={(post.tags || []).includes(tag.name)}
                      onChange={() => toggleList('tags', tag.name)}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
              {!tags.length ? <p className="muted">Add tags under Blog → Tags.</p> : null}
            </div>
            <div className="field-categories">
              <span className="field-label">Categories</span>
              <div className="chip-picks">
                {categories.map((category) => (
                  <label key={category.id} className={(post.categories || []).includes(category.name) ? 'is-on' : ''}>
                    <input
                      type="checkbox"
                      checked={(post.categories || []).includes(category.name)}
                      onChange={() => toggleList('categories', category.name)}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
              {!categories.length ? <p className="muted">Add categories under Blog → Categories.</p> : null}
            </div>
            <div className="blog-field-stack field-meta">
              <label>
                Author
                <select value={post.author} onChange={(event) => patch({ author: event.target.value })}>
                  {AUTHORS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select value={post.status} onChange={(event) => patch({ status: event.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="blog-images">
            <ImageField
              label="Heading image"
              hint="Wide image at the top of the public post."
              value={post.headingImage}
              onChange={(headingImage) => patch({ headingImage })}
            />
            <ImageField
              label="Thumbnail"
              hint="Square-ish image for the post list and cards."
              value={post.thumbnail}
              onChange={(thumbnail) => patch({ thumbnail })}
            />
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Body</h2>
            <div className="sheet-tabs" role="tablist" aria-label="Body editor">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'markdown'}
                className={view === 'markdown' ? 'is-active' : ''}
                onClick={() => setEditorView('markdown')}
              >
                Markdown
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'visual'}
                className={view === 'visual' ? 'is-active' : ''}
                onClick={() => setEditorView('visual')}
              >
                Visual
              </button>
            </div>
          </div>
          <div className="body-image-bar">
            <label className="btn ghost file-btn">
              Insert image
              <input type="file" accept="image/*" hidden onChange={insertFile} />
            </label>
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="Or paste an image URL"
            />
            <button type="button" className="btn ghost" onClick={insertFromUrl}>Insert URL</button>
          </div>
          {view === 'markdown' ? (
            <textarea
              ref={markdownRef}
              className="markdown-source"
              value={post.body}
              onChange={(event) => patch({ body: event.target.value })}
              spellCheck="true"
              aria-label="Markdown source"
            />
          ) : (
            <MilkdownEditor key={`${post.id}-${visualKey}`} ref={editorRef} defaultValue={post.body} />
          )}
        </article>

        <div className="form-actions">
          {!isNew ? (
            <button type="button" className="btn ghost" onClick={destroy}>Delete</button>
          ) : null}
          <button type="button" className="btn ghost" onClick={() => persist('draft')}>Save draft</button>
          <button type="button" className="btn lime" onClick={() => persist('published')}>Publish</button>
        </div>
        {notice ? <p className="notice">{notice}</p> : null}
      </form>
    </section>
  );
}
