from pathlib import Path
import json,hashlib,math
R=Path(__file__).resolve().parents[1]; WORK=Path('/Users/quyth/development/three/POC'); PRODUCT=R.parents[1]
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def save(p,d):p.write_text(json.dumps(d,indent=2)+'\n')
plan=json.loads((R/'music-edit-plan.json').read_text()); c=plan['selected_candidate']; tech=json.loads((R/'TECHNICAL-MEDIA-VERIFICATION.json').read_text()); clips=json.loads((R/'review-clips-manifest.json').read_text()); pre=json.loads((R/'evidence/source-preflight.json').read_text())
c['measured_loudness_interpretation']='input_* fields are measurements of actual WAV. output_* and normalization_type are discarded loudnorm-to-null diagnostics, NOT production processing.'
c['processing']['additional_rate_pitch_cents']=1200*math.log2(1.00021875)
c['global_timestamp_precision']='Nominal source-to-output mapping at 1.02 music speed. WSOLA local phase displacement is not constant; global splice timestamps are nominal, not guarantees of exact transient position after WSOLA. Final WAV length and gain/fade sample grids are exact.'
c['global_crossfade']['nominal_output_start_sample']=round(c['global_crossfade']['start']*48000);c['global_crossfade']['nominal_output_end_sample']=round(c['global_crossfade']['end']*48000)
plan['final_gain_fade_sample_grid']={'entry_declick_samples':384,'final_fade_start_sample':2750400,'final_fade_end_exclusive':2784000}
plan['meter_hypothesis']='4/4 inferred, not listening-confirmed; approximately one beat source overlap; source phrase offset 59.996s corresponds approximately to 24 bars at 96 BPM.'
plan['encoded_review_loudness']=tech['audio']['encoded_loudness'];save(R/'music-edit-plan.json',plan)
provpath=PRODUCT/'final/lofi-music-pass02/music-provenance.json';longprov=json.loads(provpath.read_text());approval=PRODUCT/'final/final-lofi-720p/director-approval-and-final-build.json';a=longprov['tracks'][0]
prov={'project':'WF311613 Short02 Music Pass01','status':'REQUIRES DIRECTOR AUDIO REVIEW','production_input':plan['source'],'used_tracks':[a],'unused_tracks':['B — Herbal Tea','C — Way Home'],'production_input_only_approved_pass02_wav':True,'director_supplied_original_acquisition':'Historical A file supplied by director; no reacquisition performed. Raw MP3 was not a production input to this edit.','inherited_provenance':{'path':str(provpath),'sha256':sha(provpath),'status_note':'Historical pending status superseded for Long by director approval below; Short audio review still pending.'},'long_approval':{'path':str(approval),'sha256':sha(approval),'record':json.loads(approval.read_text())},'current_director_package':pre['directorPackage'],'source_identity':'PASS_EXPECTED_SHA256','rights_scope':'Existing director-approved source and recorded evidence inherited for this local review; no new rights verification, publishing, alternative versions or external acquisition. Retains exact original restrictions and credit text.','voice_content_short':'VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING','short_audio_director_approval':'PENDING','selected_regions':c['source_regions'],'deliverable_hashes':tech['hashes']};save(R/'music-provenance.json',prov)
(R/'YOUTUBE-MUSIC-CREDITS.txt').write_text(a['required_credit_text']+'\n\nShort edit: selected and rearranged excerpts from the Director-approved WF311613 Pass02 mix.\nMusic-only tempo adjustment +2%, crossfade, gain and short ending fade.\n')
save(R/'zero-SFX.json',{'status':'PASS_INPUT_AND_PROCESS_GRAPH_AUDIT','only_production_audio_input':plan['source'],'graph':['Pass02 PCM WAV decode','select A regions 22.610–50.110 and 109.481–141.766','625ms complementary half-cosine source overlap','music-only atempo 1.02','documented 609-sample grid correction','gain +3.99dB and <=0.6dB smooth automation','8ms entry de-click; 700ms final half-cosine fade','24-bit PCM WAV','AAC encode and explicit stream-copy video mux'],'external_music_inputs':[],'generated_audio':False,'procedural_sfx':False,'narration':False,'ambience':False,'new_instruments':False,'audio_cue_plan_used':False,'voice_listening':'VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING'})
edit=f'''# WF311613 Short02 — Music Edit Pass01

Status: **REQUIRES DIRECTOR AUDIO REVIEW**. Technical delivery PASS; actual agent listening NOT RUN. This is a selected review candidate, not final audio approval.

The approved 58-second picture is preserved by H.264 stream copy. The sole production audio input is the approved Pass02 WAV, SHA256 `{plan['source']['sha256']}`. The arrangement uses only its A / Artificial.Music “And So It Begins” portion; it contains neither the Long A→B/B→C transitions nor B/C. No new song, loop, instrument, SFX, narration or ambience was added.

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

Raw arrangement is 59.160s. FFmpeg WSOLA `atempo=1.02` makes a conservative +2% music-only tempo change with pitch preservation; the picture is unchanged. It returned 2,784,609 samples. Uniform linear sample-grid interpolation removes the 609-sample / 12.6875ms discrepancy to exactly 2,784,000 samples. This adds a rate ratio of 1.00021875 (+0.021875%, approximately +{c['processing']['additional_rate_pitch_cents']:.4f} cents); documented rather than claimed perfectly pitch-neutral. Tempo hypothesis after the main adjustment is about 98.07 BPM; beat/meter remain provisional.

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

WAV SHA256: `{tech['hashes']['wav']}`

Review MP4 SHA256: `{tech['hashes']['review_mp4']}`

See `TECHNICAL-MEDIA-VERIFICATION.json`, `LISTENING-QA-REPORT.md`, `music-edit-plan.json` and `SHA256SUMS.txt`. Stop at Director audio review; no publication or final Short designation.
'''
(R/'MUSIC-EDIT-REPORT.md').write_text(edit)
questions=[('0–2s hook','Immediate presence without overpowering the opening transformation?','hook'),('2–27s assembly','Continuous forward motion without distracting repetition or melody?','assembly'),('26.35–26.96s splice','No cut seam, doubled rhythm, phase dip or harmonic discontinuity?','phrase-transition'),('27–38s connection','Progression without distracting from pivot hardware?','connection'),('38–46s mechanism','Satisfying piston/articulation support without an exaggerated climax?','mechanism'),('46–52s legs/anchoring','Momentum maintained and no premature sense of ending?','legs-anchoring'),('52–58s payoff','Finished→close→open feels like reward; final release feels intentional?','payoff-ending'),('57–58s hero / ending','Quiet tail lands naturally; no truncated note or obviously artificial fade?','final-hero')]
qa='''# WF311613 Short02 — Listening QA Pass01

Overall: **REQUIRES DIRECTOR AUDIO REVIEW**.

Actual agent listening: **NOT RUN**. The available tools can decode/measure audio and present playable artifacts but cannot provide actual auditory perception in this session. No complete-mux listening, perceptual bass/voice/artifact check or heard ranking of iterations is claimed. Numeric analysis is reported separately. Historical Director approval of Long Pass02 is evidence for that source, not approval of this new arrangement.

Full 58-second review MP4 and identical AAC full preview are supplied. Review clips below are decoded from the selected MP4 and re-encoded only for convenience; use the full MP4 for final judgment of audio/picture interaction.

| Review coverage | Director listening question | Listening status | Clip |
|---|---|---|---|
'''
for title,q,name in questions:
 clip=next(x for x in clips['clips'] if x['name']==name);qa+=f"| {title} | {q} | NOT RUN / pending Director | [{name}]({clip['path']}) |\n"
