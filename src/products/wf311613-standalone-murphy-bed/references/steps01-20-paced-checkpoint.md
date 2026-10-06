# PDF Steps 1–20 paced director-review checkpoint

Status: implementation, validation, continuous MP4 export and decode check complete.
Ready for the user's director review; not director approval.
Scope stops at Step 20. This is a director-review export, not director approval
or a finished 31-step product video. No Step 21+ actions were added.

## 1. Runtime and export

Timeline duration: **359.946278 s (5:59.946)**.
Approved Steps 1–10: **225.926278 s (3:45.926)**, unchanged.
New Steps 11–20: **134.02 s (2:14.02)**.
The requested full export is 1280×720, 30 fps, H.264/yuv420p MP4.
Verified with ffprobe: 1280×720, H.264, 30/1 fps, 10,799 frames,
**359.966667 s (5:59.967)**, file size **17,814,226 bytes**.
Full-file FFmpeg decode completed without errors.
There is no global playback multiplier. Repeated connections use authored
shorter action durations and physical approach/contact/feed/seating phases.

| PDF step | Duration (s) | Main operation |
|---|---:|---|
| 11 | 7.60 | First C1/C4 corner; first readable #22/#8 joint |
| 12 | 12.02 | C4/C5 rails, two sliding C6 panels, two C3 ties |
| 13 | 8.01 | Three underside C7 profiles; six #12 screws |
| 14 | 12.02 | Two mirrored C2 outer rails, two C6 panels/ties |
| 15 | 13.75 | Four final C6 panels; closing C1 and five cam joints |
| 16 | 14.65 | Separate rectangular C8/C9/D1 carrier |
| 17 | 23.16 | Lift, stage, dowel-align and mate both large assemblies |
| 18 | 14.24 | First six #20 brackets and 24 #14 screws |
| 19 | 12.31 | Opposite six brackets and 24 #14 screws |
| 20 | 16.26 | Five mattress-facing D2 slats and 25 #16 screws |

MP4 destination:
`/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/wf311613-steps-01-20-paced-review.mp4`

The entire sequence is freshly captured from the current deterministic scene,
using `frames/wf311613-steps01-20-paced-Bv12AW/` under this product's output directory.
No historical pre-B8-fix MP4 or old frames are used for the prefix.

## 2. Source authority

Engineering source: original assembly manual, PDF pages 17–21 for Steps 11–20,
and the preceding PDF part/hardware lists. Original document is retained at
`references/wf311613-standalone-murphy-bed/assembly-manual.pdf`.
Directing source: approved `references/director-plan-review.md` within this
product package, plus the user's latest semantic repetition requirements.
Appearance: locked current Step 1–10 oak/zinc materials, UV scale/directions,
lighting and presentation. AI material-reference imagery is appearance-only.

## 3. Validation and tests

- Typecheck: passed.
- Lint: passed.
- Vitest: **65 tests passed in 9 files**.
- Existing assembly validator: **20 steps / 355 physical installation
  operations**, zero errors and zero warnings.
- New product-scoped actual-mesh path validator: **40 structural installation
  paths**, **1,656 sampled poses**, **760 conservative swept segments**;
  no detected wood/bracket-to-installed-wood penetration.
- Routed solid-cell envelopes exclude the physical channels; checks use
  generated blocker mesh triangles, not a permissive allowed-contact list.
  Numerical epsilon is 1e-4 cm for Float32 tessellation, not a construction gap.
- Hardware pose/axis checks: **139 fasteners**. Shared receiver coordinates,
  six through-bores in C5 into C7, layer order, part/hardware quantities and
  all action durations within their shot are tested.
- Complete carrier rigidity: **3,280 relative-transform checks** during lift,
  translation, lowering and seating, including its already-installed hardware.
- Deterministic forward/backward seek and baseline reset: passed.
- Existing B8 strict regression checks remain passing: six panels, 549 poses,
  27 swept segments, 144 closure rays and eight receiver pairs.
- Production build: passed. Non-blocking pre-existing warnings: broad dynamic
  `frames` tracing in ExportJobManager; Three CJS deprecation in CLI tools.
  Browser Three.Clock deprecation does not change the paused deterministic clock.

