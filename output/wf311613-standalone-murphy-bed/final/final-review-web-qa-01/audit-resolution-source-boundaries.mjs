// Lightweight post-infrastructure evidence only. No source or validator edits.
// node --import tsx <this-script> [new-report-label] [explicit-allowed-paths.json]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),label=process.argv[2]??'after-infrastructure';
if(!/^[a-zA-Z0-9_-]+$/.test(label))throw Error('Report label must be a simple artifact name');
const output=path.join(dir,`source-boundaries-${label}.json`);if(fs.existsSync(output))throw Error('Refusing to overwrite source boundary evidence');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=v=>sha(JSON.stringify(v));
const frozen=read(path.join(dir,'frozen-source-hashes.json')),history=read(path.join(dir,'preserved-history-hashes.json')),
  approved=read(path.join(dir,'pre-render-identity.json')),allowPath=path.resolve(process.argv[3]??path.join(dir,'authorized-generic-resolution-paths.json')),allow=read(allowPath),allowed=new Set(allow.paths);
const walk=root=>fs.existsSync(root)?fs.readdirSync(root,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(root,d.name)):d.isFile()?[path.join(root,d.name)]:[]):[];
const current=[...walk('src'),...walk('scripts'),...walk('public'),...['package.json','package-lock.json','tsconfig.json','next.config.ts','eslint.config.mjs','next-env.d.ts','AGENTS.md'].filter(p=>fs.existsSync(p))].sort();
const changed=Object.entries(frozen.hashes).filter(([p,h])=>!fs.existsSync(p)||sha(fs.readFileSync(p))!==h).map(([p,h])=>({path:p,before:h,after:fs.existsSync(p)?sha(fs.readFileSync(p)):null}));
const added=current.filter(p=>!(p in frozen.hashes)).map(p=>({path:p,after:sha(fs.readFileSync(p))}));
const historyChanged=Object.entries(history.hashes).filter(([p,h])=>!fs.existsSync(p)||sha(fs.readFileSync(p))!==h).map(([p])=>p);
const protectedProductChanges=[...changed,...added].filter(p=>p.path.startsWith('src/products/wf311613-standalone-murphy-bed/'));
const expectedGenericDeltas=[...changed,...added].filter(p=>allowed.has(p.path)),unexpectedDeltas=[...changed,...added].filter(p=>!allowed.has(p.path));
const {getProductPackage}=await import(pathToFileURL(path.resolve('src/products/registry.ts')).href);
const entry=getProductPackage(approved.candidate),baseline=getProductPackage(approved.approvedBaseline);
const values={productHash:hash(entry.product),materialHash:hash(entry.product.materials),assemblyHash:hash(entry.assembly),approvedPlanHash:hash(entry.directorPlan),microVideoHash:hash(entry.video),camerasSha256:hash(entry.video.cameraPresets)};
const checks={...Object.fromEntries(Object.entries(values).map(([key,value])=>[key,value===approved[key]])),
  productPackageBytes:!protectedProductChanges.length,
  originalAssemblyReference:entry.assembly===baseline.assembly,originalPlanReference:entry.directorPlan===baseline.directorPlan,
  allAssemblyShowcaseSceneReferences:entry.video.scenes.slice(4).every((s,i)=>s===baseline.video.scenes[i]),
  presentationReference:entry.video.presentation===baseline.video.presentation,
  introExact:JSON.stringify(entry.video.intro)===JSON.stringify(approved.intro),
  approvedStep26CameraExact:JSON.stringify(entry.video.cameraPresets['S26-cabinet-eye'])===JSON.stringify(approved.step26Camera),
  exactDeterministicTimeline:entry.video.scenes.reduce((n,s)=>n+s.duration,0)===approved.duration,
  noUnexpectedPathDelta:!unexpectedDeltas.length,historyPreserved:!historyChanged.length,silent:!entry.video.audio?.music&&!entry.video.audio?.voiceover};
const legacy92=read('output/wf311613-standalone-murphy-bed/reviews/director-polish-02b/approved-source-locks.json');
const historical92SourceChanges=Object.entries(legacy92).filter(([p,h])=>!fs.existsSync(p)||sha(fs.readFileSync(p))!==h).map(([p])=>p);
const result={valid:Object.values(checks).every(Boolean),candidate:entry.id,freezeFileCount:Object.keys(frozen.hashes).length,currentFileCount:current.length,fullFrozenFileSet:Object.keys(frozen.hashes).sort(),checks,dataHashes:values,changed,added,expectedGenericDeltas,unexpectedDeltas,protectedProductChanges,historyChanged,allowedPathsArtifact:allowPath,allowedPathSemantics:allow.required_semantics,
  scopeOnly:'Path classification is not semantic approval. Review the actual diffs and native raster/UI tests separately; no native validation rule is modified.',
  historical92SourceChanges,legacySourceGateNote:'Legacy validate-micro-pass.ts source branch permits only ProductViewer. Its 92-source manifest also includes ExportJobManager and FrameRenderer. New authorized export edits may trigger that historical byte lock even when all protected product data and unchanged mechanical gates pass; preserve the pre-infrastructure native micro PASS and report those deltas explicitly, never silently rewrite/relax the validator.',verifiedAt:new Date().toISOString()};
fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,fullFrozenFileSet:undefined},null,2));if(!result.valid)process.exitCode=1;
