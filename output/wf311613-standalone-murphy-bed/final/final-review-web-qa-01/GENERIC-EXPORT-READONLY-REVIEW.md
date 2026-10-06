# Generic resolution/export implementation — read-only review

Status: read-only source review of the implementation agent's completed safe checkpoint. This document is not a test result, web-UI approval or approval of mechanical/directing changes. No source edits, browser renders or heavy checks were performed for this review. The root owns sequential tests/gates/build and actual native-web QA.

## Reviewed boundaries

- `RenderProfiles.ts` centralizes the two legacy resolution IDs (`1280x720`, `1920x1080`) and four new standard IDs (`720p`, `1080p`, `1440p`, `2160p`). Legacy dimensions and UI/API 30/60 FPS choices remain; default resolution stays `1920x1080`, and standard profiles default to 30 FPS.
- Public API resolves known profiles server-side, rejects unknown IDs and conflicting width/height declarations before launching Chromium, and verifies an optional video ID against the selected product package.
- `RenderIdentity.ts` binds product ID, video ID/hash, profile ID, dimensions, FPS, codec, pixel format and start time. Frame/job paths include profile and identity. No WF311613-specific resolution rule appears in these helpers.
- `FrameManifest.ts` refuses fresh-run reuse/overwrite of existing render frames. Explicit resume must match identity hash and range, with contiguous nonempty cached prefix. The CLI additionally rerenders sampled cached frames and requires exact PNG equality.
- `NativeSurface.ts` checks viewport, CSS canvas, backing canvas, drawing buffer and DPR=1 before capture; PNG dimensions are checked after capture. WebGL context/viewport/renderbuffer failures are explicit. FFmpeg receives already-native PNGs, with no upscale filter and no silent lower-resolution fallback.
- Web job frames are captured/written sequentially; only the current PNG buffer is retained. FFmpeg consumes files. Completed MP4 download uses a file stream rather than buffering the entire video in server RAM. Chromium closes on completion/cancellation/error; failed job cleanup is confined to that job directory.
- Metadata carries selected profile, native size/FPS, video identity, frame/output paths, real frame counts, stage/status, preview limits and completed encoded duration. Encoding progress is explicitly indeterminate rather than a fabricated percentage. Outputs are silent (`-an`).
- `SceneDiagnostics.ts` is read-only generic scene evidence for cross-resolution comparison; it does not drive assembly or resolution-specific simulation. Camera projection/raster dimensions are excluded, with camera pose/FOV audited separately.

## Compatibility observation resolved in the completed source

The interim source had reused the public 30/60 FPS whitelist for CLI requests, which would have newly rejected a historical numeric `OUTPUT_FPS` such as 24. After the observation was sent to the implementation agent, the final source separates CLI policy: positive finite explicit CLI FPS (including 24 and 23.976) remains supported, while public UI/API choices remain 30/60. A CLI request outside that public whitelist uses the historical no-profile viewport route, and `src/app/render/page.tsx` now propagates its explicit FPS query to `renderFps`. Source tests cover those cases; this report does not claim the tests have run.

The production render navigation keeps the request's exact same-origin host (including `127.0.0.1`) and waits for `domcontentloaded` followed by the actual deterministic renderer-ready predicate, rather than optional external network idle. The existing web-stage 60-second timeouts remain. A native failure reports its stage and reason without silently falling back to a lower resolution.

## Exact authorized-path inventory

The completed lightweight file-hash inventory found 11 changed existing source files and 12 added helpers/tests, with no changes/additions under the WF311613 product package. `authorized-generic-resolution-paths.json` now contains exactly those 23 paths and semantic categories; speculative or nonexistent filenames were removed. Newly inventoried tests are `ExportApi.test.ts`, `ExportJobManager.test.ts`, `FrameManifest.test.ts`, `NativeSurface.test.ts`, `RenderIdentity.test.ts`, `RenderProfiles.test.ts` and `SceneDiagnostics.test.ts`. Test presence is not a claim of PASS. The original 214-source freeze manifest remains unchanged, and the final source-boundary report must retain every authorized generic byte delta rather than assert all 214 files are unchanged after this authorized infrastructure phase.

## Historical source-lock caveat (no shim/waiver applied)

The approved 92-source micro checker contains generic `ExportJobManager.ts` and `FrameRenderer.ts` byte locks, while its native source-delta branch allows only `ProductViewer.tsx`. Newly user-authorized generic export modifications can therefore trigger that historical branch. Its code/thresholds remain unchanged. No read shim, cached manifest substitution or fabricated native PASS is applied. Preserve the pre-infrastructure PASS and record the new authorized generic byte deltas independently; rerun unchanged physical gates and presentation checks to NEW evidence.

## Remaining evidence needed

The root must run the requested sequential gates/tests/typecheck/lint/build and inspect the actual production UI/native captures/short encodes. This source review alone cannot establish functional job completion, cross-resolution state equality, 4K browser limits or caption proportions. The protected candidate/data hashes and source-boundary helper must pass after all agents finish, with every new path explicitly inventoried.
