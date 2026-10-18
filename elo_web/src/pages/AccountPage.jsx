import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { CalendarIcon, LogoutIcon } from '../components/Icons.jsx';
import { LanguageSelect } from '../components/LanguageSelect.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { getActivity, summarizeActivity } from '../data/account.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';
import { localizeArticle } from '../i18n/localize.js';
import { getAnalysisArticle } from '../data/analysis.js';

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Choose an image file.'));
      return;
    }

    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      const edge = Math.min(image.width, image.height);
      const sx = (image.width - edge) / 2;
      const sy = (image.height - edge) / 2;
      context.drawImage(image, sx, sy, edge, edge, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };

    image.src = url;
  });
}

export default function AccountPage() {
  const { session, logout, updateProfile } = useAuth();
  const { language, t } = useLanguage();
  const [saved, setSaved] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [details, setDetails] = useState(() => ({
    name: session?.name || '',
    email: session?.email || '',
    dob: session?.dob || '',
    location: session?.location || '',
    bio: session?.bio || '',
    language: session?.language || language
  }));

  if (!session) {
    return <Navigate to="/" replace />;
  }

  const items = getActivity(session.email, session.name);
  const stats = summarizeActivity(items);
  const argumentsOnly = items.filter((row) => row.kind !== 'reply');
  const repliesOnly = items.filter((row) => row.kind === 'reply');

  function change(field) {
    return (event) => {
      setDetails((current) => ({ ...current, [field]: event.target.value }));
      setSaved('');
    };
  }

  function saveDetails(event) {
    event.preventDefault();
    updateProfile({
      name: details.name.trim() || session.name,
      email: details.email.trim() || session.email,
      dob: details.dob,
      location: details.location.trim(),
      bio: details.bio.trim(),
      language
    });
    setSaved(t('account.saved'));
  }

  async function onPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPhotoError('');

    if (!file) {
      return;
    }

    try {
      const photo = await readPhoto(file);
      updateProfile({ photo });
    } catch (error) {
      setPhotoError(error.message);
    }
  }

  return (
    <div className="page account-page">
      <div className="wrap">
        <p className="analysis-crumb account-crumb">{t('account.profile')}</p>

        <section className="account-hero">
          <label className="account-avatar is-upload">
            {session.photo ? <img src={session.photo} alt="" /> : session.initials}
            <input className="sr-only" type="file" accept="image/*" onChange={onPhoto} />
            <span>{t('account.changePhoto')}</span>
          </label>
          <div>
            <p className="analysis-kicker">{session.role || t('account.analyst')}</p>
            <h1>{session.name}</h1>
            <p>{session.email} · {session.joinedLabel || t('account.member')}</p>
            {photoError ? <p className="auth-modal-error">{photoError}</p> : null}
          </div>
          <button className="btn btn-ghost btn-explore" type="button" onClick={logout}>
            <LogoutIcon />
            {t('account.logout')}
          </button>
        </section>

        <section className="account-panel account-details">
          <div className="account-panel-head">
            <h2>{t('account.yourDetails')}</h2>
          </div>
          <form className="account-form" onSubmit={saveDetails}>
            <label>
              {t('account.displayName')}
              <input type="text" value={details.name} onChange={change('name')} required />
            </label>
            <label>
              {t('account.email')}
              <input type="email" value={details.email} onChange={change('email')} required />
            </label>
            <label>
              {t('account.dob')}
              <span className="account-datepicker">
                <CalendarIcon />
                <input
                  type="date"
                  value={details.dob}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={change('dob')}
                  onFocus={(event) => event.target.showPicker?.()}
                  onClick={(event) => event.target.showPicker?.()}
                />
              </span>
            </label>
            <label>
              {t('account.location')}
              <input type="text" value={details.location} onChange={change('location')} placeholder={t('account.cityPlaceholder')} />
            </label>
            <label>
              {t('account.language')}
              <LanguageSelect
                className="account-language"
                onChange={(id) => {
                  setDetails((current) => ({ ...current, language: id }));
                  updateProfile({ language: id });
                  setSaved('');
                }}
              />
            </label>
            <label className="account-form-wide">
              {t('account.bio')}
              <textarea
                rows="3"
                value={details.bio}
                onChange={change('bio')}
                placeholder={t('account.bioPlaceholder')}
              />
            </label>
            <div className="account-form-actions">
              <button className="btn btn-lime btn-explore" type="submit">{t('account.save')}</button>
              {saved ? <p>{saved}</p> : null}
            </div>
          </form>
        </section>

        <section className="account-stats" aria-label={t('account.reputation')}>
          <div>
            <span>{t('account.reputation')}</span>
            <strong>{stats.reputation}</strong>
            <em>{t('account.repNote')}</em>
          </div>
          <div>
            <span>{t('account.arguments')}</span>
            <strong>{stats.arguments}</strong>
            <em>{t('account.argNote')}</em>
          </div>
          <div>
            <span>{t('account.replies')}</span>
            <strong>{stats.replies}</strong>
            <em>{t('account.replyNote')}</em>
          </div>
          <div>
            <span>{t('account.essays')}</span>
            <strong>{stats.essays.length}</strong>
            <em>{t('account.essayNote')}</em>
          </div>
        </section>

        <div className="account-grid">
          <section className="account-panel">
            <div className="account-panel-head">
              <h2>{t('account.arguments')}</h2>
              <span>{argumentsOnly.length}</span>
            </div>
            <ol className="account-answers">
              {argumentsOnly.map((row) => (
                <li key={row.id}>
                  <strong className="account-points">{row.points}</strong>
                  <div>
                    <Link to={`/analysis/${row.essaySlug}`}>
                      {localizeArticle(getAnalysisArticle(row.essaySlug), t)?.cardTitle || row.essayTitle}
                    </Link>
                    <p>{row.text}</p>
                    <span>{t('account.agreeWhen', { agrees: row.agrees, when: row.when })}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="account-stack">
            <section className="account-panel">
              <div className="account-panel-head">
                <h2>{t('account.joinedEssays')}</h2>
                <span>{stats.essays.length}</span>
              </div>
              <ol className="account-essays">
                {stats.essays.map((essay) => (
                  <li key={essay.slug}>
                    <Link to={`/analysis/${essay.slug}`}>
                      {localizeArticle(getAnalysisArticle(essay.slug), t)?.cardTitle || essay.title}
                    </Link>
                    <p>
                      {t('account.joinedLine', { arguments: essay.arguments, replies: essay.replies, points: essay.points })}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="account-panel">
              <div className="account-panel-head">
                <h2>{t('account.replies')}</h2>
                <span>{repliesOnly.length}</span>
              </div>
              <ol className="account-answers">
                {repliesOnly.map((row) => (
                  <li key={row.id}>
                    <strong className="account-points">{row.points}</strong>
                    <div>
                      <Link to={`/analysis/${row.essaySlug}`}>
                        {localizeArticle(getAnalysisArticle(row.essaySlug), t)?.cardTitle || row.essayTitle}
                      </Link>
                      <p>{row.text}</p>
                      <span>{t('account.agreeWhen', { agrees: row.agrees, when: row.when })}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
