# WF311613 narrow mechanism correction - STOP checkpoint

Historical checkpoint preserved. Superseded by [local foot-corner integration checkpoint](foot-corner-integration-checkpoint.md) after the additional scoped authorization; the original findings below are retained unchanged.

Verified: 2026-10-02. Status: NOT EXPORT-READY. Completed work is retained.

The corrected rigid bed pivot, bearing route and attached pistons pass their sampled mesh checks. Folding-leg integration does not pass. The full plan remains an unregistered WIP, and no `wf311613-full-assembly-review.mp4` was exported.

## Source authority and preserved scope

Engineering source: [assembly manual](/Users/quyth/development/three/POC/references/wf311613-standalone-murphy-bed/assembly-manual.pdf), particularly PDF pages 22-30. Directing source: [approved DirectorPlan](/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/references/director-plan-review.md).

PDF-defined part identities, hardware IDs/counts and numbered step order are retained. Every Step 4-20 shot duration and action duration is unchanged. B8 geometry/placement, cabinet inner width, existing wood materials, lighting and approved prefix cameras remain unchanged. Historical registered checkpoint definitions were not overwritten. The authorized D8/D9 reconstruction is applied only to the new full-product clone.

All coordinates below are centimeters in the existing scene convention, not dimensions printed in the PDF or manufacturer tolerances. Bed source coordinates are the pre-installation work-area coordinates; assembled cabinet coordinates are different.

## 1-3. Receiver and pivot before/after

| Relationship | Previous reconstruction | Corrected reconstruction |
| --- | --- | --- |
| Cabinet pivot Y | 63 | 36.5 |
| Cabinet pivot Z | -9.2 | -9.2 |
| Bed source pivot | [0, 45, 318] | [0, 45, 340] |
| Bed local longitudinal pivot relative to source Z=260 | 58 | 80 |
| D8/D9 mounting web | Ten original mounting holes | All ten original holes/fasteners retained |
| Bearing receiver | Original cradle near mounting-web base | Estimated integral lower extension and open cradle, radius 2.1 |

D8 remains PDF-left and D9 PDF-right. The upper L-profile/mounting web stays on the original A5/A6 full-thickness wood; mounting screws were not moved into unsupported A9 gaps. Only the receiver profile extends down to the corrected bearing axis.

The bed is one rigid articulated assembly throughout installation and opening. No bed scaling, second pivot, B8 displacement, hidden wood or disconnected piston is used.

## 4. Why the former pivot reconstruction failed

The former Y=63/source-Z=318 reconstruction fails a control sweep against actual generated wood: closed `C1-start/B6`, open `C8/D5` and `C5/E5`, and intermediate B8 penetration. Matching just one endpoint could not make that fixed-pivot reconstruction coherent with the locked bed and cabinet envelopes. The rejected control remains covered by a regression test.

## 5. Articulation and clearance

The corrected bed-wood sweep passes 361 poses from 0 to 90 degrees in 0.25-degree increments, including all requested decile poses. Generated mesh triangles are checked bidirectionally against routed material cells; a 0.005 cm numerical contact tolerance is not a design clearance or collision waiver.

| Measured scene clearance | Result |
| --- | --- |
| Minimum reported cabinet side clearance | 0.459973 cm, about 4.60 mm |
| Top structure | 0.460000 cm, about 4.60 mm |
| Rear E5 | 2.460000 cm |
| Minimum bed-wood floor clearance throughout sweep | 12.730271 cm |

These are sampled reconstructed clearances, not certified manufacturing tolerances or proof of load capacity. The leg solids are separately evaluated and fail; this PASS must not be described as a PASS for the complete product.

## 6. E1, bearing, retainer and E2 refit

- Each E1 remains one integral plate with eight #21 screws. Plate center: [side*114.35, 45, 345]; spindle source Z=340; piston stud source Z=354, toward the head as shown in the PDF.
- E1 hole columns are local Z=-11, -6, 1, 9 and Y=+/-2.6. The final pair was moved from local Z=10.5 to 9 to clear the installed Step 16 head dowels. Conservative Z separation over the entire X-axis installation/spin is at least 0.49999 cm; the seated mesh audit found about 0.678 cm separation.
- #19 outer radius=2, inner-race bore radius=0.66; E1 spindle radius=0.65. Bearing, spindle and cabinet cradle share the corrected articulation axis.
- Each #18 retaining bolt is at [side*116.65, 36.5, -9.2]. The true wood host here is A9/A9-R, not A5/A6. A later-step through-aperture variant preserves the original A9 wood envelope. Head underside to wood gap is about 0.025 cm; modeled spindle engagement is about 1.6 cm.
- E2 bed anchor: [side*115.1, 45, 354]; cabinet anchor: [side*115.4, 110, 9.5]. Cylinder, rod, neck and two eye meshes remain separate physical render objects representing the same PDF piston, not added bill-of-material components.
- Explicit piston-child introduction visibility fixes the prior invisible-body defect. Generic solver replay observes the actual staged installation path before the attached-end constraints take over.

