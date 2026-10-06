'use client';
import { formatDuration as format } from '@/lib/format-duration';

interface TimelineControlsProps {
  playing: boolean;
  time: number;
  duration: number;
  onToggle: () => void;
  onRestart: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function TimelineControls(props: TimelineControlsProps) {
  return (
    <div className="timeline-controls">
      <button aria-label="Previous assembly state" title="Previous assembly state" onClick={props.onPrevious}>‹‹</button>
      <button className="primary-control" onClick={props.onToggle}>{props.playing ? 'Pause' : 'Play'}</button>
      <button aria-label="Next assembly state" title="Next assembly state" onClick={props.onNext}>››</button>
      <button onClick={props.onRestart}>Restart</button>
      <span className="timecode">{format(props.time)} <i>/</i> {format(props.duration)}</span>
    </div>
  );
}
