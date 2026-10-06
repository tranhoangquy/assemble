import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { captureSceneDiagnostics } from './SceneDiagnostics';

function fixture(aspect = 16 / 9) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ddd9cc');
  scene.fog = new THREE.Fog('#ddd9cc', 400, 900);
  const part = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 30), new THREE.MeshStandardMaterial({ color: '#c19764', roughness: .65 }));
  part.name = 'panel';
  part.position.set(1, 2, 3);
  scene.add(part, new THREE.DirectionalLight('#ffffff', 2), new THREE.PerspectiveCamera(35, aspect));
  scene.updateMatrixWorld(true);
  return { scene, part };
}

describe('read-only whole-scene native-resolution diagnostics', () => {
  it('captures actual physical scene including unregistered presentation objects', () => {
    const { scene, part } = fixture();
    const presentation = new THREE.Group();
    presentation.name = 'bedding';
    presentation.visible = false;
    scene.add(presentation);
    scene.updateMatrixWorld(true);
    const state = captureSceneDiagnostics(scene, { time: 5, duration: 525, registeredObjects: [['panel-1', part]] });
    expect(state.objects).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'panel', ids: ['panel-1'], position: [1, 2, 3], geometry: expect.any(Object) }),
      expect.objectContaining({ name: 'bedding', visible: false, effectiveVisible: false }),
      expect.objectContaining({ light: expect.objectContaining({ color: [1, 1, 1], intensity: 2 }) }),
    ]));
    expect(state.time).toBe(5);
  });

  it('is independent of runtime UUIDs, raster dimensions and camera projection', () => {
    const low = fixture(16 / 9), high = fixture(4 / 3);
    expect(low.part.uuid).not.toBe(high.part.uuid);
    expect(captureSceneDiagnostics(low.scene, { time: 20, duration: 525 }))
      .toEqual(captureSceneDiagnostics(high.scene, { time: 20, duration: 525 }));
  });

  it('does not mutate scene transforms, visibility, materials or geometry', () => {
    const { scene, part } = fixture();
    const before = { transform: part.matrixWorld.toArray(), visible: part.visible, material: part.material.toJSON(), geometry: part.geometry.toJSON() };
    const first = captureSceneDiagnostics(scene, { time: 0, duration: 525 });
    expect(captureSceneDiagnostics(scene, { time: 0, duration: 525 })).toEqual(first);
    expect({ transform: part.matrixWorld.toArray(), visible: part.visible, material: part.material.toJSON(), geometry: part.geometry.toJSON() }).toEqual(before);
  });

  it('detects actual transform, hardware visibility, lighting and material changes', () => {
    const { scene, part } = fixture();
    const first = captureSceneDiagnostics(scene, { time: 1, duration: 525 });
    part.position.x += 2;
    part.visible = false;
    part.material.opacity = .5;
    scene.updateMatrixWorld(true);
    const changed = captureSceneDiagnostics(scene, { time: 1, duration: 525 });
    expect(changed).not.toEqual(first);
    expect(changed.objects).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'panel', visible: false, position: [3, 2, 3] })]));
  });

  it('is exact after a physical scene reset without rounding state values', () => {
    const { scene, part } = fixture();
    const before = captureSceneDiagnostics(scene, { time: 5, duration: 525 });
    part.position.set(50, 0, -200);
    part.visible = false;
    scene.updateMatrixWorld(true);
    captureSceneDiagnostics(scene, { time: 300, duration: 525 });
    part.position.set(1, 2, 3);
    part.visible = true;
    scene.updateMatrixWorld(true);
    expect(captureSceneDiagnostics(scene, { time: 5, duration: 525 })).toEqual(before);
  });
});
