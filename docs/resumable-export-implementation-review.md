# Resumable Generate File — implementation review
Date: 2026-10-05
Status: IMPLEMENTED AND VALIDATED; returned for review, STOP.

## A. Rule and reusable skill
Updated the existing production standard and skill to v1.1, with mandatory resumability for long exports including 720p. New operational reference and long-render checklist cover chunk choice, persistent checkpoints, resume/repair, bounded retry/recycle, automatic assembly, audio and final QA. Added checkpoint-incompatible, frame-validation and encode STOP gates. Existing freeze templates are reused; the operational version-2 job manifest is defined by backend types, not a duplicated manual template. AGENTS.md routes to v1.1, retaining the generated Next block. No duplicate/global skill was installed.

Rule: [rules/long-form-assembly-video.md](../rules/long-form-assembly-video.md). Skill: [.agents/skills/long-form-assembly-video/SKILL.md](../.agents/skills/long-form-assembly-video/SKILL.md). Skill validator, four JSON template parses and 35 rule/skill links PASS.

## B. Generate File UI
Previously: memory-only queued/rendering/encoding status, frame percentage reached 100 before encoding, failed/cancelled cache deleted, no Resume. Now: ready profile/FPS/duration/frame summary; backend-owned stage-aware overall progress, valid frames, chunks/range/current chunk and elapsed; Resume/Cancel/Delete and one final download. Preparation, render, validation, encode, optional mux, verify, completed/interrupted/retrying/waiting/cancelled/error/stale are distinct. Detailed errors are expandable; encoder percent/ETA is not invented. Product-scoped polling and focused-job session state rehydrate on refresh, including a job selected through Resume. Delete is explicit with confirmation; Cancel keeps work. New generation keeps old jobs.

Actual browser QA discovered missing focus persistence for Resume-selected jobs on refresh; fixed and reran. The original failing report remains [here](../output/export-infrastructure-qa/2026-10-05T09-16-07-566Z/smoke-report.json). The passing package is [here](../output/export-infrastructure-qa/2026-10-05T09-24-04-256Z/smoke-report.json), with [Resume UI](../output/export-infrastructure-qa/2026-10-05T09-24-04-256Z/01-resumable-ui.png) and [Completed UI](../output/export-infrastructure-qa/2026-10-05T09-24-04-256Z/02-completed-ui.png). Screenshots were visually inspected for readable progress/actions and retained layout.

## C. Backend and migration
Extended the existing ExportJobManager/API; no parallel export service. One sequential work queue plus PID/job filesystem lock; default 300-frame configurable work chunks over one deterministic frame sequence; two automatic per-frame retries, recycle every five completed chunks, safe restart after failure. Every frame/manifest writes atomically; frame success, chunks, retries/stages checkpoint to durable output/export-jobs directories. Full PNG CRC/zlib/scanline/dimension integrity and stored SHA256 protect reuse. Resume reconciles disk and manifest, recovering compatible uncheckpointed frames and repairing missing/corrupt/wrong-size/checksum-mismatched ones. Full contiguous pre-encode validation blocks encoding on defects. Rejected source/product/profile/FPS/audio identities retain old work as stale; they never mix creative revisions.

One final encode begins automatically, optional approved audio mux happens once, then profile/frame count/timing, full decode, faststart and SHA256/size verification before completed. Mux verifies ordered video packet identity. Silent exports skip mux. No audio asset was registered for any current product: the generic optional approvedAudioMaster contract requires an existing director/rights-approved, hash-bound, exact-length master. Existing products remain silent unless explicitly configured through their approved package contract; no soundtrack inference from output directories, looping or music rebuild is added.

Crash recovery loads schema-v2 manifests and validates paths/identities/frames; incomplete dead-process states become interrupted. Legacy/corrupt/unidentified caches stay untouched and non-resumable. Hot-reload migration replaces the old singleton implementation, preserving live legacy status/cancel/download delegation without invented resume identity. Legacy state does not survive server restart and keeps its original retention semantics. Normal v2 Cancel preserves work, Delete removes only the manager-owned job directory; v2 download starts no destructive TTL. Successful v2 frames/evidence remain until manual Delete.

