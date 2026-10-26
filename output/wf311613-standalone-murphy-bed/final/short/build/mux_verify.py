from pathlib import Path
import json,subprocess,hashlib,re,struct,numpy as np
R=Path(__file__).resolve().parents[1]; E=R/'evidence'
V=R.parent/'short02-music-pass01/WF311613-short02-music-review-pass01-vertical-1080p.mp4'
W=R/'WF311613-short02-FINAL-music-master.wav'; M=R/'WF311613-short02-FINAL-vertical-1080p.mp4'; P=R/'WF311613-short02-FINAL-music-preview.m4a'
def run(cmd,log=None):
 p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if log:(E/log).write_bytes(p.stderr)
 assert p.returncode==0,p.stderr.decode()[-3000:]
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def save(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def probe(p):return json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(p)]))
assert not M.exists() and not P.exists()
cmd=['ffmpeg','-hide_banner','-nostdin','-i',str(V),'-i',str(W),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-map_metadata','-1','-movflags','+faststart','-movie_timescale','48000',str(M)]
save(R/'mux-command.json',{'argv':cmd,'video_stream_copy':True,'audio_filters':None,'picture_retimed':False})
run(cmd,'mux.log');print('MUX DONE',flush=True)
run(['ffmpeg','-hide_banner','-nostdin','-i',str(M),'-map','0:a:0','-c:a','copy','-map_metadata','-1','-movflags','+faststart',str(P)],'preview.log')
probes={k:probe(p) for k,p in [('source',V),('wav',W),('review',M),('preview',P)]}
for k,x in probes.items():save(E/f'ffprobe-{k}.json',x)
v=next(s for s in probes['review']['streams'] if s['codec_type']=='video'); a=next(s for s in probes['review']['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],v['nb_read_frames'],v['codec_name'],v['pix_fmt'])==(1080,1920,'30/1','1740','h264','yuv420p')
assert v['duration']=='58.000000' and a['duration']=='58.000000' and a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2
packets={}
for k,p in [('source',V),('review',M)]:
 packets[k]=json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_packets','-show_data_hash','sha256','-of','json',str(p)]))['packets']
 save(E/f'video-packets-{k}.json',packets[k])
fields=['pts','dts','duration','size','flags','data_hash','side_data_list']
assert [[x.get(f) for f in fields] for x in packets['source']]==[[x.get(f) for f in fields] for x in packets['review']]
sv=probes['source']['streams'][0]; assert sv['time_base']==v['time_base']
# Separate independent decoding compares all decoded images and presentation timing.
md={}
for k,p in [('source',V),('review',M)]:
 md[k]=run(['ffmpeg','-v','error','-nostdin','-i',str(p),'-map','0:v:0','-an','-f','framemd5','-']); (E/f'decoded-video-{k}.framemd5').write_bytes(md[k]); print('FRAME DECODE',k,flush=True)
assert md['source']==md['review']
run(['ffmpeg','-v','error','-nostdin','-i',str(M),'-map','0:v:0','-map','0:a:0','-f','null','-'],'full-av-decode.log')
atoms=[]
with M.open('rb') as f:
 pos=0; end=M.stat().st_size
 while pos<end:
  f.seek(pos); h=f.read(8); size,t=struct.unpack('>I4s',h)
  if size==1:size=struct.unpack('>Q',f.read(8))[0]
  if size==0:size=end-pos
  atoms.append({'type':t.decode(),'offset':pos,'size':size});pos+=size
assert next(x['offset'] for x in atoms if x['type']=='moov')<next(x['offset'] for x in atoms if x['type']=='mdat')
def decode(p):return np.frombuffer(run(['ffmpeg','-v','error','-i',str(p),'-map','0:a:0','-f','f32le','-acodec','pcm_f32le','-']),dtype='<f4').reshape(-1,2)
w=decode(W); aa=decode(M); assert len(w)==2784000 and np.isfinite(w).all() and np.isfinite(aa).all()
assert np.max(np.abs(w[-1]))==0 and np.max(np.abs(w))<1 and np.max(np.abs(aa))<1
alignment=[]
for t in [1,25,26.7,35,43,53,56.8]:
 start=round(t*48000); n=24000; x=w[start:start+n].mean(axis=1).astype(np.float64); y=aa[start-1024:start+n+1024].mean(axis=1).astype(np.float64)
 # Exact correlation over +/-1024 offsets, FFT convolution accelerates.
 fftn=1<<(len(x)+len(y)-1).bit_length(); c=np.fft.irfft(np.fft.rfft(y,fftn)*np.fft.rfft(x[::-1],fftn),fftn)
 scores=c[n-1:n-1+2049]; lag=int(np.argmax(scores))-1024
 yy=aa[start+lag:start+lag+n]; xx=w[start:start+n]
 alignment.append({'global_seconds':t,'lag_samples':lag,'lag_ms':lag/48,'correlation':float(np.corrcoef(xx.ravel(),yy.ravel())[0,1]),'rms_error_dbfs':float(20*np.log10(np.sqrt(np.mean((xx-yy)**2))))})
assert all(x['lag_samples']==0 and x['correlation']>.98 for x in alignment)
# Read-only loudness analysis. Only input_* measurements describe actual encoded file.
run(['ffmpeg','-hide_banner','-nostdin','-i',str(M),'-map','0:a:0','-af','loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json','-f','null','-'],'review-aac-loudness.log')
log=(E/'review-aac-loudness.log').read_text(); loud=json.loads(re.findall(r'\{\s*"input_i".*?\}',log,re.S)[-1]); actual={k:loud[k] for k in ['input_i','input_tp','input_lra','input_thresh']}
assert -15<=float(actual['input_i'])<=-14 and float(actual['input_tp'])< -1
blocks=np.sqrt(np.mean(aa[:2784000].reshape(580,4800,2).astype(np.float64)**2,axis=(1,2))); gaps=np.where(20*np.log10(np.maximum(blocks,1e-12))< -70)[0].tolist();assert not [i for i in gaps if 1<i<570]
step=np.max(np.abs(np.diff(w,axis=0)),axis=1); seams=[]
for t in [26.3480392157,26.9607843137,57.7]:
 i=round(t*48000); radius=480
 seams.append({'nominal_seconds':t,'max_adjacent_sample_step_within_10ms':float(np.max(step[i-radius:i+radius])),'overall_max_adjacent_sample_step':float(np.max(step)),'interpretation':'Numeric diagnostic only; not an audible click/pop listening verdict.'})
# Verify original approved picture as well as the stream-copied Pass01 input.
original=R.parent/'short02-visual-review-v1/WF311613-short02-visual-review-v1-vertical-1080p.mp4'
op=json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_packets','-show_data_hash','sha256','-of','json',str(original)]))['packets']
assert [[x.get(f) for f in fields] for x in op]==[[x.get(f) for f in fields] for x in packets['review']]
originalmd=(R.parent/'short02-music-pass01/evidence/decoded-video-source.framemd5').read_bytes()
assert originalmd==md['review']
codec={}
for k,p in [('original',original),('source',V),('final',M)]:
 info=json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_streams','-show_data_hash','sha256','-of','json',str(p)]))['streams'][0]
 codec[k]={f:info.get(f) for f in ['codec_name','profile','codec_tag_string','level','width','height','pix_fmt','r_frame_rate','avg_frame_rate','time_base','start_pts','duration_ts','extradata_size','extradata_hash']}
assert codec['original']==codec['source']==codec['final']
save(E/'video-codec-extradata-identity.json',codec)
# Full preview stream copies the same final AAC payload. Compact ending excerpt optional.
ending=R/'WF311613-short02-FINAL-ending-preview.m4a'
run(['ffmpeg','-v','error','-nostdin','-i',str(M),'-ss','52','-t','6','-map','0:a:0','-c:a','aac','-b:a','256k','-movflags','+faststart',str(ending)],'ending-preview.log')
save(R/'listening-artifacts.json',{'agent_actual_listening':'NOT RUN','full_preview':str(P),'full_preview_sha256':sha(P),'ending_excerpt':str(ending),'ending_excerpt_sha256':sha(ending),'ending_range_seconds':[52,58],'preview_audio_stream_copy':True,'ending_excerpt_reencoded_from_final_aac':True})
report={'status':'PASS','scope':'Mandatory final technical media QA; director authorized final designation; agent actual listening NOT RUN','intended_timeline_seconds':58,'video':{'duration':v['duration'],'codec':v['codec_name'],'pix_fmt':v['pix_fmt'],'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'frames':1740,'bitstream_payload_and_packet_timing_identical':True,'decoded_all_1740_frames_and_timestamps_identical':True,'original_approved_visual_packet_identity':True,'codec_extradata_identical':True,'stream_time_base':v['time_base']},'audio':{'wav_codec':probes['wav']['streams'][0]['codec_name'],'wav_samples_per_channel':len(w),'wav_duration_seconds':len(w)/48000,'review_codec':a['codec_name'],'sample_rate':48000,'channels':2,'declared_duration_seconds':float(a['duration']),'review_decoded_samples_per_channel':len(aa),'aac_padding_samples_per_channel':len(aa)-len(w),'aac_padding_seconds':(len(aa)-len(w))/48000,'padding_note':'AAC uses whole 1024-sample frames. MP4 duration/edit metadata defines 58s; decoder may expose trailing frame padding. No video extension or truncation.','encoded_loudness':actual,'wav_final_sample_zero':True,'finite_samples':True,'clipped_samples':int(np.sum(np.abs(aa)>=1)),'interior_100ms_silence_below_minus70dbfs':[],'100ms_below_minus70_including_tail':gaps,'seam_diagnostics':seams},'av_sync':{'status':'PASS','video_start':v['start_time'],'audio_start':a['start_time'],'waveform_alignment':alignment,'note':'Zero measured lag at seven locations including splice and end; no drift. Perceptual rhythm/picture fit remains director review.'},'full_av_decode':'PASS','faststart':{'status':'PASS','atoms':atoms},'hashes':{'wav':sha(W),'review_mp4':sha(M),'preview_m4a':sha(P)},'actual_listening':'NOT RUN','voice_check':'VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING'}
save(R/'FINAL-MEDIA-VERIFICATION.json',report);print(json.dumps(report,indent=2),flush=True)
