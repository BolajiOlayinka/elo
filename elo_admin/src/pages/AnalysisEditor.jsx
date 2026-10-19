import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EssayAiChat } from '../components/EssayAiChat.jsx';
import { MediaField } from '../components/MediaField.jsx';
import { MilkdownEditor } from '../components/MilkdownEditor.jsx';
import {
  LOCALES,
  analysisAuthors,
  bodyToMarkdown,
  emptyEssay,
  emptyMetric,
  getEssay,
  loadAnalysisCategories,
  loadAnalysisTags,
  removeEssay,
  upsertEssay
} from '../data/analysis.js';
import { slugify as toSlug } from '../data/posts.js';
import { mockUploadFile } from '../data/uploads.js';

function emptyLocale() {
  return { title: '', cardTitle: '', excerpt: '', body: '' };
}

export default function AnalysisEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNew = id === 'new' || id == null;
  const [essay, setEssay] = useState(() => emptyEssay());
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [notice, setNotice] = useState('');
  const [locale, setLocale] = useState('en');
  const [aiOpen, setAiOpen] = useState(() => searchParams.get('ai') === '1');
  const [view, setView] = useState('markdown');
  const [visualKey, setVisualKey] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const editorRef = useRef(null);
  const markdownRef = useRef(null);
  const authors = analysisAuthors();

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      loadAnalysisCategories(),
      loadAnalysisTags(),
      isNew ? Promise.resolve(null) : getEssay(id)
    ])
      .then(([desks, nextTags, post]) => {
        if (cancelled) {
          return;
        }

        setCategories(desks);
        setTags(nextTags);

        if (isNew) {
          setEssay(emptyEssay(desks));
        } else if (!post) {
          setMissing(true);
        } else {
          setEssay(post);
        }

        setReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setNotice(err.message);
          setMissing(!isNew);
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  if (!ready) {
    return (
      <section>
        <h1>{isNew ? 'New post' : 'Edit post'}</h1>
        <p className="muted">Loading…</p>
      </section>
    );
  }

  if (!isNew && missing) {
    return (
      <section>
        <h1>Post not found</h1>
        <p className="muted">This analysis post is not on the API.</p>
        <Link className="btn ghost" to="/analysis">Back to posts</Link>
      </section>
    );
  }

  const translation = essay.translations?.[locale] || emptyLocale();

  function patch(partial) {
    setEssay((current) => ({ ...current, ...partial }));
    setNotice('');
  }

  function toggleTag(name) {
    const current = essay.tags || [];
    const next = current.includes(name)
      ? current.filter((item) => item !== name)
      : [...current, name];

    patch({ tags: next });
  }

  function patchAuthor(name) {
    const next = authors.find((row) => row.name === name) || { name, role: 'Editor', initials: name.slice(0, 2).toUpperCase() };
    patch({ author: next });
  }

  function currentBody() {
    if (view === 'visual') {
      return editorRef.current?.getMarkdown() || essay.body;
    }

    return essay.body;
  }

  async function persist(status) {
    try {
      const saved = await upsertEssay({ ...essay, body: currentBody(), status });
      setEssay(saved);
      setNotice(status === 'published' ? 'Published. The public /analysis page reads this post from the API.' : 'Draft saved.');

      if (isNew || id !== saved.id) {
        navigate(`/analysis/${saved.id}/edit`, { replace: true });
      }
    } catch (err) {
      setNotice(err.message);
    }
  }

  function onCardTitle(value) {
    patch({
      cardTitle: value,
      slug: isNew || !essay.slug ? toSlug(value) : essay.slug
    });
  }

  function updateMetric(index, partial) {
    patch({
      metrics: essay.metrics.map((metric, current) => (current === index ? { ...metric, ...partial } : metric))
    });
  }

  function setEditorView(next) {
    if (next === view) {
      return;
    }

    if (view === 'visual' && next === 'markdown') {
      patch({ body: editorRef.current?.getMarkdown() || essay.body });
    }

    if (next === 'visual') {
      setVisualKey((value) => value + 1);
    }

    setView(next);
  }

  function insertMarkdown(snippet) {
    const field = markdownRef.current;
    const body = view === 'visual' ? currentBody() : essay.body;

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

    patch({ body: `${String(body || '').trim()}\n\n${snippet}\n` });
    setVisualKey((value) => value + 1);
  }

  async function insertFile(event) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    const uploaded = await mockUploadFile(file);
    insertMarkdown(`![${file.name}](${uploaded.file_url})`);
  }

  function insertFromUrl() {
    const src = imageUrl.trim();

    if (!src) {
      return;
    }

    insertMarkdown(`![Image](${src})`);
    setImageUrl('');
  }

  function patchTranslation(partial) {
    patch({
      translations: {
        ...essay.translations,
        [locale]: { ...emptyLocale(), ...translation, ...partial }
      }
    });
  }

  async function destroy() {
    if (!window.confirm('Delete this post and its comments?')) {
      return;
    }

    if (!isNew) {
      await removeEssay(essay.id);
    }

    navigate('/analysis');
  }

  function closeAi() {
    setAiOpen(false);

    if (searchParams.get('ai')) {
      const next = new URLSearchParams(searchParams);
      next.delete('ai');
      setSearchParams(next, { replace: true });
    }
  }

  function applyAiDraft(draft) {
    patch({
      cardTitle: draft.cardTitle || essay.cardTitle,
      title: draft.title || essay.title,
      excerpt: draft.excerpt || essay.excerpt,
      category: categories.find((row) => row.id === draft.category || row.slug === draft.category)?.slug || draft.category || essay.category,
      categoryId: categories.find((row) => row.id === draft.category || row.slug === draft.category)?.id || essay.categoryId,
      slug: essay.slug || toSlug(draft.cardTitle || draft.title),
      comparison: draft.comparison,
      metricNames: draft.metricNames || essay.metricNames,
      metrics: draft.metrics?.length ? draft.metrics : essay.metrics,
      body: bodyToMarkdown(draft.body || draft.sections),
      readMinutes: draft.readMinutes || essay.readMinutes
    });
    setView('markdown');
    setVisualKey((value) => value + 1);
    setNotice('AI draft applied to the Markdown body — same template as a blog post.');
    closeAi();
    requestAnimationFrame(() => {
      document.getElementById('essay-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <section>
      <p className="back"><Link to="/analysis">Posts</Link> / {isNew ? 'New' : 'Edit'}</p>
      <div className="page-head">
        <div>
          <h1>{isNew ? 'New post' : 'Edit post'}</h1>
          <p>Card title is the index. Headline is the article. Images store upload_id and file_url, not a raw Cloudinary id.</p>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn lime" onClick={() => setAiOpen(true)}>Create with AI</button>
          {!isNew ? <Link className="btn ghost" to={`/analysis/${essay.id}`}>Preview</Link> : null}
        </div>
      </div>

      <form
        className="analysis-editor"
        onSubmit={(event) => {
          event.preventDefault();
          persist(essay.status === 'published' ? 'published' : 'draft');
        }}
      >
        <article className="panel">
          <div className="analysis-identity">
            <label className="field-card">
              Card title
              <input
                value={essay.cardTitle}
                onChange={(event) => onCardTitle(event.target.value)}
                placeholder="Henry’s 2003–04 peak vs Salah’s 2017–18 scoring season"
              />
            </label>
            <label className="field-headline">
              Headline
              <input
                value={essay.title}
                onChange={(event) => patch({ title: event.target.value })}
                placeholder="The verdict the article page shows"
              />
            </label>
            <label>
              Slug
              <input
                value={essay.slug}
                onChange={(event) => patch({ slug: toSlug(event.target.value) })}
              />
            </label>
            <label className="field-excerpt">
              Excerpt
              <input
                value={essay.excerpt}
                onChange={(event) => patch({ excerpt: event.target.value })}
                placeholder="One line under the card title and the headline."
              />
            </label>
          </div>
          <div className="field-tags analysis-tags">
            <span className="field-label">Tags</span>
            <div className="chip-picks analysis-tag-picks">
              {tags.map((tag) => (
                <label key={tag.id} className={(essay.tags || []).includes(tag.name) ? 'is-on' : ''}>
                  <input
                    type="checkbox"
                    checked={(essay.tags || []).includes(tag.name)}
                    onChange={() => toggleTag(tag.name)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
            {!tags.length ? <p className="muted">Add tags under Analysis → Tags.</p> : null}
          </div>
          <div className="analysis-meta-grid">
            <label>
              Category
              <select
                value={essay.categoryId || essay.category}
                onChange={(event) => {
                  const next = categories.find((item) => item.id === event.target.value || item.slug === event.target.value);
                  patch({
                    category: next?.slug || event.target.value,
                    categoryId: next?.id || event.target.value,
                    categoryLabel: next?.label || essay.categoryLabel
                  });
                }}
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              Author
              <select value={essay.author?.name || ''} onChange={(event) => patchAuthor(event.target.value)}>
                {authors.map((row) => (
                  <option key={row.name} value={row.name}>{row.name}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select value={essay.status} onChange={(event) => patch({ status: event.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label>
              Read minutes
              <input
                type="number"
                min="1"
                value={essay.readMinutes}
                onChange={(event) => patch({ readMinutes: Number(event.target.value) || 1 })}
              />
            </label>
            <label>
              Clips / seasons
              <input
                type="number"
                min="0"
                value={essay.clips}
                onChange={(event) => patch({ clips: Number(event.target.value) || 0 })}
              />
            </label>
            <label>
              Published
              <input
                type="date"
                value={essay.publishedAt || ''}
                onChange={(event) => patch({ publishedAt: event.target.value || null })}
              />
            </label>
          </div>
        </article>

        <article className="panel">
          <div className="blog-images">
            <MediaField
              label="Thumbnail"
              hint="Index card image. Saved as upload_id + file_url."
              value={essay.thumbnail}
              onChange={(thumbnail) => patch({ thumbnail })}
            />
            <MediaField
              label="Hero"
              hint="Wide figure under the byline on the essay page."
              value={essay.hero}
              onChange={(hero) => patch({ hero })}
            />
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Comparison</h2>
            <label className="engine-check">
              <input
                type="checkbox"
                checked={essay.comparison}
                onChange={(event) => patch({ comparison: event.target.checked })}
              />
              Show metrics on the public essay
            </label>
          </div>
          {essay.comparison ? (
            <>
              <div className="analysis-sides">
                <label>
                  Left name
                  <input
                    value={essay.metricNames.left}
                    onChange={(event) => patch({ metricNames: { ...essay.metricNames, left: event.target.value } })}
                    placeholder="Henry"
                  />
                </label>
                <label>
                  Right name
                  <input
                    value={essay.metricNames.right}
                    onChange={(event) => patch({ metricNames: { ...essay.metricNames, right: event.target.value } })}
                    placeholder="Salah"
                  />
                </label>
              </div>
              <div className="table-scroll">
                <table className="table analysis-metric-table">
                  <thead>
                    <tr>
                      <th>Label</th>
                      <th>Left</th>
                      <th>Right</th>
                      <th>Winner</th>
                      <th>Unit</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {essay.metrics.map((metric, index) => (
                      <tr key={metric.id}>
                        <td>
                          <input
                            value={metric.label}
                            onChange={(event) => updateMetric(index, { label: event.target.value })}
                            placeholder="Peak Elo score"
                          />
                        </td>
                        <td>
                          <input
                            value={metric.left}
                            onChange={(event) => updateMetric(index, { left: event.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={metric.right}
                            onChange={(event) => updateMetric(index, { right: event.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            value={metric.winner}
                            onChange={(event) => updateMetric(index, { winner: event.target.value })}
                          >
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="none">None</option>
                          </select>
                        </td>
                        <td>
                          <input
                            value={metric.unit || ''}
                            onChange={(event) => updateMetric(index, { unit: event.target.value })}
                            placeholder="xA/90"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => patch({ metrics: essay.metrics.filter((_, current) => current !== index) })}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn ghost" onClick={() => patch({ metrics: [...essay.metrics, emptyMetric()] })}>
                Add metric
              </button>
            </>
          ) : (
            <p className="muted">Turn comparison on to publish the three metric cards the web essay shows.</p>
          )}
        </article>

        <article className="panel" id="essay-body">
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
          <p className="muted">Same Milkdown template as blog posts. `##` headings become the sections on `/analysis/:slug`.</p>
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
              value={essay.body}
              onChange={(event) => patch({ body: event.target.value })}
              spellCheck="true"
              aria-label="Markdown source"
            />
          ) : (
            <MilkdownEditor key={`${essay.id}-${visualKey}`} ref={editorRef} defaultValue={essay.body} />
          )}
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Translations</h2>
            <span>English is the source. Other locales override title, card, excerpt, and body copy.</span>
          </div>
          <div className="sheet-tabs" role="tablist" aria-label="Locale">
            {LOCALES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={locale === item.id}
                className={locale === item.id ? 'is-active' : ''}
                onClick={() => setLocale(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {locale === 'en' ? (
            <p className="muted">English is edited in the fields above.</p>
          ) : (
            <div className="analysis-identity">
              <label>
                Card title
                <input
                  value={translation.cardTitle}
                  onChange={(event) => patchTranslation({ cardTitle: event.target.value })}
                />
              </label>
              <label>
                Headline
                <input
                  value={translation.title}
                  onChange={(event) => patchTranslation({ title: event.target.value })}
                />
              </label>
              <label className="field-excerpt">
                Excerpt
                <input
                  value={translation.excerpt}
                  onChange={(event) => patchTranslation({ excerpt: event.target.value })}
                />
              </label>
              <label className="field-excerpt">
                Body
                <textarea
                  className="markdown-source"
                  value={translation.body || ''}
                  onChange={(event) => patchTranslation({ body: event.target.value })}
                  placeholder={essay.body}
                  rows={12}
                />
              </label>
            </div>
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

      <EssayAiChat
        open={aiOpen}
        onClose={closeAi}
        onAccept={applyAiDraft}
        categories={categories}
      />
    </section>
  );
}
