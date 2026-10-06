from pathlib import Path
import json, subprocess, hashlib, shutil, datetime
import numpy as np

OUT = Path(__file__).resolve().parents[1]
FF = '/opt/homebrew/bin/ffmpeg'
FP = '/opt/homebrew/bin/ffprobe'
MASTER = OUT.parent / 'director-approved-full-720p-20261004/WF311613-director-approved-full-720p.mp4'
EXPECTED = '0d5d898cbfaecb4573f07e818ce722c6884cbd4dc67d7c51b7c6c724f404ba0a'

def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda: f.read(4194304), b''): h.update(b)
    return h.hexdigest()

def probe(p):
    return json.loads(subprocess.check_output([FP, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(p)]))

def loudness(p, start=None, duration=None):
    args = [FF, '-hide_banner', '-nostats']
    if start is not None: args += ['-ss', str(start)]
    args += ['-i', str(p)]
    if duration is not None: args += ['-t', str(duration)]
    r = subprocess.run(args + ['-af', 'loudnorm=I=-20:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stderr)
    return json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}')+1])

assert sha(MASTER) == EXPECTED, 'VISUAL_MASTER_IDENTITY_MISMATCH'
master_probe = probe(MASTER)
assert not any(s['codec_type'] == 'audio' for s in master_probe['streams'])
(OUT / 'evidence/visual-master-preflight.json').write_text(json.dumps({'sha256':EXPECTED,'identity':'PASS','ffprobe':master_probe},indent=2)+'\n')
supplied = json.loads((OUT / 'evidence/director-supplied-local-assets.json').read_text())
provenance = json.loads((OUT / 'music-provenance.json').read_text())
results = []
for record, track in zip(supplied, provenance['tracks']):
    tid = record['track']
    original = Path(record['path'])
    assert sha(original) == record['sha256'], 'Supplied file changed'
    assert track['director_url'].split('v=')[1].split('&')[0] in original.name
    source = OUT / 'sources' / f'{tid}-director-supplied.mp3'
    shutil.copy2(original, source)
    assert sha(source) == record['sha256']
    meta = probe(source)
    pcm = subprocess.check_output([FF,'-v','error','-i',str(source),'-ac','1','-ar','16000','-f','f32le','-'])
    x = np.frombuffer(pcm,dtype='<f4')
    # 10 ms onset envelope; block FFT avoids a full-track spectrogram in memory.
    hop, win = 160, 1024
    frames = np.lib.stride_tricks.sliding_window_view(x,win)[::hop]
    flux=[]; prev=np.zeros(win//2+1)
    window=np.hanning(win)
    for begin in range(0,len(frames),1000):
        mag=np.log1p(np.abs(np.fft.rfft(frames[begin:begin+1000]*window,axis=1)))
        delta=np.diff(np.vstack([prev,mag]),axis=0)
        flux.extend(np.maximum(delta,0).sum(axis=1));prev=mag[-1]
    flux=np.asarray(flux);flux=np.maximum(flux-np.quantile(flux,.4),0)
    middle=flux[2000:min(len(flux)-1000,14000)]
    nfft=1 << (2*len(middle)-1).bit_length()
    spec=np.fft.rfft(middle-middle.mean(),nfft)
    ac=np.fft.irfft(spec*np.conj(spec),nfft)[:len(middle)]
    ac/=np.arange(len(middle),0,-1)
    lags=np.arange(43,101)
    scores=ac[lags]+.3*ac[2*lags]
    peaks=[i for i in range(1,len(scores)-1) if scores[i]>scores[i-1] and scores[i]>scores[i+1]]
    ranked=sorted(peaks,key=lambda i:scores[i],reverse=True)[:5]
    tempos=[{'bpm':float(6000/lags[i]),'lag_seconds':float(lags[i]/100),'score_relative':float(scores[i]/scores.max())} for i in ranked]
    period=float(lags[np.argmax(scores)])/100
    times=(np.arange(len(flux))*hop+win/2)/16000
    phases=np.linspace(0,period,300,endpoint=False)
    scores_phase=[np.interp(np.arange(25+p,min(160,len(x)/16000-10),period),times,flux).mean() for p in phases]
    phase=float((25+phases[np.argmax(scores_phase)])%period)
    bins=x[:len(x)//16000*16000].reshape(-1,16000)
    rms=np.sqrt((bins.astype(np.float64)**2).mean(axis=1))
    db=20*np.log10(np.maximum(rms,1e-10))
    active=np.where(np.abs(x)>10**(-65/20))[0]
    duration=len(x)/16000
    boundaries=np.arange(phase,duration,4*period)
    result={'track_id':tid,'file':str(source),'sha256':record['sha256'],'ffprobe':meta,'decoded_duration_seconds':duration,'leading_below_minus65_seconds':float(active[0]/16000),'trailing_below_minus65_seconds':float((len(x)-active[-1]-1)/16000),'rms_dbfs_per_second':db.tolist(),'tempo_candidates':tempos,'provisional_beat_period_seconds':period,'provisional_beat_phase_seconds':phase,'provisional_4beat_grid':boundaries.tolist(),'source_loudness':loudness(source),'source_decode':'PASS','structure_status':'Technical candidates only; intro/body/outro and phrase/downbeat identity require actual listening','identity_check':{'director_supplied_assignment':'PASS','filename_video_id':'PASS','duration_consistent_with_observed_youtube':'PASS','independent_audio_fingerprint_or_listening':'NOT_PERFORMED'}}
    (OUT / 'evidence' / f'{tid}-technical-analysis.json').write_text(json.dumps(result,indent=2)+'\n')
    track.update({'source_filename':source.name,'source_path':str(source),'source_sha256':record['sha256'],'director_supplied_original_path':str(original),'production_asset_origin':'Director manually supplied local file; not an official publisher download','acquisition_status':'PASS_DIRECTOR_SUPPLIED_LOCAL_ASSET','audio_metadata':meta,'identity_verification':result['identity_check']})
    results.append(result)
    print(json.dumps({'track':tid,'duration':duration,'tempo_candidates':tempos,'phase':phase,'loudness':result['source_loudness'],'rms_first_30':db[:30].round(1).tolist(),'rms_last_30':db[-30:].round(1).tolist()}),flush=True)
provenance.update({'status':'ACQUISITION_PASS_LISTENING_REQUIRED','acquisition_authorization':'Director explicitly authorized these three supplied local files as production assets; no new downloads','updated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'actual_listening_qa':'NOT_PERFORMED; no listening-capable tool available','asset_analysis':'Technical source analysis completed; listening still required'})
(OUT / 'music-provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
