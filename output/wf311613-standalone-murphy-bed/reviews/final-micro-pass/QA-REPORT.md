# WF311613 — Final micro-pass QA

Candidate: `wf311613-final-micro-pass`. Baseline: `wf311613-director-polish-02b`.
QA ready for director review. This is **not** director approval. No full new master has been rendered.

## 1–2. Exact intro timing

Total **5.000 s**: finished closed hero 1.250 s → separation 2.500 s → exploded hold 0.875 s → clean editorial transition 0.375 s. The transition cuts to the locked Step 1 zero state; it does not collapse or reverse the assembly. Step 1 local time starts at global 5.000 s.

## 3–4. Exploded groups and transform derivation

- cabinet-left-with-mechanism: A1, A3, A5, A7, A8, A9, D8, E1--1, S23-H19, E2--1. World offset [-36, 0, 0] in existing scene units.
- cabinet-right-with-mechanism: A2, A4, A6, A7-R, A8-R, A9-R, D9, E1-1, S24-H19, E2-1. World offset [36, 0, 0] in existing scene units.
- complete-top-cap: B1-rear, B1-front, B2-left, B3, B2-right, B4-left, B4-right. World offset [0, 34, 0] in existing scene units.
- cabinet-back-face: B8-4--1, B8-4-1, B7-4, D4-1, B8-5--1, B8-5-1, B7-5, D4-2, B8-6--1, B8-6-1, B7-6, B5, B6. World offset [0, 0, -20] in existing scene units.
- cabinet-cross-members-and-center-bracket: E3, B9, D5, E4, E5. World offset [0, 0, -35] in existing scene units.
- bed-carrier-perimeter: C8-left, C8-right, C9, D1. World offset [0, 0, -55] in existing scene units.
- mattress-support-slats: D2-0, D2-1, D2-2, D2-3, D2-4. World offset [0, 0, -78] in existing scene units.
- complete-bed-face-grid: C2-left, C4-left, C5, C4-right, C2-right, C1-start, C1-close, C3-0, C6-0-first, C6-0-second, C3-1, C6-1-first, C6-1-second, C3-2, C6-2-first, C6-2-second, C3-3, C6-3-first, C6-3-second. World offset [0, 0, -105] in existing scene units.
- underside-cross-ties: C7-0, C7-1, C7-2. World offset [0, 0, -165] in existing scene units.
- folded-leg-left: leg--1. World offset [-16, 0, -190] in existing scene units.
- folded-leg-right: leg-1. World offset [16, 0, -190] in existing scene units.

Transforms come from the approved finished-closed state at 504.513693889 s. Smoothstep offsets are converted into the existing parent coordinate space. Captive face-grid panels remain with their grid, and each mechanism remains with its cabinet side. No part is invented, scaled, reparented or decoratively spun.

## 5–6. Props and assembly authority

Mattress, bedding, furniture, plants, rug, curtains and artwork are excluded from the product explosion. The approved finished-bedroom hero is followed by an editorial cut to the approved assembly room. Original PDF/AssemblyGraph order, all 31 DirectorPlan steps/actions, captions, installation paths and timings remain unchanged. Original finished showcase remains 20.8 s.

## 7. Step 1 exact reset

PASS: five numerical reset comparisons across 458 registry objects, including descendant transforms, visibility and geometry variants. Camera and original presentation clock return to baseline. Actual rendered Step 1 PNG is byte-identical to baseline, including environment, lighting and presentation state. All nine candidate checkpoint PNGs repeat exactly when sought in reverse order.
Step 1 PNG SHA-256: `84a1d48a637a6328541b33ad7ebbd013909879bee59219b46557e0d2c4002766`.

## 8–11. Step 26 camera-only correction

Old: `{"target":[-109.73666946335138,103.29596496036595,15.794449580059482],"position":[-23.551404172302963,117.66017584220735,-46.45046424125327],"fov":35}`.
New: `{"position":[-114.3,116,17],"target":[-115.3,111,7],"fov":62}`.
Rear/interior open-side three-quarter access shows the stud, free eye and connection action without using the bed face as an intervening panel. No product object is moved for visibility. Native visible-mesh rays hit the active eye first; eye and mount centers stay inside the safe framing region. The actual playback preset is used for final stills, not an inspection override.

