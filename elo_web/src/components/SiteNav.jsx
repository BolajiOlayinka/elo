import { useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, CloseIcon, MenuIcon, StarIcon } from './Icons.jsx';

function NavItem({ to, active, onClick, children }) {
  return (
    <Link className={active ? 'is-active' : ''} to={to} onClick={onClick}>
      {active ? <StarIcon /> : null}
      {children}
    </Link>
  );
}

export function SiteNav() {
  const location = useLocation();
  const overlayId = useId();
  const [open, setOpen] = useState(false);
  const onRatings = location.pathname === '/ratings'
    || location.pathname.startsWith('/ratings/')
    || location.pathname.startsWith('/profile/');
  const onCompare = location.pathname === '/compare' || location.pathname.startsWith('/compare/');
  const onAnalyst = location.hash === '#analyst';
  const onMethod = location.hash === '#method' || location.hash === '#faq';

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    close();
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKey(event) {
      if (event.key === 'Escape') {
        close();
      }
    }

    function onResize() {
      if (window.matchMedia('(min-width: 901px)').matches) {
        close();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const items = (
    <>
      <NavItem to="/ratings" active={onRatings && !onAnalyst && !onMethod} onClick={close}>Ratings</NavItem>
      <NavItem to="/#analyst" active={onAnalyst} onClick={close}>AI Analyst</NavItem>
      <NavItem to="/#method" active={onMethod} onClick={close}>Methodology</NavItem>
    </>
  );

  return (
    <>
      <header className={open ? 'nav is-open' : 'nav'}>
        <Link className="logo" to="/" onClick={close}>EloStats Football</Link>
        <nav className="nav-links" aria-label="Primary">
          <NavItem to="/ratings" active={onRatings && !onAnalyst && !onMethod}>Ratings</NavItem>
          <NavItem to="/compare" active={onCompare}>Compare</NavItem>
          <NavItem to="/#analyst" active={onAnalyst}>AI Analyst</NavItem>
          <NavItem to="/#method" active={onMethod}>Methodology</NavItem>
        </nav>
        <Link className="btn btn-lime btn-explore nav-cta" to="/ratings">
          Explore Ratings
          <ArrowUpRight size={10} />
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls={overlayId}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      {open ? (
        <div className="nav-overlay" id={overlayId} role="dialog" aria-modal="true" aria-label="Menu">
          <nav className="nav-overlay-links" aria-label="Mobile">
            {items}
            <div className="nav-overlay-actions">
              <Link className="btn btn-ghost btn-explore nav-overlay-compare" to="/compare" onClick={close}>
                Compare
                <ArrowUpRight size={10} />
              </Link>
              <Link className="btn btn-lime btn-explore" to="/ratings" onClick={close}>
                Explore Ratings
                <ArrowUpRight size={10} />
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
