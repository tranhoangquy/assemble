import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { AnimationAction } from '@/types/assembly';
import type { PartDefinition } from '@/types/product';
import { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import { AnimationEngine } from './AnimationEngine';

/** A product-independent scene with staging setters, hardware feed/spin,
 * geometry variants and nested articulated children. */
function fixture() {
  const root = new THREE.Group();
  root.name = 'scene';
  const registry = new ObjectRegistry();
  const parts: PartDefinition[] = [
    { id: 'panel', name: 'Panel', type: 'mesh', position: [0, 1, 0], material: 'wood',
      geometry: { type: 'box', size: [4, 1, 4] },
      connectionPoints: [{ id: 'mount', position: [0, 0, 0], normal: [1, 0, 0] }] },
    { id: 'rail', name: 'Rail', type: 'group', position: [0, 1, -2] },
    { id: 'bolt', name: 'Bolt', type: 'group', parent: 'rail', position: [0, 0, 0], rotation: [0, 0, 90], visible: false },
    { id: 'carrier', name: 'Carrier', type: 'group', position: [0, 0, 0] },
    { id: 'moving', name: 'Moving anchor', type: 'group', parent: 'carrier', position: [0, 2, 0] },
    { id: 'fixed', name: 'Fixed anchor', type: 'group', position: [0, 10, 0] },
    { id: 'link', name: 'Link', type: 'group', parent: 'carrier', position: [0, 2, 0], visible: false },
    { id: 'rod', name: 'Rod', type: 'group', parent: 'link', position: [0, 5, 0], scale: [1, 4, 1] },
    { id: 'end', name: 'End', type: 'group', parent: 'link', position: [0, 8, 0] },
  ];
  const original = new THREE.BoxGeometry(4, 1, 4);
  const bored = new THREE.BoxGeometry(4, .8, 4);
  const material = new THREE.MeshStandardMaterial();
  for (const p of parts) {
    const o = new THREE.Group(); o.name = p.id;
    o.position.set(...p.position);
    o.rotation.set(...(p.rotation ?? [0, 0, 0]).map(v => v * Math.PI / 180) as [number, number, number]);
    o.scale.set(...(p.scale ?? [1, 1, 1])); o.visible = p.visible ?? true;
    if (p.id === 'panel') {
      o.userData.geometryVariants = { baseline: original, bored };
      o.add(new THREE.Mesh(original, material));
    }
    registry.register(p.id, o);
  }
  for (const p of parts) (p.parent ? registry.require(p.parent) : root).add(registry.require(p.id));
  registry.captureBaseline();
  const engine = new AnimationEngine(registry, new Map(parts.map(p => [p.id, p])));
  const actions: AnimationAction[] = [
    { type: 'move', target: 'panel', to: [0, 13, 0], duration: 0 },
    { type: 'move', target: 'rail', to: [0, 1, -24], duration: 0 },
    { type: 'installPart', target: 'panel', connection: { part: 'panel', point: 'mount' }, at: 1, duration: 2,
      installation: { stagingOffset: [0, 12, 0], approachDirection: [0, 1, 0], approachDistance: 1 } },
    { type: 'installPart', target: 'rail', connection: { part: 'panel', point: 'mount' }, at: 3, duration: 1,
      installation: { stagingOffset: [0, 0, -22], approachDirection: [0, 0, -1], approachDistance: 1 } },
    { type: 'installBolt', target: 'bolt', connection: { part: 'panel', point: 'mount' }, at: 4, duration: 1, turns: 2.25, spinAxis: 'x',
      installation: { approachDirection: [1, 0, 0], approachDistance: 3, mechanicalPhases: true } },
    { type: 'rotate', target: 'bolt', axis: 'x', space: 'world', from: 810, to: 855, at: 5, duration: .5 },
    { type: 'geometryVariant', target: 'panel', variant: 'bored', at: 4 },
    { type: 'show', target: 'link', at: 5 },
    { type: 'pivotPose', target: 'carrier', axis: 'x', localPivot: [0, 0, 0], from: { pivot: [0, 0, 0], angle: 0 },
      to: { pivot: [0, 0, 0], angle: 70 }, at: 6, duration: 2, ease: 'none' },
    { type: 'telescopicLink', target: 'link', rod: 'rod', end: 'end', bodyLength: 3,
      anchorA: { part: 'moving', point: [0, 0, 0] }, anchorB: { part: 'fixed', point: [0, 0, 0] },
      freeOffset: [0, 8, 0], at: 5, duration: 1, ease: 'none' },
    { type: 'scale', target: 'rail', from: [1, 1, 1], to: [1.1, 1, 1], at: 7, duration: 1 },
  ];
  engine.addActions(actions);
  const state = () => {
    root.updateMatrixWorld(true);
    const round = (values: number[]) => values.map(v => Math.round(v * 1e9) / 1e9);
    return Object.fromEntries([...registry.entries()].map(([id, o]) => [id, {
      parent: o.parent?.name,
      position: round(o.position.toArray()), quaternion: round(o.quaternion.toArray()), scale: round(o.scale.toArray()),
      world: round(o.matrixWorld.elements), visible: o.visible,
      variant: o.children[0] instanceof THREE.Mesh
        ? Object.entries(o.userData.geometryVariants).find(([, g]) => g === (o.children[0] as THREE.Mesh).geometry)?.[0] : undefined,
    }]));
  };
  return { engine, registry, state, dispose: () => { engine.dispose(); original.dispose(); bored.dispose(); material.dispose(); } };
}

describe('Whole-scene deterministic seeking', () => {
  it('executes exact zero-time staging on the first seek, repeated seek and reset', () => {
    const f = fixture();
    try {
      f.engine.seek(0);
      expect(f.registry.require('panel').position.y).toBe(13);
      expect(f.registry.require('rail').position.z).toBe(-24);
      const canonical = f.state();
      for (const time of [8, 4.7, 5.3, 3.4, 7, 1.6]) {
        f.engine.seek(time); f.engine.seek(0);
        expect(f.state()).toEqual(canonical);
        f.engine.seek(0); expect(f.state()).toEqual(canonical);
      }
    } finally { f.dispose(); }
  });

  it('preserves every transform, parent, visibility and mesh variant across arbitrary forward/backward order', () => {
    const f = fixture();
    try {
      const times = [0, .2, 1.4, 2.6, 3.3, 4.5, 4.85, 5.25, 6.6, 8];
      const canonical = times.map(t => { f.engine.seek(t); return f.state(); });
      for (const i of [9, 0, 7, 3, 8, 6, 1, 5, 2, 4, 9, 0]) {
        f.engine.seek(times[i]); expect(f.state()).toEqual(canonical[i]);
      }
    } finally { f.dispose(); }
  });

  it('initializes canonical zero even when the first request is a late direct render', () => {
    const fresh = fixture(), direct = fixture();
    try {
      fresh.engine.seek(0); const canonical = fresh.state();
      direct.engine.seek(8); direct.engine.seek(0);
      expect(direct.state()).toEqual(canonical);
      direct.engine.seek(-1); expect(direct.state()).toEqual(canonical);
    } finally { fresh.dispose(); direct.dispose(); }
  });

  it('restores the complete hierarchy and unregistered render children at zero, not just registered roots', () => {
    const f = fixture();
    try {
      f.engine.seek(0); const canonical = f.state();
      const rail = f.registry.require('rail'), bolt = f.registry.require('bolt');
      const panel = f.registry.require('panel'), mesh = panel.children[0] as THREE.Mesh;
      const originalGeometry = mesh.geometry, originalParent = rail.parent;
      const material = mesh.material as THREE.MeshStandardMaterial;
      f.engine.seek(8);
      panel.add(rail); panel.add(bolt);
      mesh.position.set(20, 30, 40); mesh.rotation.set(.2, .3, .4); mesh.scale.set(2, 3, 4); mesh.visible = false;
      material.emissive.set('#fe9010'); material.emissiveIntensity = .8; material.opacity = .3;
      f.engine.seek(0);
      expect(f.state()).toEqual(canonical);
      expect(rail.parent).toBe(originalParent); expect(bolt.parent).toBe(rail);
      expect(mesh.position.toArray()).toEqual([0, 0, 0]);
      expect(mesh.rotation.toArray()).toEqual([0, 0, 0, 'XYZ']);
      expect(mesh.scale.toArray()).toEqual([1, 1, 1]); expect(mesh.visible).toBe(true);
      expect(mesh.geometry).toBe(originalGeometry);
      expect(material.emissive.getHex()).toBe(0); expect(material.emissiveIntensity).toBe(1); expect(material.opacity).toBe(1);
    } finally { f.dispose(); }
  });

  it('uses the same exact initial state for first playback and restart', () => {
    const f = fixture();
    try {
      f.engine.play(); f.engine.pause();
      expect(f.registry.require('panel').position.y).toBe(13);
      const canonical = f.state();
      f.engine.seek(8); f.engine.restart(); f.engine.pause();
      expect(f.state()).toEqual(canonical);
    } finally { f.dispose(); }
  });
});
