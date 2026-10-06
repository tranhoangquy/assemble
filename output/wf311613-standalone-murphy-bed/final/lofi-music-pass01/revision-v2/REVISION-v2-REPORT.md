# WF311613 — transition revision v2

Status: WAITING_FOR_DIRECTOR_AB_SELECTION

Three technical audition alternatives were generated. No listening capability is available; phrase/downbeat/chord compatibility and perceptual PASS are not claimed. Local source transient anchors are supporting evidence only.

| Candidate | A source OUT | B source IN | Proposed global crossfade | Duration | Curve |
|---|---:|---:|---|---:|---|
| 1 | 195.015000s | 41.155000s | 192.515000–195.015000s | 2.500000s | complementary half-cosine |
| 2 | 198.780000s | 43.925000s | 194.780000–198.780000s | 4.000000s | sin/cos equal-power |
| 3 | 191.040000s | 48.080000s | 189.193854–191.040000s | 1.846146s | sin/cos equal-power |

Global values assume A retains source 0s at video 0s. All clip source/global IN/OUT values are recorded exactly in revision-v2-edit-plan.json. Full B/C placement is deferred until the director chooses an AB transition; none is asserted to fit the previous full soundtrack unchanged.

Gain remains A −10.41 dB, B −10.79 dB, C baseline −9.88 dB. No numerical re-normalization or added processing. Each clip is 48kHz stereo 24-bit PCM and contains 10s before, the entire overlap, and 10s after. Full decode and sample headroom checks passed. Clip LUFS is not a full-mix loudness measurement.

Candidate 1: Short overlap, incoming B moved deeper into the established body; local transient anchors around A 195s / B 41s. Complementary curves reduce simultaneous layer energy. Phrase/downbeat alignment remains a director listening hypothesis.
Candidate 2: Preserve 4-second overlap as comparison, change both source anchors and move B beyond its original 35-second entry. Tests whether the source pair, rather than duration, caused the obvious restart.
Candidate 3: Earlier alternative A boundary and later B groove entry, with about one 130-BPM B bar of overlap. Shorter overlap tests reduced drum/bass/melody collision. No tempo change is applied.

B→C unchanged: source B OUT 147.481125s; C IN 26.143104s; global 303.760500–307.760500s; 4s equal power. Nearby technical transient proposals are recorded, but no audible improvement was demonstrated. Original baseline retained.
Ending unchanged: global 518.066667–524.066667s, 6s half cosine. No new ending file created.
VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING: inspect the actually used B material, including these entries; metadata does not prove vocals and no automatic rejection was made.
Pass 01 evidence hashes unchanged: PASS. No SFX, narration, ambience, additional track, loops, time stretch, video retiming, full-WAV rebuild or MP4 mux.
STOP: director chooses candidate 1/2/3 or requests another source pair; only then rebuild the complete audio and continue the listening gate.
