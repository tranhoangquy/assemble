from pathlib import Path
import os,json,hashlib,shutil,collections,subprocess
W=Path('/Users/quyth/development/three/POC');P=W/'output/wf311613-standalone-murphy-bed';R=P/'maintenance/short-standard-cleanup-20261007';OUT=W/'output';EX=OUT/'export-jobs'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def save(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def files(root):
 for base,dirs,names in os.walk(root,followlinks=False):
  dirs[:]=[d for d in dirs if not (Path(base)/d).is_symlink()]
  for name in names:
   p=Path(base)/name
   if p.is_file() and not p.is_symlink():yield p
# Only manifest-proven terminal WF jobs, never a live or unrelated job.
jobs={}
for p in EX.glob('*/manifest.json'):
 d=json.loads(p.read_text());v=d['view']
 if v['productId']=='wf311613-final-micro-pass' and v['status'] in ['completed','stale','cancelled']:
  jobs[p.parent.name]={'status':v['status'],'manifest_sha256':sha(p),'view':v,'purge_entire':v['status']!='completed' or bool(v.get('frameLimit'))}
assert not list(EX.glob('*lock*')) and not list(EX.glob('.*lock*')),'Worker lock exists; do not purge jobs'
# Archive manifests and non-empty logs/compact records byte-identically before disposing stale jobs.
archived=[]
for name,j in jobs.items():
 if j['purge_entire']:
  for p in files(EX/name):
   if p.suffix.lower() in ['.json','.md','.txt','.log','.framemd5'] and p.stat().st_size:
    dest=R/'retained-job-evidence'/name/p.relative_to(EX/name);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);assert sha(dest)==sha(p)
    archived.append({'original':str(p.relative_to(W)),'retained':str(dest.relative_to(W)),'sha256':sha(p)})
save(R/'retained-job-evidence.json',archived)
def classify(p):
 rel=p.relative_to(W);s=str(rel);ext=p.suffix.lower()
 if not s.startswith('output/wf311613-standalone-murphy-bed/') and not s.startswith('output/export-jobs/'):
  return 'KEEP — Historical Evidence','Unrelated product or existing maintenance/infrastructure evidence; outside disposal scope',None
 if s.startswith('output/export-jobs/'):
  name=rel.parts[2];j=jobs.get(name)
  if not j:return 'KEEP — Protected / Reproducible / Final','Job not proven terminal/in scope',None
  if j['purge_entire']:return 'DELETE — Disposable','Terminal superseded/smoke job; exact compact checkpoint/log evidence archived; resume intentionally retired',f'export-job-{j["status"]}'
  if 'frames' in rel.parts and ext=='.png':return 'DELETE — Disposable','Completed Short02 raw sequence; approved native stills, frozen visual and final masters retained; regenerate only via fresh validation/render','completed-export-frames'
  if p.name=='silent.mp4':return 'DELETE — Disposable','Silent exporter intermediary; job final and approved canonical silent visual retained','export-encode-intermediates'
  return 'KEEP — Historical Evidence','Completed full Short02 checkpoint, commands, verification and download remain available; frame purge documented',None
 if '/maintenance/' in s:return 'KEEP — Historical Evidence','Current audit and byte-identical archived checkpoints',None
 sub=str(p.relative_to(P))
 if sub.startswith(('short/final-short02-1080p/','final/final-lofi-720p/','final/director-approved-full-720p-20261004/')):
  return 'KEEP — Protected / Reproducible / Final','Entire frozen final/current visual bundle including checksums, scripts, reports, inputs and previews remains intact',None
 if sub.startswith(('final/lofi-music-pass01/','final/lofi-music-pass02/')):
  return 'KEEP — Protected / Reproducible / Final','Approved Long source/provenance and historical excerpts needed by reproduction assertions and Director transition decisions',None
 if sub.startswith('short/short02-music-pass01/'):
  if '/internal-iterations/' in sub and ext=='.wav':
   reason='Rejected/unlevelled internal iteration; selection metadata, measurements and approved source WAV retained'
   if p.name=='v2-one-beat.wav':
    assert sha(p)==sha(P/'short/short02-music-pass01/WF311613-short02-music-pass01.wav');reason='Byte-identical selected iteration duplicate; approved canonical Pass01 WAV retained'
   return 'DELETE — Disposable',reason,'short-music-internal-iterations'
  if p.name=='onset-features.npz':return 'DELETE — Disposable','Regeneratable analysis array; analysis script, metadata and input source retained','audio-analysis-cache'
  if '/review-clips/' in sub or p.name=='WF311613-short02-music-pass01-preview.m4a':return 'DELETE — Disposable','Review convenience audio redundant with retained approved Pass01 review mux and final MP4/audio preview','short-music-review-previews'
  if ext=='.log' and p.stat().st_size==0:return 'DELETE — Disposable','Empty log contains no observations; result/command retained','empty-logs'
  return 'KEEP — Protected / Reproducible / Final','Pass01 approved input, source selection, provenance, reports, original hashes and working final-master reproduction dependencies',None
 if sub.startswith('final/product-fit-hole-audit/targeted-frames/') and ext=='.png':return 'DELETE — Disposable','Superseded probe raw frame sequence; root audit stills, QA movie, classified hole report and source-before record retained','obsolete-fit-probe-frames'
 if sub.startswith('final/final-review-web-qa-01/') and '/proof-frames/' in sub and ext=='.png':return 'DELETE — Disposable','Completed native-resolution smoke raw frames; profile native stills, proof MP4s, frame verification and comparison sheets retained','native-smoke-frames'
 if sub.startswith('final/audio-pass01/') and ext in ['.wav','.mp3','.m4a','.mp4']:
  return 'DELETE — Disposable','Rejected procedural SFX pass not used by frozen music-only masters; cue plan, observations and technical/decision reports retained','obsolete-procedural-sfx-pass'
 if sub.startswith('screenshots/') and ext in ['.png','.jpg','.jpeg']:
  return 'DELETE — Disposable','Superseded early pacing/browser screenshots; review sheets/Director reports and final-source native evidence retained','obsolete-pacing-screenshots'
 return 'KEEP — Historical Evidence','Compact decision/fit/Director evidence or retained canonical candidate; no proven disposable dependency',None
