export const isMobile = window.innerWidth < 768;

export function getMaxDPR() {
  return window.innerWidth < 1200 ? 1.5 : Math.min(window.devicePixelRatio, 2);
}

const BASE_BLADE_COUNT = 120000;

export function getBladeCount() {
  if (isMobile) return Math.round(BASE_BLADE_COUNT * 0.4);
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  if (cores <= 4 || mem <= 4) return Math.round(BASE_BLADE_COUNT * 0.6);
  return BASE_BLADE_COUNT;
}

export const defaultDofEnabled = !isMobile;
