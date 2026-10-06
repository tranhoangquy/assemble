# Polish 02B — silent 720p visual master

Candidate: `wf311613-director-polish-02b`. Render/export completed; stopped for director review. No additional creative pass or source changes were made.

## Delivered file

`/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/wf311613-polish-02b-visual-master-720p.mp4`

- Actual encoded runtime: **519.066667 s / 08:39.067**.
- Approved deterministic timeline: 498.253693888889 s assembly + 20.8 s showcase = 519.053693888889 s. Difference: 0.012973111111 s, normal final-frame rounding at 30 fps.
- 1280 × 720, constant 30 fps, H.264 / `yuv420p`.
- 15,572 encoded frames; 15,572 contiguous, nonempty freshly rendered source PNGs.
- Exact size: **29,730,233 bytes** (29.730 MB; approximately 28.35 MiB).
- Audio streams: **0**. No music/SFX/audio was downloaded or added.
- SHA-256: `76804a7076908bac33220f785d87940bc6128fb764e8105892284804431724a2`.

## Final pre-render verification

All existing approved gates passed, without changing code, thresholds, timing or cameras:

- Product/material SHA locks and assembly lock: PASS.
- Mechanical gates, hardware fits and pivot/bearing/piston checks: PASS.
- B8: PASS.
- Folding-leg articulation and Step 28 access: PASS.
- Collision/installation paths, grounded-floor and front-staging checks: PASS.
- Whole-scene deterministic seek/reset: PASS; presentation seek/reset: PASS at all five registered checkpoints, with exact repeat PNGs and the existing approved camera comparison tolerance.
- Presentation fit and captions: PASS.
- Typecheck: PASS; lint: PASS; tests: **146 passed / 29 files**; production build: PASS.

The 15-gate mechanical report intentionally uses the existing Polish 02 runner: Polish 02B directly reuses its approved assembly/DirectorPlan. Polish 02B identity, presentation source locks, camera identity and props/seek checks were separately verified.

## Freeze and provenance

- All **198 frozen source/script files** remain byte-identical after export; all **92 approved source locks** passed before export.
- Approved product hash: `4645bcf33682cbf377d84a2d0f8139674b6d80f5a5014a29505bf97287f82a45`.
- Approved material hash: `d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc`.
- Approved plan hash: `bf43ecdb93c8a43dd50ea4a9e46306882902cbaf813e24438826f8585045e520`.
- Approved Polish 02B video-definition hash: `f222e140bea7131b36003150b450372689458972b69d4705d3caee7345b76882`.
- Camera-preset hash: `73aaf84e0911de64cf319ab942e462d2b37f6d87897613102d0b62a45696d8b2`.
- Existing deterministic renderer `scripts/render-video.ts` used unchanged, from time zero with resume frame zero, no frame limit and no time multiplier.
- Fresh frame directory: `/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/frames/wf311613-polish-02b-visual-master-new-d0SrbS`.
- No historical MP4 concatenation or old frame-sequence input. Encoding input was only this newly generated PNG sequence.

## Post-render verification

- `ffprobe` properties/frame count: PASS; full decoded frame count: 15,572.
- Complete decode with error-stop enabled: PASS.
- Frame sequence: contiguous 000000–015571, no missing/empty source frame.
- No unexpected black intervals detected in the complete decoded video (blackdetect duration 0.033 s, pixel threshold 0.05, picture threshold 0.98).
- Render process exited 0, no JavaScript page errors.
- 18 spot frames decoded **directly from the completed MP4**, covering early assembly, hardware, cabinet, bed face, carrier, Step 25 context/approach/seating/pullback, piston mechanism, folding legs, anchoring, assembly complete, finished closed/opening, mattress, bedding and final hero.
- Decoded contact sheet and key full-resolution frames inspected. No corrective camera/material/geometry edits were performed.

## Warnings / retained visual observation

- Existing Three.js CJS import and `THREE.Clock` deprecation notices; nonfatal, left unchanged.
- Existing Turbopack broad file-pattern build warning (57,134 matched files); production build passed, left unchanged.
- One HTTP 404 console message at renderer startup. A subsequent read-only resource audit reported no failing HTTP responses or JavaScript page errors; the message did not recur in that audit. No candidate repair was attempted.
- At **390.166667 s / frame 11705**, the approved `S26-eye-align` / `S26-cabinet-eye` view is occluded by the bed-face panel, so the piston connection is not visible in this sampled view. Confirmed in both the fresh source PNG and decoded MP4, not an encoding artifact (sample SSIM 0.987505). This existing presentation limitation is retained under the explicit freeze instruction. Mechanical gates remain PASS; this report does **not** assert new director approval or that every connection is visually unobstructed.

## Preserved history / evidence

- Approved Polish 02B QA remains in `output/wf311613-standalone-murphy-bed/reviews/director-polish-02b/`.
- A pre-rerun archive of its report, stills, comparison sheet, lock manifests and logs is retained under this folder's `approved-qa/`.
- Pre-rerun Polish 02 mechanical report retained as `approved-polish02-gates.json`.
- Fresh gate results, build/test logs, source freeze manifest, render provenance/log/exit, ffprobe report, complete-decode log, resource audit and 18 decoded verification frames are retained alongside this report.

No 2K/4K, Option 2, audio stage or further polish was started. **STOPPED for director review.**
