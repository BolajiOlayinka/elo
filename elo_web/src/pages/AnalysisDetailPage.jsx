import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { AnalysisDebate } from '../components/AnalysisDebate.jsx';
import { FilterIcon } from '../components/Icons.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { addActivity } from '../data/account.js';
import {
  getAnalysisArticle,
  getDiscussedArticles,
  getRelatedArticles,
  normalizeComment
} from '../data/analysis.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';
import { localizeArticle } from '../i18n/localize.js';

function mapThread(list, id, fn) {
  return list.map((row) => {
    if (row.id === id) {
      return fn(row);
    }

    return { ...row, replies: mapThread(row.replies || [], id, fn) };
  });
}

function parseMetric(value) {
  const next = parseFloat(String(value).replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(next) ? Math.abs(next) : null;
}

function ComparisonMetrics({ article }) {
  if (!article.comparison) {
    return null;
  }

  return (
    <div className="analysis-metrics" aria-label="Comparison metrics">
      {article.metrics.map((metric) => {
        const side = metric.winner === 'right' ? 'right' : 'left';
        const value = metric[side];
        const name = article.metricNames[side];
        const left = parseMetric(metric.left);
        const right = parseMetric(metric.right);
        const shown = parseMetric(value);
        const max = Math.max(left || 0, right || 0, shown || 0, 0.0001);
        const width = shown == null ? 42 : Math.max(18, Math.round((shown / max) * 100));

        return (
          <div key={metric.id} className={`analysis-metric-card is-${side}`}>
            <span>{metric.label}</span>
            <div className="analysis-metric-row">
              <strong>{value}</strong>
              <em>{name}{metric.unit ? ` ${metric.unit}` : ''}</em>
            </div>
            <div className="analysis-metric-bar">
              <i style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalysisDetailPage() {
  const { slug } = useParams();
  const article = getAnalysisArticle(slug);

  if (!article) {
    return <Navigate to="/analysis" replace />;
  }

  return <AnalysisEssay key={article.slug} article={article} />;
}

function AnalysisEssay({ article }) {
  const { session } = useAuth();
  const { t } = useLanguage();
  const localized = localizeArticle(article, t);
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState(() => (article.comments || []).map(normalizeComment));
  const [votes, setVotes] = useState({});
  const [openReply, setOpenReply] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [visibleCount, setVisibleCount] = useState(2);

  const discussed = getDiscussedArticles(article.slug, 3);
  const related = getRelatedArticles(article.slug, 3);
  const visible = comments.slice(0, visibleCount);
  const hiddenCount = comments.length - visible.length;
  const argumentCount = article.arguments ?? comments.length;

  function submit(event) {
    event.preventDefault();
    const text = draft.trim();

    if (!text) {
      return;
    }

    const entry = {
      id: `local-${Date.now()}`,
      name: session?.name || 'You',
      initials: session?.initials || 'YO',
      when: 'Just now',
      stance: 'challenge',
      text,
      upvotes: 0,
      downvotes: 0,
      replies: [],
      match: null
    };

    setComments((current) => [entry, ...current]);
    addActivity(session?.email, {
      id: entry.id,
      kind: 'argument',
      essaySlug: article.slug,
      essayTitle: article.cardTitle || article.title,
      text,
      points: 5,
      agrees: 0,
      when: 'Just now',
      name: entry.name
    });
    setDraft('');
    setVisibleCount((count) => count + 1);
  }

  function vote(id, direction) {
    const previous = votes[id] || null;
    const next = previous === direction ? null : direction;

    setVotes((current) => ({ ...current, [id]: next }));
    setComments((rows) => mapThread(rows, id, (row) => {
      let upvotes = row.upvotes;
      let downvotes = row.downvotes;

      if (previous === 'up') {
        upvotes -= 1;
      }

      if (previous === 'down') {
        downvotes -= 1;
      }

      if (next === 'up') {
        upvotes += 1;
      }

      if (next === 'down') {
        downvotes += 1;
      }

      return { ...row, upvotes, downvotes };
    }));
  }

  function submitReply(parentId) {
    const text = (replyDrafts[parentId] || '').trim();

    if (!text) {
      return;
    }

    const reply = {
      id: `local-${Date.now()}`,
      name: session?.name || 'You',
      initials: session?.initials || 'YO',
      when: 'Just now',
      stance: 'challenge',
      text,
      upvotes: 0,
      downvotes: 0,
      replies: [],
      match: null
    };

    setComments((rows) => mapThread(rows, parentId, (row) => ({
      ...row,
      replies: [...(row.replies || []), reply]
    })));
    addActivity(session?.email, {
      id: reply.id,
      kind: 'reply',
      essaySlug: article.slug,
      essayTitle: article.cardTitle || article.title,
      text,
      points: 2,
      agrees: 0,
      when: 'Just now',
      name: reply.name
    });
    setReplyDrafts((current) => ({ ...current, [parentId]: '' }));
    setOpenReply(null);
  }

  return (
    <div className="page analysis-page analysis-detail-page">
      <div className="wrap">
        <nav className="analysis-crumb" aria-label="Breadcrumb">
          <Link to="/analysis">{t('nav.analysis')}</Link>
          <span aria-hidden="true">›</span>
          <span>{t('analysis.essay')}</span>
        </nav>
      </div>

      <article className="analysis-article">
        <div className="wrap analysis-article-grid">
          <div className="analysis-left">
            <div className="analysis-main">
              <p className="analysis-kicker">
                {localized.categoryLabel}
                <span> · {t('analysis.minRead', { n: article.readMinutes })}</span>
                <span> · {t('analysis.seasons', { n: article.clips.toLocaleString() })}</span>
              </p>
              <h1>{localized.title}</h1>
              <p className="analysis-subtitle">{localized.excerpt}</p>
              <div className="analysis-byline">
                <span className="analysis-avatar" aria-hidden="true">{article.author.initials}</span>
                <div>
                  <strong>{article.author.name}</strong>
                  <span>{article.publishedLabel}</span>
                </div>
                <span className="analysis-card-badge">{t(`analysis.cat.${article.category}`)}</span>
              </div>

              <figure className="analysis-hero-figure">
                <img src={article.hero} alt="" />
              </figure>

              <ComparisonMetrics article={localized} />

              {localized.body.map((block) => (
                <section key={block.heading} className="analysis-block">
                  <h2>{block.heading}</h2>
                  <p>{block.text}</p>
                </section>
              ))}
            </div>

            <AnalysisDebate
              comments={comments}
              visible={visible}
              hiddenCount={hiddenCount}
              argumentCount={argumentCount}
              draft={draft}
              setDraft={setDraft}
              onSubmit={submit}
              votes={votes}
              onVote={vote}
              openReply={openReply}
              setOpenReply={setOpenReply}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
              onReply={submitReply}
              onLoadMore={() => setVisibleCount(comments.length)}
            />
          </div>

          <div className="analysis-right">
            <aside className="analysis-side">
              <div className="analysis-side-head">
                <div>
                  <p className="analysis-side-kicker">{t('analysis.thisWeek')}</p>
                  <h2>{t('analysis.mostDiscussed')}</h2>
                </div>
                <button className="analysis-icon-btn" type="button" aria-label={t('analysis.filter')}>
                  <FilterIcon />
                </button>
              </div>
              <ol>
                {discussed.map((item, index) => (
                  <li key={item.id}>
                    <span>{index + 1}.</span>
                    <div>
                      <Link to={`/analysis/${item.slug}`}>{localizeArticle(item, t).title}</Link>
                      <p>{t('analysis.arguments', { n: item.arguments ?? 0 })} · {t('analysis.minRead', { n: item.readMinutes })}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {/*
              <Link className="analysis-side-index" to="/analysis/debate">
                See the debate index
                <ArrowDownIcon />
              </Link>
              */}
            </aside>

            <aside className="analysis-side">
              <div className="analysis-side-head">
                <div>
                  <p className="analysis-side-kicker">{t('analysis.moreDesk')}</p>
                  <h2>{t('analysis.related')}</h2>
                </div>
              </div>
              <ol>
                {related.map((item) => (
                  <li key={item.id}>
                    <div>
                      <Link to={`/analysis/${item.slug}`}>{localizeArticle(item, t).cardTitle}</Link>
                      <p>{t(`analysis.cat.${item.category}`)} · {t('analysis.minRead', { n: item.readMinutes })}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
