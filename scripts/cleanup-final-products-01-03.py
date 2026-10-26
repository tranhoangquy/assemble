#!/usr/bin/env python3
"""Human-authorized exact-path retention for Products01+03. Never touches Product02.
plan -> review SUMMARY.json -> apply. No renderer, encoder, network or Git mutation.
"""
from pathlib import Path
import argparse,collections,gzip,hashlib,json,os,shutil,tarfile,time
ROOT=Path(__file__).resolve().parents[1];os.chdir(ROOT)
NAMES=['wf311613-standalone-murphy-bed','product03-pet-crate-w114586144'];AUDIT=ROOT/'output/final-products-cleanup-20261026';AUDIT.mkdir(parents=True,exist_ok=True)
FINAL={NAMES[0]:['final/final-lofi-720p/WF311613-final-lofi-720p.mp4','short/final-short02-1080p/WF311613-short02-FINAL-vertical-1080p.mp4'],NAMES[1]:['final-music-v1/PRODUCT03-Long-V5-MUSIC-720p.mp4','final-music-v1/PRODUCT03-Short-V3-MUSIC-1080x1920.mp4']}
SOURCE_SUFFIXES={'.json','.md','.txt','.log','.py','.ts','.tsx','.mjs','.cjs','.csv','.tsv','.html','.framemd5','.jsonl','.ndjson','.js'}
def sha(f):
 h=hashlib.sha256()
 with f.open('rb')as a:
  for b in iter(lambda:a.read(2**20),b''):h.update(b)
 return h.hexdigest()
def write(f,a):f.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
def iterfiles(base):return sorted(f for f in base.rglob('*')if f.is_file()or f.is_symlink())
def safe(f):
 r=f.relative_to(ROOT).as_posix();assert any(r.startswith('output/'+n+'/')for n in NAMES);assert not f.is_symlink();assert f.resolve().is_relative_to(ROOT/'output');return r

def keep(n,r,f):
 if r in FINAL[n]:return 'frozen principal Long/Short with music'
 if r.startswith('release-assets/'):return 'selected source still for publication thumbnail/poster'
 if n==NAMES[0]:
  if r in ['final/lofi-music-pass02/WF311613-lofi-mix-pass02.wav','short/final-short02-1080p/WF311613-short02-FINAL-music-master.wav']:return 'archival exact final music master WAV'
  if r.startswith('final/lofi-music-pass01/sources/')and f.suffix=='.mp3':return 'director-supplied original music A/B/C; final Long/Short rights and remix inputs'
  if r.startswith('final/lofi-music-pass01/evidence/')and f.suffix in {'.html','.json','.txt'}and f.stat().st_size<1000000:return 'original source/license evidence'
  if any(r.startswith(a)for a in ['final/final-lofi-720p/','short/final-short02-1080p/','final/lofi-music-pass02/'])and f.suffix in {'.json','.md','.txt','.py','.mjs'}and f.stat().st_size<1000000:return 'final edit/mastering/provenance/approval/QA or retained reproduction configuration'
 else:
  if r.startswith('final-music-v1/'):return 'frozen current final music delivery bundle and approval/license/QA evidence'
  if r=='phase-a-v1/source/human-provided-pet-crate-manual.pdf':return 'human-provided authoritative13-page manual'
  if r.startswith('phase-a-v1/')and len(Path(r).parts)==2 and f.suffix in {'.md','.json'}:return 'source authority, inventory, dependencies and unresolved assumptions'
  if r in ['music-only-v1/source/HoliznaCC0-Dreams.mp3','music-only-v1/PRODUCT03-Long-music-pass01.wav','music-only-v1/PRODUCT03-Short-music-pass01.wav','music-only-v1/PRODUCT03-Long-music-pass01-preview.m4a','music-only-v1/PRODUCT03-Short-music-pass01-preview.m4a']:return 'original CC0 track, archival music WAVs or exact AAC production streams'
  if r.startswith('music-only-v1/evidence/')and f.suffix in {'.html','.json'}:return 'public source/license and acquisition evidence'
  if r.startswith('music-only-v1/')and len(Path(r).parts)==2 and f.suffix in {'.py','.json','.md','.txt'}:return 'current music edit/provenance/source/QA and reproducibility evidence'
 return None

