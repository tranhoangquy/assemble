from pathlib import Path
import numpy as np,json,subprocess
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];source=ROOT.parents[1]/'final/lofi-music-pass02/WF311613-lofi-mix-pass02.wav'
rate=16000;hop=128;win=1024
x=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-ac','1','-ar',str(rate),'-f','f32le','-']),dtype='<f4')
frames=np.lib.stride_tricks.sliding_window_view(x,win)[::hop]
flux=[];lowflux=[];prev=np.zeros(win//2+1);window=np.hanning(win)
for begin in range(0,len(frames),512):
 mag=np.log1p(np.abs(np.fft.rfft(frames[begin:begin+512]*window,axis=1)))
 delta=np.maximum(np.diff(np.vstack([prev,mag]),axis=0),0)
 flux.extend(delta.sum(axis=1));lowflux.extend(delta[:,2:15].sum(axis=1));prev=mag[-1]
flux=np.asarray(flux);lowflux=np.asarray(lowflux);times=(np.arange(len(flux))*hop+win/2)/rate
np.savez(ROOT/'evidence/onset-features.npz',times=times,flux=flux,lowflux=lowflux)
rows=[]
for label,start,end in [('A-body1',20,59),('A-body2',100,139),('A-final-body',160,190),('B-body',250,290),('C-body',340,400)]:
 f=flux[(times>=start)&(times<end)];f=f-f.mean();nfft=1<<(2*len(f)-1).bit_length();s=np.fft.rfft(f,nfft);ac=np.fft.irfft(s*np.conj(s),nfft)[:len(f)];ac/=np.arange(len(f),0,-1)
 periods=np.linspace(.44,1.,2000);scores=np.interp(periods*rate/hop,np.arange(len(ac)),ac)+.35*np.interp(2*periods*rate/hop,np.arange(len(ac)),ac)
 peaks=[i for i in range(1,len(scores)-1) if scores[i]>scores[i-1] and scores[i]>scores[i+1]];top=sorted(peaks,key=lambda i:scores[i],reverse=True)[:5]
 candidates=[{'bpm':float(60/periods[i]),'period':float(periods[i]),'score':float(scores[i]/scores.max())} for i in top]
 if label.startswith('A'):
  lo,hi=.60,.65
 else:lo,hi=.44,1.
 mask=(periods>=lo)&(periods<=hi);period=float(periods[np.where(mask)[0][np.argmax(scores[mask])]])
 phase_candidates=np.linspace(0,period,1000,endpoint=False);phase_scores=[np.interp(np.arange(start+p,end,period),times,flux).mean() for p in phase_candidates];phase=float((start+phase_candidates[np.argmax(phase_scores)])%period)
 # Fixed 96 BPM hypothesis independently compare phase fit; this is inference.
 fixed=.625;pp=np.linspace(0,fixed,1250,endpoint=False);ps=[np.interp(np.arange(start+p,end,fixed),times,lowflux).mean() for p in pp];fixed_phase=float((start+pp[np.argmax(ps)])%fixed)
 rows.append({'region':label,'source_in':start,'source_out':end,'candidates':candidates,'selected_period':period,'phase':phase,'96bpm_low_frequency_phase':fixed_phase,'listening_confirmed':False})
bins=x[:len(x)//rate*rate].reshape(-1,rate);db=20*np.log10(np.maximum(np.sqrt(np.mean(bins.astype(np.float64)**2,axis=1)),1e-12))
report={'method':'8ms spectral onset flux/autocorrelation + 1s RMS; 4/4 and downbeat assignments are provisional without hearing','regions':rows,'rms_dbfs_per_second':db.tolist(),'source_form_inferences':{'A':'Low-energy opening 0–20; groove 20–60; sparse passage 60–100; stronger groove 100–140; sparse break/bridge 140–160; later groove 160–192.5. Long AB crossfade excluded from edit candidates.','B':'Long master retains both sparse and active source sections; an independent Short track change risks losing continuous sonic identity.','C':'Available continuous region excludes source-song final outro; Long imposed 6s fade is not a Short ending.'},'actual_listening':'NOT RUN'}
(ROOT/'evidence/music-structure-analysis.json').write_text(json.dumps(report,indent=2))
im=Image.new('RGB',(1600,500),'#f6f4ee');draw=ImageDraw.Draw(im)
for i in range(192):
 px=50+i*8;h=int(max(0,min(350,(db[i]+50)*10)));draw.line((px,440,px,440-h),fill='#356e82',width=5)
for t,label in [(20,'body 1'),(60,'sparse'),(100,'body 2'),(140,'break / release'),(160,'late body')]:
 px=50+t*8;draw.line((px,60,px,450),fill='#b47a30');draw.text((px+5,30),f'{t}s {label}',fill='#222222')
draw.text((50,470),'Approved Pass02 source A region: 1-second RMS (not a listening judgment)',fill='#222222');im.save(ROOT/'evidence/source-A-structure.png')
for r in rows:print(r)
print('A onsets near selected landmarks:')
for center in [20,25,50,52.5,100,110,112.5,115,135,137.5,140,142]:
 ids=np.where((times>center-.3)&(times<center+.3))[0];selected=ids[np.argsort(lowflux[ids])[-3:]];print(center,[(round(float(times[i]),4),round(float(lowflux[i]),2)) for i in selected])
