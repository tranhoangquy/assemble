# WF311613 — local foot-corner reconstruction and full integration

Verified 2026-10-03. Status: mechanical/code gates PASS; current Steps 1–31 MP4 exported and verified. This is a director-review checkpoint, not director approval or structural certification.

## Source and locked scope

Engineering truth: the supplied 33-page assembly PDF, Option 1 Steps 1–31. Presentation truth: the approved DirectorPlan and approved visual/action-speed profiles. No Option 2, bookshelf, storage module, mattress, added trim, music or marketing content.

Preserved: corrected D8/D9 and #19 pivot axes, E1 relationships, E2 anchors/stroke, rigid bed articulation, B8 geometry/placement, cabinet width, main face outer envelope, carrier dimensions, original materials and lighting. Every Step 4–20 shot/action duration and the compressed Steps 1–3 timing remains unchanged. Historical review packages are retained.

The current registered project is `wf311613-full-assembly`, within `src/products/wf311613-standalone-murphy-bed/`. Shared geometry, hierarchy and deterministic-animation corrections contain no WF-specific ID branches.

## Local C1/C2 before/after

Coordinates are reconstructed scene centimetres, not manufacturer machining dimensions.

| Item | Before | Current local correction |
| --- | --- | --- |
| C1 foot rail, `C1-start` | Routed rail with X ends ±116 | Ends ±114; 2 cm removed at each end only. Original Y/Z cross-section and central receiver axes retained. |
| C2 foot corners | Continuous original routed profile, beginning at source Z=165.6 | Only each outboard 1.75 cm corner band is relieved from Z=165.6 to 174.25 (8.65 cm). Original channels, integral tongues, bores and the remaining headward profile are retained. |
| Main bed-face envelope | 232 ×204 cm | 232 ×204 cm, unchanged |

The correction follows the actual PDF-correct leg and socket-head sweep. It does **not** subtract the former 1.55 ×3 ×32.99 cm diagnostic envelope. C1's shorter end is necessary for the real bolt head, not just timber clearance. The finished local rebate is visible in QA; there are no filler blocks, covers, collision masks or hidden material changes between states.

## D3/D6/D7 topology and kinematics

- D3 is the footward stepped upright; D7 is the longer headward pivot arm; D6 is the shorter headward rounded foot.
- Opposite X half-laps produce genuinely mirrored legs. Installed canopies are physical children of their arms, so they remain seated throughout staging/alignment/insertion.
- Reconstructed source pivot: `[side*115.4,45,172]`; upright joint source Z=154.8; D7 reach 17.2 cm; D6 reach 5 cm; wood depth 2 cm. These values are estimated.
- Deployed angle 0°; stored angle −90°, headward below the bed face. The cabinet/bed pivot remains `[0,36.5,-9.2]` / source `[0,45,340]`.
- Step 29 and final verification visibly support/lift the bed by an estimated 3° before folding the legs. Folding directly on the flat floor was rejected because the heel crossed the floor. The bed is lowered only after both legs deploy.
- #2 passes through D7 → separate white #10 washer → C8 → inner #9 canopy. Real head/counterbore seating is checked. #1 leg-joint bolts enter the opposite face from the canopy inserts.

## Measured clearances

Actual generated triangle-distance measurements, sampled every 0.25°, independently of collision acceptance:

| Measurement | Minimum | Limiting pair / pose |
| --- | ---: | --- |
| Leg and attached hardware to local C1/C2 | 0.130000 cm (1.30 mm) | `S28--1-D7-H1-1` / `C1-start`, leg −40.5° |
| Stored leg/hardware to fixed cabinet, including wall context | 0.100000 cm (1.00 mm) | `D7-1` / `A6`, bed 88.25° |
| Timber leg to floor during supported fold/deploy | 3.575667 cm | Complete 361-pose leg sweep at the estimated 3° support pose |
| Complete intended functional sequence to floor | 0 cm | Intentional deployed foot contact; no penetration |

Distances are scene estimates, not manufacturing tolerances. The solid gate uses a 0.005 cm numerical contact tolerance; it rejects actual overlap and containment rather than accepting a connection from distance or metadata alone.

