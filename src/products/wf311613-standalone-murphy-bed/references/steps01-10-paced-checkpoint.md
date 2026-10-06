# WF311613 — Steps 1–10 paced director-review checkpoint

Scope: implement Steps 4–10 after the user-approved Steps 1–3 action-speed V2. Stop before Step 11. This report does not claim director approval or completion of the 31-step product.

## Deliverable

Export path: `/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-10/wf311613-steps-01-10-paced-review.mp4`.

Export verification: **COMPLETE**. `ffprobe` confirms 1280×720, 30 fps, H.264/yuv420p, 6,778 frames and **225.933333 seconds** (3:45.93). File size: 11,712,734 bytes. The entire MP4 decoded successfully without errors. Extracted encoded-video frames at the right-bracket screw and final Step 10 overview were visually checked. The review is silent with English instructional captions; no final audio/polish pass was added. The render script samples the actual deterministic timeline frame by frame; it does not speed up an existing video or substitute a slideshow.

Product selector: **WF311613 · Steps 1–10 paced director review** (`wf311613-steps01-10-paced`). Old review variants remain labeled separately; the legacy 1–10 render is not this checkpoint.

## Runtime

| PDF step | Timeline seconds | Cumulative end, seconds |
| --- | ---: | ---: |
| 1 | 40.897333 | 40.897333 |
| 2 | 25.646722 | 66.544056 |
| 3 | 31.722222 | 98.266278 |
| 4 | 13.550000 | 111.816278 |
| 5 | 13.550000 | 125.366278 |
| 6 | 19.750000 | 145.116278 |
| 7 | 17.530000 | 162.646278 |
| 8 | 19.180000 | 181.826278 |
| 9 | 16.130000 | 197.956278 |
| 10 | 27.970000 | 225.926278 |

Total deterministic timeline: **225.926278 seconds**, approximately **3:46**. Verified 30 fps export: 6,778 frames / 225.933333 seconds (frame-grid rounding only). Steps 1–3 remain exactly 98.266278 timeline seconds with unchanged shots/actions/camera presets/material definitions and baseline part geometry.

## Validation

After the final bracket-camera correction:

- Typecheck: PASS.
- Lint: PASS.
- Tests: PASS, 7 files / 51 tests.
- Production build: PASS.
- Assembly validation: PASS, 10 steps / 176 connected operations, zero errors and zero warnings.
- Deterministic backward-seek / reset test: PASS, including restoration of geometry variants.
- Approved-prefix regression tests: PASS (Steps 1–3 shots/actions, camera presets, material definitions and baseline part geometry).
- Top-cap rigid-carry tests: PASS at multiple insertion progress values; all seven wood members and six installed screws retain relative positions.
- All-bolts-started-before-tightening tests: PASS for Steps 4–6.
- Handedness / hardware quantities: PASS, D9 right / D8 left / E5 center; ten #21 screws per link, two #14 per bracket, all nine #24 screws.

80 deterministic still checkpoints are saved under `/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/screenshots/wf311613-steps01-10-paced/`. Visual inspection covered panel/center-tie insertion, end-bolt installation, separate top-cap assembly, edge #13 screws, cap transfer/lowering, downward #12 screws, D9 plate/receiver, E5 upper screw and both #25 bracket close-ups. A cap-occluded bracket view was corrected by cutting to an interior camera below the cap. No physical part was moved through an installed part to solve that camera problem.

Selected final checkpoints: [Step 1](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/screenshots/wf311613-steps01-10-paced/step-1-result.png), [Step 3](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/screenshots/wf311613-steps01-10-paced/step-3-S3-complete.png), [Step 8](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/screenshots/wf311613-steps01-10-paced/step-8-S8-complete.png), [Step 10](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/screenshots/wf311613-steps01-10-paced/step-10-S10-complete.png), [right bracket macro](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/screenshots/wf311613-steps01-10-paced/step-9-S9-H14-0-install-0.5.png), [E5 first screw](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/screenshots/wf311613-steps01-10-paced/step-10-S10-H24-8-install-0.5.png).

Validation checks authored connection/dependency and staged path envelopes. It is not a manufacturer tolerance certificate, mesh-level physics simulation or assurance that every hidden production detail has been reconstructed.

## Implemented assembly details

- Steps 4–5: two B8 panels, one B7 center tie and one D4 rail per row; two each #6 / #8 / #4. All bolts are started, squareness is checked, and only then the final tightening pass runs.
- Step 6: final B8 pair, B7, B5 and B6; four each #6 / #8 / #4, with the same start-all-before-tightening rule.
- Step 7: separate complete top-cap subassembly B1×2, B2×2, B3×1, B4×2 and six edge-driven #13 screws. Infills enter open routed channels before the rails close; screws enter B2/B3 along the edge axes.
- Step 8: the entire completed cap, including its six screws, rises above the cabinet before horizontal transfer. Four top dowels install, the cap aligns and lowers, then ten #12 screws drive downward. The cap depth is flush with the approved cabinet posts; intersecting screw/dowel axes were separated in the proportional reconstruction.
- Step 9: D9 is on PDF-right, inside the lower side panel. Its tall arm is near the back and its open lower bearing receiver faces the bed opening. Ten #21 screws fasten it, then one #25 bracket and two #14 screws install at the upper back inside corner.
- Step 10: D8 mirrors that operation on PDF-left. E5 seats on the cabinet center line on the accessible interior face and receives all nine #24 screws. The second upper #25 bracket receives two #14 screws. Separate interior verification shots show both D8 and D9 before the final cabinet overview.
- Each #25 uses two rigidly coupled mesh surfaces to depict **one bent physical bracket**, not two invented components.
- No bookshelf, storage module, mattress, desk, daybed identity or Option 2 scenes are introduced into this checkpoint.

