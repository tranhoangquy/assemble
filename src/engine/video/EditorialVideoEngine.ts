import { gsap } from 'gsap';
import type { AssemblyDefinition } from '@/types/assembly';
import type { VideoDefinition } from '@/types/video';
import type { ProductTree } from '@/engine/product/ProductEngine';
import type { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import { CameraEngine } from '@/engine/camera/CameraEngine';
import { VideoEngine, type VideoEngineCallbacks } from './VideoEngine';
import { SceneEngine } from './SceneEngine';
import { PrefixedVideoEngine } from '@/presentation/intro/PrefixedVideoEngine';

/** An opt-in editorial clock, using the existing engine/renderer and original
 * AssemblyGraph. Each source interval is forward; omitted work is a hard cut.
 * Source cameras evaluate normally, then the selected presentation camera wins. */
export class EditorialVideoEngine extends VideoEngine {
  override readonly scenes: SceneEngine;
  override readonly totalDuration: number;
  private clock: gsap.core.Timeline;
  private sourceEngine: VideoEngine;
  constructor(registry: ObjectRegistry, tree: ProductTree, assembly: AssemblyDefinition,
    private video: VideoDefinition, private camera: CameraEngine, private callbacks: VideoEngineCallbacks = {}) {
    super(registry, tree, assembly, { ...video, scenes: video.scenes.map(s => ({ ...s, actions: [], assemblyStep: undefined })) }, camera);
    this.scenes = new SceneEngine(video, assembly);
    this.totalDuration = this.scenes.totalDuration;
    const source = video.editorial!.source;
    const Engine = source.intro ? PrefixedVideoEngine : VideoEngine;
    this.sourceEngine = new Engine(registry, tree, assembly, source, new CameraEngine(camera.camera, camera.controls, source.cameraPresets));
    this.clock = gsap.timeline({ paused: true }).to({}, { duration: this.totalDuration });
    this.clock.eventCallback('onUpdate', () => { this.evaluate(this.time); callbacks.onTime?.(this.time); });
    this.clock.eventCallback('onComplete', callbacks.onComplete ?? null);
  }
  override get time() { return this.clock?.time() ?? 0; }
  override get playing() { return this.clock.isActive() && !this.clock.paused(); }
  private evaluate(time: number) {
    this.sourceEngine.seek(editorialSourceTime(this.video, time));
    const scene = this.scenes.at(Math.min(time, this.totalDuration - 1e-8));
    if (scene.camera) this.camera.apply(scene.camera);
  }
  override seek(time: number) { const at = Math.max(0, Math.min(time, this.totalDuration)); this.clock.time(at, true).pause(); this.evaluate(at); this.callbacks.onTime?.(at); }
  override renderFrame(time: number) { this.seek(time); }
  override reset() { this.seek(0); }
  override play() { this.clock.play(); }
  override pause() { this.clock.pause(); }
  override toggle() { if (this.playing) this.pause(); else this.play(); }
  override restart() { this.seek(0); this.play(); }
  override dispose() { this.clock.kill(); this.sourceEngine.dispose(); super.dispose(); }
}
export function editorialSourceTime(video: VideoDefinition, time: number): number {
  let start = 0;
  for (const [index, scene] of video.scenes.entries()) {
    const end = start + scene.duration;
    if (time < end || index === video.scenes.length - 1) {
      const window = video.editorial!.segments.find(s => s.sceneId === scene.id);
      if (!window) throw new Error(`Missing editorial source window: ${scene.id}`);
      const u = Math.max(0, Math.min(1, (time - start) / scene.duration));
      return window.sourceIn + (window.sourceOut - window.sourceIn) * u;
    }
    start = end;
  }
  throw new Error('An editorial presentation must have scenes.');
}
