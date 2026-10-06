# WF311613 — Whole-product visual cleanup audit

Final whole-product director gate; the approved 07:47 correction remains unchanged. No full master has been rendered.

WHOLE-PRODUCT VISUAL CLEANUP AUDIT: PASS — no remaining unjustified visible holes, duplicate hardware, stray geometry or unexplained fit defects found in the inspected states.

Two independent reviews were performed: (1) actual generated scene geometry, visible part inventory, duplicate meshes, hole/hardware axes, fit and handed symmetry; (2) native rendered images reviewed across the full assembly, individual joint close-ups and final closed/open states. A passing data validator was not treated as visual approval.

## Coverage and evidence

121 native1280×720 still captures cover every Step1–31 endpoint, closed509.5s, open516.8s, and finished bedroom523.9s. Cameras include front, front-left/right, both sides, upper/lower, accessible cabinet interior and under-bed views. Early flat assemblies expose receiving faces before later parts hide them. Production camera presets and timeline remain unchanged.

17 occluded exploratory views were preserved but excluded from feature approval. Bearing installation views, interior pivot/piston views and underside close-ups replace them. The rear wall prevents some external rear angles; accessible interior and earlier assembly faces were inspected instead. Camera/time/part IDs are retained in [capture-manifest.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/capture-manifest.json) and [visual-review-coverage.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/visual-review-coverage.json). All121 PNGs have native dimensions, pageErrors0; renderer readiness budget remains90000ms.

Required contact sheets:

- A — [A-hole-hardware-inspection.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/A-hole-hardware-inspection.png); detailed [A1-cabinet-holes-closeups.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/A1-cabinet-holes-closeups.png), [A2-mechanism-closeups.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/A2-mechanism-closeups.png) and [A3-leg-wall-closeups.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/A3-leg-wall-closeups.png).
- B — [B-panel-fit-inspection.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/B-panel-fit-inspection.png); underside [B2-underside-closeups.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/B2-underside-closeups.png).
- C — [C-open-state-multi-angle.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/C-open-state-multi-angle.png); mattress/bedding [C2-finished-open-state.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/C2-finished-open-state.png).
- D — [D-closed-state-multi-angle.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/D-closed-state-multi-angle.png).
- E — [E-assembly-state-inspection.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/E-assembly-state-inspection.png).

## Classification

Counts use43 explicit suspicious feature families, not a claim of43 physical holes. Every family has a retained/removed decision, part IDs, original PDF steps, connection definitions, actual installation actions and a representative native image in [visual-feature-ledger.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/visual-feature-ledger.json). The independent hole enumeration remains1043 variant records /747 deduplicated feature records.

| Classification | Count |
|---|---:|
| REQUIRED | 35 |
| JUSTIFIED_UNUSED | 0 |
| TEMPORARY_ASSEMBLY_ACCESS | 4 |
| PRESENTATION_ONLY | 4 |
| UNNECESSARY | 0 |
| INCORRECT | 0 |
| DUPLICATE | 0 |
| ARTIFACT | 0 |

No product geometry, holes, hardware, panels or support pieces were removed or repositioned in this gate. The approved corrections already eliminate the accidental opposite cam/dowel mouths. Required empty receiving/access features remain while their later operation is pending. No further proven unnecessary component was found.

Notable retained details:

- Visible cam driver wells, bolt hex sockets and screw receiving axes are actual hardware/tool interfaces.
- B7 tongues/B8 eased panel-edge seams and C1–C6 bed-grid channels capture real members; seams are furniture joints.
- E1 plate/spindle/stud are one integral mechanism. E2 housing/rod/neck/eyes form one piston per side, not duplicated hardware.
- D3/D6/D7 stepped half-laps and rounded feet are required by PDF Step28. The light wooden circles beside leg bolts are occupied #7 Ø8×20mm dowel ends, not unoccupied holes. Hardware list page7 and Step28/29 page27 were visually rechecked ([PDF-page-07-hardware.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/PDF-page-07-hardware.png), [PDF-page-27-legs.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/PDF-page-27-legs.png)). Actual eight dowels and all bolts/nuts remain.
- The outer #2 leg-pivot head recess and white #10 washer are required; the earlier inner-half duplicated counterbore remains absent.
- Detached leg subassemblies in Step28 are intentional staging before Step29 attachment, not stray helpers.
- Four wall brackets and their #14/#23 screws are real anchored connections; repeated left/right brackets match the PDF quantity rather than being duplicates.
- Bedroom wall/floor, table, plant, curtains, mattress and bedding are presentation context. The shallow rug/floor surfaces show raster depth aliasing from extreme temporary upper QA angles; this is recorded separately from product manufacturing geometry. Approved bedroom/cameras were preserved.

