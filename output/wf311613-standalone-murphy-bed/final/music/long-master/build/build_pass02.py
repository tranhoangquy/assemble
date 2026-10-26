from pathlib import Path
import json, subprocess, hashlib, datetime, concurrent.futures
import numpy as np

OUT=Path(__file__).resolve().parents[1]
PREV=OUT.parent/'lofi-music-pass01'
FF='/opt/homebrew/bin/ffmpeg';FP='/opt/homebrew/bin/ffprobe';SR=48000;TOTAL=25155200
EXPECTED='0d5d898cbfaecb4573f07e818ce722c6884cbd4dc67d7c51b7c6c724f404ba0a'

def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(4194304),b''):h.update(b)
    return h.hexdigest()

def write_json(name,obj):(OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def probe(p):return json.loads(subprocess.check_output([FP,'-v','error','-show_streams','-show_format','-of','json',str(p)]))
def wav(p,data):
    subprocess.run([FF,'-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','pipe:0','-c:a','pcm_s24le',str(p)],input=data.astype('<f4').tobytes(),check=True)

freeze={str(p):sha(p) for p in PREV.rglob('*') if p.is_file()}
provenance=json.loads((PREV/'music-provenance.json').read_text())
master=Path(provenance['visual_master']['path'])
assert sha(master)==EXPECTED,'VISUAL_MASTER_IDENTITY_MISMATCH'
assert not any(s['codec_type']=='audio' for s in probe(master)['streams'])

tick=lambda t:round(t*SR)
aout=tick(195.015);bin_=tick(41.155);bout=tick(147.481125);cin=tick(26.143104)
ab=tick(2.5);bc=tick(4)
bpos=aout-ab;cpos=bpos+(bout-bin_)-bc
cout=cin+TOTAL-cpos
positions=[0,bpos,cpos];ins=[0,bin_,cin];outs=[aout,bout,cout];gains=[-10.41,-10.79,-9.88]
mix=np.zeros((TOTAL,2),dtype=np.float32);segments=[];inputs=[]
for i,t in enumerate('ABC'):
    tr=provenance['tracks'][i];p=Path(tr['source_path'])
    assert sha(p)==tr['source_sha256']
    raw=subprocess.check_output([FF,'-v','error','-i',str(p),'-ar',str(SR),'-ac','2','-f','f32le','-'])
    pcm=np.frombuffer(raw,dtype='<f4').reshape(-1,2)
    assert outs[i]<=len(pcm),'Insufficient source material; no looping allowed'
    part=pcm[ins[i]:outs[i]].copy()*10**(gains[i]/20)
    if i==0:
        r=np.linspace(0,1,ab,dtype=np.float32);incoming=.5-.5*np.cos(np.pi*r)
        part[-ab:]*=(1-incoming)[:,None]
    if i==1:
        r=np.linspace(0,1,ab,dtype=np.float32);part[:ab]*=(.5-.5*np.cos(np.pi*r))[:,None]
        r=np.linspace(0,np.pi/2,bc,endpoint=True,dtype=np.float32);part[-bc:]*=np.cos(r)[:,None]
    if i==2:
        r=np.linspace(0,np.pi/2,bc,endpoint=True,dtype=np.float32);part[:bc]*=np.sin(r)[:,None]
    mix[positions[i]:positions[i]+len(part)]+=part
    segments.append({'track_id':t,'title':tr['title'],'artist':tr['artist'],'source_path':str(p),'source_sha256':tr['source_sha256'],'source_in_samples':ins[i],'source_out_samples':outs[i],'source_in_seconds':ins[i]/SR,'source_out_seconds':outs[i]/SR,'global_in_samples':positions[i],'global_out_samples':positions[i]+len(part),'global_in_seconds':positions[i]/SR,'global_out_seconds':(positions[i]+len(part))/SR,'gain_db':gains[i],'gain_changed':False,'source_in_reason':['Retain opening from source 0s','Director approved AB Candidate 1 entry','Retain Pass 01 BC source entry, quantized to nearest sample'][i],'source_out_reason':['Director locked 195.015s','Retain Pass 01 BC source OUT','Extend source use to fill exact locked duration after approved AB change; no loop or retime. Musical ending requires director listening.'][i]})
    inputs.append({'track_id':t,'path':str(p),'sha256':tr['source_sha256']})
fi=tick(1.5);fo=tick(6)
mix[:fi]*=(.5-.5*np.cos(np.linspace(0,np.pi,fi,dtype=np.float32)))[:,None]
mix[-fo:]*=(.5+.5*np.cos(np.linspace(0,np.pi,fo,dtype=np.float32)))[:,None]
assert np.isfinite(mix).all() and np.max(abs(mix))<1
plan={'version':'Pass 02','status':'DIRECTOR_COMPLETE_PASS02_LISTENING_REQUIRED','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'track_order':['A','B','C'],'sample_rate':SR,'samples_per_channel':TOTAL,'duration_seconds':TOTAL/SR,'segments':segments,'transitions':[{'id':'A-B','candidate':1,'approval':'DIRECTOR_APPROVED_LOCKED','global_start':bpos/SR,'global_end':aout/SR,'duration':ab/SR,'curve':'complementary half-cosine','source_A_out':aout/SR,'source_B_in':bin_/SR},{'id':'B-C','approval':'RETAINED_PASS01_BASELINE_PENDING_COMPLETE_LISTENING','global_start':cpos/SR,'global_end':(cpos+bc)/SR,'duration':bc/SR,'curve':'sin/cos equal-power','source_B_out':bout/SR,'source_C_in':cin/SR}],'master_fade_in':{'start':0,'duration':1.5,'curve':'half cosine'},'master_fade_out':{'start':(TOTAL-fo)/SR,'end':TOTAL/SR,'duration':6,'curve':'half cosine'},'timeline_derivation':{'B_global_in':'A_source_out - AB_overlap','B_duration':'B_source_out - B_source_in','C_global_in':'B_global_in + B_duration - BC_overlap','C_source_out':'C_source_in + locked_total_duration - C_global_in','B_duration_seconds':(bout-bin_)/SR,'BC_shift_from_pass01_seconds':cpos/SR-303.7605,'C_source_out_extension_from_pass01_seconds':cout/SR-246.44927083333334,'C_requested_in_seconds':26.143104,'C_effective_sample_in_seconds':cin/SR},'processing':['decode/resample to 48kHz stereo','source trims','fixed gains unchanged','approved AB crossfade','baseline BC crossfade','baseline master fades'],'loops':False,'tempo_pitch_change':False,'video_retiming':False,'voice_check':'VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING','internal_actual_listening':'NOT_PERFORMED_NO_LISTENING_CAPABLE_TOOL','director_full_pass02_approval':'PENDING','final_mux_created':False}
write_json('music-edit-plan.json',plan)
name='WF311613-lofi-mix-pass02.wav';wav(OUT/name,mix)
preview=OUT/'WF311613-lofi-mix-pass02-preview.m4a'
subprocess.run([FF,'-v','error','-y','-i',str(OUT/name),'-c:a','aac','-b:a','256k','-ar',str(SR),'-ac','2','-movflags','+faststart',str(preview)],check=True)
for n,pos,length in [('transition-A-B-pass02.wav',bpos,ab),('transition-B-C-pass02.wav',cpos,bc)]:wav(OUT/n,mix[pos-10*SR:pos+length+10*SR])
wav(OUT/'intro-music-review-pass02.wav',mix[:40*SR])
wav(OUT/'final-fade-review-pass02.wav',mix[-30*SR:])
assert sha(OUT/'transition-A-B-pass02.wav')==sha(PREV/'revision-v2/AB-transition-v2-candidate-1.wav'),'Locked AB excerpt changed'
assert sha(OUT/'transition-B-C-pass02.wav')==sha(PREV/'transition-B-C.wav'),'Baseline BC source relationship changed'
assert sha(OUT/'intro-music-review-pass02.wav')==sha(PREV/'intro-music-review.wav'),'Intro changed'
write_json('zero-SFX-verification.json',{'status':'PASS_MUSIC_ONLY_PASS02_GRAPH','inputs':inputs,'SFX_used':False,'AudioCuePlan_applied':False,'procedural_assets_used':False,'narration_used':False,'workshop_ambience_used':False,'hidden_additional_layer':False,'operations':plan['processing'],'AB_locked_candidate_bit_exact':'PASS','BC_baseline_review_bit_exact':'PASS','intro_baseline_bit_exact':'PASS','video_input_used':False,'final_mux_created':False})
def metrics(n):
    p=OUT/n;pr=probe(p)
    r=subprocess.run([FF,'-hide_banner','-nostats','-i',str(p),'-af','ebur128=peak=true,astats=metadata=0:reset=0','-f','null','-'],capture_output=True,text=True)
    (OUT/(n+'.decode-loudness.log')).write_text(r.stderr)
    import re
    summary=r.stderr[r.stderr.rfind('Summary:'):]
    def value(pattern):return float(re.search(pattern,summary).group(1))
    sample=float(re.findall(r'Peak level dB:\s*([-+\d.]+)',r.stderr)[-1])
    tp=value(r'Peak:\s*([-+\d.]+) dBFS')
    assert r.returncode==0 and tp<0 and sample<0
    return {'file':str(p),'sha256':sha(p),'full_audio_decode':'PASS','ffprobe':pr,'integrated_lufs':value(r'I:\s*([-+\d.]+) LUFS'),'true_peak_dbtp':tp,'decoded_sample_peak_dbfs':sample,'loudness_range_lu':value(r'LRA:\s*([-+\d.]+) LU'),'sample_clipping':'PASS'}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:measured=list(ex.map(metrics,[name,preview.name]))
assert measured[0]['ffprobe']['streams'][0]['duration_ts']==TOTAL
interior=mix[fi:TOTAL-fo];count=len(interior)//4800
rms=np.sqrt(np.mean(interior[:count*4800].reshape(count,4800,2).astype(np.float64)**2,axis=(1,2)))
low=np.where(rms<10**(-70/20))[0]
assert len(low)==0,'Unexpected interior low-energy interval'
artifacts=[{'file':str(p),'sha256':sha(p),'ffprobe':probe(p)} for p in OUT.glob('*review-pass02.wav')]+[{'file':str(p),'sha256':sha(p),'ffprobe':probe(p)} for p in OUT.glob('transition-*-pass02.wav')]
write_json('loudness-peak-report.json',{'status':'TECHNICAL_PASS_DIRECTOR_LISTENING_PENDING','results':measured,'review_artifacts':artifacts,'interior_100ms_below_minus70_dbfs':[],'finite_samples':'PASS','VOICE_CONTENT':'VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING','perceptual_transition_and_ending_qa':'PENDING'})
provenance.update({'version':'Pass 02','status':'DIRECTOR_COMPLETE_PASS02_LISTENING_REQUIRED','pass01_provenance_path':str(PREV/'music-provenance.json'),'acquisition':'DIRECTOR_SUPPLIED_LOCAL_ASSETS_ONLY_NO_NEW_DOWNLOAD','AB_approval':'Director listened to revision-v2 candidates and locked Candidate 1','candidate_wav':str(OUT/name),'candidate_wav_sha256':sha(OUT/name),'candidate_preview':str(preview),'candidate_preview_sha256':sha(preview),'actual_listening_qa':'AB director-approved; complete Pass 02 pending director listening','voice_check':'VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING','final_mix_created':False,'final_mux_created':False})
write_json('music-provenance.json',provenance)
(OUT/'YOUTUBE-MUSIC-CREDITS.txt').write_text((PREV/'YOUTUBE-MUSIC-CREDITS.txt').read_text())
assert sha(master)==EXPECTED
assert all(sha(Path(p))==h for p,h in freeze.items()),'Pass01 evidence changed'
write_json('pass01-evidence-freeze.json',{'status':'PASS_UNCHANGED','files':freeze})
lines=['# WF311613 — Music-only Pass 02 listening package','','Status: COMPLETE_PASS02_DIRECTOR_LISTENING_REQUIRED. No final MP4.','',f'Locked silent master: {master}',f'SHA256: {EXPECTED}; identity PASS before/after audio work. No video use or alteration.','','## Timeline recalculation','',f'B begins at {bpos/SR:.6f}s = 195.015000 − 2.500000.',f'B source duration = {bout/SR:.6f} − {bin_/SR:.6f} = {(bout-bin_)/SR:.6f}s.',f'B global OUT = {(bpos+bout-bin_)/SR:.6f}s.',f'C global IN = {cpos/SR:.6f}s = B global OUT − 4s.',f'BC global crossfade: {cpos/SR:.6f}–{(cpos+bc)/SR:.6f}s.',f'BC shifted {cpos/SR-303.7605:+.6f}s from Pass 01; source B OUT/C IN and 4s equal-power are preserved.',f'C source OUT is now {cout/SR:.9f}s to reach exactly {TOTAL/SR:.9f}s. This extends C by {cout/SR-246.44927083333334:.6f}s; the final ending requires director review.',f'C requested source IN 26.143104s is quantized to {cin/SR:.9f}s (nearest 48kHz sample).','','## Source/global edits','','| Track | Source IN–OUT (s) | Global IN–OUT (s) | Fixed gain |','|---|---|---|---|']
for s in segments:lines.append(f"| {s['track_id']} | {s['source_in_seconds']:.9f}–{s['source_out_seconds']:.9f} | {s['global_in_seconds']:.9f}–{s['global_out_seconds']:.9f} | {s['gain_db']:+.2f} dB |")
lines+=['','AB locked: global 192.515000–195.015000s; 2.5s complementary half-cosine. Its review WAV is byte-identical to approved Candidate 1.','BC baseline retained: 4s sin/cos equal-power. Its review WAV is byte-identical to Pass 01 BC review despite the new global placement.','Intro retained: 1.5s half-cosine; intro review byte-identical to Pass 01.','Final fade retained: 518.066667–524.066667s, 6s half-cosine. Ending source content differs because downstream timing changed; review the new ending clip.','','## QA','','WAV: 48kHz stereo 24-bit PCM, exactly 25,155,200 samples/channel; 524.066666667s. Preview: AAC 48kHz stereo, requested 256kbps.','No re-normalization, loops, time stretch, pitch change, SFX, AudioCuePlan, narration or ambience. ZERO_SFX graph PASS. No interior 100ms window below −70dBFS outside allowed fades.']
for m in measured:lines.append(f"{Path(m['file']).name}: full decode {m['full_audio_decode']}; {m['integrated_lufs']} LUFS; {m['true_peak_dbtp']} dBTP; decoded sample peak {m['decoded_sample_peak_dbfs']:.6f} dBFS; LRA {m['loudness_range_lu']} LU; SHA256 {m['sha256']}.")
lines+=['','Pass 01 and revision-v2 evidence unchanged: PASS, all file hashes compared. Source asset hashes match director-supplied files. Master SHA unchanged.','VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING. No vocals/spoken/voice PASS is inferred from metadata or metrics.','No actual listening-capable tool is available. AB has director approval; complete Pass 02, BC, ending and no-voice compliance await director listening.','Final MP4, VIDEO_STREAM_IDENTITY, full A/V decode and review MP4 excerpts: NOT RUN, deliberately pending complete soundtrack approval.','STOP after this audio package. Director must approve complete Pass 02 before final stream-copy mux.','',f'Output directory: {OUT}','Detailed provenance, edit plan, source/global sample indices, ffprobe, metrics, zero-SFX graph, credits, frozen historical hashes and SHA256 manifest are saved alongside audio.']
(OUT/'MUSIC-PASS02-REPORT.md').write_text('\n'.join(lines)+'\n')
manifest=[EXPECTED+'  '+str(master)]+[sha(Path(s['source_path']))+'  '+s['source_path'] for s in segments]
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name!='SHA256SUMS.txt':manifest.append(sha(p)+'  '+str(p))
(OUT/'SHA256SUMS.txt').write_text('\n'.join(manifest)+'\n')
print(json.dumps({'BC_global_in':cpos/SR,'BC_global_out':(cpos+bc)/SR,'C_source_out':cout/SR,'duration':TOTAL/SR,'metrics':[{k:m[k] for k in ['integrated_lufs','true_peak_dbtp','decoded_sample_peak_dbfs','full_audio_decode']} for m in measured],'locked_AB_byte_identity':'PASS','baseline_BC_byte_identity':'PASS','historical_evidence':'PASS'},indent=2))
