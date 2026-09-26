import * as THREE from 'three/webgpu';
import {
  Fn, float, vec3, instanceIndex, uv,
  positionGeometry, positionWorld, sin, cos, pow, smoothstep, mix,
  sqrt, select, hash, time, deltaTime, PI, mx_noise_float,
} from 'three/tsl';
import { BLADE_COUNT, FIELD_SIZE, bladeData, bendState, bladeBound, createBladeGeometry } from './grassGeometry.js';
import {
  mouseWorld, mouseRadius, mouseStrength,
  outerRadius, outerStrength,
  camSphereWorld, camSphereRadius, camSphereStrength,
  grassDensity, windSpeed, windAmplitude,
  bladeWidth, bladeTipWidth, bladeHeight, bladeHeightVariation, bladeLean,
  noiseAmplitude, noiseFrequency, noise2Amplitude, noise2Frequency,
  bladeColorVariation, groundRadius, groundFalloff,
  bladeBaseColor, bladeTipColor, backgroundColor, groundColor,
  goldenTipColor, greenTipColor, midColor,
  fogStart, fogEnd, fogIntensity, fogColor,
} from './uniforms.js';

export const noise2D = Fn(([x, z]) => mx_noise_float(vec3(x, float(0), z)).mul(0.5).add(0.5));

// ─── Compute Init — runs once at boot, seeds each blade's field position ──
export const computeInit = Fn(() => {
  const blade = bladeData.element(instanceIndex);
  const cols = Math.round(Math.sqrt(BLADE_COUNT));
  const col = instanceIndex.mod(cols);
  const row = instanceIndex.div(cols);
  const jx = hash(instanceIndex).sub(0.5);
  const jz = hash(instanceIndex.add(7919)).sub(0.5);
  const wx = col.toFloat().add(jx).div(float(cols)).sub(0.5).mul(FIELD_SIZE);
  const wz = row.toFloat().add(jz).div(float(cols)).sub(0.5).mul(FIELD_SIZE);
  blade.x.assign(wx);
  blade.y.assign(wz);
  blade.z.assign(hash(instanceIndex.add(1337)).mul(PI.mul(2)));
  const n1 = noise2D(wx.mul(noiseFrequency), wz.mul(noiseFrequency));
  const n2 = noise2D(
    wx.mul(noiseFrequency.mul(noise2Frequency)).add(50),
    wz.mul(noiseFrequency.mul(noise2Frequency)).add(50),
  );
  const clump = n1.mul(noiseAmplitude).sub(noise2Amplitude).add(n2.mul(noise2Amplitude).mul(2)).max(0);
  blade.w.assign(clump);
  const dist = sqrt(wx.mul(wx).add(wz.mul(wz)));
  const edgeNoise = noise2D(wx.mul(0.25).add(100), wz.mul(0.25).add(100));
  const maxR = float(12.0).add(edgeNoise.sub(0.5).mul(6.0));
  const boundary = float(1).sub(smoothstep(maxR.sub(1.5), maxR, dist));
  bladeBound.element(instanceIndex).assign(select(boundary.lessThan(0.05), float(0), boundary));
})().compute(BLADE_COUNT);

// ─── Compute Update — runs every frame, wind + mouse/camera push ─────────
export const computeUpdate = Fn(() => {
  const blade = bladeData.element(instanceIndex);
  const bend = bendState.element(instanceIndex);
  const bx = blade.x;
  const bz = blade.y;

  const w1 = sin(bx.mul(0.35).add(bz.mul(0.12)).add(time.mul(windSpeed)));
  const w2 = sin(bx.mul(0.18).add(bz.mul(0.28)).add(time.mul(windSpeed.mul(0.67))).add(1.7));
  const windX = w1.add(w2).mul(windAmplitude);
  const windZ = w1.sub(w2).mul(windAmplitude.mul(0.55));

  const lw = deltaTime.mul(4.0).saturate();
  bend.x.assign(mix(bend.x, windX, lw));
  bend.y.assign(mix(bend.y, windZ, lw));

  // Mouse push
  const dx = bx.sub(mouseWorld.x);
  const dz = bz.sub(mouseWorld.z);
  const dist = sqrt(dx.mul(dx).add(dz.mul(dz))).add(0.0001);
  const falloff = float(1).sub(dist.div(mouseRadius).saturate());
  const influence = falloff.mul(falloff).mul(mouseStrength);
  const pushX = dx.div(dist).mul(influence);
  const pushZ = dz.div(dist).mul(influence);

  // Outer mouse sphere
  const odx = bx.sub(mouseWorld.x);
  const odz = bz.sub(mouseWorld.z);
  const odist = sqrt(odx.mul(odx).add(odz.mul(odz))).add(0.0001);
  const ofalloff = float(1).sub(odist.div(outerRadius).saturate());
  const oinfluence = ofalloff.mul(ofalloff).mul(outerStrength);
  const opushX = odx.div(odist).mul(oinfluence);
  const opushZ = odz.div(odist).mul(oinfluence);

  // Camera sphere push
  const cdx = bx.sub(camSphereWorld.x);
  const cdz = bz.sub(camSphereWorld.z);
  const cdist = sqrt(cdx.mul(cdx).add(cdz.mul(cdz))).add(0.0001);
  const cfalloff = float(1).sub(cdist.div(camSphereRadius).saturate());
  const cinfluence = cfalloff.mul(cfalloff).mul(camSphereStrength);
  const cpushX = cdx.div(cdist).mul(cinfluence);
  const cpushZ = cdz.div(cdist).mul(cinfluence);

  const totalPushX = pushX.add(opushX).add(cpushX);
  const totalPushZ = pushZ.add(opushZ).add(cpushZ);

  const targetMag = sqrt(totalPushX.mul(totalPushX).add(totalPushZ.mul(totalPushZ)));
  const currentMag = sqrt(bend.z.mul(bend.z).add(bend.w.mul(bend.w)));
  const lm = select(targetMag.greaterThan(currentMag), deltaTime.mul(12.0), deltaTime.mul(1)).saturate();
  bend.z.assign(mix(bend.z, totalPushX, lm));
  bend.w.assign(mix(bend.w, totalPushZ, lm));
})().compute(BLADE_COUNT);

