import { describe, expect, it } from 'vitest';
import { AssemblyValidator } from './AssemblyValidator';
import { AssemblyState } from './AssemblyState';
import type { AssemblyDefinition } from '@/types/assembly';
import type { ProductDefinition } from '@/types/product';

const product: ProductDefinition = {
  id: 'fixture', name: 'Fixture', unit: 'cm', materials: { m: { type: 'standard', color: '#888888' } },
  parts: [
    { id: 'root', name: 'Root', type: 'group', position: [0, 0, 0] },
    { id: 'base', name: 'Base', type: 'mesh', geometry: { type: 'box', size: [4, 4, 4] }, material: 'm', position: [20, 0, 0], connectionPoints: [{ id: 'mount', position: [0, 0, 0], normal: [0, 0, 1] }] },
    { id: 'blocker', name: 'Blocker', type: 'mesh', geometry: { type: 'box', size: [4, 4, 4] }, material: 'm', position: [0, 0, 5] },
    { id: 'moving', name: 'Moving', type: 'mesh', geometry: { type: 'box', size: [2, 2, 2] }, material: 'm', position: [0, 0, 10] },
    { id: 'screw', name: 'Screw', type: 'mesh', category: 'hardware', geometry: { type: 'cylinder', radius: 1, height: 3 }, material: 'm', position: [20, 0, 2] },
  ],
};

const assembly = (steps: AssemblyDefinition['steps']): AssemblyDefinition => ({ id: 'fixture-assembly', steps });

describe('Physical Assembly System V2 validation scenarios', () => {
  it('A: reports a closing panel installed before an inaccessible internal part', () => {
    const result = AssemblyValidator.validate(product, assembly([{ id: 'close', name: 'Close', accessBarrierFor: ['moving'], actions: [] }]));
    expect(result.errors.some((issue) => issue.code === 'PREMATURE_CLOSURE' && issue.part === 'moving')).toBe(true);
  });

  it('B: reports a missing connection target', () => {
    const result = AssemblyValidator.validate(product, assembly([{ id: 'install', name: 'Install', actions: [{ type: 'installPart', target: 'moving', connection: { part: 'missing', point: 'mount' } }] }]));
    expect(result.errors.some((issue) => issue.code === 'MISSING_TARGET')).toBe(true);
  });

  it('C: reports a circular dependency', () => {
    const result = AssemblyValidator.validate(product, assembly([
      { id: 'a', name: 'A', dependsOn: ['b'], actions: [] },
      { id: 'b', name: 'B', dependsOn: ['a'], actions: [] },
    ]));
    expect(result.errors.some((issue) => issue.code === 'CIRCULAR_DEPENDENCY')).toBe(true);
  });

  it('D: reports a moving AABB intersecting an installed blocker', () => {
    const result = AssemblyValidator.validate(product, assembly([
      { id: 'prepare', name: 'Prepare', actions: [{ type: 'move', target: 'base', to: [20, 0, 0] }, { type: 'move', target: 'blocker', to: [0, 0, 5] }] },
      { id: 'install', name: 'Install', dependsOn: ['prepare'], actions: [{ type: 'installPart', target: 'moving', connection: { part: 'base', point: 'mount' }, installation: { stagingOffset: [0, 0, -10], preInstallOffset: [0, 0, -6], approachDirection: [0, 0, -1], approachDistance: 2 } }] },
    ]));
    expect(result.errors.some((issue) => issue.code === 'INSTALL_PATH_BLOCKED' && issue.blockedBy === 'blocker')).toBe(true);
  });

  it('E: accepts a dependency-correct, accessible installation', () => {
    const result = AssemblyValidator.validate(product, assembly([
      { id: 'prepare', name: 'Prepare', actions: [{ type: 'move', target: 'base', to: [20, 0, 0] }] },
      { id: 'install', name: 'Install', dependsOn: ['prepare'], actions: [{ id: 'part', type: 'installPart', target: 'moving', connection: { part: 'base', point: 'mount' }, fromOffset: [0, 0, 8] }] },
    ]));
    expect(result.valid).toBe(true);
  });

  it('separates allowed assembly contact from invalid collision', () => {
    const result = AssemblyValidator.validate(product, assembly([
      { id: 'prepare', name: 'Prepare', actions: [{ type: 'move', target: 'base', to: [20, 0, 0] }, { type: 'move', target: 'blocker', to: [0, 0, 5] }] },
      { id: 'install', name: 'Install', dependsOn: ['prepare'], actions: [{ type: 'installPart', target: 'moving', connection: { part: 'base', point: 'mount' }, installation: { stagingOffset: [0, 0, -10], preInstallOffset: [0, 0, -6], approachDirection: [0, 0, -1], approachDistance: 2, allowedContacts: ['blocker'] } }] },
    ]));
    expect(result.valid).toBe(true);
    expect(result.info.some((issue) => issue.code === 'EXPECTED_CONTACT')).toBe(true);
  });

  it('reconstructs part and hardware states deterministically at arbitrary times', () => {
    const definition = assembly([{ id: 'install', name: 'Install', actions: [
      { type: 'installPart', target: 'moving', connection: { part: 'base', point: 'mount' }, at: 1, duration: 4 },
      { type: 'installScrew', target: 'screw', connection: { part: 'base', point: 'mount' }, at: 5, duration: 2 },
    ] }]);
    expect(AssemblyState.evaluate(product, definition, 0, 1.5).parts.get('moving')).toBe('STAGED');
    expect(AssemblyState.evaluate(product, definition, 0, 6).hardware.get('screw')).toBe('INSERTING');
    expect(AssemblyState.evaluate(product, definition, 0, 8).hardware.get('screw')).toBe('SECURED');
  });
});