## Five physical aperture failures and Step 28 access

Resolved actual generated passages for:

- `S29--1-H9 / C8-left`
- `S29--1-H2 / D7--1`
- `S28-1-D7-H7-0 / D7-1`
- `S29-1-H9 / C8-right`
- `S29-1-H2 / D7-1`

Generic finite-solid subtraction unions intersecting bores and removes stale overlapping walls/blind floors. Through bores use actual generated bounds; declared blind depths remain intact. Contour/hole winding is normalized. Bored-panel bevel overrun is clipped to the declared finished envelope. No receiver radius was increased for these fixes.

All 64 later-step hardware axes, 58 receivers and 290 actual aperture rays PASS. Step 28 additionally passes 28 operations /700 actual timeline poses /992 overlapping mesh-pair checks, with no mate waivers. The continuous staging/tool-envelope validator also passes. Its hierarchy correction ignores a rigid object's own descendants but still sweeps those descendants against unrelated blockers. The old independently moving canopy drift of up to 4.625 cm is physically eliminated by parenting, not waived.

## Whole-scene deterministic reset

Every `seek(0)` restores the exact evaluated canonical time-zero parent relationships, local position/quaternion/scale, visibility and selected geometry for every registered object and recursive render descendant. Positive-time seeks use the deterministic timeline and discrete/mechanism synchronization. Completed rotations are restored to their exact declared endpoints, avoiding GSAP's decimal rounding at π rotations. Active/later angular owners retain control.

The full seek/backward/reset audit passes 6,412 comparisons over 458 registered parts and 912 scene objects, including A9/A1/A3, mechanism children, hardware, exact parents and local/world transforms. Repeated `seek(0)` is included; the test is not narrowed to the mechanism.

## Validation results

| Gate | Result / coverage |
| --- | --- |
| Full assembly and staging/tool-envelope validator | PASS; 31 steps, 433 operations, zero errors/warnings |
| Current full-product Step 11–20 structural paths | PASS; 40 paths, 1,656 poses, 760 swept segments, 139 hardware axes, 3,280 rigid-carrier checks |
| Actual current bed/mechanism timeline | PASS; 167,622 rigid checks, 28,551 structural poses, 1,380 pivot checks, 1,842 piston endpoint checks, 262,656 piston-solid checks |
| Folding legs and stored-bed closing/reopening | PASS; 1,446 poses at 0.25°, all six function phases, 453 installed meshes, zero reported penetrations |
| D8/D9 receiver paths | PASS; 1,638 sampled timeline poses; contact not waived |
| Independent piston sweep | PASS; 101,080 cylinder/rod checks; pin length 73.650730–89.476421 cm within reconstructed 33–92 cm envelope |
| Hardware and actual apertures | PASS; 64 axes, 58 receivers, 290 rays |
| Step 28 actual paths | PASS; 28 operations, 700 poses, 992 mesh pairs |
| Whole-scene seek/reset | PASS; 6,412 comparisons |
| B8 closed face | PASS; 6 panels, 549 insertion poses, 27 swept segments, 144 closure rays; zero penetration |
| B8 numerical tangent boundaries | Six residuals ≤1.42e−14 cm; existing 1e−4 cm guard unchanged. Negative controls beyond the guard fail. |
| Step 4–20 geometry/timing and prefix locks | PASS; only explicitly authorized local corners/receivers differ |
| Tests | PASS; 123/123, 20 files. Heavy synchronous geometry tests run sequentially; timeout ceilings changed, sampling/assertions not reduced. |
| Typecheck / lint / production build | PASS |

Production build retains one existing Next/Turbopack warning about a broad dynamic frame-directory trace in `ExportJobManager`; it is not an assembly or render error. Browser `THREE.Clock` deprecation and favicon 404 are non-physical diagnostics; no runtime page error occurred in the completed full render. All ten mechanical gates were rerun on the final current plan and remain PASS.

Detailed machine results: `output/wf311613-standalone-murphy-bed/reviews/full-assembly/foot-corner-qa/validation-results.json` and `clearance-results.json`.

## Visual QA and directing

