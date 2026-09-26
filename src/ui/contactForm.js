import { FORMSPREE_FORM_ID } from '../content/config.js';
import { copy } from '../content/copy.js';
import { getCurrentLang } from '../content/i18n.js';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const nameInput = form.querySelector('[name="name"]');
  const emailInput = form.querySelector('[name="email"]');
  const messageInput = form.querySelector('[name="message"]');
  const statusEl = form.querySelector('.form-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  function t(key) {
    const dict = copy[getCurrentLang()] || copy.en;
    return dict.footer[key];
  }

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `form-status ${kind || ''}`.trim();
  }

  function validate() {
    if (!nameInput.value.trim()) {
      setStatus(t('formNameError'), 'error');
      nameInput.focus();
      return false;
    }
    if (!isValidEmail(emailInput.value.trim())) {
      setStatus(t('formEmailError'), 'error');
      emailInput.focus();
      return false;
    }
    if (messageInput.value.trim().length < 5) {
      setStatus(t('formMessageError'), 'error');
      messageInput.focus();
      return false;
    }
    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');
    if (!validate()) return;

    if (FORMSPREE_FORM_ID === 'REPLACE_ME') {
      setStatus('Formspree form ID not configured yet — see content/config.js.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = t('formSending');

    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (response.ok) {
        setStatus(t('formSuccess'), 'success');
        form.reset();
      } else {
        setStatus(t('formError'), 'error');
      }
    } catch {
      setStatus(t('formError'), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText;
    }
  });
}
