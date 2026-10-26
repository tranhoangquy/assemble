# WF311613 — final 720p lofi master

FINAL MUSIC: DIRECTOR APPROVED (complete Pass02, AB, BC, ending and voice/spoken review).
VISUAL MASTER SHA: PASS — 0d5d898cbfaecb4573f07e818ce722c6884cbd4dc67d7c51b7c6c724f404ba0a
AUDIO MASTER SHA: PASS — 75b282e6e55a65923b00c152099f47e194b66c007f2e8053ccf6b9ec66690b2b
VIDEO STREAM IDENTITY: PASS — all 15,722 ordered packet hashes, PTS/DTS, durations, sizes/flags and codec extradata match the silent master. Frame count expected/actual: 15,722 / 15,722. H.264 1280×720, yuv420p, 30fps CFR preserved.
ZERO SFX FINAL: PASS — only approved Pass02 WAV mapped as audio; no additional processing except AAC encode.
FULL A/V DECODE: PASS — complete 15,722 video frames and AAC decoded with -xerror, no corruption.
FASTSTART: PASS — moov precedes mdat.

FINAL AUDIO: AAC LC, 48000Hz, 2 channels, 253582bps actual (256kbps target), 524.066667000s.
Integrated loudness: -20.0 LUFS.
True peak: -7.1 dBTP.
Decoded sample peak: -7.095001 dBFS.
Loudness range: 7.3 LU.
Clipping: PASS. Finite samples and no introduced internal silence detected. Declared audio sample duration is exactly 25,155,200 samples / 48kHz. Last packet and final fade preserved. No drift at the requested spot regions: zero-lag source/AAC correlation >0.99 and RMS difference <0.5dB. Final AAC payloads, PTS/DTS/order and skip metadata are identical to director-reviewed Pass02 preview. The container edit-list audio duration preserves 32 additional samples (0.667ms): movie_timescale=48000 preserves the exact WAV endpoint instead of the preview's default 1ms edit-list rounding. All AAC packet durations also match. No encoded AAC payload changed. No new actual listening claim is made.

Spot regions checked: intro 0s; AB 192–200s; BC 292–302s; late assembly 467s; showcase 503s; final presentation 517s; final fade 518.066667–524.066667s. Corresponding decoded video spot frames are losslessly identical to the silent master.

FINAL MP4: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/final-lofi-720p/WF311613-final-lofi-720p.mp4
Size: 47279961 bytes.
Duration: 524.066667 seconds.
SHA256: c42767184db43ce794aa165e9b60c6762c6551829833ed2f7ba60c7fdb42d457

Audio source: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/lofi-music-pass02/WF311613-lofi-mix-pass02.wav
Visual source: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/director-approved-full-720p-20261004/WF311613-director-approved-full-720p.mp4
Approved music edit and original provenance/credits were copied without changing wording. Historical pending-listening labels in copied provenance are superseded by director-approval-and-final-build.json. Source files and WAV/video hashes remain unchanged.

YOUTUBE CREDITS (exact preserved attribution block):

```text
Song: And So It Begins
Composer: Artificial.Music
Website: https://www.youtube.com/channel/UCC49uNuUk7pY77NoVMlNYDA
License: Free To Use YouTube license youtube-free
Music powered by BreakingCopyright: https://breakingcopyright.com

Song: Herbal Tea
Composer: Artificial.Music
Website: https://www.youtube.com/channel/UCC49uNuUk7pY77NoVMlNYDA
License: Creative Commons (BY 3.0) https://creativecommons.org/licenses/by/3.0/
Music powered by BreakingCopyright: https://breakingcopyright.com

Song: Way Home
Composer: Tokyo Music Walker
Website: https://www.youtube.com/channel/UC3lLfvhpPGtwd5qD25cMDcA
License: Free To Use YouTube license youtube-free
Music powered by BreakingCopyright: https://breakingcopyright.com
```

Detailed ffprobe, ordered packet evidence, AAC preview identity, decode logs, spot comparisons, zero-SFX graph, frozen edit plan/provenance, director approval record and SHA256 manifest are saved in this directory. No music/visual changes, rerender, additional resolution, upload, publishing or Option2 performed. STOP after final 720p mux and QA.

Nine stream-copy review MP4 excerpts are provided under review-clips/: intro, early assembly, AB, middle, BC, Steps25–27, late assembly, closed/open showcase and final hero/fade. Each full decode passed. The original historical semantic timeline was read only to locate Steps25–27/showcase; no historical audio asset or AudioCuePlan fed the final mix. Review clips may contain GOP/AAC preroll; requested/actual ranges are recorded in review-clips-manifest.json.
