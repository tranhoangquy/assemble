from pathlib import Path
import subprocess, json, re, concurrent.futures, hashlib, datetime

OUT=Path(__file__).resolve().parents[1]
FF='/opt/homebrew/bin/ffmpeg'; FP='/opt/homebrew/bin/ffprobe'
files=['WF311613-lofi-mix-pass01.wav','WF311613-lofi-mix-pass01-preview.m4a']

def verify(name):
    path=OUT/name
    probe=json.loads(subprocess.check_output([FP,'-v','error','-show_streams','-show_format','-of','json',str(path)]))
    run=subprocess.run([FF,'-hide_banner','-nostats','-i',str(path),'-af','ebur128=peak=true,astats=metadata=0:reset=0','-f','null','-'],capture_output=True,text=True)
    (OUT/'evidence'/(name+'.decode-loudness.log')).write_text(run.stderr)
    summary=run.stderr[run.stderr.rfind('Summary:'):]
    def match(pattern):
        value=re.search(pattern,summary)
        return float(value.group(1)) if value else None
    peaks=re.findall(r'Peak level dB:\s*([-+\d.]+)',run.stderr)
    return {'file':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'full_audio_decode':'PASS' if run.returncode==0 else 'FAIL','ffprobe':probe,'integrated_lufs':match(r'I:\s*([-+\d.]+) LUFS'),'loudness_range_lu':match(r'LRA:\s*([-+\d.]+) LU'),'true_peak_dbtp':match(r'Peak:\s*([-+\d.]+) dBFS'),'decoded_sample_peak_dbfs':float(peaks[-1]) if peaks else None,'metrics_precision':'ffmpeg ebur128 summary rounds LUFS/LRA/TP to one decimal','listening_qa':'NOT_PERFORMED'}

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(verify,files))
assert all(r['full_audio_decode']=='PASS' for r in results)
assert all(r['decoded_sample_peak_dbfs']<0 and r['true_peak_dbtp']<0 for r in results)
wav=results[0]['ffprobe']['streams'][0]
assert wav['codec_name']=='pcm_s24le' and wav['sample_rate']=='48000' and wav['channels']==2
assert wav['duration_ts']==25155200
artifacts=[]
for name in ['transition-A-B.wav','transition-B-C.wav','intro-music-review.wav','final-fade-review.wav']:
    path=OUT/name
    p=json.loads(subprocess.check_output([FP,'-v','error','-show_streams','-show_format','-of','json',str(path)]))
    artifacts.append({'file':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'ffprobe':p})
