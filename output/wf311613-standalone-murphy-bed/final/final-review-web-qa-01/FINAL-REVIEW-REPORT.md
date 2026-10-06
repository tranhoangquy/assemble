# WF311613 — Final review render and actual-web/native-resolution QA

Review delivery complete. **Not director approval.**

Full master: 524.066667 s (8:44.067), 1280×720 / 30 fps CFR, H.264/yuv420p, silent.

Important retained exceptions: historical native micro aggregate FAIL due two newly authorized generic byte deltas; original strict camera JSON replay FAIL due five 1 ULP scalar representations; two default Turbopack build attempts exited 137 before successful webpack build. The raw scripted web aggregate remains FAIL (34/35), while a separate strict SHA-bound network review is PASS for the one proven completed-download navigation abort. Raw results are not concealed, waived or renamed PASS. Independent 15 mechanical gates, protected data/source identity, actual raster/native/UI functionality and encode evidence pass.

## 1. Full 720p review master

/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/wf311613-final-micro-pass-review-720p.mp4

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/technical-verification.json

## 2. Actual runtime

Expected 524.053693889 s; encoded 524.066667 s; final-frame rounding +0.012973111 s. Intro 5 s, unchanged assembly 498.253694 s and showcase 20.8 s.


## 3. Frame count

15,722 encoded frames; 15,722 fresh contiguous source frames.


## 4. Exact file size

30,236,460 bytes.


## 5. SHA-256

`6eccea437aa9829dfd78cbf13755c5b4433fd9afb859ad3e2d5129153866be14`


## 6. ffprobe/decode/black-frame verification

PASS: 1280×720, 30 fps CFR, H.264/yuv420p, complete decode, 0 unexpected black intervals, 0 missing/empty frames, 0 audio streams. Fresh time-zero render, no historical MP4/frame reuse.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/ffprobe.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/complete-decode-blackdetect.log
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/frame-cadence-verification.json

## 7. Decoded-MP4 contact sheet

/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/decoded-contact-sheet.png

30 representative frames decoded directly from completed MP4. Manual QA artifact: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/VISUAL-QA.json. Intro→Step 1 reset clean; approved Step 26 position [-114.3,116,17], target [-115.3,111,7], FOV 62 unchanged. This is review delivery, not director approval.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/decoded-spot-checks.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/DECODED-VISUAL-OBSERVATIONS.md
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/VISUAL-QA.json

## 8. Actual production web audit

Actual headed production functionality PASS: product selector/viewer, preview play/pause, seek/reset, product-switch isolation, six quality choices, real selected 720p export/status/completion/download. No API/progress/output mocks. Before zero-frame renderer timeout P0 was retained; only the after job's actual completion/download/decode proves the scoped generic lifecycle correction. Downloaded web proof: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/wf311613-final-micro-pass-review-720p.mp4.

Raw scripted web aggregate: **FAIL, 34/35**. All 34 functional/page checks passed, including actual generation, completion, native metadata, download, SHA and full decode. The sole failed network check records the exact completed-job GET/document download navigation `net::ERR_ABORTED`, alongside HTTP 200 for that URL and a successful saved MP4. Separate strict reviewed network result: **PASS**; supplement /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/download-network-supplement.json binds raw SHA `1176f51c01e18e2132da7b1f55f46ac6b368cee966b5d7b2e1c268744500bdc0` and retains the abort. The actual saved 168,063-byte MP4 was independently SHA-checked as `66456007bd649dd9dbfc93502a1ce7cc918b08f03e3a2ea88c8eba284e94b4da`; the supplement's re-probe and complete decode confirm 2 seconds / 60 frames / native 720p / 30 fps / silent. The existing classifier was rerun only after that exact verified navigation was explained; no other failed requests are allowed. The proven optional favicon 404 is classified from actual HTTP evidence. Raw JSON, failed check and original console classification remain unchanged—not renamed PASS or waived globally.

