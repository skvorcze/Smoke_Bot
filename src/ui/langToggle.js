import { getCurrentLang, toggleLanguage, onLanguageChange } from '../content/i18n.js';

export function initLangToggle() {
  const btn = document.getElementById('langToggle');
  if (!btn) return;

  function render(lang) {
    btn.textContent = lang === 'ru' ? 'EN' : 'RU';
    btn.setAttribute('aria-label', lang === 'ru' ? 'Switch to English' : 'Переключить на русский');
  }

  render(getCurrentLang());
  onLanguageChange(render);

  btn.addEventListener('click', () => toggleLanguage());
}
