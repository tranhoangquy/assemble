# WF311613 Short #01 implementation

The existing WF311613 product now exposes Long Video and Short Video in the same viewer and Generate File flow. Long remains the default. This revision stops at a silent Short visual review; visual approval, music editing, listening approval and final music mux are separate director gates.

## Shared representation and export

`ProductPackage.shortPresentation` is an optional presentation on the existing product entry. It contains a video definition, filename and optional checkpoints. Product geometry, materials, product registry identity and assembly definition are shared references. The WF311613 Short lives in `src/products/wf311613-standalone-murphy-bed/director/short01.ts`; the approved Long source files are unchanged.

`PresentationSelection` resolves the selected video without inheriting the approved Long audio master. The workspace persists Short selection in its URL, keeps the same product viewer/meshes when changing presentations, and replaces only the video engine/timeline/camera. A product without Short keeps Long and disables Short honestly.

The opt-in editorial clock evaluates forward windows or holds from the original validated Long engine, using the same ObjectRegistry, ProductTree, AssemblyGraph, mechanism solvers and renderer. Short-specific cameras then frame that state vertically. Editorial cuts omit work; they do not introduce new attachment transforms or reverse installation. There is no global speed multiplier.

Generate File passes the selected `videoId` to the existing `/api/export`. The existing ExportJobManager, FrameRenderer, checkpoint schema 2, chunk validation, retry, browser recycling, encode and verification remain the export path. The added `vertical-1080p` profile is native 1080×1920 at 30 fps; Short rejects horizontal profiles. Existing horizontal profiles and the Long default are retained.

Short controls allow the maximum distance required by its own presets; Long retains the existing 850 limit. Native QA checks actual camera positions against every preset so a controls clamp cannot silently invalidate composition.

Job identity includes the selected video ID/hash and complete creative/source hashes. Recovery resolves the same selected presentation. The modal waits for checkpoint recovery before enabling Generate File, avoiding a transient false Ready state. UI job focus includes product and video IDs; a job cannot be relabeled or downloaded as the other presentation. PATCH identity guards also check video ID. The development singleton refreshes when its catalog instance changes, preserving durable checkpoints on disk.

The existing render page now resolves creative data on the server and serializes it to ProductViewer. A real smoke gate found 144 last-bit coordinate differences between Node and Chromium trigonometry when both recomputed the procedural data. The fix supplies canonical data rather than weakening the exact creative fingerprint. `creative-mismatch-diagnosis.json` preserves this evidence. No product coordinates or geometry source was edited.

## Short directing

58 seconds, 30 fps, 1,740 frames, 27 shots. Hook: 2 seconds. Bed-to-cabinet section: 10 seconds. Mechanism section: 8 seconds. Final function/hero: 6 seconds. English captions use a conservative vertical safe area. Full per-shot source states, action/hold, camera, caption, transition and validation notes are in `SHORT-DIRECTOR-PLAN.json`.

Repetition is omitted by cuts: a clear first slat/retainer/leg connection leads to a later valid complete state. Final functional motion uses the original source speed. The wall anchoring milestone presents the approved completed state rather than showing each anchor installation.

## Validation evidence

- Targeted suite: 95 tests passed across 14 files. Includes presentation selection, native profiles, Long/Short identity and recovery, export action guards, existing resumable export tests and approved Long micro-pass regression.
- Mechanical trajectory test compares transforms, visibility and geometry identity at three points in each Short shot, seeking in both directions. It uses the original engine's states. Only test comparisons quantize floating-point state serialization to 1e-9; production hash gates remain exact.
- Webpack production build and TypeScript checks passed.
- Source lint passed. Repository-wide lint reports 59 errors and 24 warnings in retained historical output scripts; those protected evidence files were not edited.
- `creative-freeze.json`: exact Long creative data and package hashes unchanged.
- `protected-after.json`: 3,064 of 3,065 protected files unchanged; the sole authorized difference is the product index adding the Short presentation. No protected files missing.
- A framing regression test samples the moving cap and carrier/face bounds at 11 points per affected shot, keeping them within the vertical action region. Native start/mid/end captures supplement the conservative geometry bounds.
- Browser/native smoke results: see `native-preflight.json`, `native-smoke-gate.json` and `browser-smoke.json` for actual gate status, job identity, frame preservation, surface, safe-area bounds and pixel comparisons.

`implementation-files.json` lists every added/changed implementation file. Earlier tracked cleanup deletions are independent, pre-existing changes; this task performs no further workspace cleanup.

Full visual job `17af60ac-e3ba-4bd3-b62e-ab0bf7ba9201` completed all 1,740 frames in 6 chunks (300-frame policy; last chunk 240). H.264/yuv420p output is 1080×1920 at 30 fps for exactly 58 seconds, with no audio stream. Full decode, frame count and faststart passed. The copied product review file is SHA-identical to the verified job artifact. Encoded cap/carrier/pivot/piston/ending spot checks passed. Final paths, SHA and statuses are in `SHORT-VISUAL-REVIEW.md` and `SHORT-VISUAL-QA.json`.

Nonblocking style check: `git diff --check` reports one trailing space in the optional type declaration in `src/types/product-package.ts`. Runtime/source lint passes; the source is kept at its frozen render fingerprint.

## Boundaries and warnings

Status remains REQUIRES DIRECTOR REVIEW. Technical validation does not approve pacing, hook strength or musical content. Pivot and piston shots deliberately use close-ups; the surrounding cabinet can be cropped while the active connection is visible. The support shots prioritize the horizontal platform; some background cabinet edges can leave the vertical frame. Anchoring work and repeated connections are editorial omissions.

Short music edit: NOT RUN. Audio mux: NOT RUN. No narration, voices, procedural SFX or workshop ambience are added. Existing director-supplied local music/provenance was inspected for the later audio phase; no downloads or alternate versions were used. Full Long render, full 4K render and publishing: NOT RUN.

The first full Short attempt was cancelled after native PNG inspection found clipped moving components; 587 valid frames remain as diagnostic evidence and are not reused. A subsequent native audit exposed the 850-distance camera clamp, which was corrected only for Short. Before/fix metadata and images are preserved in `framing-before-camera-fix/`. The pre-existing Long checkpoint and failed Short smoke checkpoint are retained. They are not resumed as part of this task. Historical contact sheets/probe stills are diagnostic iterations; only `CONTACT-SHEET.jpg` and the explicit final still manifest are the review selection.

## Director visual review

Please assess the first two-second hook and immediate product recognition; the satisfaction of the assembly progression; any action that is too fast or repetitive; clarity of the bed/cabinet connection and piston hero; vertical framing and phone caption readability; and the final functional payoff. Approve or request visual revisions before any Short music edit begins.
