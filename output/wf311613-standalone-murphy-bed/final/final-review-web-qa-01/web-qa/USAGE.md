# Actual production web QA helper

Artifact-only helper. Run only after the root's full720p review render and verification finish. It controls the actual production UI using real clicks/inputs and observes actual API jobs. It never mocks API responses, job progress, scene state or completed videos.

## Before infrastructure changes

With the existing production app already running:

```sh
MODE=before WEB_QA_URL=http://localhost:3017 node output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/audit-production-ui.mjs
```

The helper records the actual default quality/FPS and all old options. It selects the approved micro-pass in the product selector, checks product preview/play/pause/seek/reset/Step1, switches to Demo Cabinet and back, opens export settings, starts a real default-profile export, observes at least one rendered frame, then cancels that job. It must not complete a full1080p render.

## After generic resolution support

Start a fresh actual production server with `EXPORT_FRAME_LIMIT=60`. This is the existing server smoke-proof limit, not a scene/playback multiplier. All proof jobs use actual deterministic native rendering of60 frames from time zero. Do not start this server or helper while other heavy render/test/build jobs run.

```sh
EXPORT_FRAME_LIMIT=60 npm run start -- --port 3017
```

Then run:

```sh
MODE=after WEB_QA_URL=http://localhost:3017 WEB_QA_EXPECT_FRAME_LIMIT=60 node output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/web-qa/audit-production-ui.mjs
```

The helper verifies old default/options, selects all four standard profiles without rendering them, selects720p/30, starts one real short native job, waits for actual completed UI, clicks Download MP4, and probes/decodes the fresh downloaded file. It requires1280×720/30/H.264/yuv420p/no audio/60 frames/2 seconds. No full1080p/1440p/2160p output is started.

## Assumptions and explicit hooks

- Product selector retains accessible name `Select product`.
- Current candidate is registered as `wf311613-final-micro-pass`; second isolation product is `demo-cabinet`.
- Timeline retains accessible name `Video timeline`.
- Existing buttons: `Play`, `Pause`, `Reset all`, `Next assembly state`, `Export video`, `Cancel export`, `Download MP4`.
- Start button is either `Start export` or `Generate video`.
- Export settings still use `.export-settings` fieldsets/labels and native radio inputs.
- Add `data-profile-id="..."` to each profile radio input (or its label). New720p/1080p and legacy1280x720/1920x1080 have duplicate dimensions; hook is needed to disambiguate while preserving labels.
- New job metadata exposes `profileId` or `profile.id`, plus existing dimensions/FPS/progress fields.
- Completed output filename identifies720p, and completed dialog displays profile, dimensions and FPS.
- Each evidence directory is run-once and uses exclusive writes. Set `WEB_QA_OUTPUT_DIR` to a new path for an explicitly authorized repeat; never overwrite prior screenshots/reports.
- Default browser timeout is180 seconds for heavy initial app readiness; job completion wait defaults300 seconds and can be supplied via `WEB_QA_JOB_TIMEOUT_MS` without changing validators/tests.

## Evidence

Each mode writes its own directory with fresh actual-UI screenshots, observed options, checks, real job metadata history, console/page/network records and provisional P0/P1/P2 findings. After mode also writes fresh downloadedMP4, exactSHA/file size and ffprobeJSON.

Network optionality is limited to observed same-origin `GET /favicon.ico`404 with exact matching console evidence. No arbitrary HTTP/console failure is silently waived.

Only `node --check` is safe to run during the root render; do not execute browser helper yet.
