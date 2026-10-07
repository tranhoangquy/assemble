from pathlib import Path
import json,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT.parents[3]
# Resolve project root explicitly; no writes outside this new review package.
WORK=Path('/Users/quyth/development/three/POC')
video=ROOT.parent/'short02-visual-review-v1/WF311613-short02-visual-review-v1-vertical-1080p.mp4'
music=ROOT.parents[1]/'final/lofi-music-pass02/WF311613-lofi-mix-pass02.wav'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(p)]))
assert sha(video)=='aee283b9d7bf0653b45fd3bf357fc51ea98ad988ebabe532d371a2662d7cad98'
assert sha(music)=='75b282e6e55a65923b00c152099f47e194b66c007f2e8053ccf6b9ec66690b2b'
v=probe(video);a=probe(music);assert len(v['streams'])==1 and v['streams'][0]['nb_read_frames']=='1740'
assert v['streams'][0]['duration']=='58.000000' and v['streams'][0]['width']==1080 and v['streams'][0]['height']==1920
package=Path('/Users/quyth/.codex/attachments/ab5b9f20-4213-45a3-9d6b-eca96f294c1a/Pasted text.txt')
report={'status':'PASS','visual':{'path':str(video),'sha256':sha(video),'probe':v,'director_status':'APPROVED_AND_FROZEN_BY_CURRENT_PACKAGE'},'music':{'path':str(music),'sha256':sha(music),'probe':a,'approval_evidence':str(ROOT.parents[1]/'final/final-lofi-720p/director-approval-and-final-build.json')},'directorPackage':{'path':str(package),'sha256':sha(package)},'listeningCapability':'NOT AVAILABLE; agent listening NOT RUN; director audio review required'}
(ROOT/'evidence/source-preflight.json').write_text(json.dumps(report,indent=2))
old=ROOT.parent/'short02-visual-review-v1/protected-before.json';paths=set(json.loads(old.read_text()))
paths.update(str(f.relative_to(WORK)) for f in (ROOT.parent/'short02-visual-review-v1').rglob('*') if f.is_file())
paths.add(str(music.relative_to(WORK)))
paths.update(str(f.relative_to(WORK)) for f in (WORK/'src').rglob('*') if f.is_file())
paths.update(str(f.relative_to(WORK)) for f in (ROOT.parents[1]/'final/lofi-music-pass02').rglob('*') if f.is_file())
paths.update(str(f.relative_to(WORK)) for f in (ROOT.parents[1]/'final/final-lofi-720p').rglob('*') if f.is_file())
(ROOT/'evidence/protected-before.json').write_text(json.dumps({f:sha(WORK/f) for f in sorted(paths)},indent=2))
print('SOURCE GATE PASS',len(paths),'protected files',flush=True)
