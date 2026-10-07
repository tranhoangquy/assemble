import type { AssemblyDefinition } from '@/types/assembly';
import type { ComputedScene, VideoDefinition } from '@/types/video';

export class SceneEngine {
  readonly scenes: ComputedScene[];
  readonly totalDuration: number;

  constructor(video: VideoDefinition, assembly: AssemblyDefinition) {
    const stepIds = new Set(assembly.steps.map((step) => step.id));
    const cameraIds = new Set(Object.keys(video.cameraPresets));
    let cursor = 0;
    this.scenes = video.scenes.map((scene, index) => {
      if (scene.duration <= 0) throw new Error(`Scene "${scene.id}" has invalid duration`);
      if (scene.assemblyStep && !stepIds.has(scene.assemblyStep)) throw new Error(`Scene "${scene.id}" references unknown assembly step "${scene.assemblyStep}"`);
      if (scene.camera && !cameraIds.has(scene.camera)) throw new Error(`Scene "${scene.id}" references unknown camera preset "${scene.camera}"`);
      for (const action of scene.actions) {
        if ((action.duration ?? 0) < 0) throw new Error(`Scene "${scene.id}" contains a negative action duration`);
        if (action.type === 'camera' && (!cameraIds.has(action.to) || (action.from && !cameraIds.has(action.from)))) {
          throw new Error(`Scene "${scene.id}" contains an unknown camera preset`);
        }
      }
      const computed = { ...scene, index, start: cursor, end: cursor + scene.duration };
      cursor += scene.duration;
      return computed;
    });
    this.totalDuration = cursor;
    if (video.editorial) {
      if (video.editorial.source.editorial) throw new Error('Nested editorial presentations are unsupported.');
      const sourceDuration = video.editorial.source.scenes.reduce((n,s) => n+s.duration,0);
      const windows = video.editorial.segments;
      if (windows.length !== video.scenes.length || new Set(windows.map(s => s.sceneId)).size !== windows.length) throw new Error('Editorial windows must match scenes exactly.');
      for (const scene of video.scenes) {
        const w = windows.find(w => w.sceneId === scene.id);
        if (!w || !Number.isFinite(w.sourceIn) || !Number.isFinite(w.sourceOut) || w.sourceIn < 0 || w.sourceOut < w.sourceIn || w.sourceOut > sourceDuration) throw new Error('Invalid forward editorial source interval.');
        if (scene.assemblyStep || scene.actions.length) throw new Error('Editorial scenes must reuse source mechanics, not add assembly actions.');
      }
    }
  }

  at(time: number): ComputedScene {
    return this.scenes.find((scene) => time >= scene.start && time < scene.end) ?? this.scenes[this.scenes.length - 1];
  }
}
