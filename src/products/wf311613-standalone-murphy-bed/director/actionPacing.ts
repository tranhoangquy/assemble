import type { AnimationAction } from '@/types/assembly';
import type { DirectorPlan, DirectorShot } from '@/types/director';

/** Steps 1–3 only. No playback-rate change, no shot/camera reordering. */
export const actionPacing = Object.freeze({
  first: { installDowel: 1.55, installNut: 1.05, installBolt: 1.6, installScrew: 1.3 },
  secondSpeed: 1.3,
  repeatedSpeed: 1.8,
  existingRepeatDurationCap: 0.54,
  firstHold: 0.10,
  repeatHold: 0.06,
  tightenDurationCap: 0.40,
  assemblyMotionDurationCap: 0.65,
  assemblySeatedHold: 0.12,
  repeatedTargetHold: 0.20,
  stagingHoldCap: 0.60,
  firstPhases: { approach: 0.28, contact: 0.06, feed: 0.62, seat: 0.04 },
  repeatedPhases: { approach: 0.22, contact: 0.02, feed: 0.73, seat: 0.03 },
});

type HardwareKind = keyof typeof actionPacing.first;
const isHardware = (a: AnimationAction): a is AnimationAction & { type: HardwareKind } => a.type in actionPacing.first;

export function tuneActionPacing(source: DirectorPlan): DirectorPlan {
  if (source.steps.some(step => step.step > 3)) throw new Error('Action-speed checkpoint is restricted to Steps 1–3');
  const counts = new Map<HardwareKind, number>();
  let targetCount = 0;
  function retimeShot(shot: DirectorShot): DirectorShot {
    const result = structuredClone(shot);
    const hardware = result.actions.filter(isHardware);
    if (hardware.length) {
      let first = false;
      result.actions = result.actions.map(action => {
        if (!isHardware(action)) return action;
        const count = (counts.get(action.type) ?? 0) + 1;
        counts.set(action.type, count);
        first ||= count === 1;
        const speed = count === 1 ? 1 : count === 2 ? actionPacing.secondSpeed : actionPacing.repeatedSpeed;
        const instructional = actionPacing.first[action.type] / speed;
        const duration = count === 1 ? Math.min(action.duration ?? instructional, instructional)
          : Math.min(instructional, (action.duration ?? instructional) * actionPacing.existingRepeatDurationCap);
        return { ...action, at: 0, duration, installation: { ...action.installation,
          motionTiming: count === 1 ? actionPacing.firstPhases : actionPacing.repeatedPhases } };
      });
      const end = Math.max(...result.actions.map(a => (a.at ?? 0) + (a.duration ?? 0)));
      result.duration = end + (first ? actionPacing.firstHold : actionPacing.repeatHold);
    } else if (result.type === 'TIGHTEN_HARDWARE') {
      // Scale this operation only, preserving simultaneous bolt feed/spin and subsequent cam lock.
      const factor = actionPacing.tightenDurationCap;
      result.actions = result.actions.map(a => ({ ...a, at: (a.at ?? 0) * factor, duration: (a.duration ?? 0) * factor }));
      result.duration = Math.max(...result.actions.map(a => (a.at ?? 0) + (a.duration ?? 0))) + actionPacing.repeatHold;
    } else if ((result.type === 'INSERT_PART' || result.type === 'ALIGN_CONNECTION') && result.actions.some(a => (a.type === 'installPart' || a.type === 'move') && (a.duration ?? 0) > 0)) {
      // Retime the whole rigid operation together, including carried dowels and both side rails.
      // Preserve each path's controlled final alignment phase and all relative action offsets.
      const factor = actionPacing.assemblyMotionDurationCap;
      result.actions = result.actions.map(a => ({ ...a, at: (a.at ?? 0) * factor, duration: (a.duration ?? 0) * factor }));
      result.duration = Math.max(...result.actions.map(a => (a.at ?? 0) + (a.duration ?? 0))) + actionPacing.assemblySeatedHold;
    } else if (result.type === 'CONNECTION_MACRO' && !result.actions.length) {
      if (++targetCount > 1) result.duration = Math.min(result.duration, actionPacing.repeatedTargetHold);
    } else if (result.type === 'STAGE_PART' && !result.actions.length) {
      result.duration = Math.min(result.duration, actionPacing.stagingHoldCap);
    }
    // Geometry, paths, verification, context and cameras remain unchanged.
    return result;
  }
  return { ...source, id: 'wf311613-steps01-03-action-speed', steps: source.steps.map(step => ({ ...step, shots: step.shots.map(retimeShot) })) };
}
