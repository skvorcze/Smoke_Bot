import * as THREE from 'three/webgpu';
import { createRenderer } from './renderer.js';
import { createGrassMesh, createGroundMesh, computeInit, computeUpdate } from './grassMaterial.js';
import { createPostProcessing } from './postprocessing.js';
import { setupMouseInteraction } from './mouseInteraction.js';
import { cameraPath, scrollState, lerpCam, initScrollTracking, updateScrollState } from './cameraPath.js';
import { isMobile, defaultDofEnabled } from './devicePresets.js';
import {
  camSphereWorld, camSphereRadius, camSphereStrength,
  grassDensity, windSpeed, windAmplitude,
  bladeWidth, bladeTipWidth, bladeHeight, bladeHeightVariation, bladeLean,
  noiseAmplitude, noiseFrequency, noise2Amplitude, noise2Frequency,
  mouseRadius, mouseStrength, outerRadius, outerStrength,
  bladeBaseColor, bladeTipColor, goldenTipColor, greenTipColor, midColor,
  bladeColorVariation, fogStart, fogEnd, fogIntensity, fogColor,
  focusDistanceU, focalLengthU, bokehScaleU,
  buildSkyTexture,
} from './uniforms.js';

// Mutable state the (lazy-loaded, dev-only) settings panel can reach into to
// preview a single stage instead of following scroll.
export const sceneState = {
  cameraOverrideStage: -1,
};

export async function createScene() {
  const scene = new THREE.Scene();
  scene.background = buildSkyTexture();
  scene.fog = new THREE.FogExp2('#000000', 0.035);

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 8, 18);
  camera.lookAt(0, 0, 0);

  const renderer = await createRenderer();
  document.body.appendChild(renderer.domElement);

  const grass = createGrassMesh();
  scene.add(grass);
  const ground = createGroundMesh();
  scene.add(ground);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.5);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  const { postProcessing, setDofEnabled } = createPostProcessing(renderer, scene, camera);
  let dofEnabled = defaultDofEnabled;
  setDofEnabled(dofEnabled);
  let globalDofEnabled = !isMobile;

  const mouse = setupMouseInteraction(camera);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 100);
  });

  initScrollTracking();

  await renderer.computeAsync(computeInit);

  renderer.domElement.style.opacity = '0';
  renderer.domElement.style.transition = 'opacity 0.4s ease';

  const clock = new THREE.Clock();
  const lookTarget = new THREE.Vector3();
  let autoFocusSmoothed = 10.0;

  function applyStageParams(p) {
    fogStart.value = p.fogStart;
    fogEnd.value = p.fogEnd;
    fogIntensity.value = p.fogIntensity;
    fogColor.value.setRGB(p.fogR, p.fogG, p.fogB);
    if (scene.fog) scene.fog.color.setRGB(p.fogR, p.fogG, p.fogB);
    grassDensity.value = p.grassDensity;
    bladeWidth.value = p.bladeWidth;
    bladeTipWidth.value = p.bladeTipWidth;
    bladeHeight.value = p.bladeHeight;
    bladeHeightVariation.value = p.bladeHeightVar;
    bladeLean.value = p.bladeLean;
    windSpeed.value = p.windSpeed;
    windAmplitude.value = p.windAmplitude;
    noiseAmplitude.value = p.noiseAmp;
    noiseFrequency.value = p.noiseFreq;
    noise2Amplitude.value = p.noise2Amp;
    noise2Frequency.value = p.noise2Freq;
    mouseRadius.value = p.mouseRadius;
    mouseStrength.value = p.mouseStrength;
    outerRadius.value = p.outerRadius;
    outerStrength.value = p.outerStrength;
    bladeBaseColor.value.setRGB(p.bladeBaseR, p.bladeBaseG, p.bladeBaseB);
    bladeTipColor.value.setRGB(p.bladeTipR, p.bladeTipG, p.bladeTipB);
    goldenTipColor.value.setRGB(p.goldenTipR, p.goldenTipG, p.goldenTipB);
    greenTipColor.value.setRGB(p.greenTipR, p.greenTipG, p.greenTipB);
    midColor.value.setRGB(p.midR, p.midG, p.midB);
    bladeColorVariation.value = p.colorVar;

    const camHeight = camera.position.y;
    const proximityT = Math.max(0, 1 - camHeight / 10);
    const proxCurve = proximityT * proximityT;
    camSphereWorld.value.set(camera.position.x, 0, camera.position.z);
    camSphereRadius.value = Math.min(15, p.camSphereRadius * (0.3 + proxCurve * 0.7));
    camSphereStrength.value = p.camSphereStrength * (0.1 + proxCurve * 0.9);
  }

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);

    updateScrollState(dt);

    const cam = sceneState.cameraOverrideStage >= 0 && sceneState.cameraOverrideStage < cameraPath.length
      ? lerpCam(cameraPath[sceneState.cameraOverrideStage][0])
      : lerpCam(scrollState.current);

    camera.position.set(cam.px, cam.py, cam.pz);
    lookTarget.set(cam.lx, cam.ly, cam.lz);
    camera.lookAt(lookTarget);

    if (cam.params) applyStageParams(cam.params);

    const dofWeight = typeof cam.dofOn === 'number' ? cam.dofOn : 1;
    const shouldDof = globalDofEnabled && dofWeight > 0.5;
    if (shouldDof !== dofEnabled) {
      dofEnabled = shouldDof;
      setDofEnabled(dofEnabled);
    }

    if (dofEnabled) {
      const autoWeight = typeof cam.af === 'number' ? Math.max(0, Math.min(1, cam.af)) : 0;
      const afSpeed = cam.afSpd || 5.0;
      const afMin = cam.afMin || 0.5;
      const afMax = cam.afMax || 40.0;

      let rawAutoFocus;
      if (mouse.isOnField()) {
        rawAutoFocus = mouse.getMouseFocusDist();
      } else {
        rawAutoFocus = Math.max(0.5, Math.sqrt(cam.py * cam.py + cam.pz * cam.pz) * 0.9);
      }
      rawAutoFocus = Math.max(afMin, Math.min(afMax, rawAutoFocus));
      autoFocusSmoothed += (rawAutoFocus - autoFocusSmoothed) * Math.min(1, dt * afSpeed);

      const targetFocus = cam.fd * (1 - autoWeight) + autoFocusSmoothed * autoWeight;
      focusDistanceU.value += (targetFocus - focusDistanceU.value) * Math.min(1, dt * 8);
      focalLengthU.value += (cam.fl - focalLengthU.value) * Math.min(1, dt * 6);
      bokehScaleU.value += (cam.bk - bokehScaleU.value) * Math.min(1, dt * 6);
    }

    renderer.compute(computeUpdate);
    postProcessing.render();
  }

  return {
    scene,
    camera,
    renderer,
    setGlobalDofEnabled: (v) => { globalDofEnabled = v; },
    revealCanvas: () => { renderer.domElement.style.opacity = '1'; },
    frame,
  };
}
