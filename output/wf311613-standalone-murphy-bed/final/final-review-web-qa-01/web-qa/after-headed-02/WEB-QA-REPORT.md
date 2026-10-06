# Actual production web QA — after

Result: FAIL

Candidate: wf311613-final-micro-pass

Origin: http://127.0.0.1:3016

Checks:

- PASS: product selector available
- PASS: current candidate selected
- PASS: product preview canvas visible
- PASS: no horizontal page overflow
- PASS: play advances timeline
- PASS: pause keeps timeline stable
- PASS: timeline seek reaches final timestamp
- PASS: reset returns exact time zero
- PASS: assembly preview after intro reset
- PASS: switch resets independent product timeline
- PASS: return restores candidate without second-product state
- PASS: existing1080p default retained
- PASS: existing FPS30 default retained
- PASS: existing FPS30/60 options retained
- PASS: legacy720p still present
- PASS: new profile 720p selectable
- PASS: new profile 1080p selectable
- PASS: new profile 1440p selectable
- PASS: new profile 2160p selectable
- PASS: actual export request accepted
- PASS: selected product/job isolation
- PASS: real native renderer started
- PASS: short actual export completes
- PASS: short job uses selected720p
- PASS: short job metadata native dimensions/fps
- PASS: short server-limited job contains60 frames
- PASS: completed output metadata understandable
- PASS: actual downloaded native720p proof
- PASS: proof frame rate/codec/pixel format
- PASS: proof contains60 frames /2 seconds
- PASS: proof silent
- PASS: output filename identifies720p
- PASS: download complete decode
- PASS: no browser page exceptions
- FAIL: no unexplained critical HTTP/resource/console failures

Findings:

- P2: Diagnostic-only UI is exposed in the production viewer.
- P2: Production UI contains development/QA-only labeling.
- P1: Default product selection is not the currently approved candidate; explicit selector/URL is needed.
- P1: Unexplained production HTTP/resource/console failures require review.
- P2: Observed optional favicon.ico GET404 only.

Screenshots:

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

No API/job-state mocks or source changes. After proof is a fresh actual server render, not a historical output.