The first headed actual export also failed at the former 60 s renderer-ready wait with zero frames; that failure is retained. An isolated unchanged 60 s diagnostic also failed, then first observed actual readiness at 71.005 s after wait start; the 90/120 s observations were ready. Production readiness now uses the already-existing CLI budget of 90 s; navigation remains 60 s. Only this operational budget and its one regression test changed. Assembly timing, geometry, cameras, validators and test-timeout settings were untouched. The former 60 s failures are not retroactively PASS.

Interactive headless UI automation retained two timeout failures (the first after-workflow profile check, and a focused diagnostic). Those raw results remain FAIL, not waived. Actual headed Chromium profile selection succeeded with matching summaries in 41–80 ms and no page exceptions. The completed headed workflow retains the same 1600×1000 viewport, assertions and interactive-test timeouts, with no UI-source changes. The separate production renderer readiness budget was aligned to the existing CLI 90 s budget after measured cold-start evidence. Deterministic headless rendering/native QA succeeds independently; that does not make the interactive headless failures PASS. The underlying interactive timeout cause is not conclusively diagnosed.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/web-qa-report.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/web-qa-reviewed.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/download-network-supplement.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/before/web-qa-error.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after/web-qa-error.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-01/web-qa-error.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/render-readiness-2026-10-04T00-53-40-961Z-1b9772c2/render-readiness-diagnostic.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/profile-selection-diagnostic-01/diagnostic.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/profile-selection-diagnostic-headed-01/diagnostic.json

## 9. P0/P1/P2 web findings

P0 fixed and proven: actual export timeout (Actual export ended error: The render route timed out before WebGL became ready.).

Remaining unrelated findings:

- P2: Diagnostic-only UI is exposed in the production viewer. (remaining reported finding; no unrelated source fix implied)
- P2: Production UI contains development/QA-only labeling. (remaining reported finding; no unrelated source fix implied)
- P1: Default product selection is not the currently approved candidate; explicit selector/URL is needed. (remaining reported finding; no unrelated source fix implied)
- P2: Observed optional favicon.ico GET404 only. (remaining reported finding; no unrelated source fix implied)
- P2: Scene-duration labels expose long floating-point decimals instead of human-readable precision. (Reported; no unrelated source correction)

Separately explained raw network finding:

- P1: Unexplained production HTTP/resource/console failures require review. (explained separately by strict network-review supplement; raw finding remains unchanged)

Scripted and manual findings are distinguished in the JSON report; raw web QA evidence is unchanged. The raw network P1 is explained separately by the strict SHA-bound download review, not erased or mislabeled as a remaining unexplained failure. Unrelated findings are reported, not silently repaired.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/web-qa-report.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/web-qa-reviewed.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/download-network-supplement.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/VISUAL-QA.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/AFTER-WEB-VISUAL-OBSERVATIONS.md

## 10. All quality options before changes

| ID | Label | Dimensions | FPS |
|---|---|---|---|
| 1280x720 | 720p | 1280×720 | 30/60 |
| 1920x1080 | 1080p | 1920×1080 | 30/60 |

Default: 1920x1080 / 30 FPS. No saved settings or persistent render jobs found; settings are component state, jobs in-memory.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/quality-options-before.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/quality-options-before.md

## 11. All quality options after changes

| ID | Label | Dimensions | Default FPS | Available FPS | Kind |
|---|---|---|---|---|---|
| 1280x720 | 720p | 1280×720 | 30 | 30/60 | legacy |
| 1920x1080 | 1080p | 1920×1080 | 30 | 30/60 | legacy |
| 720p | 720p — 1280×720 | 1280×720 | 30 | 30/60 | standard |
| 1080p | 1080p — 1920×1080 | 1920×1080 | 30 | 30/60 | standard |
| 1440p | 2K / 1440p — 2560×1440 | 2560×1440 | 30 | 30/60 | standard |
| 2160p | 4K / 2160p — 3840×2160 | 3840×2160 | 30 | 30/60 | standard |

Evidence:

- src/engine/export/RenderProfiles.ts

## 12. Legacy options/IDs/default preserved

Both old IDs/labels/dimensions remain exact; default 1920x1080 / 30 remains unchanged. 30 / 60 FPS remains available. Legacy dimension-only requests resolve explicitly to legacy IDs. No silent resolution fallback or stored-ID reinterpretation.


