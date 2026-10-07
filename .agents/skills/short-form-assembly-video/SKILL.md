---
name: short-form-assembly-video
description: Produce or revise native portrait furniture assembly Shorts over validated product/assembly data using the shared presentation and resumable export system, Director gates and music-only mastering. Use for Short production in this repository; documentation or cleanup requests do not authorize rendering or publishing.
metadata:
  version: "1.0"
---

# Short-form assembly video
Read [the Short production standard](../../../rules/short-form-assembly-video.md); it defines WHAT remains true. This skill defines HOW to work. Reuse its linked shared Long authority/mechanical principles, rather than duplicating a product or assembly implementation. Follow the user's scope and latest evidenced gate; do not restart approved creative work.

Read the [repository adapter](../long-form-assembly-video/references/repository-adapter.md) and [artifact/status contract](../long-form-assembly-video/references/artifact-contract.md). Use conceptual artifacts in existing repository formats, not duplicate schemas. Check AGENTS.md and relevant local Next guidance before application code changes. WF311613 is a reference, not a template with fixed timings.

## 1 — Preflight
Inspect the chosen product package, validated AssemblyGraph/source mechanical behavior, Long presentation if available, mechanisms, tests and protected outputs. Record authoritative sources and applicable existing mechanical gates. Resolve missing variant/mechanical truth before directing. Choose a separate Short presentation/video identity, native1080×1920/30fps profile, <=60s duration and revision directory. Snapshot protected source/master hashes and relevant working-tree state.

Inspect current APIs/types rather than assume video IDs or exporter flags. In this repository presentation selection is under `src/engine/video/PresentationSelection.ts`, editorial source evaluation under `EditorialVideoEngine.ts`, product videos under `src/products/<key>/director/`, and shared exports under `src/engine/export/`. These are adapters to inspect, not a demand for refactoring. No new product registration or separate exporter just to make a Short.

## 2 — Director/shot plan
Plan before full rendering. Define hook, major groups, representative operations/repeats omitted, critical connection, mechanism, valid functional proof, completion/payoff and hero. Assign portrait context/medium/macro intent, captions, safe area and product-specific timing. Record source scene/time windows, resulting state and any canonical reset/restore at every editorial boundary. Do not begin by scaling all Long timestamps. Explain how omitted work remains semantically true and readable.

## 3 — Implement presentation
Implement an editorial/presentation layer over validated source evaluation. Keep source-time mapping explicit; local windows/holds/cuts can have authored durations without a global speed multiplier. Restore canonical state at each seek before evaluating demonstrations, source actions, camera or captions. Keep presentation-only movement out of product geometry/AssemblyGraph mutations. Separate creative fingerprint from Long and prior Short revisions. Inspect current camera/native surface and caption layout conventions.

## 4 — Automated/pre-render QA
Run relevant tests for source-state equivalence, forward/backward seek, finished hook→assembly reset, proof→canonical restoration, camera/active-operation readability, caption safe areas, native profile, distinct fingerprint/checkpoints and unchanged Long behavior. Run typecheck and other applicable repository gates; distinguish pre-existing failures from new failures without waiving required regressions. Inspect actual native boundary/key states, especially source-window cuts and macro context. Freeze source/evaluated creative hashes only after applicable gates pass.

## 5 — Silent visual review
Read [shared resumable export procedure](../long-form-assembly-video/references/resumable-export.md), [shared render QA](../long-form-assembly-video/checklists/long-render-generate-file-qa.md) and `docs/resumable-export.md`. Use existing Generate File/chunk exporter; validate identity before resume. Persist bounded retries/checkpoints and require all contiguous frames before encode. Do not create a separate export pipeline or crop a landscape render.

Package full silent native candidate, contact sheet, functional/story sheet where useful, selected native stills with manifest, director plan, implementation report, visual QA and hashes. Compare native key states and encoded output rather than assume a successful encode is visual approval. Record actual observations and limitations. STOP at **REQUIRES DIRECTOR REVIEW**. No audio production before visual approval.

## 6 — Director revision
Apply requested presentation/camera/caption/story revisions only. Reopen product/assembly truth only for an evidenced defect and within authorization. Use a fresh revision directory and new fingerprint; preserve old evidence and decisions. Re-run affected determinism/Long regressions and produce a new silent full candidate. Director-requested examples do not become universal timestamps.

## 7 — Visual freeze
Bind explicit Director approval to candidate path/SHA/revision and verified profile, frames/duration. Treat pixels/timing as immutable through audio. Recheck input hashes; avoid unnecessary regeneration/re-encode. A new authorized picture revision invalidates downstream automatic freshness.

