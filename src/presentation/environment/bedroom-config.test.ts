import { describe, expect, it } from 'vitest';
import { bedroomDefaults, bedroomSupportVisible, bedroomWallZ, resolveBedroomEnvironment, syncBedroomPresentation } from './bedroom-config';
import type { BedroomEnvironmentDefinition } from '@/types/presentation';
import * as THREE from 'three';

describe('presentation-only bedroom', () => {
  it('keeps the physical floor convention and an uncluttered work area', () => {
    const config: BedroomEnvironmentDefinition = { preset: 'bedroom' };
    expect(resolveBedroomEnvironment(config).floorY).toBe(0);
    expect(bedroomWallZ(config, 0)).toBe(700);
    expect(config).toEqual({ preset: 'bedroom' });
  });
  it('uses deterministic cuts for final-wall context without altering product transforms', () => {
    const config: BedroomEnvironmentDefinition = { preset: 'bedroom', installationWall: { z: 22.3, start: 480 } };
    expect(bedroomWallZ(config, 479.999)).toBe(bedroomDefaults.farWallZ);
    expect(bedroomWallZ(config, 480)).toBe(22.3);
    expect(bedroomWallZ(config, 0)).toBe(bedroomDefaults.farWallZ);
  });
  it('shows fixed room supports only while their subassembly is parked', () => {
    const support = { id: 'work-pad', position: [-30, -253.2] as [number, number], topY: 36, start: 200, end: 385 };
    expect(bedroomSupportVisible(support, 199.999)).toBe(false);
    expect(bedroomSupportVisible(support, 200)).toBe(true);
    expect(bedroomSupportVisible(support, 384.99)).toBe(true);
    expect(bedroomSupportVisible(support, 385)).toBe(false);
    expect(bedroomSupportVisible(support, 210)).toBe(true);
  });
  it('applies forward and backward clock changes immediately to mounted wall/window and supports', () => {
    const support = { id: 'work-pad', position: [-30, -253.2] as [number, number], topY: 36, start: 200, end: 385 };
    const config: BedroomEnvironmentDefinition = { preset: 'bedroom', supports: [support], installationWall: { z: 22.3, start: 480 } };
    const wall = new THREE.Group(), window = new THREE.Group(), stand = new THREE.Group();
    window.position.z = -.2; wall.add(window);
    const targets = { wall, supports: new Map([['work-pad', stand]]) };
    const sync = (time: number) => syncBedroomPresentation(config, targets, time);
    sync(210); expect(stand.visible).toBe(true); expect(window.getWorldPosition(new THREE.Vector3()).z).toBeCloseTo(699.8);
    sync(385); expect(stand.visible).toBe(false);
    sync(490); expect(stand.visible).toBe(false); expect(window.getWorldPosition(new THREE.Vector3()).z).toBeCloseTo(22.1);
    sync(210); expect(stand.visible).toBe(true); expect(window.getWorldPosition(new THREE.Vector3()).z).toBeCloseTo(699.8);
    sync(0); expect(stand.visible).toBe(false);
  });
});
