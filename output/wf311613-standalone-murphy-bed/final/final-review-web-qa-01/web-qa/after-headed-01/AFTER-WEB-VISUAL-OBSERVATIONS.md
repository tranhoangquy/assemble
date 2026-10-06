# Actual after-web inspection — headed attempt 01

Result for this attempt: **export FAIL; no completed/downloaded output**. This is a read-only inspection of actual screenshots and the terminal `web-qa-error.json`, not director approval. No source edits, browser operations or render/test jobs were performed by this inspection agent.

## What is visibly working

- The explicitly selected `wf311613-final-micro-pass` preview is visible. The inspected final seek shows the furnished open bed, and the reset checkpoint shows Step 1 staging rather than leftover mattress/bedroom state.
- The second-product screenshot shows Demo Cabinet without the Murphy Bed bedroom props. The actual audit records independent product timeline reset and return to the candidate.
- The export dialog fits within the observed 1600×1000 viewport. All six choices are visible: the two existing 720p/1080p options and four separate standard native profiles. Existing 1080p and 30 FPS are still selected on opening; 60 FPS remains available.
- Actual selection screenshots for standard 720p, 1080p, 1440p and 2160p show the corresponding selected radio and correct native-size/profile/FPS metadata. No clipping of the inspected controls, metadata cards or action footer was visible.
- `10-job-started.png` displays the selected standard 720p profile, 1280×720, 30 FPS, profile-specific output filename/path and `h264 · yuv420p · silent`. The job is explicitly queued/Waiting, not presented as complete. The displayed intended path is not proof that an MP4 exists.

## Remaining findings for this actual attempt

| Severity | Finding | Evidence / scope |
|---|---|---|
| P0 | The actual web export fails before its first captured frame. | Job `eaf3cbbd-ff92-44dc-a0eb-bb33b46c17b0` was accepted for the correct candidate/profile, then ended `error`: `waiting for deterministic WebGL renderer ready: The native render stage timed out: page.waitForFunction: Timeout 60000ms exceeded.` Last recorded `currentFrame=0`, `progress=0`. No completed screenshot, download or decoded web proof exists for this attempt. This does not invalidate the separately completed full CLI MP4, but that MP4 cannot substitute for actual web-job completion. |
| P1 | Default selection remains the earlier Polish 02B candidate. | Actual initial selection is `wf311613-director-polish-02b`; the approved micro candidate requires explicit selection/URL. This is an existing reported workflow issue, not changed by this inspection. |
| P2 | Development/QA wording and diagnostic controls remain exposed. | The product selector/snapshot includes `QA only`; the header includes `POC / 30 FPS`; Debug assembly, registry and validation panels remain visible. No unrelated cleanup is implied. |
| P2 | Sidebar scene durations expose long floating-point decimal strings. | Preview screenshots show values such as `28.16339000000003s` and `16.42429277777776s`. This is non-blocking UI readability debt; no timeline retiming or formatting source change was made. |

No additional P0 visual clipping/blank-preview defect was identified in the inspected screenshots. This is not a claim of successful export, complete browser/network validation, mobile layout support or mechanical/director approval.

## Retained earlier failures and separate diagnostic evidence

- `../after/web-qa-error.json` remains a failed headless full-UI attempt: standard 720p `locator.check` timed out after the recorded click, before job creation. Its nine screenshots and raw failure are preserved.
- `../profile-selection-diagnostic-01/diagnostic.json` remains a failed focused headless attempt: Export video click timed out while awaiting scheduled navigation. Its final inspected inputs show that the modal did open; this alone does not prove export completion.
- `../profile-selection-diagnostic-headed-01/diagnostic.json` is a separate successful headed selection diagnostic. All four standard profiles received trusted click/input/change events and updated their actual summary, with observed selection durations 41–80 ms and zero page exceptions. It proves that those selections can work in the actual headed UI, not that the subsequent renderer/export job completes.

No failures were renamed PASS or overwritten. Any later successful retry must have its own new artifact directory and actual completed/downloaded/decoded proof.

## Inspected evidence

- `screenshots/02-current-product-viewer.png`
- `screenshots/03-video-preview-paused.png`
- `screenshots/04-video-preview-seek-final.png`
- `screenshots/05-step1-preview-after-reset.png`
- `screenshots/06-isolated-second-product.png`
- `screenshots/07-generate-video-area.png`
- `screenshots/08-quality-settings-current-default.png`
- `screenshots/09-existing-options-preserved.png`
- `screenshots/09-profile-1440p-selected.png`
- `screenshots/09-profile-2160p-selected.png`
- `screenshots/09-profile720p-ready-to-generate.png`
- `screenshots/10-job-started.png`
- `web-qa-error.json` (terminal job and checks)

The settings/preview findings also use the corresponding preserved original-after screenshots and focused headed diagnostic selection screenshots. Screenshot inspection is limited to the actual evidence observed; it does not establish an absent completion screen.
