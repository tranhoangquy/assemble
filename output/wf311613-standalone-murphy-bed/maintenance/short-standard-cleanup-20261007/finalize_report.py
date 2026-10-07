from pathlib import Path
import json,hashlib,os,re,subprocess
W=Path('/Users/quyth/development/three/POC');R=W/'output/wf311613-standalone-murphy-bed/maintenance/short-standard-cleanup-20261007';P=W/'output/wf311613-standalone-murphy-bed'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def save(p,d):p.write_text(json.dumps(d,indent=2)+'\n')
def sizes(root,exclude=()):
 n=b=0
 for base,dirs,names in os.walk(root,followlinks=False):
  dirs[:]=[d for d in dirs if not (Path(base)/d).is_symlink() and not (Path(base)==root and d in exclude)]
  for name in names:
   p=Path(base)/name
   if p.is_file() and not p.is_symlink():n+=1;b+=p.stat().st_size
 return {'files':n,'logical_bytes':b}
result=json.loads((R/'deletion-result.json').read_text());before=json.loads((R/'size-before-deletion.json').read_text());pres=json.loads((R/'protected-verification-after.json').read_text());doc=json.loads((R/'documentation-validation.json').read_text());git=json.loads((R/'git-delta.json').read_text());tests=(R/'regression-tests.log').read_text();assert re.search(r'Test Files\s+13 passed',tests) and re.search(r'Tests\s+75 passed',tests)
# Required no-render/immutable-source boundaries and final masters all asserted again at reporting.
for rel,expected in json.loads((R/'protected-hashes-before.json').read_text()).items():assert sha(W/rel)==expected,(rel,'Changed after checks')
assert (R/'typecheck-after-cleanup.log').read_text().strip().endswith('tsc --noEmit')
validation={'status':'PASS','skill_validation':'PASS','documentation_links':{'status':'PASS','checked':doc['links_checked']},'typecheck_before_cleanup':'PASS','typecheck_after_cleanup':'PASS','regressions':{'status':'PASS','files':13,'tests':75,'coverage':['Short01/Short02 source equivalence, hook reset, seek, proof restoration and story','Long micro-pass/reset/final-function regression','presentation/registry isolation','shared export identity/native frame manifest/resumability']},'protected_hashes':pres,'final_short_bundle':'40/40 SHA256 entries PASS','rendering':'NOT RUN — out of scope','audio_rendering':'NOT RUN — out of scope','application_source_edits':False,'git_delta':'PASS_EXPECTED_DELTA'};save(R/'validation.json',validation)
# Retention map makes intentional historical missing files explicit, without rewriting freezes.
save(R/'retention-ledger.json',{'status':'KEEP_AND_PURGE_BOUNDARY_DOCUMENTED','current_master_bundle':'short/final-short02-1080p/ fully retained and verified','director_story':['Short01 canonical candidate/stills/plan/QA retained','Short02 approved silent candidate/native and decoded stills/contact sheets/director plan retained','MusicPass01 selected WAV + reviewMP4 + edit/analysis/provenance/QA/iteration metadata retained','FinalShort mastering script/configuration/audio/video/checks retained'],'historical_manifests':'Preserved byte-identically; raw/rejected media deletions are recorded by exact path/hash in deletion-manifest.json and deletion-ledger.jsonl, not rewritten as current file availability.','reproduction_dependencies':['Short FINAL master_audio.py requires selected Pass01 WAV: retained','Short FINAL mux_verify.py uses Pass01 reviewMP4 and original silent visual: retained','Long Pass02 build asserts old approved AB candidate1/BC/intro/provenance freezes: entire Long musicPass01/02 retained including raw director MP3s','Final Short checksum bundle includes working pre-level WAV: retained to keep final bundle verifiable'],'raw_frame_recovery':'Purged stale/smoke jobs cannot resume; archived checkpoint/logs remain. Completed Short02 job finalMP4 remains downloadable; its removed raw frames must be freshly validated/re-rendered if needed. No exporter or automatic cache behavior changed.','unrelated_products':'Retained','archived_job_metadata_manifest':str(R/'retained-job-evidence.json')})
rows='\n'.join(f"| {k} | {x['files']:,} | {x['bytes']:,} | {x['bytes']/1024**3:.3f} |" for k,x in result['categories'].items())
report=f'''# Short standard and post-final cleanup

Status: **SHORT STANDARD COMPLETE / CLEANUP COMPLETE**.

## Rule and skill

- [Short production Rule]({W/'rules/short-form-assembly-video.md'}) — v1.0,20 normative invariants: shared product/AssemblyGraph truth, separate editorial identity, native1080×1920/30fps/<=60s, readable compression, functional hook/reset, story/camera/captions, valid proof/payoff, determinism, shared resumable export, isolated revisions, visual→music→final gates, music-only policy, final verification and immutable accepted masters.
- [Short production Skill]({W/'.agents/skills/short-form-assembly-video/SKILL.md'}) — v1.0,10 procedural phases: preflight, product-specific Director plan, presentation implementation, regression QA, full silent review, requested revision, visual freeze, Short-specific music, authorized mastering/mux, final freeze/cleanup. WF311613 is an example, never a fixed timestamp/product rule.
- [Shared retention policy]({W/'rules/production-artifact-retention.md'}) — authorized exact-path cleanup, source/reproduction retention, hash checks and honest historical deletion ledger.

AGENTS.md routes Short requests and the existing Long Rule links the shared Short/retention standards. Shared mechanical/provenance/audio/export guidance is linked rather than duplicated. No product, engine, exporter or UI architecture was changed. The new repository-local skill is discoverable through `.agents/skills`; this report does not claim dynamic registration in the already-running chat.

## Audit and deletion

Audit: [cleanup-audit.json]({R/'cleanup-audit.json'})

Before-delete manifest: [deletion-manifest.json]({R/'deletion-manifest.json'})

Actual removal ledger: [deletion-ledger.jsonl]({R/'deletion-ledger.jsonl'})

Retention/dependency explanation: [retention-ledger.json]({R/'retention-ledger.json'})

**{result['files_removed']:,}files**, **{result['logical_bytes_removed']:,}logical bytes** (**{result['logical_bytes_removed']/1024**3:.3f}GiB**) and **{result['directories_removed']}empty directories** removed. No symlinks followed. All paths were classified before mutation and hashed immediately before deletion.

| Removed category | Files | Logical bytes | GiB |
|---|---|---|---|
{rows}

Large completed/stale/smoke frame caches, superseded fit/native probes, early pacing screenshots, rejected procedural audio, Short rejected/unlevelled/duplicate iteration WAVs, NPZ and redundant convenience previews were disposable. Exact stale-job checkpoints/logs were copied and hash-verified to `retained-job-evidence/` before those job directories were retired. The full completed Short02 job retains its finalMP4/manifest/logs; only raw frames and silent intermediary were purged. Terminal manifest hashes and absent worker lock supplied the concurrency gate; process listing was unavailable in the sandbox and is reported as such.

Historical decisions remain understandable through retained Short01→Short02 visual→MusicPass01→FINAL reports/plans/hashes/stills/contacts, the actual source/review media needed by final scripts and source/license evidence. Whole LongPass01/02 music directories are retained because production reproduction assertions still depend on historical approved clips/freeze inputs. All40 files in the final Short checksum bundle remain intact, including its reproducibility intermediate. Unrelated products are retained.

Historical SHA/freeze reports still describe their original snapshots. Their intentionally removed disposable entries are identified in this task's path/hash ledger; they are not claimed to be currently available. Current final Short master bundle is fully verifiable. No changes to automatic retention/resume behavior; purged frames need fresh validation/render before future reuse.

## Preservation and validation

**{pres['files']:,}protected hashes PASS before and after**, covering application/source/tests, product/assembly/material/geometry data, rules/skills, all KEEP media/evidence and approved sources. Explicit finalShortMP4/WAV, approvedShortvisual/MusicPass01WAV, Longsilent/musicMP4 and LongPass02WAV match Director-authoritative expected hashes. Final Short bundle40/40 checksum entries PASS.

- Skill frontmatter validation PASS using bundled validator with existing systemPyYAML; no dependencies installed.
- {doc['links_checked']}local governance/skill links PASS.
- TypeScript `npm run typecheck` PASS, including after cleanup.
- Lightweight regressions: **75tests/13files PASS**, covering Short/Long state/seek/function and shared export/native/fingerprint/checkpoint behavior.
- No new video or audio render. No app build was required for this documentation/output cleanup.
- Git delta: **{git['new_tracked_disposable_deletions']:,}manifest-listed tracked deletions** plus5 intended governance status entries (AGENTS,Longcross-links,newShortRule,newShortSkill,newretentionRule). Existing source changes are preserved; the previously modified stale1440p checkpoint is preserved byte-identically in the audit archive before retirement. No staging/commit/history rewriting, `git gc` or LFS changes.

See `validation.json`, `protected-verification-before.json`, `protected-verification-after.json`, `final-master-bundle-verification.json` and `git-delta.json`. Logical size snapshots (output and repository working files) are in `size-before-deletion.json` and `size-after-cleanup.json`; repository excludes `.git`,node_modules,`.next` and symlinks. Logical bytes removed are not a measurement of APFS physical disk reclamation. Net size changes include added compact audit/retention records.

Final Short MP4 remains `{P/'short/final-short02-1080p/WF311613-short02-FINAL-vertical-1080p.mp4'}` withSHA256`e24317a8787379ad9ba2aab19d5d58fd1012953de6a73a923759d492035c4a79`.

Final Short WAV remains `{P/'short/final-short02-1080p/WF311613-short02-FINAL-music-master.wav'}` withSHA256`5ba9089960a09efb55e3e3a57e32ffb11692f2e134b5f1378097101fe883785a`.

Both frozen Longmasters and approved sources remain. No publication/upload or creative revision. STOP.
'''
(R/'CLEANUP-REPORT.md').write_text(report)
# Final-sized metadata uses a bounded update to stabilize its own byte count.
snapshot={'output':sizes(W/'output'),'repository_working_files':sizes(W,('.git','node_modules','.next')),'repository_exclusions':['.git','node_modules','.next','symlinks'],'before':before,'deleted_files':result['files_removed'],'deleted_logical_bytes':result['logical_bytes_removed'],'removed_directories':result['directories_removed']}
for _ in range(4):
 snapshot['output']=sizes(W/'output');snapshot['repository_working_files']=sizes(W,('.git','node_modules','.next'));snapshot['net_output_logical_bytes_reduction']=before['output']['logical_bytes']-snapshot['output']['logical_bytes'];save(R/'size-after-cleanup.json',snapshot)
