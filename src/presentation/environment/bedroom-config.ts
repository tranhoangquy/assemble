import type { BedroomEnvironmentDefinition, BedroomSupportDefinition } from '@/types/presentation';

export const bedroomDefaults = {
  floorY: 0,
  width: 1500,
  depth: 1500,
  floorCenterZ: 150,
  height: 360,
  farWallZ: 700,
  wallColor: '#e9e6de',
  floorColor: '#a5937b',
} as const;

export function resolveBedroomEnvironment(config: BedroomEnvironmentDefinition) {
  return { ...bedroomDefaults, ...config };
}

/** A support is present only while the actual subassembly is parked on it. */
export function bedroomSupportVisible(support: BedroomSupportDefinition, time: number) {
  return time >= support.start && time < support.end;
}

export function bedroomWallZ(config: BedroomEnvironmentDefinition, time: number) {
  return config.installationWall && time >= config.installationWall.start
    ? config.installationWall.z
    : config.farWallZ ?? bedroomDefaults.farWallZ;
}

interface ClockObject {
  visible: boolean;
}

export interface BedroomClockTargets {
  wall: { position: { z: number }; updateMatrixWorld: (force?: boolean) => void } | null;
  supports: ReadonlyMap<string, ClockObject>;
}

/** Apply frame time directly to already-mounted room objects. React's separate
 * Canvas root must not be relied on to commit a frame before gl.render(). */
export function syncBedroomPresentation(config: BedroomEnvironmentDefinition, targets: BedroomClockTargets, time: number) {
  if (targets.wall) {
    targets.wall.position.z = bedroomWallZ(config, time);
    targets.wall.updateMatrixWorld(true);
  }
  for (const support of config.supports ?? []) {
    const object = targets.supports.get(support.id);
    if (object) object.visible = bedroomSupportVisible(support, time);
  }
}
