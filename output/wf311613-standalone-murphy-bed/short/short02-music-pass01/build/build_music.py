from pathlib import Path
import numpy as np,json,subprocess,hashlib,re
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT.parents[1]/'final/lofi-music-pass02/WF311613-lofi-mix-pass02.wav';SR=48000;TOTAL=58*SR

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(SOURCE)=='75b282e6e55a65923b00c152099f47e194b66c007f2e8053ccf6b9ec66690b2b'
x=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(SOURCE),'-ar',str(SR),'-ac','2','-f','f32le','-']),dtype='<f4').reshape(-1,2)
def sample(t):return round(t*SR)
def write_wav(p,y):
 assert not p.exists(),f'Will not overwrite {p}'
 subprocess.run(['ffmpeg','-v','error','-f','f32le','-ar',str(SR),'-ac','2','-i','pipe:0','-c:a','pcm_s24le',str(p)],input=y.astype('<f4').tobytes(),check=True)
def measure(p):
 r=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(p),'-af','loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True);assert r.returncode==0
 (ROOT/'evidence'/f'{p.stem}-loudness.log').write_text(r.stderr)
 return json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}')+1])
def finish(raw,speed=1.0):
 if speed!=1:
  z=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-f','f32le','-ar',str(SR),'-ac','2','-i','pipe:0','-af',f'atempo={speed:.12f}','-f','f32le','-'],input=raw.astype('<f4').tobytes()),dtype='<f4').reshape(-1,2).copy()
 else:z=raw.copy()
 before=len(z);adjust=TOTAL-before
 # WSOLA may end with a small sample-count discrepancy. Preserve its whole
 # output: distribute this tiny correction over the audio, never the picture.
 if before!=TOTAL:
  old=np.arange(before);new=np.linspace(0,before-1,TOTAL);z=np.stack([np.interp(new,old,z[:,c]) for c in range(2)],axis=1).astype(np.float32)
 t=np.arange(TOTAL)/SR
 points=[0,27,38,52,56,57.3,58];db=[0,0,.4,.4,.6,.6,.6];automation=np.interp(t,points,db)
 z*=10**(automation[:,None]/20)
 n=sample(.008);z[:n]*=(.5-.5*np.cos(np.linspace(0,np.pi,n)))[:,None]
 n=sample(.7);z[-n:]*=(.5+.5*np.cos(np.linspace(0,np.pi,n)))[:,None]
 return z,{'atempo_speed':speed,'atempo_output_samples':before,'sample_count_adjustment':adjust,'correction':'Uniform linear sample-grid interpolation only if WSOLA ends a few samples off; documented additional rate/pitch ratio','additional_rate_ratio':before/TOTAL,'endpoint_fade':{'start':57.3,'end':58,'curve':'half cosine'},'entry_declick_seconds':.008,'gain_automation':{'global_seconds':points,'gain_db':db,'interpolation':'linear dB; <=0.6dB total'}}