Deployment is a long-lived local Node/Next server with persistent writable storage, Chromium, FFmpeg/FFprobe; this is not a serverless distributed workflow. Restart after deployment to load current bundles. Detailed lifecycle/config/timeouts/retention/API contract: [docs/resumable-export.md](resumable-export.md).

## D. Validation and evidence
- Full regression: **236 PASS / 43 files**, one worker, unchanged mechanical timeouts/thresholds. [Log](../output/export-infrastructure-qa/final-validation/full-tests.log).
- Final affected export/UI suite: **75 PASS / 9 files**, including final cancellation, legacy adapter and real FFmpeg silent/audio fixture paths. [Log](../output/export-infrastructure-qa/final-validation/targeted-tests.log). This targeted run follows the final UI/migration corrections; the entire mechanical suite was not repeated because its protected source/data did not change.
- Typecheck: PASS. Lint: PASS with the existing source-only output exclusion (`npm run lint -- --ignore-pattern 'output/**'`). [Typecheck](../output/export-infrastructure-qa/final-validation/typecheck.log), [lint](../output/export-infrastructure-qa/final-validation/lint.log).
- Default Turbopack build: **FAILED, exit 137**, with no specific compiler diagnostic. Retained [raw log](../output/export-infrastructure-qa/final-validation/turbopack-build.log); no OOM cause is asserted.
- Explicit installed Webpack build: **PASS**, including TypeScript and all routes, without changing next.config.ts, package scripts or render quality. [Log](../output/export-infrastructure-qa/final-validation/webpack-build.log).
- Actual native Chromium/FFmpeg smoke: four-frame Demo Cabinet export at 720p, cancel/resume preserving frame zero, complete automatic encode/verify/download and refresh rehydration PASS. Independent fresh rendering matches both sides of the actual chunk boundary (indices 1 and 2) byte-exactly. Four native 2160p frames/2 chunks also encode/full-verify PASS. These short early-timeline checks do not establish long-run 4K endurance or universal visual review. No full 4K or full product video ran.
- Unit coverage: explicit transitions, interruption/retry exhaustion, valid/missing/corrupt/wrong-size frames, pre-encode defect blocking, source/assembly/video/director/renderer incompatibility, server recovery/disk reconciliation, cancel versus isolated delete, encode/verify failure, automatic final assembly, real AAC fixture mux/packet identity, API selector guards and UI stage/action values.
- Earlier targeted test attempts exposed a deferred mock-lifetime race and a fixture teardown rejection. These were corrected with bound job dispatch, explicit background error handling and awaited fixture cleanup; final targeted logs contain no unhandled errors. Complete original unit-attempt files were overwritten by reruns, so they are not presented as retained raw logs. The captured failures were launch called 19 times versus expected 1, and ENOENT during recovery after a test directory was removed.
- 90-second readiness and 60-second navigation retained. Browser recycle/recovery restores native surface and loaded evaluated creative data. No multi-worker heavy render is introduced.
- Actual default approved timeline from registry yields **15,722 frames / 53 chunks** at 720p/30 with size 300, final inclusive range 15,600–15,721; runtime contains no hard-coded historical product ID.

## E. Profile/legacy regression
| Contract | Result |
|---|---|
| 720p | Existing profile tests PASS; actual short native render PASS |
| 1080p | Existing resolver/job/native surface tests PASS |
| 1440p | Existing resolver/job/native surface tests PASS |
| 2160p | Existing profile tests PASS; actual four-frame native 3840×2160 smoke PASS |
| 30 FPS | Existing tests and actual smoke PASS |
| 60 FPS | Existing legacy/profile/job tests PASS; no actual 60fps browser smoke in this task |
| Legacy 1280x720 / 1920x1080 IDs | Exact IDs/dimensions/defaults/output naming retained; tests PASS |
| CLI custom profiles and FrameManifest helpers | Preserved; legacy CLI path not rewritten into a second export system |

## F. Source protection and scope
[Protected identity evidence](../output/export-infrastructure-qa/final-validation/protected-source-identity.json): **136 files unchanged**, including product packages/references/tests (excluding export composition wiring), presentation assets/data and the three locked visual/audio/final masters. Latest renderer/assets fingerprint still matches both successful native smoke jobs after the final non-rendering migration updates.