## 13. Generic render-profile architecture

Shared authoritative profiles drive UI→server validation→job snapshot→render query/viewport→native capture→FFmpeg→filename/completed metadata. Identity binds product/project, video SHA, profile ID, dimensions, FPS, start timestamp. Profile/job-isolated frames and outputs; unsafe/cross-profile/historical resume rejected. Streamed download; incremental PNG writes; truthful frame progress and indeterminate encoding. Standard native frames are never upscaled. Render-only caption proportional scaling leaves 720p unchanged. Public profiles allow 30 / 60; historical custom CLI dimensions/FPS remain explicit and isolated.


## 14. Files changed

23 authorized generic paths (11 changed, 12 added). Zero protected product changes, zero unexpected changes, zero historical output changes. Final completion evidence: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/source-boundaries-delivery.json. Prior source audits are preserved.

- changed: scripts/render-checkpoints.ts
- changed: scripts/render-video.ts
- changed: src/app/api/export/[jobId]/download/route.ts
- changed: src/app/api/export/route.ts
- changed: src/app/globals.css
- changed: src/app/render/page.tsx
- changed: src/components/export/ExportVideoModal.tsx
- changed: src/components/viewer/ProductViewer.tsx
- changed: src/engine/export/ExportJobManager.ts
- changed: src/engine/render/FrameRenderer.ts
- changed: src/types/export.ts
- added: src/engine/export/ExportApi.test.ts
- added: src/engine/export/ExportJobManager.test.ts
- added: src/engine/export/FrameManifest.test.ts
- added: src/engine/export/FrameManifest.ts
- added: src/engine/export/NativeSurface.test.ts
- added: src/engine/export/NativeSurface.ts
- added: src/engine/export/RenderIdentity.test.ts
- added: src/engine/export/RenderIdentity.ts
- added: src/engine/export/RenderProfiles.test.ts
- added: src/engine/export/RenderProfiles.ts
- added: src/engine/render/SceneDiagnostics.test.ts
- added: src/engine/render/SceneDiagnostics.ts

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/source-boundaries-delivery.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/source-boundaries-final.json

## 15. Production web screenshots

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/01-initial-product-selection.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/02-current-product-viewer.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/03-video-preview-paused.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/04-video-preview-seek-final.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/05-step1-preview-after-reset.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/06-isolated-second-product.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/07-generate-video-area.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/08-quality-settings-current-default.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/09-existing-options-preserved.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/09-profile-720p-selected.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/09-profile-1080p-selected.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/09-profile-1440p-selected.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/09-profile-2160p-selected.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/09-profile720p-ready-to-generate.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/10-job-started.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/11-actual-render-status.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/screenshots/12-completed-output-metadata.png

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after-headed-02/web-qa-report.json

## 16. 720p native QA paths

/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/720p

12 fresh native stills/state records; manifest: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/720p/manifest.json.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/720p/manifest.json

## 17. 1080p native QA paths

/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/1080p

12 fresh native stills/state records; manifest: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/1080p/manifest.json.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/1080p/manifest.json

## 18. 1440p native QA paths

/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/1440p

12 fresh native stills/state records; manifest: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/1440p/manifest.json.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/1440p/manifest.json

## 19. 2160p native QA paths

/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/2160p

12 fresh native stills/state records; manifest: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/2160p/manifest.json.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/2160p/manifest.json

## 20. Measured native dimensions

| Profile | Measured pixels | Checkpoints | Native verification |
|---|---|---|---|
| 720p | 1280×720 | 12 | viewport/canvas/CSS/drawing buffer/PNG exact |
| 1080p | 1920×1080 | 12 | viewport/canvas/CSS/drawing buffer/PNG exact |
| 1440p | 2560×1440 | 12 | viewport/canvas/CSS/drawing buffer/PNG exact |
| 2160p | 3840×2160 | 12 | viewport/canvas/CSS/drawing buffer/PNG exact |

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/native-verification.json

## 21. Cross-resolution comparison sheets

