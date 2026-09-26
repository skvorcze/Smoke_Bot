export function initNav() {
  const navFloat = document.getElementById('navFloat');
  const navHamburger = document.getElementById('navHamburger');
  const navMobileOverlay = document.getElementById('navMobileOverlay');

  function scrollToStage(stageIdx) {
    const section = document.querySelector(`.section[data-stage="${stageIdx}"]`);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToStage(parseInt(link.dataset.nav, 10));
    });
  });

  document.querySelectorAll('[data-nav-mobile]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navHamburger.classList.remove('open');
      navMobileOverlay.classList.remove('open');
      scrollToStage(parseInt(link.dataset.navMobile, 10));
    });
  });

  navHamburger.addEventListener('click', () => {
    navHamburger.classList.toggle('open');
    navMobileOverlay.classList.toggle('open');
  });

  return { navFloat };
}
