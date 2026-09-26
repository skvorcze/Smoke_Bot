import * as THREE from 'three/webgpu';
import { instancedArray } from 'three/tsl';
import { getBladeCount } from './devicePresets.js';

export const BLADE_COUNT = getBladeCount();
export const FIELD_SIZE = 30;

// Per-blade GPU storage buffers, populated once by computeInit and updated
// every frame by computeUpdate (see grassMaterial.js).
export const bladeData = instancedArray(BLADE_COUNT, 'vec4'); // xz position, rotation, clump
export const bendState = instancedArray(BLADE_COUNT, 'vec4'); // wind bend + push bend
export const bladeBound = instancedArray(BLADE_COUNT, 'float'); // field-edge falloff

export function createBladeGeometry() {
  const segs = 5;
  const W = 0.055;
  const H = 1.0;
  const verts = [];
  const norms = [];
  const uvArr = [];
  const idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const y = t * H;
    const hw = W * 0.5 * (1.0 - t * 0.82);
    verts.push(-hw, y, 0, hw, y, 0);
    norms.push(0, 0, 1, 0, 0, 1);
    uvArr.push(0, t, 1, t);
  }
  for (let i = 0; i < segs; i++) {
    const b = i * 2;
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
  geo.setIndex(idx);
  return geo;
}
