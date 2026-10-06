// Pre-export read-only browser verification. No candidate/engine/history edits.
// node --import tsx <this-script> [new-output-directory]
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {candidateId,baselineId,loadCandidate,checkpoints} from './checkpoints.mjs';
const evidence=path.resolve(process.argv[2]??path.dirname(fileURLToPath(import.meta.url)));
const reportPath=path.join(evidence,'whole-scene-seek-verification.json');
const stills=path.join(evidence,'whole-scene-seek-stills');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
await fs.mkdir(stills,{recursive:true});
try{await fs.access(reportPath);throw Error('Refusing to overwrite whole-scene verification history');}catch(e){if(e.code!=='ENOENT')throw e;}
const {entry}=await loadCandidate(),{points,duration}=checkpoints(entry);
const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
try {
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const errors=[],consoleErrors=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
  const open=async id=>{await page.goto(`${process.env.RENDER_URL??'http://localhost:3016'}/render?project=${encodeURIComponent(id)}`,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready,{},{timeout:90000});};
  const capture=async(time,file)=>{
    await page.evaluate(t=>window.__VIDEO_RENDERER__.renderFrame(t),time);
    const png=await page.screenshot({path:file,animations:'disabled',timeout:0});
    const camera=await page.evaluate(()=>window.__VIDEO_RENDERER__.getCameraState());
    return {sha256:hash(png),camera};
  };
  await open(baselineId);
  const baselineStep1=await capture(0,path.join(stills,'baseline-step1-zero.png'));
  await open(candidateId);
  const runtime=await page.evaluate(()=>window.__VIDEO_RENDERER__.getDuration());
  if(Math.abs(runtime-duration)>1e-9)throw Error('Browser runtime differs from frozen timeline');
  const initial=[];const expected=new Map();
  for(const p of points){const observed=await capture(p.time,path.join(stills,p.label+'.png'));expected.set(p.label,observed);initial.push({...p,...observed});console.log('Forward seek',p.label,p.time.toFixed(6));}
  const replay=[];
  for(const p of [...points].reverse()){
    const again=await capture(p.time),first=expected.get(p.label);
    const result={label:p.label,time:p.time,pngIdentical:again.sha256===first.sha256,cameraIdentical:JSON.stringify(again.camera)===JSON.stringify(first.camera),first,again};
    replay.push(result);console.log('Reverse seek',p.label,result.pngIdentical,result.cameraIdentical);
  }
  const excursion=['01-intro-finished-product','06-step1-exact-reset','29-final-hero','17-step26-active-connection','02-intro-mid-explosion','06-step1-exact-reset'];
  const excursions=[];
  for(const label of excursion){const p=points.find(p=>p.label===label),again=await capture(p.time),first=expected.get(label);excursions.push({label,time:p.time,pngIdentical:again.sha256===first.sha256,cameraIdentical:JSON.stringify(again.camera)===JSON.stringify(first.camera),first,again});}
  const actualStep1=expected.get('06-step1-exact-reset');
  const reset={pngIdentical:actualStep1.sha256===baselineStep1.sha256,cameraIdentical:JSON.stringify(actualStep1.camera)===JSON.stringify(baselineStep1.camera),baseline:baselineStep1,afterIntro:actualStep1};
  const report={valid:!errors.length&&!consoleErrors.length&&reset.pngIdentical&&reset.cameraIdentical&&replay.every(r=>r.pngIdentical&&r.cameraIdentical)&&excursions.every(r=>r.pngIdentical&&r.cameraIdentical),candidate:candidateId,baseline:baselineId,renderUrl:process.env.RENDER_URL??'http://localhost:3016',runtime,introDuration:entry.video.intro.duration,errors,consoleErrors,warnings,exactStep1Reset:reset,wholeSceneIncludes:'Actual 1280x720 renderer PNGs include product, geometry variants, hardware, lighting, captions, room, props, mattress and bedding; no inspection-camera override.',checkpoints:initial,reverseReplay:replay,introShowcaseMechanismResetExcursions:excursions,verifiedAt:new Date().toISOString()};
  await fs.writeFile(reportPath,JSON.stringify(report,null,2));
  console.log(JSON.stringify({valid:report.valid,errors,consoleErrors,reset,checkpoints:points.length,reverseExact:replay.filter(r=>r.pngIdentical&&r.cameraIdentical).length,excursionsExact:excursions.filter(r=>r.pngIdentical&&r.cameraIdentical).length}));
  if(!report.valid)process.exitCode=1;
} finally {await browser.close();}
