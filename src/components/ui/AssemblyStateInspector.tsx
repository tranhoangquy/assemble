'use client';

import { useMemo } from 'react';
import type { AssemblyDefinition } from '@/types/assembly';
import type { AssemblyStateSnapshot } from '@/engine/assembly/AssemblyState';
import { AssemblyGraph } from '@/engine/assembly/AssemblyGraph';
import type { AssemblyValidationResult } from '@/engine/assembly/AssemblyValidator';

interface Props {
  assembly: AssemblyDefinition;
  stepId?: string;
  localTime: number;
  snapshot?: AssemblyStateSnapshot;
  validation: AssemblyValidationResult;
}

export function AssemblyStateInspector({ assembly, stepId, localTime, snapshot, validation }: Props) {
  const graph = useMemo(() => new AssemblyGraph(assembly), [assembly]);
  const stepIndex = stepId ? graph.stepOrder.indexOf(stepId) : -1;
  const step = stepId ? graph.steps.find((candidate) => candidate.id === stepId) : undefined;
  const operation = stepId ? graph.operationAt(stepId, localTime) : undefined;
  const installation = operation ? validation.installations.find((candidate) => candidate.operation === operation.id) : undefined;
  const invalidCollision = installation?.collisions.find((collision) => !collision.expected);
  const installed = snapshot ? [...snapshot.parts.values()].filter((state) => state === 'INSTALLED' || state === 'SECURED').length : 0;
  const securedHardware = snapshot ? [...snapshot.hardware.values()].filter((state) => state === 'SECURED').length : 0;

  return (
    <details className="state-inspector panel-section">
      <summary className="panel-heading">
        <span>Assembly state</span>
        <b>{stepIndex >= 0 ? `${stepIndex + 1} / ${graph.steps.length}` : 'REVIEW'}</b>
      </summary>
      <dl>
        <div><dt>Step</dt><dd>{step?.name ?? 'Product review state'}</dd></div>
        <div><dt>Operation</dt><dd>{operation?.action.type ?? '—'}</dd></div>
        <div><dt>Moving</dt><dd>{operation?.movingPart ?? '—'}</dd></div>
        <div><dt>Target</dt><dd>{operation?.targetPart ?? '—'}</dd></div>
        <div><dt>Dependencies</dt><dd>{operation?.dependencies.join(', ') || 'None'}</dd></div>
        <div><dt>Access</dt><dd>{invalidCollision ? `Blocked by ${invalidCollision.blockedBy}` : installation ? 'Path clear' : 'Not evaluated'}</dd></div>
        <div><dt>Installed</dt><dd>{installed} parts · {securedHardware} hardware secured</dd></div>
      </dl>
    </details>
  );
}
