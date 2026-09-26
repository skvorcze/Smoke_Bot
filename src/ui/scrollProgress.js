import { scrollState } from '../scene/cameraPath.js';

export function initScrollProgress({ navFloat } = {}) {
  const progressBar = document.getElementById('progressBar');
  const scrollHint = document.querySelector('.scroll-hint');

  function tick() {
    const t = scrollState.current;
    if (progressBar) progressBar.style.width = `${t * 100}%`;
    if (navFloat) navFloat.classList.toggle('visible', t > 0.08);
    if (scrollHint) scrollHint.style.opacity = String(Math.max(0, 1 - t * 15));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function initRevealOnScroll() {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay || '0';
          el.classList.add('revealed', `delay-${delay}`);
          revealObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -18% 0px' },
  );

  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

  setTimeout(() => {
    const hint = document.querySelector('.scroll-hint');
    if (hint && !hint.classList.contains('revealed')) {
      hint.classList.add('revealed', 'delay-4');
    }
  }, 800);

  return revealObserver;
}

// Re-observes elements that were re-rendered after content changed language
// (e.g. the project cards), so their reveal animation still fires once.
export function observeReveal(observer, root = document) {
  root.querySelectorAll('[data-reveal]:not(.revealed)').forEach((el) => observer.observe(el));
}