## 8 — Short-specific music edit
Read [shared audio/provenance/mux procedure](../long-form-assembly-video/references/audio-and-mux.md) and [listening checklist](../long-form-assembly-video/checklists/audio-listening-review.md). Use licensed/approved local sources; Director-supplied sources do not authorize re-downloading/substitution. Reusing approved Long music requires source hash, inherited provenance/credits and intended-use scope. Do not simply take its first Short-duration seconds.

Analyze intro/body/release, pulse/phrases/energy and choose natural regions against the frozen story. Record exact sample IN/OUT, overlap, global placement, curves, gains and any conservative music-only time adjustment. Musical phrase/meter inferences without hearing remain provisional. Preserve useful energy through the hero, then a natural exact endpoint; no blind loops, new instruments or unapproved sound layers. Never retime picture.

Build lossless exact-length WAV before preview/review mux; stream-copy approved picture. Measure WAV and encoded loudness/true peak, finite/clipped samples, gaps, endpoint and waveform alignment. Listen to the entire mux and hook/body/transition/mechanism/payoff/ending if capable, documenting actual tool/reviewer and observations. If not capable, mark agent listening **NOT RUN** and **VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING**; supply full preview and contextual clips, never invent a listening PASS. Stop at **REQUIRES DIRECTOR AUDIO REVIEW** unless user expressly authorizes a different gate. A single splice approval does not approve a complete arrangement.

## 9 — Final mastering/mux
After music direction approval, obtain the actual authorized mastering scope: approval of an exact WAV does not imply new processing; explicit final-mastering authorization can permit envelope/compression/fade changes. Preserve song/arrangement/splice unless a genuine technical defect requires an authorized fix. Aim for mobile consistency with smooth gains, conservative dynamics and useful late hero presence; set actual loudness/peak targets from the brief (WF311613 final used roughly−14.5LUFS and <=−1dBTP, not a universal hardcoded requirement).

Archive exact-duration mastered WAV and reproducible configuration/commands. Record all processing, including quantization/time adjustments and old-fade removal if applicable. No changes to picture, new creative elements, SFX/narration/ambience without authorization. Verify inputs then map only approved picture and final audio; prefer H.264 stream copy and AAC48k stereo/high-quality bitrate/faststart.

Use [shared final mux QA](../long-form-assembly-video/checklists/final-mux-qa.md): ordered packet payload/timing/side-data and codec/extradata comparison where possible; decoded frame equivalence; expected frames/native profile/duration; full decode; AAC priming/padding versus intended endpoint; zero drift using decoded-waveform checks; final encoded loudness/true peak/clipping/gaps; protected hashes. Record honest exceptions and actual listening separately. Designate **FINAL MASTER COMPLETE** only when the Director's stated final gate and mandatory technical checks pass; otherwise report the exact blocker/review gate.

## 10 — Freeze and authorized cleanup
Freeze finalMP4/WAV, hashes, approvals, provenance/credits, verification, director/source plan and working reproduction inputs/scripts. Link reports to absolute artifact paths and retain original observations/status history. Do not publish without separate authorization.

For explicit cleanup read [production artifact retention](../../../rules/production-artifact-retention.md). Inventory exact paths/counts/logical bytes and classify protected, historical or disposable. Inspect script/input/approval references; retain raw music, selected approved excerpts and any media actually needed by reproduction. Prefer compact decision/QA evidence to obsolete raw sequences. Keep active resumable jobs and unrelated products; do not guess from age or filename alone.

Write deletion manifest with reason/hash and protected baseline before any deletion. Verify hashes, delete only audited disposable files, remove only audited empty directories, record actual ledger and size changes, verify protected hashes afterward and run lightweight tests/typecheck/doc-link/frontmatter checks. Keep historical SHA manifests unchanged and explain removed referenced files through a retention ledger; final master bundles must remain verifiable. No destructive Git/history/LFS operations or new render/audio render during documentation/cleanup work.

## WF311613 reference
Inspect `src/products/wf311613-standalone-murphy-bed/director/short02.ts`, corresponding Short tests and `output/wf311613-standalone-murphy-bed/short/` reports for an implemented example: distinct editorial identity, explicit source windows, functional hook/reset, connection macro, restored mechanism proof and completed close→open→hero. Reference Director decisions and final mastering records; do not copy its58s shot timestamps or music edits as business rules. Its final-master reproduction uses the selected Pass01 WAV and the Pass01 reviewMP4 video stream: keep those inputs while that script remains authoritative.