| Shot | Step-local start (s) | Duration (s) | Original global start (s) | New global start (s) |
|---|---:|---:|---:|---:|
| S26-target | 2.300 | 1.700 | 386.503694 | 391.503694 |
| S26-eye-align | 4.000 | 2.200 | 388.203694 | 393.203694 |
| S26-retain | 6.200 | 1.900 | 390.403694 | 395.403694 |
| S26-verify | 8.100 | 1.200 | 392.303694 | 397.303694 |

Only the shared `S26-cabinet-eye` preset changes. Supported-raise/context and every other camera remain unchanged. Eye alignment, #17 retainer installation and verification action data/timing remain unchanged.

## 12. Regression results and source delta

- locks: PASS.
- assembly: PASS.
- structuralPaths: PASS.
- groundedFloor: PASS.
- frontStaging: PASS.
- mechanics: PASS.
- hardware: PASS.
- step28: PASS.
- foldingLegs: PASS.
- receiverPaths: PASS.
- pistons: PASS.
- seekReset: PASS.
- b8: PASS.
- presentationFit: PASS.
- captions: PASS.
- Product/material hashes, AssemblyDefinition, original DirectorPlan and original Polish 02B video locks: unchanged.
- Typecheck: PASS. Lint application source: PASS (`npm run lint -- --ignore-pattern 'output/**'`; generated historical output helpers excluded, no rules/configuration changed).
- Tests: 148/148 across 30 files. Production build: PASS.
- Presentation path checks: 61 samples; 214537 cross-group checks; zero new penetrations. One pre-existing completed-state mating overlap (D5/B7-4) recorded separately. Existing assembly thresholds remain unchanged.
- Compared 198 frozen baseline files. Existing modified files: `src/components/animation/AnimationController.tsx`, `src/components/viewer/ProductViewer.tsx`, `src/products/tests/registry.test.ts`, `src/products/wf311613-standalone-murphy-bed/index.ts`, `src/types/video.ts`. These are opt-in intro host/type/registration integration and its registry expectation. No existing engine/mechanics, product geometry/material, assembly/DirectorPlan, environment or validator source is changed. New files are presentation composition, the camera-only candidate, tests and QA tools.
- Warnings: existing THREE CommonJS/Clock deprecations and Turbopack generated-frame glob warning. No render page errors.

## 13. Expected new full-video runtime

**524.053694 s (08:44.054)** = unchanged assembly 498.253694 s + unchanged showcase 20.8 s + intro 5 s. Full new master intentionally not rendered.

## 14. Mandatory stills and contact sheet

- [01 Finished product](stills/01-intro-finished.png)
- [02 Exploded 50 percent](stills/02-exploded-50-percent.png)
- [03 Fully exploded](stills/03-fully-exploded.png)
- [04 Exploded hold](stills/04-exploded-hold.png)
- [05 Before editorial cut](stills/05-before-step1-transition.png)
- [06 Step 1 exact reset](stills/06-step1-reset.png)
- [07 Step 26 BEFORE](stills/07-before-occluded-step26.png)
- [08 Step 26 alignment](stills/08-step26-alignment.png)
- [09 Step 26 active connection](stills/09-step26-active-connection.png)
- [10 Step 26 secured](stills/10-step26-secured.png)
- [Combined contact sheet](contact-sheet.png).
- [Interactive artifact gallery](qa-gallery.html).

## 15. Optional intro-only preview

[wf311613-intro-qa-5s.mp4](wf311613-intro-qa-5s.mp4): 5.000 s, 150 frames, 1280×720, 30 fps, H.264/yuv420p, silent. Fresh deterministic prefix frames only, not historical video/frame reuse. Complete decode PASS.
Size: 481229 bytes. SHA-256: `763a6a4b2eb2aa9e5e78a199e694f6e5b1f188b57f98591507dd6b3769fa773c`.

STOP: await review of the intro, exploded composition, exact Step 1 reset and Step 26 camera. No full master, audio, 2K/4K, Option 2 or additional polish.