import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { AnalysisDebate } from '../components/AnalysisDebate.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { addActivity } from '../data/account.js';
import { ANALYSIS_ARTICLES, getAllArguments, normalizeComment } from '../data/analysis.js';
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

export default function DebateIndexPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [essay, setEssay] = useState('all');
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState(() => getAllArguments());
  const [votes, setVotes] = useState({});
  const [openReply, setOpenReply] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [visibleCount, setVisibleCount] = useState(8);

  const visiblePool = useMemo(
    () => (essay === 'all' ? comments : comments.filter((row) => row.articleSlug === essay)),
    [comments, essay]
  );
  const visible = visiblePool.slice(0, visibleCount);
  const hiddenCount = visiblePool.length - visible.length;

  function submit(event) {
    event.preventDefault();
    const text = draft.trim();
    const target = ANALYSIS_ARTICLES.find((row) => row.slug === essay) || ANALYSIS_ARTICLES[0];

    if (!text || !session) {
      return;
    }

    const entry = normalizeComment({
      id: `local-${Date.now()}`,
      name: session.name,
      initials: session.initials,
      when: 'Just now',
      stance: 'challenge',
      text,
      upvotes: 0,
      downvotes: 0,
      replies: [],
      articleSlug: target.slug,
      articleTitle: target.cardTitle || target.title
    });

    setComments((current) => [entry, ...current]);
    addActivity(session.email, {
      id: entry.id,
      kind: 'argument',
      essaySlug: target.slug,
      essayTitle: target.cardTitle || target.title,
      text,
      points: 5,
      agrees: 0,
      when: 'Just now',
      name: session.name
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

    if (!text || !session) {
      return;
    }

    const parent = comments.find((row) => row.id === parentId);
    const reply = {
      id: `local-${Date.now()}`,
      name: session.name,
      initials: session.initials,
      when: 'Just now',
      stance: 'challenge',
      text,
      upvotes: 0,
      downvotes: 0,
      replies: []
    };

    setComments((rows) => mapThread(rows, parentId, (row) => ({
      ...row,
      replies: [...(row.replies || []), reply]
    })));
    addActivity(session.email, {
      id: reply.id,
      kind: 'reply',
      essaySlug: parent?.articleSlug || ANALYSIS_ARTICLES[0].slug,
      essayTitle: parent?.articleTitle || ANALYSIS_ARTICLES[0].title,
      text,
      points: 2,
      agrees: 0,
      when: 'Just now',
      name: session.name
    });
    setReplyDrafts((current) => ({ ...current, [parentId]: '' }));
    setOpenReply(null);
  }

  return (
    <div className="page analysis-page analysis-debate-index">
      <section className="analysis-hero">
        <div className="wrap">
          <h1>{t('debate.indexTitle')}</h1>
          <p>{t('debate.indexLede')}</p>
        </div>
      </section>

      <section className="analysis-toolbar">
        <div className="wrap">
          <div className="analysis-toolbar-inner" role="tablist" aria-label={t('debate.filterEssay')}>
            <button
              type="button"
              role="tab"
              aria-selected={essay === 'all'}
              className={essay === 'all' ? 'is-active' : ''}
              onClick={() => {
                setEssay('all');
                setVisibleCount(8);
              }}
            >
              {t('debate.allEssays')}
            </button>
            {ANALYSIS_ARTICLES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={essay === item.slug}
                className={essay === item.slug ? 'is-active' : ''}
                onClick={() => {
                  setEssay(item.slug);
                  setVisibleCount(8);
                }}
              >
                {localizeArticle(item, t).cardTitle.split(/[:.]/)[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="analysis-article">
        <div className="wrap">
          <div className="analysis-index-panel">
            <p className="analysis-kicker">
              {t('analysis.arguments', { n: visiblePool.length })}
              {essay === 'all' ? t('debate.across') : null}
            </p>
            <AnalysisDebate
              comments={comments}
              visible={visible}
              hiddenCount={hiddenCount}
              argumentCount={visiblePool.length}
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
              onLoadMore={() => setVisibleCount(visiblePool.length)}
            />
            <p className="analysis-index-back">
              <Link to="/analysis">{t('debate.back')}</Link>
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
