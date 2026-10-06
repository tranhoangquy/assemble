# B8 closed cabinet-face checkpoint

Scope: correct all six B8 panels and their Step 4–6 approach paths only.
Stop before Step 11. Approved Steps 1–3, materials, lighting, hardware,
playback cameras, action durations and assembly order are preserved.

## Source and reconstruction

Assembly manual pages 11–13 (PDF Steps 4–6) are the topology/order source.
The PDF does not print B8 machining tolerances or these reconstructed spans.
All dimensions below are **estimated scene dimensions in centimetres**, not
manufacturer measurements. No AI reference is used as engineering evidence.

The existing side assemblies define inner contact planes X = −116.5/+116.5.
The coherent face equation is:

`233 = 113.85 (B8 left) + 5.30 (B7) + 113.85 (B8 right)`

No fillers, covers, trim, hidden backing or shadow meshes were introduced.

## Old / new relationship

| Value | Previous reconstruction | Corrected reconstruction |
|---|---:|---:|
| Cabinet inner width | 233 | 233, unchanged |
| Each B8 width | 110.70 | 113.85 |
| B8 X centers | −58.10 / +58.10 | −59.575 / +59.575 |
| B8 outer edges | −113.45 / +113.45 | −116.50 / +116.50 |
| Open outer strip, each side | 3.05 | 0 nominal through-gap |
| B8 inner edges | −2.75 / +2.75 | −2.65 / +2.65 |
| B7 width / center | 5.30 / 0 | unchanged |
| Open seam at each B7 edge | 0.10 | 0 nominal through-gap |
| B8 row 1/2 height | 48.88 | 49.00 |
| B8 row 3 height | 50.88 | 51.00 |
| Gap at each horizontal row edge | 0.06 | 0 nominal through-gap |
| D4/B5/B6 spans | 233 | 233, unchanged; derived from same inner-width constant |
| B8 depth / Z | 1.20 / 18 | unchanged |
| Existing B8 edge easing | 0.04 | unchanged |

The nominal mating surfaces meet without overlapping solid bodies. Existing
edge easing supplies the shallow visible furniture seam; there is no open
clearance channel through to the background. This ideal reconstructed contact
is **not** a claim about manufactured zero-clearance joinery or tolerances.
The intentional lower cabinet opening is preserved.

## Connection coordinates

B8 origins remain local [0,0,0]; their world X positions change as above.
The existing `mount` coordinates are unchanged. Explicit B8 surface points
now derive from each panel's actual size:

- Outer edge local X: side × 56.925 (old geometric edge: side × 55.35).
- Center edge local X: −side × 56.925.
- Lower/upper local Y: −/+24.50 for rows 1/2, −/+25.50 for row 3
  (old geometric edges: −/+24.44 and −/+25.44).

The rail/post supports and B7 center did not move. Consequently the dowel,
bolt, cam and receiving-bore coordinates remain unchanged. Validation checks
the actual standing transforms and eight row-end joint axes, including B6.

## Installation-path correction

Simply widening B8 while retaining its old straight slide contacted the
existing post/rail edge easing. The revised paths clear those actual meshes:

1. Stage B8 0.12 inward and 0.12 above its final contact planes, Z offset +16.
2. Approach with that clearance until Z offset +3, past the rear post easing.
3. Align outward to its final X while keeping Y offset +0.12; reach final Z.
4. Settle down 0.12 onto the lower support.

These are temporary **estimated motion clearances**, not final seams.
B7 is parked at offset [0,+5,−12] during B8 insertion rather than obstructing
the center channel. On its turn it approaches [0,+5,0], aligns vertically,
then lowers its existing narrow tongue into the existing receiver.
Upper spanning rails remain staged until their original assembly turn.
No part teleports or moves through another solid to obtain visibility.

Assembly order and action durations are unchanged: each B8 action 0.93 s,
each B7 action 1.13 s. Step durations remain 13.55 / 13.55 / 19.75 s for
Steps 4/5/6; Steps 1–3 remain 40.897333 / 25.646722 / 31.722222 s.

## Validation

- Typecheck: pass.
- Lint: pass.
- Tests: 55 passing in 8 files, including approved-prefix regression tests.
- Assembly validation: 10 steps, 176 operations; no errors or warnings.
- Closed-face validation: all 6 B8 panels; 144 seam/edge rays hit actual wood.
- Path validation: 549 deterministic poses over 6 B8 and 3 B7 insertions.
- Continuous conservative swept-envelope checks: 27 translation segments.
- No detected final B8 or insertion-path penetration of visible wood/hardware.
- Hardware alignment: all 8 row-end dowel/bolt/cam receiver pairs pass.
- Two bright patches in the Step 10 straight front view raycast to the actual
  `S9-H25-bend` / `S10-H25-bend` metal return flanges, not background openings.
- Production build: passes. Existing non-blocking warnings remain: broad
  dynamic `frames` file tracing in `ExportJobManager.ts`; Three CJS deprecation
  in CLI tools. No unrelated architecture changes were made to fix warnings.

The path checks use generated blocker triangles and conservative moving
envelopes. B7's core and two narrow tongues are checked separately so a
receiver correctly containing a tongue is not confused with the empty space
inside the stile's enclosing bounding box. Numerical epsilon is 1e−4 cm for
Float32 tessellation, not a construction clearance or collision exemption.

## Final stills

All six images are actual 1280×720 scene renders, visually inspected:

Output directory:
`/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/b8-closed-face/stills/`

1. `b8-01-full-front.png` — straight front, completed Step 10, 225.626278 s.
2. `b8-02-left-outer-seam.png` — PDF-left contact plane, Step 6, 144.946278 s.
3. `b8-03-right-outer-seam.png` — PDF-right contact plane, same state/time.
4. `b8-04-center-b7-seams.png` — exposed B7 before E5, same state/time.
5. `b8-05-step04-panel-insertion.png` — actual approved context camera during
   revised first B8 insertion, 101.141278 s.
6. `b8-06-step06-cabinet-complete.png` — all three rows in one frame using the
   existing full-cabinet camera preset for inspection, 144.946278 s.

The dedicated straight/macro inspection views are additional QA views; no
playback camera preset is changed or used to conceal an opening. The interior
front view looks along +Z, so PDF-right (+X) appears on screen-left.

## Changed files

Product package:

- `product/parts-step04-10.ts`: coherent contact-plane dimensions, B8 surface
  connection points, temporary insertion clearances and B7 parking offset.
- `director/steps04-10.ts`: use corrected Step 4–6 paths; no timing/camera change.
- `validation/b8-validation.ts`: generated-mesh closure, collision/path and
  hardware-axis checks.
- `validation/b8-checkpoints.ts`: six product-owned inspection checkpoint specs.
- `tests/b8-closed-face.test.ts`: geometry/path/regression checks.
- `index.ts`: register the six additional checkpoints on the current package.
- This report.

Shared changes are product-agnostic inspection support only:

- `src/types/product-package.ts`: optional checkpoint inspection camera.
- `src/engine/render/FrameRenderer.ts`: optional render-time inspection camera.
- `src/components/viewer/ProductViewer.tsx`: temporarily render a requested
  inspection view, then restore playback camera pose/FOV without changing controls.
- `scripts/render-checkpoints.ts`: optional name-prefix filter and camera passthrough.

## Export status / stop

No MP4 re-export was requested for this geometry checkpoint. The prior
`wf311613-steps-01-10-paced-review.mp4` is a historical render and still contains
the pre-fix B8 geometry; it must not be presented as containing this correction.
Only the current product source and the six stills above contain this fix.
No Step 11 or later implementation was added. Stop for review; no director
approval is claimed.
