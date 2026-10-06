import type { AnimationAction, AssemblyDefinition, AssemblyPartState, HardwareState } from '@/types/assembly';
import type { ProductDefinition } from '@/types/product';
import { DependencyGraph } from './DependencyGraph';

export interface AssemblyStateSnapshot {
  parts: Map<string, AssemblyPartState>;
  hardware: Map<string, HardwareState>;
}

const connectedTypes = new Set(['installPart', 'alignPart', 'insertPart', 'installBracket', 'installHinge']);
const fastenerTypes = new Set(['installScrew', 'installBolt', 'installNut', 'installDowel', 'installWasher']);

export class AssemblyState {
  static evaluate(product: ProductDefinition, assembly: AssemblyDefinition, stepIndex: number, localTime = Number.POSITIVE_INFINITY): AssemblyStateSnapshot {
    const parts = new Map<string, AssemblyPartState>();
    const hardware = new Map<string, HardwareState>();
    for (const part of product.parts) {
      if (part.category === 'hardware') hardware.set(part.id, 'HIDDEN');
      else parts.set(part.id, part.type === 'group' ? 'INSTALLED' : 'UNASSEMBLED');
    }

    const graph = new DependencyGraph(assembly.steps.map((step) => ({ id: step.id, dependsOn: step.dependsOn ?? [] }))).analyze();
    const byId = new Map(assembly.steps.map((step) => [step.id, step]));
    const orderedSteps = graph.order.map((id) => byId.get(id)).filter((step): step is AssemblyDefinition['steps'][number] => Boolean(step));
    orderedSteps.forEach((step, index) => {
      if (index > stepIndex) return;
      for (const action of step.actions) {
        if (!('target' in action)) continue;
        const end = (action.at ?? 0) + (action.duration ?? 0);
        const elapsed = index < stepIndex ? Number.POSITIVE_INFINITY : localTime;
        this.applyAction(parts, hardware, action, elapsed, end);
      }
    });
    return { parts, hardware };
  }

  private static applyAction(parts: Map<string, AssemblyPartState>, hardware: Map<string, HardwareState>, action: AnimationAction, elapsed: number, end: number): void {
    const at = action.at ?? 0;
    if (elapsed < at || !('target' in action)) return;
    const target = action.target;
    const progress = end <= at ? 1 : Math.min(1, Math.max(0, (elapsed - at) / (end - at)));
    if (fastenerTypes.has(action.type)) {
      hardware.set(target, progress < 0.2 ? 'STAGED' : progress < 0.4 ? 'ALIGNING' : progress < 0.78 ? 'INSERTING' : progress < 1 ? 'TIGHTENING' : 'SECURED');
      return;
    }
    if (connectedTypes.has(action.type)) {
      parts.set(target, progress < 0.25 ? 'STAGED' : progress < 1 ? 'ALIGNING' : 'INSTALLED');
      if (progress >= 1 && 'secures' in action) for (const id of action.secures ?? []) parts.set(id, 'SECURED');
    }
  }
}
