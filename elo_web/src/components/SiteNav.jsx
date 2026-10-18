import { useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useLanguage } from '../i18n/LanguageProvider.jsx';
import { ArrowUpRight, CloseIcon, MenuIcon, StarIcon } from './Icons.jsx';
import { LanguageSelect } from './LanguageSelect.jsx';

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
  const { session, openLogin, openSignup, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const onRatings = location.pathname === '/ratings'
    || location.pathname.startsWith('/ratings/')
    || location.pathname.startsWith('/profile/');
  const onCompare = location.pathname === '/compare' || location.pathname.startsWith('/compare/');
  const onAnalysis = location.pathname === '/analysis' || location.pathname.startsWith('/analysis/');
  const onAccount = location.pathname === '/account';

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
      <NavItem to="/ratings" active={onRatings} onClick={close}>{t('nav.ratings')}</NavItem>
      <NavItem to="/analysis" active={onAnalysis} onClick={close}>{t('nav.analysis')}</NavItem>
      <NavItem to="/#method" active={location.hash === '#method' || location.hash === '#faq'} onClick={close}>
        {t('nav.methodology')}
      </NavItem>
      {session ? <NavItem to="/account" active={onAccount} onClick={close}>{t('nav.profile')}</NavItem> : null}
    </>
  );

  return (
    <>
      <header className={open ? 'nav is-open' : 'nav'}>
        <Link className="logo" to="/" onClick={close}>EloStats Football</Link>
        <nav className="nav-links" aria-label={t('nav.primary')}>
          <NavItem to="/ratings" active={onRatings}>{t('nav.ratings')}</NavItem>
          <NavItem to="/compare" active={onCompare}>{t('nav.compare')}</NavItem>
          <NavItem to="/analysis" active={onAnalysis}>{t('nav.analysis')}</NavItem>
          <NavItem to="/#method" active={location.hash === '#method' || location.hash === '#faq'}>
            {t('nav.methodology')}
          </NavItem>
        </nav>
        <div className="nav-auth">
          {session ? (
            <Link className={onAccount ? 'nav-user is-active' : 'nav-user'} to="/account" title={t('nav.yourProfile')}>
              {session.photo ? <img src={session.photo} alt="" /> : session.initials}
            </Link>
          ) : (
            <>
              <button className="nav-login" type="button" onClick={openSignup}>{t('nav.signup')}</button>
              <button className="btn btn-lime btn-explore nav-cta" type="button" onClick={openLogin}>
                {t('nav.login')}
              </button>
            </>
          )}
          <LanguageSelect
            className="nav-lang"
            onChange={session ? (id) => updateProfile({ language: id }) : undefined}
          />
        </div>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls={overlayId}
          aria-label={open ? t('nav.close') : t('nav.menu')}
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
                {t('nav.compare')}
                <ArrowUpRight size={10} />
              </Link>
              {session ? (
                <>
                  <LanguageSelect
                    className="nav-overlay-lang"
                    onChange={(id) => updateProfile({ language: id })}
                  />
                  <Link className="btn btn-lime btn-explore" to="/account" onClick={close}>
                    {t('nav.profile')}
                  </Link>
                </>
              ) : (
                <>
                  <LanguageSelect className="nav-overlay-lang" />
                  <button className="btn btn-ghost btn-explore" type="button" onClick={() => { close(); openSignup(); }}>
                    {t('nav.signup')}
                  </button>
                  <button className="btn btn-lime btn-explore" type="button" onClick={() => { close(); openLogin(); }}>
                    {t('nav.login')}
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
