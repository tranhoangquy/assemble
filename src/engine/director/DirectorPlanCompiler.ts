import type { AnimationAction, AssemblyDefinition } from '@/types/assembly';
import type { DirectorPlan } from '@/types/director';
import type { VideoScene } from '@/types/video';

export class DirectorPlanCompiler {
  static actions(step: DirectorPlan['steps'][number]): AnimationAction[] {
    let cursor = 0;
    const actions: AnimationAction[] = [];
    for (const shot of step.shots) {
      if (shot.camera) actions.push({
        type: 'camera',
        to: shot.camera,
        at: cursor,
        duration: shot.transition === 'cut' || shot.type === 'ESTABLISHING' ? 0 : Math.min(0.55, shot.duration * 0.3),
      });
      for (const action of shot.actions) actions.push({ ...action, at: cursor + (action.at ?? 0) });
      cursor += shot.duration;
    }
    return actions;
  }

  static assembly(plan: DirectorPlan): AssemblyDefinition {
    return {
      id: `${plan.id}-assembly`,
      sourceNote: `Compiled from ${plan.source}. Only approved DirectorPlan steps are executable.`,
      steps: plan.steps.map((step, index) => ({
        id: step.id,
        name: `PDF Step ${String(step.step).padStart(2, '0')} - ${step.title}`,
        description: step.subtitle,
        dependsOn: index ? [plan.steps[index - 1].id] : undefined,
        orderSource: 'reference',
        source: 'image_visible',
        confidence: 'high',
        actions: this.actions(step),
      })),
    };
  }

  static scenes(plan: DirectorPlan): VideoScene[] {
    return plan.steps.map((step) => {
      const cursor = step.shots.reduce((sum, shot) => sum + shot.duration, 0);
      return {
        id: step.id,
        title: step.title,
        subtitle: step.subtitle,
        step: `PDF STEP ${String(step.step).padStart(2, '0')} / ${String(plan.steps.length).padStart(2, '0')}`,
        duration: cursor,
        camera: step.shots[0]?.camera,
        assemblyStep: step.id,
        partIntro: { label: 'PDF-coded parts', count: Math.max(1, step.parts.length), hardware: step.hardwareLabel, duration: 1.2 },
        completionAt: Math.max(0, cursor - 1.1),
        actions: [],
      };
    });
  }
}
