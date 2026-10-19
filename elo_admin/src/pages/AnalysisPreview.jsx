import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEssay, loadEssays } from '../data/analysis.js';
import { loadDebateForEssay, nestDebate } from '../data/debate.js';
import { markdownToHtml } from '../lib/markdown.js';
import { hasMedia, mediaUrl } from '../data/uploads.js';

function parseMetric(value) {
  const next = parseFloat(String(value).replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(next) ? Math.abs(next) : null;
}

function ComparisonMetrics({ essay }) {
  if (!essay.comparison || !essay.metrics?.length) {
    return null;
  }

  return (
    <div className="ax-metrics" aria-label="Comparison metrics">
      {essay.metrics.map((metric) => {
        const side = metric.winner === 'right' ? 'right' : 'left';
        const value = metric[side];
        const name = essay.metricNames?.[side] || side;
        const left = parseMetric(metric.left);
        const right = parseMetric(metric.right);
        const shown = parseMetric(value);
        const max = Math.max(left || 0, right || 0, shown || 0, 0.0001);
        const width = shown == null ? 42 : Math.max(18, Math.round((shown / max) * 100));

        return (
          <div key={metric.id} className={`ax-metric is-${side}`}>
            <span>{metric.label}</span>
            <div className="ax-metric-row">
              <strong>{value}</strong>
              <em>{name}{metric.unit ? ` ${metric.unit}` : ''}</em>
            </div>
            <div className="ax-metric-bar">
              <i style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DebateThread({ comment }) {
  return (
    <article className={`ax-comment is-${comment.stance || 'challenge'}`}>
      <header>
        <span className="analysis-avatar">{comment.initials}</span>
        <div>
          <strong>{comment.name}</strong>
          <p>{comment.when} · {comment.stance} · {comment.upvotes} / {comment.downvotes}</p>
        </div>
        <span className={comment.status === 'approved' ? 'tag ok' : 'tag'}>{comment.status}</span>
      </header>
      <p>{comment.text}</p>
      {comment.match ? (
        <p className="muted">Clip · {comment.match.label} · {comment.match.clock}</p>
      ) : null}
      {(comment.replies || []).map((reply) => (
        <DebateThread key={reply.id} comment={reply} />
      ))}
    </article>
  );
}

export default function AnalysisPreview() {
  const { id } = useParams();
  const [essay, setEssay] = useState(null);
  const [debate, setDebate] = useState([]);
  const [related, setRelated] = useState([]);
  const [discussed, setDiscussed] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([getEssay(id), loadEssays(), loadDebateForEssay(id)])
      .then(([post, posts, comments]) => {
        setEssay(post);
        setDebate(nestDebate(comments));
        setRelated(posts.filter((row) => row.id !== post.id && row.status === 'published').slice(0, 3));
        setDiscussed(
          posts
            .filter((row) => row.id !== post.id)
            .sort((left, right) => (right.arguments || 0) - (left.arguments || 0))
            .slice(0, 3)
        );
      })
      .catch(() => setEssay(null))
      .finally(() => setReady(true));
  }, [id]);

  if (!ready) {
    return (
      <section>
        <h1>Preview</h1>
        <p className="muted">Loading…</p>
      </section>
    );
  }

  if (!essay) {
    return (
      <section>
        <h1>Post not found</h1>
        <p className="muted">This analysis post is not on the API.</p>
        <Link className="btn ghost" to="/analysis">Back to posts</Link>
      </section>
    );
  }

  return (
    <article className="ax-preview">
      <p className="back">
        <Link to="/analysis">Posts</Link> / Preview
      </p>
      <div className="page-head">
        <div>
          <p className="blog-preview-kicker">
            <span className={essay.status === 'published' ? 'tag ok' : 'tag'}>{essay.status}</span>
            <span className="tag">{essay.categoryLabel}</span>
            {essay.comparison ? <span className="tag">Comparison</span> : null}
            {(essay.tags || []).map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </p>
        </div>
        <div className="page-head-actions">
          <Link className="btn ghost" to={`/analysis/${essay.id}/edit`}>Edit</Link>
          <Link className="btn ghost" to="/analysis/comments">Comments</Link>
        </div>
      </div>

      <div className="ax-preview-grid">
        <div>
          <p className="ax-kicker">
            {essay.categoryLabel}
            <span> · {essay.readMinutes} min read</span>
            <span> · {Number(essay.clips || 0).toLocaleString('en-GB')} seasons</span>
          </p>
          <h1>{essay.title || essay.cardTitle || 'Untitled'}</h1>
          {essay.excerpt ? <p className="ax-lede">{essay.excerpt}</p> : null}
          <div className="ax-byline">
            <span className="analysis-avatar">{essay.author?.initials}</span>
            <div>
              <strong>{essay.author?.name}</strong>
              <span>{essay.publishedLabel || 'Unpublished'} · {essay.author?.role}</span>
            </div>
          </div>
          {hasMedia(essay.hero) ? (
            <img className="ax-hero" src={mediaUrl(essay.hero)} alt="" />
          ) : null}
          <ComparisonMetrics essay={essay} />
          <div
            className="ax-block blog-preview-body"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(essay.body) }}
          />

          <div className="ax-debate">
            <div className="panel-head">
              <h2>Comments</h2>
              <span>{debate.length} top-level comments</span>
            </div>
            {debate.length === 0 ? <p className="muted">No arguments on this essay yet.</p> : null}
            {debate.map((comment) => (
              <DebateThread key={comment.id} comment={comment} />
            ))}
          </div>
        </div>

        <aside className="ax-rails">
          <article className="panel">
            <p className="ax-side-kicker">This week</p>
            <h2>Most discussed</h2>
            <ol>
              {discussed.map((item) => (
                <li key={item.id}>
                  <Link to={`/analysis/${item.id}`}>{item.title}</Link>
                  <p>{item.arguments} arguments · {item.readMinutes} min</p>
                </li>
              ))}
            </ol>
          </article>
          <article className="panel">
            <p className="ax-side-kicker">More from the desk</p>
            <h2>Related</h2>
            <ol>
              {related.map((item) => (
                <li key={item.id}>
                  <Link to={`/analysis/${item.id}`}>{item.cardTitle}</Link>
                  <p>{item.categoryLabel} · {item.readMinutes} min</p>
                </li>
              ))}
            </ol>
          </article>
        </aside>
      </div>
    </article>
  );
}