## Pacing

The approved Step 1–3 pacing data is not changed. New Steps 4–10 compress connections already taught, using cuts rather than unnecessary camera flights.

- Repeated row dowel / cam / bolt-start actions: .44 / .42 / .65 seconds, followed by .06-second holds.
- Final row bolt feed/turn: .18 seconds, then .12-second cam lock and .06-second hold.
- Top-cap wood-screw sequences: first 1.30 seconds; second 1.00; later repeats .65. D9 first #21 screw: 1.30 seconds, repeats .65. Three visible turns communicate threading, with physical feed retained.
- Mirrored D8 first screw: .95 seconds; repeats .65. Bracket screws: .76 seconds.
- New part insertion actions: approximately .93–1.23 seconds plus controlled alignment/seat and short holds.
- No global playback multiplier, instant hardware pop-in or geometry/material redesign of Steps 1–3.

## DirectorPlan adjustments / deviations

**Steps 4–6 end-dowel installation path:** the two side assemblies are already secured after Step 3. Pre-inserting exposed rail-end dowels on both ends and then translating the spanning rail sideways would make a dowel cross an installed upright. Instead, the row panels and center tie enter the open row, the rail aligns/seats, then the two dowels are inserted from the accessible outside faces through the aligned receivers. Cams and bolts follow; every bolt starts before the tightening pass. PDF numbered-step order, part IDs and hardware quantities remain unchanged. This is an explicit within-step directing/mechanical-path adjustment, not a silent inheritance of legacy movement.

Camera cuts for the upper E5 screw and both upper brackets use interior viewpoints below the already-installed cap/front rail to expose the actual connection. These are visibility refinements within the approved instructional camera language.

The PDF's 284 mm reference is preserved between the lower-rail reference and the second-lowest E5 screw center. It is **not** treated as a fabricated overall E5 size; remaining hole positions are estimated.

## Remaining estimated geometry

PDF IDs, assembly order, quantities and printed fastener lengths are treated as authoritative. Unprinted values remain proportional / mechanically inferred:

- B8 row heights and widths; B7 widths, tongue sizes and receiver clearance; rail thicknesses.
- Side/end pilot positions, cam clearances, cap grooves/notches and top screw/dowel spacing.
- Cap depth proportional to the approved side-post depth, not a newly claimed manufacturer measurement.
- D8/D9 plate outline, thickness, open-cradle curvature and unprinted pilot positions.
- #25 bracket face sizes, bend approximation and exact upper-corner position.
- E5 width/thickness and screw positions other than the printed 284 mm relationship.
- Screw-head/recess dimensions, thread pitch and tolerances. Rotation/feed is instructional compression, not a full manufacturing thread-pitch simulation.

Evidence metadata marks these dimensions as estimated. Printed screw lengths do not imply that their entire head/thread geometry is manufacturer-precise.

## Product package and changed files

All new WF311613 part parameters, hole coordinates, assembly order, pacing choices, staging paths and camera presets are inside `/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/`.

New product files:

- `product/parts-step04-10.ts`: corrected row/cap/mechanism/E5 geometry and separate hardware.
- `director/steps04-10.ts`: product-owned shot/action/camera data; appends only Steps 4–10 to the approved prefix.
- `tests/steps04-10.test.ts`: eight scoped regression/validation tests.
- `references/steps01-10-paced-checkpoint.md`: this report.

Updated product file: `index.ts` registers the new variant and its render checkpoints.

Shared, opt-in capabilities added without WF311613 IDs or step rules in engine code:

- `src/types/product.ts`, `src/types/assembly.ts`: profile prisms, optional threaded screws, optional geometry variants and contact distance.
- `src/engine/geometry/GeometryFactory.ts`, `FaceBores.ts`: generic shaped profiles / routed bores and opt-in threaded wood-screw geometry; original defaults unchanged.
- `src/engine/installation/ProductTransformIndex.ts`, `InstallationPathResolver.ts`: profile bounds and authored contact-distance support.
- `src/engine/animation/ActionExecutor.ts`, `src/engine/product/ObjectRegistry.ts`: timeline-driven variant switching and deterministic restoration.
- `src/engine/assembly/AssemblyValidator.ts`: missing-variant validation.
- `src/components/product/PartRenderer.tsx`: variant geometry preparation using the same approved wood-UV mapping.
- `src/engine/render/FrameRenderer.ts`, `src/components/viewer/ProductViewer.tsx`: read-only camera-state diagnostics for occlusion checks.
- `src/products/tests/registry.test.ts`: registration integration expectation.

No duplicated product render script was created. Shared render scripts load the registry package by project/product ID.

## WF311613-specific files outside the product package

- `/Users/quyth/development/three/POC/references/wf311613-standalone-murphy-bed/assembly-manual.pdf`: isolated authoritative binary source.
- `/Users/quyth/development/three/POC/references/wf311613-standalone-murphy-bed/material-reference.png`: isolated appearance-only source.
- `/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/`: isolated generated reviews, frames and screenshots.
- `src/products/registry.ts` contains the one product registration import; `src/products/tests/registry.test.ts` contains expected registration IDs and integration checks. Neither contains product assembly implementation.
- Previously generated PDF page images under `tmp/pdfs/director-plan/` remain working inspection artifacts, not runtime product data.

The legacy implementation remains isolated inside the product's `legacy/` folder for recovery/comparison, labeled non-current. No legacy compatibility copies were added elsewhere. Conflicts concerning Steps 11–31 remain outside this checkpoint and must be resolved in their separately authorized phases; this scoped export must not be treated as resolving all 16 historical conflicts for the full product.

## Stop boundary

Step 10 is the last implemented/rendered step in this variant. No Step 11 implementation or directing expansion was performed. Await director review of this MP4.
