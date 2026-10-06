# Director Polish 02 — QA only, awaiting review

Candidate: **wf311613-director-polish-02**. No full Polish 02 MP4, 2K/4K, audio, Option 2, or production approval.

## Locked engineering and timing

All 458 product object definitions, materials, PDF IDs, B8, C1/C2 relief, D8/D9, bearing/leg geometry, apertures and piston anchor/stroke definitions are unchanged. Product/material SHA locks PASS. The 31 numbered steps, every existing shot ID/duration, Step 1–3 pacing, and locked Step 4–20 timing remain unchanged. Assembly runtime: 498.253694 s.

## Helper removal and supported work poses

All four face pads/posts and four carrier pads/posts are removed from the **renderer**, not replaced by props. Their original support metadata, assembly support reasoning and validators remain internal. The historical Polish 01 MP4/approved still files are untouched.

Simply hiding helpers would float timber, so the EMPTY root enters the front workspace at [0, -36, -485] before any bed parts appear. Face timbers initially rest on the floor; after the PDF underside supports are installed, they provide floor contact at root Y = -33. The separately built carrier is parked six scene units lower and rests on its own PDF rails. For underside supports and underside joining bolts, the frame uses a controlled 70° edge-held pose about its actual contact corner [116, 36, 362], then returns to the floor. This is a supported handling pose, not a modeled lifting-load claim; people continue to be required for lifting.

**Explicit staging deviation:** work Z changes from -460 to -485 (25 cm forward) because grounded axial panel insertion otherwise encroaches on the existing cabinet bottom rail. The bed remains immediately in front of the cabinet. Step 25 still has exactly the same three short segments; only its lift START follows the grounded source pivot [0, 12, -145]. Its lifted endpoint [0, 85, -120], short approach [0, 47, -9.2], final bearing axis [0, 36.5, -9.2], three durations and retainer sequence are unchanged. No seven-segment historical route is restored. Actual paths and floor checks were rerun.

The path validator now tests both bodies in the same rigid frame (avoids false world-AABB intersections on tilted timber), and uses 96 consecutive swept intervals instead of three huge waypoint unions. Actual surfaces and numeric/collision tolerances are unchanged; sampling increases rather than exclusions being added.

## Camera and room continuity

Polish 01 lenses and useful camera-to-joint distances are retained. Working views and close-ups follow the grounded/edge-held work poses by rigid transformation. 10 transformed views needed the clear above-floor side while preserving lens/distance; this is an access correction, not a camera-system redesign. Step 25 connection/pullback presets stay unchanged. Read-only all-shot camera measurements: [final-camera-audit.json](final-camera-audit.json). Assembly bedroom, exposure 0.97, fog and neutral lighting remain unchanged; no extra lighting or depth of field.

Three Step 13 underside-support seating views also use the actual underside-normal access angle, preserving their lens/distance, because the previous grazing view concealed the support profile in the edge-held pose. The final camera audit covers 552 shots / 1656 samples with no sensor intersections. Eleven WORKING_MEDIUM-labeled shots with measurable subjects have coverage below 65%, mainly inherited context views plus workspace/two-subassembly views; two additional Step 5/6 context entries have zero measured subject coverage. These are disclosed review exceptions, not a claim that every shot meets a universal framing threshold; no automatic refit was applied.

## Viewer text

Separate presentation metadata resolves all 458 internal object IDs. Normal video captions never use raw timber IDs or debugging terminology. Every assembly shot has an explicit caption/omit decision, so hidden captions cannot fall back to old diagnostics. 381 captions are omitted; retained captions are one concise instruction. No text hold or duration was added. Normal parts-list labels use human names; internal IDs remain available to diagnostic/source tooling.

### Actual before/after examples

| Operation | Before (actual original note) | After |
| --- | --- | --- |
| Wood part | Slide A1 straight onto its three exposed dowels; seat against A5, A7 and A8. | Fit the side frame rail. |
| Structural connection | All six bolts have started. Verify parallel cabinet sides and square lower-frame corners before the tightening pass. | Check alignment before tightening. |
| Hardware | #5 bolt 1/8 — approach → align → contact → turn and feed → seat in #8. | Fit the long bolt. |
| Mechanism | The lower E2 eye approaches the SMALL stud axially. Keep the other end supported; do not articulate the bed. | Fit the gas piston. |

