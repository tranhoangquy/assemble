# WF311613 — MUSIC-ONLY PASS 01: listening candidate

Status: LISTENING_QA_REQUIRED_BEFORE_MUX

Acquisition gate: PASS for the three director-supplied local files only. Original download failures remain historical evidence; no downloads were attempted during this build.
Visual master: SHA256 PASS; silent input verified. Approved video has not been modified or muxed.
Identity: director A/B/C assignments, filenames containing exact approved video IDs, and durations agree with inspected YouTube track records. This is not an independent audio fingerprint or a listening verification. Actual content/version verification remains part of listening QA.

## Provisional edit

A → B → C. No complete-song concatenation, looping, tempo/pitch change, SFX, narration or ambience.
All source cut points are technical audition candidates; the 4-beat grid does not establish musical phrase/downbeat identity. Gains match measured selected-segment LUFS, not confirmed perceptual loudness.

A — Artificial.Music / And So It Begins: source 0.000000–199.520500s; global 0.000000–199.520500s; gain -10.41 dB; SHA256 419442217a6d6300803a3d552eb7b4451a156a6fe671e19a449cdef55698a132.
B — Artificial.Music / Herbal Tea: source 35.241125–147.481125s; global 195.520500–307.760500s; gain -10.79 dB; SHA256 d2685ec597c6fbefe73afcf134827b8692d5a12730787cf5f692c04aa54a3e80.
C — Tokyo Music Walker / Way Home: source 26.143104–246.449271s; global 303.760500–524.066667s; gain -9.88 dB; SHA256 dc5daba50f889602e26207c1cc3ddb22e5f6b5d352235621f6e9c445f07caf5d.

A→B: global 195.520500–199.520500s (03:15.521–03:19.521).
B→C: global 303.760500–307.760500s (05:03.761–05:07.761).
Both crossfades: 4s sin/cos equal power, provisional pending listening.
Opening fade: 1.5s half cosine. Final fade: 518.066667–524.066667s, 6s half cosine; musical resolution pending listening.
B source analysis: low-level opening until about 35s, quieter internal passage around 65–90s, sparse late section around 150s onward. Candidate uses 35.241125–147.481125s, preserving its internal dynamics.
C source analysis: low-level opening until about 22s; candidate starts 26.143104s and leaves before sparse late section near 249s.
A source analysis: natural opening retained; pronounced internal energy changes retained; source ending drops rapidly after about 204s, candidate exits at 199.520500s.

## Technical QA

WAV: 48kHz, stereo, 24-bit PCM, exactly 25,155,200 samples/channel = 524.066666667s. Preview: AAC 48kHz stereo, requested 256kbps.
No internal 100ms window below −70 dBFS outside allowed master fades. Finite samples and no added sample clipping. These checks do not validate musical continuity or rule out audible clicks.
Zero-SFX graph: PASS for candidate. Only three hashed director-supplied music files feed the mix.

WF311613-lofi-mix-pass01.wav: full audio decode PASS; -20.0 LUFS; -7.6 dBTP; decoded sample peak -7.688 dBFS; LRA 7.0 LU; SHA256 ffc5725e8581d0803d574a4fc5e4f899c62d906c2796a121c279ae57f5530fac.
WF311613-lofi-mix-pass01-preview.m4a: full audio decode PASS; -20.0 LUFS; -7.7 dBTP; decoded sample peak -7.749 dBFS; LRA 7.0 LU; SHA256 5116af86760845a79cf6e7236920b3a1c88e26e64fe9646f893e57fdd2d74371.

## Required listening gate

NOT PERFORMED: source listening, exact content/version verification, intro/body/outro confirmation, phrase/downbeat validation, perceptual gain matching, A/B and B/C transitions, bass/drum/melody collisions, voice/spoken-sample absence, complete 08:44 listening and intentional ending.
The publisher page tags Herbal Tea as Male under Voice Tags. This does not establish that vocals are present; source listening must resolve compliance with the no-voice requirement.
No listening-capable tool is available in this environment. Do not represent technical analysis as listening QA. Review the full audio and transition/intro/end clips, then approve or request specific revisions before final mux.
Final MP4, review MP4 excerpts, VIDEO_STREAM_IDENTITY and FULL_A/V_DECODE: NOT RUN pending actual listening gate. Required final source is the locked silent master; final mux must use video copy and compare all video packets, PTS/DTS and hashes.
No director final approval is claimed. No upload, high-resolution render, Option 2, product/code/camera/web changes were performed.

## Evidence