## 7. Piston articulation

Both pistons pass 361 poses at 0.25-degree increments, with 101,080 body/rod-versus-wood checks. Endpoints remain attached and the piston axis follows both endpoints.

Modeled pin-to-pin length ranges from 73.650730 to 89.476421 cm; modeled compressed/extended envelope is 33-92 cm. Body/eye offset, stroke and anchors are estimated scene geometry. The PDF's 750 N label does not validate this reconstructed stroke, force balance or structural strength.

## 8. Folding legs - unresolved geometric conflict

The retained D3/D6/D7 WIP is not accepted geometry. Its current upright/arm orientation is not the PDF-correct footward-upright/headward-arm relationship. Correct-handed alternatives were evaluated in disposable runtimes without changing the product or locked wood.

Current sweep: 181 poses at 0.5-degree increments; 422 actual collision hits. D3 and D6 intersect C2-left/right, including during folding and the final functional test.

The prior inferred foot corner is continuous wood: C1-start occupies source Z=158..165.6, Y=36..39; C2 begins at about Z=165.6 (tongue starts at 165) and continues headward. It obstructs the leg's rotational corridor. Bed face outer X=+/-116 versus cabinet inner X about +/-116.46 leaves only about 0.46 cm outboard space, insufficient for the modeled 2 cm wood leg.

Evidence from authorized-only alternatives:

- PDF-correct upright source Z=155, pivot Z=172, upper/lower arm reach=17/5: a -90-degree fold crosses C1/C2 and the floor (626 hits; minimum floor Y about -5.12).
- The same candidate folding +90 degrees clears local bed wood and floor, but its stored leg then crosses cabinet B6/B1-rear/B2 while the bed closes (62 hits, beginning around 80.5 degrees).
- Other raised-pivot/short-arm and longer-arm trials did not produce a full leg-fold plus bed-close solution with the retained continuous corner wood.

The current wrong-orientation WIP intersection union in each C2 is about 1.55 x 3.00 x 32.99 cm. This is a diagnostic envelope, NOT a proposed pocket, machining instruction or minimal relief dimension. It must not be copied into a final design.

### Smallest additional scope requested

Authorize re-reconstruction of the local C1/C2 bed-face foot-corner/clearance relationship around the PDF-correct folding-leg path. Keep their part identities/counts and the rest of the bed envelope fixed; keep B8, cabinet width, materials, lighting and Step 4-20 timings fixed. Determine and show the minimum needed relief/overhang correction before committing it.

Consequences: a local visible corner/underside shape may change, and its hole/joint relationships must be rechecked. Any material removal affects structural integrity and would require manufacturer/engineering confirmation for a real product. No relief has been implemented. The sampled alternatives do not prove that every possible reconstruction is impossible; they demonstrate that the tested plausible mechanisms do not fit the retained corner geometry.

## 9-10. Timeline budget - provisional, not final

| PDF step | Current WIP seconds |
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
| 31 | 24.30 |

Steps 21-31 subtotal: 173.60 s. Steps 1-31 draft total: 501.453694 s = 8:21.454. These durations have NOT been approved as final and are not an exported MP4 runtime. Locked Steps 4-20 total remains 261.68 s. Compressed Steps 1-3 remain 28.163390 / 16.424293 / 21.586011 s.

Step 25's seven-segment rigid route uses free space outside/in front of the cabinet, rotates before approaching the cradle, aligns below the original mounting web and then lowers onto the same final axis. Bearing/receiver path checks pass; this does not clear the remaining Step 28 installation paths or final leg motion.

## 11. Complete validation result

