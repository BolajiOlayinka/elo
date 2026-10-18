import { useEffect } from 'react';

export function Drawer({ title, lede, open, onClose, tools, children }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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

  if (!open) {
    return null;
  }

  return (
    <div className="dash-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button className="dash-overlay-backdrop" type="button" aria-label="Close" onClick={onClose} />
      <aside className="dash-drawer">
        <header className="dash-drawer-head">
          <div>
            <h2>{title}</h2>
            {lede ? <p>{lede}</p> : null}
          </div>
          <button type="button" className="cmp-icon-btn dash-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {tools ? <div className="dash-drawer-tools">{tools}</div> : null}
        <div className="dash-drawer-body">{children}</div>
      </aside>
    </div>
  );
}
