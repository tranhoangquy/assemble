# Production render-route readiness diagnostic

URL: http://127.0.0.1:3016/render?product=wf311613-final-micro-pass&profile=720p&fps=30

Headless Chromium, native 1280×720 / DPR 1, time zero only.

Original unchanged 60 s ready gate: **FAIL**.

Eventually ready: true.

The original 60 s ready gate is NOT PASS. Later readiness, if observed, is separate diagnostic evidence and does not change source, validators or timeout thresholds.

One optional ready PNG: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/render-readiness-2026-10-04T00-53-40-961Z-1b9772c2/time-zero-ready.png

All actual navigation, engine debug, canvas, camera, context-loss, console and network observations: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/render-readiness-2026-10-04T00-53-40-961Z-1b9772c2/render-readiness-diagnostic.json

No API mocks, exports, frame sequence, source changes or timeout/validator adjustments.
