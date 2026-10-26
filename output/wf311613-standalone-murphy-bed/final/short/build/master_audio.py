from pathlib import Path
import hashlib,json,subprocess,re,numpy as np
R=Path(__file__).resolve().parents[1]; OLD=R.parent/'short02-music-pass01'; WORK=Path('/Users/quyth/development/three/POC');E=R/'evidence'; SR=48000;N=2784000
W=OLD/'WF311613-short02-music-pass01.wav';V=OLD/'WF311613-short02-music-review-pass01-vertical-1080p.mp4';FINAL=R/'WF311613-short02-FINAL-music-master.wav'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def save(p,d):p.write_text(json.dumps(d,indent=2)+'\n')
def run(cmd,log):
 p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE);(E/log).write_bytes(p.stderr);assert p.returncode==0,p.stderr.decode()[-2000:];return p.stdout
assert not FINAL.exists()
assert sha(W)=='d47f944271d3896f5c4bee0ce2c97bbb54e077daada318d7e23464990daf6c70'
assert sha(V)=='8816b48c9faec27b1597b9ba44b769e2f5e4be367191058e4949908abd6fb7f3'
visual=R.parent/'short02-visual-review-v1/WF311613-short02-visual-review-v1-vertical-1080p.mp4';assert sha(visual)=='aee283b9d7bf0653b45fd3bf357fc51ea98ad988ebabe532d371a2662d7cad98'
paths=set(json.loads((OLD/'evidence/protected-after.json').read_text()))
paths.update(str(p.relative_to(WORK)) for p in OLD.rglob('*') if p.is_file());before={p:sha(WORK/p) for p in sorted(paths)};save(E/'protected-before.json',before)
package=Path('/Users/quyth/.codex/attachments/5216381d-60c5-4ae5-9906-d81c62bfc825/Pasted text.txt')
save(R/'director-authorization.json',{'status':'DIRECTOR_AUTHORIZED_FINAL_MASTERING_AND_FINAL_DESIGNATION','package':str(package),'sha256':sha(package),'music_basis':{'path':str(W),'sha256':sha(W)},'video_mux_input':{'path':str(V),'sha256':sha(V)},'original_visual':{'path':str(visual),'sha256':sha(visual)},'authorized_changes':['smooth gain envelope','gentle compression','final level adjustment','delayed short endpoint fade','AAC encode'],'creative_rearrangement':False,'publish_authorized':False,'agent_actual_listening':'NOT RUN'})
x=np.frombuffer(run(['ffmpeg','-v','error','-i',str(W),'-f','f32le','-acodec','pcm_f32le','-'],'source-decode.log'),dtype='<f4').reshape(-1,2).copy();assert len(x)==N
# Remove only the documented old fade analytically and apply the new fade.
# Ratio is bounded: at the common endpoint it tends to (.7/.3)^2, not infinity.
t=np.arange(N,dtype=np.float64)/SR
oldfade=np.ones(N);m=t>=57.3;oldfade[m]=.5*(1+np.cos(np.pi*(t[m]-57.3)/.7))
newfade=np.ones(N);m=t>=57.7;newfade[m]=.5*(1+np.cos(np.pi*(t[m]-57.7)/.3))
ratio=np.ones(N);m=t>=57.3;ratio[m]=newfade[m]/oldfade[m]
assert np.max(ratio)<5.445
# Subtle level smoothing: reverse old creative .4/.6 envelope, lift hook .35dB,
# and add only 2dB gradual support to the natural release (not a tail normalizer).
oldgain=np.interp(t,[0,27,38,52,56,57.3,58],[0,0,.4,.4,.6,.6,.6])
newgain=np.interp(t,[0,2,27,52,56.75,57.3,57.7,58],[.35,.35,0,0,0,2,2,2])
# Compress BEFORE endpoint fade reshaping: compressor never reacts to undo-fade lift.
# Recover existing source fade only at a bounded safe value, compress quiet body,
# and apply ratio after compressor. No change in sample timing or splice.
pre=x*(10**((newgain-oldgain)/20))[:,None]
pre=pre.astype('<f4')
filt='acompressor=threshold=0.125892541:ratio=1.25:attack=25:release=180:knee=2.828427125:makeup=1:link=average:detection=rms'
cmd=['ffmpeg','-v','error','-f','f32le','-ar','48000','-ac','2','-i','pipe:0','-af',filt,'-f','f32le','-acodec','pcm_f32le','pipe:1']
p=subprocess.run(cmd,input=pre.tobytes(),stdout=subprocess.PIPE,stderr=subprocess.PIPE);(E/'compression.log').write_bytes(p.stderr);assert p.returncode==0
comp=np.frombuffer(p.stdout,dtype='<f4').reshape(-1,2).copy();assert len(comp)==N
mask=np.abs(pre)>1e-3;gr=-20*np.log10(np.maximum(np.abs(comp[mask]/pre[mask]),1e-12));grstats={'max_db':float(np.max(gr)),'median_db':float(np.median(gr)),'p95_db':float(np.percentile(gr,95))};assert grstats['max_db']<3.5
processed=comp.astype(np.float64)*ratio[:,None];processed[-1]=0
# Archive pre-level working file, then choose a STATIC gain from measurements.
def write(p,data):
 assert not p.exists()
 cmd=['ffmpeg','-v','error','-f','f32le','-ar','48000','-ac','2','-i','pipe:0','-c:a','pcm_s24le',str(p)]
 q=subprocess.run(cmd,input=data.astype('<f4').tobytes(),stdout=subprocess.PIPE,stderr=subprocess.PIPE);assert q.returncode==0,q.stderr.decode();return cmd
