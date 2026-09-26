// Per-stage (per-section) scene parameters: color palette, fog, grass shape.
// This is the "content" half of the scene — cameraPath.js interpolates between
// these per-stage snapshots based on scroll progress. The dev settings panel's
// "Copy JSON" output maps back onto STAGE_PARAM_OVERRIDES below for hand-tuning.
import {
  fogStart, fogEnd, fogIntensity,
  grassDensity, bladeWidth, bladeTipWidth, bladeHeight, bladeHeightVariation, bladeLean,
  windSpeed, windAmplitude,
  noiseAmplitude, noiseFrequency, noise2Amplitude, noise2Frequency,
  mouseRadius, mouseStrength, outerRadius, outerStrength,
  bladeColorVariation, colorUniformMap,
} from './uniforms.js';

// Section order mirrors index.html's data-stage attributes.
export const STAGE_NAMES = ['Hero', 'Manifesto', 'Pillars', 'Projects', 'Quote', 'CTA', 'Footer'];

// Each key maps to a live TSL uniform (u) plus slider bounds for the dev panel.
export const stageParamDefs = {
  // Fog
  fogStart: { u: fogStart, def: 6.5, min: 0, max: 20, step: 0.5, label: 'Fog Start', group: 'Fog' },
  fogEnd: { u: fogEnd, def: 12.0, min: 1, max: 30, step: 0.5, label: 'Fog End', group: 'Fog' },
  fogIntensity: { u: fogIntensity, def: 1.0, min: 0, max: 1, step: 0.01, label: 'Fog Intensity', group: 'Fog' },
  fogR: { def: 0, min: 0, max: 1, step: 0.01, label: 'Fog Red', group: 'Fog', isColor: 'fogColor', ch: 'r' },
  fogG: { def: 0, min: 0, max: 1, step: 0.01, label: 'Fog Green', group: 'Fog', isColor: 'fogColor', ch: 'g' },
  fogB: { def: 0, min: 0, max: 1, step: 0.01, label: 'Fog Blue', group: 'Fog', isColor: 'fogColor', ch: 'b' },
  // Grass
  grassDensity: { u: grassDensity, def: 1.0, min: 0, max: 1, step: 0.01, label: 'Density', group: 'Grass' },
  bladeWidth: { u: bladeWidth, def: 4.0, min: 0.2, max: 4, step: 0.05, label: 'Blade Width', group: 'Grass' },
  bladeTipWidth: { u: bladeTipWidth, def: 0.19, min: 0, max: 1, step: 0.01, label: 'Tip Width', group: 'Grass' },
  bladeHeight: { u: bladeHeight, def: 1.6, min: 0.1, max: 2, step: 0.05, label: 'Blade Height', group: 'Grass' },
  bladeHeightVar: { u: bladeHeightVariation, def: 0.5, min: 0, max: 1, step: 0.01, label: 'Height Var', group: 'Grass' },
  bladeLean: { u: bladeLean, def: 1.1, min: 0, max: 3, step: 0.05, label: 'Lean', group: 'Grass' },
  // Wind
  windSpeed: { u: windSpeed, def: 1.3, min: 0, max: 5, step: 0.1, label: 'Wind Speed', group: 'Wind' },
  windAmplitude: { u: windAmplitude, def: 0.21, min: 0, max: 1, step: 0.01, label: 'Wind Amp', group: 'Wind' },
  // Noise
  noiseAmp: { u: noiseAmplitude, def: 1.85, min: 0, max: 4, step: 0.05, label: 'Noise Amp', group: 'Noise' },
  noiseFreq: { u: noiseFrequency, def: 0.3, min: 0.01, max: 1, step: 0.01, label: 'Noise Freq', group: 'Noise' },
  noise2Amp: { u: noise2Amplitude, def: 0.2, min: 0, max: 1, step: 0.01, label: 'Detail Amp', group: 'Noise' },
  noise2Freq: { u: noise2Frequency, def: 15, min: 1, max: 30, step: 0.5, label: 'Detail Freq', group: 'Noise' },
  // Mouse sphere
  mouseRadius: { u: mouseRadius, def: 6.1, min: 0.5, max: 8, step: 0.1, label: 'Mouse Radius', group: 'Mouse Sphere' },
  mouseStrength: { u: mouseStrength, def: 4.0, min: 0, max: 5, step: 0.1, label: 'Mouse Strength', group: 'Mouse Sphere' },
  outerRadius: { u: outerRadius, def: 9.4, min: 1, max: 12, step: 0.1, label: 'Outer Radius', group: 'Mouse Sphere' },
  outerStrength: { u: outerStrength, def: 1.45, min: 0, max: 3, step: 0.05, label: 'Outer Strength', group: 'Mouse Sphere' },
  // Camera sphere (applied with extra proximity scaling in cameraPath.js)
  camSphereRadius: { def: 15.0, min: 1, max: 15, step: 0.1, label: 'Cam Radius', group: 'Camera Sphere', noDirect: true },
  camSphereStrength: { def: 5.9, min: 0, max: 6, step: 0.1, label: 'Cam Strength', group: 'Camera Sphere', noDirect: true },
  // Scene colors — blade base
  bladeBaseR: { def: 0.055, min: 0, max: 1, step: 0.01, label: 'Base Red', group: 'Scene Colors', isColor: 'bladeBaseColor', ch: 'r' },
  bladeBaseG: { def: 0.118, min: 0, max: 1, step: 0.01, label: 'Base Green', group: 'Scene Colors', isColor: 'bladeBaseColor', ch: 'g' },
  bladeBaseB: { def: 0.016, min: 0, max: 1, step: 0.01, label: 'Base Blue', group: 'Scene Colors', isColor: 'bladeBaseColor', ch: 'b' },
  // Scene colors — blade tip
  bladeTipR: { def: 0.784, min: 0, max: 1, step: 0.01, label: 'Tip Red', group: 'Scene Colors', isColor: 'bladeTipColor', ch: 'r' },
  bladeTipG: { def: 0.722, min: 0, max: 1, step: 0.01, label: 'Tip Green', group: 'Scene Colors', isColor: 'bladeTipColor', ch: 'g' },
  bladeTipB: { def: 0.251, min: 0, max: 1, step: 0.01, label: 'Tip Blue', group: 'Scene Colors', isColor: 'bladeTipColor', ch: 'b' },
  // Scene colors — golden tip
  goldenTipR: { def: 0.831, min: 0, max: 1, step: 0.01, label: 'Gold Tip R', group: 'Scene Colors', isColor: 'goldenTipColor', ch: 'r' },
  goldenTipG: { def: 0.722, min: 0, max: 1, step: 0.01, label: 'Gold Tip G', group: 'Scene Colors', isColor: 'goldenTipColor', ch: 'g' },
  goldenTipB: { def: 0.220, min: 0, max: 1, step: 0.01, label: 'Gold Tip B', group: 'Scene Colors', isColor: 'goldenTipColor', ch: 'b' },
  // Scene colors — green tip
  greenTipR: { def: 0.290, min: 0, max: 1, step: 0.01, label: 'Green Tip R', group: 'Scene Colors', isColor: 'greenTipColor', ch: 'r' },
  greenTipG: { def: 0.478, min: 0, max: 1, step: 0.01, label: 'Green Tip G', group: 'Scene Colors', isColor: 'greenTipColor', ch: 'g' },
  greenTipB: { def: 0.078, min: 0, max: 1, step: 0.01, label: 'Green Tip B', group: 'Scene Colors', isColor: 'greenTipColor', ch: 'b' },
  // Scene colors — mid tone
  midR: { def: 0.176, min: 0, max: 1, step: 0.01, label: 'Mid Tone R', group: 'Scene Colors', isColor: 'midColor', ch: 'r' },
  midG: { def: 0.306, min: 0, max: 1, step: 0.01, label: 'Mid Tone G', group: 'Scene Colors', isColor: 'midColor', ch: 'g' },
  midB: { def: 0.055, min: 0, max: 1, step: 0.01, label: 'Mid Tone B', group: 'Scene Colors', isColor: 'midColor', ch: 'b' },
  // Color variation
  colorVar: { u: bladeColorVariation, def: 0.93, min: 0, max: 1, step: 0.01, label: 'Color Var', group: 'Scene Colors' },
};