The dark patch on the upper B8 face was checked independently in the actual native renderer. It persisted when receiving shadows, environment lighting, bump relief and the candidate face-UV projection were disabled/changed in a disposable QA page. Removing textures removed the patch. Pixel raycasts at four points hit only the flat B8-6--1 face, with constant front normals and affine UV coordinates (u=x/90, v=y/24); no nearer product mesh or cutout is present. This supports color variation in the approved wood grain, classified PRESENTATION_ONLY, rather than an unsupported manufacturing feature. No shader/UV change was committed. Evidence: [native-diagnostic-original.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/native-diagnostic-original.png), [native-diagnostic-no-bump.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/native-diagnostic-no-bump.png), [native-diagnostic-no-textures.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/native-diagnostic-no-textures.png) and [native-diagnostic-rays.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/native-diagnostic-rays.json). Experimental lighting/UV images are diagnostic controls, not production after-images.

## Whole-product fit and symmetry

The visual sweep covered cabinet panels/rails/caps, B8/B7, cross members, face grid, carrier perimeter, underside ties, bearings/pivot, piston mounts, folding legs and wall anchors. No filler was added. Structural-path and actual-mesh contact validators independently verify required mates and permitted construction clearances.

9033 visible mesh comparisons across33 mechanical states (452 meshes at the final open state) found zero coincident duplicate-mesh candidates. Repeated traversal of the same scene object is not counted as a duplicate. No named debug/helper/obsolete construction part was visible. [independent-data-audit.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/independent-data-audit.json) and [data-inventory.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/data-inventory.json) contain all inspected part bounds, transforms and geometry definitions.

Twelve handed pairs were compared: A1/A4, A3/A2, A5/A6, A7/A7-R, A8/A8-R, A9/A9-R, D8/D9, E1 sides, E2 sides, legs and upper/lower wall brackets. Centers/extents and hole counts match under reflection. Worst mirrored hole-axis displacement is8.2×10⁻¹⁴cm (floating-point only). Intentional half-lap handedness retained.

## Regression results

- Hole audit: PASS; UNJUSTIFIED0. [hole-audit.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/hole-audit.json).
- Fit audit: PASS; approved467s correction, final mating contacts, closed/open and wall support preserved. [fit-audit.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/fit-audit.json).
- Assembly: PASS;31steps/433operations. Hardware counts: PASS.
- Structural paths, actual collision sweeps, expected contacts, tool/future access, mechanism/pivot/bearing, piston, folding legs, wall anchor engagement, grounded support, seek/reset and B8: PASS. [mechanical-gates.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/mechanical-gates.json).
- Presentation/mattress/bedding fit: PASS. [polish02b-presentation/presentation-fit.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/polish02b-presentation/presentation-fit.json).
- Complete tests:196passed,0failed across40files. [full-tests.log](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/full-tests.log) and [full-tests.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/full-tests.json).
- Typecheck: PASS. [typecheck.log](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/typecheck.log).
- Lint: PASS (existing generated-output exclusion). [lint.log](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/lint.log).
- Production webpack build: PASS. [build.log](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/build.log).
- Web regression: PASS; default WF311613 micro-pass, production debug panels hidden, duration08:44, both legacy options and720p/1080p/1440p/2160p available; no page errors. [web-regression.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/web-regression.json); [WEB-REGRESSION.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/WEB-REGRESSION.png); [WEB-PROFILES-REGRESSION.png](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/WEB-PROFILES-REGRESSION.png).

