'use client';

import type { PartDefinition, ProductDefinition } from '@/types/product';
import type { AssemblyValidationResult } from '@/engine/assembly/AssemblyValidator';
import type { AssemblyPartState, HardwareState } from '@/types/assembly';

interface PartsPanelProps {
  product: ProductDefinition;
  presentationNames?: Record<string,string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  validation: AssemblyValidationResult;
  assemblyState?: AssemblyPartState | HardwareState;
}

function details(part: PartDefinition) {
  return part.type === 'mesh'
    ? `${part.geometry.type} · ${part.geometry.type === 'box' ? part.geometry.size.join(' × ') : part.geometry.type === 'cylinder' ? `r${part.geometry.radius} × ${part.geometry.height}` : part.geometry.type === 'screw' ? `r${part.geometry.radius} × ${part.geometry.length}` : ''}`
    : 'pivot / group';
}

export function PartsPanel({ product, presentationNames, selectedId, onSelect, validation, assemblyState }: PartsPanelProps) {
  const selected = product.parts.find((part) => part.id === selectedId);
  const installation = validation.installations.find((item) => item.action.target === selectedId);
  return (
    <section className="parts-panel panel-section">
      <div className="panel-heading"><span>Product registry</span><b>{product.parts.length} PARTS</b></div>
      <div className="part-list">
        {product.parts.map((part) => (
          <button key={part.id} className={selectedId === part.id ? 'selected' : ''} onClick={() => onSelect(part.id)}>
            <i className={`category-dot ${part.category ?? ''}`} />
            <span><strong>{presentationNames?.[part.id] ?? part.name}</strong>{!presentationNames&&<small>{part.id}</small>}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="part-inspector">
          <span>Selected part</span>
          <strong>{presentationNames?.[selected.id] ?? selected.name}</strong>
          {!presentationNames&&<dl>
            <div><dt>ID</dt><dd>{selected.id}</dd></div>
            <div><dt>Type</dt><dd>{details(selected)}</dd></div>
            <div><dt>Position</dt><dd>{selected.position.join(', ')}</dd></div>
            <div><dt>Parent</dt><dd>{selected.parent ?? 'ROOT'}</dd></div>
            {assemblyState && <div><dt>Assembly state</dt><dd>{assemblyState}</dd></div>}
            {installation && <><div><dt>Install target</dt><dd>{installation.path.targetPart}.{installation.path.connectionPoint}</dd></div><div><dt>Dependencies</dt><dd>{installation.dependsOn.join(', ') || 'NONE'}</dd></div><div><dt>Path</dt><dd>{installation.path.waypoints.map((point) => point.stage).join(' → ')}</dd></div></>}
          </dl>}
        </div>
      )}
    </section>
  );
}