music-provenance.json; music-edit-plan.json; loudness-peak-report.json; audio-technical-qa.json; zero-SFX-verification.json; YOUTUBE-MUSIC-CREDITS.txt; source analyses and logs under evidence/; reproducible scripts under build/; SHA256SUMS.txt.

## Master and source metadata

Approved silent master: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/director-approved-full-720p-20261004/WF311613-director-approved-full-720p.mp4
SHA256: 0d5d898cbfaecb4573f07e818ce722c6884cbd4dc67d7c51b7c6c724f404ba0a
Identity: PASS, checked before and after audio work.

### Track A

Title: And So It Begins
Artist: Artificial.Music
Director URL: https://www.youtube.com/watch?v=BH-SnQ8J1VU&list=PLfP6i5T0-DkIMLNRwmJpRBs4PJvxfgwBg&index=1
Local production file: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/lofi-music-pass01/sources/A-director-supplied.mp3
Original supplied path: /Users/quyth/Downloads/YTSave_YouTube_Media_BH-SnQ8J1VU_No-Copyright-Music-Artificial-Music-And-So-It-Begins-Lo-fi_008_128k.mp3
SHA256: 419442217a6d6300803a3d552eb7b4451a156a6fe671e19a449cdef55698a132
Codec: mp3; sample rate: 44100Hz; channels: 2; bitrate: 179119bps; duration: 208.329433s.
Stated license: YouTube Free license
YouTube use: Explicitly allowed with credits
Commercial use record: Not independently verified; track A page FAQ says yes subject to license terms, with generic CC explanation
Content ID record: Registration in copyright detection systems prohibited. No no-claim/no-Content-ID guarantee established.
Attribution required: yes.

```text
Song: And So It Begins
Composer: Artificial.Music
Website: https://www.youtube.com/channel/UCC49uNuUk7pY77NoVMlNYDA
License: Free To Use YouTube license youtube-free
Music powered by BreakingCopyright: https://breakingcopyright.com
```

### Track B

Title: Herbal Tea
Artist: Artificial.Music
Director URL: https://www.youtube.com/watch?v=6ukEy6FOxZE&list=PLfP6i5T0-DkIMLNRwmJpRBs4PJvxfgwBg&index=6
Local production file: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/lofi-music-pass01/sources/B-director-supplied.mp3
Original supplied path: /Users/quyth/Downloads/YTSave_YouTube_Media_6ukEy6FOxZE_Non-Copyrighted-Music-SmartToaster-Herbal-Tea-Lo-fi_008_128k.mp3
SHA256: d2685ec597c6fbefe73afcf134827b8692d5a12730787cf5f692c04aa54a3e80
Codec: mp3; sample rate: 44100Hz; channels: 2; bitrate: 166874bps; duration: 184.784399s.
Stated license: Creative Commons Attribution 3.0
YouTube use: Explicitly allowed with credits
Commercial use record: Not independently reviewed beyond stated per-track license
Content ID record: Registration in copyright detection systems prohibited. No no-claim/no-Content-ID guarantee established.
Attribution required: yes.

```text
Song: Herbal Tea
Composer: Artificial.Music
Website: https://www.youtube.com/channel/UCC49uNuUk7pY77NoVMlNYDA
License: Creative Commons (BY 3.0) https://creativecommons.org/licenses/by/3.0/
Music powered by BreakingCopyright: https://breakingcopyright.com
```

### Track C

Title: Way Home
Artist: Tokyo Music Walker
Director URL: https://www.youtube.com/watch?v=Q7HjxOAU5Kc&list=PLfP6i5T0-DkIMLNRwmJpRBs4PJvxfgwBg&index=7
Local production file: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/lofi-music-pass01/sources/C-director-supplied.mp3
Original supplied path: /Users/quyth/Downloads/YTSave_YouTube_Media_Q7HjxOAU5Kc_Copyright-Free-Chill-Background-Music-Way-Home-by-tokyowalker4038_009_128k.mp3
SHA256: dc5daba50f889602e26207c1cc3ddb22e5f6b5d352235621f6e9c445f07caf5d
Codec: mp3; sample rate: 44100Hz; channels: 2; bitrate: 190715bps; duration: 278.198277s.
Stated license: YouTube Free license
YouTube use: Explicitly allowed with credits
Commercial use record: Not independently reviewed beyond stated per-track license
Content ID record: Registration in copyright detection systems prohibited. No no-claim/no-Content-ID guarantee established.
Attribution required: yes.

```text
Song: Way Home
Composer: Tokyo Music Walker
Website: https://www.youtube.com/channel/UC3lLfvhpPGtwd5qD25cMDcA
License: Free To Use YouTube license youtube-free
Music powered by BreakingCopyright: https://breakingcopyright.com
```

