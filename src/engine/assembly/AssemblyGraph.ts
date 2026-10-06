import type { AnimationAction, AssemblyDefinition, AssemblyStep } from '@/types/assembly';
import type { ConnectionReference } from '@/types/assembly';
import { DependencyGraph } from './DependencyGraph';

export interface AssemblyOperationNode {
  id: string;
  stepId: string;
  stepName: string;
  actionIndex: number;
  action: AnimationAction;
  movingPart?: string;
  targetPart?: string;
  connection?: ConnectionReference;
  dependencies: string[];
  startsAt: number;
  endsAt: number;
}

const connectedTypes = new Set([
  'installPart', 'alignPart', 'insertPart', 'installBracket', 'installHinge',
  'installScrew', 'installBolt', 'installNut', 'installDowel', 'installWasher',
]);

export class AssemblyGraph {
  readonly steps: AssemblyStep[];
  readonly operations: AssemblyOperationNode[];
  readonly stepOrder: string[];
  readonly missingDependencies: Array<{ node: string; dependency: string }>;
  readonly cycles: string[][];

  constructor(readonly definition: AssemblyDefinition) {
    const analysis = new DependencyGraph(definition.steps.map((step) => ({ id: step.id, dependsOn: step.dependsOn ?? [] }))).analyze();
    const byId = new Map(definition.steps.map((step) => [step.id, step]));
    this.stepOrder = analysis.order;
    this.steps = analysis.order.map((id) => byId.get(id)).filter((step): step is AssemblyStep => Boolean(step));
    this.missingDependencies = analysis.missing;
    this.cycles = analysis.cycles;
    this.operations = this.steps.flatMap((step) => step.actions.map((action, actionIndex) => {
      const movingPart = 'target' in action ? action.target : undefined;
      const connected = connectedTypes.has(action.type) && 'connection' in action;
      const connection = connected ? action.connection : undefined;
      return {
        id: connected && 'id' in action && action.id ? action.id : `${step.id}:${movingPart ?? action.type}:${actionIndex}`,
        stepId: step.id,
        stepName: step.name,
        actionIndex,
        action,
        movingPart,
        targetPart: connection?.part,
        connection,
        dependencies: [...(step.dependsOn ?? []), ...(connected && 'dependsOn' in action ? action.dependsOn ?? [] : [])],
        startsAt: action.at ?? 0,
        endsAt: (action.at ?? 0) + (action.duration ?? 0),
      } satisfies AssemblyOperationNode;
    }));
  }

  operationsForStep(stepId: string): AssemblyOperationNode[] {
    return this.operations.filter((operation) => operation.stepId === stepId);
  }

  operationAt(stepId: string, localTime: number): AssemblyOperationNode | undefined {
    const candidates = this.operationsForStep(stepId).filter((operation) => operation.movingPart && operation.startsAt <= localTime);
    return candidates.findLast((operation) => localTime <= operation.endsAt) ?? candidates.at(-1);
  }
}
