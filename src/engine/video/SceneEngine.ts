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
  }

  at(time: number): ComputedScene {
    return this.scenes.find((scene) => time >= scene.start && time < scene.end) ?? this.scenes[this.scenes.length - 1];
  }
}
