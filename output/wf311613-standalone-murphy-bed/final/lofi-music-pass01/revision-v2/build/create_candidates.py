from pathlib import Path
import json, subprocess, hashlib, datetime
import numpy as np

OUT=Path(__file__).resolve().parents[1]
BASE=OUT.parent
FF='/opt/homebrew/bin/ffmpeg';FP='/opt/homebrew/bin/ffprobe';SR=48000
plan=json.loads((BASE/'music-edit-plan.json').read_text())
original_files=[BASE/'WF311613-lofi-mix-pass01.wav',BASE/'WF311613-lofi-mix-pass01-preview.m4a',BASE/'transition-A-B.wav',BASE/'transition-B-C.wav',BASE/'final-fade-review.wav',BASE/'music-edit-plan.json',BASE/'music-provenance.json']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
freeze={str(p):sha(p) for p in original_files}
pcm={}
for seg in plan['segments']:
    p=Path(seg['source_path'])
    assert sha(p)==seg['source_sha256']
    raw=subprocess.check_output([FF,'-v','error','-i',str(p),'-ar',str(SR),'-ac','2','-f','f32le','-'])
    pcm[seg['track_id']]=np.frombuffer(raw,dtype='<f4').reshape(-1,2)

def onset(t,start,end,target):
    # Local spectral-flux peaks are audition anchors, not proof of downbeats/phrases.
    x=pcm[t][round(start*SR):round(end*SR)].mean(axis=1)[::3]
    win=512;hop=80
    frames=np.lib.stride_tricks.sliding_window_view(x,win)[::hop]
    mag=np.log1p(abs(np.fft.rfft(frames*np.hanning(win),axis=1)))
    flux=np.maximum(np.diff(mag,axis=0),0).sum(axis=1)
    times=start+(np.arange(len(flux))*hop+win/2+hop)/16000
    peaks=np.where((flux[1:-1]>flux[:-2])&(flux[1:-1]>=flux[2:]))[0]+1
    eligible=[i for i in peaks if abs(times[i]-target)<.30]
    assert eligible
    index=max(eligible,key=lambda i:flux[i]*(1-.5*abs(times[i]-target)/.30))
    # Start at detected onset frame rather than at its analysis-window centre.
    return round((times[index]-win/2/16000)*SR)

specs=[
    (1,195.0,41.0,2.5,'complementary half-cosine','Short overlap, incoming B moved deeper into the established body; local transient anchors around A 195s / B 41s. Complementary curves reduce simultaneous layer energy. Phrase/downbeat alignment remains a director listening hypothesis.'),
    (2,198.5,44.0,4.0,'sin/cos equal-power','Preserve 4-second overlap as comparison, change both source anchors and move B beyond its original 35-second entry. Tests whether the source pair, rather than duration, caused the obvious restart.'),
    (3,191.0,48.0,4*60/130,'sin/cos equal-power','Earlier alternative A boundary and later B groove entry, with about one 130-BPM B bar of overlap. Shorter overlap tests reduced drum/bass/melody collision. No tempo change is applied.')]
