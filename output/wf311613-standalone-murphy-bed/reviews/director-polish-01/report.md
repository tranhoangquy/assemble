# Director polish pass 01 — QA checkpoint

Status: QA stills ready; awaiting director review. This is not director approval. No new full MP4 was exported.

The candidate is the registered `wf311613-director-polish-01` package. The accepted full-assembly package and its MP4 remain available and unchanged.

## Deliverables

- [Review gallery](index.html): 20 final 1280 × 720 deterministic playback stills, with before/after comparisons.
- [Contact sheet](contact-sheet.png).
- [Actual render manifest](stills/render-manifest.json): capture times, camera position, direction, target and FOV; no inspection-camera substitution.
- [Rendered camera verification](render-camera-verification.json): all 20 captures match the selected timeline presets, including backwards seeks.
- [Mechanical validation](validation-results.json).
- [All-shot camera audit](final-camera-audit.json).

The first 11 gallery views cover the required early assembly, cabinet medium, previously distant bed assembly, four Step 25 stages, Step 28 leg, Step 30 anchor, and final open/closed room compositions. Nine additional views show first-step hardware, top-cap seating, the two bed subassemblies, bearing lowering, retainer installation, PDF-left D8, PDF-right D9, connected pullback, and the leg pivot.

Before frames were decoded from the accepted MP4, not recreated with a diagnostic camera. The reported distant composition is exactly 224 seconds, in PDF Step 14, shot `S14-C2-right-seat`. Both comparisons are defined in [comparisons.json](comparisons.json).

## Step 25: front-stage approach

The old bed workspace was behind the cabinet, with source pivot `[0, 45, 340]`. Its seven-segment route lifted and transported the completed assembly around the cabinet before the final approach.

The new bed workspace is translated `[0, 0, -460]`, giving source pivot `[0, 45, -120]`. The EMPTY bed root is positioned before the first bed parts appear in Step 11. Steps 11–24 actually build in that front workspace; no completed bed is teleported or hidden under a camera cut. Local installation normals, connection geometry, secured-child transforms, hardware and action durations stay unchanged. Unparented E2 world-space staging/seated offsets receive the same workspace translation before linkage ownership begins.

The final route is:

1. Supported lift/orientation: `[0, 45, -120]`, 0° → `[0, 85, -120]`, 70°.
2. Short front approach and bearing alignment: → `[0, 47, -9.2]`, 70°.
3. Controlled lowering into both cradles: → unchanged cabinet pivot `[0, 36.5, -9.2]`, 70°.
4. Existing connection macros and both #18 retainer installations continue. Four-person support remains an explicit instructional requirement until the connection/pistons are complete.

| Measure | Accepted baseline | Polish candidate |
| --- | ---: | ---: |
| Transport segments | 7 | 3 |
| Pivot translation route | 1161.48 cm | 167.64 cm |
| Step 25 duration | 26.5 s | 16.9 s |
| Full timeline duration | 507.854 s | 498.254 s |

The candidate timeline is approximately **8:18.254**. This is timeline metadata, not the duration of a newly encoded video. Only the removed Step 25 transport saves 9.6 seconds; no global speed multiplier was applied.

An initial front-workspace proposal at -415 cm failed four C6 staging-sweep checks against fixed D5. Moving the EMPTY workspace another 45 cm forward resolved these collisions without editing any product mesh, local staging path, validation tolerance or action duration. The final value is -460 cm.

## Camera distance and instructional access

All 552 candidate shots across 31 steps were audited at 8%, 50% and 92% of their actual deterministic timelines: 1656 sampled poses. Product geometry, ancestor visibility, installed variants and world matrices were used. The four deleted transport shots explain the difference from the 556-shot accepted baseline.

211 shots use presentation camera overrides:

- 52 working-medium shots are framed around useful active assemblies rather than large empty workspaces.
- 119 existing bed-workspace close-ups are translated with the front workspace; their lens, relative distance and instructional side are retained.
- Three initial front-context proposals and 37 subsequent actual-presentation corrections cover Step 25 relationships, raised-bed/final contexts, whole D8/D9 plate shots, and wall-anchor access.
- Clean viewpoint cuts are retained. No long camera flight was added.

At the reported 224-second shot, useful subject coverage changes from 62.56% to 73.83%; camera-target distance falls from 694.13 cm to 403.77 cm. Mean sampled subject depth falls from 735.19 cm to 402.76 cm, avoiding the old distant fog washout. The 52 focused work shots fall within approximately 65.3–78% useful coverage.

Whole D8/D9 installation views now show the complete handed metal plate and its pilots from the cabinet interior. Wall-anchor cameras were moved to the visible front side of the unchanged installation wall; old macro FOV/distance is preserved. Neither product parts nor the wall are hidden to create access.

Zero sampled camera sensors intersect a product solid. This numerical check does not prove every possible occlusion; the final rendered stills were also inspected for connection readability, clipping, room occlusion and composition.

Nine context shots remain below the 65% default guide: Step 3 introduction/first-side/alignment-warning/squareness at 58.7–62.4%, Step 7 front/rear top-cap closures/result at 60.4–61.5%, and Step 8 seating/result at 64.2–64.4%. These retain useful assembly context and clearance. Existing useful macros are not forced into whole-part crop targets. No product geometry change was used to improve framing.

## Bedroom presentation

The supplied bedroom image is a mood reference only, not an engineering source. The generic room is deliberately restrained: a deterministic wood floor, neutral wall/baseboard, simple window/curtain silhouette and small padded work supports. No bookshelf/storage unit, new bed component or room prop enters the product registry or assembly graph.