# Diagnostic continuous excerpt: it contains a body-to-sparse drop and has no
# deliberate source phrase ending. Not selected / not director-facing.
v1,p1=finish(x[sample(22.61):sample(80.61)])
first_in=22.61;first_out=50.11;shift=59.996;end=141.766;speed=1.02
candidates=[('v2-one-beat',.625,'complementary half-cosine'),('v3-one-bar',2.5,'sin/cos equal-power')]
record=[]
for name,overlap,curve in candidates:
 a=x[sample(first_in):sample(first_out)].copy();start=first_out-first_in-overlap;second_in=first_in+start+shift;b=x[sample(second_in):sample(end)].copy();n=sample(overlap);u=np.linspace(0,1,n)
 if curve=='complementary half-cosine':incoming=.5-.5*np.cos(np.pi*u);outgoing=1-incoming
 else:incoming=np.sin(np.pi*u/2);outgoing=np.cos(np.pi*u/2)
 a[-n:]*=outgoing[:,None];b[:n]*=incoming[:,None]
 raw=np.zeros((sample(start)+len(b),2),dtype=np.float32);raw[:len(a)]+=a;raw[sample(start):]+=b
 assert len(raw)==sample(59.16),len(raw)
 z,processing=finish(raw,speed)
 path=ROOT/'internal-iterations'/f'{name}-unlevelled.wav';write_wav(path,z);m=measure(path)
 # Fixed gain to target -15 LUFS, without dynamics/EQ/limiter. All candidate
 # comparisons use the same integrated target.
 gain=-15-float(m['input_i']);z*=10**(gain/20)
 finalpath=ROOT/'internal-iterations'/f'{name}.wav';write_wav(finalpath,z);finalm=measure(finalpath)
 block=z.reshape(580,4800,2).astype(np.float64);rms=np.sqrt(np.mean(block*block,axis=(1,2)));db=20*np.log10(np.maximum(rms,1e-12))
 ranges={}
 for label,lo,hi in [('hook',0,2),('assembly',2,27),('connection',27,38),('mechanism',38,46),('legs',46,52),('payoff',52,57.3),('ending',57.3,58)]:
  y=z[sample(lo):sample(hi)].astype(np.float64);ranges[label]={'rms_dbfs':float(20*np.log10(np.sqrt(np.mean(y*y)))),'peak_dbfs':float(20*np.log10(np.max(np.abs(y))))}
 crossing=[{'source_in_seconds':first_in,'source_out_seconds':first_out,'source_in_samples':sample(first_in),'source_out_samples':sample(first_out),'global_start':0,'global_end':(first_out-first_in)/speed}, {'source_in_seconds':second_in,'source_out_seconds':end,'source_in_samples':sample(second_in),'source_out_samples':sample(end),'global_start':start/speed,'global_end':58}]
 rec={'id':name,'path':str(finalpath),'sha256':sha(finalpath),'source_regions':crossing,'source_overlap':overlap,'global_crossfade':{'start':start/speed,'end':(first_out-first_in)/speed,'duration':overlap/speed,'curve':curve},'processing':processing,'linear_gain_db':gain,'measured_loudness':finalm,'section_energy':ranges,'finite_samples':bool(np.isfinite(z).all()),'sample_peak_dbfs':float(20*np.log10(np.max(np.abs(z)))),'interior_100ms_below_minus70':np.where(db[1:573]<-70)[0].tolist(),'actual_listening':'NOT RUN','provisional_form':'Source A only; 24-bar source offset preserves provisional harmonic/rhythmic phase. Source tail releases after 140.7s, no Long crossfade or full-song intro.'}
 record.append(rec);print(name,finalm,processing,ranges,flush=True)
# Retain diagnostic first attempt and its exact numerical evidence.
write_wav(ROOT/'internal-iterations/v1-continuous-excerpt.wav',v1)
r1={'id':'v1-continuous-excerpt','path':str(ROOT/'internal-iterations/v1-continuous-excerpt.wav'),'source_regions':[{'source_in':22.61,'source_out':80.61}],'rejected':'Contains source sparse passage after 60s => global37.39s, reducing energy through mechanism/payoff; no intentional phrase release at the hero.','loudness':measure(ROOT/'internal-iterations/v1-continuous-excerpt.wav'),'actual_listening':'NOT RUN'}
selected=record[0];assert selected['finite_samples'] and not selected['interior_100ms_below_minus70']
assert -16<=float(selected['measured_loudness']['input_i'])<=-14 and float(selected['measured_loudness']['input_tp'])<-1
import shutil
wav=ROOT/'WF311613-short02-music-pass01.wav';assert not wav.exists();shutil.copyfile(Path(selected['path']),wav)
plan={'version':'Short02 music Pass01','status':'REQUIRES DIRECTOR AUDIO REVIEW','source':{'path':str(SOURCE),'sha256':sha(SOURCE)},'selected_candidate':selected,'timeline_seconds':58,'sample_rate':SR,'channels':2,'samples_per_channel':TOTAL,'output_wav':str(wav),'output_sha256':sha(wav),'tempo_hypothesis_bpm':96.14583,'tempo_after_2percent_adjustment_bpm':98.0687466,'tempo_confidence':'Provisional spectral pulse; meter/downbeat/harmonic interpretation not listening-confirmed','picture_retimed':False,'additional_tracks':[],'SFX':False,'limiter':False,'EQ':False,'new_instruments':False,'loops':False,'source_repetition':'Reordered existing comparable source A phrases; no synthetic loop','selection_reason':'Continuous established groove at entry; a one-beat complementary crossfade brings stronger source phrase near picture27s; source release/short tail retained for hero, level matched without limiting. Selected on structural/technical evidence; hearing review remains pending.'}
(ROOT/'music-edit-plan.json').write_text(json.dumps(plan,indent=2));(ROOT/'evidence/internal-iterations.json').write_text(json.dumps({'iterations':[r1]+record,'selected':'v2-one-beat','v3_not_selected_reason':'Longer simultaneous-texture overlap and equal-power overlap provide no necessary structural advantage; one-beat phase-aligned edit is less invasive. This is not a listening judgment.','actual_listening':'NOT RUN'},indent=2))
assert sha(SOURCE)==plan['source']['sha256']
