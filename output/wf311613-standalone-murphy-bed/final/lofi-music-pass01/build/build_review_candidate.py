from pathlib import Path
import json, subprocess, hashlib, datetime
import numpy as np

OUT=Path(__file__).resolve().parents[1]
FF='/opt/homebrew/bin/ffmpeg'
SR=48000
TOTAL=25155200  # 15,722 frames / 30 fps * 48,000 samples/s.
analysis={t:json.loads((OUT/'evidence'/f'{t}-technical-analysis.json').read_text()) for t in 'ABC'}

def align(t,desired):
    # Provisional 4-beat grid only: this does NOT identify phrase/downbeat by ear.
    grid=np.array(analysis[t]['provisional_4beat_grid'])
    return int(round(float(grid[np.argmin(abs(grid-desired))])*SR))

def loudness(path,start,duration):
    r=subprocess.run([FF,'-hide_banner','-nostats','-ss',str(start),'-i',str(path),'-t',str(duration),'-af','loudnorm=I=-20:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True)
    if r.returncode:raise RuntimeError(r.stderr)
    return json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}')+1])

ain=0; aout=align('A',199)
bin_=align('B',36); bout=align('B',148)
cin=align('C',26)
cross=4*SR
alen=aout-ain; blen=bout-bin_; clen=TOTAL-alen-blen+2*cross
cout=cin+clen
assert cout/SR<249, 'Final source must leave the measurable late sparse/fade region'
positions=[0,alen-cross,alen+blen-2*cross]
ins=[ain,bin_,cin];outs=[aout,bout,cout]
mix=np.zeros((TOTAL,2),dtype=np.float32)
segments=[];graph=[]
for i,t in enumerate('ABC'):
    source=Path(analysis[t]['file'])
    # Decode complete supplied source: no SFX/cues, time-stretch, looping or effects.
    raw=subprocess.check_output([FF,'-v','error','-i',str(source),'-ar',str(SR),'-ac','2','-f','f32le','-'])
    pcm=np.frombuffer(raw,dtype='<f4').reshape(-1,2)
    part=pcm[ins[i]:outs[i]].copy()
    assert len(part)==outs[i]-ins[i]
    measurement=loudness(source,ins[i]/SR,len(part)/SR)
    gain=-20-float(measurement['input_i'])
    part*=10**(gain/20)
    if i:
        ramp=np.linspace(0,np.pi/2,cross,endpoint=True,dtype=np.float32)
        part[:cross]*=np.sin(ramp)[:,None]
    if i<2:
        ramp=np.linspace(0,np.pi/2,cross,endpoint=True,dtype=np.float32)
        part[-cross:]*=np.cos(ramp)[:,None]
    mix[positions[i]:positions[i]+len(part)]+=part
    segments.append({'track_id':t,'title':['And So It Begins','Herbal Tea','Way Home'][i],'artist':'Tokyo Music Walker' if t=='C' else 'Artificial.Music','source_filename':source.name,'source_path':str(source),'source_sha256':analysis[t]['sha256'],'source_in':ins[i]/SR,'source_out':outs[i]/SR,'global_in':positions[i]/SR,'global_out':(positions[i]+len(part))/SR,'gain_db':gain,'selected_segment_measured_lufs':float(measurement['input_i']),'fade_in_seconds':4 if i else 0,'fade_out_seconds':4 if i<2 else 0,'crossfade_curve':'sin/cos equal-power','processing':['constant gain','fade only'],'source_in_reason':'Retain natural opening' if i==0 else 'Technical energy profile suggests normal body has started; nearest provisional 4-beat grid. Actual intro/phrase identification pending listening.','source_out_reason':'Leave before measured end fade/sparse tail; provisional 4-beat grid' if i<2 else 'Exact locked remaining sample count, inside measured normal body, ending supported by gentle master fade. Musical resolution pending listening.','transition_reason':'Provisional overlap at body regions, not full-source ending; 4-second candidate remains unapproved by listening.'})
    graph.append({'track_id':t,'input':str(source),'source_sha256':analysis[t]['sha256']})

fade_in=int(1.5*SR);fade_out=6*SR
mix[:fade_in]*=(.5-.5*np.cos(np.linspace(0,np.pi,fade_in,dtype=np.float32)))[:,None]
mix[-fade_out:]*=(.5+.5*np.cos(np.linspace(0,np.pi,fade_out,dtype=np.float32)))[:,None]
assert np.isfinite(mix).all()
peak=float(np.max(np.abs(mix)))
assert peak<1,'Candidate clipping'

def write_wav(path,data):
    r=subprocess.run([FF,'-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','pipe:0','-c:a','pcm_s24le',str(path)],input=data.astype('<f4').tobytes(),capture_output=True)
    if r.returncode:raise RuntimeError(r.stderr.decode())

plan={'status':'PROVISIONAL_REVIEW_CANDIDATE_LISTENING_REQUIRED','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'preferred_order':['A','B','C'],'sample_rate':SR,'samples_per_channel':TOTAL,'duration_seconds':TOTAL/SR,'segments':segments,'transitions':[{'id':'A-B','global_start':positions[1]/SR,'global_end':(positions[1]+cross)/SR,'duration':4,'curve':'sin/cos equal-power','listening_status':'NOT_PERFORMED'},{'id':'B-C','global_start':positions[2]/SR,'global_end':(positions[2]+cross)/SR,'duration':4,'curve':'sin/cos equal-power','listening_status':'NOT_PERFORMED'}],'master_fade_in':{'start':0,'duration':1.5,'curve':'half cosine'},'master_fade_out':{'start':(TOTAL-fade_out)/SR,'duration':6,'curve':'half cosine'},'looping':False,'tempo_pitch_processing':False,'actual_listening_status':'NOT_PERFORMED','important_limit':'Technical timing/gain choices are audition proposals, not musical or perceptual QA approval. Do not mux until actual source, transitions and full mix listening review passes.'}
(OUT/'music-edit-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
wav=OUT/'WF311613-lofi-mix-pass01.wav'
write_wav(wav,mix)
subprocess.run([FF,'-v','error','-y','-i',str(wav),'-c:a','aac','-b:a','256k','-ar',str(SR),'-ac','2','-movflags','+faststart',str(OUT/'WF311613-lofi-mix-pass01-preview.m4a')],check=True)
for name,pos in [('transition-A-B.wav',positions[1]),('transition-B-C.wav',positions[2])]:
    write_wav(OUT/name,mix[pos-10*SR:pos+cross+10*SR])
write_wav(OUT/'intro-music-review.wav',mix[:40*SR])
write_wav(OUT/'final-fade-review.wav',mix[-30*SR:])

windows=mix[:TOTAL//4800*4800].reshape(-1,4800,2)
rms=np.sqrt(np.mean(windows.astype(np.float64)**2,axis=(1,2)))
low=np.where(rms<10**(-70/20))[0]
interior_low=[float(i/10) for i in low if i>=15 and i<(TOTAL-fade_out)/4800]
left_right=[float(np.sqrt(np.mean(mix[:,c].astype(np.float64)**2))) for c in (0,1)]
qa={'status':'TECHNICAL_CHECKS_ONLY_LISTENING_PENDING','samples_per_channel':TOTAL,'duration_seconds':TOTAL/SR,'sample_rate':SR,'channels':2,'wav_codec':'pcm_s24le','candidate_sample_peak_dbfs':20*np.log10(peak),'all_samples_finite':True,'clipping':'PASS_NO_ADDED_SAMPLE_CLIPPING','interior_100ms_windows_below_minus70_dbfs':interior_low,'rms_left_right':left_right,'rms_channel_difference_db':20*np.log10(left_right[0]/left_right[1]),'source_mp3_true_peak_warning':'Source decoder true peaks exceeded 0 dBTP in technical measurements; gain reduction used for final candidate headroom. Existing source damage cannot be ruled out by metrics.','musical_phrase_validation':'NOT_PERFORMED','perceptual_loudness_matching':'NOT_PERFORMED','transition_flams_bass_harmonic_collision_pops':'LISTENING_REQUIRED','full_8m44_listening':'NOT_PERFORMED','final_mux':'NOT_CREATED_DUE_TO_LISTENING_GATE'}
(OUT/'audio-technical-qa.json').write_text(json.dumps(qa,indent=2)+'\n')
(OUT/'zero-SFX-verification.json').write_text(json.dumps({'status':'PASS_CANDIDATE_MUSIC_ONLY_GRAPH','inputs':graph,'WF311613-SFX-pass01.wav_used':False,'AudioCuePlan_applied':False,'procedural_SFX_assets_used':False,'narration_used':False,'workshop_ambience_used':False,'other_audio_layers':False,'operations':['source decode/resample','source trim','constant gain','sin/cos crossfade','master fade','PCM write','AAC preview encode'],'loops':False,'video_input':None,'final_mux_created':False},indent=2)+'\n')
print(json.dumps({'wav':str(wav),'duration':TOTAL/SR,'segments':segments,'transitions':plan['transitions'],'qa':qa},indent=2))
