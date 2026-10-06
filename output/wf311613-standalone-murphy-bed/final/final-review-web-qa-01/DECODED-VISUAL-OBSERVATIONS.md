# Actual review MP4 — decoded visual observations

This is a read-only technical observation, not director approval. No creative or mechanical edits were made.

Inspected the completed MP4 contact sheet and individual decoded PNGs: finished intro hero, fully exploded intro, exact Step 1 reset, Step 26 active connection and final hero.

- The finished intro shows the complete closed cabinet in the approved bedroom. Product edges and the cabinet face are visible; no unexpected black frame or viewport crop is visible in this still.
- The exploded overview keeps logical large groups legible: top cap separated above, side/mechanism assemblies separated laterally, face/carrier groups separated in depth. Small hardware is not scattered. The room/mattress/bedding are not exploded.
- Step 1 is a clean supported parts layout in the assembly room. No completed cabinet, exploded offsets, bedroom furnishings, mattress or bedding leaks into the reset still. Its fresh source PNG also matches the baseline exactly according to the technical report.
- Step 26's decoded active macro visibly shows the threaded stud and piston-eye assembly in the real interior gap. The eye/stud hardware is not obscured by a front panel; the relevant threading/retention geometry is readable in the frame. The mechanism sits somewhat below image center but remains within the approved composition. No camera change is recommended or authorized here.
- The final hero shows the fully open bed, deployed legs, mattress/bedding, restrained bedroom, rug and bedside table together. No viewport clipping, aspect distortion or unexpected object disappearance is evident in this decoded still.
- The 30-frame decoded contact sheet is consistent across assembly, mechanism and finished-bedroom states. Close-up framing differs from wide context deliberately. A still/contact-sheet audit cannot alone prove motion pacing or absence of every transient intersection; unchanged mechanical/path gates and full decode complement this inspection.

Technical render evidence: 15,722 frames; 524.066667 s; 1280×720, 30 fps CFR, H.264/yuv420p, silent; complete decode and black-interval checks PASS. The optional favicon 404 and adjacent-binary64 camera replay differences remain explicitly preserved in their diagnostic reports.

## Source-lock boundaries

At the initial post-render read-only audit, all 214 frozen source files and all 126 history files were unchanged. The WF311613 product package, all animation/assembly/camera/geometry/material/installation mechanisms, presentation room/intro assets and native validation rules remain protected.

The subsequent user-authorized work is generic export/web resolution infrastructure only. `authorized-generic-resolution-paths.json` names proposed eligible paths; it is not blanket approval of arbitrary content in them. Product data, mechanical engines, cameras, timings, wording and lighting must remain unchanged. Native 720p equivalence and cross-resolution state/raster tests must evaluate host adaptations separately.

The historical 92-source micro validator includes generic `ExportJobManager.ts` and `FrameRenderer.ts`, but its own source-delta branch allows only `ProductViewer.tsx`. Therefore those newly authorized generic edits can cause a historical source-hash failure even without a mechanical change. Do not rewrite that validator or conceal the mismatch. Preserve its pre-infrastructure PASS and report new authorized byte deltas independently alongside unchanged mechanical gates and data locks.

## Rerun existing gates without overwriting history

The exact prior wrapper is:

`final/final-micro-pass-visual-master-verification/sequential-pre-render-retry-01/run-approved-gate.mjs`.

Copy its bytes into a NEW evidence directory (for example `final/final-review-web-qa-01/post-infrastructure-validation/run-approved-gate.mjs`) and invoke:

```sh
node --import tsx output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-infrastructure-validation/run-approved-gate.mjs mechanical
```

It imports the unchanged `src/products/wf311613-standalone-murphy-bed/validation/run-polish02-gates.ts` and redirects ONLY report writes to `approved-mechanical-gates` beside the wrapper. It changes no assertion, tolerance, validation data, or source. Run heavy gates/tests/build sequentially as requested.

The same wrapper's `props` mode reruns the existing Polish 02B presentation checker with writes under `polish02b-presentation`; `micro` mode reruns the native micro validator unchanged under `micro-native`, including the legacy-source-lock caveat above.