raw=R/'build/pre-level-master.wav';write(raw,processed)
def measure(p,name):
 run(['ffmpeg','-hide_banner','-i',str(p),'-af','loudnorm=I=-14.5:TP=-1:LRA=11:print_format=json','-f','null','-'],name)
 text=(E/name).read_text();d=json.loads(re.findall(r'\{\s*"input_i".*?\}',text,re.S)[-1]);return {k:float(d[k]) for k in ['input_i','input_tp','input_lra','input_thresh']}
rawmeasure=measure(raw,'pre-level-loudness.log');gain=-14.5-rawmeasure['input_i'];y=processed*10**(gain/20);assert np.isfinite(y).all() and np.max(np.abs(y))<1
writecmd=write(FINAL,y);finalmeasure=measure(FINAL,'final-wav-loudness.log');assert -15<=finalmeasure['input_i']<=-14 and finalmeasure['input_tp']<=-1
sections={}
for a,b,name in [(0,2,'hook'),(2,27,'assembly'),(27,38,'connection'),(38,46,'mechanism'),(46,52,'anchoring'),(52,57,'payoff-before-hero'),(57,57.3,'hero-early'),(57.3,57.6,'hero-middle'),(57.6,57.7,'hero-presence-before-fade'),(57.7,58,'final-fade')]:
 s=round(a*SR);e=round(b*SR);sections[name]={'start':a,'end':b,'pass01_rms_dbfs':float(20*np.log10(np.sqrt(np.mean(x[s:e].astype(np.float64)**2)))),'final_rms_dbfs':float(20*np.log10(np.sqrt(np.mean(y[s:e]**2))))}
config={'status':'MASTERING_COMPLETE_PENDING_TECHNICAL_MUX_QA','input_sha256':sha(W),'input_path':str(W),'sample_rate':SR,'samples_per_channel':N,'arrangement_unchanged':True,'time_adjustment':False,'EQ':False,'compression':{'ffmpeg_filter':filt,'exact_argv':cmd,'gain_reduction':grstats},'old_creative_gain_removed':{'times':[0,27,38,52,56,57.3,58],'db':[0,0,.4,.4,.6,.6,.6]},'new_smooth_gain':{'times':[0,2,27,52,56.75,57.3,57.7,58],'db':[.35,.35,0,0,0,2,2,2],'interpolation':'linear dB; no steps'},'ending':{'old_fade':{'start':57.3,'end':58,'curve':'half-cosine'},'new_fade':{'start':57.7,'end':58,'curve':'half-cosine'},'new_fade_start_sample':2769600,'final_endpoint_samples':N,'implementation':'Analytic ratio newfade/oldfade applied to supplied Pass01 samples; bounded even approaching endpoint. Final PCM sample set zero. No tail reconstruction or new musical samples.','max_old_fade_correction_ratio':float(np.max(ratio)),'additional_natural_tail_gain_db':2,'note':'Fade correction undoes only known early fade, not underlying natural decay; underlying decay is preserved. No upward tail level normalization.'},'fixed_gain_db':gain,'pre_level_measurement':rawmeasure,'wav_measurement':finalmeasure,'limiter':'Not engaged: substantial measured true-peak headroom, no limiting required to meet -1dBTP; avoids unnecessary dynamics change.','sections':sections,'output':str(FINAL),'output_sha256':sha(FINAL),'wav_write_argv':writecmd,'loudness_measurement_only':'input_* from loudnorm-to-null; no dynamic normalization applied','actual_listening':'NOT RUN; numerical envelope and mastering only'};save(R/'mastering-configuration.json',config)
print(json.dumps(config,indent=2),flush=True)