def history(f,r):
 # Do not push whole authenticated-browser conversations or personal sidebar captures.
 upper=f.name.upper()
 if any(x in upper for x in ['SUBMISSION-DOM','PRE-SEND-DOM','FULL-DOM','CHATGPT-DOM','CONNECTIVITY-DOM']):return False
 if f.suffix in SOURCE_SUFFIXES:
  if f.suffix in {'.ndjson','.jsonl','.framemd5'}:return False
  if f.suffix=='.js'and f.stat().st_size>1000000:return False
  return True
 return False

def plan():
 assert not(AUDIT/'INVENTORY.jsonl.gz').exists(),'Plan already frozen; inspect existing manifest instead of overwriting'
 # Reuse actual existing final-frame images, no new render or image editing.
 posters=[(NAMES[0],'final/final-lofi-720p/evidence/spot-5-final.png','long-thumbnail-source.png'),(NAMES[0],'short/short02-visual-review-v1/stills/33-final-close.png','short-poster-source.png'),(NAMES[1],'hinge-visual-override-v1/full-actual-review/long/decoded-035.png','long-thumbnail-source.png'),(NAMES[1],'hinge-visual-override-v1/full-actual-review/short/decoded-015.png','short-poster-source.png')]
 for n,source,target in posters:
  d=ROOT/'output'/n/'release-assets';d.mkdir(exist_ok=True);shutil.copy2(d.parent/source,d/target)
 rows=[];stats={};protected={};image_candidates={};start=time.time()
 for n in NAMES:
  base=ROOT/'output'/n;images=[];count=collections.Counter();size=collections.Counter()
  for f in iterfiles(base):
   if f.is_symlink():raise RuntimeError('Unreviewed symlink '+str(f))
   r=f.relative_to(base).as_posix();reason=keep(n,r,f);action='KEEP'if reason else'DELETE';arch=not reason and history(f,r)
   if not reason:reason='historical report/config retained in verified compact archive; original location retired'if arch else'redundant draft/proof/video/cache/generated data; principal finals and source/QA retained'
   row={'path':safe(f),'bytes':f.stat().st_size,'sha256':sha(f),'action':action,'reason':reason,'archiveHistorical':arch};rows.append(row);count[action]+=1;size[action]+=row['bytes']
   if action=='KEEP':protected[row['path']]=row['sha256']
   elif f.suffix.lower()in {'.png','.jpg','.jpeg'}and any(x in f.name.lower()for x in ['contact','sheet','before-after','conflict','comparison']):
    if not any(x in r.lower()for x in ['director-review/','director-approval/','submission','receipt','decision.png']):images.append(row)
  # One adequate representative per milestone, maximum24 images/product; text archives retain all major decisions/FAILs.
  groups={}
  for row in sorted(images,key=lambda a:(-('before-after'in a['path'].lower()),a['bytes'])):
   key=Path(row['path']).parts[2];groups.setdefault(key,row)
  selected=list(groups.values())[:24]
  for row in selected:row['archiveHistorical']=True;row['reason']='representative historical visual evidence retained in verified compact archive'
  image_candidates[n]=[r['path']for r in selected];stats[n]={'files':dict(count),'logicalBytes':dict(size),'historicalImages':len(selected)}
  print(n,stats[n],flush=True)
 # Source, shared diagnostics and unfinished Product02 have zero authorized deletions.
 for directory in ['src/products/wf311613-standalone-murphy-bed','src/products/product03-pet-crate-w114586144','src/products/idmarket-juliette-18094','output/idmarket-juliette-18094','references/wf311613-standalone-murphy-bed']:
  for f in iterfiles(ROOT/directory):
   assert not f.is_symlink();protected[f.relative_to(ROOT).as_posix()]=sha(f)
 protected['scripts/render-mechanism-diagnostics.ts']=sha(ROOT/'scripts/render-mechanism-diagnostics.ts')
 with gzip.open(AUDIT/'INVENTORY.jsonl.gz','wt')as out:
  for r in rows:out.write(json.dumps(r,ensure_ascii=False)+'\n')
 with gzip.open(AUDIT/'PROTECTED-BASELINE.json.gz','wt')as out:json.dump(protected,out)
 archive_proofs={}
 for n in NAMES:
  selected=[r for r in rows if r['path'].startswith('output/'+n+'/')and r['archiveHistorical']];tarpath=AUDIT/(n+'-history.tar.gz')
  with tarfile.open(tarpath,'w:gz',compresslevel=6)as tar:
   for r in selected:
    f=ROOT/r['path'];assert sha(f)==r['sha256'];tar.add(f,arcname=r['path'],recursive=False)
  with tarfile.open(tarpath,'r:gz')as tar:
   for member,row in zip(tar.getmembers(),selected):
    assert member.name==row['path'];assert hashlib.sha256(tar.extractfile(member).read()).hexdigest()==row['sha256']
  assert tarpath.stat().st_size<95*1024**2,'Archive exceeds safe regular Git blob size'
  archive_proofs[n]={'path':str(tarpath.relative_to(ROOT)),'entries':len(selected),'bytes':tarpath.stat().st_size,'sha256':sha(tarpath),'allMembersVerified':True}
 write(AUDIT/'SUMMARY.json',{'phase':'PRE-DELETION PLAN FROZEN','authority':'Human explicitly requests cleanup01+03, final Long/Short only plus relevant source/evidence, notes and Git push; Product02 excluded','scope':NAMES,'Product02':'KEEP ALL, full protected SHA baseline','statistics':stats,'archives':archive_proofs,'protectedPaths':len(protected),'seconds':time.time()-start,'symlinks':0,'resume':'Old raw render caches retired; historical manifests stay original inside archive. Re-render requires fresh job, never resume purged frames.'})
 print('PLAN COMPLETE',time.time()-start,flush=True)