qa+='''
## Artifact and voice checks

| Check | Result / limit |
|---|---|
| Audible clicks/pops, crossfade phasing, unnatural phrases | NOT RUN. Numeric adjacent-sample diagnostics and smooth ramps supplied; no auditory verdict. |
| Awkward repetition or excessive bass | NOT RUN. No synthetic loop or bass boost; source-region rearrangement still needs listening. |
| Sudden gain change | No stepped automation; <=0.6dB smooth range. Perceptual level continuity NOT RUN. |
| Time-adjustment artifacts | Conservative atempo1.02 plus documented +0.021875% sample-grid correction; audible transparency NOT RUN. |
| Vocals/spoken samples/voice | **VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING**. No voice was added. Long Director source approval preserved as historical evidence only. |
| Clipping/nonfinite samples | Numeric PASS: zero clipped samples; finite audio; encoded TP−5.83dBTP. |
| Silence gaps | Numeric PASS: no interior 100ms windows below−70dBFS. |
| Ending length/tail | Numeric PASS: WAV2,784,000 samples, final sample zero, fade57.3–58. Natural final-note resolution NOT RUN. |
| A/V duration or drift | Technical PASS: intended58s, starts0, zero measured audio lag at seven locations,1,740 unchanged videoframes. |

Director should listen to the complete58s mux, including the opening, splice, mechanism and finalhero, before approval. The included full preview provides continuous audio; shortclips supplement rather than replace the complete listen. No approval is inferred from elapsed time or source approval. Stop here.
'''
(R/'LISTENING-QA-REPORT.md').write_text(qa)
(R/'TECHNICAL-MEDIA-VERIFICATION.md').write_text(f'''# WF311613 Short02 — Technical Media Verification

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
''')
# Verify immutable sources and all pre-existing protected artifacts, independently after mux.
before=json.loads((R/'evidence/protected-before.json').read_text());after={};differences=[]
for rel,expected in before.items():
 p=WORK/rel;actual=sha(p) if p.is_file() else None;after[rel]=actual
 if actual!=expected:differences.append({'path':rel,'before':expected,'after':actual})
