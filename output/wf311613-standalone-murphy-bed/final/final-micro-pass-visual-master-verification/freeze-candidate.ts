// Artifact/provenance only. No source, candidate or historical QA is mutated.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fullProduct} from '../../../../src/products/wf311613-standalone-murphy-bed/product/parts-step21-31';
import {microIntro,microVideo,microId,step26Camera,polish02Plan,polish02Assembly} from '../../../../src/products/wf311613-standalone-murphy-bed/director/final-micro-pass';
const dir=path.resolve('output/wf311613-standalone-murphy-bed/final/final-micro-pass-visual-master-verification');
const jsonHash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const sha=(file:string)=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const qaDir=path.resolve('output/wf311613-standalone-murphy-bed/reviews/final-micro-pass');
const approved=JSON.parse(fs.readFileSync(path.join(qaDir,'micro-validation.json'),'utf8'));
const checks={productHash:jsonHash(fullProduct),materialHash:jsonHash(fullProduct.materials),assemblyHash:jsonHash(polish02Assembly),approvedPlanHash:jsonHash(polish02Plan),microVideoHash:jsonHash(microVideo)};
for(const [name,value]of Object.entries(checks))if(value!==approved[name])throw new Error(`Approved data lock differs: ${name}`);
if(JSON.stringify(microIntro)!==JSON.stringify(approved.intro))throw new Error('Approved intro differs');
const duration=microVideo.scenes.reduce((n,s)=>n+s.duration,0);
if(microIntro.duration!==5||Math.abs(duration-524.0536938888888)>1e-9)throw new Error('Approved timing differs');
const walk=(root:string):string[]=>fs.existsSync(root)?fs.readdirSync(root,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(root,d.name)):d.isFile()?[path.join(root,d.name)]:[]):[];
const files=[...walk('src'),...walk('scripts'),...walk('public'),...['package.json','package-lock.json','tsconfig.json','next.config.ts','eslint.config.mjs','next-env.d.ts','AGENTS.md'].filter(f=>fs.existsSync(f))].sort();
const hashes=Object.fromEntries(files.map(file=>[file,sha(file)]));
const historyFiles=[...walk('output/wf311613-standalone-murphy-bed/reviews/final-micro-pass'),...walk('output/wf311613-standalone-murphy-bed/reviews/director-polish-02b'),...walk('output/wf311613-standalone-murphy-bed/reviews/director-polish-02'),
  'output/wf311613-standalone-murphy-bed/final/wf311613-polish-02b-visual-master-720p.mp4'].sort();
const historyHashes=Object.fromEntries(historyFiles.map(file=>[file,sha(file)]));
const identity={candidate:microId,approvedBaseline:'wf311613-director-polish-02b',dataLockMatchesApprovedQA:true,...checks,
  videoSha256:checks.microVideoHash,planSha256:checks.approvedPlanHash,camerasSha256:jsonHash(microVideo.cameraPresets),
  duration,expectedFrames:Math.ceil(duration*30),intro:microIntro,step26Camera,assemblyRuntime:498.2536938888889,showcaseRuntime:20.8,
  sourceFiles:files.length,historyFiles:historyFiles.length,
  note:'Approved historical data hashes verified. Full byte manifest freezes CURRENT reviewed source for pre/post export; no unavailable historical wrapper byte manifest is inferred.'};
fs.writeFileSync(path.join(dir,'pre-render-identity.json'),JSON.stringify(identity,null,2));
fs.writeFileSync(path.join(dir,'frozen-source-hashes.json'),JSON.stringify({candidate:microId,createdAt:new Date().toISOString(),hashes},null,2));
fs.writeFileSync(path.join(dir,'preserved-history-hashes.json'),JSON.stringify({createdAt:new Date().toISOString(),hashes:historyHashes},null,2));
console.log(JSON.stringify({...identity,intro:undefined},null,2));
