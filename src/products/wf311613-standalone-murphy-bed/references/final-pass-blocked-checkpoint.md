# Final pass — BLOCKED integration checkpoint

No director approval is claimed. No final MP4 was created. The existing approved Steps 1–20 project and all historical output are preserved.

The new opening retime and later-step draft are retained in the product package, but the blocked draft is **not registered** as a selectable/exportable product. The default remains `wf311613-steps01-20-paced`. A temporary diagnostic registration was used only for four audit stills, then removed.

## 1–4. Opening durations

| PDF step | Old seconds | New seconds |
| --- | ---: | ---: |
| 1 | 40.897333 | 28.163390 |
| 2 | 25.646722 | 16.424293 |
| 3 | 31.722222 | 21.586011 |
| Combined | 98.266277 | 66.173694 |

These are deterministic timeline values, not playback speed changes. The compressed opening belongs to the unregistered new full timeline; the historical approved MP4 is not modified.

## 5. Semantic pacing changes

The first Step 1 dowel/cam/bolt action durations remain unchanged. Repeated hardware actions use 0.66 of their previous action time; mirrored Step 2 hardware uses 0.62; Step 3 repeated hardware/start actions use 0.68. Final tightening actions use 0.80. These operation-specific reductions preserve the approach/contact/feed/seat phase structure and visible thread turns.

Empty stage holds reduce to 0.32 s; repeated connection macros to 0.12 s. First part/context/target holds become 1.3/1.4/1.05 s. Mirrored part/context holds become 0.7/0.8 s. Verification is 1.05 s (0.65 s for the mirror); result holds are 0.8 s. Part alignment operations use 0.85 of their existing duration (0.83 for Step 3), with a short 0.10 s seating hold. Cameras, shot order, connection coordinates, installation paths and hardware turn counts are unchanged. Step 3 still starts all six bolts before its final tightening pass.

**Steps 4–20: all action durations, shot durations, installation paths, camera definitions and geometry remain unchanged.** Their combined duration is still 261.680000 s. A deep-equality regression test enforces the complete locked DirectorPlan data, not merely its summed duration.

## 6–8. Later-step draft budget — NOT a completed export

| Step | Draft seconds |
| --- | ---: |
| 21 | 12.10 |
| 22 | 8.60 |
| 23 | 11.65 |
| 24 | 7.10 |
| 25 | 26.50 |
| 26 | 9.30 |
| 27 | 10.30 |
| 28 | 26.00 |
| 29 | 21.30 |
| 30 | 16.45 |
| 31 including final functional check | 24.30 |
| Steps 21–31 draft combined | 173.60 |
| Full draft timeline | 501.453694 (8:21.454) |

There is no FINAL runtime or FINAL MP4 yet. These are provisional authored timing values pending mechanical correction and full visual validation.

## 9. Validation status

- Opening retime regression: four tests added; duration budgets, first-example readability, unchanged paths/cameras and start-all-before-tighten ordering checked.
- Typecheck: passed.
- Lint: final rerun passed with no lint warnings/errors.
- Initial suite with temporary diagnostic registration: 68 tests passed, one registry-catalog expectation failed because that temporary entry had been added. The temporary entry was removed before the final rerun; no expected catalog list was weakened.
- Final suite after removing that entry: **69 tests passed in 10 files**.
- Production build with the diagnostic entry: passed. Existing build warning: broad output-frame tracing in `ExportJobManager.ts`; not a geometry issue.
- Final production build with the unchanged registered catalog: passed, with the same existing output-frame tracing warning.
- Approved registered Steps 1–20 assembly validation: **20 steps / 355 operations / zero errors / zero warnings**.
- Full assembly validator: **failed**, 22 reported installation/access issues in the draft. Some use static-parent approximations and require parent-aware path checking, but must not be dismissed without checking the actual moving meshes.
- Actual structural articulation probe: **failed**. It sampled 21,421 structural poses, 125,762 rigid-child comparisons, 920 retained-pivot checks, 1,382 piston endpoint/stroke checks and 1,656 leg checks.
- The retained bed pivot and constrained piston endpoints did not drift in that probe. This does NOT establish mechanical validity: the wood collisions below block acceptance.
- Full forward/backward seek/reset, all new hardware axes and all new installation paths are not yet accepted/complete. No export is permitted on the strength of the passed prefix tests alone.

## 10. Blocking mechanical finding

The already reconstructed D8/D9 receiving cradle axis is at world Y=63 cm, Z=−9.2 cm. The locked bed-face length is 204 cm, spanning source Z=158…362 cm. These are **estimated scene coordinates**, not manufacturer dimensions.

