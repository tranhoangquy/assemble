from pathlib import Path
import json,hashlib,shutil
R=Path(__file__).resolve().parents[1];WORK=Path('/Users/quyth/development/three/POC');OLD=R.parent/'short02-music-pass01'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def save(p,d):p.write_text(json.dumps(d,indent=2)+'\n')
c=json.loads((R/'mastering-configuration.json').read_text());t=json.loads((R/'FINAL-MEDIA-VERIFICATION.json').read_text());approval=json.loads((R/'director-authorization.json').read_text());probe=json.loads((R/'evidence/ffprobe-review.json').read_text());a=next(x for x in probe['streams'] if x['codec_type']=='audio');final=R/'WF311613-short02-FINAL-vertical-1080p.mp4';wav=R/'WF311613-short02-FINAL-music-master.wav'
assert t['status']=='PASS';assert sha(wav)==c['output_sha256']
before=json.loads((R/'evidence/protected-before.json').read_text());after={};diff=[]
for rel,expected in before.items():
 p=WORK/rel;actual=sha(p) if p.is_file() else None;after[rel]=actual
 if expected!=actual:diff.append({'path':rel,'before':expected,'after':actual})
save(R/'evidence/protected-after.json',after);pres={'status':'PASS' if not diff else 'FAIL','protected_files':len(before),'differences':diff,'visual_source_sha256':sha(Path(approval['original_visual']['path'])),'music_pass01_sha256':sha(Path(approval['music_basis']['path'])),'no_application_source_edits':True,'no_threejs_rendering':True};save(R/'preservation-verification.json',pres);assert not diff,diff
# Inherit recorded authority and credits; no rights or source changes.
prov=json.loads((OLD/'music-provenance.json').read_text());prov['status']='FINAL MASTER COMPLETE';prov['final_master_authorization']=approval;prov['mastering_input']=approval['music_basis'];prov['selected_arrangement_unchanged']=True;prov['new_external_music']=False;prov['final_outputs']={'mp4':{'path':str(final),'sha256':sha(final)},'wav':{'path':str(wav),'sha256':sha(wav)}};prov['short_audio_director_approval']='Music direction approved; mastering and final designation explicitly authorized by current director package. No claim of director listening to newly mastered bytes.';save(R/'music-provenance.json',prov)
shutil.copyfile(OLD/'YOUTUBE-MUSIC-CREDITS.txt',R/'YOUTUBE-MUSIC-CREDITS.txt')
save(R/'zero-SFX-final.json',{'status':'PASS_PROCESS_GRAPH_AUDIT','only_production_audio_input':approval['music_basis'],'graph':['approved Pass01 WAV','smooth gain envelope','gentle broadband compression','known fade reshaping to 57.7–58','fixed loudness gain','24bit final WAV','AAC encode'],'video_input':approval['video_mux_input'],'video_mapping':'0:v:0 copy','audio_mapping':'1:a:0 final WAV only; previous review AAC explicitly excluded','new_songs':False,'new_arrangement':False,'new_instruments':False,'SFX':False,'narration':False,'ambience':False,'EQ':False,'actual_listening':'NOT RUN','voice_check':'VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING; no voice introduced by mastering'})
t['master_status']='FINAL MASTER COMPLETE';t['audio']['actual_bit_rate']=int(a['bit_rate']);t['audio']['wav_loudness']=c['wav_measurement'];t['audio']['final_fade_start']=57.7;t['audio']['final_fade_end']=58;t['audio']['mastering_compression_gain_reduction']=c['compression']['gain_reduction'];t['preservation']=pres;t['director_authorization']=approval;t['hashes']={'final_wav':sha(wav),'final_mp4':sha(final),'full_aac_preview':sha(R/'WF311613-short02-FINAL-music-preview.m4a')};t['outputs']={'final_wav':str(wav),'final_mp4':str(final)};t['final_output_size_bytes']=final.stat().st_size;save(R/'FINAL-MEDIA-VERIFICATION.json',t)
# Retain source selection documentation read-only as a reference, not modified arrangement.
configtext=json.dumps(c['new_smooth_gain']);rows='\n'.join(f"| {name} ({s['start']}–{s['end']}s) | {s['pass01_rms_dbfs']:.2f} | {s['final_rms_dbfs']:.2f} |" for name,s in c['sections'].items())
report=f'''# WF311613 Short02 — Final Master

Status: **FINAL MASTER COMPLETE**.

Director package approved the picture and music direction, explicitly authorized final audio mastering and final designation once mandatory technical checks pass. Those checks PASS. No creative review iteration, rearrangement, rendering, frame/timing change or publication was performed. Agent actual listening is **NOT RUN**: this session has no auditory-perception capability. Numerical results do not claim subjective pumping, bass, voice or musical-ending listening verification; the final designation follows the explicit Director final gate.

## Deliverables

- [Final MP4]({final})
- [Archival mastered WAV]({wav})
- [Full mastered AAC preview]({R/'WF311613-short02-FINAL-music-preview.m4a'})
- [Final payoff/ending excerpt]({R/'WF311613-short02-FINAL-ending-preview.m4a'})
- [Detailed media verification]({R/'FINAL-MEDIA-VERIFICATION.json'})
- [Mastering configuration]({R/'mastering-configuration.json'})
- [Reproducible audio-processing script]({R/'build/master_audio.py'})
- [Mux and verification script]({R/'build/mux_verify.py'})
- [Exact mux command]({R/'mux-command.json'})
- [SHA256 manifest]({R/'SHA256SUMS.txt'})

## Locked sources and approval

The supplied Pass01 WAV is the sole production audio source: `{approval['music_basis']['sha256']}`. Selected song, source order, splice near27s and all source timing are preserved. No new musical samples or time adjustment. The approved visual stream is taken from the MusicPass01 reviewMP4, with its prior AAC excluded by explicit mapping. Its original silent visual SHA remains `{approval['original_visual']['sha256']}`.

Authorization is recorded in `director-authorization.json`, including the exact Director attachment path and hash. It approves the basis, mastering scope and final designation; it does not claim that the Director has already heard this newly mastered file. Existing song provenance and exact credits are retained in the final directory.

## Mastering

A gentle stereo-linked broadband RMS compressor uses ratio1.25:1,threshold−18dBFS,attack25ms,release180ms,soft knee2.8284 and unity makeup. Measured maximum gain reduction is {c['compression']['gain_reduction']['max_db']:.2f}dB, median{c['compression']['gain_reduction']['median_db']:.2f}dB and95th-percentile{c['compression']['gain_reduction']['p95_db']:.2f}dB. No EQ or tonal alteration. No limiter was engaged because measured true peaks remain safely below−1dBTP; no clipping or reason to impose extra dynamics reduction.

The prior +0.4/+0.6dB section automation is removed analytically. New gain is interpolated smoothly in dB: +0.35 through0–2s, gradually0 by27s,0 through56.75s, rising to+2dB by57.3s and holding that gain through the endpoint fade. A static +{c['fixed_gain_db']:.2f}dB gain after compression sets integrated loudness. There are no section-level steps, upward tail normalization or new sound elements. `loudnorm` is measurement-only through a null sink; it does not process the delivered master.

## Hero and endpoint fix

The prior half-cosine fade57.3–58s is replaced with a short half-cosine57.7–58s. Using the documented old-fade curve, the mastering script applies the analytic ratio of newfade/oldfade to existing samples; this avoids reconstructing or replacing any music. The ratio is bounded at about5.444 (approximately14.72dB as the endpoint approaches), representing undoing the old fade rather than boosting the underlying natural decay. Only the additional smooth+2dB is new tail support. Natural source decay is retained; the source is not normalized to a flat tail/noise level.

Useful hero presence extends through57.7s, then fades over300ms. Final fade begins at sample2,769,600; exact endpoint is2,784,000samples/channel. Final PCM sample is zero. The late hero57.6–57.7s changes from−35.39 to−26.50dBFS RMS, avoiding the old early-fade loss without replacing the final phrase. Perceptual naturalness is not claimed from signal metrics alone.

| Section | Pass01 RMS dBFS | Final RMS dBFS |
|---|---|---|
{rows}

The principal body/hook sectionRMS range narrows from about1.84dB to0.88dB, supporting a more consistent master. The natural closing release stays quieter than the body intentionally. No hearing-based claim of inaudible compression is made.

## Final technical verification

| Check | Result |
|---|---|
| Intended timeline | Exactly58s; MP4 video/audio/format each58.000000s |
| Picture | 1080×1920,30fps,1,740frames,H.264/yuv420p |
| Video payload/timing | Original visual→Pass01 input→FINAL ordered payload hashes,PTS,DTS,duration,size,flags/side data identical |
| Video codec/extradata | Codec,profile,level,timebase and extradata SHA256 identical |
| Decoded picture | All1,740 decoded frame/timestamp MD5 records identical; no added/lost/duplicated frames |
| Archival audio | PCM24-bit,48kHz,stereo,exact2,784,000samples/channel |
| WAV loudness | −14.50LUFS;−5.35dBTP;LRA1.30LU |
| Final AAC | 48kHz,stereo,256kb/s target;actual{int(a['bit_rate'])}b/s |
| Final encoded loudness | −14.51LUFS;−3.96dBTP;LRA1.30LU |
| Clipping / finite data | Zero clipped samples; all finite |
| Silence gaps | No interior100ms windows below−70dBFS |
| A/V starts / drift | Both start0; zero measured waveform lag at1,25,26.7,35,43,53,56.8s |
| AAC padding |256 trailing decoded samples/5.333ms; MP4 declared duration58s; no picture extension |
| Full A/V decode | PASS |
| Faststart | PASS;moov precedesmdat |
| Preservation | {len(before):,} pre-existing protected files hash-identical, including Pass01 package, frozen picture/timeline, product/application source and Long masters |
| Agent actual listening | NOT RUN; no audible pumping/click/voice verdict claimed |

Seam diagnostics remain below the whole-track maximum adjacent-sample step; they are numeric evidence, not proof of perceptual seam quality. All PCM/AAC loudness and alignment results are recorded in the JSON and underlying logs. FrameMD5, packet hashes, codec/extradata proof, full decode logs and before/after source hashes are included. App tests were not run because this task changed only isolated media output and reports.

## SHA256

Final MP4: `{sha(final)}`

Final WAV: `{sha(wav)}`

Full file manifest: `SHA256SUMS.txt`. Sources and prior review outputs are preserved. Final creation and verification complete; STOP. No upload or publication performed.
'''
(R/'FINAL-MASTER-REPORT.md').write_text(report)
files=sorted(p for p in R.rglob('*') if p.is_file() and p.name!='SHA256SUMS.txt')
(R/'SHA256SUMS.txt').write_text(''.join(f'{sha(p)}  {p.relative_to(R)}\n' for p in files))
print('FINAL MASTER COMPLETE;',len(before),'protected files unchanged;',len(files),'checksums',flush=True)
