/** Artifact/report builder only; never mutates rendering or engineering data. */
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {microIntro,microVideo,microId,step26Camera} from '../director/final-micro-pass';
import {polish02bVideo,polish02Plan} from '../director/polish-pass02b';
import {polishShotTime} from '../director/polish-pass01';
async function main(){
const dir=path.resolve('output/wf311613-standalone-murphy-bed/reviews/final-micro-pass');
const json=(name:string)=>JSON.parse(readFileSync(path.join(dir,name),'utf8'));
const qa=json('browser-qa.json'),validation=json('micro-validation.json');
if(!qa.valid||!validation.valid)throw new Error('Focused QA is not PASS; report cannot mark it ready.');
const stills=readdirSync(path.join(dir,'stills')).filter(f=>/^\d\d-.*\.png$/.test(f)).sort();
if(stills.length!==10)throw new Error(`Expected ten required stills, got ${stills.length}`);
const labels=['01 Finished product','02 Exploded 50 percent','03 Fully exploded','04 Exploded hold','05 Before editorial cut','06 Step 1 exact reset','07 Step 26 BEFORE','08 Step 26 alignment','09 Step 26 active connection','10 Step 26 secured'];
// Compose original screenshots in a labeled HTML grid. This is an artifact
// sheet, not a changed product render (local ffmpeg has no drawtext filter).
const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
try{
  const page=await browser.newPage({viewport:{width:1280,height:1940},deviceScaleFactor:1});
  await page.setContent(`<style>body{margin:0;background:#222;color:white;font:18px Arial}main{display:grid;grid-template-columns:640px 640px}figure{margin:0}figcaption{height:28px;line-height:28px;padding-left:12px}img{display:block;width:640px;height:360px}</style><main>${stills.map((f,i)=>`<figure><figcaption>${labels[i]}</figcaption><img src="data:image/png;base64,${readFileSync(path.join(dir,'stills',f)).toString('base64')}"></figure>`).join('')}</main>`);
  await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
  await page.screenshot({path:path.join(dir,'contact-sheet.png'),fullPage:true});
}finally{await browser.close();}
const clip=path.join(dir,'wf311613-intro-qa-5s.mp4');
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',clip],{encoding:'utf8'}));
const video=probe.streams.find((s:{codec_type:string})=>s.codec_type==='video');
if(probe.streams.length!==1||video.nb_read_frames!=='150'||video.width!==1280||video.height!==720||video.r_frame_rate!=='30/1'||video.pix_fmt!=='yuv420p'||video.codec_name!=='h264'||Number(probe.format.duration)!==5)throw new Error('Intro preview properties do not match the strict five-second scope.');
execFileSync('ffmpeg',['-v','error','-xerror','-i',clip,'-f','null','-']);
const sha=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
const baseline=JSON.parse(readFileSync('output/wf311613-standalone-murphy-bed/final/polish-02b-visual-master-verification/frozen-source-hashes.json','utf8')).hashes as Record<string,string>;
const changed=Object.entries(baseline).filter(([file,h])=>sha(file)!==h).map(([file])=>file);
const expectedChanges=['src/components/animation/AnimationController.tsx','src/components/viewer/ProductViewer.tsx','src/products/tests/registry.test.ts','src/products/wf311613-standalone-murphy-bed/index.ts','src/types/video.ts'];
if(changed.some(f=>!expectedChanges.includes(f)))throw new Error(`Unexpected baseline source change: ${changed.join(', ')}`);
const gates=readFileSync(path.join(dir,'gates.log'),'utf8').split('\n').filter(l=>/^[a-zA-Z][a-zA-Z0-9]* \{/.test(l)).map(l=>{const space=l.indexOf(' ');return {name:l.slice(0,space),...JSON.parse(l.slice(space+1))};});
if(gates.length!==15||gates.some(g=>!g.valid))throw new Error('Approved mechanical/regression gates not all PASS.');
const step=polish02Plan.steps.find(s=>s.step===26)!;
const start=polishShotTime(step.shots[0].id);
const affected=step.shots.filter(s=>s.camera==='S26-cabinet-eye').map(s=>({id:s.id,type:s.type,duration:s.duration,stepLocalStart:polishShotTime(s.id)-start,baselineGlobalStart:polishShotTime(s.id),prefixedGlobalStart:5+polishShotTime(s.id)}));
const report={candidate:microId,status:'QA ready for director review — not director approval',introDuration:5,
  timings:{finishedHero:1.25,separation:2.5,explodedHold:.875,editorialTransition:.375},
  groups:microIntro.groups,derivedFrom:{baseline:'wf311613-director-polish-02b',assembledTimestamp:microIntro.assembledTime,method:'Completed product ObjectRegistry snapshot; deterministic eased world-axis offsets converted to original parent-local coordinates. No assembly reversal, no reparenting, no mechanical changes.'},
  propsExcluded:true,assemblyOrderUnchanged:true,assemblyActionsAndDurationsUnchanged:true,presentationUnchanged:true,
  step1Reset:{numerical:validation.step1Reset,pixel:qa.step1Reset,pngReplay:qa.replay.map((r:{name:string;pngIdentical:boolean})=>({name:r.name,identical:r.pngIdentical}))},
  step26:{oldCamera:polish02bVideo.cameraPresets['S26-cabinet-eye'],newCamera:step26Camera,affected,mechanicsUnchanged:true,visibilityChecks:validation.cameraChecks},
  gates,typecheck:'PASS',lint:{result:'PASS',command:"npm run lint -- --ignore-pattern 'output/**'",note:'Generated historical output helpers excluded, not application source. No lint configuration/rules changed.'},tests:{files:30,passed:148},build:'PASS',
  paths:validation.explodedPaths,sourceDelta:{baselineFilesCompared:Object.keys(baseline).length,existingChanged:changed,mechanicalSourceLocksUnchanged:validation.mechanicalSourceLocksUnchanged,unexpected:validation.unexpectedSourceDeltas},
  expectedFullRuntime:microVideo.scenes.reduce((n,s)=>n+s.duration,0),stills:stills.map(f=>path.join(dir,'stills',f)),contactSheet:path.join(dir,'contact-sheet.png'),
  preview:{path:clip,duration:5,frames:150,width:1280,height:720,fps:30,codec:video.codec_name,pixelFormat:video.pix_fmt,size:statSync(clip).size,sha256:sha(clip),audioAbsent:true,completeDecode:'PASS',freshDeterministicFrames:true},
  warnings:['Existing THREE CommonJS and THREE.Clock deprecation warnings.','Existing Turbopack generated-frame glob warning; production build passes.'],
  stopBoundary:'No full micro-pass master rendered. No audio. No other creative/mechanical changes. Await director review.'};
writeFileSync(path.join(dir,'qa-report.json'),JSON.stringify(report,null,2));
const lines=[
  '# WF311613 — Final micro-pass QA',
  '',
  'Candidate: `wf311613-final-micro-pass`. Baseline: `wf311613-director-polish-02b`.',
  'QA ready for director review. This is **not** director approval. No full new master has been rendered.',
  '',
  '## 1–2. Exact intro timing',
  '',
  'Total **5.000 s**: finished closed hero 1.250 s → separation 2.500 s → exploded hold 0.875 s → clean editorial transition 0.375 s. The transition cuts to the locked Step 1 zero state; it does not collapse or reverse the assembly. Step 1 local time starts at global 5.000 s.',
  '',
  '## 3–4. Exploded groups and transform derivation',
  '',
  ...microIntro.groups.map(g=>`- ${g.id}: ${g.targets.join(', ')}. World offset [${g.worldOffset.join(', ')}] in existing scene units.`),
  '',
  `Transforms come from the approved finished-closed state at ${microIntro.assembledTime.toFixed(9)} s. Smoothstep offsets are converted into the existing parent coordinate space. Captive face-grid panels remain with their grid, and each mechanism remains with its cabinet side. No part is invented, scaled, reparented or decoratively spun.`,
  '',
  '## 5–6. Props and assembly authority',
  '',
  'Mattress, bedding, furniture, plants, rug, curtains and artwork are excluded from the product explosion. The approved finished-bedroom hero is followed by an editorial cut to the approved assembly room. Original PDF/AssemblyGraph order, all 31 DirectorPlan steps/actions, captions, installation paths and timings remain unchanged. Original finished showcase remains 20.8 s.',
  '',
  '## 7. Step 1 exact reset',
  '',
  `PASS: five numerical reset comparisons across ${validation.step1Reset.objects} registry objects, including descendant transforms, visibility and geometry variants. Camera and original presentation clock return to baseline. Actual rendered Step 1 PNG is byte-identical to baseline, including environment, lighting and presentation state. All nine candidate checkpoint PNGs repeat exactly when sought in reverse order.`,
  `Step 1 PNG SHA-256: \`${qa.step1Reset.approved.sha256}\`.`,
  '',
  '## 8–11. Step 26 camera-only correction',
  '',
  `Old: \`${JSON.stringify(report.step26.oldCamera)}\`.`,
  `New: \`${JSON.stringify(step26Camera)}\`.`,
  'Rear/interior open-side three-quarter access shows the stud, free eye and connection action without using the bed face as an intervening panel. No product object is moved for visibility. Native visible-mesh rays hit the active eye first; eye and mount centers stay inside the safe framing region. The actual playback preset is used for final stills, not an inspection override.',
  '',
  '| Shot | Step-local start (s) | Duration (s) | Original global start (s) | New global start (s) |',
  '|---|---:|---:|---:|---:|',
  ...affected.map(a=>`| ${a.id} | ${a.stepLocalStart.toFixed(3)} | ${a.duration.toFixed(3)} | ${a.baselineGlobalStart.toFixed(6)} | ${a.prefixedGlobalStart.toFixed(6)} |`),
  '',
  'Only the shared `S26-cabinet-eye` preset changes. Supported-raise/context and every other camera remain unchanged. Eye alignment, #17 retainer installation and verification action data/timing remain unchanged.',
  '',
  '## 12. Regression results and source delta',
  '',
  ...gates.map(g=>`- ${g.name}: PASS.`),
  '- Product/material hashes, AssemblyDefinition, original DirectorPlan and original Polish 02B video locks: unchanged.',
  '- Typecheck: PASS. Lint application source: PASS (`npm run lint -- --ignore-pattern \'output/**\'`; generated historical output helpers excluded, no rules/configuration changed).',
  '- Tests: 148/148 across 30 files. Production build: PASS.',
  `- Presentation path checks: ${validation.explodedPaths.samples} samples; ${validation.explodedPaths.pairChecks} cross-group checks; zero new penetrations. One pre-existing completed-state mating overlap (${validation.explodedPaths.initialCompletedStateContacts.join(', ')}) recorded separately. Existing assembly thresholds remain unchanged.`,
  `- Compared ${Object.keys(baseline).length} frozen baseline files. Existing modified files: ${changed.map(f=>'`'+f+'`').join(', ')}. These are opt-in intro host/type/registration integration and its registry expectation. No existing engine/mechanics, product geometry/material, assembly/DirectorPlan, environment or validator source is changed. New files are presentation composition, the camera-only candidate, tests and QA tools.`,
  '- Warnings: existing THREE CommonJS/Clock deprecations and Turbopack generated-frame glob warning. No render page errors.',
  '',
  '## 13. Expected new full-video runtime',
  '',
  '**524.053694 s (08:44.054)** = unchanged assembly 498.253694 s + unchanged showcase 20.8 s + intro 5 s. Full new master intentionally not rendered.',
  '',
  '## 14. Mandatory stills and contact sheet',
  '',
  ...stills.map((f,i)=>`- [${labels[i]}](stills/${f})`),
  '- [Combined contact sheet](contact-sheet.png).',
  '- [Interactive artifact gallery](qa-gallery.html).',
  '',
  '## 15. Optional intro-only preview',
  '',
  '[wf311613-intro-qa-5s.mp4](wf311613-intro-qa-5s.mp4): 5.000 s, 150 frames, 1280×720, 30 fps, H.264/yuv420p, silent. Fresh deterministic prefix frames only, not historical video/frame reuse. Complete decode PASS.',
  `Size: ${report.preview.size} bytes. SHA-256: \`${report.preview.sha256}\`.`,
  '',
  'STOP: await review of the intro, exploded composition, exact Step 1 reset and Step 26 camera. No full master, audio, 2K/4K, Option 2 or additional polish.'
];
writeFileSync(path.join(dir,'QA-REPORT.md'),lines.join('\n'));
writeFileSync(path.join(dir,'qa-gallery.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>WF311613 micro-pass QA</title><style>body{margin:24px;background:#222;color:#eee;font:16px system-ui}a{color:#f5b875}video{width:min(100%,960px)}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}img{width:100%;display:block}figure{margin:0}figcaption{padding:8px 0}header{margin-bottom:24px}@media(max-width:800px){main{grid-template-columns:1fr}}</style><header><h1>WF311613 · Final micro-pass QA</h1><p>Five-second intro + Step 26 camera only. Await director review; no full new master rendered.</p><p><a href="QA-REPORT.md">QA report</a> · <a href="contact-sheet.png">Combined contact sheet</a></p><video controls preload="metadata" src="wf311613-intro-qa-5s.mp4"></video></header><main>${stills.map((f,i)=>`<figure><a href="stills/${f}"><img src="stills/${f}" alt="${labels[i]}"></a><figcaption>${labels[i]}</figcaption></figure>`).join('')}</main></html>`);
writeFileSync(path.join(dir,'source-lock-delta.json'),JSON.stringify({baseline:'wf311613-director-polish-02b',candidate:microId,compared:Object.keys(baseline).length,changed,expectedChanges,productHash:validation.productHash,materialHash:validation.materialHash,assemblyHash:validation.assemblyHash,planHash:validation.approvedPlanHash,baselineVideoHash:validation.approved02bVideoHash,microVideoHash:validation.microVideoHash},null,2));
console.log(JSON.stringify({report:path.join(dir,'QA-REPORT.md'),stills:10,preview:report.preview,expectedRuntime:report.expectedFullRuntime},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