| Check | Result / scope |
| --- | --- |
| Approved registered Steps 1-20 assembly | PASS: 20 steps, 355 operations, 0 errors/warnings |
| Full draft static assembly | FAIL: 31 steps, 433 operations, 16 Step 28 path/access errors |
| Bed rigid articulation | PASS: 361 actual-mesh poses; old rejected geometry still fails control |
| Bearing/receiver installation paths | PASS: 1,183 sampled poses |
| Retained pivot relationship | PASS: 920 timeline checks |
| Piston endpoint/stroke | PASS: 1,382 timeline checks plus fine sweep |
| Piston body/rod solids | PASS for current sweep and timeline samples |
| Folding legs | FAIL: 422 fine-sweep hits; 16 timeline collision errors |
| Hardware metadata/axis fit | PASS: 64 axes, 58 receivers |
| Actual generated hardware apertures | FAIL: 5 receivers, 290 rays |
| Mechanism-owned forward/backward/reset regression | PASS; limited to mechanism-owned objects |
| Whole-scene forward/backward/reset audit | FAIL: A9, A1, A3 at time 0; 5,496 comparisons |
| Step 4-20 duration/material/B8 lock regressions | PASS |
| Typecheck | PASS |
| Lint | PASS |
| Tests | PASS: 93 tests in 13 files |
| Production build | PASS with existing broad export-frame-glob warning |

Actual aperture failures, not waived:

- `S29--1-H9/C8-left`
- `S29--1-H2/D7--1`
- `S28-1-D7-H7-0/D7-1`
- `S29-1-H9/C8-right`
- `S29-1-H2/D7-1`

Generated overlapping bore walls/blind-bore floors still obstruct these receivers. Metadata co-axiality alone is insufficient. The 16 static Step 28 tool/access flags are unresolved; they have not been declared false positives. Whole-scene first-frame reset mismatch is also unresolved and is not masked by the passing narrower mechanism test.

## 12. Visual QA and diagnostic stills

All 13 images were refreshed from the current actual deterministic timeline at 1280x720 and inspected. No collision-hiding transparency, wood hiding or displacements were used. The wall is neutral installation context, not a new product component. These are DIAGNOSTICS, NOT DIRECTOR APPROVAL.

| Diagnostic | QA / image |
| --- | --- |
| Closed | [01](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/01-closed.png) - whole pose visible |
| 25% open | [02](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/02-open-25-percent.png) |
| 50% open | [03](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/03-open-50-percent.png) |
| 75% open | [04](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/04-open-75-percent.png) |
| Fully open, legs stored | [05](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/05-open.png) |
| D8 axis macro | [06](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/06-D8-pivot-macro.png) - heavily occluded/edge-on; not instructional approval |
| D9 axis macro | [07](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/07-D9-pivot-macro.png) - heavily occluded/edge-on; not instructional approval |
| E2 closed | [08](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/08-piston-closed.png) |
| E2 mid-stroke | [09](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/09-piston-mid.png) |
| E2 open | [10](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/10-piston-open.png) |
| Legs stored | [11](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/11-leg-stored.png) - collision/orientation defect visible |
| Legs deployed | [12](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/12-leg-deployed.png) - rounded-foot/profile mesh defects visible |
| Additional C2 collision diagnostic | [13](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/13-leg-C2-crossing.png) |

Material and lighting were reused, not redesigned. Final hardware instructional visibility is NOT yet accepted: the D8/D9 diagnostic macros are occluded, and some new Step 21/25 WIP camera targets still reference prior positions. Per the required mechanism-first order, directing polish is deferred until the leg and integration checks pass.

## 13. Estimates, retained files and handoff

Estimated: receiver lower extension/cradle, pivot positions, E1 envelope/holes/studs, bearing fits, A9 retainer aperture, E2 anchors/stroke, folding-leg profiles/half-laps/pivots and wall-bracket coordinates. Hardware nominal IDs/counts and printed sizes remain PDF-based, but rendered thread/head clearances are illustrative. In particular #10's nominal PDF bore is diameter 6 mm; its WIP render bore is 7.4 mm. This is documented, not a claim of manufacturer precision.

Relevant retained changes are product-local `product/mechanism-reconstruction.ts`, `product/parts-step21-31.ts`, `director/steps21-31.ts`, `validation/full-validation.ts`, `validation/pivot-search.ts`, `validation/mechanism-preview.tsx`, and the mechanism/pivot regression tests. Generic solver/path replay fixes remain in `src/engine/animation/MechanismSolver.ts`, `ActionExecutor.ts` and `AnimationEngine.ts`; no product IDs were added there. The diagnostic render CLI is generic.

[Machine-readable validation](/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/references/narrow-mechanism-validation.json) and [render manifest](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/full-assembly/mechanism-audit/stills/diagnostic-manifest.json) are retained with this report.

STOP: await the narrow C1/C2 reconstruction decision. Do not register fullPlan, export a full video, add Option 2/audio/marketing scenes, or silently change locked wood. No completed work has been discarded.
