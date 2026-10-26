"""One-shot authorized output consolidation; never renders or changes product source.
Plan is frozen before any move/removal. Existing manifests remain historical.
"""
from pathlib import Path
import collections, gzip, hashlib, json, shutil, sys, tarfile

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'output/final-products-consolidation-20261026'
NAMES = ['wf311613-standalone-murphy-bed', 'product03-pet-crate-w114586144']
PREFIXES = {
    NAMES[0]: {
        'final/final-lofi-720p/': 'final/long/',
        'short/final-short02-1080p/': 'final/short/',
        'final/lofi-music-pass02/': 'final/music/long-master/',
        'final/lofi-music-pass01/': 'final/music/original-sources/',
        'release-assets/': 'final/release-assets/',
    },
    NAMES[1]: {
        'final-music-v1/PRODUCT03-Long-V5-MUSIC-720p.mp4': 'final/long/PRODUCT03-Long-FINAL-720p.mp4',
        'final-music-v1/PRODUCT03-Short-V3-MUSIC-1080x1920.mp4': 'final/short/PRODUCT03-Short-FINAL-1080x1920.mp4',
        'final-music-v1/': 'final/qa/',
        'music-only-v1/': 'final/music/',
        'phase-a-v1/': 'final/source-audit/',
        'reproduction/': 'final/reproduction/',
        'release-assets/': 'final/release-assets/',
    },
}
# Small redundant acquisition failures, transient logs, duplicate evidence ZIP:
# preserve exact bytes in a verified compact archive instead of cluttering finals.
ARCHIVE_ONLY = {
    NAMES[0]: {
        'final/lofi-music-pass01/evidence/retry-A-403.html',
        'final/lofi-music-pass01/evidence/retry-B-403.html',
        'final/lofi-music-pass01/evidence/retry-C-403.html',
        'final/lofi-music-pass01/evidence/retry-download-results.json',
    },
    NAMES[1]: {
        'final-music-v1/PRODUCT03-NEW-CC0-MUSIC-REVIEW-EVIDENCE.zip',
        'music-only-v1/BUILD-MUSIC-LOG.txt', 'music-only-v1/FINALIZE-LOG.txt',
        'music-only-v1/MUSIC-QA-LOG.txt', 'music-only-v1/MUX-REVIEW-LOG.txt',
        'music-only-v1/ASSEMBLE-MUSIC-REQUEST.txt',
    },
}

def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''): h.update(b)
    return h.hexdigest()

def write(p, value):
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def files(base):
    for p in sorted(base.rglob('*')):
        assert not p.is_symlink(), str(p)
        if p.is_file(): yield p

