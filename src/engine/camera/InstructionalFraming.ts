import * as THREE from 'three';
import type { Vector3Tuple } from '@/types/product';
import type { CameraPreset } from '@/types/video';

/** Fits only the active parts, receiving joint and hardware staging envelope. */
export function fitInstructionalBox(min: Vector3Tuple, max: Vector3Tuple, direction: Vector3Tuple, coverage = 0.74, fov = 32): CameraPreset {
  const box = new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max));
  const target = box.getCenter(new THREE.Vector3());
  const view = new THREE.Vector3(...direction).normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(view).normalize();
  const up = view.clone().cross(right).normalize();
  const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  let distance = 0;
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
    const corner = new THREE.Vector3(x, y, z).sub(target);
    distance = Math.max(distance, corner.dot(view) + Math.abs(corner.dot(up)) / (tan * coverage), corner.dot(view) + Math.abs(corner.dot(right)) / (tan * (16/9) * coverage));
  }
  return { target: target.toArray() as Vector3Tuple, position: target.clone().addScaledVector(view, distance).toArray() as Vector3Tuple, fov };
}
