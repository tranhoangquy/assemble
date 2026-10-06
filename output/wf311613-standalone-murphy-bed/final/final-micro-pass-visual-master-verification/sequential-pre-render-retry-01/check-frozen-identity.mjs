// Lightweight evidence-only check. It never edits candidate or historical files.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const dir=path.dirname(fileURLToPath(import.meta.url)),parent=path.dirname(dir);
const phase=process.argv[2]??'before';
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read(path.join(parent,'frozen-source-hashes.json')),history=read(path.join(parent,'preserved-history-hashes.json'));
const deltas=manifest=>Object.entries(manifest.hashes).filter(([p,h])=>!fs.existsSync(p)||hash(fs.readFileSync(p))!==h).map(([p])=>p);
const changedSources=deltas(snapshot),changedHistory=deltas(history);
const {getProductPackage}=await import(pathToFileURL(path.resolve('src/products/registry.ts')).href);
const entry=getProductPackage('wf311613-final-micro-pass'),baseline=getProductPackage('wf311613-director-polish-02b');
const approved=read('output/wf311613-standalone-murphy-bed/reviews/final-micro-pass/micro-validation.json');
const identity=read(path.join(parent,'pre-render-identity.json'));
const hashes={productHash:hash(entry.product),materialHash:hash(entry.product.materials),assemblyHash:hash(entry.assembly),approvedPlanHash:hash(entry.directorPlan),microVideoHash:hash(entry.video)};
const checks={sourceBytes:!changedSources.length,historyBytes:!changedHistory.length,
  ...Object.fromEntries(Object.entries(hashes).map(([k,v])=>[k,v===approved[k]])),
  introIdentity:JSON.stringify(entry.video.intro)===JSON.stringify(approved.intro)&&entry.video.intro.duration===5,
  step26Camera:JSON.stringify(entry.video.cameraPresets['S26-cabinet-eye'])===JSON.stringify(identity.step26Camera),
  assemblyReference:entry.assembly===baseline.assembly,planReference:entry.directorPlan===baseline.directorPlan,
  scenesUnchanged:entry.video.scenes.slice(4).every((s,i)=>s===baseline.video.scenes[i]),presentationUnchanged:entry.video.presentation===baseline.video.presentation,
  otherCamerasUnchanged:Object.entries(baseline.video.cameraPresets).every(([id,c])=>id==='S26-cabinet-eye'||entry.video.cameraPresets[id]===c),
  silent:!entry.video.audio?.music&&!entry.video.audio?.voiceover};
const framesRoot='output/wf311613-standalone-murphy-bed/frames';
const renderState={frameDirectories:fs.readdirSync(framesRoot).sort(),newMasterExists:fs.existsSync('output/wf311613-standalone-murphy-bed/final/wf311613-final-micro-pass-visual-master-720p.mp4')};
const extraEvidence={vitestConfigSha256:hash(fs.readFileSync('vitest.config.mts')),gateRunnerSha256:hash(fs.readFileSync(path.join(dir,'run-approved-gate.mjs'))),originalGateRunnerSha256:hash(fs.readFileSync(path.join(parent,'run-approved-gate.mjs')))};
checks.gateRunnerUnchanged=extraEvidence.gateRunnerSha256===extraEvidence.originalGateRunnerSha256;
if(phase==='after'){
  const before=read(path.join(dir,'identity-before.json'));
  checks.testConfigUnchanged=extraEvidence.vitestConfigSha256===before.extraEvidence.vitestConfigSha256;
  checks.noRenderOutputCreated=JSON.stringify(renderState)===JSON.stringify(before.renderState);
}
const result={candidate:entry.id,phase,valid:Object.values(checks).every(Boolean),checks,hashes,sourceFiles:Object.keys(snapshot.hashes).length,historyFiles:Object.keys(history.hashes).length,changedSources,changedHistory,intro:entry.video.intro,step26Camera:entry.video.cameraPresets['S26-cabinet-eye'],extraEvidence,renderState,checkedAt:new Date().toISOString()};
const output=path.join(dir,`identity-${phase}.json`);if(fs.existsSync(output))throw new Error('Refusing to overwrite identity evidence');
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,intro:undefined,renderState:undefined},null,2));if(!result.valid)process.exitCode=1;