Full decisions: [caption-audit.json](caption-audit.json). Complete instance mapping: [presentation-names.json](presentation-names.json).

## Finished bedroom — presentation only

Editorial boundary occurs ONLY after all PDF work and the existing final functional verification finish. Then: real supported close → completed closed → real opening → actual folding-leg deployment/lowering → bare open view → mattress editorial cut → bedding editorial cut → 3 s hero. Because assembly ends OPEN, the initial closing operation is shown physically; there is no transform jump to the closed shot. Moving actions are cloned from the existing validated final mechanism sequence, with both pistons and bearings remaining connected.

The additional video scenes are tagged showcase, have no assemblyStep/Step 32, and do not enter the 31-step DirectorPlan or product graph. Generic FinishedBedroom props sit outside ProductRenderer/ObjectRegistry. New context: one bedside table/lamp, neutral rug, small plant, mattress, simple blanket and two pillows. Props are deterministic; no randomness or downloaded assets. No technical captions in the finished hero.

### Mattress fit — PRESENTATION ESTIMATE, NOT manufacturer specification

Scene unit: cm. Mattress **217 wide × 182 long × 19 thick**, center **[0, 41.8, -89.2]**, softened radius **1.6**. These dimensions only fit the reconstructed rendered envelope; no commercial size, mattress compatibility or manufacturing tolerance is claimed.

Bottom Y=32.3 matches all five support-slat upper faces. Envelope including seam piping leaves 2.64 cm side clearance and 5.34 cm end clearance. Fitted mattress/blanket envelopes do not intersect rails, end structure or folding-leg parts. Room furnishings remain outside the bed/cabinet silhouette envelope. Mattress, pillows, blanket, table, lamp, rug and plant are all PRESENTATION ONLY, absent from PDF parts, hardware and AssemblyGraph. Actual stills 12–15 provide visual-fit QA.

### Showcase shot budget

| Shot | Duration | Absolute range |
| --- | --- | --- |
| final-support-lift | 0.9 s | 498.254–499.154 s |
| final-fold-legs | 1.4 s | 499.154–500.554 s |
| final-close | 3.0 s | 500.554–503.554 s |
| final-closed | 1.2 s | 503.554–504.754 s |
| final-open | 3.0 s | 504.754–507.754 s |
| final-deploy-legs | 1.6 s | 507.754–509.354 s |
| final-lower-support | 0.9 s | 509.354–510.254 s |
| final-result | 2.0 s | 510.254–512.254 s |
| mattress | 1.8 s | 512.254–514.054 s |
| bedding | 2.0 s | 514.054–516.054 s |
| hero | 3.0 s | 516.054–519.054 s |

Additional showcase: **20.8 s**. Provisional total visual timeline: **519.053694 s (~8:39.054)**. No global speed multiplier or audio-driven retiming.

## Audio

**No explicitly approved/licensed music file currently supplied. QA silent.** No arbitrary internet music/SFX downloaded. Ready generic command: node --import tsx scripts/mux-approved-music.ts --video VISUAL_MASTER --approval APPROVED_ASSET_JSON --output NEW_MP4. Requires explicit user approval, known rights/evidence and exact audio SHA. Uses smooth overlap looping, low gain (0.18), limiter headroom, fade-in/out and unchanged video stream/duration. No music mux has been run. SFX remain future independent licensed assets; none added now.

## Validation and build

Mechanical gate suite complete=true, PASS=true. Includes assembly, 40 structural paths/1656 sampled poses, 4480 swept bounds, 139 hardware axes, 3280 rigid-carrier checks; grounded timber AND fastener floor checks; actual front approach meshes; full mechanics including appended real showcase motions; hardware/apertures; pivot/bearing; piston endpoint/stroke/body/rod; leg articulation/stored-leg closure; B8; whole-scene seek/reset; prop fit; raw-ID caption audit; product/material/timing locks. No waived collisions or relaxed thresholds.

Browser rendered seek/reset verification: **PASS**, 7 checkpoints repeated in reverse, comparing exact PNG SHA and camera state (includes props, lighting, environment and geometry). [presentation-seek-verification.json](presentation-seek-verification.json).

Typecheck and lint: PASS. Tests: 144/144 PASS with maxWorkers=2. Initial unconstrained parallel run hit two existing 5 s test timeouts under concurrent heavy validators; no assertions or timeout thresholds changed, bounded-worker rerun passed. Production build: PASS. [validation-results.json](validation-results.json).