(OUT/'loudness-peak-report.json').write_text(json.dumps({'status':'TECHNICAL_PASS_LISTENING_PENDING','results':results,'review_artifacts':artifacts},indent=2)+'\n')
provenance=json.loads((OUT/'music-provenance.json').read_text())
provenance.update({'status':'AUDIO_REVIEW_CANDIDATE_READY_LISTENING_REQUIRED','audio_review_candidate_created':True,'final_mix_created':False,'final_mux_created':False,'actual_listening_qa':'NOT_PERFORMED; director listening input required before mux','candidate_wav':str(OUT/files[0]),'candidate_wav_sha256':results[0]['sha256'],'candidate_preview':str(OUT/files[1]),'updated_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
(OUT/'music-provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
plan=json.loads((OUT/'music-edit-plan.json').read_text())
report=['# WF311613 — MUSIC-ONLY PASS 01: listening candidate','',
'Status: LISTENING_QA_REQUIRED_BEFORE_MUX','',
'Acquisition gate: PASS for the three director-supplied local files only. Original download failures remain historical evidence; no downloads were attempted during this build.',
'Visual master: SHA256 PASS; silent input verified. Approved video has not been modified or muxed.',
'Identity: director A/B/C assignments, filenames containing exact approved video IDs, and durations agree with inspected YouTube track records. This is not an independent audio fingerprint or a listening verification. Actual content/version verification remains part of listening QA.',
'', '## Provisional edit', '',
'A → B → C. No complete-song concatenation, looping, tempo/pitch change, SFX, narration or ambience.',
'All source cut points are technical audition candidates; the 4-beat grid does not establish musical phrase/downbeat identity. Gains match measured selected-segment LUFS, not confirmed perceptual loudness.', '']
for s in plan['segments']:
    report.append(f"{s['track_id']} — {s['artist']} / {s['title']}: source {s['source_in']:.6f}–{s['source_out']:.6f}s; global {s['global_in']:.6f}–{s['global_out']:.6f}s; gain {s['gain_db']:+.2f} dB; SHA256 {s['source_sha256']}.")
report+=['', 'A→B: global 195.520500–199.520500s (03:15.521–03:19.521).',
'B→C: global 303.760500–307.760500s (05:03.761–05:07.761).',
'Both crossfades: 4s sin/cos equal power, provisional pending listening.',
'Opening fade: 1.5s half cosine. Final fade: 518.066667–524.066667s, 6s half cosine; musical resolution pending listening.',
'B source analysis: low-level opening until about 35s, quieter internal passage around 65–90s, sparse late section around 150s onward. Candidate uses 35.241125–147.481125s, preserving its internal dynamics.',
'C source analysis: low-level opening until about 22s; candidate starts 26.143104s and leaves before sparse late section near 249s.',
'A source analysis: natural opening retained; pronounced internal energy changes retained; source ending drops rapidly after about 204s, candidate exits at 199.520500s.',
'', '## Technical QA', '',
'WAV: 48kHz, stereo, 24-bit PCM, exactly 25,155,200 samples/channel = 524.066666667s. Preview: AAC 48kHz stereo, requested 256kbps.',
'No internal 100ms window below −70 dBFS outside allowed master fades. Finite samples and no added sample clipping. These checks do not validate musical continuity or rule out audible clicks.',
'Zero-SFX graph: PASS for candidate. Only three hashed director-supplied music files feed the mix.', '']
for r in results:
    report.append(f"{Path(r['file']).name}: full audio decode {r['full_audio_decode']}; {r['integrated_lufs']} LUFS; {r['true_peak_dbtp']} dBTP; decoded sample peak {r['decoded_sample_peak_dbfs']:.3f} dBFS; LRA {r['loudness_range_lu']} LU; SHA256 {r['sha256']}.")
report+=['', '## Required listening gate', '',
'NOT PERFORMED: source listening, exact content/version verification, intro/body/outro confirmation, phrase/downbeat validation, perceptual gain matching, A/B and B/C transitions, bass/drum/melody collisions, voice/spoken-sample absence, complete 08:44 listening and intentional ending.',
'The publisher page tags Herbal Tea as Male under Voice Tags. This does not establish that vocals are present; source listening must resolve compliance with the no-voice requirement.',
'No listening-capable tool is available in this environment. Do not represent technical analysis as listening QA. Review the full audio and transition/intro/end clips, then approve or request specific revisions before final mux.',
'Final MP4, review MP4 excerpts, VIDEO_STREAM_IDENTITY and FULL_A/V_DECODE: NOT RUN pending actual listening gate. Required final source is the locked silent master; final mux must use video copy and compare all video packets, PTS/DTS and hashes.',
'No director final approval is claimed. No upload, high-resolution render, Option 2, product/code/camera/web changes were performed.',
'', '## Evidence', '',
'music-provenance.json; music-edit-plan.json; loudness-peak-report.json; audio-technical-qa.json; zero-SFX-verification.json; YOUTUBE-MUSIC-CREDITS.txt; source analyses and logs under evidence/; reproducible scripts under build/; SHA256SUMS.txt.']
(OUT/'MUSIC-PASS01-REPORT.md').write_text('\n'.join(report)+'\n')
master=Path(provenance['visual_master']['path'])
sha=hashlib.sha256(master.read_bytes()).hexdigest()
assert sha==provenance['visual_master']['expected_sha256']
lines=[sha+'  '+str(master)]
for path in sorted(OUT.rglob('*')):
    if path.is_file() and path.name!='SHA256SUMS.txt':lines.append(hashlib.sha256(path.read_bytes()).hexdigest()+'  '+str(path))
(OUT/'SHA256SUMS.txt').write_text('\n'.join(lines)+'\n')
print(json.dumps([{k:r[k] for k in ['file','full_audio_decode','integrated_lufs','true_peak_dbtp','decoded_sample_peak_dbfs','loudness_range_lu']} for r in results],indent=2))
