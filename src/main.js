import './styles/base.css';
import './styles/nav.css';
import './styles/sections.css';
import './styles/form.css';
import './styles/panel.css';

import { isWebGPUSupported } from './scene/renderer.js';
import { initI18n } from './content/i18n.js';
import { copy } from './content/copy.js';
import { getCurrentLang, onLanguageChange } from './content/i18n.js';
import { TELEGRAM_URL, RESUME_URL } from './content/config.js';
import { initNav } from './ui/nav.js';
import { initScrollProgress, initRevealOnScroll, observeReveal } from './ui/scrollProgress.js';
import { initLangToggle } from './ui/langToggle.js';
import { initContactForm } from './ui/contactForm.js';
import { initProjectsGrid } from './ui/projectsGrid.js';

function wireStaticLinks() {
  const telegram = document.getElementById('telegramLink');
  if (telegram) telegram.href = TELEGRAM_URL;
  const resume = document.getElementById('resumeLink');
  if (resume) resume.href = RESUME_URL;
}

function showWebGPUFallback() {
  document.body.classList.add('webgpu-fallback-bg');
  const notice = document.createElement('div');
  notice.className = 'webgpu-notice';
  const dict = copy[getCurrentLang()] || copy.en;
  notice.innerHTML = `<span>${dict.webgpuNotice}</span><button type="button" aria-label="Dismiss">✕</button>`;
  document.body.appendChild(notice);
  notice.querySelector('button').addEventListener('click', () => notice.remove());
  onLanguageChange((lang) => {
    const span = notice.querySelector('span');
    if (span) span.textContent = (copy[lang] || copy.en).webgpuNotice;
  });
}

async function boot() {
  initI18n();
  wireStaticLinks();
  const { navFloat } = initNav();
  initLangToggle();
  initContactForm();
  const revealObserver = initRevealOnScroll();
  initProjectsGrid((grid) => observeReveal(revealObserver, grid));

  if (!isWebGPUSupported()) {
    showWebGPUFallback();
    initScrollProgress({ navFloat });
    return;
  }

  try {
    const { createScene } = await import('./scene/index.js');
    const sceneCtx = await createScene();

    initScrollProgress({ navFloat });

    // Warm up a few frames before revealing, to avoid a first-frame stutter.
    for (let i = 0; i < 3; i++) {
      sceneCtx.frame();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => requestAnimationFrame(r));
    }
    sceneCtx.revealCanvas();
    sceneCtx.renderer.setAnimationLoop(sceneCtx.frame);

    window.addEventListener('keydown', async (e) => {
      if ((e.key === 's' || e.key === 'S') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        const { mountSettingsPanel } = await import('./ui/settingsPanel.js');
        mountSettingsPanel({
          scene: sceneCtx.scene,
          camera: sceneCtx.camera,
          setGlobalDofEnabled: sceneCtx.setGlobalDofEnabled,
        });
      }
    }, { once: true });
  } catch (err) {
    // WebGPU reported support but scene init failed (driver quirk, etc.) — fail soft.
    console.error('Scene init failed, falling back to static background.', err);
    showWebGPUFallback();
    initScrollProgress({ navFloat });
  }
}

boot();
