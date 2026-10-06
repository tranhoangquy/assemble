# Step 1 V2 — exported review checkpoint, awaiting director review

Only PDF Step 1 is executable in the new review selection `wf311613-step01-v2`.
Steps 2–31 have not been revised or extended. Existing packages and exports are preserved.

## Render status

The six PNGs in `output/wf311613-step01-v2/` have been rerendered and individually visually inspected. They are the final still deliverables for this review request, not director-approved images. Earlier trial images were replaced after correcting the camera clamp, visible repeating wood-texture seams, receiving dowel bores and hardware close-up framing.

The final rerender and MP4 have now been exported successfully using the actual deterministic Step 1 timeline. Output: H.264, 1280×720, 30 fps, 3018 frames, 100.6 seconds, no audio. Earlier approval-service blocking was resolved at the render checkpoint. Steps 2–31 remain untouched by this revision.

Exported MP4 path:

`/Users/quyth/development/three/POC/output/wf311613-step01-v2/wf311613-step-01-director-v2.mp4`

## Directing changes

- Before: one broad camera and a continuous orbit/tween, with a 180 cm orbit clamp preventing true close-ups.
- After: cuts driven by DirectorPlan shot data; bounding-box fitting for context, each dowel and each cam/bolt joint. Both members and the approach envelope are included in macro bounds.
- Small English captions replace the oversized title that obscured the active assembly.
- A9 lowers between A7/A8, all six dowels insert before the uprights slide along the dowel axes, then all eight individual cam/bolt joints are shown.
- Hardware approach, contact hold, feed/spin and seating are distinct phases. Oriented bolts spin using a spindle quaternion rather than Euler tumbling.

## Material / geometry implementation

- Deterministic oak albedo, roughness and subtle bump textures; per-part longitudinal grain UV projection; small bevels.
- Separate metallic socket bolts with thread geometry and recessed heads, round slotted cams and fluted dowels.
- Actual top cam bores, edge dowel/bolt bores and upright receiving bores are modeled. Cam internals and groove profiles remain simplified. This is not a manufacturing model.
- Exactly six PDF-coded wood parts, six #6 dowels, eight #5 bolts and eight #8 cams. PDF #5 diameter/length and #6 diameter/length are used. Other dimensions, head proportions, cam envelope, clearances and hole locations remain estimated.

## Legacy geometry

The Step 1 V2 package contains no side-bookcase/storage parts or inherited cabinet rows. The old Side Bookcase product is preserved as a separate, explicitly labeled catalog entry; it is not imported into this review. No user-owned old project was deleted. A complete standalone product is not claimed at the Step 1 gate.

## Validation

- Typecheck: PASS.
- ESLint: PASS.
- Tests: 27/27 PASS.
- Production build: PASS.
- Step 1 assembly validator: 25 connected operations, zero errors/warnings, specific mating-part contact lists (no global contact whitelist).
- The validator now distinguishes staged placements from installed final placements, and hardware phase paths match runtime approach distances.
- Collision checking remains conservative AABB sampling, not exact swept-mesh/tool-access certification. All six stills were inspected for grain direction/scale, edges, hardware, hole alignment, connection readability, framing and visible intersections. Additional actual movie frames were inspected during upright insertion and later hardware joints. This local QA is not director approval.

## Final stills

- `01-context.png`
- `01-part-introduction.png`
- `01-alignment.png`
- `01-dowel-macro.png`
- `01-bolt-macro.png`
- `01-result.png`

## Files changed

- `src/data/products/wf311613-standalone-murphy-bed/step01-v2.ts`
- `src/data/products/catalog.ts`
- `src/engine/camera/InstructionalFraming.ts`
- `src/engine/director/DirectorPlanCompiler.ts`
- `src/engine/geometry/GeometryFactory.ts`
- `src/engine/materials/MaterialFactory.ts`
- `src/engine/animation/ActionExecutor.ts`
- `src/engine/assembly/AssemblyValidator.ts`
- `src/engine/installation/InstallationPathResolver.ts`
- `src/engine/installation/InstallationCollisionChecker.ts`
- `src/engine/installation/ProductTransformIndex.ts`
- `src/components/product/PartRenderer.tsx`
- `src/components/viewer/CameraController.tsx`
- `src/components/viewer/Lighting.tsx`
- `src/components/viewer/Scene.tsx`
- `src/components/viewer/ProductViewer.tsx`
- `src/types/product.ts`, `src/types/assembly.ts`, `src/types/director.ts`, `src/types/video.ts`
- `src/app/globals.css`
- `src/engine/engine.test.ts`, `src/engine/step01-v2.test.ts`
- `scripts/render-step01-v2.ts`
- This checkpoint report.

## Resume at the render checkpoint

With the local server running at port 3000, render six stills first and inspect them. Do not export the movie until macro views and assembly axes are readable.

```sh
node --import tsx scripts/render-step01-v2.ts
```

After visual verification, render the actual 100.6-second deterministic timeline at 1280×720, 30 fps:

```sh
PROJECT_ID=wf311613-step01-v2 OUTPUT_WIDTH=1280 OUTPUT_HEIGHT=720 OUTPUT_FPS=30 FRAMES_DIR=/private/tmp/wf311613-step01-v2-frames OUTPUT_FILE=/Users/quyth/development/three/POC/output/wf311613-step01-v2/wf311613-step-01-director-v2.mp4 node --import tsx scripts/render-video.ts
```

Stop after the six verified stills and review MP4. Director approval is required before propagating changes to Steps 2–31.
