import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraPreset } from '@/types/video';

export class CameraEngine {
  private readonly standardMaxPolar:number;
  constructor(
    readonly camera: THREE.PerspectiveCamera,
    readonly controls: OrbitControlsImpl,
    readonly presets: Record<string, CameraPreset>,
  ) {this.standardMaxPolar=controls.maxPolarAngle;}

  setViewAccess(preset:CameraPreset):void {
    this.controls.maxPolarAngle=preset.allowUnderside?Math.PI-.15:this.standardMaxPolar;
  }

  preset(name: string): CameraPreset {
    const preset = this.presets[name];
    if (!preset) throw new Error(`Unknown camera preset: ${name}`);
    return preset;
  }

  apply(name: string): void {
    const preset = this.preset(name);
    this.setViewAccess(preset);
    this.camera.position.set(...preset.position);
    this.camera.fov = preset.fov ?? 35;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(...preset.target);
    this.controls.update();
  }
}