/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/native-comparison-contact-sheet.png

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/01-intro-finished-hero.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/02-intro-fully-exploded.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/03-step1-exact-reset.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/04-early-hardware-macro.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/05-cabinet-medium.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/06-b8-cabinet-face.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/07-bed-face.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/08-step25-connection.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/09-step26-corrected-active-connection.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/10-folding-legs.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/11-wall-anchoring.png
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/comparison-sheets/12-final-bedroom-hero.png

Actual non-raster scene/camera hashes match at identical timestamps across profiles. Caption wording/visibility and normalized screen proportions verified. Thumbnails alone are downscaled for comparison sheets; native source PNG/proof frames remain untouched.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/native-verification.json

## 22. Short encode-proof paths/results

| Profile | Native pixels | Runtime | Frames | Result | MP4 |
|---|---|---|---|---|---|
| 720p | 1280×720 | 2 s | 60 | PASS | /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/720p/wf311613-final-micro-pass-native-proof-720p.mp4 |
| 1080p | 1920×1080 | 2 s | 60 | PASS | /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/1080p/wf311613-final-micro-pass-native-proof-1080p.mp4 |
| 1440p | 2560×1440 | 2 s | 60 | PASS | /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/1440p/wf311613-final-micro-pass-native-proof-1440p.mp4 |
| 2160p | 3840×2160 | 2 s | 60 | PASS | /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/2160p/wf311613-final-micro-pass-native-proof-2160p.mp4 |

Each actual encoded proof: 30 fps CFR, H.264/yuv420p, silent, full decode/no unexpected black interval; native 60 PNG source frames, no upscaling.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/native-verification.json

## 23. Tests added/changed

- src/engine/export/ExportApi.test.ts
- src/engine/export/ExportJobManager.test.ts
- src/engine/export/FrameManifest.test.ts
- src/engine/export/NativeSurface.test.ts
- src/engine/export/RenderIdentity.test.ts
- src/engine/export/RenderProfiles.test.ts
- src/engine/render/SceneDiagnostics.test.ts

Covers old/new IDs/defaults/FPS, exact 16:9 sizes, API validation/rejection/same-origin, job propagation/naming, native canvas/PNG policy, cache/profile isolation/resume, video/state identity and generic scene diagnostics.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/profile-tests.log

## 24. Complete test result

Post-startup-fix: 39/39 profile/diagnostic tests PASS in 7 files; complete 187/187 tests PASS in 37 files. The one added regression exercises the actual job lifecycle with only Chromium mocked, asserts the 90 s readiness budget and unchanged 60 s navigation, then verifies controlled error/cleanup without capturing frames or launching FFmpeg. Existing test-timeout settings, assertions and mechanical validators were unchanged. Earlier 38/186 test results and logs are preserved as history.

An early props-check attempt briefly overlapped the running mechanical gate. That props attempt exited 0 before the attempted interruption. The mechanical run continued; the unchanged props checker was then rerun after mechanical completion. This limited overlap is retained as an operational warning; not all attempts are claimed to have been strictly sequential.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/profile-tests.log
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/full-tests.log
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/validation-summary.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-infrastructure-validation/profile-tests.log
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-infrastructure-validation/full-tests.log

## 25. Mechanical and native validation

15/15 unchanged mechanical gates PASS, including B8, pivots/bearings/pistons, folding legs, collision/path/access, seek/reset. Polish 02B presentation checker PASS.

Native micro aggregate is **FAIL**, not PASS. Physical errors: 0; Step 1 reset valid: true; exploded-path pair checks: 214537; new penetrations: 0; camera checks: 5. Only historical source-lock rejection is src/engine/export/ExportJobManager.ts, src/engine/render/FrameRenderer.ts. The validator and its thresholds were left unchanged; no waiver. Independent approved-data/source-boundary evidence and unchanged 15 mechanical gates pass.

Original strict whole-scene camera JSON replay remains **FAIL** (5 scalar 1 ULP representation differences). All 30 whole-scene PNGs replay byte-exactly and exact Step 1 reset passes; supplementary numeric evidence is retained separately. No camera/validator edit or claim of original strict PASS.

