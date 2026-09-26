// Single source of truth for every mutable TSL uniform() in the scene.
// grassMaterial.js, postprocessing.js, cameraPath.js and (dev-only) settingsPanel.js
// all import and mutate these same instances.
import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';

// ─── Mouse / camera interaction ──────────────────────────────────────
export const mouseWorld = uniform(new THREE.Vector3(99999, 0, 99999));
export const mouseRadius = uniform(6.1);
export const mouseStrength = uniform(4.0);
export const outerRadius = uniform(9.4);
export const outerStrength = uniform(1.45);
export const camSphereWorld = uniform(new THREE.Vector3(99999, 0, 99999));
export const camSphereRadius = uniform(15.0);
export const camSphereStrength = uniform(5.9);

// ─── Grass shape / behavior ──────────────────────────────────────────
export const grassDensity = uniform(1.0);
export const windSpeed = uniform(1.3);
export const windAmplitude = uniform(0.21);
export const bladeWidth = uniform(4.0);
export const bladeTipWidth = uniform(0.19);
export const bladeHeight = uniform(1.6);
export const bladeHeightVariation = uniform(0.5);
export const bladeLean = uniform(1.1);
export const noiseAmplitude = uniform(1.85);
export const noiseFrequency = uniform(0.3);
export const noise2Amplitude = uniform(0.2);
export const noise2Frequency = uniform(15);
export const bladeColorVariation = uniform(0.93);
export const groundRadius = uniform(13.8);
export const groundFalloff = uniform(2.4);

// ─── Colors ───────────────────────────────────────────────────────────
export const BLADE_BASE_HEX = '#0e1e04';
export const BLADE_TIP_HEX = '#c8b840';
export const BACKGROUND_HEX = '#000000';
export const GROUND_HEX = '#000000';

export const bladeBaseColor = uniform(new THREE.Color(BLADE_BASE_HEX));
export const bladeTipColor = uniform(new THREE.Color(BLADE_TIP_HEX));
export const backgroundColor = uniform(new THREE.Color(BACKGROUND_HEX));
export const groundColor = uniform(new THREE.Color(GROUND_HEX));
export const goldenTipColor = uniform(new THREE.Color('#d4b838'));
export const greenTipColor = uniform(new THREE.Color('#4a7a14'));
export const midColor = uniform(new THREE.Color('#2d4e0e'));

// ─── Fog ──────────────────────────────────────────────────────────────
export const fogStart = uniform(6.5);
export const fogEnd = uniform(12.0);
export const fogIntensity = uniform(1.0);
export const fogColor = uniform(new THREE.Color('#000000'));

// ─── Depth of field ───────────────────────────────────────────────────
export const focusDistanceU = uniform(31.83);
export const focalLengthU = uniform(10.0);
export const bokehScaleU = uniform(12.5);

// Lookup used by stages.js / settingsPanel.js to apply interpolated color channels
export const colorUniformMap = {
  fogColor,
  bladeBaseColor,
  bladeTipColor,
  goldenTipColor,
  greenTipColor,
  midColor,
};

// Sky gradient stops are plain THREE.Color (baked into a canvas texture, not a TSL uniform)
export const skyColors = {
  top: new THREE.Color('#000000'),
  midHigh: new THREE.Color('#000000'),
  midLow: new THREE.Color('#000000'),
  horizon: new THREE.Color('#000000'),
};

export function buildSkyTexture() {
  const w = 2;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#' + skyColors.top.getHexString());
  grad.addColorStop(0.35, '#' + skyColors.midHigh.getHexString());
  grad.addColorStop(0.65, '#' + skyColors.midLow.getHexString());
  grad.addColorStop(1.0, '#' + skyColors.horizon.getHexString());
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
