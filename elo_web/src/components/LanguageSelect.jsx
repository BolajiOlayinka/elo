import { useLanguage } from '../i18n/LanguageProvider.jsx';

export function LanguageSelect({ className = '', onChange }) {
  const { language, languages, setLanguage, t } = useLanguage();

  function change(id) {
    setLanguage(id);
    onChange?.(id);
  }

  return (
    <label className={`language-select ${className}`.trim()}>
      <span className="sr-only">{t('nav.language')}</span>
      <select
        value={language}
        aria-label={t('nav.language')}
        onChange={(event) => change(event.target.value)}
      >
        {languages.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
