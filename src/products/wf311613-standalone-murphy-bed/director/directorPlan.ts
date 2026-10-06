import { step03CorrectedPlan, step03CorrectedVideo } from './step03-corrected';
import { tuneActionPacing } from './actionPacing';
import { DirectorPlanCompiler } from '@/engine/director/DirectorPlanCompiler';
import type { VideoDefinition } from '@/types/video';
export const directorPlan = tuneActionPacing(step03CorrectedPlan);
let cursor = 0;
export const reviewVideo: VideoDefinition = { ...step03CorrectedVideo, id: directorPlan.id,
  title: 'WF311613 · Steps 1–3 action-speed review',
  scenes: DirectorPlanCompiler.scenes(directorPlan).map(scene => ({ ...scene, partIntro: undefined })),
  reviewCaptions: directorPlan.steps.flatMap(step => step.shots.map(shot => {
    const start = cursor; cursor += shot.duration;
    return { start, end: cursor, title: shot.type.replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase()), note: shot.note ?? '' };
  })),
};