export const stageParamKeys = Object.keys(stageParamDefs);

function getDefaultParams() {
  const p = {};
  stageParamKeys.forEach((k) => {
    const d = stageParamDefs[k];
    if (d.isColor && d.ch) {
      const cu = colorUniformMap[d.isColor];
      p[k] = cu ? cu.value[d.ch] : d.def;
    } else {
      p[k] = d.def;
    }
  });
  return p;
}

// One params snapshot per stage, starting from defaults.
export const stageParams = STAGE_NAMES.map(() => getDefaultParams());

// Hand-authored per-stage overrides (colors etc.) — reframed from the reference
// prototype's palette (kept close to the original for visual continuity).
const STAGE_PARAM_OVERRIDES = [
  // Hero (0)
  { bladeBaseR: 0.0044, bladeBaseG: 0.013, bladeBaseB: 0.0012, bladeTipR: 0.5776, bladeTipG: 0.4793, bladeTipB: 0.0513, goldenTipR: 0.6584, goldenTipG: 0.4793, goldenTipB: 0.0395, greenTipR: 0.0685, greenTipG: 0.1946, greenTipB: 0.0070, midR: 0.0262, midG: 0.0762, midB: 0.0044 },
  // Manifesto (1) — same palette as hero
  { bladeBaseR: 0.0044, bladeBaseG: 0.013, bladeBaseB: 0.0012, bladeTipR: 0.5776, bladeTipG: 0.4793, bladeTipB: 0.0513, goldenTipR: 0.6584, goldenTipG: 0.4793, goldenTipB: 0.0395, greenTipR: 0.0685, greenTipG: 0.1946, greenTipB: 0.0070, midR: 0.0262, midG: 0.0762, midB: 0.0044 },
  // Pillars (2) — warmer, higher color variation for the Cultivate/Craft/Grow triad
  { bladeBaseR: 0, bladeBaseG: 0.013, bladeBaseB: 0.0012, bladeTipR: 0.898, bladeTipG: 0.804, bladeTipB: 0.804, goldenTipR: 0.6627, goldenTipG: 0.2863, goldenTipB: 0.0392, greenTipR: 0.1922, greenTipG: 0.1529, greenTipB: 0.0078, midR: 0.0745, midG: 0.0078, midB: 0.0039, colorVar: 1 },
  // Projects (3) — taller, fuller field for the project showcase
  { fogStart: 0, fogEnd: 12.5, bladeHeight: 2, bladeHeightVar: 1, bladeLean: 0, windSpeed: 1.3, windAmplitude: 0.21, bladeBaseR: 0.0044, bladeBaseG: 0.013, bladeBaseB: 0.0012, bladeTipR: 0.5776, bladeTipG: 0.4793, bladeTipB: 0.0513, goldenTipR: 0.6584, goldenTipG: 0.4793, goldenTipB: 0.0395, greenTipR: 0.0685, greenTipG: 0.1946, greenTipB: 0.0070, midR: 0.0262, midG: 0.0762, midB: 0.0044 },
  // Quote (4) — same palette
  { bladeBaseR: 0.0044, bladeBaseG: 0.013, bladeBaseB: 0.0012, bladeTipR: 0.5776, bladeTipG: 0.4793, bladeTipB: 0.0513, goldenTipR: 0.6584, goldenTipG: 0.4793, goldenTipB: 0.0395, greenTipR: 0.0685, greenTipG: 0.1946, greenTipB: 0.0070, midR: 0.0262, midG: 0.0762, midB: 0.0044 },
  // CTA (5) — shorter grass, no lean, pulled-in fog
  { fogStart: 7, bladeTipWidth: 0.27, bladeHeight: 0.9, bladeHeightVar: 0, bladeLean: 0, bladeBaseR: 0.0044, bladeBaseG: 0.013, bladeBaseB: 0.0012, bladeTipR: 0.5776, bladeTipG: 0.4793, bladeTipB: 0.0513, goldenTipR: 0.6584, goldenTipG: 0.4793, goldenTipB: 0.0395, greenTipR: 0.0685, greenTipG: 0.1946, greenTipB: 0.0070, midR: 0.0262, midG: 0.0762, midB: 0.0044 },
  // Footer (6) — darker, muted
  { fogStart: 2, fogEnd: 10, bladeHeight: 2, bladeHeightVar: 0, bladeLean: 0, windSpeed: 1.3, windAmplitude: 0.21, bladeBaseR: 0, bladeBaseG: 0.013, bladeBaseB: 0.0012, bladeTipR: 0.3294, bladeTipG: 0.3059, bladeTipB: 0.0510, goldenTipR: 0.6588, goldenTipG: 0.4784, goldenTipB: 0.0392, greenTipR: 0.0667, greenTipG: 0.1961, greenTipB: 0.0078, midR: 0, midG: 0, midB: 0 },
];

STAGE_PARAM_OVERRIDES.forEach((overrides, i) => {
  Object.keys(overrides).forEach((k) => {
    if (k in stageParams[i]) stageParams[i][k] = overrides[k];
  });
});