Archived execution evidence: [tests](tests.log), [production build](build.log), [mechanical/presentation gates](gates.log).

## Handoff

[QA gallery](index.html), [contact sheet](contact-sheet.png), [actual still manifest](stills/render-manifest.json). 15 required views including historical before, plus two underside-access views. Before image is the approved Polish 01 still at the equivalent completed separate-frame state, not a newly rerendered/modified historical candidate.

STOP: awaits director review. No full Polish 02 MP4 was rendered.

## Complete canonical PDF part mapping

| Internal ID | Presentation name |
| --- | --- |
| A1 | Side Frame Rail |
| A2 | Side Frame Rail |
| A3 | Side Frame Rail |
| A4 | Side Frame Rail |
| A5 | Left Side Panel |
| A6 | Right Side Panel |
| A7 | Side Support Rail |
| A8 | Side Support Rail |
| A9 | Lower Side Panel |
| B1 | Top Frame Rail |
| B2 | Top Cross Rail |
| B3 | Top Center Support |
| B4 | Top Infill Panel |
| B5 | Upper Front Rail |
| B6 | Upper Rear Rail |
| B7 | Cabinet Center Support |
| B8 | Cabinet Back Panel |
| B9 | Bottom Rear Rail |
| C1 | Bed Face End Rail |
| C2 | Bed Face Side Rail |
| C3 | Bed Face Cross Rail |
| C4 | Bed Face Support Rail |
| C5 | Bed Face Center Rail |
| C6 | Bed Face Panel |
| C7 | Underside Support |
| C8 | Bed Frame Side Rail |
| C9 | Bed Frame End Rail |
| D1 | Bed Frame End Rail |
| D2 | Mattress Support Slat |
| D3 | Folding Leg |
| D4 | Cabinet Cross Rail |
| D5 | Lower Front Rail |
| D6 | Leg Foot |
| D7 | Leg Pivot Arm |
| D8 | Left Pivot Bracket |
| D9 | Right Pivot Bracket |
| E1 | Bed Mechanism Plate |
| E2 | Gas Piston |
| E3 | Bottom Front Rail |
| E4 | Lower Center Support |
| E5 | Cabinet Center Rail |

## Complete hardware mapping

| PDF number | Presentation name |
| --- | --- |
| #1 | Bolt |
| #2 | Bolt |
| #3 | Bolt |
| #4 | Bolt |
| #5 | Long Bolt |
| #6 | Wood Dowel |
| #7 | Leg Dowel |
| #8 | Cam Lock |
| #9 | Threaded Cap |
| #10 | Plastic Washer |
| #11 | Assembly Tool |
| #12 | Wood Screw |
| #13 | Long Wood Screw |
| #14 | Wood Screw |
| #15 | Wall Bracket |
| #16 | Slat Screw |
| #17 | Nut |
| #18 | Pivot Retainer Bolt |
| #19 | Bearing |
| #20 | Angle Bracket |
| #21 | Wood Screw |
| #22 | Long Bolt |
| #23 | Wall Screw |
| #24 | Wood Screw |
| #25 | Inner Angle Bracket |

## Complete physical-instance mapping (unchanged IDs)