rows=[];deletes=[];protected={};counts=collections.defaultdict(lambda:{'files':0,'bytes':0})
for p in files(OUT):
 if p.is_relative_to(R):continue
 c,reason,category=classify(p);row={'path':str(p.relative_to(W)),'bytes':p.stat().st_size,'classification':c,'reason':reason}
 rows.append(row);counts[c]['files']+=1;counts[c]['bytes']+=row['bytes']
 if c.startswith('DELETE'):
  row['category']=category;row['sha256']=sha(p);deletes.append(dict(row))
 else:protected[row['path']]=sha(p)
# Source, tests, standard, product/assembly/config inputs are protected too.
for root in ['src','scripts','rules','.agents','docs','references','public']:
 for p in files(W/root):protected[str(p.relative_to(W))]=sha(p)
for p in W.iterdir():
 if p.is_file() and not p.is_symlink() and p.suffix in ['.json','.ts','.md','.mjs','.js','.yaml','.yml']:
  protected[str(p.relative_to(W))]=sha(p)
# Explicit director-published expectations, not just hashes of current files.
locked={
'short/final-short02-1080p/WF311613-short02-FINAL-vertical-1080p.mp4':'e24317a8787379ad9ba2aab19d5d58fd1012953de6a73a923759d492035c4a79',
'short/final-short02-1080p/WF311613-short02-FINAL-music-master.wav':'5ba9089960a09efb55e3e3a57e32ffb11692f2e134b5f1378097101fe883785a',
'short/short02-visual-review-v1/WF311613-short02-visual-review-v1-vertical-1080p.mp4':'aee283b9d7bf0653b45fd3bf357fc51ea98ad988ebabe532d371a2662d7cad98',
'short/short02-music-pass01/WF311613-short02-music-pass01.wav':'d47f944271d3896f5c4bee0ce2c97bbb54e077daada318d7e23464990daf6c70',
'final/director-approved-full-720p-20261004/WF311613-director-approved-full-720p.mp4':'0d5d898cbfaecb4573f07e818ce722c6884cbd4dc67d7c51b7c6c724f404ba0a',
'final/final-lofi-720p/WF311613-final-lofi-720p.mp4':'c42767184db43ce794aa165e9b60c6762c6551829833ed2f7ba60c7fdb42d457',
'final/lofi-music-pass02/WF311613-lofi-mix-pass02.wav':'75b282e6e55a65923b00c152099f47e194b66c007f2e8053ccf6b9ec66690b2b'}
for rel,expected in locked.items():assert sha(P/rel)==expected,(rel,'locked hash mismatch')
# All final Short master bundle entries MUST still resolve; this bundle is not purged.
for line in (P/'short/final-short02-1080p/SHA256SUMS.txt').read_text().splitlines():
 expected,rel=line.split('  ',1);assert sha(P/'short/final-short02-1080p'/rel)==expected
save(R/'cleanup-audit.json',{'status':'AUDIT_COMPLETE_BEFORE_DELETION','scope':'WF311613 obsolete output media/caches and manifest-proven terminal WF exporter jobs; unrelated products retained','classification_counts':dict(counts),'files':rows,'dependency_decisions':['KEEP final entire bundle to preserve current SHA manifest and reproduction','KEEP Pass01 selected WAV and reviewMP4 used by final mastering/mux scripts','KEEP LongPass01/02 sources and clips because Long reproduction freezes/asserts them','KEEP selected native/decoded stills, Director reports, contact sheets and compact checkpoint history','DELETE raw completed/obsolete frame sequences and rejected procedural/internal audio only after hash snapshot'],'jobs':jobs,'process_inventory':'Unavailable in sandbox (pgrep sysmon error); no worker lock and immutable terminal manifest identity required instead'})
save(R/'deletion-manifest.json',{'status':'AUTHORIZED_CLASSIFIED_BEFORE_DELETION','files':deletes,'file_count':len(deletes),'logical_bytes':sum(x['bytes'] for x in deletes),'symlinks_followed':False,'job_manifests':{name:j['manifest_sha256'] for name,j in jobs.items()}})
save(R/'protected-hashes-before.json',protected);save(R/'explicit-locked-hashes.json',locked)
# Fresh size snapshot immediately before mutation; includes audit metadata already written.
def size(root,exclude_top=()):
 n=b=0
 for base,dirs,names in os.walk(root,followlinks=False):
  dirs[:]=[d for d in dirs if not (Path(base)/d).is_symlink() and not (Path(base)==root and d in exclude_top)]
  for name in names:
   p=Path(base)/name
   if p.is_file() and not p.is_symlink():n+=1;b+=p.stat().st_size
 return {'files':n,'logical_bytes':b}
save(R/'size-before-deletion.json',{'output':size(OUT),'repository_working_files':size(W,('.git','node_modules','.next')),'repository_exclusions':['.git','node_modules','.next','symlinks'],'logical_size_not_physical_disk_reclamation':True})
print('AUDIT READY',len(deletes),'files',sum(x['bytes'] for x in deletes),'bytes',len(protected),'protected',flush=True)