NO product geometry/dimensions changed. NO assembly operations changed. NO camera presets changed. NO timeline/timing changed. NO materials/captions/presentation changed. NO music edit/approved audio/master changed. Product registry and selector remain unchanged. FrameRenderer/ProductViewer only add read-only evaluated-source diagnostics for compatibility; export behavior is deliberately upgraded. Seven accidentally created task-only generic unit fixtures were explicitly cleaned; native smoke evidence and historical failed QA remain. The localhost smoke server was stopped; the user's pre-existing port 3000 server was left alone. No new product, full render or upload.

## Files added/changed

### Rule/skill/routing

- [rules/long-form-assembly-video.md](../rules/long-form-assembly-video.md)
- [.agents/skills/long-form-assembly-video/SKILL.md](../.agents/skills/long-form-assembly-video/SKILL.md)
- [.agents/skills/long-form-assembly-video/references/resumable-export.md](../.agents/skills/long-form-assembly-video/references/resumable-export.md)
- [.agents/skills/long-form-assembly-video/checklists/long-render-generate-file-qa.md](../.agents/skills/long-form-assembly-video/checklists/long-render-generate-file-qa.md)
- [.agents/skills/long-form-assembly-video/references/stop-gates.md](../.agents/skills/long-form-assembly-video/references/stop-gates.md)
- [.agents/skills/long-form-assembly-video/references/repository-adapter.md](../.agents/skills/long-form-assembly-video/references/repository-adapter.md)
- [AGENTS.md](../AGENTS.md)

### UI

- [src/components/export/ExportVideoModal.tsx](../src/components/export/ExportVideoModal.tsx)
- [src/components/export/ExportProgress.tsx](../src/components/export/ExportProgress.tsx)
- [src/app/globals.css](../src/app/globals.css)

### Backend/contracts

- [src/engine/export/ExportJobManager.ts](../src/engine/export/ExportJobManager.ts)
- [src/engine/export/ExportCheckpoint.ts](../src/engine/export/ExportCheckpoint.ts)
- [src/engine/export/CreativeIdentity.ts](../src/engine/export/CreativeIdentity.ts)
- [src/engine/export/ExportMedia.ts](../src/engine/export/ExportMedia.ts)
- [src/app/api/export/route.ts](../src/app/api/export/route.ts)
- [src/app/api/export/[jobId]/route.ts](../src/app/api/export/[jobId]/route.ts)
- [src/products/export-manager.ts](../src/products/export-manager.ts)
- [src/types/export.ts](../src/types/export.ts)
- [src/types/product-package.ts](../src/types/product-package.ts)
- [src/engine/render/FrameRenderer.ts](../src/engine/render/FrameRenderer.ts)
- [src/components/viewer/ProductViewer.tsx](../src/components/viewer/ProductViewer.tsx)

### Tests/smoke

- [src/engine/export/ExportJobManager.test.ts](../src/engine/export/ExportJobManager.test.ts)
- [src/engine/export/ResumableExport.test.ts](../src/engine/export/ResumableExport.test.ts)
- [src/engine/export/ExportActions.test.ts](../src/engine/export/ExportActions.test.ts)
- [src/components/export/ExportProgress.test.tsx](../src/components/export/ExportProgress.test.tsx)
- [scripts/verify-resumable-export.ts](../scripts/verify-resumable-export.ts)

### Documentation

- [README.md](../README.md)
- [docs/resumable-export.md](../docs/resumable-export.md)
- [docs/resumable-export-implementation-review.md](../docs/resumable-export-implementation-review.md)

## Git review scope
Only README.md was tracked before this task; most existing source/instruction/output files were already untracked. `git diff --stat` reports README's two insertions/two deletions, not the entire implementation. The file list above is the concrete task change set; no unrelated untracked files were staged or claimed as new. No commit/deployment was made. Persistent QA/checkpoint artifacts are under output/export-infrastructure-qa and output/export-jobs; approved output trees were not edited.

STOP after implementation, tests, documentation and this review package.