| Internal instance ID | Presentation name |
| --- | --- |
| A5 | Left Side Panel |
| A7 | Side Support Rail |
| A8 | Side Support Rail |
| A9 | Lower Side Panel |
| A1 | Side Frame Rail |
| A3 | Side Frame Rail |
| dowel--1-0 | Wood Dowel |
| dowel--1-1 | Wood Dowel |
| dowel--1-2 | Wood Dowel |
| dowel-1-0 | Wood Dowel |
| dowel-1-1 | Wood Dowel |
| dowel-1-2 | Wood Dowel |
| cam--1-0 | Cam Lock |
| bolt--1-0 | Long Bolt |
| cam--1-1 | Cam Lock |
| bolt--1-1 | Long Bolt |
| cam--1-2 | Cam Lock |
| bolt--1-2 | Long Bolt |
| cam--1-3 | Cam Lock |
| bolt--1-3 | Long Bolt |
| cam-1-0 | Cam Lock |
| bolt-1-0 | Long Bolt |
| cam-1-1 | Cam Lock |
| bolt-1-1 | Long Bolt |
| cam-1-2 | Cam Lock |
| bolt-1-2 | Long Bolt |
| cam-1-3 | Cam Lock |
| bolt-1-3 | Long Bolt |
| A6 | Right Side Panel |
| A7-R | Side Support Rail |
| A8-R | Side Support Rail |
| A9-R | Lower Side Panel |
| A2 | Side Frame Rail |
| A4 | Side Frame Rail |
| R-dowel--1-0 | Wood Dowel |
| R-dowel--1-1 | Wood Dowel |
| R-dowel--1-2 | Wood Dowel |
| R-dowel-1-0 | Wood Dowel |
| R-dowel-1-1 | Wood Dowel |
| R-dowel-1-2 | Wood Dowel |
| R-cam--1-0 | Cam Lock |
| R-bolt--1-0 | Long Bolt |
| R-cam--1-1 | Cam Lock |
| R-bolt--1-1 | Long Bolt |
| R-cam--1-2 | Cam Lock |
| R-bolt--1-2 | Long Bolt |
| R-cam--1-3 | Cam Lock |
| R-bolt--1-3 | Long Bolt |
| R-cam-1-0 | Cam Lock |
| R-bolt-1-0 | Long Bolt |
| R-cam-1-1 | Cam Lock |
| R-bolt-1-1 | Long Bolt |
| R-cam-1-2 | Cam Lock |
| R-bolt-1-2 | Long Bolt |
| R-cam-1-3 | Cam Lock |
| R-bolt-1-3 | Long Bolt |
| E3 | Bottom Front Rail |
| B9 | Bottom Rear Rail |
| D5 | Lower Front Rail |
| E4 | Lower Center Support |
| S3-E3--1-dowel | Wood Dowel |
| S3-E3--1-cam | Cam Lock |
| S3-E3--1-bolt | Bolt |
| S3-E3-1-dowel | Wood Dowel |
| S3-E3-1-cam | Cam Lock |
| S3-E3-1-bolt | Bolt |
| S3-B9--1-dowel | Wood Dowel |
| S3-B9--1-cam | Cam Lock |
| S3-B9--1-bolt | Bolt |
| S3-B9-1-dowel | Wood Dowel |
| S3-B9-1-cam | Cam Lock |
| S3-B9-1-bolt | Bolt |
| S3-D5--1-dowel | Wood Dowel |
| S3-D5--1-cam | Cam Lock |
| S3-D5--1-bolt | Bolt |
| S3-D5-1-dowel | Wood Dowel |
| S3-D5-1-cam | Cam Lock |
| S3-D5-1-bolt | Bolt |
| B8-4--1 | Cabinet Back Panel |
| B8-4-1 | Cabinet Back Panel |
| B7-4 | Cabinet Center Support |
| D4-1 | Cabinet Cross Rail |
| S4-D4-1--1-dowel | Wood Dowel |
| S4-D4-1--1-cam | Cam Lock |
| S4-D4-1--1-bolt | Bolt |
| S4-D4-1-1-dowel | Wood Dowel |
| S4-D4-1-1-cam | Cam Lock |
| S4-D4-1-1-bolt | Bolt |
| B8-5--1 | Cabinet Back Panel |
| B8-5-1 | Cabinet Back Panel |
| B7-5 | Cabinet Center Support |
| D4-2 | Cabinet Cross Rail |
| S5-D4-2--1-dowel | Wood Dowel |
| S5-D4-2--1-cam | Cam Lock |
| S5-D4-2--1-bolt | Bolt |
| S5-D4-2-1-dowel | Wood Dowel |
| S5-D4-2-1-cam | Cam Lock |
| S5-D4-2-1-bolt | Bolt |
| B8-6--1 | Cabinet Back Panel |
| B8-6-1 | Cabinet Back Panel |
| B7-6 | Cabinet Center Support |
| B5 | Upper Front Rail |
| S6-B5--1-dowel | Wood Dowel |
| S6-B5--1-cam | Cam Lock |
| S6-B5--1-bolt | Bolt |
| S6-B5-1-dowel | Wood Dowel |
| S6-B5-1-cam | Cam Lock |
| S6-B5-1-bolt | Bolt |
| B6 | Upper Rear Rail |
| S6-B6--1-dowel | Wood Dowel |
| S6-B6--1-cam | Cam Lock |
| S6-B6--1-bolt | Bolt |
| S6-B6-1-dowel | Wood Dowel |
| S6-B6-1-cam | Cam Lock |
| S6-B6-1-bolt | Bolt |
| B1-rear | Top Frame Rail |
| B1-front | Top Frame Rail |
| B2-left | Top Cross Rail |
| B3 | Top Center Support |
| B2-right | Top Cross Rail |
| B4-left | Top Infill Panel |
| B4-right | Top Infill Panel |
| S7-H13-0 | Long Wood Screw |
| S7-H13-1 | Long Wood Screw |
| S7-H13-2 | Long Wood Screw |
| S7-H13-3 | Long Wood Screw |
| S7-H13-4 | Long Wood Screw |
| S7-H13-5 | Long Wood Screw |
| S8-dowel--1--18 | Wood Dowel |
| S8-dowel--1-18 | Wood Dowel |
| S8-dowel-1--18 | Wood Dowel |
| S8-dowel-1-18 | Wood Dowel |
| S8-H12--1-0 | Wood Screw |
| S8-H12--1-1 | Wood Screw |
| S8-H12--1-2 | Wood Screw |
| S8-H12--1-3 | Wood Screw |
| S8-H12--1-4 | Wood Screw |
| S8-H12-1-0 | Wood Screw |
| S8-H12-1-1 | Wood Screw |
| S8-H12-1-2 | Wood Screw |
| S8-H12-1-3 | Wood Screw |
| S8-H12-1-4 | Wood Screw |
| D9 | Right Pivot Bracket |
| S9-H21-0 | Wood Screw |
| S9-H21-1 | Wood Screw |
| S9-H21-2 | Wood Screw |
| S9-H21-3 | Wood Screw |
| S9-H21-4 | Wood Screw |
| S9-H21-5 | Wood Screw |
| S9-H21-6 | Wood Screw |
| S9-H21-7 | Wood Screw |
| S9-H21-8 | Wood Screw |
| S9-H21-9 | Wood Screw |
| S9-H25 | Inner Angle Bracket |
| S9-H25-bend | Inner Angle Bracket |
| S9-H14-0 | Wood Screw |
| S9-H14-1 | Wood Screw |
| D8 | Left Pivot Bracket |
| S10-H21-0 | Wood Screw |
| S10-H21-1 | Wood Screw |
| S10-H21-2 | Wood Screw |
| S10-H21-3 | Wood Screw |
| S10-H21-4 | Wood Screw |
| S10-H21-5 | Wood Screw |
| S10-H21-6 | Wood Screw |
| S10-H21-7 | Wood Screw |
| S10-H21-8 | Wood Screw |
| S10-H21-9 | Wood Screw |
| S10-H25 | Inner Angle Bracket |
| S10-H25-bend | Inner Angle Bracket |
| S10-H14-0 | Wood Screw |
| S10-H14-1 | Wood Screw |
| E5 | Cabinet Center Rail |
| S10-H24-0 | Wood Screw |
| S10-H24-1 | Wood Screw |
| S10-H24-2 | Wood Screw |
| S10-H24-3 | Wood Screw |
| S10-H24-4 | Wood Screw |
| S10-H24-5 | Wood Screw |
| S10-H24-6 | Wood Screw |
| S10-H24-7 | Wood Screw |
| S10-H24-8 | Wood Screw |
| C2-left | Bed Face Side Rail |
| C4-left | Bed Face Support Rail |
| C5 | Bed Face Center Rail |
| C4-right | Bed Face Support Rail |
| C2-right | Bed Face Side Rail |
| C1-start | Bed Face End Rail |
| C1-close | Bed Face End Rail |
| C3-0 | Bed Face Cross Rail |
| C6-0-first | Bed Face Panel |
| C6-0-second | Bed Face Panel |
| C3-1 | Bed Face Cross Rail |
| C6-1-first | Bed Face Panel |
| C6-1-second | Bed Face Panel |
| C3-2 | Bed Face Cross Rail |
| C6-2-first | Bed Face Panel |
| C6-2-second | Bed Face Panel |
| C3-3 | Bed Face Cross Rail |
| C6-3-first | Bed Face Panel |
| C6-3-second | Bed Face Panel |
| C7-0 | Underside Support |
| S13-H12-0-0 | Wood Screw |
| S13-H12-0-1 | Wood Screw |
| C7-1 | Underside Support |
| S13-H12-1-0 | Wood Screw |
| S13-H12-1-1 | Wood Screw |
| C7-2 | Underside Support |
| S13-H12-2-0 | Wood Screw |
| S13-H12-2-1 | Wood Screw |
| S14-C2-left-cam | Cam Lock |
| S14-C2-left-bolt | Long Bolt |
| S15-C2-left-cam | Cam Lock |
| S15-C2-left-bolt | Long Bolt |
| S11-C4-left-cam | Cam Lock |
| S11-C4-left-bolt | Long Bolt |
| S15-C4-left-cam | Cam Lock |
| S15-C4-left-bolt | Long Bolt |
| S12-C5-cam | Cam Lock |
| S12-C5-bolt | Long Bolt |
| S15-C5-cam | Cam Lock |
| S15-C5-bolt | Long Bolt |
| S12-C4-right-cam | Cam Lock |
| S12-C4-right-bolt | Long Bolt |
| S15-C4-right-cam | Cam Lock |
| S15-C4-right-bolt | Long Bolt |
| S14-C2-right-cam | Cam Lock |
| S14-C2-right-bolt | Long Bolt |
| S15-C2-right-cam | Cam Lock |
| S15-C2-right-bolt | Long Bolt |
| D2-0 | Mattress Support Slat |
| S20-H16-0-0 | Slat Screw |
| S20-H16-0-1 | Slat Screw |
| S20-H16-0-2 | Slat Screw |
| S20-H16-0-3 | Slat Screw |
| S20-H16-0-4 | Slat Screw |
| D2-1 | Mattress Support Slat |
| S20-H16-1-0 | Slat Screw |
| S20-H16-1-1 | Slat Screw |
| S20-H16-1-2 | Slat Screw |
| S20-H16-1-3 | Slat Screw |
| S20-H16-1-4 | Slat Screw |
| D2-2 | Mattress Support Slat |
| S20-H16-2-0 | Slat Screw |
| S20-H16-2-1 | Slat Screw |
| S20-H16-2-2 | Slat Screw |
| S20-H16-2-3 | Slat Screw |
| S20-H16-2-4 | Slat Screw |
| D2-3 | Mattress Support Slat |
| S20-H16-3-0 | Slat Screw |
| S20-H16-3-1 | Slat Screw |
| S20-H16-3-2 | Slat Screw |
| S20-H16-3-3 | Slat Screw |
| S20-H16-3-4 | Slat Screw |
| D2-4 | Mattress Support Slat |
| S20-H16-4-0 | Slat Screw |
| S20-H16-4-1 | Slat Screw |
| S20-H16-4-2 | Slat Screw |
| S20-H16-4-3 | Slat Screw |
| S20-H16-4-4 | Slat Screw |
| C8-left | Bed Frame Side Rail |
| C8-right | Bed Frame Side Rail |
| C9 | Bed Frame End Rail |
| D1 | Bed Frame End Rail |
| S16--1--1-dowel-0 | Wood Dowel |
| S16--1--1-dowel-1 | Wood Dowel |
| S16--1--1-cam | Cam Lock |
| S16--1--1-bolt | Bolt |
| S16--1-1-dowel-0 | Wood Dowel |
| S16--1-1-dowel-1 | Wood Dowel |
| S16--1-1-cam | Cam Lock |
| S16--1-1-bolt | Bolt |
| S16-1--1-dowel-0 | Wood Dowel |
| S16-1--1-dowel-1 | Wood Dowel |
| S16-1--1-cam | Cam Lock |
| S16-1--1-bolt | Bolt |
| S16-1-1-dowel-0 | Wood Dowel |
| S16-1-1-dowel-1 | Wood Dowel |
| S16-1-1-cam | Cam Lock |
| S16-1-1-bolt | Bolt |
| S17-side--1--55-dowel | Wood Dowel |
| S17-side--1--55-cam | Cam Lock |
| S17-side--1--55-bolt | Bolt |
| S17-side--1-55-dowel | Wood Dowel |
| S17-side--1-55-cam | Cam Lock |
| S17-side--1-55-bolt | Bolt |
| S17-side-1--55-dowel | Wood Dowel |
| S17-side-1--55-cam | Cam Lock |
| S17-side-1--55-bolt | Bolt |
| S17-side-1-55-dowel | Wood Dowel |
| S17-side-1-55-cam | Cam Lock |
| S17-side-1-55-bolt | Bolt |
| S17-end--1--80-dowel | Wood Dowel |
| S17-end--1--80-cam | Cam Lock |
| S17-end--1--80-bolt | Bolt |
| S17-end--1-80-dowel | Wood Dowel |
| S17-end--1-80-cam | Cam Lock |
| S17-end--1-80-bolt | Bolt |
| S17-end-1--80-dowel | Wood Dowel |
| S17-end-1--80-cam | Cam Lock |
| S17-end-1--80-bolt | Bolt |
| S17-end-1-80-dowel | Wood Dowel |
| S17-end-1-80-cam | Cam Lock |
| S17-end-1-80-bolt | Bolt |
| S18-H20-0 | Angle Bracket |
| S18-H20-0-H14-v0 | Wood Screw |
| S18-H20-0-H14-h0 | Wood Screw |
| S18-H20-0-H14-v1 | Wood Screw |
| S18-H20-0-H14-h1 | Wood Screw |
| S18-H20-1 | Angle Bracket |
| S18-H20-1-H14-v0 | Wood Screw |
| S18-H20-1-H14-h0 | Wood Screw |
| S18-H20-1-H14-v1 | Wood Screw |
| S18-H20-1-H14-h1 | Wood Screw |
| S18-H20-2 | Angle Bracket |
| S18-H20-2-H14-v0 | Wood Screw |
| S18-H20-2-H14-h0 | Wood Screw |
| S18-H20-2-H14-v1 | Wood Screw |
| S18-H20-2-H14-h1 | Wood Screw |
| S18-H20-3 | Angle Bracket |
| S18-H20-3-H14-v0 | Wood Screw |
| S18-H20-3-H14-h0 | Wood Screw |
| S18-H20-3-H14-v1 | Wood Screw |
| S18-H20-3-H14-h1 | Wood Screw |
| S18-H20-4 | Angle Bracket |
| S18-H20-4-H14-v0 | Wood Screw |
| S18-H20-4-H14-h0 | Wood Screw |
| S18-H20-4-H14-v1 | Wood Screw |
| S18-H20-4-H14-h1 | Wood Screw |
| S18-H20-5 | Angle Bracket |
| S18-H20-5-H14-v0 | Wood Screw |
| S18-H20-5-H14-h0 | Wood Screw |
| S18-H20-5-H14-v1 | Wood Screw |
| S18-H20-5-H14-h1 | Wood Screw |
| S19-H20-0 | Angle Bracket |
| S19-H20-0-H14-v0 | Wood Screw |
| S19-H20-0-H14-h0 | Wood Screw |
| S19-H20-0-H14-v1 | Wood Screw |
| S19-H20-0-H14-h1 | Wood Screw |
| S19-H20-1 | Angle Bracket |
| S19-H20-1-H14-v0 | Wood Screw |
| S19-H20-1-H14-h0 | Wood Screw |
| S19-H20-1-H14-v1 | Wood Screw |
| S19-H20-1-H14-h1 | Wood Screw |
| S19-H20-2 | Angle Bracket |
| S19-H20-2-H14-v0 | Wood Screw |
| S19-H20-2-H14-h0 | Wood Screw |
| S19-H20-2-H14-v1 | Wood Screw |
| S19-H20-2-H14-h1 | Wood Screw |
| S19-H20-3 | Angle Bracket |
| S19-H20-3-H14-v0 | Wood Screw |
| S19-H20-3-H14-h0 | Wood Screw |
| S19-H20-3-H14-v1 | Wood Screw |
| S19-H20-3-H14-h1 | Wood Screw |
| S19-H20-4 | Angle Bracket |
| S19-H20-4-H14-v0 | Wood Screw |
| S19-H20-4-H14-h0 | Wood Screw |
| S19-H20-4-H14-v1 | Wood Screw |
| S19-H20-4-H14-h1 | Wood Screw |
| S19-H20-5 | Angle Bracket |
| S19-H20-5-H14-v0 | Wood Screw |
| S19-H20-5-H14-h0 | Wood Screw |
| S19-H20-5-H14-v1 | Wood Screw |
| S19-H20-5-H14-h1 | Wood Screw |
| bed-motion-root | Bed Assembly |
| E1--1 | Bed Mechanism Plate |
| S21-H21-0 | Wood Screw |
| S21-H21-1 | Wood Screw |
| S21-H21-2 | Wood Screw |
| S21-H21-3 | Wood Screw |
| S21-H21-4 | Wood Screw |
| S21-H21-5 | Wood Screw |
| S21-H21-6 | Wood Screw |
| S21-H21-7 | Wood Screw |
| S23-H19 | Bearing |
| E2--1 | Gas Piston |
| E2--1-body | Gas Piston |
| E2--1-rod | Gas Piston |
| E2--1-neck | Gas Piston |
| E2--1-eyeA | Gas Piston |
| E2--1-eyeB | Gas Piston |
| S23-H17 | Nut |
| S25-H18--1 | Pivot Retainer Bolt |
| S26-H17 | Nut |
| E1-1 | Bed Mechanism Plate |
| S22-H21-0 | Wood Screw |
| S22-H21-1 | Wood Screw |
| S22-H21-2 | Wood Screw |
| S22-H21-3 | Wood Screw |
| S22-H21-4 | Wood Screw |
| S22-H21-5 | Wood Screw |
| S22-H21-6 | Wood Screw |
| S22-H21-7 | Wood Screw |
| S24-H19 | Bearing |
| E2-1 | Gas Piston |
| E2-1-body | Gas Piston |
| E2-1-rod | Gas Piston |
| E2-1-neck | Gas Piston |
| E2-1-eyeA | Gas Piston |
| E2-1-eyeB | Gas Piston |
| S24-H17 | Nut |
| S25-H18-1 | Pivot Retainer Bolt |
| S27-H17 | Nut |
| leg--1 | Folding Leg Assembly |
| D3--1 | Folding Leg |
| D7--1 | Leg Pivot Arm |
| S28--1-D7-H7-0 | Leg Dowel |
| S28--1-D7-H9-0 | Threaded Cap |
| S28--1-D7-H1-0 | Bolt |
| S28--1-D7-H7-1 | Leg Dowel |
| S28--1-D7-H9-1 | Threaded Cap |
| S28--1-D7-H1-1 | Bolt |
| D6--1 | Leg Foot |
| S28--1-D6-H7-0 | Leg Dowel |
| S28--1-D6-H9-0 | Threaded Cap |
| S28--1-D6-H1-0 | Bolt |
| S28--1-D6-H7-1 | Leg Dowel |
| S28--1-D6-H9-1 | Threaded Cap |
| S28--1-D6-H1-1 | Bolt |
| S29--1-H10 | Plastic Washer |
| S29--1-H9 | Threaded Cap |
| S29--1-H2 | Bolt |
| leg-1 | Folding Leg Assembly |
| D3-1 | Folding Leg |
| D7-1 | Leg Pivot Arm |
| S28-1-D7-H7-0 | Leg Dowel |
| S28-1-D7-H9-0 | Threaded Cap |
| S28-1-D7-H1-0 | Bolt |
| S28-1-D7-H7-1 | Leg Dowel |
| S28-1-D7-H9-1 | Threaded Cap |
| S28-1-D7-H1-1 | Bolt |
| D6-1 | Leg Foot |
| S28-1-D6-H7-0 | Leg Dowel |
| S28-1-D6-H9-0 | Threaded Cap |
| S28-1-D6-H1-0 | Bolt |
| S28-1-D6-H7-1 | Leg Dowel |
| S28-1-D6-H9-1 | Threaded Cap |
| S28-1-D6-H1-1 | Bolt |
| S29-1-H10 | Plastic Washer |
| S29-1-H9 | Threaded Cap |
| S29-1-H2 | Bolt |
| S30-H15-0 | Wall Bracket |
| S30-H15-0-H14-0 | Wood Screw |
| S30-H15-0-H14-1 | Wood Screw |
| S30-H15-0-H23 | Wall Screw |
| S30-H15-1 | Wall Bracket |
| S30-H15-1-H14-0 | Wood Screw |
| S30-H15-1-H14-1 | Wood Screw |
| S30-H15-1-H23 | Wall Screw |
| S31-H15-0 | Wall Bracket |
| S31-H15-0-H14-0 | Wood Screw |
| S31-H15-0-H14-1 | Wood Screw |
| S31-H15-0-H23 | Wall Screw |
| S31-H15-1 | Wall Bracket |
| S31-H15-1-H14-0 | Wood Screw |
| S31-H15-1-H14-1 | Wood Screw |
| S31-H15-1-H23 | Wall Screw |
| installation-wall | Room Wall |
