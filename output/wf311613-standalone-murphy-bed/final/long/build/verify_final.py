from pathlib import Path
import subprocess, json, hashlib, concurrent.futures, re, shutil, datetime
import numpy as np

OUT=Path(__file__).resolve().parents[1];ROOT=OUT.parent
V=ROOT/'director-approved-full-720p-20261004/WF311613-director-approved-full-720p.mp4'
A=ROOT/'lofi-music-pass02/WF311613-lofi-mix-pass02.wav'
PREVIEW=A.with_name('WF311613-lofi-mix-pass02-preview.m4a')
FINAL=OUT/'WF311613-final-lofi-720p.mp4'
FF='/opt/homebrew/bin/ffmpeg';FP='/opt/homebrew/bin/ffprobe'
VHASH='0d5d898cbfaecb4573f07e818ce722c6884cbd4dc67d7c51b7c6c724f404ba0a'
AHASH='75b282e6e55a65923b00c152099f47e194b66c007f2e8053ccf6b9ec66690b2b'

def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(4194304),b''):h.update(b)
    return h.hexdigest()
def dump(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def probe(p):return json.loads(subprocess.check_output([FP,'-v','error','-show_streams','-show_format','-show_data_hash','sha256','-of','json',str(p)]))
def packets(p,stream):return json.loads(subprocess.check_output([FP,'-v','error','-select_streams',stream,'-show_packets','-show_data_hash','sha256','-show_entries','packet=pts,dts,duration,size,flags,data_hash,side_data_list','-of','json',str(p)]))['packets']
assert sha(V)==VHASH and sha(A)==AHASH
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
    jobs=[ex.submit(packets,V,'v:0'),ex.submit(packets,FINAL,'v:0'),ex.submit(packets,PREVIEW,'a:0'),ex.submit(packets,FINAL,'a:0')]
    original,finalvideo,previewaudio,finalaudio=[j.result() for j in jobs]
assert len(original)==len(finalvideo)==15722
assert original==finalvideo,'Video packets altered'
assert previewaudio==finalaudio, 'AAC packets changed relative to approved preview'
vp=probe(V);fp=probe(FINAL);ap=probe(A)
vs=vp['streams'][0];fs=next(s for s in fp['streams'] if s['codec_type']=='video');audio=next(s for s in fp['streams'] if s['codec_type']=='audio')
fields=['codec_name','profile','width','height','pix_fmt','r_frame_rate','avg_frame_rate','time_base','start_pts','duration_ts','nb_frames','extradata_hash']
assert all(vs.get(k)==fs.get(k) for k in fields)
assert fs['nb_frames']=='15722' and fs['r_frame_rate']=='30/1'
assert audio['sample_rate']=='48000' and audio['channels']==2 and audio['codec_name']=='aac'
assert audio['duration_ts']==25155200 and abs(float(fp['format']['duration'])-524.066667)<.001
dump('video-stream-identity.json',{'status':'PASS','packet_count':len(finalvideo),'frame_count':int(fs['nb_frames']),'comparison':'Every ordered packet PTS, DTS, duration, size, flags, side data and SHA256 payload matched','original_packet_sequence_sha256':hashlib.sha256(json.dumps(original,sort_keys=True).encode()).hexdigest(),'final_packet_sequence_sha256':hashlib.sha256(json.dumps(finalvideo,sort_keys=True).encode()).hexdigest(),'stream_fields':{k:{'original':vs.get(k),'final':fs.get(k)} for k in fields}})
dump('evidence/video-packets-approved.json',original);dump('evidence/video-packets-final.json',finalvideo)
dump('aac-preview-identity.json',{'status':'PASS','packets':len(finalaudio),'comparison':'All final AAC packet payload hashes, PTS/DTS/order and skip-sample metadata equal the approved Pass02 preview. Final edit-list stream duration preserves 32 samples (0.667ms) rounded off by the preview movie timescale; no AAC packet or payload changed','audio_stream_duration_samples':audio['duration_ts'],'last_packet':finalaudio[-1],'first_packet':finalaudio[0]})
dump('ffprobe-final.json',fp)

def full_decode():
    run=subprocess.run([FF,'-hide_banner','-nostats','-v','error','-xerror','-i',str(FINAL),'-map','0:v:0','-map','0:a:0','-progress','pipe:1','-f','null','-'],capture_output=True,text=True)
    (OUT/'evidence/full-av-decode.log').write_text(run.stderr+'\n'+run.stdout)
    frames=int(re.findall(r'^frame=(\d+)',run.stdout,re.M)[-1])
    assert run.returncode==0 and frames==15722 and 'progress=end' in run.stdout
    return {'status':'PASS','exit_code':run.returncode,'video_frames_decoded':frames,'video_expected_frames':15722,'audio_decode':'PASS','error_output':run.stderr,'complete_progress':True}
def loudness():
    run=subprocess.run([FF,'-hide_banner','-nostats','-i',str(FINAL),'-map','0:a:0','-af','ebur128=peak=true,astats=metadata=0:reset=0','-f','null','-'],capture_output=True,text=True)
    (OUT/'evidence/final-aac-loudness.log').write_text(run.stderr)
    assert run.returncode==0
    summary=run.stderr[run.stderr.rfind('Summary:'):]
    def val(p):return float(re.search(p,summary).group(1))
    peak=float(re.findall(r'Peak level dB:\s*([-+\d.]+)',run.stderr)[-1]);tp=val(r'Peak:\s*([-+\d.]+) dBFS')
    assert peak<0 and tp<0
    return {'status':'PASS','codec':'AAC LC','sample_rate':48000,'channels':2,'bitrate_bps':int(audio['bit_rate']),'duration_seconds':float(audio['duration']),'integrated_lufs':val(r'I:\s*([-+\d.]+) LUFS'),'true_peak_dbtp':tp,'decoded_sample_peak_dbfs':peak,'loudness_range_lu':val(r'LRA:\s*([-+\d.]+) LU'),'clipping':'PASS','measurement_rounding':'ebur128 summary LUFS/LRA/TP rounded to 0.1'}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
    one=ex.submit(full_decode);two=ex.submit(loudness);decode=one.result();metrics=two.result()
dump('full-av-decode.json',decode);dump('loudness-peak-report.json',metrics)

# Independently inspect AAC timing/tail against approved PCM; lossy audio need not be sample-identical.
def mono(p):return np.frombuffer(subprocess.check_output([FF,'-v','error','-i',str(p),'-map','0:a:0','-ac','1','-ar','16000','-f','f32le','-']),dtype='<f4')
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
    x=ex.submit(mono,A);y=ex.submit(mono,FINAL);reference=x.result();decoded=y.result()
assert np.isfinite(decoded).all()
duration=25155200/48000;end=round(duration*16000)
assert len(decoded)>=end and len(reference)>=end
spots=[('intro',0,10),('AB',192,200),('BC',292,302),('late assembly',467,477),('showcase',503,513),('final presentation',517,524.066666667),('final fade',518.066666667,524.066666667)]
checks=[]
for label,start,stop in spots:
    lo=round(start*16000);hi=min(end,round(stop*16000));a=reference[lo:hi].astype(np.float64);b=decoded[lo:hi].astype(np.float64)
    corr=float(np.corrcoef(a,b)[0,1]);rms_a=float(np.sqrt(np.mean(a*a)));rms_b=float(np.sqrt(np.mean(b*b)))
    assert corr>.99 and abs(20*np.log10(rms_b/rms_a))<.5
    checks.append({'region':label,'global_start':start,'global_end':stop,'zero_lag_waveform_correlation':corr,'AAC_vs_WAV_rms_delta_db':float(20*np.log10(rms_b/rms_a)),'timing_and_tail':'PASS'})
interior=decoded[24000:round((duration-6)*16000)];n=len(interior)//1600
rms=np.sqrt(np.mean(interior[:n*1600].reshape(n,1600).astype(np.float64)**2,axis=1))
assert not np.any(rms<10**(-70/20))
dump('mux-audio-integrity.json',{'status':'PASS','spots':checks,'drift':'Zero-lag agreement with WAV at intro, AB, BC, late assembly, showcase and final fade; exact declared audio/video duration','interior_100ms_below_minus70_dbfs':0,'tail_present':'PASS','finite_decoded_samples':'PASS','mux_introduced_audio_difference':'NONE: AAC packet sequence equal to director-reviewed preview','perceptual_review':'Director-approved Pass02; no new internal listening claim','AAC_decode_padding_seconds':(len(decoded)-end)/16000,'padding_note':'Native AAC decode can emit frame padding beyond declared duration. MP4 stream duration is exactly 25,155,200 / 48,000 seconds; no approved audio truncated.'})

# Decode corresponding spot-check frames from both containers and compare lossless pixels.
images=[]
for index,time in enumerate([0,195,297,467,503,517,523.8]):
    names=[]
    for tag,source in [('reference',V),('final',FINAL)]:
        p=OUT/'evidence'/f'spot-{index}-{tag}.png'
        subprocess.run([FF,'-v','error','-y','-ss',str(time),'-i',str(source),'-map','0:v:0','-frames:v','1',str(p)],check=True)
        names.append(p)
    assert sha(names[0])==sha(names[1])
    images.append({'time':time,'reference':str(names[0]),'final':str(names[1]),'decoded_frame_identity':'PASS'})
dump('visual-spot-checks.json',{'status':'PASS','frames':images})

for name in ['music-provenance.json','music-edit-plan.json','YOUTUBE-MUSIC-CREDITS.txt']:
    shutil.copy2(A.parent/name,OUT/name)
approval={'status':'DIRECTOR_APPROVED_FINAL_MUX_COMPLETE','source_approval_package':'/Users/quyth/.codex/attachments/90bc9e8b-1914-46c4-a4c7-284285d2808e/Pasted text.txt','director_listening':{'complete_Pass02':'PASS','AB':'PASS_LOCKED','BC':'PASS_LOCKED','ending':'PASS_LOCKED','voice_spoken_content':'PASS_FOR_DIRECTOR_REVIEW_NO_OBJECTIONABLE_CONTENT_IDENTIFIED'},'audio_master':{'path':str(A),'sha256':AHASH,'identity':'PASS'},'visual_master':{'path':str(V),'sha256':VHASH,'identity':'PASS'},'final_MP4':{'path':str(FINAL),'sha256':sha(FINAL),'size_bytes':FINAL.stat().st_size,'duration':fp['format']['duration']},'original_provenance_preserved':'Copied byte-identically; historical pending-listening status superseded by this director approval record','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
dump('director-approval-and-final-build.json',approval)
command=[FF,'-hide_banner','-nostats','-i',str(V),'-i',str(A),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-movie_timescale','48000','-movflags','+faststart',str(FINAL)]
dump('mux-command.json',{'argv':command,'audio_processing':'Only AAC encoding; no audio filters, fades, gains, limiter or mastering. MP4 movie_timescale=48000 preserves exact sample-aligned audio endpoint.','video_processing':'Encoded stream copy only'})
dump('zero-SFX-final.json',{'status':'PASS','audio_input':str(A),'sha256':AHASH,'mapped_audio':'1:a:0 only','other_audio_inputs':[],'WF311613-SFX-pass01.wav_used':False,'AudioCuePlan_applied':False,'procedural_SFX_used':False,'narration_used':False,'workshop_ambience_used':False,'additional_music_used':False,'additional_audio_filters':False})
assert sha(V)==VHASH and sha(A)==AHASH
# Validate faststart by reading top-level box headers, without loading mdat.
boxes=[]
with FINAL.open('rb') as f:
    offset=0
    while offset<FINAL.stat().st_size:
        f.seek(offset);header=f.read(8);size=int.from_bytes(header[:4],'big');kind=header[4:].decode('ascii')
        if size==1:size=int.from_bytes(f.read(8),'big')
        if size==0:size=FINAL.stat().st_size-offset
        boxes.append({'type':kind,'offset':offset,'size':size});offset+=size
assert next(b['offset'] for b in boxes if b['type']=='moov')<next(b['offset'] for b in boxes if b['type']=='mdat')
dump('faststart-verification.json',{'status':'PASS','boxes':boxes})
report=f'''# WF311613 — final 720p lofi master

FINAL MUSIC: DIRECTOR APPROVED (complete Pass02, AB, BC, ending and voice/spoken review).
VISUAL MASTER SHA: PASS — {VHASH}
AUDIO MASTER SHA: PASS — {AHASH}
VIDEO STREAM IDENTITY: PASS — all 15,722 ordered packet hashes, PTS/DTS, durations, sizes/flags and codec extradata match the silent master. Frame count expected/actual: 15,722 / 15,722. H.264 1280×720, yuv420p, 30fps CFR preserved.
ZERO SFX FINAL: PASS — only approved Pass02 WAV mapped as audio; no additional processing except AAC encode.
FULL A/V DECODE: PASS — complete 15,722 video frames and AAC decoded with -xerror, no corruption.
FASTSTART: PASS — moov precedes mdat.

FINAL AUDIO: {metrics['codec']}, {metrics['sample_rate']}Hz, {metrics['channels']} channels, {metrics['bitrate_bps']}bps actual (256kbps target), {metrics['duration_seconds']:.9f}s.
Integrated loudness: {metrics['integrated_lufs']} LUFS.
True peak: {metrics['true_peak_dbtp']} dBTP.
Decoded sample peak: {metrics['decoded_sample_peak_dbfs']:.6f} dBFS.
Loudness range: {metrics['loudness_range_lu']} LU.
Clipping: PASS. Finite samples and no introduced internal silence detected. Declared audio sample duration is exactly 25,155,200 samples / 48kHz. Last packet and final fade preserved. No drift at the requested spot regions: zero-lag source/AAC correlation >0.99 and RMS difference <0.5dB. Final AAC payloads, PTS/DTS/order and skip metadata are identical to director-reviewed Pass02 preview. The container edit-list audio duration preserves 32 additional samples (0.667ms): movie_timescale=48000 preserves the exact WAV endpoint instead of the preview's default 1ms edit-list rounding. All AAC packet durations also match. No encoded AAC payload changed. No new actual listening claim is made.

Spot regions checked: intro 0s; AB 192–200s; BC 292–302s; late assembly 467s; showcase 503s; final presentation 517s; final fade 518.066667–524.066667s. Corresponding decoded video spot frames are losslessly identical to the silent master.

FINAL MP4: {FINAL}
Size: {FINAL.stat().st_size} bytes.
Duration: {fp['format']['duration']} seconds.
SHA256: {sha(FINAL)}

Audio source: {A}
Visual source: {V}
Approved music edit and original provenance/credits were copied without changing wording. Historical pending-listening labels in copied provenance are superseded by director-approval-and-final-build.json. Source files and WAV/video hashes remain unchanged.

YOUTUBE CREDITS (exact preserved attribution block):

```text
{(OUT/'YOUTUBE-MUSIC-CREDITS.txt').read_text().rstrip()}
```

Detailed ffprobe, ordered packet evidence, AAC preview identity, decode logs, spot comparisons, zero-SFX graph, frozen edit plan/provenance, director approval record and SHA256 manifest are saved in this directory. No music/visual changes, rerender, additional resolution, upload, publishing or Option2 performed. STOP after final 720p mux and QA.
'''
(OUT/'FINAL-MUSIC-QA-REPORT.md').write_text(report)
manifest=[VHASH+'  '+str(V),AHASH+'  '+str(A)]
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name!='SHA256SUMS.txt':manifest.append(sha(p)+'  '+str(p))
(OUT/'SHA256SUMS.txt').write_text('\n'.join(manifest)+'\n')
print(json.dumps({'final':approval['final_MP4'],'VIDEO_STREAM_IDENTITY':'PASS','FULL_AV_DECODE':'PASS','ZERO_SFX_FINAL':'PASS','audio':metrics},indent=2))
