import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useLanguage } from '../i18n/LanguageProvider.jsx';
import {
  ArrowDownIcon,
  ChatIcon,
  PaperclipIcon,
  SendUpIcon,
  ThumbDownIcon,
  ThumbUpIcon
} from './Icons.jsx';

function stanceLabel(stance, t) {
  return stance === 'support' ? t('analysis.supports') : t('analysis.challenges');
}

export function AnalysisDebate({
  comments,
  visible,
  hiddenCount,
  argumentCount,
  draft,
  setDraft,
  onSubmit,
  votes,
  onVote,
  openReply,
  setOpenReply,
  replyDrafts,
  setReplyDrafts,
  onReply,
  onLoadMore
}) {
  const composerRef = useRef(null);
  const { session, requireAuth, openLogin } = useAuth();
  const { t } = useLanguage();

  function startArgument() {
    if (!requireAuth()) {
      return;
    }

    composerRef.current?.focus();
  }

  function submit(event) {
    event.preventDefault();

    if (!requireAuth()) {
      return;
    }

    onSubmit(event);
  }

  return (
    <section className="analysis-debate">
      <div className="analysis-debate-head">
        <div>
          <h2>
            {t('analysis.debateTitle')}
            <span>{t('analysis.arguments', { n: argumentCount })}</span>
          </h2>
          <p>{t('analysis.debateLede')}</p>
        </div>
        <button className="btn btn-lime btn-explore analysis-debate-cta" type="button" onClick={startArgument}>
          <ChatIcon />
          {t('analysis.makeArgument')}
        </button>
      </div>

      <div className={session ? 'analysis-composer' : 'analysis-composer is-locked'}>
        <form className="analysis-comment-form" onSubmit={submit}>
          <span className="analysis-avatar" aria-hidden="true">{session?.initials || 'IN'}</span>
          <label className="sr-only" htmlFor="analysis-comment">Your argument</label>
          <input
            id="analysis-comment"
            ref={composerRef}
            type="text"
            placeholder={t('analysis.composerPlaceholder')}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!session}
          />
          <button className="analysis-icon-btn" type="button" aria-label={t('analysis.attach')} disabled={!session}>
            <PaperclipIcon />
          </button>
          <button className="analysis-send-btn" type="submit" aria-label={t('analysis.post')} disabled={!session}>
            <SendUpIcon />
          </button>
        </form>
        {session ? null : (
          <div className="analysis-auth-gate">
            <p>{t('analysis.loginToArgue')}</p>
            <button className="btn btn-lime btn-explore" type="button" onClick={openLogin}>
              {t('analysis.loginToDebate')}
            </button>
          </div>
        )}
      </div>

      <ol className="analysis-comments">
        {visible.map((item) => (
          <CommentItem
            key={item.id}
            item={item}
            votes={votes}
            onVote={onVote}
            openReply={openReply}
            setOpenReply={setOpenReply}
            replyDrafts={replyDrafts}
            setReplyDrafts={setReplyDrafts}
            onReply={onReply}
          />
        ))}
      </ol>

      {hiddenCount > 0 ? (
        <button className="analysis-load-more" type="button" onClick={onLoadMore}>
          {t('analysis.loadMore', { n: hiddenCount })}
          <ArrowDownIcon />
        </button>
      ) : null}
    </section>
  );
}

export function CommentItem({
  item,
  votes,
  onVote,
  openReply,
  setOpenReply,
  replyDrafts,
  setReplyDrafts,
  onReply,
  nested = false
}) {
  const { session, requireAuth } = useAuth();
  const { t } = useLanguage();
  const vote = votes[item.id];

  function reply() {
    if (!requireAuth()) {
      return;
    }

    setOpenReply((current) => (current === item.id ? null : item.id));
  }

  return (
    <li className={nested ? 'is-reply' : ''}>
      <span className="analysis-avatar" aria-hidden="true">{item.initials}</span>
      <div className="analysis-comment-body">
        {item.articleSlug ? (
          <p className="analysis-comment-essay">
            {t('analysis.onEssay')} <Link to={`/analysis/${item.articleSlug}`}>{item.articleTitle}</Link>
          </p>
        ) : null}
        <div className="analysis-comment-top">
          <strong>{item.name}</strong>
          <span className={`analysis-stance is-${item.stance}`}>{stanceLabel(item.stance, t)}</span>
          <span className="analysis-comment-when">{item.when}</span>
        </div>
        <p>{item.text}</p>
        <div className="analysis-comment-meta">
          {item.match ? (
            <span className="analysis-comment-match">
              {item.match.label}
              <em> · {item.match.clock}</em>
            </span>
          ) : null}
          <button className={vote === 'up' ? 'is-active' : ''} type="button" onClick={() => onVote(item.id, 'up')}>
            <ThumbUpIcon />
            {item.upvotes} {t('analysis.agree')}
          </button>
          <button className={vote === 'down' ? 'is-active' : ''} type="button" onClick={() => onVote(item.id, 'down')}>
            <ThumbDownIcon />
            {item.downvotes}
          </button>
          <button type="button" onClick={reply}>{t('analysis.reply')}</button>
        </div>

        {session && openReply === item.id ? (
          <form
            className="analysis-reply-form"
            onSubmit={(event) => {
              event.preventDefault();
              onReply(item.id);
            }}
          >
            <input
              type="text"
              placeholder={t('analysis.replyPlaceholder')}
              value={replyDrafts[item.id] || ''}
              onChange={(event) => setReplyDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
            />
            <button className="analysis-send-btn" type="submit" aria-label={t('analysis.postReply')}>
              <SendUpIcon />
            </button>
          </form>
        ) : null}

        {item.replies?.length ? (
          <ol className="analysis-replies">
            {item.replies.map((replyItem) => (
              <CommentItem
                key={replyItem.id}
                item={replyItem}
                votes={votes}
                onVote={onVote}
                openReply={openReply}
                setOpenReply={setOpenReply}
                replyDrafts={replyDrafts}
                setReplyDrafts={setReplyDrafts}
                onReply={onReply}
                nested
              />
            ))}
          </ol>
        ) : null}
      </div>
    </li>
  );
}
