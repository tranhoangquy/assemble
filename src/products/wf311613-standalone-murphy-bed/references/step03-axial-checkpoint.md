# Step 3 axial mating correction

The user explicitly authorized the supported-outboard-side motion correction.
The approved DirectorPlan's Step 3 section now records that correction. No change
has been made to PDF part identities, hardware quantities or PDF step order.

## Implemented sequence

1. Establish the completed, supported side assemblies, with the second side outboard.
2. In the clear gap, seat E4 into E3 and lower D5 onto the upper tongue. B9 remains supported.
3. Install all six #6 dowels halfway into the three rail ends.
4. Translate the lower frame and its dowels rigidly onto the first side along X.
5. Show the second-side receivers and close that supported side only along X.
6. Install six separate #8 cams and START all six separate #4 bolts.
7. Verify squareness, then execute a separate final tightening/seat/cam-lock pass.
8. Show the newly assembled lower frame in a medium final shot.

Step 3 runs 51.750 seconds in the actual director timeline. Its standalone review
export is `output/wf311613-step03-corrected/wf311613-step-03-axial-mating-review.mp4`:
1280x720, 30 fps, H.264, 1,553 frames, 51.766667 seconds including frame rounding.
The new product-select entry is **WF311613 · corrected Step 3 axial mating**.
It contains Steps 1–3, not an asserted complete Steps 1–10 film.

## Corrections needed to support this motion

- Separate staged connection destinations allow dowels/E4 to assemble in the
  supported frame before it moves into the first side. Staged-target permissions
  are explicit per connection, not a global collision exemption.
- Dowels and E4 follow precisely the rail insertion's three motion phases.
- World-spindle tightening keeps the sideways cams and bolts spinning about their
  actual installation axes; Euler interpolation must not tumble them.
- Real side receiver bores, blind rail-end bores and E4 tongue receivers are modeled.
  The original standalone approved Step 1 and paced Step 2 product objects/exports
  are not mutated. The combined package adds the Step 3 receiving bores required
  by the later joint without redesigning the approved materials or lighting.

## Evidence and estimates

PDF page 10 defines D5/B9/E3/E4, the tongue relationship, six #6 dowels, six #8 cams,
six #4 bolts and the start-all-before-tightening warning. Unprinted beam lengths,
receiver centers/clearance, tongue/slot envelope, frame staging travel (14 cm) and
side staging travel (36 cm) remain proportional/mechanical estimates. They are not
manufacturer-precision dimensions or an additional component inventory.
Support/handling is implied by the instructional captions; no invented support
hardware has been added to the product registry.

## QA

- Geometry, semantic ordering, rigid-axis movement, bore-center alignment and
  forward/backward seek behavior have automated checks.
- Assembly validation: 72 connected operations across Steps 1–3, no errors/warnings.
  Step 3 exemptions include only the actual mating members/dowels.
- First/second-side alignment, first bolt engagement, pre-tightening state and
  final lower-frame composition inspected from rendered checkpoints/video frames.
- MP4 stream dimensions/frame rate verified; full FFmpeg decode passes.
- No director approval for the new render is claimed.

The unrelated legacy projects remain intact. Steps 4–10 are still unfinished under
the new profile; Step 11 has not been started. The overall 16-conflict audit is not
claimed complete.
