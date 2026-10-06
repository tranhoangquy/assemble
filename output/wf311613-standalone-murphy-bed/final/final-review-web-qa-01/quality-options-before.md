# Quality options before infrastructure changes

Read-only source audit, 2026-10-03 18:27:17 UTC. Approved candidate remains `wf311613-final-micro-pass`. This audit did not modify source or run a render/build/test/browser session.

## Existing quality and FPS selections

| Existing selection ID | Unchanged label | Dimensions | Available FPS |
|---|---|---|---|
| `1280x720` | 720p | 1280 × 720 | 30, 60 |
| `1920x1080` | 1080p | 1920 × 1080 | 30, 60 |

Web default: **`1920x1080`, 30 FPS**. These strings are existing client selection IDs; the previous API receives width/height rather than a profile ID. FPS is an independent control: `30 FPS / YouTube`, `60 FPS / High motion`.

Both use MP4/H.264 (`libx264`), `yuv420p`, `+faststart`; no explicit preset or CRF is encoded in the selection. No scaling filter or audio mux is present.

Generic CLI default differs: 1280 × 720 / 30 FPS. Existing `OUTPUT_WIDTH`, `OUTPUT_HEIGHT`, `OUTPUT_FPS` overrides allow custom values. Preserve documented old CLI behavior explicitly.

## Current propagation

`ExportVideoModal.tsx` → POST `/api/export` → `ExportJobManager.start()` → native browser viewport → `/render?project=...` → DPR1 WebGL canvas → native page PNG → FFmpeg → temp `output.mp4` → download.

- UI state is a resolution string and separate FPS.
- Server permits only 1280×720 / 1920×1080 and 30/60 FPS.
- No central profile registry exists.
- Browser viewport equals job dimensions, device scale factor1. Render Canvas uses DPR1.
- Each frame writes incrementally; the complete PNG sequence is not retained in RAM.
- Per-job UUID temp directories prevent direct job collisions, but their names lack profile identity.
- Output filenames inherit package filename; they do not distinguish resolutions.
- Completed UI displays product/filename, format/duration/frame count and Download MP4. It lacks profile/dimensions/FPS/output path.
- Current client `videoId` is not consumed by the server; selected package supplies video.

## Stored settings and compatibility

No localStorage/sessionStorage or persisted export settings were found. Modal React state retains current selection while mounted. Render jobs are held in the singleton manager's in-memory Map, not a persistent job store.

Compatibility obligations:

- Preserve `1280x720` and `1920x1080` IDs, dimensions and labels.
- Preserve default `1920x1080` and default30 FPS.
- Preserve existing30/60 FPS behavior.
- Continue accepting old dimension-based API requests through an explicit legacy mapping.
- Do not reinterpret old IDs as new standard IDs.

CLI resume currently requires the original directory and time-zero timeline, checks contiguous prefix filenames and compares four sampled PNGs exactly against current deterministic renders. It has no frozen project/video/profile/FPS identity manifest. New resume identity must include these before any reuse.

## Native-resolution and overlay concerns

Native capture already exists: viewport is selected before capture and FFmpeg encodes inputs without resize. Add explicit profile propagation and dimension verification; do not introduce scaling of raster frames.

`src/app/globals.css:154–163` uses fixed pixel text, padding, offsets, borders and max-widths. At4K these are proportionally one-third the720p size. Minimal authorized correction is generic **render-only DOM-overlay scaling**, using width/1280 with exactly scale1 at1280×720. Scale anchors consistently and preserve caption wording, camera state and all3D simulation data.

Approved720p caption metrics: left32px, bottom22px, max-width760px, heading23px, note14px, span10px, border3px.

Render frame progress0–90 is based on actual frame count. Encoding92 is fixed, not measured encoder progress; display encoding as indeterminate unless real FFmpeg progress is parsed.

## Minimal shared infrastructure plan

1. One shared profile registry containing old IDs plus `720p`, `1080p`, `1440p`, `2160p`.
2. Four new standard profiles:1280×720,1920×1080,2560×1440,3840×2160; default30 FPS.
3. Server resolves one profile; rejects unknown IDs and incompatible dimension claims.
4. Resolved profile drives job snapshot, render URL, viewport/surface, capture, FFmpeg and completed metadata.
5. Profile-specific output filenames and frame/job paths.
6. Cache/resume manifest includes project, video identity, profile, dimensions, FPS and startTime.
7. Verify native canvas/PNG/encoded dimensions and WebGL limits; fail clearly without downgrading.
8. Add tests for all preserved options/defaults, new profiles, validation, propagation, isolation and unchanged deterministic state.

No product-specific resolution behavior or frozen product-package edit is required.

## Source-only findings for later real-web QA

These are not browser-confirmed observations:

- Provisional P1: default registry entry is Polish02B QA-only, not current micro-pass. Select the explicit current product URL; do not change frozen registry as an unrelated fix.
- Provisional P2: Debug assembly / POC / diagnostic panels are unconditionally exposed in regular UI.
- Provisional P1: completed output metadata cannot clearly identify profile/dimensions/path.
- Provisional P2: encoding92% is not measured progress.

Product switch, preview, play/pause, seek/reset, generation/background/cancel/retry/download and critical resource failures require actual production-browser QA.

## Relevant generic files

- `src/components/export/ExportVideoModal.tsx`
- `src/types/export.ts`
- `src/engine/export/ExportJobManager.ts`
- `src/app/api/export/route.ts`
- `src/app/render/page.tsx`
- `src/components/viewer/ProductViewer.tsx`
- `src/engine/render/FrameRenderer.ts`
- `src/app/globals.css`
- `scripts/render-video.ts`
- `scripts/render-checkpoints.ts`

Full machine-readable audit: `quality-options-before.json`.