save(R/'evidence/protected-after.json',after);save(R/'preservation-verification.json',{'status':'PASS' if not differences else 'FAIL','protected_files':len(before),'differences':differences,'visual_sha256':sha(Path(pre['visual']['path'])),'approved_music_sha256':sha(Path(plan['source']['path'])),'application_source_changes':False,'visual_rendering':False})
assert not differences,differences
summary=f'''# WF311613 Short02 — Music Pass01 Review Package

**REQUIRES DIRECTOR AUDIO REVIEW**

Selected Short-specific arrangement of “And So It Begins” from approved Long Pass02. Immediate groove, one phrase transition near27s, stronger body through the mechanism and a quiet musical release into the hero. This selection is based on structural/signal analysis; musical continuity and ending require Director listening. Picture frozen and unchanged. Zero SFX.

- [Full review MP4]({R/'WF311613-short02-music-review-pass01-vertical-1080p.mp4'})
- [Exact58-second edited WAV]({R/'WF311613-short02-music-pass01.wav'})
- [Full AAC listening preview]({R/'WF311613-short02-music-pass01-preview.m4a'})
- [Music edit report]({R/'MUSIC-EDIT-REPORT.md'})
- [Listening QA / section questions]({R/'LISTENING-QA-REPORT.md'})
- [Technical verification]({R/'TECHNICAL-MEDIA-VERIFICATION.json'})
- [SHA256 hashes]({R/'SHA256SUMS.txt'})

Technical PASS:58s,1080×1920,30fps,1,740 unchanged frames,fullAVdecode,faststart,no measured drift,−15.01LUFS/−5.83dBTP encodedAAC. Agent listening **NOT RUN**, voice check **VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING**. {len(before):,} protected files unchanged, including the visual master, approved music WAV, Long and priorShort packages and application source.

The editedWAV hash is `{tech['hashes']['wav']}`. The reviewMP4 hash is `{tech['hashes']['review_mp4']}`. Complete manifests and source/provenance/edit/iteration evidence are included. This is a review mux, not a finalShort release. No publishing, source replacement or further sounddesign performed.
'''
(R/'REVIEW-PACKAGE.md').write_text(summary)
# Manifest all package files except itself. All writers complete before this list.
files=sorted(p for p in R.rglob('*') if p.is_file() and p.name!='SHA256SUMS.txt')
(R/'SHA256SUMS.txt').write_text(''.join(f'{sha(p)}  {p.relative_to(R)}\n' for p in files))
print('PACKAGE READY;',len(before),'protected files unchanged;',len(files),'package checksums',flush=True)
