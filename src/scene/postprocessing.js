import * as THREE from 'three/webgpu';
import { pass, mrt, output, transformedNormalView } from 'three/tsl';
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';
import { focusDistanceU, focalLengthU, bokehScaleU } from './uniforms.js';

export function createPostProcessing(renderer, scene, camera) {
  const postProcessing = new THREE.PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  scenePass.setMRT(mrt({
    output,
    normal: transformedNormalView,
  }));
  const sceneColor = scenePass.getTextureNode('output');
  const sceneViewZ = scenePass.getViewZNode();
  const dofOutput = dof(sceneColor, sceneViewZ, focusDistanceU, focalLengthU, bokehScaleU);

  function setDofEnabled(enabled) {
    postProcessing.outputNode = enabled ? dofOutput : sceneColor;
    postProcessing.needsUpdate = true;
  }

  return { postProcessing, sceneColor, dofOutput, setDofEnabled };
}
