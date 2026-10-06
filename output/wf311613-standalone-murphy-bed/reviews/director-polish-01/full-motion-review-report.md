# Director Polish 01 — full motion review export

Status: exported and technically verified; awaiting director review. **Not final production approval.**

## Deliverable

[Continuous Steps 1–31 MP4](wf311613-director-polish-01-full-review.mp4)

Exact path:

`/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/reviews/director-polish-01/wf311613-director-polish-01-full-review.mp4`

[Video player and decoded-frame gallery](full-motion-review.html) · [Verification contact sheet](full-motion-verification/contact-sheet.png)

| Property | Verified result |
| --- | --- |
| Candidate | `wf311613-director-polish-01` |
| Encoded duration | **498.266667 seconds — 8:18.266667** |
| Frame count | **14,948** |
| Resolution / FPS | **1280 × 720 / 30 fps** |
| Codec / pixel format | **H.264 / yuv420p** |
| Audio | **None** |
| File size | 28,391,436 bytes |
| Timeline duration | 498.253693888889 seconds |

The 0.012973-second duration difference is normal final-frame rounding at 30 fps. No timeline speed multiplier was used.

SHA-256:

`70f131483e1baf4d1fe2b55f2824907221f1ab6af387802d26581080453bdcd9`

## Validation before export

The existing polish/mechanical gate suite was rerun before rendering. All **11 mechanical/determinism gate groups plus the baseline-lock gate PASS**, with zero errors and no assembly warnings. The suite covers assembly, structural installation paths, front-stage actual meshes, mechanisms, hardware/apertures, Step 28 access, folding legs, bearing receiver paths, piston sweeps, whole-scene seeks/resets, and B8 closure.

No tolerance, collision threshold, contact rule or exemption was weakened. A fresh production build also passed; the pre-existing broad export-file-pattern build warning remains non-blocking. No dependency or application-source changes were made for this export.

[Gate results](validation-results.json)

## Deterministic provenance / frozen candidate

This export was rendered from a new empty frame directory, starting at timeline time 0. Frame `i` was sampled at `i / 30` seconds through the current browser frame renderer. The captured sequence is contiguous from `frame-000000.png` through `frame-014947.png`: **14,948 files, no missing indices**.

FFmpeg used that PNG sequence as its only media input. **No historical MP4 input, concatenation, cached prefix, or resumed historical sequence was used.** The render used the existing generic `scripts/render-video.ts`, with explicit project ID, 1280 × 720, 30 fps, start time 0, resume frame 0, and no frame limit.

The candidate was frozen before the gate rerun/build. After export, all **175 source/script file hashes match** the freeze. The product, assembly, DirectorPlan, video definition and camera-presets hashes also match.

| Frozen identity | SHA-256 |
| --- | --- |
| Product | `4645bcf33682cbf377d84a2d0f8139674b6d80f5a5014a29505bf97287f82a45` |
| Candidate DirectorPlan | `e40e3ba17aeab9ed26545fe17013cf90f5a21443d7a7d3434a73bff8b7d8f6d7` |
| Candidate assembly | `27c5e70e0388550bf1ae66eb5e4010ec7a8ea3956cad7081039ecfc0576fdfc5` |
| Candidate video | `c7dcb91022b7eeb60b5fbac8767f241a18d0045a945b7b4dd7f013de8bea146d` |
| Camera presets | `d9a60f634250e3f493a33a8313d57c25b3d1e3ef79d9c87c7d63e1d455b450b4` |

The video-export browser was checked against all 20 approved still-checkpoint camera states. Position, target, direction and FOV match **exactly**, including the backward seek into the final closed view. Its runtime matches the expected candidate timeline. No camera fitting or regeneration was run during export.

The video renderer uses the existing explicit Chromium executable; the still renderer uses Playwright's default headless launch. Their fresh PNGs are not byte-identical: the average absolute 8-bit channel difference over the 20 preflight images is approximately 0.207/255. These small raster differences are recorded, not treated as source/camera changes. Candidate hashes and camera-state comparisons are the identity checks. The completed MP4's decoded frames were also inspected.

Preserved without additional directing changes:

- Current front workspace and Step 25 three-segment supported route; no restoration of the seven-segment transport.
- Current audited camera overrides and instructional close-ups.
- Current restrained bedroom, work supports, lighting, exposure and fog.
- Current product materials, geometry, bores, axes, topology and mechanisms.
- Every current assembly action; Step 1–3 pacing, locked Step 4–20 timings and current Step 21–31 timings.
- Existing final closed/open presentation.

No furniture, decoration, textures, lighting effects, depth of field, audio/music or Option 2 implementation was added. The earlier accepted full-assembly MP4 remains untouched.

[Freeze record](full-motion-freeze.json) · [Browser/camera identity verification](full-motion-browser-verification.json) · [Preflight raster comparison](full-motion-preflight-verification.json)

## Post-export verification

- `ffprobe -count_frames`: H.264, yuv420p, 1280 × 720, average and nominal frame rate 30/1, 14,948 decoded frames, 498.266667-second duration, one video stream and no audio stream.
- Complete strict decode: `ffmpeg -xerror -err_detect explode` decoded the entire MP4 to null with exit code 0 and no decode error.
- The frame-directory count, encoded frame count and fully decoded frame count agree.
- Fourteen representative frames were decoded **directly from the completed MP4**, not copied from source PNGs or historical exports. Extraction uses exact frame indices, nearest to the requested times at 30 fps.
- Decoded-frame comparisons against their corresponding newly rendered source PNGs give approximately 42.55–46.50 dB PSNR, consistent with the current lossy H.264 review encoding. They were visually inspected for the reviewed composition and connection views.

| Verification view | Frame | Encoded time |
| --- | ---: | ---: |
| Early assembly | 319 | 10.633 s |
| 03:44 / Step 14 | 6720 | 224.000 s |
| Step 25 front-stage context | 11072 | 369.067 s |
| Step 25 supported lift/approach | 11173 | 372.433 s |
| Step 25 bearing alignment | 11255 | 375.167 s |
| Step 25 controlled lowering | 11285 | 376.167 s |
| Step 25 bearing seating | 11352 | 378.400 s |
| Step 25 retainer installation | 11398 | 379.933 s |
| Step 25 connected pullback | 11515 | 383.833 s |
| Step 28 folding-leg work | 12364 | 412.133 s |
| Step 29 leg pivot | 13450 | 448.333 s |
| Step 30 wall anchoring | 13926 | 464.200 s |
| Final closed | 14714 | 490.467 s |
| Final open | 14933 | 497.767 s |

[ffprobe output](full-motion-ffprobe.json) · [Full export verification](full-motion-verification.json) · [Decoded-frame gallery](full-motion-review.html)

## Stop

No additional polish pass has begun. This is the requested 720p silent full-motion director review, not a 2K/4K or YouTube production master. Await director review of this MP4 before making further changes.
