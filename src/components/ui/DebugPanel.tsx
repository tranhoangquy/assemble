'use client';

import type { DebugSettings } from '@/types/debug';

const labels: Array<[keyof DebugSettings, string]> = [
  ['grid', 'Grid'], ['pivots', 'Pivots'], ['bounds', 'Bounds'], ['installPaths', 'Install paths'], ['connections', 'Connections'], ['collisions', 'Collisions'],
];

export function DebugPanel({ settings, onChange }: { settings: DebugSettings; onChange: (settings: DebugSettings) => void }) {
  const enabled = Object.values(settings).some(Boolean);
  return (
    <details className="debug-menu">
      <summary className="debug-toggle"><span className={enabled ? 'active' : ''} /> Debug assembly</summary>
      <div>{labels.map(([key, label]) => <label key={key}><input type="checkbox" checked={settings[key]} onChange={(event) => onChange({ ...settings, [key]: event.target.checked })} />{label}</label>)}</div>
    </details>
  );
}
