# Actual production-web observations — after-headed-02

This is a read-only inspection of the 17 actual screenshots and completed-job evidence in this directory. No candidate, product, camera, material, timing, validator, or application source was changed for this inspection. No browser, render, build, or test job was launched by the inspecting agent. This is technical/UI QA, not director approval.

## Outcome and evidence boundary

The actual headed production workflow selected `wf311613-final-micro-pass`, selected the new native 720p profile, created job `64a3b46f-0e06-42e1-af91-b98ccecbe47c`, reached completed state, and downloaded a real MP4. The completed screenshot is corroborated by the actual saved download, not merely by a button or an API prediction.

- Download: `wf311613-final-micro-pass-review-720p.mp4` in this directory.
- Actual bounded proof: 1280×720, 30 fps, H.264, yuv420p, 60 decoded frames, 2.000000 seconds, one video stream and no audio.
- Size: 168,063 bytes.
- SHA-256: `66456007bd649dd9dbfc93502a1ce7cc918b08f03e3a2ea88c8eba284e94b4da`.
- Existing `download-ffprobe.json` and the separate re-probe/decode in `download-network-supplement.json` confirm the properties above; complete decode succeeded and no unexpected black interval was reported.

This is a **2-second web-export proof**, not the complete 8:44 video and not a full 1080p/2K/4K export. The separately rendered full master and separate native-resolution render proofs are different artifacts.

The raw `web-qa-report.json` remains **valid=false, 34/35 checks passing**. Its single failed aggregate network check has not been overwritten or renamed PASS. The independent `download-network-supplement.json` and derived `web-qa-reviewed.json` are **valid=true** and preserve the raw report's SHA and failure status.

The supplemental review binds the sole `net::ERR_ABORTED` document-navigation event to the exact completed job's GET `/api/export/64a3b46f-0e06-42e1-af91-b98ccecbe47c/download`, observed HTTP 200 attachment response, successful Playwright download, exact saved file/bytes/SHA, and independent complete decoding. It does not ignore arbitrary failed requests. No other application request failure or page exception was found. The separately observed exact same-origin `/favicon.ico` 404 was confirmed by an explicit diagnostic HTTP GET; it remains a noncritical warning. Source classifiers and validator thresholds were not changed for this supplemental interpretation.

## Screenshot observations

All 17 PNGs were inspected at their actual 1600×1000 viewport. The raw report also records no horizontal page overflow.

| Actual screenshots | Observation |
| --- | --- |
| `01-initial-product-selection.png` | The initial selection is the older Polish 02B candidate, not final micro-pass. This existing discoverability issue remains recorded below. |
| `02-current-product-viewer.png`, `03-video-preview-paused.png`, `07-generate-video-area.png` | After explicit current-candidate selection, the product identity and final-micro-pass preview are visible. The closed product and restrained room render are readable. QA/debug presentation is still visible. |
| `04-video-preview-seek-final.png` | The completed open product, mattress/bedding, legs, and bedroom are visible at 8:44. No obvious black canvas, cropped product, or missing major showcase prop is visible. |
| `05-step1-preview-after-reset.png` | Reset/next returns to Step 1 at 5 seconds with grounded loose panels; finished bedroom/mattress/bedding are not leaking into the assembly shot. |
| `06-isolated-second-product.png` | The independent Demo Cabinet appears with its own product/timeline; no obvious WF311613 bedroom or bedding leak is visible. |
| `08-quality-settings-current-default.png`, `09-existing-options-preserved.png` | The existing 1080p/30-fps default and both legacy options remain. All four additional standard native options are visible without clipping. Separate “Existing options” and “Standard native resolutions” headings distinguish intentional compatibility duplicates. |
| `09-profile-720p-selected.png`, `09-profile-1080p-selected.png`, `09-profile-1440p-selected.png`, `09-profile-2160p-selected.png` | Selection styling and summary respectively show 1280×720, 1920×1080, 2560×1440, and 3840×2160. The current candidate snapshot, 30-fps choice, H.264, full-timeline 8:44 and 15,722-frame estimates are readable. These screenshots establish UI selection, not native rendering by themselves. |
| `09-profile720p-ready-to-generate.png`, `10-job-started.png` | The new 720p profile and candidate identity remain consistent when the job starts. Waiting/initialization is not presented as fictitious completed progress. |
| `11-actual-render-status.png` | The rendering phase and 0/60 frame counter are visible in this early capture; the screenshot alone does not establish later progress. The completed job report supplies the eventual 60/60 evidence. Output filename/path and silent encoding metadata are readable. The explicit short-preview warning explains the 60-frame bound despite the full-timeline duration shown above. |
| `12-completed-output-metadata.png` | Actual completed state displays 100%, 0:02, 60 frames, native 1280×720, 30 fps, H.264/yuv420p/silent, filename/path, and Download MP4. The short-preview warning explicitly says this is not the complete video. Long identity/path text wraps without truncating the completion actions. |

## Remaining findings

No new visual P0 blocker is apparent in this successful bounded workflow. This does not retroactively clear the earlier failed executions or certify every environment/viewport.

- **P1 — unchanged default candidate discoverability:** the root UI initially selects historical `wf311613-director-polish-02b`; the user must explicitly select `wf311613-final-micro-pass`. The successful export here used the explicit correct selection. This observation is not authorization to alter the approved product registry/default.
- **P2 — unchanged QA/POC/debug surface:** product labels still include “QA only”, the POC/debug controls and engineering validation panels remain visible. This is existing presentation debt, not a product-render defect introduced by the resolution work.
- **P2 — unchanged raw sidebar duration formatting:** scene durations expose long binary-floating decimal strings. Modal totals and output duration are human-readable. This is display formatting debt; no retiming is proposed.
- **P2 — exact optional favicon warning:** `/favicon.ico` returns 404. It is explicitly evidenced rather than broadly suppressing 404/resource errors; it does not prevent this observed render/download.
- **P2 — preview-notice spacing/hierarchy:** in the rendering and completed modals, the small gray short-preview notice is flush with the outer left border rather than the inner metadata padding. It is fully visible and intelligible at the reviewed viewport, but visually lower-priority than the metadata. No source edit was made or requested by this inspection.

## Preserved failure history

The successful after-headed-02 run does not overwrite or retrospectively pass:

- `../before/web-qa-error.json`: original pre-fix export failure.
- `../after/web-qa-error.json`: headless profile-selection check timeout before job creation.
- `../profile-selection-diagnostic-01/diagnostic.json`: focused headless export-click timeout.
- `../after-headed-01/web-qa-error.json`: genuine prior zero-frame export/startup failure, including its failed job record and observations.

The focused headed selection diagnostic is useful selection evidence only; it was not substituted for this actual completed job/download. The raw after-headed-02 network aggregate FAIL remains available alongside its strict, separately identified successful-download explanation.

## Review limit

The scoped quality choices, native-size metadata, status/completion readability, bounded actual download, and current-candidate selection are supported by these actual artifacts. No creative approval, mechanical approval, full higher-resolution export approval, or general production readiness is inferred from this observation report.
