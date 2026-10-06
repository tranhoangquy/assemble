'use client';

import type { ComputedScene } from '@/types/video';

interface TimelineProps {
  time: number;
  duration: number;
  scenes: ComputedScene[];
  onSeek: (time: number) => void;
}

export function Timeline({ time, duration, scenes, onSeek }: TimelineProps) {
  const progress = duration > 0 ? (time / duration) * 100 : 0;
  return (
    <div className="timeline">
      <input
        aria-label="Video timeline"
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={Math.min(time, duration)}
        onChange={(event) => onSeek(Number(event.target.value))}
        style={{ '--timeline-progress': `${progress}%` } as React.CSSProperties}
      />
      <div className="timeline-markers" aria-hidden="true">
        {scenes.slice(1).map((scene) => <i key={scene.id} style={{ left: `${(scene.start / duration) * 100}%` }} />)}
      </div>
    </div>
  );
}
