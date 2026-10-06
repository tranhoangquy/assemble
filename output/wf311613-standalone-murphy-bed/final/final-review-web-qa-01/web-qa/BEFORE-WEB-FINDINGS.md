# Production web audit — BEFORE infrastructure changes

This is an evidence synthesis of the actual **old production build** audit.
It is not a post-change PASS report and does not approve the updated web app.
No browser was launched and no application source was changed for this synthesis.

Primary evidence:

- [Actual production audit JSON](before/web-qa-error.json)
- Origin: `http://127.0.0.1:3016`
- Audit started: `2026-10-03T19:12:10.041Z`
- Audit ended: `2026-10-03T19:24:29.455Z`
- `actualProductionUI: true`, `apiMocked: false`, `sourceModified: false`
- Overall before-audit result: **FAIL** (`valid: false`), because the real export failed.

## Confirmed findings

| Severity | Finding | Actual evidence | Status at this synthesis |
|---|---|---|---|
| P0 | Real Generate Video workflow failed before capturing its first frame. | POST accepted with HTTP 202; job `ff0c40fe-312b-4af3-99ae-6cb1fc9a7609` changed from queued/rendering to `error`; `currentFrame: 0`, `progress: 0`, `totalFrames: 15722`; error: “The render route timed out before WebGL became ready.” | Requires a completed actual post-change API/UI export. A successful CLI master alone does not prove the web export workflow works. |
| P1 | Default product selection does not open the current approved candidate. | Initial selection `wf311613-director-polish-02b`, not `wf311613-final-micro-pass`. The audit explicitly selected the current candidate/URL afterward. | Reported, not silently changed. Whether the default should change is a separate product decision. |
| P2 | Diagnostic UI is exposed in the production viewer. | “Debug assembly” control plus assembly-state and validation panels. Audit DOM reports `diagnosticPanels: 2`. | Visible in the reviewed screenshots; not hidden by this task. |
| P2 | Development/QA naming remains in production-facing labels. | Selected product contains “QA only”; header contains “POC / 30 FPS”; catalog includes legacy/review/not-reviewed labels. | Reported separately; product/package names are frozen and not renamed. |

### P0 job timing and scope

The real before-export requested the preserved default **1920×1080 / 30 FPS**
for `wf311613-final-micro-pass`.

- Created: `2026-10-03T19:23:06.624Z`
- Final error observed: `2026-10-03T19:24:29.455Z`
- Observed elapsed: **82.831 seconds** (approximately 83 seconds)
- Seventy-five actual job observations are retained in `web-qa-error.json.jobs`.
- The intended filename was `wf311613-final-micro-pass-review.mp4`.
- Zero captured frames means this attempt did **not** produce a full 1080p video.
- A screenshot proves the running/status UI was shown, but no completed-output
  screenshot or download verification exists for this failed attempt.

The evidence establishes a render-readiness timeout, not its underlying cause.
It does not prove whether resource contention, scene setup time, route loading or
another factor caused that timeout. Do not label it fixed until the after-audit
produces real captured frames, encoding, a completed job and a downloadable file.

## What the old actual UI did pass

Seventeen recorded checks passed before the export failure:

- Product selector present and current candidate selectable.
- Canvas visible at 1269×810 CSS/backing size inside the 1600×1000 editor UI.
- No horizontal page overflow (`scrollWidth === clientWidth === 1600`).
- Play advanced the timestamp from 0 to 0.43 seconds; pause held it stable.
- Timeline seek reached the final timestamp (`524.05` of `524.0536938888888`).
- Reset returned exactly to zero; assembly preview at 5 seconds was reachable.
- Switching to `demo-cabinet` reset its independent 34-second timeline; returning
  restored the candidate's 524.0536938888888-second timeline without second-product state.
- Legacy 720p and 1080p options remained present; 1080p was selected by default.
- 30/60 FPS remained present; 30 FPS was selected by default.
- The real export request was accepted and its product ID matched the selected candidate.

These passing checks must not be extrapolated into export completion or a full
workflow PASS. The before JSON contains no fatal main-page JavaScript errors,
no HTTP failures in its 22 captured responses and no failed requests. It records
eight nonfatal warnings: Three.js Clock deprecation and GPU ReadPixels stalls.

