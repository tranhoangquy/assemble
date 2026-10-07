# WF311613 Short #01 → Short #02

Status: REQUIRES DIRECTOR REVIEW. This revision is a silent native portrait visual candidate. The current Short selector points to Short02; Short01's source, candidate, selected stills, reports and original freeze remain preserved in their separate revision directory.

## Creative changes

| Section | Short01 | Short02 |
|---|---|---|
| Hook, 0–2 s | Partial opening during a single 2-second window | Closed cabinet 0–0.6; complete opening with deployed legs 0.6–1.5; open hero 1.5–2.0 |
| Overview, 2–5 s | Major-group overview | Same approved overview and exact canonical reset |
| Cabinet/frame/slats | 24 s, ending at 29 s | 22 s, ending at 27 s; shorter panel/grid/repeated-slat/carrier windows and completion hold |
| Bed/cabinet connection | 29–39 s | 27–38 s; dedicated 0.6 s context, 2.4 s supported alignment, 2 s bearing seat, 4 s retainer macro, 2 s connected result |
| Pivot/piston | 39–47 s; partial articulation | 38–46 s; first/opposite eye macros, completed macro hold, contextual pullback cut, full approved 15° articulation |
| Legs/anchoring | 47–52 s | 46–52 s; canonical leg-install/fold-test and anchored milestone |
| Payoff, 52–58 s | Supported close; closed ending | Finished open 52–53; supported lift/leg fold/close 53–55; reopen/deploy/lower 55–57; open hero 57–58 |

There are 35 authored shots, 58 seconds and 1,740 native frames. Short02 owns video ID `wf311613-short02-visual-v1`. Source windows, original source times, global boundaries, per-shot source rate, frame allocation, camera and instructional purpose are explicit in `SHORT-DIRECTOR-PLAN.json`. The edit uses holds and forward windows; no global playback multiplier is introduced. Important mechanism and seating beats remain longer while repetition is omitted by editorial cuts.

The opening source window includes the complete validated opening, leg deployment and final lowering. The final close includes the slight supported lift and headward leg fold before bed rotation. Reopening uses the approved linked-piston/pivot motion, deploys the legs, then lowers onto their feet. All finished states occur after all four anchors. No mattress/bedding insertion is added to the functional sequence.

The hero camera is pulled back only in Short02 to fit the fully open product. Native QA asserts actual camera pose/FOV for every shot; conservative approved timber-cell corners are sampled at 11 points through hook/final and cap/carrier actions. Context and macro shots intentionally crop peripheral background cabinet edges while keeping the bed/cabinet relationship or active hardware visible. The 0.9-second carrier lift remains a brief wide view. The mechanism pullback is an intentional camera cut to a contextual hold, followed immediately by movement.

## Implementation scope and preservation

Added `director/short02.ts`, its regression test and a versioned native/browser QA script. Changed the existing product index's optional Short reference and current-presentation test expectations. No shared runtime/renderer/exporter, geometry, material, AssemblyGraph, Long presentation, API/backend or database changes were required. `implementation-files.json` lists the exact files.

The existing EditorialVideoEngine evaluates the original frozen source engine, then applies the portrait camera. This preserves attachment transforms, geometry variants, visibility and mechanism solver state. Seeking each subsequent editorial source time restores its canonical state; the hook and functional proof do not mutate the graph. Tests compare source and directed states at shot start/middle/end in forward and backward order. Additional checks verify 90° opening, full 15° mechanism motion and final closed/open endpoint equivalence. A supplementary four-test run also compares the entire registry (position, quaternion, scale and visibility) across closed→opening, finished→closing, closing→reopening and reopening→hero boundaries; all passed (`functional-continuity-tests.log`). Only test assertions were expanded during rendering; the frozen renderer fingerprint remains unchanged.

The existing Generate File flow, native render route, exact canonical creative fingerprints, checkpoint identity, 300-frame chunks, bounded retries, browser recycling, frame validation and H.264 encoding remain in use. A six-frame smoke exercises Cancel/Resume and independent boundary-frame identity before full generation. The full candidate is fresh Short02 frames; no Long or Short01 frame is reused. Old jobs can correctly become incompatible under conservative source identity; old review files and cached frames are preserved.

Exact Long creative data/package hashes and frozen product SHA remain unchanged (`creative-freeze.json`). `protected-after.json` records unchanged protected files and Short01 evidence. The asynchronous pre-edit snapshot finished after the authorized index-reference edit; therefore its index byte hash is not evidence of pre-edit equality. Independent Long evaluated hashes and explicit index edit scope establish Long preservation. No cleanup was performed; the prior workspace cleanup's tracked deletions remain independent.

## Checks and limitations

99 tests across 15 files passed, including Short01 regression, Short02 source-state/framing/function checks, identity isolation, current Long defaults and shared resumable export/API coverage. Webpack production build, TypeScript and changed-file lint passed. Repository-wide lint retains the identical 59 errors / 24 warnings in protected historical output scripts. The previously documented unrelated trailing space in `src/types/product-package.ts` remains unchanged.

The actual-mesh mechanical regression passed: 143,598 rigid-bed checks, 1,380 pivot checks, 1,578 piston endpoint/stroke checks, 226,752 piston-solid checks, 24,459 structural poses and 2,760 leg checks. These are sampled checks of the original approved trajectories; exact source-state equivalence establishes that Short02 uses the same trajectories. This revision does not reopen the approved hole/material/product audit.

Native 1080×1920 drawing buffer, exact creative hash, actual camera presets, caption safe-area boxes and seven repeated/backward-seek pixel comparisons passed. Selected native story stills cover hook reset, contextual connection, mechanism movement/restoration and final close/open/hero. The first browser UI QA navigation timed out at its initial 30-second budget; that raw failure is preserved in `browser-smoke-attempt01.*`. The QA navigation budget was aligned to the existing 60-second renderer budget, with no runtime change. Final browser/export outcomes and full-media verification are in the detailed QA and original logs.

Technical results do not establish director approval of pacing, readability, hook strength or final reward. Music editing, listening QA, narration, SFX, audio mux, final Short mastering and publication are NOT RUN. Stop at this complete silent visual package for director review.

## Complete candidate and final media gate

Full job `d0f4b8c2-20d6-46c0-98a5-61a069824580` completed all 1,740 frames in six chunks with zero missing/invalid frames. Candidate `WF311613-short02-visual-review-v1-vertical-1080p.mp4` is 58.000000 seconds, 1080×1920, 30/1 fps, H.264/yuv420p, 5,307,176 bytes, one video stream and zero audio streams. Full decode, faststart and counted frames passed. The review copy matches the verified job SHA256 `aee283b9d7bf0653b45fd3bf357fc51ea98ad988ebabe532d371a2662d7cad98`.

A fresh independent browser matched all 18 selected native full-job frames byte-for-byte, including both sides of every 300-frame work-chunk boundary and hook/final functional endpoints. See `full-native-boundary-verification.json`. Twenty-three decoded MP4 frames were visually inspected; the explicit final selection is `encoded-stills-manifest.json` and its contact sheet is `ENCODED-SPOT-CHECKS.jpg`. `review-stills-manifest.json` identifies the final selected native stills, functional story frames, action bounds and last full-job native frame.

Technical status: PASS. Director status: REQUIRES DIRECTOR REVIEW. STOP at the silent candidate; no audio or release phase proceeded.