gains={s['track_id']:s['gain_db'] for s in plan['segments']}
records=[]
for num,at,bt,length,curve,reason in specs:
    aout=onset('A',185,203,at);bin_=onset('B',30,50,bt)
    cross=round(length*SR); context=10*SR
    astart=aout-cross-context;bend=bin_+cross+context
    # Each file contains exactly 10s + complete overlap + 10s.
    mix=np.zeros((2*context+cross,2),dtype=np.float32)
    aa=pcm['A'][astart:aout].copy()*10**(gains['A']/20)
    bb=pcm['B'][bin_:bend].copy()*10**(gains['B']/20)
    ramp=np.linspace(0,1,cross,dtype=np.float32)
    if curve=='complementary half-cosine':
        incoming=.5-.5*np.cos(np.pi*ramp);outgoing=1-incoming
    else:
        incoming=np.sin(np.pi/2*ramp);outgoing=np.cos(np.pi/2*ramp)
    aa[-cross:]*=outgoing[:,None];bb[:cross]*=incoming[:,None]
    mix[:context+cross]+=aa;mix[context:]+=bb
    assert np.isfinite(mix).all() and np.max(abs(mix))<1
    name=f'AB-transition-v2-candidate-{num}.wav';p=OUT/name
    subprocess.run([FF,'-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','pipe:0','-c:a','pcm_s24le',str(p)],input=mix.astype('<f4').tobytes(),check=True)
    check=subprocess.run([FF,'-hide_banner','-nostats','-i',str(p),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True)
    assert check.returncode==0
    (OUT/(name+'.qa.log')).write_text(check.stderr)
    probe=json.loads(subprocess.check_output([FP,'-v','error','-show_streams','-show_format','-of','json',str(p)]))
    assert probe['streams'][0]['duration_ts']==len(mix)
    rec={'candidate':num,'file':str(p),'sha256':sha(p),'status':'DIRECTOR_LISTENING_REQUIRED','reason':reason,'A_source_full_segment_in':0,'A_source_full_segment_out':aout/SR,'A_source_excerpt_in':astart/SR,'A_source_excerpt_out':aout/SR,'B_source_in':bin_/SR,'B_source_excerpt_out':bend/SR,'B_source_full_segment_out':'DEFERRED_UNTIL_CANDIDATE_SELECTED','global_excerpt_in':astart/SR,'global_excerpt_out':(aout+context)/SR,'global_transition_in':(aout-cross)/SR,'global_transition_out':aout/SR,'B_global_in':(aout-cross)/SR,'B_global_out':'DEFERRED_UNTIL_CANDIDATE_SELECTED','crossfade_seconds':cross/SR,'curve':curve,'gain_db':{'A':gains['A'],'B':gains['B']},'gain_changed':False,'excerpt_duration_seconds':len(mix)/SR,'sample_peak_dbfs':float(20*np.log10(np.max(abs(mix)))),'full_audio_decode':'PASS','sample_clipping':'PASS','ffprobe':probe,'actual_listening':'NOT_PERFORMED','voice_content':'VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING'}
    records.append(rec)
report={'status':'WAITING_FOR_DIRECTOR_AB_SELECTION','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'director_revision_package':'/Users/quyth/.codex/attachments/a14275a5-2a67-41e1-95dd-0a1b31879d34/Pasted text.txt','candidates':records,'sources':[{'track_id':s['track_id'],'path':s['source_path'],'sha256':s['source_sha256']} for s in plan['segments']],'BC':{'status':'UNCHANGED_DIRECTOR_BASELINE','source_B_out':plan['segments'][1]['source_out'],'source_C_in':plan['segments'][2]['source_in'],'global_crossfade_in':303.7605,'global_crossfade_out':307.7605,'crossfade_seconds':4,'curve':'sin/cos equal-power','baseline_file':str(BASE/'transition-B-C.wav'),'extra_alignment_review':'Actual phrase/downbeat listening unavailable. No demonstrated audible improvement supports changing the director-preferred baseline; retain it pending AB selection.','technical_nearby_transient_B_out':onset('B',140,152,147.481125)/SR,'technical_nearby_transient_C_in':onset('C',22,35,26.143104166666667)/SR,'actual_listening':'NOT_PERFORMED'},'ending':{'status':'UNCHANGED_PROVISIONAL_BASELINE','start':518.0666666666667,'end':524.0666666666667,'duration':6,'curve':'half cosine','review_file':str(BASE/'final-fade-review.wav'),'musical_resolution':'REQUIRES_DIRECTOR_LISTENING'},'voice_check':'VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING','ZERO_SFX':'PASS_CANDIDATE_INPUT_GRAPH_ONLY_HASHED_A_B','full_WAV_rebuilt':False,'MP4_created':False,'video_timing_changed':False,'loops':False,'tempo_pitch_change':False,'gain_changed':False,'actual_listening':'NOT_PERFORMED; no listening-capable tool. No musical PASS claim.'}
assert all(sha(Path(p))==h for p,h in freeze.items())
report['pass01_evidence_unchanged']='PASS'
(OUT/'revision-v2-edit-plan.json').write_text(json.dumps(report,indent=2)+'\n')
lines=['# WF311613 — transition revision v2','','Status: WAITING_FOR_DIRECTOR_AB_SELECTION','','Three technical audition alternatives were generated. No listening capability is available; phrase/downbeat/chord compatibility and perceptual PASS are not claimed. Local source transient anchors are supporting evidence only.','', '| Candidate | A source OUT | B source IN | Proposed global crossfade | Duration | Curve |','|---|---:|---:|---|---:|---|']
for r in records:
    lines.append(f"| {r['candidate']} | {r['A_source_full_segment_out']:.6f}s | {r['B_source_in']:.6f}s | {r['global_transition_in']:.6f}–{r['global_transition_out']:.6f}s | {r['crossfade_seconds']:.6f}s | {r['curve']} |")
lines+=['','Global values assume A retains source 0s at video 0s. All clip source/global IN/OUT values are recorded exactly in revision-v2-edit-plan.json. Full B/C placement is deferred until the director chooses an AB transition; none is asserted to fit the previous full soundtrack unchanged.','','Gain remains A −10.41 dB, B −10.79 dB, C baseline −9.88 dB. No numerical re-normalization or added processing. Each clip is 48kHz stereo 24-bit PCM and contains 10s before, the entire overlap, and 10s after. Full decode and sample headroom checks passed. Clip LUFS is not a full-mix loudness measurement.','']
for r in records:lines.append(f"Candidate {r['candidate']}: {r['reason']}")
lines+=['','B→C unchanged: source B OUT 147.481125s; C IN 26.143104s; global 303.760500–307.760500s; 4s equal power. Nearby technical transient proposals are recorded, but no audible improvement was demonstrated. Original baseline retained.','Ending unchanged: global 518.066667–524.066667s, 6s half cosine. No new ending file created.','VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING: inspect the actually used B material, including these entries; metadata does not prove vocals and no automatic rejection was made.','Pass 01 evidence hashes unchanged: PASS. No SFX, narration, ambience, additional track, loops, time stretch, video retiming, full-WAV rebuild or MP4 mux.','STOP: director chooses candidate 1/2/3 or requests another source pair; only then rebuild the complete audio and continue the listening gate.']
(OUT/'REVISION-v2-REPORT.md').write_text('\n'.join(lines)+'\n')
(OUT/'pass01-evidence-freeze.json').write_text(json.dumps(freeze,indent=2)+'\n')
manifest=[]
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name!='SHA256SUMS.txt':manifest.append(sha(p)+'  '+str(p))
(OUT/'SHA256SUMS.txt').write_text('\n'.join(manifest)+'\n')
print(json.dumps([{k:r[k] for k in ['candidate','A_source_full_segment_out','B_source_in','global_transition_in','global_transition_out','crossfade_seconds','curve','sample_peak_dbfs']} for r in records],indent=2))
