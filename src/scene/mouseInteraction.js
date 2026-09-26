import * as THREE from 'three/webgpu';
import { mouseWorld } from './uniforms.js';

export function setupMouseInteraction(camera) {
  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2();
  const grassPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();
  let mouseFocusDist = 10.0;

  function onMouseMove(e) {
    mouseNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(mouseNDC, camera);
    if (raycaster.ray.intersectPlane(grassPlane, hitPoint)) {
      mouseWorld.value.copy(hitPoint);
      mouseFocusDist = camera.position.distanceTo(hitPoint);
    }
  }

  function onMouseLeave() {
    mouseWorld.value.set(99999, 0, 99999);
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseleave', onMouseLeave);

  return {
    getMouseFocusDist: () => mouseFocusDist,
    isOnField: () => mouseWorld.value.x < 9000,
  };
}
