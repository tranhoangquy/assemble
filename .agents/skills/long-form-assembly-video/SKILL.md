---
name: long-form-assembly-video
description: Produce or revise long-form instructional 3D assembly videos from authoritative manuals, using mechanical gates, deterministic native rendering, director reviews and licensed music-only mastering. Use for assembly-video production in this repository; process documentation alone does not authorize rendering or publishing.
metadata:
  version: "1.1"
---

# Long-form assembly video
Read the repository [production standard](../../../rules/long-form-assembly-video.md) before work. Its obligations govern this workflow; do not duplicate or override them here. If the standard is missing after migration, STOP and locate it rather than inventing a replacement.

Inspect AGENTS.md, product package, engine and validation conventions. Map conceptual artifacts to existing typed data/files; do not refactor runtime merely to match names. In this repository read [repository adapter](references/repository-adapter.md). Continue from the latest evidenced gate; do not restart or reopen approved creative work without an authorized revision or genuine regression. Skill invocation does not authorize every downstream phase.

Record gate status and evidence using [artifact contract](references/artifact-contract.md). Instantiate relevant [templates](templates/) in the product's isolated revision workspace. Never treat a blank template or unchecked checklist as PASS.

## Pipeline
| Phase | Work and exit evidence | Checklist/template |
|---|---|---|
| 0 Intake | Resolve product, authoritative manual, variant/scope, duration, presentation/material references, native resolution/FPS and audio direction. Create brief and authority manifest; STOP for missing major scope decisions. | [Source intake](checklists/source-intake.md); [brief](templates/product-brief.md), [authority](templates/source-authority-manifest.json) |
| 1 Extraction | Extract source-referenced part/hardware quantities, step order, joints, mechanisms, variants and manpower/support needs. Complete inventory before cinematic animation. | Source intake; artifact contract inventory |
| 2 Product | Reconstruct geometry, dimensions/proportions, materials, transforms/hierarchy, pivots, connections and required holes. Document significant inferred dimensions; omit irrelevant microscopic detail. | Brief and authority inference ledger |
| 3 Assembly | Build graph, dependencies, operations, hardware relationships, states and installation paths. Validate mechanical order before directing. | [Mechanical](checklists/mechanical-validation.md) |
| 4 Mechanical validation | Run applicable validators; inspect actual meshes where proxy bounds are insufficient. Distinguish allowed mating contact from penetration; validate support, access and final function. STOP on P0 failures. | [Mechanical report](templates/mechanical-validation-report.md) |
| 5 DirectorPlan | Translate validated operations into current state, active part, target, staging, alignment, connection, hardware, securing, verification, camera and duration. | [Director](checklists/director-plan.md), [plan](templates/director-plan.md) |
| 6 Connections | Apply source-specific canonical connection recipes; first occurrence teaches, repetitions may shorten. Do not invent fastener order, torque or mechanism constraints. | [Connection recipes](references/connection-recipes.md) |
| 7 Camera | Plan medium-wide → target → close-up → axis/detail → pullback; inspect occlusion through the action, move camera rather than mechanical path. | [Camera](checklists/camera-occlusion.md) |
| 8 Timing | Mark teach moments, repeats, mechanism moments, holds and transitions; calculate runtime. Compress repetition first, never globally accelerate. | Director checklist; timing artifact |
| 9 Presentation | Once assembly timeline is stable, create intro/showcase/environment. Verify exact reset to first assembly state and separate props from structural registry/collision. | Director and camera checklists |
| 10 Whole-product audit | Inspect all endpoints and important intermediate/final states from adequate angles, create stills/contact sheets and classified feature ledger. Fix proven defects only, then rerun mechanical regressions. | [Fit/holes](checklists/fit-hole-audit.md), [audit](templates/fit-hole-audit-report.md) |
| 11 Freeze | Run required tests/gates; record creative data/source fingerprints, provenance, timeline, camera, materials and DirectorPlan. Failures block full render. | [Freeze](checklists/pre-render-freeze.md), [manifest](templates/pre-render-freeze-manifest.json) |
| 12 Silent render / resumable export | Read [resumable export](references/resumable-export.md) and use [long-render QA](checklists/long-render-generate-file-qa.md). Use deterministic frame-index time. For long jobs validate/resume sequential chunks, checkpoint and retry within a declared bound. Validate fresh contiguous frame count/dimensions before encoding silent master. Test native high-res resources first when needed. | [Visual QA](checklists/visual-master-qa.md), [high-res](checklists/high-res-render-safety.md) |
| 13 Visual review | Return full silent master plus targeted clips/contact sheets for director clarity, mechanics, camera, fit, holes, function and presentation review. Lock only after explicit approval and technical PASS. | [Decision](templates/director-review-decision.md) |
| 14 Audio | After visual approval, pass provenance/acquisition gate with approved source/local assets. Analyze phrases/energy and build music-only audio master before mux. | [License](checklists/music-license-provenance.md), [audio](references/audio-and-mux.md), [provenance](templates/music-provenance.json), [edit plan](templates/music-edit-plan.json) |
| 15 Audio review | Return full preview, all transitions, intro and ending. Director listens and approves or revises. Keep selected transitions locked; recalculate downstream placement when upstream edits change. Lock approved complete audio. | [Listening](checklists/audio-listening-review.md); decision template |
| 16 Final mux | Verify both master hashes; prefer video stream copy plus approved audio encode. Verify ordered packets/frames, timing, full decode, audio, faststart and output hash. No unapproved mastering after audio lock. | [Mux QA](checklists/final-mux-qa.md), [final report](templates/final-master-qa-report.md) |
| 17 Release package | Only after final master approval and if requested, prepare title/description, credits, chapters, thumbnail brief and upload metadata. Publishing is a separate explicit action. | Artifact contract and final decision |

## STOP handling
Read [stop-gates.md](references/stop-gates.md). On a blocker, preserve completed evidence, report exact failed/pending gate, provide the concrete review package or missing decision and stop dependent phases. Do not silently bypass a gate, modify tolerances or manufacture director approval.

Report raw outcomes separately from explanations: a timeout is not an established geometry defect or PASS; authorized source changes do not turn a strict old-hash failure into PASS; a navigation abort can coexist with an intact downloaded artifact. If unable to listen, report NOT RUN for agent listening and `VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING`; numeric audio checks do not replace director review.

End at the user's authorized deliverable/review boundary. Preserve approved masters and all previous revisions. No automatic product expansion, high-resolution render or upload.
