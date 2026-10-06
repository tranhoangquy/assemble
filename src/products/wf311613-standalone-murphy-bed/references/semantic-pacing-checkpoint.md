# WF311613 semantic pacing checkpoint

## Scope and authority

Step 1 V2's appearance was approved by the user. Its product object, geometry,
materials, camera presets and lighting are unchanged. This checkpoint changes
timing, not playback speed. Neither the new pacing nor Step 2 has director approval.
The authoritative PDF and approved 31-step DirectorPlan remain the assembly sources.
No Step 11–31 implementation has been added.

## Completed exports

- `output/wf311613-step01-v2/wf311613-step-01-pacing-review.mp4`
  — H.264, 1280×720, 30 fps, 2,361 frames, 78.700 s.
- `output/wf311613-step01-v2/wf311613-step-02-paced-checkpoint.mp4`
  — H.264, 1280×720, 30 fps, 1,428 frames, 47.600 s. This is Step 2 alone,
  captured from the same deterministic two-step timeline after Step 1.

The original 100.6 s Step 1 V2 export remains intact. Step 1 is now 21.8% shorter.
The first dowel, first cam/bolt, initial target identification and panel alignment
are unchanged. Introduction/staging travel, repeated hardware and static holds are
shortened separately. Every hardware installation retains a nonzero approach,
contact, insertion and (where applicable) rotation interval. Cameras cut.

Step 2 uses a reflected work-surface X axis with A2/A4/A6 and independent A7/A8/A9
instances. The completed first assembly is parked outside the active work area at
an instructional cut. Materials and lighting at the active work surface are shared
with the approved Step 1. The first mirrored cam/bolt remains a readable close-up;
later connections are shorter. All eight bolts start before the final cam-lock pass.

## Validation and visual inspection

- `npm test`: 31 tests pass.
- `npm run typecheck`: passes.
- Two-step AssemblyValidator: 50 installation operations, no errors or warnings.
  Mating-contact exemptions remain local; no all-part collision whitelist.
- Both exports decode through FFmpeg without errors.
- Inspected Step 1 first-bolt approach, engagement and seat frames and a repeated
  dowel frame. Inspected Step 2 panel layout, first mirrored bolt and final assembly.
  The shared oak, hole faces, metal thread, physical movement and cuts remain visible.
- All new assertions check action duration against its containing shot; shortening
  a shot cannot silently spill hardware or highlight cleanup into the next shot.

## Changed files

- `src/engine/director/InstructionalPacing.ts`: semantic timing and full-film target.
- `src/data/products/wf311613-standalone-murphy-bed/step01-paced.ts`: retimed Step 1.
- `src/data/products/wf311613-standalone-murphy-bed/step02-paced.ts`: mirrored Step 2.
- `src/data/products/catalog.ts`: explicit paced work checkpoints; original projects retained.
- `src/engine/instructional-pacing.test.ts`, `src/engine/engine.test.ts`: timing/quantity gates.
- `src/engine/assembly/AssemblyValidator.ts` and installation transform/collision index:
  retain secured state when an assembly is parked; track current per-part rotation
  instead of checking reoriented geometry at its original orientation.

## Full-film budget

Target 480–540 seconds; preferred maximum 600. Steps 1–2 currently total 126.3 s.
Working allocation: approximately 230–260 s for Steps 1–10, leaving approximately
250–300 s for Steps 11–31. These are budgets, not a completed runtime or authorization
to implement Step 11. Difficult mechanisms and anchoring have priority over repeated
connections. No uniform video speed multiplier will be used.

## Step 3 motion conflict resolved by user authorization

The approved Step 3 specifies supported, stationary side assemblies and horizontal
insertion of spanning members after dowels are fitted. PDF page 10 depicts closed
end bores, dowels entering along the cabinet-width axis, and an exploded gap on the
second side. A spanning rail cannot slide sideways through preinstalled protruding
dowels while both rigid sides remain fixed at the final separation.

The user authorized this presentation correction: keep one side supported but temporarily outboard;
install dowels into rail ends, seat the rails axially onto the first side, align the
second supported side and close it along the dowel axes. Start all six #4 bolts
before the final tightening pass. This does not add components or change PDF parts,
hardware quantities or step order, but it changes the approved stationary-side
motion statement. The Step 3 section of the DirectorPlan now records this authorized correction.

Step 3 now has a separate corrected implementation and validation gate. Steps 4–10
have NOT been implemented using the new visual/pacing standard. The old
Steps 1–10 project is retained as legacy, not evidence of completion. No continuous
new-standard Steps 1–10 MP4 exists yet. The 16-conflict audit is not fully resolved.