- Room dimensions: 1800 × 1500 cm presentation extent; height 600 cm; floor at Y=0. These are scene-layout values, not manufacturer dimensions.
- Floor texture is procedurally generated with fixed seed 64319; no external image service or paid generation is used.
- The far room wall stays clear of assembly motion. At the existing wall-position cut, its presentation plane is placed at Z=22.3 behind the unchanged product installation-wall face at Z=22.2.
- Narrow support pads contact the existing elevated work convention at Y=36/39 and avoid the center/end hardware axes. They are presentation aids, not PDF parts. They disappear at the supported-lift viewpoint cut, where four-person handling is explicitly required.
- Product lighting rig and material definitions are unchanged. Scene exposure changes from 1.05 to 0.97; background/fog is `#b9afa0`, fog range 1400–2300, wall `#e9e6de`, floor `#a5937b`.
- No extra product dimensions, grooves, bores, axles, components, collision masks or transparency were introduced.

Two narrow deterministic rendering defects were fixed during still QA. The room presentation is now explicitly synchronized before manual rendering, so backwards seeks cannot retain stale supports/wall positions. The camera's orientation is synchronized after all timeline tracks, preventing a backwards seek from retaining the previous view direction despite the correct position/target. Presets, pacing and product motion are not redesigned by these fixes.

Final rendered camera-state verification passes at all 20 checkpoints: maximum position/target error is below 5e-7 cm, direction-component error below 2.91e-8, and FOV error is zero. This also covers the backwards capture transitions into the final-closed and D9 views.

## Locked baseline

The geometry/material/accepted-plan hashes remain identical:

| Lock | SHA-256 |
| --- | --- |
| Product definition | `4645bcf33682cbf377d84a2d0f8139674b6d80f5a5014a29505bf97287f82a45` |
| Product materials | `d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc` |
| Accepted DirectorPlan | `9836e1ca75e4910b46c9e9d51ffb4ba2f0a7c78667dcb4297cd3772afc65d7b0` |

Step 1–3 pacing is unchanged. Step 4–20 action durations and local installation behavior remain unchanged. B8 face closure, C1/C2/D3/D6/D7 foot geometry, D8/D9 receivers, E1/E2, all bore/axis coordinates, hardware topology and PDF step order are unchanged. Previously estimated product geometry stays estimated; this pass adds no engineering precision claims.

Accepted MP4: `output/wf311613-standalone-murphy-bed/reviews/full-assembly/wf311613-full-assembly-review.mp4`.
Its SHA-256 remains `53209c86c67fc7fbb2db5ff9a12be09f79776e62b52332f88c40e969d77176be`.

## Validation

Typecheck, lint, production build and all **138 tests in 25 files** pass. Production build still reports the pre-existing broad dynamic-file-pattern warning in ExportJobManager; it is not a build error and was not expanded into an unrelated refactor.

All **11 mechanical gate groups** pass with zero errors:

1. Assembly: 31 steps, 433 operations, no warnings.
2. Structural installation paths: 40 paths, 1656 poses, 760 swept segments, 139 hardware axes, 3280 rigid-carrier checks.
3. Front-stage actual meshes: 275 poses, 2698 actual mesh-pair checks after broadphase, 56100 rigid-relative checks, 1100 piston endpoint checks.
4. Whole assembly mechanics, including product solids and leg motion.
5. Hardware fits and actual apertures: 64 axes, 58 receivers, 290 aperture rays.
6. Step 28 actual installation paths: 28 operations, 700 poses, 992 actual mesh pairs.
7. Folding-leg/function sweeps: 0.25° angular increments, 1446 poses, 4872 actual mesh-pair checks.
8. Bearing receiver paths: 1274 poses using the actual open-cradle material profile.
9. Attached piston sweeps: 0.25° increments; length 73.65–89.48 cm within the existing maximum 92 cm; 101080 cylinder checks.
10. Whole-scene deterministic resets: 6412 comparisons, 458 registered objects, 912 scene objects.
11. B8 closure: six panels, 549 path samples, 144 closure rays; accepted seams retained.

Final front-route floor clearance is at least 12.75 cm. E2 linkage ownership has zero measured jump; the completed-bed route boundary residual is approximately 2.84e-14 cm. Final cabinet pivot is unchanged. Validators were run on the candidate plan, not substituted with the accepted baseline. No thresholds or collision exemptions were relaxed.

These are animation/mesh validation results, not structural load, installation safety or manufacturing-tolerance certification.

## Implementation ownership

Product-specific polish data stays inside `src/products/wf311613-standalone-murphy-bed/`:

- `director/front-staging.ts`, `polish-pass01.ts`.
- Camera-audit/fitting helpers, generators and serialized camera overrides.
- `validation/front-staging-validation.ts`, `run-polish-gates.ts` and candidate-plan parameters in existing mechanical validators.
- Front-stage, camera-distance and polish-lock regression tests.
- Package registration in its `index.ts`.

Genuinely generic changes stay outside the package:

- `src/types/presentation.ts` and the optional presentation field in video types.
- `src/presentation/environment/BedroomEnvironment.tsx`, `bedroom-config.ts` and its tests.
- Viewer presentation synchronization/preset wiring.
- `src/engine/animation/AnimationEngine.ts` and the camera-seek regression test.
- `scripts/render-checkpoints.ts` manifest capture and generic `scripts/build-review-gallery.ts`.
- Central registry expectation update.

Source/mood metadata is associated with this product in `references/wf311613-standalone-murphy-bed/director-polish-01-sources.md`. All generated artifacts for this pass are isolated in this review directory. There are no new product-specific checks in the shared camera/rendering engine.

## Stop condition

Review the still gallery and both before/after pairs. Do not render a new full MP4 or make further geometry/pacing changes until the director reviews this checkpoint.
