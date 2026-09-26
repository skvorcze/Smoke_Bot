import { copy } from './copy.js';

const STORAGE_KEY = 'skvorcze-lang';

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function detectInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    /* localStorage unavailable (private mode etc.) — fall through */
  }
  return navigator.language && navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

let currentLang = detectInitialLang();
const listeners = new Set();

export function getCurrentLang() {
  return currentLang;
}

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyLanguage(lang) {
  currentLang = copy[lang] ? lang : 'en';
  const dict = copy[currentLang];

  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const path = el.getAttribute('data-i18n');
    const value = getPath(dict, path);
    if (value != null) el.innerHTML = value;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const spec = el.getAttribute('data-i18n-attr');
    spec.split(';').forEach((pair) => {
      const [attr, path] = pair.split(':').map((s) => s.trim());
      const value = attr && path ? getPath(dict, path) : null;
      if (value != null) el.setAttribute(attr, value);
    });
  });

  try {
    localStorage.setItem(STORAGE_KEY, currentLang);
  } catch {
    /* ignore */
  }

  listeners.forEach((fn) => fn(currentLang));
}

export function initI18n() {
  applyLanguage(currentLang);
}

export function toggleLanguage() {
  applyLanguage(currentLang === 'en' ? 'ru' : 'en');
}
