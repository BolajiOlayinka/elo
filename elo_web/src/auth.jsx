import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLanguage } from './i18n/LanguageProvider.jsx';
import { readStoredLanguage } from './i18n/languages.js';

const KEY = 'elo-web-auth-v1';
const DEMO_PASSWORD = 'elostats';

function readSession() {
  try {
    const raw = localStorage.getItem(KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

function initialsFrom(name, email) {
  const source = (name || email || 'AN').trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function makeSession({ email, name }) {
  const handle = (name || email.split('@')[0] || 'Analyst').trim();

  return {
    email: email.trim(),
    name: handle,
    initials: initialsFrom(handle, email),
    role: 'Analyst',
    joinedLabel: 'Member since Oct 2026',
    language: readStoredLanguage()
  };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { language, setLanguage, t } = useLanguage();
  const [session, setSession] = useState(readSession);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (session?.language && session.language !== language) {
      setLanguage(session.language);
    }
  }, [session?.email, session?.language, language, setLanguage]);

  function close() {
    setOpen(false);
    setError('');
    setPassword('');
    setResetSent(false);
  }

  function show(nextMode) {
    setMode(nextMode);
    setError('');
    setResetSent(false);
    setOpen(true);
  }

  const value = useMemo(() => ({
    session,
    openLogin() {
      show('login');
    },
    openSignup() {
      show('signup');
    },
    openForgot() {
      show('forgot');
    },
    requireAuth() {
      if (session) {
        return true;
      }

      show('login');
      return false;
    },
    logout() {
      localStorage.removeItem(KEY);
      setSession(null);
    },
    updateProfile(patch) {
      setSession((current) => {
        if (!current) {
          return current;
        }

        const next = {
          ...current,
          ...patch,
          initials: initialsFrom(patch.name || current.name, patch.email || current.email)
        };

        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    }
  }), [session]);

  function persist(next) {
    localStorage.setItem(KEY, JSON.stringify(next));
    setSession(next);
    close();
  }

  function submitLogin(event) {
    event.preventDefault();

    if (password !== DEMO_PASSWORD) {
      setError(t('auth.wrongPassword'));
      return;
    }

    persist(makeSession({ email, name: email.split('@')[0] }));
  }

  function submitSignup(event) {
    event.preventDefault();

    if (password.length < 6) {
      setError(t('auth.shortPassword'));
      return;
    }

    persist(makeSession({ email, name }));
  }

  function submitForgot(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError(t('auth.enterEmail'));
      return;
    }

    setResetSent(true);
    setError('');
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {open ? (
        <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button className="auth-modal-backdrop" type="button" aria-label={t('auth.close')} onClick={close} />
          {mode === 'forgot' ? (
            <form className="auth-modal-card" onSubmit={submitForgot}>
              <h2 id="auth-title">{t('auth.forgotTitle')}</h2>
              <p>{t('auth.forgotLede')}</p>
              <label>
                {t('account.email')}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@elostats.football"
                  required
                />
              </label>
              {error ? <p className="auth-modal-error">{error}</p> : null}
              {resetSent ? (
                <p>{t('auth.resetSent')}</p>
              ) : null}
              <div className="auth-modal-actions">
                <button className="btn btn-lime btn-explore" type="submit">
                  {resetSent ? t('auth.sendAgain') : t('auth.sendReset')}
                </button>
              </div>
              <button className="auth-modal-link" type="button" onClick={() => setMode('login')}>
                {t('auth.backLogin')}
              </button>
            </form>
          ) : (
            <form className="auth-modal-card" onSubmit={mode === 'signup' ? submitSignup : submitLogin}>
              <h2 id="auth-title">{mode === 'signup' ? t('auth.signupTitle') : t('auth.loginTitle')}</h2>
              <p>
                {mode === 'signup' ? t('auth.signupLede') : t('auth.loginLede')}
              </p>
              {mode === 'signup' ? (
                <label>
                  {t('account.displayName')}
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    required
                  />
                </label>
              ) : null}
              <label>
                {t('account.email')}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@elostats.football"
                  required
                />
              </label>
              <label>
                {t('auth.password')}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {error ? <p className="auth-modal-error">{error}</p> : null}
              <div className="auth-modal-actions">
                {mode === 'signup' ? (
                  <>
                    <button className="btn btn-lime btn-explore" type="submit">{t('nav.signup')}</button>
                    <button className="btn btn-ghost btn-explore" type="button" onClick={() => setMode('login')}>
                      {t('nav.login')}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-lime btn-explore" type="submit">{t('nav.login')}</button>
                    <button className="btn btn-ghost btn-explore" type="button" onClick={() => setMode('signup')}>
                      {t('nav.signup')}
                    </button>
                  </>
                )}
              </div>
              <button className="auth-modal-link" type="button" onClick={() => setMode('forgot')}>
                {t('auth.forgotLink')}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth needs AuthProvider');
  }

  return context;
}
