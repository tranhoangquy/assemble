# Short standard and post-final cleanup

Status: **SHORT STANDARD COMPLETE / CLEANUP COMPLETE**.

## Rule and skill

- [Short production Rule](/Users/quyth/development/three/POC/rules/short-form-assembly-video.md) — v1.0,20 normative invariants: shared product/AssemblyGraph truth, separate editorial identity, native1080×1920/30fps/<=60s, readable compression, functional hook/reset, story/camera/captions, valid proof/payoff, determinism, shared resumable export, isolated revisions, visual→music→final gates, music-only policy, final verification and immutable accepted masters.
- [Short production Skill](/Users/quyth/development/three/POC/.agents/skills/short-form-assembly-video/SKILL.md) — v1.0,10 procedural phases: preflight, product-specific Director plan, presentation implementation, regression QA, full silent review, requested revision, visual freeze, Short-specific music, authorized mastering/mux, final freeze/cleanup. WF311613 is an example, never a fixed timestamp/product rule.
- [Shared retention policy](/Users/quyth/development/three/POC/rules/production-artifact-retention.md) — authorized exact-path cleanup, source/reproduction retention, hash checks and honest historical deletion ledger.

AGENTS.md routes Short requests and the existing Long Rule links the shared Short/retention standards. Shared mechanical/provenance/audio/export guidance is linked rather than duplicated. No product, engine, exporter or UI architecture was changed. The new repository-local skill is discoverable through `.agents/skills`; this report does not claim dynamic registration in the already-running chat.

## Audit and deletion

Audit: [cleanup-audit.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/maintenance/short-standard-cleanup-20261007/cleanup-audit.json)

Before-delete manifest: [deletion-manifest.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/maintenance/short-standard-cleanup-20261007/deletion-manifest.json)

Actual removal ledger: [deletion-ledger.jsonl](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/maintenance/short-standard-cleanup-20261007/deletion-ledger.jsonl)

Retention/dependency explanation: [retention-ledger.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/maintenance/short-standard-cleanup-20261007/retention-ledger.json)

**6,224files**, **6,176,404,144logical bytes** (**5.752GiB**) and **35empty directories** removed. No symlinks followed. All paths were classified before mutation and hashed immediately before deletion.

| Removed category | Files | Logical bytes | GiB |
|---|---|---|---|
| export-job-stale | 2,363 | 2,737,064,279 | 2.549 |
| export-encode-intermediates | 1 | 5,307,176 | 0.005 |
| completed-export-frames | 1,740 | 1,962,060,884 | 1.827 |
| export-job-completed | 12 | 5,279,981 | 0.005 |
| obsolete-pacing-screenshots | 106 | 42,993,563 | 0.040 |
| short-music-review-previews | 9 | 4,264,294 | 0.004 |
| empty-logs | 9 | 0 | 0.000 |
| audio-analysis-cache | 1 | 1,572,774 | 0.001 |
| short-music-internal-iterations | 5 | 83,520,510 | 0.078 |
| native-smoke-frames | 240 | 351,366,073 | 0.327 |
| obsolete-fit-probe-frames | 1,719 | 738,654,735 | 0.688 |
| obsolete-procedural-sfx-pass | 19 | 244,319,875 | 0.228 |

Large completed/stale/smoke frame caches, superseded fit/native probes, early pacing screenshots, rejected procedural audio, Short rejected/unlevelled/duplicate iteration WAVs, NPZ and redundant convenience previews were disposable. Exact stale-job checkpoints/logs were copied and hash-verified to `retained-job-evidence/` before those job directories were retired. The full completed Short02 job retains its finalMP4/manifest/logs; only raw frames and silent intermediary were purged. Terminal manifest hashes and absent worker lock supplied the concurrency gate; process listing was unavailable in the sandbox and is reported as such.

Historical decisions remain understandable through retained Short01→Short02 visual→MusicPass01→FINAL reports/plans/hashes/stills/contacts, the actual source/review media needed by final scripts and source/license evidence. Whole LongPass01/02 music directories are retained because production reproduction assertions still depend on historical approved clips/freeze inputs. All40 files in the final Short checksum bundle remain intact, including its reproducibility intermediate. Unrelated products are retained.

Historical SHA/freeze reports still describe their original snapshots. Their intentionally removed disposable entries are identified in this task's path/hash ledger; they are not claimed to be currently available. Current final Short master bundle is fully verifiable. No changes to automatic retention/resume behavior; purged frames need fresh validation/render before future reuse.

## Preservation and validation

**2,207protected hashes PASS before and after**, covering application/source/tests, product/assembly/material/geometry data, rules/skills, all KEEP media/evidence and approved sources. Explicit finalShortMP4/WAV, approvedShortvisual/MusicPass01WAV, Longsilent/musicMP4 and LongPass02WAV match Director-authoritative expected hashes. Final Short bundle40/40 checksum entries PASS.

- Skill frontmatter validation PASS using bundled validator with existing systemPyYAML; no dependencies installed.
- 21local governance/skill links PASS.
- TypeScript `npm run typecheck` PASS, including after cleanup.
- Lightweight regressions: **75tests/13files PASS**, covering Short/Long state/seek/function and shared export/native/fingerprint/checkpoint behavior.
- No new video or audio render. No app build was required for this documentation/output cleanup.
- Git delta: **2,086manifest-listed tracked deletions** plus5 intended governance status entries (AGENTS,Longcross-links,newShortRule,newShortSkill,newretentionRule). Existing source changes are preserved; the previously modified stale1440p checkpoint is preserved byte-identically in the audit archive before retirement. No staging/commit/history rewriting, `git gc` or LFS changes.

See `validation.json`, `protected-verification-before.json`, `protected-verification-after.json`, `final-master-bundle-verification.json` and `git-delta.json`. Logical size snapshots (output and repository working files) are in `size-before-deletion.json` and `size-after-cleanup.json`; repository excludes `.git`,node_modules,`.next` and symlinks. Logical bytes removed are not a measurement of APFS physical disk reclamation. Net size changes include added compact audit/retention records.

Final Short MP4 remains `/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/short/final-short02-1080p/WF311613-short02-FINAL-vertical-1080p.mp4` withSHA256`e24317a8787379ad9ba2aab19d5d58fd1012953de6a73a923759d492035c4a79`.

Final Short WAV remains `/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/short/final-short02-1080p/WF311613-short02-FINAL-music-master.wav` withSHA256`5ba9089960a09efb55e3e3a57e32ffb11692f2e134b5f1378097101fe883785a`.

Both frozen Longmasters and approved sources remain. No publication/upload or creative revision. STOP.

## Size snapshots

| Scope | Before logical bytes | After logical bytes |
|---|---|---|
| Output | 8,063,277,130 | 1,889,230,945 |
| Repository working files (specified exclusions) | 8,146,727,794 | 1,972,681,609 |

Table snapshot precedes this final report table/manifest growth; final counters are recorded in size-after-cleanup.json.
