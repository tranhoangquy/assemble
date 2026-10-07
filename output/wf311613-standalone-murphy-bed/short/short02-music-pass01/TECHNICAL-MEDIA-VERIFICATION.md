# WF311613 Short02 — Technical Media Verification

Technical media: **PASS**. Listening: **NOT RUN**. Approval: **REQUIRES DIRECTOR AUDIO REVIEW**.

| Property | Verified result |
|---|---|
| Picture | 58.000000s;1080×1920;30fps;1,740frames;H.264/yuv420p |
| Picture identity | Ordered payloadSHA/packet PTS,DTS,duration and decoded frame/timing MD5 identical to approved master |
| WAV | PCM24-bit;48,000Hz;stereo;2,784,000samples/channel;58s |
| Review audio | AAC256k target;48,000Hz;stereo;MP4 declared58s |
| WAV loudness | −15.00LUFS;−5.74dBTP;LRA1.50LU |
| Encoded loudness | −15.01LUFS;−5.83dBTP;LRA1.40LU |
| Full A/V decode | PASS |
| Faststart | PASS: moov precedes mdat |
| Audio alignment | Zero samplelag at1,25,26.7,35,43,53,56.8s;correlations>0.9998 |
| Codec padding | Decoder exposes256 trailingAAC samples/5.333ms;MP4 durations remain58s |
| Clipping/silence | Zero clipped samples;no interior100ms windows below−70dBFS |
| Actual listening | NOT RUN;perceptual transition/ending/voice require Director listening |

Detailed probes, packet hashes, all-frame MD5 comparisons, loudness/decode logs and sync measurements are under `evidence/` and `TECHNICAL-MEDIA-VERIFICATION.json`. Frame generation and visual retiming were not performed. App tests are not applicable to this audio-only output task; no application source was edited.