No validator tolerance was changed. No renderer readiness or unrelated test timeout was altered. The product SHA256 remains `29ef4258730c3e3691c84223d98e240d9a25854d079402377f97489ace5f9fb5`. All22 source files from the approved correction pass match their frozen SHA256 values; [approved-source-freeze.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/approved-source-freeze.json). There are zero new application-source edits in this gate; new files are audit scripts/evidence under this output directory.

## Feature decisions

| ID | Feature | Classification | Retained reason / evidence |
|---|---|---|---|
| V01 | Cabinet left cam wells | REQUIRED | Occupied #8 cam driver mouths; corrected blind opposite face retained. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-left-early-panel-top.png) |
| V02 | Cabinet right cam wells | REQUIRED | Mirrored installed #8 cams; handed drill face. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-right-early-panel-top.png) |
| V03 | Cabinet upright receiver bores | REQUIRED | PDF #5/#6 joints and blind dowel receiver axes. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-A1-early-cams.png) |
| V04 | Unoccupied later cabinet receiver mouths | TEMPORARY_ASSEMBLY_ACCESS | Later join/cap/rail hardware uses these receiving axes; early emptiness is expected. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/step-03.png) |
| V05 | Cabinet infill grooves and seams | REQUIRED | Captured thin lower panel seats between rails; no filler or accidental gap. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-side-left-inner.png) |
| V06 | B7 integral tongue details | REQUIRED | PDF spanning cabinet back rail/panel construction; integral end tongue/recess. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-B8-4-left.png) |
| V07 | B8 left eased panel-edge seams | REQUIRED | Plain eased-edge B8 panels meet B7 and rails at the reconstructed contact planes; these are shallow seams, not routed receivers. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-B8-5-left.png) |
| V08 | B8 right eased panel-edge seams | REQUIRED | Mirrored plain B8 panels with equal dimensions and eased edges, seated against B7 and rails. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-B8-5-right.png) |
| V09 | Back-face panel seams | REQUIRED | Separate PDF members meeting along intended seams, not duplicate panels. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/detail-B8-B7-front.png) |
| V10 | Left top-cap joint | REQUIRED | Cap reaches corrected A5 upper edge; retained cams/bolts. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-wall-left-0.png) |
| V11 | Right top-cap joint | REQUIRED | Mirrored cap seats on A6; approved 07:47 correction intact. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-wall-right-0.png) |
| V12 | Spanning rail fasteners | REQUIRED | Cam/dowel joints support cabinet cross members; no redundant mouths. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/step-08.png) |
| V13 | Lower cabinet open channel | REQUIRED | Integral tongue/connection receiver, not a decorative slot. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/step-06.png) |
| V14 | Center supporting bracket | REQUIRED | PDF central bracket and actual receiving/installation operations. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/step-10.png) |
| V15 | Bed-face perimeter routed channels | REQUIRED | Profile rebates capture C6 infills; not helper or extra perimeter panels. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-grid-top.png) |
| V16 | Bed-face grid seams | REQUIRED | Distinct grid beams and legitimate panel seams. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-grid-top.png) |
| V17 | Eight C6 infill faces | REQUIRED | PDF infills captive in grid; eight panels are distinct, not overlays. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-grid-top.png) |
| V18 | Centerline cam/bolt mouths | REQUIRED | Actual hardware heads/drivers; alignment follows grid operations. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-grid-top.png) |
| V19 | Underside tie screw access | TEMPORARY_ASSEMBLY_ACCESS | #16 screw drivers remain accessible during underside tie installation. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-ties-top.png) |
| V20 | Carrier perimeter | REQUIRED | Real frame receiving bed face and underside members. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-carrier-top.png) |
| V21 | Later pivot/leg receiving mouths | TEMPORARY_ASSEMBLY_ACCESS | Early empty pilot/receiving holes are consumed by pivot, piston and leg connections. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-carrier-top.png) |
| V22 | Under-bed support members | REQUIRED | PDF ties; no construction/debug support meshes. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-underside-front.png) |
| V23 | Left bed-to-carrier angle hardware | REQUIRED | PDF #20/#21/#22 angle brackets with real screw receiving axes. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-bearing-left.png) |
| V24 | Right bed-to-carrier angle hardware | REQUIRED | Mirrored required bracket count, not duplicated geometry. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-bearing-right.png) |
| V25 | Left bearing/receiver | REQUIRED | #19 bearing receiving E1 spindle; actual mechanical capture and sweep. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-pivot-interior-left.png) |
| V26 | Right bearing/receiver | REQUIRED | Required mirrored #19 bearing and cabinet receiver. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-pivot-interior-right.png) |
| V27 | Left E1 integral spindle/stud | REQUIRED | One integral plate/spindle/stud; apparent compound pieces are not duplicate hardware. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-mechanism-interior-left.png) |
| V28 | Right E1 integral spindle/stud | REQUIRED | Handed mechanism plate with integral shaft and piston mount. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-mechanism-interior-right.png) |
| V29 | Left piston compound elements | REQUIRED | One physical E2 comprises housing, telescoping rod, neck and two eyes. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-piston-interior-left.png) |
| V30 | Right piston compound elements | REQUIRED | Mirrored telescopic linkage; child meshes must not be counted as duplicate pistons. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-piston-interior-right.png) |
| V31 | D3/D6/D7 half-laps | REQUIRED | Handed stepped upright/rounded arms and necessary foot-corner relief. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-leg29-left.png) |
| V32 | Left visible wooden dowel ends | REQUIRED | These light circles are installed #7 Ø8×20mm dowel end surfaces, not unoccupied bores; PDF requires four left dowels. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-leg29-left.png) |
| V33 | Right visible wooden dowel ends | REQUIRED | Four required installed #7 dowels; same exposure and axes on mirrored joint. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-leg29-right.png) |
| V34 | Leg socket bolts/canopy nuts | REQUIRED | PDF eight #1 bolts/eight #9 canopy nuts; opposite hardware faces are legitimate bolt/nut fastening. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-leg-open-left.png) |
| V35 | Leg pivot counterbore/washer | REQUIRED | Single outer #2 head recess and white #10 washer; existing inner-half duplicate counterbore remains absent. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-leg-open-right.png) |
| V36 | Detached legs in assembly work area | REQUIRED | Staged subassemblies are intentionally separate before Step29 attachment, not stray meshes. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/step-28.png) |
| V37 | Left wall anchors/pilots | REQUIRED | Two #15 brackets, #14 timber and #23 wall screws; actual posts and receiving pilots. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-wall-left-0.png) |
| V38 | Right wall anchors/pilots | REQUIRED | Mirrored anchors, correctly seated timber/wall faces. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-wall-right-0.png) |
| V39 | Context wall/floor | PRESENTATION_ONLY | Installation context defines wall/floor support; no extra product module. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/open-front.png) |
| V40 | Bedroom props and rug | PRESENTATION_ONLY | Approved room/window/plant/table/rug presentation; not PDF product hardware. Extreme upper QA camera shows floor/rug depth aliasing, not a manufacturing feature. Production camera remains frozen. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/finished-open-front.png) |
| V41 | Mattress/bedding | PRESENTATION_ONLY | Approved late presentation props, excluded from physical product inventory; fit gate retained. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/finished-open-front-left.png) |
| V42 | Driver sockets/slots | TEMPORARY_ASSEMBLY_ACCESS | Cam and socket-head hardware driver cavities are intentional tool access, not extra timber holes. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-bearing-left.png) |
| V43 | B8 dark wood-grain patch | PRESENTATION_ONLY | Native pixel-to-mesh tracing hits the flat B8 face only; constant normals and affine UVs show no cutout, stray mesh or UV discontinuity. Mark persists without shadows/bump/environment and disappears without textures: wood-grain color variation retained. · [View](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/stills/joint-B8-6-right.png) |

Stopped before the full8:44 master, audio, full1080p/1440p/2160p, Option2 or unrelated redesign. This audit is returned for director review; full rendering requires subsequent director approval.
