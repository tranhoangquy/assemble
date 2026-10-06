import { describe, expect, it } from 'vitest';
import { ProductEngine } from '@/engine/product/ProductEngine';
import { SceneEngine } from '@/engine/video/SceneEngine';
import productJson from '@/products/murphy-bed/product.json';
import assemblyJson from '@/products/murphy-bed/assembly.json';
import videoJson from '@/products/murphy-bed/video.json';
import { productManager } from '@/products/manager';
import type { ProductDefinition } from '@/types/product';
import type { AssemblyDefinition } from '@/types/assembly';
import type { VideoDefinition } from '@/types/video';
import * as THREE from 'three';
import { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import { AnimationEngine } from '@/engine/animation/AnimationEngine';
import type { PartDefinition } from '@/types/product';

const product = productJson as unknown as ProductDefinition;
const assembly = assemblyJson as AssemblyDefinition;
const video = videoJson as unknown as VideoDefinition;

describe('ProductEngine', () => {
  it('builds a complete hierarchy with explicit pivots', () => {
    const tree = ProductEngine.build(product);
    expect(tree.byId.size).toBe(product.parts.length);
    expect(tree.children.get('bed_pivot')?.map((part) => part.id)).toContain('mattress');
    expect(tree.children.get('bed_pivot')?.map((part) => part.id)).toContain('left_leg_pivot');
    expect(tree.byId.has('desk_pivot')).toBe(false);
  });

  it('keeps labeled inch dimensions and evidence provenance in the product package', () => {
    expect(product.calibration?.conversion).toBe('1 in = 2.54 cm');
    expect(product.calibration?.dimensions.find((dimension) => dimension.label === 'Overall width')).toMatchObject({ inches: 94.2, centimeters: 239.268, source: 'dimension_label', confidence: 'high' });
    expect(product.evidenceGroups?.some((group) => group.parts.includes('bed_pivot') || group.parts.includes('bed_left_rail'))).toBe(true);
  });

  it('rejects duplicate ids', () => {
    const duplicate = { ...product, parts: [...product.parts, product.parts[0]] };
    expect(() => ProductEngine.build(duplicate)).toThrow(/Duplicate part id/);
  });

  it('rejects unknown parents', () => {
    const invalid = { ...product, parts: product.parts.map((part, index) => index === 0 ? { ...part, parent: 'missing' } : part) } as ProductDefinition;
    expect(() => ProductEngine.build(invalid)).toThrow(/unknown parent/i);
  });
});

describe('ProductManager', () => {
  it('validates and loads isolated product packages including the gated Step 1 V2', () => {
    const products = productManager.list();
    expect(products.map((entry) => entry.id)).toEqual(['wf311613-director-polish-02b','wf311613-final-micro-pass','wf311613-director-polish-02','wf311613-director-polish-01', 'wf311613-full-assembly', 'wf311613-steps01-20-paced','wf311613-steps01-10-paced','wf311613-steps01-03-action-speed', 'wf311613-steps01-03-corrected', 'wf311613-steps01-02-paced', 'wf311613-step01-pacing', 'wf311613-step01-v2', 'wf311613-murphy-bed', 'merax-queen-film', 'murphy-bed', 'demo-cabinet']);
    expect(productManager.load('wf311613-murphy-bed').product.parts.length).toBeGreaterThan(170);
    expect(productManager.load('wf311613-murphy-bed').video.scenes).toHaveLength(10);
    expect(productManager.load('merax-queen-film').product.parts).toHaveLength(83);
    expect(productManager.load('merax-queen-film').video.scenes).toHaveLength(16);
    expect(productManager.load('murphy-bed').product.parts).toHaveLength(83);
    expect(productManager.load('demo-cabinet').product.parts).toHaveLength(14);
    expect(productManager.load('demo-cabinet').video.scenes).toHaveLength(5);
    expect(() => productManager.load('missing')).toThrow(/Unknown product/);
  });

  it('keeps quick actions product-specific', () => {
    expect(productManager.load('wf311613-murphy-bed').video.quickActions?.map((action) => action.id)).toContain('play-review');
    expect(productManager.load('merax-queen-film').video.quickActions?.map((action) => action.id)).toContain('play-new-film');
    expect(productManager.load('murphy-bed').video.quickActions?.map((action) => action.id)).toContain('open-bed');
    expect(productManager.load('demo-cabinet').video.quickActions?.map((action) => action.id)).toEqual(['play-assembly', 'open-doors']);
  });

  it('publishes structured assembly validation for every product', () => {
    const murphyReviewValidation = productManager.validation('wf311613-murphy-bed');
    expect(murphyReviewValidation.stepsChecked).toBe(10);
    expect(murphyReviewValidation.operationsChecked).toBeGreaterThan(150);
    expect(murphyReviewValidation.errors, murphyReviewValidation.errors.map((issue) => `${issue.code}: ${issue.message}`).join('\n')).toHaveLength(0);
    expect(murphyReviewValidation.warnings.filter((issue) => issue.code === 'INVALID_COLLISION')).toHaveLength(0);

    const validation = productManager.validation('murphy-bed');
    expect(validation.stepsChecked).toBe(10);
    expect(validation.operationsChecked).toBeGreaterThan(50);
    expect(validation.errors, validation.errors.map((issue) => `${issue.code}: ${issue.message}`).join('\n')).toHaveLength(0);
    expect(validation.warnings.filter((issue) => issue.code === 'INVALID_COLLISION')).toHaveLength(0);

    const newFilmValidation = productManager.validation('merax-queen-film');
    expect(newFilmValidation.stepsChecked).toBe(10);
    expect(newFilmValidation.operationsChecked).toBeGreaterThan(50);
    expect(newFilmValidation.errors, newFilmValidation.errors.map((issue) => `${issue.code}: ${issue.message}`).join('\n')).toHaveLength(0);
    const newFilmRotationWarnings = newFilmValidation.warnings.filter((issue) => issue.code === 'INVALID_COLLISION');
    expect(newFilmRotationWarnings, newFilmRotationWarnings.map((issue) => `${issue.part}: ${issue.blockedBy}`).join('\n')).toHaveLength(0);
  });

  it('computes an independent cabinet timeline', () => {
    const cabinet = productManager.load('demo-cabinet');
    const scenes = new SceneEngine(cabinet.video, cabinet.assembly);
    expect(scenes.totalDuration).toBe(34);
    expect(scenes.scenes).toHaveLength(5);
    expect(scenes.at(30).id).toBe('open-doors');
  });
});

describe('SceneEngine', () => {
  it('computes contiguous global scene timing', () => {
    const scenes = new SceneEngine(video, assembly);
    expect(scenes.totalDuration).toBe(193);
    expect(scenes.scenes[2].start).toBe(16);
    expect(scenes.scenes.at(-1)?.end).toBe(193);
    expect(scenes.at(68).id).toBe('bed-frame');
  });

  it('rejects unknown assembly steps', () => {
    const invalid = { ...video, scenes: [{ ...video.scenes[0], assemblyStep: 'missing' }] };
    expect(() => new SceneEngine(invalid, assembly)).toThrow(/unknown assembly step/i);
  });

  it('rejects unknown camera presets', () => {
    const invalid = { ...video, scenes: [{ ...video.scenes[0], camera: 'missing-camera' }] };
    expect(() => new SceneEngine(invalid, assembly)).toThrow(/unknown camera preset/i);
  });

  it('keeps all instructional action targets resolvable', () => {
    const ids = new Set(product.parts.map((part) => part.id));
    const actions = [...assembly.steps.flatMap((step) => step.actions), ...video.scenes.flatMap((scene) => scene.actions)];
    for (const action of actions) {
      if ('target' in action) expect(ids.has(action.target), `${action.type}:${action.target}`).toBe(true);
      if (action.type === 'focus') {
        for (const id of [...action.targets, ...(action.related ?? [])]) expect(ids.has(id), `focus:${id}`).toBe(true);
      }
    }
  });
});

describe('deterministic AnimationEngine seek', () => {
  it('re-evaluates transforms, ghosts and opaque focus identically after backward seek', () => {
    const registry = new ObjectRegistry();
    const active = new THREE.Group();
    const activeMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 1 });
    active.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), activeMaterial));
    const context = new THREE.Group();
    const contextMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 1 });
    context.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), contextMaterial));
    const ghost = new THREE.Group();
    ghost.visible = false;
    registry.register('active', active);
    registry.register('context', context);
    registry.register('__ghost:active', ghost);
    registry.captureBaseline();

    const parts = new Map<string, PartDefinition>([
      ['active', { id: 'active', name: 'Active', type: 'mesh', geometry: { type: 'box', size: [1, 1, 1] }, material: 'test', position: [0, 0, 0] }],
      ['context', { id: 'context', name: 'Context', type: 'mesh', geometry: { type: 'box', size: [1, 1, 1] }, material: 'test', position: [0, 0, 0] }],
    ]);
    const engine = new AnimationEngine(registry, parts);
    engine.addActions([
      { type: 'ghost', target: 'active', visible: true, at: 0.5 },
      { type: 'focus', targets: ['active'], dimOpacity: 0.2, at: 0.5, duration: 0.2 },
      { type: 'move', target: 'active', from: [10, 0, 0], to: [0, 0, 0], at: 1, duration: 1, ease: 'none' },
      { type: 'rotate', target: 'active', axis: 'x', from: 0, to: 90, unit: 'deg', at: 1, duration: 1, ease: 'none' },
      { type: 'ghost', target: 'active', visible: false, at: 2 },
      { type: 'clearFocus', at: 3, duration: 0.2 },
    ]);

    engine.seek(1.5);
    expect(active.position.x).toBeCloseTo(5, 5);
    expect(active.rotation.x).toBeCloseTo(Math.PI / 4, 5);
    expect(contextMaterial.opacity).toBeCloseTo(1, 5);
    expect(ghost.visible).toBe(true);

    engine.seek(0.25);
    expect(active.position.x).toBeCloseTo(0, 5);
    expect(active.rotation.x).toBeCloseTo(0, 5);
    expect(contextMaterial.opacity).toBeCloseTo(1, 5);
    expect(ghost.visible).toBe(false);

    engine.seek(1.5);
    expect(active.position.x).toBeCloseTo(5, 5);
    expect(active.rotation.x).toBeCloseTo(Math.PI / 4, 5);
    expect(contextMaterial.opacity).toBeCloseTo(1, 5);
    expect(ghost.visible).toBe(true);

    engine.seek(3.3);
    expect(contextMaterial.opacity).toBeCloseTo(1, 5);
    expect(ghost.visible).toBe(false);
    engine.dispose();
  });

  it('resolves a high-level install operation from a connection normal', () => {
    const registry = new ObjectRegistry();
    const host = new THREE.Group();
    const fastener = new THREE.Group();
    fastener.position.set(0, 0, 0);
    registry.register('host', host);
    registry.register('fastener', fastener);
    registry.captureBaseline();
    const parts = new Map<string, PartDefinition>([
      ['host', { id: 'host', name: 'Host', type: 'group', position: [0, 0, 0], connectionPoints: [{ id: 'hole', position: [0, 0, 0], normal: [0, 0, 1] }] }],
      ['fastener', { id: 'fastener', name: 'Fastener', type: 'mesh', geometry: { type: 'cylinder', radius: 1, height: 2 }, material: 'test', position: [0, 0, 0] }],
    ]);
    const engine = new AnimationEngine(registry, parts);
    engine.addActions([{ type: 'installScrew', target: 'fastener', connection: { part: 'host', point: 'hole' }, distance: 20, turns: 2, at: 1, duration: 2 }]);
    engine.seek(1);
    expect(fastener.visible).toBe(true);
    expect(fastener.position.z).toBeCloseTo(20, 5);
    engine.seek(2);
    expect(fastener.position.z).toBeCloseTo(10, 5);
    engine.seek(3);
    expect(fastener.position.z).toBeCloseTo(0, 5);
    engine.seek(0.25);
    expect(fastener.position.z).toBeCloseTo(0, 5);
    engine.dispose();
  });
});

describe('ObjectRegistry lifecycle', () => {
  it('clears all active-product objects and baselines', () => {
    const registry = new ObjectRegistry();
    const object = new THREE.Group();
    registry.register('part', object);
    registry.captureBaseline();
    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.get('part')).toBeUndefined();
    expect(registry.baseline('part')).toBeUndefined();
  });
});
