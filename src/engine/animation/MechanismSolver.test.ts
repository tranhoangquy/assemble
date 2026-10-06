import * as THREE from 'three';
import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import type { PivotPoseAction, TelescopicLinkAction } from '@/types/assembly';
import type { PartDefinition } from '@/types/product';
import { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import { AnimationEngine } from './AnimationEngine';
import { MechanismSolver } from './MechanismSolver';

function fixture() {
  const registry = new ObjectRegistry();
  const scene = new THREE.Group();
  const moving = new THREE.Group();
  const fixed = new THREE.Group();
  const link = new THREE.Group();
  const rod = new THREE.Group();
  const end = new THREE.Group();
  moving.position.set(1, 2, 3);
  fixed.position.set(1, 12, 3);
  link.position.set(-4, -3, -2);
  link.rotation.set(0.1, 0.2, 0.3);
  rod.position.set(0.2, 5, 0.3);
  rod.scale.set(1, 4, 1);
  end.position.set(0.4, 8, 0.5);
  scene.add(moving, fixed, link);
  link.add(rod, end);
  for (const [id, object] of Object.entries({ moving, fixed, link, rod, end })) registry.register(id, object);
  registry.captureBaseline();
  return { registry, scene, moving, fixed, link, rod, end, solver: new MechanismSolver(registry) };
}

const pose: PivotPoseAction = {
  type: 'pivotPose', target: 'moving', axis: 'x', localPivot: [0, 2, 0],
  from: { pivot: [1, 4, 3], angle: 0 }, to: { pivot: [1, 4, 3], angle: 90 },
  duration: 2, ease: 'none',
};
const attached: TelescopicLinkAction = {
  type: 'telescopicLink', target: 'link', rod: 'rod', end: 'end', bodyLength: 3,
  anchorA: { part: 'moving', point: [0, 0, 0] }, anchorB: { part: 'fixed', point: [0, 0, 0] },
  freeOffset: [0, 9, 0], duration: 2, ease: 'none',
};

function expectVector(actual: THREE.Vector3, expected: THREE.Vector3) {
  expect(actual.distanceTo(expected)).toBeLessThan(1e-8);
}
function state(f: ReturnType<typeof fixture>) {
  return [f.moving, f.link, f.rod, f.end].map(object => ({
    position: object.position.toArray(), quaternion: object.quaternion.toArray(), scale: object.scale.toArray(),
  }));
}

describe('Generic deterministic mechanism constraints', () => {
  it('evaluates a rigid pivot identically in forward, backward and direct seeks', () => {
    const f = fixture();
    f.solver.add(pose, 2);
    f.solver.sync(3);
    const direct = state(f);
    f.solver.sync(4);
    f.solver.sync(3);
    expect(state(f)).toEqual(direct);
    f.solver.sync(0);
    expectVector(f.moving.position, f.registry.baseline('moving')!.position);
    expect(f.moving.rotation.toArray()).toEqual(f.registry.baseline('moving')!.rotation.toArray());
  });

  it('keeps the declared pivot fixed with translated and rotated ancestors', () => {
    const f = fixture();
    f.scene.position.set(8, 4, -3);
    f.scene.rotation.set(0.2, 0.4, -0.3);
    f.solver.add(pose, 0);
    f.solver.sync(1);
    const expected = f.scene.localToWorld(new THREE.Vector3(...pose.from.pivot));
    expectVector(f.moving.localToWorld(new THREE.Vector3(...pose.localPivot)), expected);
  });

  it('keeps a scaled root local pivot on the declared parent-space axis', () => {
    const f = fixture();
    f.moving.scale.set(1.5, 2, 0.7);
    f.solver.add(pose, 0);
    f.solver.sync(1);
    expectVector(f.moving.localToWorld(new THREE.Vector3(...pose.localPivot)), new THREE.Vector3(...pose.from.pivot));
  });

  it('replays root staging moves before a later pivot, including an omitted from', () => {
    const f = fixture();
    f.solver.observeMove({ type: 'move', target: 'moving', to: [5, 2, 3], duration: 2, ease: 'none' }, 0);
    f.solver.add({ ...pose, from: { pivot: [5, 4, 3], angle: 0 }, to: { pivot: [5, 4, 3], angle: 90 } }, 2);
    f.solver.sync(1);
    expectVector(f.moving.position, new THREE.Vector3(3, 2, 3));
    f.solver.sync(4);
    f.solver.sync(1);
    expectVector(f.moving.position, new THREE.Vector3(3, 2, 3));
  });

  it('restores all link-owned properties before the first constraint after a backwards seek', () => {
    const f = fixture();
    const initial = state(f);
    f.solver.add(attached, 2);
    f.solver.sync(4);
    f.solver.sync(0);
    expect(state(f)).toEqual(initial);
    // Other components of rod/end positioning are not linkage-controlled.
    expect(f.rod.position.x).toBe(0.2);
    expect(f.end.position.z).toBe(0.5);
  });

  it('selects the most recent constraint by time rather than registration order', () => {
    const f = fixture();
    f.solver.add(attached, 4);
    f.solver.add({ ...attached, anchorB: undefined, duration: 0 }, 2);
    f.solver.sync(6);
    expect(f.end.position.y).toBeCloseTo(10, 8);
  });

  it('follows both world-space anchors as their parent articulation changes', () => {
    const f = fixture();
    f.end.position.set(0, 8, 0);
    f.registry.captureBaseline();
    f.solver.add(pose, 0);
    f.solver.add({ ...attached, duration: 0 }, 0);
    for (const time of [0, 0.5, 2, 1, 0]) {
      f.solver.sync(time);
      expectVector(f.link.getWorldPosition(new THREE.Vector3()), f.moving.getWorldPosition(new THREE.Vector3()));
      expectVector(f.end.getWorldPosition(new THREE.Vector3()), f.fixed.getWorldPosition(new THREE.Vector3()));
    }
  });

  it('resolves world anchors correctly beneath a transformed and scaled link parent', () => {
    const f = fixture();
    const parent = new THREE.Group();
    parent.position.set(7, -2, 5);
    parent.rotation.set(0.3, 0.6, -0.2);
    parent.scale.set(1.5, 2, 0.7);
    f.scene.add(parent);
    parent.add(f.link);
    f.end.position.set(0, 8, 0);
    f.registry.captureBaseline();
    f.solver.add({ ...attached, bodyLength: 1, duration: 0 }, 0);
    f.solver.sync(0);
    expectVector(f.link.getWorldPosition(new THREE.Vector3()), f.moving.getWorldPosition(new THREE.Vector3()));
    expectVector(f.end.getWorldPosition(new THREE.Vector3()), f.fixed.getWorldPosition(new THREE.Vector3()));
  });

  it('restores link-root staging before its first constraint without changing regular objects', () => {
    const f = fixture();
    f.solver.observeMove({ type: 'move', target: 'link', from: [-4, -3, -2], to: [2, -3, -2], duration: 2, ease: 'none' }, 0);
    f.solver.add(attached, 3);
    f.solver.sync(5);
    f.solver.sync(1);
    expectVector(f.link.position, new THREE.Vector3(-1, -3, -2));
    expectVector(f.fixed.position, new THREE.Vector3(1, 12, 3));
  });

  it('evaluates a nested link after its parent and anchor link even when registered first', () => {
    const f = fixture();
    f.end.position.set(0, 8, 0);
    const second = new THREE.Group(), secondRod = new THREE.Group(), secondEnd = new THREE.Group();
    const secondAnchor = new THREE.Group();
    secondAnchor.position.set(11, 12, 3);
    f.scene.add(secondAnchor);
    f.link.add(second);
    second.add(secondRod, secondEnd);
    for (const [id, object] of Object.entries({ second, secondRod, secondEnd, secondAnchor })) f.registry.register(id, object);
    f.registry.captureBaseline();
    f.solver.add({ ...attached, target: 'second', rod: 'secondRod', end: 'secondEnd',
      anchorA: { part: 'end', point: [0, 0, 0] }, anchorB: { part: 'secondAnchor', point: [0, 0, 0] },
      freeOffset: [10, 0, 0], duration: 0 }, 0);
    f.solver.add({ ...attached, duration: 0 }, 0);
    for (const time of [0, 1, 0]) {
      f.solver.sync(time);
      expectVector(second.getWorldPosition(new THREE.Vector3()), f.end.getWorldPosition(new THREE.Vector3()));
      expectVector(secondEnd.getWorldPosition(new THREE.Vector3()), secondAnchor.getWorldPosition(new THREE.Vector3()));
    }
  });

  it('handles a root-local link scale without changing its geometry scale', () => {
    const f = fixture();
    f.link.scale.set(1, 2, 1);
    f.end.position.set(0, 8, 0);
    f.registry.captureBaseline();
    f.solver.add({ ...attached, duration: 0 }, 0);
    f.solver.sync(0);
    expectVector(f.end.getWorldPosition(new THREE.Vector3()), f.fixed.getWorldPosition(new THREE.Vector3()));
    expect(f.link.scale.toArray()).toEqual([1, 2, 1]);
  });

  it('rejects a genuinely over-compressed linkage instead of hiding it in a negative rod scale', () => {
    const f = fixture();
    f.fixed.position.copy(f.moving.position).add(new THREE.Vector3(0, 1, 0));
    f.solver.add({ ...attached, duration: 0 }, 0);
    expect(() => f.solver.sync(0)).toThrow(/over-compressed/);
  });

  it('uses the same deterministic constraints through AnimationEngine seeking', () => {
    const f = fixture();
    const engine = new AnimationEngine(f.registry, new Map());
    engine.addActions([{ ...pose, at: 1 }, { ...attached, at: 3 }]);
    engine.seek(4);
    const direct = state(f);
    engine.seek(5);
    engine.seek(0);
    expectVector(f.link.position, f.registry.baseline('link')!.position);
    engine.seek(4);
    expect(state(f)).toEqual(direct);
    engine.dispose();
  });

  it('preserves the complete installPart path before first linkage ownership without popping', () => {
    const f = fixture();
    f.link.position.copy(f.moving.position);
    f.registry.captureBaseline();
    const parts = new Map<string, PartDefinition>([
      ['moving', { id: 'moving', name: 'Host', type: 'group', position: [1, 2, 3],
        connectionPoints: [{ id: 'mount', position: [0, 0, 0], normal: [1, 0, 0] }] }],
      ['link', { id: 'link', name: 'Link', type: 'group', position: [1, 2, 3] }],
    ]);
    const engine = new AnimationEngine(f.registry, parts);
    engine.addActions([
      { type: 'move', target: 'link', to: [7, 2, 3], duration: 0, at: 0 },
      { type: 'installPart', target: 'link', connection: { part: 'moving', point: 'mount' }, at: 1, duration: 2,
        installation: { stagingOffset: [6, 0, 0], preInstallOffset: [1.5, 0, 0], approachDirection: [1, 0, 0], approachDistance: .5 } },
      { ...attached, at: 3, duration: 0 },
      { ...attached, at: 4, duration: 1 },
    ]);
    const phases = [[1, .84, 7, 2.5, 'power2.inOut'], [1.84, .68, 2.5, 1.5, 'power2.inOut'], [2.52, .48, 1.5, 1, 'power2.in']] as const;
    for (const [start, duration, from, to, ease] of phases) {
      const time = start + duration * .5;
      engine.seek(time);
      const forward = state(f);
      const expected = from + (to - from) * gsap.parseEase(ease)(.5);
      expectVector(f.link.position, new THREE.Vector3(expected, 2, 3));
      engine.seek(5);
      engine.seek(time);
      expect(state(f)).toEqual(forward);
    }
    engine.seek(3 - 1e-7);
    const beforeConstraint = f.link.position.clone();
    engine.seek(3);
    expect(f.link.position.distanceTo(beforeConstraint)).toBeLessThan(1e-6);
    engine.seek(.5);
    expectVector(f.link.position, new THREE.Vector3(7, 2, 3));
    engine.dispose();
  });
});
