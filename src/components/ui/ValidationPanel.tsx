'use client';

import { useState } from 'react';
import type { AssemblyValidationResult, ValidationIssue } from '@/engine/assembly/AssemblyValidator';

export function ValidationPanel({ validation, onInspect }: { validation: AssemblyValidationResult; onInspect: (issue: ValidationIssue) => void }) {
  const issues = [...validation.errors, ...validation.warnings, ...validation.info];
  const [open, setOpen] = useState(!validation.valid);
  return (
    <details className="validation-panel panel-section" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="panel-heading"><span>Assembly validation</span><b className={validation.valid ? 'validation-ok' : ''}>{validation.valid ? 'VALID' : `${validation.errors.length} ERRORS`}</b></summary>
      <div className="validation-content">
        <div className="validation-checks">
          <span data-ok={!validation.errors.some((issue) => issue.code.includes('DEPENDENCY'))}>Dependencies</span>
          <span data-ok={!validation.errors.some((issue) => issue.code.includes('CONNECTION') || issue.code === 'MISSING_TARGET')}>Connections</span>
          <span data-ok={!validation.errors.some((issue) => issue.code === 'PREMATURE_CLOSURE' || issue.code === 'TOOL_ACCESS_BLOCKED')}>Access</span>
          <span data-ok={!validation.errors.some((issue) => issue.code === 'INSTALL_PATH_BLOCKED' || issue.code === 'INVALID_COLLISION')}>Paths</span>
        </div>
        <div className="validation-summary">
          <span>{validation.stepsChecked} steps</span><span>{validation.operationsChecked} operations</span><span>{validation.warnings.length} warnings</span>
        </div>
        <div className="validation-list">
          {issues.length === 0 && <p>No assembly issues detected.</p>}
          {issues.slice(0, 18).map((issue, index) => (
            <button key={`${issue.code}-${issue.operation ?? issue.step}-${index}`} data-severity={issue.severity} onClick={() => onInspect(issue)}>
              <strong>{issue.severity} · {issue.code}</strong><small>{issue.message}</small><em>Focus · Show path</em>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
