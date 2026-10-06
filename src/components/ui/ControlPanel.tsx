'use client';

import type { QuickActionDefinition } from '@/types/video';

export type ProductReviewState = 'final' | 'closed' | 'open' | 'exploded' | 'assembly';

interface ControlPanelProps {
  debugMode?: boolean;
  disabled: boolean;
  quickActions: QuickActionDefinition[];
  onQuickAction: (sceneId: string) => void;
  onReset: () => void;
  onResetCamera: () => void;
  onExport: () => void;
  onReviewState: (state: ProductReviewState) => void;
  autoPause: boolean;
  onAutoPauseChange: (value: boolean) => void;
}

export function ControlPanel(props: ControlPanelProps) {
  return (
    <section className="control-panel panel-section">
      <div className="panel-heading"><span>Quick actions</span><b>CONTROL</b></div>
      {props.debugMode && <div className="review-state-grid" aria-label="Product review states">
        <button onClick={() => props.onReviewState('final')}>Final / Default</button>
        <button onClick={() => props.onReviewState('closed')}>Closed</button>
        <button onClick={() => props.onReviewState('open')}>Open</button>
        <button onClick={() => props.onReviewState('exploded')}>Exploded</button>
        <button onClick={() => props.onReviewState('assembly')}>Assembly</button>
      </div>}
      <label className="auto-pause-toggle"><input type="checkbox" checked={props.autoPause} onChange={(event) => props.onAutoPauseChange(event.target.checked)} /> Auto pause after each logical step</label>
      <div className="button-grid">
        {props.quickActions.map((action) => (
          <button className={action.primary ? 'primary-action' : undefined} key={action.id} disabled={props.disabled} onClick={() => props.onQuickAction(action.sceneId)}>{action.label}</button>
        ))}
        <button disabled={props.disabled} onClick={props.onReset}>Reset all</button>
        <button disabled={props.disabled} onClick={props.onResetCamera}>Reset camera</button>
        <button className="export-action" disabled={props.disabled} onClick={props.onExport}>Export video</button>
      </div>
    </section>
  );
}
