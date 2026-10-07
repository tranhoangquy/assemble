# WF311613 Short02 — Music Edit Pass01

Status: **REQUIRES DIRECTOR AUDIO REVIEW**. Technical delivery PASS; actual agent listening NOT RUN. This is a selected review candidate, not final audio approval.

The approved 58-second picture is preserved by H.264 stream copy. The sole production audio input is the approved Pass02 WAV, SHA256 `75b282e6e55a65923b00c152099f47e194b66c007f2e8053ccf6b9ec66690b2b`. The arrangement uses only its A / Artificial.Music “And So It Begins” portion; it contains neither the Long A→B/B→C transitions nor B/C. No new song, loop, instrument, SFX, narration or ambience was added.

## Arrangement and timing

All ranges are half-open source PCM ranges at 48,000 Hz. Source sample cuts are exact. Global values below are nominal at the documented 1.02 music speed: WSOLA can move local transients within its windows, so these are not asserted exact post-process beat positions.

| Region | Pass02 source seconds | Exact source samples | Nominal output range |
|---|---|---|---|
| Established groove | 22.610000–50.110000 | 1,085,280–2,405,280 | 0–26.960784s |
| Later groove and release | 109.481000–141.766000 | 5,255,088–6,804,768 | 26.348039–58s |

The two regions overlap for 0.625s / 30,000 source samples, using complementary half-cosine weights summing to one. Nominal output crossfade is 26.348039–26.960784s (0.612745s), immediately before the connection section at 27s. The second source is advanced by a 59.996s phase offset versus continuous playback, approximately 24 bars at a provisional 96 BPM / 4/4. Spectral-onset phase similarity supports the cut; aural harmonic and downbeat alignment remain unconfirmed.

## Picture support

| Picture | Editing rationale and evidence | Listening status |
|---|---|---|
| 0–2 hook | Starts inside established groove, about 30ms before inferred bass attack. Only an 8ms de-click; no ambient lead-in or impact. RMS −16.61 dBFS. | NOT RUN |
| 2–27 assembly | One continuous source region maintains groove instead of edits for each operation. RMS −15.91 dBFS. | NOT RUN |
| 27–38 connection | Moves to later stronger phrase around 27s; smooth gain moves from 0 to +0.4dB over 27–38. RMS −15.58 dBFS. | NOT RUN |
| 38–46 mechanism | Stronger existing A region maintained with +0.4dB automation, no fabricated climax. RMS −15.08 dBFS. | NOT RUN |
| 46–52 legs/anchor | Same groove and gain continue, preventing premature ending. RMS −15.39 dBFS. | NOT RUN |
| 52–58 payoff | Automation rises gradually to +0.6dB by 56s. Inferred source attack near 140.6 and release near 140.7 map nominally near 56.86/56.96, letting the decay support the 57–58 hero. RMS −14.99 dBFS overall; final second −32.80. | NOT RUN |

These are intended musical roles inferred from signal structure, not claims of heard resolution or perceptual success. Director should specifically judge whether the quieter release under the final hero feels intentional and whether the connection splice is invisible.

## Processing and ending

Raw arrangement is 59.160s. FFmpeg WSOLA `atempo=1.02` makes a conservative +2% music-only tempo change with pitch preservation; the picture is unchanged. It returned 2,784,609 samples. Uniform linear sample-grid interpolation removes the 609-sample / 12.6875ms discrepancy to exactly 2,784,000 samples. This adds a rate ratio of 1.00021875 (+0.021875%, approximately +0.3787 cents); documented rather than claimed perfectly pitch-neutral. Tempo hypothesis after the main adjustment is about 98.07 BPM; beat/meter remain provisional.

Leveling uses a fixed +3.99dB gain. Automation is linearly interpolated in dB through (0,0), (27,0), (38,+0.4), (52,+0.4), (56,+0.6), (57.3,+0.6), (58,+0.6). No EQ, compression or limiter. `loudnorm` was used only to measure through a null sink, never to process delivery audio.

The source's existing quiet release is retained. A 0.7s half-cosine fade from 57.300000 to 58.000000s / samples 2,750,400–2,784,000 finishes the tail; the final PCM sample is zero. The 8ms entry de-click is 384 samples. WAV is 24-bit stereo PCM, 48kHz, exactly 58 seconds.

## Meaningful internal iterations

1. Continuous 22.610–80.610 excerpt was rejected structurally: its source sparse section would begin around picture37.39s and reduce mechanism/payoff energy; it lacked a designed ending.
2. Selected v2 uses the groove-to-groove one-beat complementary transition and source release at the ending.
3. v3 tests a one-bar equal-power overlap with the same body and ending. Its longer 2.45s nominal overlap increases simultaneous source material without structural benefit; selected v2 is the more focused structural candidate. No listening-based superiority is claimed.

Iteration audio, measurement logs and metadata are preserved under `internal-iterations/` and `evidence/internal-iterations.json`. Only v2 is offered as the Director review candidate.

## Measurements and verification

WAV: **−15.00 LUFS**, **−5.74 dBTP**, LRA1.50 LU. Encoded review AAC: **−15.01 LUFS**, **−5.83 dBTP**, LRA1.40 LU. No limiter was necessary. No clipping, nonfinite PCM values or interior 100ms windows below −70dBFS were detected. Seam derivative diagnostics are below the full-track maximum; these cannot substitute for listening checks for clicks, phase or musical artifacts.

Review video: 58.000000s,1080×1920,30fps,1,740 frames,H.264/yuv420p. Ordered video packet payload hashes and PTS/DTS/durations match the source; independent decoded frame/timestamp MD5 records match all1,740 frames. Full A/V decode and faststart PASS. Encoded audio aligns with WAV at zero measured lag at seven locations. The decoder exposes 256 trailing AAC padding samples (5.333ms), while the MP4 stream durations remain 58s; this is codec padding, not picture extension.

WAV SHA256: `d47f944271d3896f5c4bee0ce2c97bbb54e077daada318d7e23464990daf6c70`

Review MP4 SHA256: `8816b48c9faec27b1597b9ba44b769e2f5e4be367191058e4949908abd6fb7f3`

See `TECHNICAL-MEDIA-VERIFICATION.json`, `LISTENING-QA-REPORT.md`, `music-edit-plan.json` and `SHA256SUMS.txt`. Stop at Director audio review; no publication or final Short designation.
