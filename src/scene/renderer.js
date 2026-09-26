import * as THREE from 'three/webgpu';
import { getMaxDPR } from './devicePresets.js';

export function isWebGPUSupported() {
  return typeof navigator !== 'undefined' && !!navigator.gpu;
}

export async function createRenderer() {
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(getMaxDPR());
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  await renderer.init();
  return renderer;
}