export function createGrassMesh() {
  const grassMat = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: true });

  grassMat.positionNode = Fn(() => {
    const blade = bladeData.element(instanceIndex);
    const bend = bendState.element(instanceIndex);
    const worldX = blade.x;
    const worldZ = blade.y;
    const rotY = blade.z;
    const boundary = bladeBound.element(instanceIndex);
    const visible = select(hash(instanceIndex.add(9999)).lessThan(grassDensity.mul(0.5)), float(1), float(0));
    const hVar = hash(instanceIndex.add(5555)).mul(bladeHeightVariation);
    const heightScale = float(0.35).add(blade.w).add(hVar).mul(boundary).mul(visible);
    const taper = float(1).sub(uv().y.mul(float(1).sub(bladeTipWidth)));
    const lx = positionGeometry.x.mul(bladeWidth).mul(taper).mul(heightScale.sign());
    const ly = positionGeometry.y.mul(heightScale).mul(bladeHeight);
    const cY = cos(rotY);
    const sY = sin(rotY);
    const rx = lx.mul(cY);
    const rz = lx.mul(sY);
    const t = uv().y;
    const bendFactor = pow(t, 1.8);
    const staticBendX = hash(instanceIndex.add(7777)).sub(0.5).mul(bladeLean);
    const staticBendZ = hash(instanceIndex.add(8888)).sub(0.5).mul(bladeLean);
    const bendX = staticBendX.add(bend.x).add(bend.z);
    const bendZ = staticBendZ.add(bend.y).add(bend.w);
    const relX = rx.add(bendX.mul(bendFactor).mul(bladeHeight));
    const relY = ly;
    const relZ = rz.add(bendZ.mul(bendFactor).mul(bladeHeight));
    const origLen = sqrt(rx.mul(rx).add(ly.mul(ly)).add(rz.mul(rz)));
    const newLen = sqrt(relX.mul(relX).add(relY.mul(relY)).add(relZ.mul(relZ)));
    const scale = origLen.div(newLen.max(0.0001));
    return vec3(worldX.add(relX.mul(scale)), relY.mul(scale), worldZ.add(relZ.mul(scale)));
  })();

  grassMat.colorNode = Fn(() => {
    const t = uv().y;
    const clump = bladeData.element(instanceIndex).w.saturate();
    const bladeHash = hash(instanceIndex.add(4242));
    const isGolden = bladeHash.lessThan(0.4);
    const lowerGrad = smoothstep(float(0.0), float(0.45), t);
    const upperGrad = smoothstep(float(0.4), float(0.85), t);
    const tipMix = float(1).sub(bladeColorVariation).add(clump.mul(bladeColorVariation));
    const greenTip = mix(greenTipColor, bladeTipColor, tipMix);
    const warmTip = mix(greenTipColor, goldenTipColor, tipMix);
    const tipFinal = mix(greenTip, warmTip, select(isGolden, float(1), float(0)));
    const lowerColor = mix(bladeBaseColor, midColor, lowerGrad);
    const grassColor = mix(lowerColor, tipFinal, upperGrad);
    const blade = bladeData.element(instanceIndex);
    const dist = sqrt(blade.x.mul(blade.x).add(blade.y.mul(blade.y)));
    const fogFactor = smoothstep(fogStart, fogEnd, dist).mul(fogIntensity);
    return mix(grassColor, fogColor, fogFactor);
  })();

  grassMat.opacityNode = Fn(() => {
    const blade = bladeData.element(instanceIndex);
    const dist = sqrt(blade.x.mul(blade.x).add(blade.y.mul(blade.y)));
    const fadeEnd = select(fogIntensity.greaterThan(0.01), fogEnd.add(2.0), float(15.0));
    const fadeFactor = float(1).sub(smoothstep(fadeEnd.sub(5.0), fadeEnd, dist));
    return smoothstep(float(0.0), float(0.1), uv().y).mul(fadeFactor);
  })();
  grassMat.transparent = true;

  const bladeGeo = createBladeGeometry();
  const grass = new THREE.InstancedMesh(bladeGeo, grassMat, BLADE_COUNT);
  grass.frustumCulled = false;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < BLADE_COUNT; i++) grass.setMatrixAt(i, dummy.matrix);
  grass.instanceMatrix.needsUpdate = true;
  return grass;
}

export function createGroundMesh() {
  const groundMat = new THREE.MeshBasicNodeMaterial();
  groundMat.colorNode = Fn(() => {
    const wx = positionWorld.x;
    const wz = positionWorld.z;
    const dist = sqrt(wx.mul(wx).add(wz.mul(wz)));
    const edgeNoise = noise2D(wx.mul(0.25).add(100), wz.mul(0.25).add(100));
    const maxR = groundRadius.add(edgeNoise.sub(0.5).mul(4.0));
    const t = smoothstep(maxR.sub(groundFalloff), maxR, dist);
    return mix(groundColor, backgroundColor, t);
  })();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_SIZE * 5, FIELD_SIZE * 5), groundMat);
  ground.rotation.x = -Math.PI / 2;
  return ground;
}
