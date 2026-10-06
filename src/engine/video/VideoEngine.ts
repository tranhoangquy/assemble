import type { AssemblyDefinition } from '@/types/assembly';
import type { ProductTree } from '@/engine/product/ProductEngine';
import type { VideoDefinition } from '@/types/video';
import type { CameraEngine } from '@/engine/camera/CameraEngine';
import type { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import { AnimationEngine } from '@/engine/animation/AnimationEngine';
import { SceneEngine } from './SceneEngine';

export interface VideoEngineCallbacks {
  onTime?: (time: number) => void;
  onComplete?: () => void;
}

export class VideoEngine {
  readonly scenes: SceneEngine;
  readonly animation: AnimationEngine;
  readonly totalDuration: number;

  constructor(
    registry: ObjectRegistry,
    tree: ProductTree,
    assembly: AssemblyDefinition,
    video: VideoDefinition,
    camera: CameraEngine,
    callbacks: VideoEngineCallbacks = {},
  ) {
    this.scenes = new SceneEngine(video, assembly);
    this.totalDuration = this.scenes.totalDuration;
    this.animation = new AnimationEngine(registry, tree.byId, camera);
    const steps = new Map(assembly.steps.map((step) => [step.id, step]));

    for (const scene of this.scenes.scenes) {
      if (scene.camera) {
        this.animation.addActions([{ type: 'camera', to: scene.camera, duration: 0 }], scene.start);
      }
      if (scene.assemblyStep) this.animation.addActions(steps.get(scene.assemblyStep)?.actions ?? [], scene.start);
      this.animation.addActions(scene.actions, scene.start);
    }

    this.animation.timeline.to({}, { duration: Math.max(0, this.totalDuration - this.animation.timeline.duration()) });
    this.animation.timeline.eventCallback('onUpdate', () => {this.animation.syncVisibility();callbacks.onTime?.(this.time);});
    this.animation.timeline.eventCallback('onComplete', callbacks.onComplete ?? null);
  }

  get time(): number { return this.animation.timeline.time(); }
  get playing(): boolean { return this.animation.timeline.isActive() && !this.animation.timeline.paused(); }
  play(): void { this.animation.play(); }
  pause(): void { this.animation.pause(); }
  toggle(): void {
    if (this.animation.timeline.paused()) this.play();
    else this.pause();
  }
  restart(): void { this.animation.restart(); }
  seek(time: number): void { this.animation.seek(Math.min(this.totalDuration, Math.max(0, time))); }
  renderFrame(time: number): void { this.seek(time); }
  reset(): void { this.seek(0); }
  dispose(): void { this.animation.dispose(); }
}
