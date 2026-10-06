'use client';

import { formatDuration } from '@/lib/format-duration';
import type { ComputedScene } from '@/types/video';

interface ScenePanelProps {
  scenes: ComputedScene[];
  activeId: string;
  onSelect: (time: number) => void;
}

export function ScenePanel({ scenes, activeId, onSelect }: ScenePanelProps) {
  return (
    <section className="scene-panel panel-section">
      <div className="panel-heading"><span>Video sequence</span><b>{scenes.length} SCENES</b></div>
      <div className="scene-list">
        {scenes.map((scene) => (
          <button key={scene.id} className={scene.id === activeId ? 'active' : ''} onClick={() => onSelect(scene.start)}>
            <em>{String(scene.index + 1).padStart(2, '0')}</em>
            <span><strong>{scene.title}</strong><small>{formatDuration(scene.start)} — {formatDuration(scene.end)}</small></span>
            <i>{formatDuration(scene.duration)}</i>
          </button>
        ))}
      </div>
    </section>
  );
}