def plan():
    assert not AUDIT.exists(), 'Do not overwrite the frozen plan'
    AUDIT.mkdir()
    rows = []
    for n in NAMES:
        for p in files(ROOT/'output'/n):
            rel = p.relative_to(ROOT/'output'/n).as_posix()
            dest = None
            if rel == 'README.md': action = 'KEEP'
            elif rel in ARCHIVE_ONLY[n]: action = 'ARCHIVE_REMOVE'
            else:
                action = 'MOVE'
                for old, new in PREFIXES[n].items():
                    if rel.startswith(old):
                        dest = 'output/'+n+'/'+new+rel[len(old):]
                        break
                assert dest, rel
            rows.append({'path': p.relative_to(ROOT).as_posix(), 'destination': dest,
                         'action': action, 'sha256': sha(p), 'bytes': p.stat().st_size,
                         'reason': 'Final, source, audio, licensing or QA input retained for compilation/re-edit'
                         if action != 'ARCHIVE_REMOVE' else 'Redundant transient evidence; exact bytes archived'})
    targets = [r['destination'] for r in rows if r['destination']]
    assert len(set(targets)) == len(targets)
    assert all(not (ROOT/t).exists() for t in targets)
    write(AUDIT/'PLAN.json', rows)
    # Reuse prior path inventory, refresh hashes before mutation. Source and ALL #02 protected.
    old = json.load(gzip.open(ROOT/'output/final-products-cleanup-20261026/PROTECTED-BASELINE-R2.json.gz','rt'))
    protected = {}
    for rel in old:
        if rel.startswith(('src/', 'references/', 'output/idmarket-juliette-18094/')):
            p = ROOT/rel
            assert p.is_file() and not p.is_symlink(), rel
            protected[rel] = sha(p)
    with gzip.open(AUDIT/'PROTECTED-BEFORE.json.gz','wt') as f: json.dump(protected,f)
    archived = [r for r in rows if r['action']=='ARCHIVE_REMOVE']
    archive = AUDIT/'redundant-support-history.tar.gz'
    with tarfile.open(archive,'w:gz') as tar:
        for r in archived: tar.add(ROOT/r['path'],arcname=r['path'],recursive=False)
    with tarfile.open(archive) as tar:
        for r in archived:
            assert hashlib.sha256(tar.extractfile(r['path']).read()).hexdigest()==r['sha256']
    shutil.copy2('/tmp/product03-active-dependencies.json', AUDIT/'ACTIVE-SOURCE-DEPENDENCIES.json')
    write(AUDIT/'PLAN-SUMMARY.json', {'actions':dict(collections.Counter(r['action'] for r in rows)),
        'protectedPaths':len(protected), 'archiveSHA256':sha(archive),
        'authority':'Human: retain necessary inputs for final films, future compilations and further editing; only01/03',
        'sourceVersions':'15 Product03 source directories are active transitive final dependencies; no runtime refactor/deletion',
        'noRender':True, 'Product02':'Excluded and fully protected'})
    print('PLAN FROZEN', len(rows), 'output files;', len(protected), 'protected paths', flush=True)

def apply():
    assert not (AUDIT/'RESULT.json').exists(), 'Already completed'
    rows = json.loads((AUDIT/'PLAN.json').read_text())
    summary = json.loads((AUDIT/'PLAN-SUMMARY.json').read_text())
    assert sha(AUDIT/'redundant-support-history.tar.gz') == summary['archiveSHA256']
    protected = json.load(gzip.open(AUDIT/'PROTECTED-BEFORE.json.gz','rt'))
    for r in rows:
        p=ROOT/r['path']; assert sha(p)==r['sha256'] and p.stat().st_size==r['bytes'],r['path']
    for rel,h in protected.items(): assert sha(ROOT/rel)==h,rel
    for r in rows:
        p=ROOT/r['path']
        assert not p.is_symlink() and sha(p)==r['sha256'], r['path']
        if r['action']=='MOVE':
            d=ROOT/r['destination'];assert not d.exists();d.parent.mkdir(parents=True,exist_ok=True)
            p.rename(d);assert sha(d)==r['sha256']
        elif r['action']=='ARCHIVE_REMOVE': p.unlink()
    for n in NAMES:
        for p in sorted((ROOT/'output'/n).rglob('*'),key=lambda p:len(p.parts),reverse=True):
            if p.is_dir() and not any(p.iterdir()): p.rmdir()
    for rel,h in protected.items(): assert sha(ROOT/rel)==h,rel
    current={r['destination'] or r['path']:r['sha256'] for r in rows if r['action']!='ARCHIVE_REMOVE'}
    write(AUDIT/'RELOCATED-SHA256.json',current)
    write(AUDIT/'RESULT.json',{'status':'PASS','movedFiles':sum(r['action']=='MOVE' for r in rows),
        'archivedAndRemovedFiles':sum(r['action']=='ARCHIVE_REMOVE' for r in rows),
        'removedLogicalBytes':sum(r['bytes'] for r in rows if r['action']=='ARCHIVE_REMOVE'),
        'protectedPathsChecked':len(protected),'protectedChanges':[], 'Product02':'UNCHANGED',
        'movieBytes':'UNCHANGED;2 final MP4s per product', 'source':'UNCHANGED',
        'historicalManifests':'Original bytes; old paths resolved through PLAN.json relocation map',
        'noRender':True,'noAudioChange':True})
    print('CONSOLIDATION PASS',flush=True)

if __name__=='__main__':
    assert sys.argv[1] in ('plan','apply')
    plan() if sys.argv[1]=='plan' else apply()
