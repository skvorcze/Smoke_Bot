import { STAGE_NAMES, stageParams, stageParamKeys } from './stages.js';

// Per-stage camera path with full DoF settings.
// [scroll, posX, posY, posZ, lookX, lookY, lookZ, focusDist, autoFocus, dofOn, focalLen, bokehScale, afSpeed, afMin, afMax]
//  0       1     2     3     4      5      6      7          8          9      10        11          12       13     14
export const cameraPath = [
  [0.00, -2.8, 7.2, 19.6, 0.5, 1.5, 0.4, 22.0, 1, 1, 10.0, 12.5, 5.0, 1.0, 40.0], // Hero
  [0.14, 0, 2.2, 14.0, 0, -2.0, 0, 15.0, 1, 1, 8.0, 10.0, 5.0, 1.0, 30.0], // Manifesto
  [0.28, 7.5, 10.9, 15.8, 0, 0.0, 0.7, 10.0, 1, 1, 6.0, 8.0, 5.0, 0.5, 20.0], // Pillars
  [0.43, -8.0, 6.8, 21.6, 0, 0.2, 0, 7.0, 1, 1, 5.0, 10.0, 5.0, 0.5, 15.0], // Projects
  [0.57, -1.0, 5.3, 25.0, -1.2, 3.0, 0, 5.0, 1, 1, 4.0, 14.0, 6.0, 1.1, 21.5], // Quote
  [0.78, -1.6, 2.4, 0.0, -1.2, -2.0, 0.0, 16.4, 1, 0, 20.0, 18.0, 19.0, 2.8, 12.5], // CTA
  [1.00, 0, 15.0, 0.0, -5, 3.0, -5, 9.8, 1, 1, 13.8, 0.0, 17.5, 1.2, 9.0], // Footer
];

// Smoothed scroll progress, shared with the UI layer (progress bar, nav
// visibility, scroll-hint fade) so everything stays in lockstep with the
// camera without the UI needing to know about the renderer.
export const scrollState = { current: 0, target: 0 };

let scrollDirty = true;

export function getScrollProgress() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const scrollable = docHeight - winHeight;
  return scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;
}

// Aligns each keyframe's scroll fraction to where its section actually sits
// in the document, so the camera choreography tracks real layout/content
// height rather than hardcoded guesses.
export function syncCameraPathToDOM() {
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const scrollable = docHeight - winHeight;
  if (scrollable <= 0) return;
  cameraPath.forEach((kf, i) => {
    const section = document.querySelector(`.section[data-stage="${i}"]`);
    if (section) {
      kf[0] = Math.min(1, Math.max(0, section.offsetTop / scrollable));
    }
  });
  cameraPath[cameraPath.length - 1][0] = 1.0;
}

export function initScrollTracking() {
  syncCameraPathToDOM();
  window.addEventListener('scroll', () => { scrollDirty = true; }, { passive: true });
  window.addEventListener('touchmove', () => { scrollDirty = true; }, { passive: true });
  window.addEventListener('resize', () => setTimeout(syncCameraPathToDOM, 100));
  window.addEventListener('load', () => {
    setTimeout(syncCameraPathToDOM, 200);
    setTimeout(syncCameraPathToDOM, 1000);
  });
}

export function updateScrollState(dt) {
  if (scrollDirty) {
    scrollState.target = getScrollProgress();
    scrollDirty = false;
  }
  scrollState.current += (scrollState.target - scrollState.current) * Math.min(1, dt * 6);
}

export function lerpCam(scrollT) {
  const snapThreshold = 0.005;
  for (let j = 0; j < cameraPath.length; j++) {
    if (Math.abs(cameraPath[j][0] - scrollT) < snapThreshold) {
      const kf = cameraPath[j];
      return {
        px: kf[1], py: kf[2], pz: kf[3],
        lx: kf[4], ly: kf[5], lz: kf[6],
        fd: kf[7], af: kf[8], dofOn: kf[9],
        fl: kf[10], bk: kf[11],
        afSpd: kf[12], afMin: kf[13], afMax: kf[14],
        params: { ...stageParams[j] },
      };
    }
  }

  let i = 0;
  for (let j = 1; j < cameraPath.length; j++) {
    if (cameraPath[j][0] >= scrollT) { i = j - 1; break; }
    if (j === cameraPath.length - 1) i = j - 1;
  }
  const a = cameraPath[i];
  const b = cameraPath[Math.min(i + 1, cameraPath.length - 1)];
  const range = b[0] - a[0];
  const t = range > 0 ? Math.max(0, Math.min(1, (scrollT - a[0]) / range)) : 0;
  const ease = t * t * (3 - 2 * t);

  const iB = Math.min(i + 1, cameraPath.length - 1);
  const pA = stageParams[i];
  const pB = stageParams[iB];
  const lerpedParams = {};
  stageParamKeys.forEach((k) => {
    lerpedParams[k] = pA[k] + (pB[k] - pA[k]) * ease;
  });

  return {
    px: a[1] + (b[1] - a[1]) * ease,
    py: a[2] + (b[2] - a[2]) * ease,
    pz: a[3] + (b[3] - a[3]) * ease,
    lx: a[4] + (b[4] - a[4]) * ease,
    ly: a[5] + (b[5] - a[5]) * ease,
    lz: a[6] + (b[6] - a[6]) * ease,
    fd: a[7] + (b[7] - a[7]) * ease,
    af: a[8] + (b[8] - a[8]) * ease,
    dofOn: a[9] + (b[9] - a[9]) * ease,
    fl: a[10] + (b[10] - a[10]) * ease,
    bk: a[11] + (b[11] - a[11]) * ease,
    afSpd: a[12] + (b[12] - a[12]) * ease,
    afMin: a[13] + (b[13] - a[13]) * ease,
    afMax: a[14] + (b[14] - a[14]) * ease,
    params: lerpedParams,
  };
}

export { STAGE_NAMES };