# Add measured before/after table to report then refresh final snapshot for report growth.
report+='\n## Size snapshots\n\n| Scope | Before logical bytes | After logical bytes |\n|---|---|---|\n'+f"| Output | {before['output']['logical_bytes']:,} | {snapshot['output']['logical_bytes']:,} |\n| Repository working files (specified exclusions) | {before['repository_working_files']['logical_bytes']:,} | {snapshot['repository_working_files']['logical_bytes']:,} |\n\nTable snapshot precedes this final report table/manifest growth; final counters are recorded in size-after-cleanup.json.\n"
(R/'CLEANUP-REPORT.md').write_text(report)
# Hash manifests contain all maintenance records except themselves and this invocation's active log.
entries=sorted(p for p in R.rglob('*') if p.is_file() and p.name not in ['SHA256SUMS.txt','finalize.log','size-after-cleanup.json'])
(R/'SHA256SUMS.txt').write_text(''.join(f'{sha(p)}  {p.relative_to(R)}\n' for p in entries))
for _ in range(4):
 snapshot['output']=sizes(W/'output');snapshot['repository_working_files']=sizes(W,('.git','node_modules','.next'));snapshot['net_output_logical_bytes_reduction']=before['output']['logical_bytes']-snapshot['output']['logical_bytes'];save(R/'size-after-cleanup.json',snapshot)
# Final size snapshot intentionally separate from checksum list to avoid self-size/hash recursion.
print(json.dumps({'status':'SHORT STANDARD COMPLETE / CLEANUP COMPLETE','before_output':before['output'],'after_output':snapshot['output'],'removed_files':result['files_removed'],'removed_bytes':result['logical_bytes_removed'],'removed_directories':result['directories_removed'],'tests':'75/13 PASS','protected_hashes':pres['files']},indent=2))
