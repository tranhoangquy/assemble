# Frozen final-review/web-QA 01 verification artifacts

These helpers are export/verification artifacts only. They do not edit any product, camera, assembly, engine or validator source. Run from the repository root with the existing `tsx` loader.

Before export:

```sh
RENDER_URL=http://localhost:3016 node --import tsx output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/verify-whole-scene.mjs
```

This loads the approved baseline only to capture Step 1 at zero. It then uses the actual current micro-pass renderer without inspection-camera overrides. It compares exact PNG hashes and exact camera states at 30 forward/reverse checkpoints, plus intro → Step 1 → finished hero → Step 26 → intro → Step 1 reset excursions. Showcase comparisons include the real room, lighting, props, mattress and bedding. B8 receives a source-plan-derived Step 6 completion checkpoint. It writes only new evidence and refuses to overwrite its prior report.

After a successful fresh time-zero render:

```sh
node --import tsx output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/verify-master.mjs ABSOLUTE_FRESH_FRAMES_DIRECTORY ABSOLUTE_NEW_MP4_PATH
```

Expected root-produced evidence files in this directory:

- `render-provenance.json`: candidate, frames, output, resumeFromFrame=0, expectedFrames, timelineDuration, videoSha256, planSha256, camerasSha256.
- `render-exit.json`: original renderer exit code and signal.
- `render.log`: original renderer output, including successful exact output path.
- `frozen-source-hashes.json`: map of source paths to SHA-256 under `hashes`.
- `preserved-history-hashes.json`: original QA/history map, copied byte-for-byte from the approved freeze.
- `whole-scene-seek-verification.json`: successful pre-export browser comparison.

The verifier requires unchanged approved identities, contiguous nonempty 1280×720 source PNGs, one H.264/yuv420p 30fps video stream, zero audio streams, complete decoding, constant frame timestamps and no black interval. Actual MP4 frames are selected by exact frame index in one decode pass, not by approximate seeking and never from historical videos. Expected count is 15,722 frames, with normal encoded duration 524.066667 seconds for the 524.053694-second deterministic timeline.

Run post-render verification BEFORE authorized generic web/export infrastructure changes, because the full approved 214-source freeze remains authoritative for this initial known-good review render. Later infrastructure validation should keep product/video identities separate from its permitted shared-host deltas.

Decoded stills and their contact sheet require visual inspection. Technical PASS is not a claim of director approval.

No render is initiated by either verifier.
