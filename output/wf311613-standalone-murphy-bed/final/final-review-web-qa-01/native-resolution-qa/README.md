# Native resolution QA — output-only helpers

Prepared without starting a browser, rendering a frame or running a heavy check.
These helpers are not application source and do not change the candidate.

Run only after the full fresh 720p review master has been verified, generic
profile infrastructure is implemented and the sequential regression gates pass:

```sh
RENDER_URL=http://localhost:3016 RUN_SHORT_PROOFS=1 node --import tsx output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/capture-native.mjs
node --import tsx output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/native-resolution-qa/verify-native.mjs
```

`capture-native.mjs` loads `getRenderProfile` from the authoritative generic
registry at `src/engine/export/RenderProfiles.ts`, validating the four requested
profiles before launching a browser. It runs one profile at a time. At each
native size it captures the same twelve approved timestamps with no camera
override, device scale factor 1 and no post-upscale. Browser viewport, canvas CSS
dimensions, canvas backing buffer, actual WebGL drawing buffer and PNG dimensions
must match the selected profile.

The diagnostic `window.__VIDEO_RENDERER__.getSceneState()` is required. The
previous API exposed only camera/time and did **not** expose full object state.
These scripts never fabricate state from pixel similarity. The generic read-only
API must serialize stable object transforms, visibility, hardware/mechanism state,
geometry variants, lighting and presentation state without runtime UUIDs,
resolution-specific projection/aspect matrices or raster dimensions. Actual
camera state is captured separately. Raw per-checkpoint diagnostics are saved.

The twelve timestamps derive from the frozen candidate and approved checkpoint
list, adding `S6-complete` for B8. The first hardware close-up is the common start
of the optional two-second encode proofs. Sixty fresh native PNGs per profile
are captured with the real renderer API, then encoded sequentially with H.264 /
yuv420p / 30 fps / no audio. No historical PNG/MP4 is used and no scale filter is
passed to FFmpeg. The proof frames are incremental disk writes, not a video-wide
in-memory sequence.

The verifier checks the source PNG dimensions/hashes, actual state equality,
camera equality, caption content and normalized layout, reset excursions, proof
contiguity/properties/decode, and approved Step 26 camera. It produces four-column
comparison sheets and one overview. **Only comparison thumbnails are downscaled**;
native stills and native proof sources remain untouched. Root must inspect those
sheets visually. Technical PASS does not imply director approval.

The helpers refuse to overwrite existing QA outputs. A failed capture is retained
with its manifest; diagnose it and use a separately authorized new evidence folder
for a retry rather than deleting history. No full 1080p/1440p/2160p render occurs.