def apply():
 summary=json.loads((AUDIT/'SUMMARY-R2.json').read_text());assert summary['phase']=='PRE-DELETION PLAN FROZEN';assert not(AUDIT/'DELETION-LEDGER.jsonl.gz').exists()
 with gzip.open(AUDIT/'PROTECTED-BASELINE-R2.json.gz','rt')as f:protected=json.load(f)
 with gzip.open(AUDIT/'INVENTORY-R2.jsonl.gz','rt')as f:rows=[json.loads(l)for l in f]
 for a in summary['archives'].values():assert sha(ROOT/a['path'])==a['sha256']and a['allMembersVerified']
 # Preflight every identity before deleting anything. Changed/concurrent writers block the task.
 for i,r in enumerate(rows):
  f=ROOT/r['path'];safe(f);assert f.is_file()and f.stat().st_size==r['bytes']and sha(f)==r['sha256'],r['path']
 for n,h in protected.items():assert sha(ROOT/n)==h,n
 counts=collections.Counter();sizes=collections.Counter()
 with gzip.open(AUDIT/'DELETION-LEDGER.jsonl.gz','wt')as ledger:
  for r in rows:
   if r['action']!='DELETE':continue
   f=ROOT/r['path'];safe(f);assert f.stat().st_size==r['bytes']and sha(f)==r['sha256'];f.unlink();counts[Path(r['path']).parts[1]]+=1;sizes[Path(r['path']).parts[1]]+=r['bytes'];ledger.write(json.dumps({**r,'deleted':True})+'\n')
 removed_dirs=[]
 for n in NAMES:
  for d in sorted((ROOT/'output'/n).rglob('*'),key=lambda p:len(p.parts),reverse=True):
   if d.is_dir()and not any(d.iterdir()):d.rmdir();removed_dirs.append(d.relative_to(ROOT).as_posix())
 for n,h in protected.items():assert sha(ROOT/n)==h,n
 remaining={}
 for n in NAMES:
  base=ROOT/'output'/n;movies=[f.relative_to(base).as_posix()for f in base.rglob('*.mp4')];assert sorted(movies)==sorted(FINAL[n]);remaining[n]={'MP4s':movies,'files':sum(1 for f in base.rglob('*')if f.is_file()),'logicalBytes':sum(f.stat().st_size for f in base.rglob('*')if f.is_file())}
 write(AUDIT/'RESULT.json',{'status':'CLEANUP PASS','deletedFiles':dict(counts),'deletedLogicalBytes':dict(sizes),'totalDeletedLogicalBytes':sum(sizes.values()),'removedEmptyDirectories':len(removed_dirs),'retained':remaining,'protectedPathsChecked':len(protected),'protectedChanges':[],'Product02':'UNCHANGED — every baseline path SHA verified','Product01Product03Source':'UNCHANGED','oldRawCacheResume':'RETIRED — fresh render required; final movie hashes remain unchanged'})
 current={r['path']:r['sha256']for r in rows if r['action']=='KEEP'};write(AUDIT/'CURRENT-RETAINED-SHA256.json',current);print('CLEANUP PASS',sum(counts.values()),'files',sum(sizes.values()),'bytes',flush=True)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('phase',choices=['plan','apply']);a=parser.parse_args();plan()if a.phase=='plan'else apply()
