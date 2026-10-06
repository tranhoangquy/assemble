# WF311613 — Audio / Sound Design Pass 01

Technical QA: PASS. SFX ONLY. **MUSIC_ASSET_REQUIRED**.

[Audio Pass 01 full review](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/WF311613-audio-pass01-720p.mp4) · [48kHz stereo SFX mix](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/WF311613-SFX-pass01.wav).

The director-approved silent master is immutable and preserved. No Three.js render was run. All15,722 encoded H.264 video packets, hashes, PTS, DTS and duration fields match the silent master exactly. No source, product, material, assembly, camera, caption, bedroom, bedding, intro, showcase or render-profile changes were made.

## Audio design and provenance

No explicitly approved music file or approved SFX library was found in the project. Existing music approval/mux code is infrastructure, not a licensed music asset. No music was searched, selected or downloaded. No external samples, narration or workshop ambience were used.

Eight original procedural effects were generated locally: soft wood contact, dry dowel seat, muted mechanical seat, restrained driver friction, cam turn, mechanism movement, hinge movement and soft wooden completion. These are procedural approximations, not recorded foley. Deterministic filtered noise/damped resonances, seeds, sample format, hashes, attribution and modification status are in [asset-provenance.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/asset-provenance.json). No third-party audio license is asserted or invented.

The intro/exploded overview stays silent. Mechanical section25–27 receives seating/retaining sounds and a soft motion test. Close/open movements receive quiet continuous friction; final closed seating and leg end positions receive subdued contact. Mattress/bedding and final hero stay calm and silent. The last cue decays well before the file end.

## Cue plan and repetition

[AudioCuePlan.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/AudioCuePlan.json) contains115 selected cues from514 candidates;399 omitted events are documented in [omitted-cues.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/omitted-cues.json). Counts are semantic audio cues, not hardware quantities. Most repeated fasteners are intentionally silent; first representatives, occasional handed counterparts and important joints carry the sound.

Times derive from the unchanged actual DirectorPlan shots and compiled assembly actions, with cumulative scene/shot offsets and the existing5-second prefix. Every cue records global time, step, shot, operation/action, part/hardware, asset, gain/fades, rationale and original action. Full exported read-only timing data: [semantic-timeline.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/semantic-timeline.json).

Contact cues align to the first30fps master frame showing completed seating, never the preceding frame. Driver sounds are confined to the executable screw-feed/spin window after approach/contact. Cam sounds follow actual seated tightening rotation. Movement sounds remain within articulated movement; their tails fade before the action ends. Natural short contact decay follows contact.

| Semantic type | Cue count |
|---|---:|
| PART_SEAT | 20 |
| DOWEL_INSERT | 10 |
| CAM_INSERT | 12 |
| BOLT_TIGHTEN | 15 |
| CAM_TURN | 6 |
| SCREW_TIGHTEN | 12 |
| BRACKET_PLACE | 8 |
| BEARING_SEAT | 3 |
| PISTON_ATTACH | 4 |
| NUT_TIGHTEN | 6 |
| MECHANISM_MOVEMENT | 1 |
| BED_OPEN | 3 |
| LEG_ATTACH | 2 |
| LEG_MOVEMENT | 4 |
| MECHANISM_CLICK | 4 |
| WALL_ANCHOR | 2 |
| BED_CLOSE | 2 |
| FINAL_SOFT_CONFIRMATION | 1 |

## Mix and technical QA

- Output duration: 524.066667s (08:44.067), matching silent master.
- Video: native1280×720,30fps,H.264,yuv420p; copied, not re-encoded.
- Audio: AAC,48kHz,stereo,192kbps encoder setting; MP4 faststart.
- Encoded true peak: -13.8dBTP. Decoded sample peak: -13.77dBFS. No clipping.
- Integrated loudness: -33.1LUFS. This sparse SFX-only mix deliberately retains quiet rests; it is not normalized to a music/programme target.
- Full A/V decode: PASS, no decode errors. Audio starts at0; video and audio durations match. All selected cues have valid paths, phase bounds and nonzero decoded energy. No cue tail is truncated.
- All22 frozen approved source hashes still match. Original silent MP4 SHA256 remains`0d5d898cbfaecb4573f07e818ce722c6884cbd4dc67d7c51b7c6c724f404ba0a`.
- Audio Pass01 MP4 SHA256: `dc31ddef1f7182e74999e6c0c7cc4207a054729371fa358e65f41218c9fec86f`.

Evidence: [Review-clip A/V sync and decode checks](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips-sync-QA.json), [AUDIO-QA.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/AUDIO-QA.json), [video-stream-identity.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/video-stream-identity.json), [sync-verification.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/sync-verification.json), [output-ffprobe.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/output-ffprobe.json), [loudness-summary.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/loudness-summary.json), [waveform-summary.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/waveform-summary.json), [Waveform/peak overview](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/WAVEFORM-OVERVIEW.png), [Representative cue frames from frozen master](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/CUE-SYNC-MASTER-FRAMES.png), [full-av-decode.log](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/full-av-decode.log).

Sync QA is based on deterministic executable action phases, existing master frames and post-encode energy checks. AAC is perceptually coded; sample-exact encoded waveform identity is not claimed. Representative master frames were visually inspected at contact/driver cue positions. Listening approval of procedural timbre, realism, fatigue and balance remains with the director; a human listening sign-off is not claimed.

## Review clips A–G

All excerpts use video/audio stream copy. Boundaries expand to source keyframes to avoid visual re-encoding; exact requested and actual ranges are in [review-clips.json](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips.json). Any boundary preroll is a trim/container property, not a visual design change.

| Clip | Content | Source range, seconds | Duration |
|---|---|---|---:|
| A | [Early assembly](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips/A-early-assembly.mp4) | 4.633–35.633 | 31.135s |
| B | [Cam / dowel connection](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips/B-cam-dowel.mp4) | 9.367–26.000 | 16.787s |
| C | [Screw / bolt tightening](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips/C-screw-bolt.mp4) | 117.200–135.567 | 18.513s |
| C2 | [Supplemental bolt tightening](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips/C2-bolt-tightening.mp4) | 382.067–389.233 | 7.305s |
| D | [Steps25–27 mechanism](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips/D-steps25-27-mechanism.mp4) | 369.033–408.833 | 39.940s |
| E | [Folding-leg attachment/test](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips/E-folding-legs.mp4) | 436.733–461.967 | 25.383s |
| F | [Wall anchors](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips/F-wall-anchors.mp4) | 453.633–491.567 | 38.120s |
| G | [Closed/open showcase](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/review-clips/G-close-open-showcase.mp4) | 501.267–517.267 | 16.149s |

## Reproduction and stop

Output-only scripts are retained: [export-timeline.mjs](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/export-timeline.mjs), [build-audio.py](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/build-audio.py), [qa-audio.py](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/qa-audio.py), [make-review-evidence.py](/Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/audio-pass01/make-review-evidence.py). Run timeline export with`node --import tsx`; run Python scripts using the bundled Python runtime with NumPy/Pillow. Mux the generated WAV against the approved silent MP4 with`-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -t 524.066667 -movflags +faststart`, into a new output path. QA verifies the approved master SHA before processing.

Stopped after Audio Pass01. **MUSIC_ASSET_REQUIRED**. Returned for director listening/review. No narration, high-resolution variant, publication/upload or Option2 was started.