These are reconstructed-scene checks, not certification of manufacturer
machining dimensions, tolerances or real-world structural safety.

## 4. Estimated geometry introduced

All unprinted timber dimensions and connection coordinates are marked
`mechanically_inferred / medium`, not manufacturer-precision measurements.

- Face grid: 232×204 cm estimated to fit the locked cabinet reconstruction;
  long/cross rails nominally 7.6 cm wide ×3 cm thick.
- Eight C6 boards: 49.7×91.8×1.2 cm; actual axial support grooves with
  0.6 cm edge capture. Panel bottom Y=6.2 and top Y=7.4 cm, below rail top Y=9.
- Integral rail/tie tongues and channel floors/lips reconstructed proportionally;
  they belong to the wood member, not extra invented parts.
- C7 sections, 60 cm lengths, three supported positions and pilot offsets
  are inferred. The two screw offsets per C7 are ±15 cm, avoiding later D2s.
- Carrier: 228.4×198.8 cm outer footprint; 3×12 cm section; lower contact
  plane Y=9, matching the exposed face-rail top without overlap.
- D2: five 222.4×4×1.8 cm slats, centers Z=−84/−42/0/42/84; bottom Y=9;
  each has five screw axes on the underlying five longitudinal rails.
- Bracket #20 section, bends, holes, thread/head shapes, blind cam depth
  (1.4 cm), pilot clearances and staging clearances are estimated.
- Printed hardware IDs/counts/lengths remain PDF-defined: #22 120 mm,
  #3 60 mm, #6 dowels 30 mm, #12 40 mm, #14 15 mm, #16 30 mm.
- Bed work area Z=260 cm; carrier parks X=+300 cm. Both work subassemblies
  use a supported handling pose 30 cm above nominal local height to permit
  underside bolt/tool access. This is staging, not a product dimension or an
  invented furniture component. No new table, bookshelf, fillers or backing.

## 5. Installation-path adjustments

1. C6 is lowered **outside** the open rail ends, then slides axially through
   the routed grooves; it never drops vertically through an installed rail.
2. C3 enters from the still-empty second half, capturing the first panel edge;
   all final panels enter before the closing C1 is seated.
3. C7 approaches from below C5. A clean underside cut reveals the profile,
   followed by a top screw-axis cut with both pilots visible.
4. C8 members are supported parallel during Step 16. Dowels are installed at
   all corners before C9/D1 translate onto both pairs simultaneously; no
   connected corner rotates through a previously installed dowel.
5. The COMPLETE carrier, including its fasteners, lifts 28 cm before traversing
   over the face. It lowers to a 1.5 cm alignment gap, then seats on eight dowels.
6. #20 brackets approach from the open interior corner; vertical and horizontal
   screws follow their respective face normals. No bracket teleports.
7. D2 lowers onto the mattress-facing support plane, inside the carrier.

## 6. DirectorPlan deviations / integration corrections

- PDF Step 17 draws #3 insertion **up from the underside**. This overrides
  the approved plan prose saying accessible outer faces. New underside cameras
  show the vertical bolt axis; cams enter from accessible inner carrier faces.
- Steps 12/14 panel lowering becomes lower-outside + axial-slide to respect
  the PDF's captured-groove topology and prohibit mesh crossing.
- Step 16 is assembled as supported parallel side rails plus simultaneous end
  seating, rather than closing one corner then sweeping another through dowels.
- Repeated joints/screws are compressed as authorized; no full reteaching of
  previously explained mechanisms. Part and hardware order/counts are retained.
- New shots reserve the existing lower-left caption region. Result shots now
  expose the entire changed assembly without caption occlusion; old cameras
  and their timings are unchanged.
- **Genuine shared seek defect fixed:** GSAP zero-duration visibility setters
  could wrongly hide A5/A7/A8 after a backward seek. Visibility now resolves
  deterministically from chronological events at the requested time. No old
  physical action duration, material, geometry or camera was changed.
- Only the extended video's Step 10 final caption changes its obsolete
  “STOP before Step 11” to “Cabinet complete; continue with the separate
  bed-face assembly.” The locked Step 10 plan/actions and standalone 1–10
  entry remain unchanged. This is required by the newly unlocked continuation.

