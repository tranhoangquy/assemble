import type { AnimationAction, ConnectionReference } from '@/types/assembly';
import type { Vector3Tuple } from '@/types/product';

export type HardwareRecipe = 'wood-dowel' | 'cam-bolt' | 'wood-screw' | 'bolt-washer-nut' | 'bracket' | 'pivot-bearing' | 'gas-piston';

export interface HardwareInstallSpec {
  id: string;
  target: string;
  connection: ConnectionReference;
  at?: number;
  duration?: number;
  approach?: Vector3Tuple;
  distance?: number;
  turns?: number;
  spinAxis?: 'x' | 'y' | 'z';
  allowedContacts?: string[];
}

function installation(spec: HardwareInstallSpec) {
  return {
    approachDirection: spec.approach ?? [0, 0, 1] as Vector3Tuple,
    approachDistance: spec.distance ?? 18,
    preInstallOffset: (spec.approach ?? [0, 0, 1]).map((value) => value * 7) as Vector3Tuple,
    allowedContacts: [spec.connection.part, ...(spec.allowedContacts ?? [])],
    estimated: true,
  };
}

export class HardwareRecipeBuilder {
  static dowel(spec: HardwareInstallSpec): AnimationAction[] {
    return [{ type: 'installDowel', id: spec.id, target: spec.target, connection: spec.connection, at: spec.at, duration: spec.duration ?? 1.0, turns: spec.turns ?? 0.35, spinAxis: spec.spinAxis ?? 'z', installation: installation(spec) }];
  }

  static camBolt(cam: HardwareInstallSpec, bolt: HardwareInstallSpec): AnimationAction[] {
    return [
      { type: 'installNut', id: cam.id, target: cam.target, connection: cam.connection, at: cam.at, duration: cam.duration ?? 0.9, turns: cam.turns ?? 0.75, spinAxis: cam.spinAxis ?? 'z', installation: installation(cam) },
      { type: 'installBolt', id: bolt.id, target: bolt.target, connection: bolt.connection, at: bolt.at, duration: bolt.duration ?? 1.25, turns: bolt.turns ?? 4, spinAxis: bolt.spinAxis ?? 'z', installation: installation(bolt) },
    ];
  }

  static screw(spec: HardwareInstallSpec): AnimationAction[] {
    return [{ type: 'installScrew', id: spec.id, target: spec.target, connection: spec.connection, at: spec.at, duration: spec.duration ?? 1.05, turns: spec.turns ?? 4.5, spinAxis: spec.spinAxis ?? 'z', installation: installation(spec) }];
  }

  static boltWasherNut(bolt: HardwareInstallSpec, washer: HardwareInstallSpec, nut: HardwareInstallSpec): AnimationAction[] {
    return [
      { type: 'installBolt', id: bolt.id, target: bolt.target, connection: bolt.connection, at: bolt.at, duration: bolt.duration ?? 1.15, turns: 1, spinAxis: bolt.spinAxis ?? 'z', installation: installation(bolt) },
      { type: 'installWasher', id: washer.id, target: washer.target, connection: washer.connection, at: washer.at, duration: washer.duration ?? 0.8, installation: installation(washer) },
      { type: 'installNut', id: nut.id, target: nut.target, connection: nut.connection, at: nut.at, duration: nut.duration ?? 1.15, turns: nut.turns ?? 4, spinAxis: nut.spinAxis ?? 'z', installation: installation(nut) },
    ];
  }

  static bracket(bracket: HardwareInstallSpec, screws: HardwareInstallSpec[]): AnimationAction[] {
    return [
      { type: 'installBracket', id: bracket.id, target: bracket.target, connection: bracket.connection, at: bracket.at, duration: bracket.duration ?? 1.4, installation: installation(bracket) },
      ...screws.flatMap((screw) => this.screw(screw)),
    ];
  }

  static pivotBearing(pivot: HardwareInstallSpec, bearing: HardwareInstallSpec): AnimationAction[] {
    return [
      { type: 'installPart', id: bearing.id, target: bearing.target, connection: bearing.connection, at: bearing.at, duration: bearing.duration ?? 1.1, installation: installation(bearing) },
      { type: 'installBolt', id: pivot.id, target: pivot.target, connection: pivot.connection, at: pivot.at, duration: pivot.duration ?? 1.3, turns: pivot.turns ?? 2, spinAxis: pivot.spinAxis ?? 'x', installation: installation(pivot) },
    ];
  }

  static gasPiston(piston: HardwareInstallSpec): AnimationAction[] {
    return [{ type: 'installPart', id: piston.id, target: piston.target, connection: piston.connection, at: piston.at, duration: piston.duration ?? 1.8, installation: installation(piston) }];
  }
}
