# WF311613 — Music-only Pass 02 listening package

Status: COMPLETE_PASS02_DIRECTOR_LISTENING_REQUIRED. No final MP4.

Locked silent master: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/director-approved-full-720p-20261004/WF311613-director-approved-full-720p.mp4
SHA256: 0d5d898cbfaecb4573f07e818ce722c6884cbd4dc67d7c51b7c6c724f404ba0a; identity PASS before/after audio work. No video use or alteration.

## Timeline recalculation

B begins at 192.515000s = 195.015000 − 2.500000.
B source duration = 147.481125 − 41.155000 = 106.326125s.
B global OUT = 298.841125s.
C global IN = 294.841125s = B global OUT − 4s.
BC global crossfade: 294.841125–298.841125s.
BC shifted -8.919375s from Pass 01; source B OUT/C IN and 4s equal-power are preserved.
C source OUT is now 255.368645833s to reach exactly 524.066666667s. This extends C by 8.919375s; the final ending requires director review.
C requested source IN 26.143104s is quantized to 26.143104167s (nearest 48kHz sample).

## Source/global edits

| Track | Source IN–OUT (s) | Global IN–OUT (s) | Fixed gain |
|---|---|---|---|
| A | 0.000000000–195.015000000 | 0.000000000–195.015000000 | -10.41 dB |
| B | 41.155000000–147.481125000 | 192.515000000–298.841125000 | -10.79 dB |
| C | 26.143104167–255.368645833 | 294.841125000–524.066666667 | -9.88 dB |

AB locked: global 192.515000–195.015000s; 2.5s complementary half-cosine. Its review WAV is byte-identical to approved Candidate 1.
BC baseline retained: 4s sin/cos equal-power. Its review WAV is byte-identical to Pass 01 BC review despite the new global placement.
Intro retained: 1.5s half-cosine; intro review byte-identical to Pass 01.
Final fade retained: 518.066667–524.066667s, 6s half-cosine. Ending source content differs because downstream timing changed; review the new ending clip.

## QA

WAV: 48kHz stereo 24-bit PCM, exactly 25,155,200 samples/channel; 524.066666667s. Preview: AAC 48kHz stereo, requested 256kbps.
No re-normalization, loops, time stretch, pitch change, SFX, AudioCuePlan, narration or ambience. ZERO_SFX graph PASS. No interior 100ms window below −70dBFS outside allowed fades.
WF311613-lofi-mix-pass02.wav: full decode PASS; -20.0 LUFS; -7.6 dBTP; decoded sample peak -7.687831 dBFS; LRA 7.3 LU; SHA256 75b282e6e55a65923b00c152099f47e194b66c007f2e8053ccf6b9ec66690b2b.
WF311613-lofi-mix-pass02-preview.m4a: full decode PASS; -20.0 LUFS; -7.1 dBTP; decoded sample peak -7.095001 dBFS; LRA 7.3 LU; SHA256 91419b5584af8ae5e73e8cd04bddf81d2c1bc8dfbb71cf484e9f8f2305927ff3.

Pass 01 and revision-v2 evidence unchanged: PASS, all file hashes compared. Source asset hashes match director-supplied files. Master SHA unchanged.
VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING. No vocals/spoken/voice PASS is inferred from metadata or metrics.
No actual listening-capable tool is available. AB has director approval; complete Pass 02, BC, ending and no-voice compliance await director listening.
Final MP4, VIDEO_STREAM_IDENTITY, full A/V decode and review MP4 excerpts: NOT RUN, deliberately pending complete soundtrack approval.
STOP after this audio package. Director must approve complete Pass 02 before final stream-copy mux.

Output directory: /Users/quyth/development/three/POC/output/wf311613-standalone-murphy-bed/final/lofi-music-pass02
Detailed provenance, edit plan, source/global sample indices, ffprobe, metrics, zero-SFX graph, credits, frozen historical hashes and SHA256 manifest are saved alongside audio.
