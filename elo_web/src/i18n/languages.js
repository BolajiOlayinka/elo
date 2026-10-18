export const LANG_KEY = 'elo-web-lang-v1';

export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
  { id: 'de', label: 'Deutsch' },
  { id: 'pt', label: 'Português' }
];

export function isLanguage(id) {
  return LANGUAGES.some((item) => item.id === id);
}

export function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return isLanguage(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

export function writeStoredLanguage(id) {
  localStorage.setItem(LANG_KEY, id);
}
