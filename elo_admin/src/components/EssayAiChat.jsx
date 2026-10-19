import { useEffect, useRef, useState } from 'react';
import { markdownToHtml } from '../lib/markdown.js';
import { replyToUser, welcomeMessage } from '../data/essayAi.js';

function IconBot() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="3.5" y="5.5" width="11" height="9" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 2.5v3M6.4 9.2h.1M11.5 9.2h.1M6.8 12.2h4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12.5 8 8.5 11.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DraftCard({ draft, accepted, onAccept }) {
  return (
    <div className="ai-draft">
      <p className="ai-draft-kicker">{draft.cardTitle}</p>
      <h3>{draft.title}</h3>
      {draft.excerpt ? <p className="muted">{draft.excerpt}</p> : null}
      <div
        className="ai-draft-body"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(draft.body) }}
      />
      {accepted ? (
        <p className="notice">Applied to the essay body.</p>
      ) : (
        <button type="button" className="btn lime" onClick={onAccept}>Accept response</button>
      )}
    </div>
  );
}

export function EssayAiChat({ open, onClose, onAccept, categories = [] }) {
  const [messages, setMessages] = useState(() => [welcomeMessage(categories)]);
  const [state, setState] = useState({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [acceptedId, setAcceptedId] = useState(null);
  const scroller = useRef(null);
  const field = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    field.current?.focus();

    function onKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    const node = scroller.current;

    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, busy, open]);

  function pushAssistant(nextMessages, nextState) {
    setBusy(true);
    window.setTimeout(() => {
      setState(nextState);
      setMessages((current) => [
        ...current,
        ...nextMessages.map((row, index) => ({ ...row, id: `${Date.now()}-${index}` }))
      ]);
      setBusy(false);
    }, 700);
  }

  function send(text, chipId) {
    const trimmed = String(text || '').trim();

    if (busy || (!trimmed && !chipId)) {
      return;
    }

    const userText = chipId
      ? (categories.find((row) => row.id === chipId)?.label || trimmed)
      : trimmed;

    setMessages((current) => [
      ...current,
      { id: `u-${Date.now()}`, role: 'user', kind: 'text', text: userText }
    ]);
    setInput('');
    const result = replyToUser({ text: trimmed, chipId, state, categories });
    pushAssistant(result.messages, result.state);
  }

  function accept(message) {
    if (!message.draft) {
      return;
    }

    onAccept({
      ...message.draft,
      body: draftToBlocks(message.draft)
    });
    setAcceptedId(message.id);
    setMessages((current) => [
      ...current,
      {
        id: `ok-${Date.now()}`,
        role: 'assistant',
        kind: 'text',
        text: 'Accepted. The Markdown is in the body editor. Edit it like a blog post, or send another topic for a new pass.'
      }
    ]);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="ai-overlay" role="dialog" aria-modal="true" aria-label="Create with AI">
      <button className="dash-overlay-backdrop" type="button" aria-label="Close" onClick={onClose} />
      <aside className="ai-chat">
        <header className="ai-chat-head">
          <div className="ai-avatar" aria-hidden="true">
            <IconBot />
          </div>
          <div>
            <h2>Create with AI</h2>
            <p>Conversational draft for the public analysis essay.</p>
          </div>
          <button type="button" className="cmp-icon-btn dash-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="ai-thread" ref={scroller}>
          {messages.map((message) => (
            <div key={message.id} className={`ai-row is-${message.role}`}>
              {message.role === 'assistant' ? (
                <span className="ai-avatar" aria-hidden="true"><IconBot /></span>
              ) : null}
              <div className={`ai-bubble is-${message.role}`}>
                {message.kind === 'draft' ? (
                  <DraftCard
                    draft={message.draft}
                    accepted={acceptedId === message.id}
                    onAccept={() => accept(message)}
                  />
                ) : (
                  <p>{message.text}</p>
                )}
                {message.chips?.length && !state.desk ? (
                  <div className="ai-chips">
                    {message.chips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        className="btn ghost"
                        onClick={() => send(chip.label, chip.id)}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {busy ? (
            <div className="ai-row is-assistant">
              <span className="ai-avatar" aria-hidden="true"><IconBot /></span>
              <div className="ai-bubble is-assistant is-typing">
                <i /><i /><i />
              </div>
            </div>
          ) : null}
        </div>

        <form
          className="ai-composer"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <input
            ref={field}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type the topic or a follow-up…"
            aria-label="Message"
          />
          <button type="submit" className="ai-send" aria-label="Send" disabled={busy || !input.trim()}>
            <IconSend />
          </button>
        </form>
      </aside>
    </div>
  );
}