With that fixed cabinet axis, choosing the bed-side spindle far enough toward the head to prevent rear-panel penetration makes the closed bed too tall for the front top rail. Choosing it far enough toward the center to fit under the top rail makes the open head portion project through the cabinet back/center structure. A camera change, a faster motion or a hidden cut cannot fix this rigid-body contradiction.

Actual-mesh checks (not just enclosing-box checks) confirm these collisions. Corresponding overlapping bounds quantify their scale:

| Pose | Moving / stationary solid | Y overlap | Z overlap |
| --- | --- | ---: | ---: |
| Closed raised pose | C1-start / B6 | 4.04 cm | 1.74 cm |
| Fully open pose | C8-left / D5 | 1.04 cm | 3.08 cm |
| Fully open pose | C5 / E5 | 3.00 cm | 1.28 cm |

The B8 first-row panels are also crossed during opening. These are not sub-millimeter renderer seams. Further draft leg/carrier and fastener-access issues remain and have not been declared resolved.

**Required authority to resume:** permit a narrowly scoped correction to the reconstructed D8/D9 bearing-receiver axis/profile and associated receiver coordinates/bores, followed by refitting the newly introduced E1/E2/leg relationships. Preserve the PDF parts/order, the corrected B8 closed face, material/lighting style, and all Step 4–20 action timing. Do not claim that a particular replacement axis is manufacturer-certified.

## 11. Estimated geometry introduced in the retained draft

E1 envelope, two stud axes and eight pilot locations; spindle/bearing ring fit; E2 body/rod dimensions and stroke; complementary D3/D6/D7 half-laps and rounded ends; leg pivot/washer/canopy layering; bent wall-angle envelopes and mounting coordinates. Hardware IDs/quantities come from PDF pages 22–30, not the AI-generated material image.

The draft adds no bookshelf, side storage, Option 2 mechanism, invented anchors or human model. The neutral wall is context only, not a specified engineered substrate.

## 12. Draft path adjustments

The whole bed travels outboard and around the cabinet into the open front before pivot mating, rather than through locked B8. Installed bed hardware remains parented to the same rigid transform. Piston endpoints are evaluated against their attached anchors; free ends remain supported upright until cabinet-side mating. Mirrored fasteners remain physical approach/feed/seat animations.

Those changes are draft architecture, not proof that every path is validated. Leg assembly uses a separate supported work area; later fitting and access must be re-audited after the pivot correction.

## 13. PDF / DirectorPlan deviations

No numbered PDF step is intentionally reordered and no Option 2 step is implemented. The current full draft does not meet the PDF's mechanically operable final state, so it is not a conforming finished implementation. The four-person handling overlay and two wall angles per side are present in the draft. All new views still require final connection-readability QA.

## 14. Visual QA / audit stills

Fresh 1280×720 diagnostic stills were generated with the actual full draft renderer (not accepted final checkpoints):

`output/wf311613-standalone-murphy-bed/reviews/full-assembly/blocked-audit/stills/`

- `BLOCKED-S25-route-6.png`
- `BLOCKED-S26-supported-raise.png`
- `BLOCKED-S29-supported-open.png`
- `BLOCKED-final-closed.png`

The raised/open audit stills were inspected. The closed assembly masks the internal hardware; the open result is not visually acceptable. These images are diagnostic evidence only. No visual approval is claimed. Required final checkpoints 22/24/25/27/29/31/final have NOT all passed.

The existing development server timed out waiting for render readiness (`productReadyVersion=0`); a separate local production server successfully generated all four stills. This workaround did not alter the shared renderer/camera/material code. That temporary production server is stopped after the audit.

## 15. Remaining limitations / safe checkpoint

No full MP4, no accepted Step 21–31 completion, no complete mechanism/seek/path acceptance. The mechanical geometry lock is the blocking condition, not unavailable manufacturer dimensions. Draft code is retained but deliberately not exposed as the current product. No audio, music, marketing, Option 2 or polish pass was added.

Files retained for resumption:

- `director/final-opening-pacing.ts`
- `director/steps21-31.ts` (explicitly marked WIP)
- `product/parts-step21-31.ts`
- `validation/full-validation.ts`
- `validation/full-checkpoints.ts`
- `tests/final-opening.test.ts`
- Generic `src/engine/animation/MechanismSolver.ts`, generic action types and solver integration in `AnimationEngine.ts`.

Do not register/export `fullPlan` until the blocking geometry and remaining draft issues are resolved and all required checks pass.