## Screenshots visually inspected for this synthesis

Paths are relative to this report; all are fresh actual-production captures:

- [Initial/default product selection](before/screenshots/01-initial-product-selection.png):
  prior Polish 02B selected; header POC and diagnostic controls are visible.
- [Current candidate viewer](before/screenshots/02-current-product-viewer.png):
  explicitly selected Final micro-pass, 46 scenes, finished closed bedroom view;
  state/validation panels and review-state buttons are visible.
- [Original quality settings/default](before/screenshots/08-quality-settings-current-default.png):
  two old resolution options and 30/60 FPS; selected 1080p / 30 FPS.
- [Actual export started/status](before/screenshots/10-job-started.png):
  real job at 0%, “Starting deterministic renderer…”, Continue in background /
  Cancel export; no completed-output state is claimed.

Other preserved before captures:

- [Paused preview](before/screenshots/03-video-preview-paused.png)
- [Final timeline seek](before/screenshots/04-video-preview-seek-final.png)
- [Step 1 after intro reset](before/screenshots/05-step1-preview-after-reset.png)
- [Independent second product](before/screenshots/06-isolated-second-product.png)
- [Generate Video area](before/screenshots/07-generate-video-area.png)
- [Old options preserved](before/screenshots/09-existing-options-preserved.png)

## Review-state buttons — source hypothesis only

The screenshots show Final / Default, Closed, Open, Exploded and Assembly buttons.
The before audit **did not click and verify these five buttons individually**.
Their operation must not be marked PASS or confirmed broken from this audit.

Read-only source inspection finds `setReviewState` in
`src/components/viewer/ProductViewer.tsx` currently maps those actions to the
legacy IDs `finished`, `hero`, `open-side`, `exploded`, `base-uprights` and returns
without action if no matching scene exists. The current micro-pass sources use
`micro-intro-*` and `showcase-*` scenes plus compiled DirectorPlan scenes.
This is a plausible inactive/no-op review-state-button risk, **not an actual
browser-tested finding**. Test it in a later authorized actual UI pass before
classifying it as an observed workflow defect. No code was changed for it here.

## Render-overlay CSS inspection

The new generic `src/app/globals.css` render-only rules use
`--render-unit: calc(100vw / 1280)`. At the required 16:9 viewport widths,
the multiplier is 1 / 1.5 / 2 / 3 for 720p / 1080p / 1440p / 2160p.

| Rendered caption property | Approved 720p value | Native 4K value |
|---|---:|---:|
| Director heading font | 23 px | 69 px |
| Director note font | 14 px | 42 px |
| Step label font | 10 px | 30 px |
| Caption maximum width | 760 px | 2280 px |
| Left offset | 32 px | 96 px |
| Bottom offset | 22 px | 66 px |
| Left border | 3 px | 9 px |

Margins, padding, callouts, part-intro text, borders, shadows and completion
labels have corresponding proportional rules. Relative `em` letter spacing and
unitless line heights already scale with font size. No canvas transform is used.
Interactive-editor UI is outside `.render-stage` and is not rescaled.

Source inspection found **no intentional 720p numerical change** and no obvious
4K-tiny-caption path in these render-mode rules. However source arithmetic and
CSS parsing are not pixel QA. Browser subpixel/text rasterization and externally
loaded font availability can affect image bytes; therefore fresh 720p checks and
four-resolution caption/composition captures still must be inspected. Do not
claim byte-identical 720p pixels or readable 4K captions until actual native QA
has run. The before UI screenshots are editor screenshots, not native 4K exports.

## Pending actual after-audit

Required before declaring the updated workflow complete:

1. New production build loaded in the real browser.
2. All six legacy + standard profile choices visible, correct default and FPS retained.
3. Profile selection propagated to a real render job and native frame capture.
4. Encoding shown without a fake percentage.
5. A completed actual job with profile, dimensions, FPS, filename, output path and download verified.
6. Fresh native checkpoints/proofs, cross-resolution state/camera/layout checks and visual inspection.

No post-change approval or production-wide PASS is granted by this report.
