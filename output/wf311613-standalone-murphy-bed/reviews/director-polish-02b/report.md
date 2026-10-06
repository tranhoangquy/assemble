# Director Polish 02B — presentation-only QA

Candidate: wf311613-director-polish-02b. Five fresh deterministic 1280 × 720 stills, plus ONE three-pair comparison sheet. No full MP4, no music, no claimed director/production approval.

## Presentation changes ONLY

- Finished room: bedside table enlarged from 40 × 48 × 38 to 49 × 54 × 42 cm, restrained drawer fronts and pulls, ceramic-base linen-shade lamp, one neutral book; one plant; one minimal framed abstract landscape; dimensional window frame/sill and fixed pleated linen curtains; subtle baseboard detail outside the cabinet span.
- Area rug expanded from 340 × 330 to 395 × 320 cm, repositioned to [0, -107] in X/Z. Low-contrast woven surface and border. Floor-height presentation plane does not lift the product or become structural support.
- Mattress: identical center [0, 41.8, -89.2], size 217 × 19 × 182 cm, rounded radius 1.6. **PRESENTATION ESTIMATE, not manufacturer/commercial specification.** Warm off-white textile, subtle quilting/stitches, actual rounded perimeter piping instead of opaque seam slabs. Cosmetic top stitches extend only about 0.03 cm above the top; horizontal footprint stays inside the approved envelope.
- Bedding: fitted cover, a fixed parametric softly filled neutral duvet with sloped perimeter/low folds, turned-back edge, two rounded pillows. No simulation, randomness, brands or rail-obscuring skirt. Bed frame and both folding legs remain visible.
- Only showcase cameras change: closer 3/4 open hero, separate closed-bedroom framing, dedicated mattress medium shot. No depth of field. Same room remains continuous through closed/open/mattress/bedding cuts.
- Very small warm ambient/directional fill is parented to finished-room visibility. Existing assembly lighting, exposure 0.97, fog and product materials stay unchanged. No colored/cinematic lighting or downloaded assets.

All these objects remain generic **presentation-only** children outside ProductRenderer/ObjectRegistry, PDF parts, AssemblyGraph and hardware. They are invisible before 498.253694 s. Mattress/bedding retain the approved later editorial onset. No additional assembly step.

## Explicit lock confirmations

- Assembly timeline remains **498.253694 seconds** (floating source 498.25369388888834).
- Steps 1–31 are byte-equivalent: approved DirectorPlan and AssemblyDefinition reused directly; first 31 VideoScenes retain byte-identical data.
- All **92** approved source files in product/assembly/director/presentation metadata/validation/engine and assembly room/viewer/light code retain exact SHA-256. No changed path, coordinate, geometry, mechanism, hardware, helper semantic or validator threshold.
- Product geometry hash **4645bcf33682cbf377d84a2d0f8139674b6d80f5a5014a29505bf97287f82a45** and material hash **d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc** PASS.
- No assembly camera changed: every pre-existing preset retained; new cameras referenced ONLY after Step 31.
- No assembly caption changed: same approved caption array/reference.
- No mechanical path changed: same action objects even for post-assembly showcase; Step 25 untouched.
- No validator/tolerance changed: exact file hashes PASS; existing full Polish 02 gate suite rerun unchanged.
- Assembly environment/exposure unchanged; finished-only lighting/props deterministically disappear on backward seek.
- Showcase remains **20.8 s**; total remains **519.053694 s (~8:39.054)**. No retiming.

[Exact locks and candidate SHA](lock-verification.json), [92-file SHA manifest](approved-source-locks.json).

## QA and verification

Existing mechanical/grounded-floor/front-path/B8/pivot/bearing/piston/leg/receiver/seek gates: **PASS**, complete=true. [Fresh unchanged gate suite](mechanical-validation.json), [execution log](gates.log). Its candidate ID remains Polish 02 intentionally: 02B reuses the exact same plan and assembly, rather than renaming or duplicating validated mechanics.

Additional actual-mesh presentation-fit check: **PASS**. Mattress, fitted cover and new duvet bounds do not intersect rails/ends/folding-leg parts. Piping's horizontal extension is at most 0.044 cm, inside the existing +0.06 cm allowance. Table, plant, curtains and art lie outside the product span. [Presentation fit and measured bounds](presentation-fit.json). No engineering gate was changed to accommodate these props.

Typecheck/lint: PASS. Tests: 146/146 PASS. Production build: PASS. [Tests](tests.log), [build](build.log).

Browser render errors: none. Reverse-seek PNG/camera checks: PASS (5 checkpoints). [Render manifest](stills/render-manifest.json), [determinism](presentation-seek-verification.json). All five QA views use actual post-assembly camera presets, no inspection-camera substitution. Visual QA checks mattress/body clearance, visible rails/legs, duvet folds, room continuity and furnishing silhouette.

Tooling: checkpoint/seek scripts use the full Chromium executable already used by the video renderer; production mode avoids the dev initialization stall. No timeline/camera/geometry logic changed. PNG comparisons remain exact SHA comparisons. The presentation-only seek check explicitly permits camera floating-point roundoff up to 1e-10 scene units (an initial mattress check produced identical PNGs but ~3e-14 camera roundoff); raw values and maximum deltas remain in the report. Default strict camera comparison and ALL existing mechanical validator tolerances remain unchanged.

## Files / stop boundary

[Five-still gallery](index.html), [contact sheet](contact-sheet.png), [Polish 02 vs 02B comparison sheet](comparison-sheet.png).

No optional second hero angle added: the five requested primary views cover the micro-pass without adding another showcase cut. No approved licensed music exists; no music downloaded or muxed. Audio pipeline remains ready and silent. **STOP after QA; awaiting director review before any full MP4.**