All 13 required views were rendered and inspected, with seven additional connection views (20 final stills total). The current stills are in `output/wf311613-standalone-murphy-bed/reviews/full-assembly/foot-corner-qa/stills/`.

Directing corrections include interior D8/D9 shots, actual E1 screw target, actual Step 25 pivot/retainer targets, tighter leg introduction and pivot macro, opposite-face leg bolts, and work-area cameras transformed by the real supported bed pose. The seated bearing is shown from the real front cradle opening, not through timber. No collision-hiding transparency is used.

Final camera-only QA replaces Step 25's excessively distant, fog-washed route camera with useful rear/outside/front cuts. The active complete bed and supported piston ends remain in frame; the static cabinet top is intentionally cropped in the outside-route view. The final lowering holds a static receiver-lip macro: first show the empty receiving cradle, then show the bearing descend and seat above the caption. The sensor stays in the actual gap; a farther trial was rejected because its sensor entered A3. Whole-bearing context is taught before this contact macro. The final open result is reframed to keep both deployed feet above the completion caption.

There are 27 actual export-camera checkpoints in `foot-corner-qa/production-stills/`, plus eight frames decoded directly from the finished MP4 in `foot-corner-qa/mp4-decoded/`. The decoded frames confirm the empty receiver, approaching/seated bearing, leg half-lap, pivot bolt, stored-leg closing, closed state and final open state. The production framing, captions and visible connection regions were inspected; an independent five-still visual audit found no critical connection occlusion. The latest camera-only revision preserves product geometry, all assembly actions/durations and Steps 1–24 directing/cameras (SHA-256 evidence in `camera-prefix-integrity.json`). Historical geometry/timing preservation is established by the separate lock regression tests, not this camera hash.

## Final timing

| Step | Seconds | Step | Seconds |
| --- | ---: | --- | ---: |
| 21 | 12.10 | 27 | 10.30 |
| 22 | 8.60 | 28 | 28.80 |
| 23 | 11.65 | 29 | 23.10 |
| 24 | 7.10 | 30 | 16.45 |
| 25 | 26.50 | 31 | 26.10 |
| 26 | 9.30 | | |

Steps 1–31 timeline: **507.853694 seconds (8:27.854)**. Steps 21–31 changes are limited to necessary supported leg motion; no new global pacing multiplier was applied.

Verified output, from one current deterministic timeline:

`/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/wf311613-full-assembly-review.mp4`

`ffprobe` confirms **1280×720, 30/1 fps, H.264, yuv420p, 15,236 frames, 507.866667 seconds (8:27.867)**, one video stream and no audio. File size: 22,729,881 bytes. The slight difference from the 507.853694-second timeline is the final frame rounded to 30 fps. A complete `ffmpeg` decode to a null sink exits successfully with no decode errors.

SHA-256: `53209c86c67fc7fbb2db5ff9a12be09f79776e62b52332f88c40e969d77176be`.

The uninterrupted final encode uses one current PNG timeline, frames 0–15,235. After a render startup timeout, 11,010 contiguous prefix frames before Step 25 were safely recovered; four sampled PNGs (0, 3,670, 7,340, 11,009) matched the current renderer byte-for-byte. Everything from frame 11,010 (367 seconds) onward was rendered again, including **all** changed Step 25 shots. Historical MP4s are not concatenated. No playback-speed multiplier is applied.

Review gallery: `output/wf311613-standalone-murphy-bed/reviews/full-assembly/foot-corner-qa/index.html`. All gallery references resolve. Final media verification is recorded in `foot-corner-qa/export-verification.json`.

## Remaining reconstruction limitations

Local rebates, leg dimensions/pivot, half-laps, receiver extension, E1 envelopes, piston stroke/anchors and numerical clearances are estimated scene geometry inferred from PDF topology. They are not manufacturer measurements or load/structural certification. In particular, the pre-existing illustrative #10 washer bore is Ø7.4 mm for the modeled threaded envelope while the PDF nominal label is Ø6 mm; that legacy visual-fit assumption is documented, not asserted as a manufacturing tolerance. A neutral wall is context only; no substrate, stud or anchoring capacity is inferred.

Stop after this full review export. Await director review; do not implement Option 2 or begin visual/audio polish.
