import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, readStoredLanguage, writeStoredLanguage } from './languages.js';
import { TRANSLATIONS } from './translations.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const table = TRANSLATIONS[language] || TRANSLATIONS.en;

    function t(key, vars) {
      const fallback = typeof vars === 'string' ? vars : null;
      let text = table[key] ?? TRANSLATIONS.en[key] ?? fallback ?? key;

      if (vars && typeof vars === 'object') {
        Object.entries(vars).forEach(([name, value]) => {
          text = text.replaceAll(`{${name}}`, String(value));
        });
      }

      return text;
    }

    function setLanguage(id) {
      if (!LANGUAGES.some((item) => item.id === id)) {
        return;
      }

      writeStoredLanguage(id);
      setLanguageState(id);
    }

    return { language, languages: LANGUAGES, setLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage needs LanguageProvider');
  }

  return context;
}