Post-infrastructure 720p preservation: 12/12 fresh PNG byte-identical. 11 timestamps are exactly equal; B8 timestamp roundoff 4.263256414560601e-14 s lies in the same hold. This is not claimed as 12 exact timestamps.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/approved-mechanical-gates/validation-results.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/polish02b-presentation/presentation-fit.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/micro-native/micro-validation.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/whole-scene-seek-verification.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/whole-scene-supplementary-verification.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/720p-infrastructure-preservation.json

## 26. Typecheck/lint/production build

Post-startup-fix typecheck PASS, lint PASS, production build PASS using explicit Next webpack backend. Two earlier default Turbopack attempts exited 137; their failed logs remain under post-infrastructure-validation, not the new validation directory. No build config/package alteration was used to change the backend; CLI backend selection only. The earlier props evidence-directory ENOENT is also retained, followed by its unchanged successful retry.

An early props-check attempt briefly overlapped the running mechanical gate. That props attempt exited 0 before the attempted interruption. The mechanical run continued; the unchanged props checker was then rerun after mechanical completion. This limited overlap is retained as an operational warning; not all attempts are claimed to have been strictly sequential.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/validation-summary.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/typecheck.log
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/lint.log
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-startup-fix-validation/build-webpack.log
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-infrastructure-validation/build.log
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-infrastructure-validation/build-retry-01.log
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/post-infrastructure-validation/props.log

## 27. Browser/WebGL limitations

Actual Chromium/WebGL supported all four native sizes; sampled maxTextureSize/maxRenderbufferSize: 16384. Canvas, drawing buffer and PNG sizes matched. Context/capability/size failures are explicit, no lower-resolution fallback. These are observed machine-specific limits, not a guarantee for other GPUs/browsers. Three Clock/CommonJS deprecations and observed optional favicon 404 remain reported; no unexplained fatal browser/page errors are waived.

Interactive headless UI automation retained two timeout failures (the first after-workflow profile check, and a focused diagnostic). Those raw results remain FAIL, not waived. Actual headed Chromium profile selection succeeded with matching summaries in 41–80 ms and no page exceptions. The completed headed workflow retains the same 1600×1000 viewport, assertions and interactive-test timeouts, with no UI-source changes. The separate production renderer readiness budget was aligned to the existing CLI 90 s budget after measured cold-start evidence. Deterministic headless rendering/native QA succeeds independently; that does not make the interactive headless failures PASS. The underlying interactive timeout cause is not conclusively diagnosed.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/native-verification.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/after/web-qa-error.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/profile-selection-diagnostic-01/diagnostic.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/profile-selection-diagnostic-headed-01/diagnostic.json

## 28. Memory/performance observations

Frames are captured/written one at a time; no whole-video PNG sequence held in RAM. Completed MP4 download streams from disk. Browser/encoder resources close on completion/failure/cancel; profile/job isolation protects unrelated outputs. 4K is heavier; only 60 proof frames per profile were encoded. No quantitative peak RSS claim is made because peak RSS was not measured. Turbopack exit 137 is retained as a build/runtime warning, not conclusively attributed to memory without evidence.


## 29. No full 1080p render

Confirmed: no full 1080p timeline rendered. Only native still checkpoints and a 2-second proof.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/native-verification.json

## 30. No full 1440p render

Confirmed: no full 1440p timeline rendered. Only native still checkpoints and a 2-second proof.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/native-verification.json

## 31. No full 2160p render

Confirmed: no full 2160p timeline rendered. Only native still checkpoints and a 2-second proof.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/native-verification.json

## 32. No audio

No full 1080p, 1440p or 2160p video was rendered. Only 12 checkpoints and a 2-second / 60-frame proof per standard profile; one extra actual web 720p proof. No music/SFX/audio downloaded or muxed.

Evidence:

- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/technical-verification.json
- /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/native-verification.json

## Stop boundary

STOP after review render/web QA/native profile delivery. No further creative/mechanical/Option 2/audio/high-resolution-full-video work; await director review.
