# Steps 1–3 action-speed / package migration checkpoint

Scope: existing PDF Steps 1–3 only. No Step 4+ implementation. Approved geometry/materials/light values/camera presets/shot order preserved. Original checkpoints remain distinct review variants, not compatibility copies of product data.

| Step | Previous timeline (s) | Action-speed timeline (s) |
| --- | ---: | ---: |
| 1 | 78.700 | 52.999 |
| 2 | 47.600 | 32.539333 |
| 3 | 51.750 | 40.298333 |
| Total | 178.050 | 125.836667 |

Underlying retiming lives in `director/actionPacing.ts`, not a video playback multiplier:

- First dowel/cam/bolt operation caps: 2.10 / 1.35 / 2.40 s (previous 3.30 / 2.20 / 4.00 s).
- Second occurrence instructional duration / 1.3; third+ / 1.8, also capped at 0.72 × existing repeat duration so already compressed mirrored actions never become slower.
- Hardware post-action hold: 0.14 s first / 0.08 s repeat.
- Mechanical phase weights: original approach/contact/feed/seat = .35/.10/.50/.05; new first = .28/.06/.62/.04; repeats = .22/.02/.73/.03.
- Cam/final-tighten action duration and intra-shot offsets × .55. Simultaneous bolt feed + spin stays synchronized; cam lock follows seating.
- Repeated empty connection-macro hold capped at .20 s; empty staging hold capped at .60 s.
- Coupled rail/dowel/side closing motions and controlled part alignment are unchanged. All six Step 3 bolts start before tightening.
- Screw timing entry is reusable but no screw operation was added to Steps 1–3.

The engine's optional normalized `installation.motionTiming` retains the original weights by default. Product-specific weights are only in this product package.

## Folder ownership

`product/`: canonical Step 1 parts and material definitions, mirrored Step 2 parts, Step 3 receiver bores/spanning rails/hardware; `product.ts` is the active public product export.

`assembly/`: compiler entry and rigid standing-side installation transform.

`director/`: approved historical plans, camera definitions and semantic/action pacing. `directorPlan.ts` is the current active plan/video export.

`legacy/`: retained pre-approved Steps 1–10 implementation and its old hardware catalog. Not promoted to the current quality standard; not changed beyond relocation. This is genuinely different historical behavior, not a copied compatibility implementation.

`tests/`: product/assembly/pacing/seek tests. Shared integration registry tests remain `src/products/tests/registry.test.ts`.

`tools/`: legacy narration tool; not used by this silent director review.

`references/`: approved 31-step plan, prior checkpoint notes, source metadata. Binary sources live at `references/wf311613-standalone-murphy-bed/` (intentionally outside src).

## Migration / exceptions

- No active product-specific source, IDs, camera overrides or pacing data remains in `src/engine/` or `src/data/`.
- Generic scripts: `render-video.ts`, `render-checkpoints.ts`, `validate-assembly.ts`, all registry-driven. Three duplicated checkpoint scripts were replaced with the generic checkpoint renderer; old Step 1/3 snapshot filenames remain archived.
- Product-specific files outside package: PDF and appearance PNG in the product-owned `references/` folder; generated output in the product-owned `output/` folder. Existing `tmp/` render/PDF caches are historical intermediates, not imported source or authoritative data.
- Historical notes describe old paths. Migration: old WF Step 1 output → `reviews/step-01`; Step 2 MP4 → `reviews/step-02`; Step 3 output → `reviews/step-03`; Steps 1–10 → `reviews/steps-01-10`; daybed-named historical output → `reviews/legacy-daybed`; paced screenshots → `screenshots/pacing-v1`, all below `output/wf311613-standalone-murphy-bed/`.
- Merax assembly/promo/free-animation/reconstructed/threejs historical outputs are now inside `output/merax-queen-film/reviews/legacy/`.

Expected current review export: `output/wf311613-standalone-murphy-bed/reviews/steps-01-03/wf311613-steps-01-03-action-speed-review.mp4`, 1280×720, 30 fps; 3,776 frames (125.866667 s after frame rounding). This document does not claim director approval.

## Completed checks

- Typecheck: passed.
- ESLint: passed, no lint warnings.
- Vitest: 43 tests / 6 suites passed. New tests cover exact geometry/material/camera preservation, action windows, repeat hierarchy, all-bolts-before-tightening, identical final state/backward seek, approach-before-spin and physical post-contact feed.
- Production build: passed.
- Assembly validation: valid; 3 steps, 72 connected operations, zero errors/warnings.
- Ten render checkpoints captured; inspected first bolt, mirrored result, Step 3 bolt and lower-frame result. No new visual defect found in the sampled shots; no visual redesign made.
- Export completed: H.264/yuv420p, 1280×720, 30/1 fps, 3,776 frames, 125.866667 s, 4,292,738 bytes. Continuous actual DirectorPlan timeline; no playback-rate transformation, no narration added.
- Nonblocking tool warnings: Three CJS import deprecation in the Node script runner, Three.Clock deprecation in the browser, one resource 404; no render-page JavaScript exceptions. These do not count as assembly validation warnings.

Stop at Step 3 for director review. No Step 4+ change.
