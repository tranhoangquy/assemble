from pathlib import Path
import json,hashlib,os,collections,subprocess,errno
W=Path('/Users/quyth/development/three/POC');R=W/'output/wf311613-standalone-murphy-bed/maintenance/short-standard-cleanup-20261007';EX=W/'output/export-jobs'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def save(p,d):p.write_text(json.dumps(d,indent=2)+'\n')
manifest=R/'deletion-manifest.json';m=json.loads(manifest.read_text());protected=json.loads((R/'protected-hashes-before.json').read_text());assert not (R/'deletion-ledger.jsonl').exists()
assert not list(EX.glob('*lock*')) and not list(EX.glob('.*lock*'))
for name,expected in m['job_manifests'].items():assert sha(EX/name/'manifest.json')==expected,'Job changed since audit'
for rel,expected in protected.items():assert sha(W/rel)==expected,(rel,'Protected asset changed BEFORE deletion')
save(R/'protected-verification-before.json',{'status':'PASS','files':len(protected),'manifest_sha256':sha(manifest),'explicit_locked_hashes':'PASS from audit','no_worker_lock':True,'terminal_job_manifest_identity':'PASS'})
removed=[];categories=collections.defaultdict(lambda:{'files':0,'bytes':0})
with (R/'deletion-ledger.jsonl').open('w') as ledger:
 for x in m['files']:
  p=W/x['path'];assert p.is_file() and not p.is_symlink();assert p.resolve().is_relative_to((W/'output').resolve());assert not any(parent.is_symlink() for parent in p.parents if parent!=W)
  assert x['path'] not in protected and p.stat().st_size==x['bytes'] and sha(p)==x['sha256'],(x['path'],'Identity changed')
  p.unlink();event={'path':x['path'],'bytes':x['bytes'],'sha256':x['sha256'],'category':x['category'],'status':'DELETED'};ledger.write(json.dumps(event)+'\n');ledger.flush();removed.append(event);categories[x['category']]['files']+=1;categories[x['category']]['bytes']+=x['bytes']
removed_dirs=[]
for rel in m['directory_candidates']:
 p=W/rel
 if p.is_dir() and not p.is_symlink():
  try:p.rmdir();removed_dirs.append(rel)
  except OSError as e:
   if e.errno not in [errno.ENOTEMPTY,errno.EEXIST]:raise
assert len(removed)==m['file_count'] and sum(x['bytes'] for x in removed)==m['logical_bytes']
after={};diff=[]
for rel,expected in protected.items():
 p=W/rel;actual=sha(p) if p.is_file() else None;after[rel]=actual
 if expected!=actual:diff.append({'path':rel,'expected':expected,'actual':actual})
save(R/'protected-hashes-after.json',after);save(R/'protected-verification-after.json',{'status':'PASS' if not diff else 'FAIL','files':len(protected),'differences':diff});assert not diff,diff
# Separately attest complete retained final-Short checksum bundle and approved originals.
P=W/'output/wf311613-standalone-murphy-bed';bundle=P/'short/final-short02-1080p';bundlecount=0
for line in (bundle/'SHA256SUMS.txt').read_text().splitlines():
 expected,rel=line.split('  ',1);assert sha(bundle/rel)==expected;bundlecount+=1
locked=json.loads((R/'explicit-locked-hashes.json').read_text())
for rel,expected in locked.items():assert sha(P/rel)==expected
save(R/'final-master-bundle-verification.json',{'status':'PASS','final_short_bundle_checksum_entries':bundlecount,'explicit_short_long_source_hashes':locked,'all_sources_exist':True})
save(R/'deletion-result.json',{'status':'CLEANUP_EXECUTED','files_removed':len(removed),'logical_bytes_removed':sum(x['bytes'] for x in removed),'directories_removed':len(removed_dirs),'directory_paths_removed':removed_dirs,'categories':dict(categories),'manifest_sha256':sha(manifest),'ledger_sha256':sha(R/'deletion-ledger.jsonl'),'protected_hashes':'PASS','final_short_bundle':'PASS','retention_notice':'Historical review SHA/freeze manifests describe original snapshots. Their deliberately purged files resolve through this exact-path/hash ledger. Current final Short bundle fully intact. Purged stale/smoke jobs retired; purged completed raw frames require fresh validation/re-render before any resume.'})
print('DELETED',len(removed),'files',sum(x['bytes'] for x in removed),'bytes',len(removed_dirs),'directories; protected PASS',flush=True)