## 7. Visual QA

23 new-operation checkpoints plus six B8 regression views were rendered and
inspected at 1280×720. All 23 new-operation stills were then refreshed from
the actual final continuous capture, at the nearest 30 fps frame, and the
six required new-step views were reinspected. An encoded MP4 sample at
225 s also verifies the corrected B8 cabinet face. Final capture-derived
new-step stills are linked below.

- Step 12: actual support groove/lip is exposed before panel insertion; panel
  then slides below the visible rail face without crossing it.
- Step 15: eight flush captured panels; no open accidental strips or layer inversion.
- Step 16: squared separate rectangular carrier; face grid remains parked separately.
- Step 17: visible separation during lowering, aligned dowels, underside #3
  installation and completed single assembly.
- Steps 18/19: separate bent brackets with both faces and four screw pilots;
  twelve installed brackets in final interior overview.
- Step 20: all five evenly spaced slats on the exposed mattress-facing side;
  first screw macro and four-screw rhythmic repetitions remain visible.
- B8: approved closed cabinet face maintained. Upper bright rectangles are
  the existing #25 metal return flanges, not accidental background gaps.

Still directory:
`/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/`

Required review views:

- [Step 12 — C6 captured layer](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-12-panel-path.png)
- [Step 15 — eight completed C6 panels](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-15-eight-panels.png)
- [Step 16 — two separate subassemblies](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-16-two-assemblies.png)
- [Step 17 — controlled mating](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-17-controlled-lowering.png)
- [Step 19 — twelve brackets](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-19-twelve-brackets.png)
- [Step 20 — five D2 slats](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-20-five-slats.png)

Connection detail views:

- [C7 underside access](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-13-underside-C7.png)
- [Step 17 underside bolt](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-17-underside-bolt.png)
- [First #20 bracket screws](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-18-four-screws.png)
- [First D2 screw](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/steps-01-20/stills/review-20-first-screw.png)

## 8. Files / package architecture

New product-owned files:

- `product/parts-step11-20.ts`
- `director/steps11-20.ts`
- `validation/steps11-20-checkpoints.ts`
- `validation/steps11-20-validation.ts`
- `tests/steps11-20.test.ts`
- `references/steps01-20-paced-checkpoint.md`

Updated product-owned files: `index.ts` and `references/sources.ts`.
No locked Step 1–10 data files were changed.

Genuinely generic engine/type changes:

- `src/types/product.ts`: compound physical solids, optional exact-size bored
  panels and opt-in preservation of routed outer faces after drilling.
- `src/engine/geometry/GeometryFactory.ts`, `FaceBores.ts`: integral compound
  parts and true grooved face regions with bore apertures, without filling channels.
- `src/engine/installation/ProductTransformIndex.ts`: compound bounds derived
  from actual asymmetric geometry (not an assumed centered box).
- `src/types/video.ts`, `src/engine/camera/CameraEngine.ts`,
  `src/engine/animation/ActionExecutor.ts`: explicit underside-camera access.
- `src/engine/animation/AnimationEngine.ts`, `src/engine/video/VideoEngine.ts`:
  deterministic discrete visibility resolution during seek/play.
- `src/products/tests/registry.test.ts`: registration expectation for the new
  1–20 package; no product geometry/directing rules.

The generic engine contains no WF311613 IDs or C-part/Step-17 checks.
Generic render scripts were reused, not duplicated for this product.

## 9. Product-specific files outside package

Intentional:

- Central registry import/registration and cross-product registry tests.
- Binary sources in `references/wf311613-standalone-murphy-bed/` (PDF and
  appearance-only material reference), associated by product `sources.ts`.
- Generated reviews, frames and screenshots under
  `output/wf311613-standalone-murphy-bed/`; historical approved reviews remain.
- Temporary render diagnostic/benchmark artifacts under `tmp/`; not deliverables
  or alternate engineering datasets.

No new product-specific geometry, paths, cameras, pacing overrides or step rules
were introduced into shared engine/components/scripts.

STOP after Step 20 and this review export. Await the user's director review.
