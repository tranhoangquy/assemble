/** Artifact-only cold-start observation. No application/source changes, API
 * mocks, time retiming, exports, or frame sequences. The original 60 s ready
 * wait is run unchanged; independent 90/120 s observations do not turn a
 * failed 60 s wait into a PASS. Root runs this only with prior browser closed. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const parent = path.dirname(fileURLToPath(import.meta.url));
const directory = path.resolve(process.env.RENDER_READINESS_OUTPUT_DIR ?? path.join(parent,
  `render-readiness-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}`));
const origin = process.env.RENDER_READINESS_ORIGIN ?? 'http://127.0.0.1:3016';
const url = new URL('/render',origin);
url.searchParams.set('product','wf311613-final-micro-pass');
url.searchParams.set('profile','720p');
url.searchParams.set('fps','30');
const started = performance.now();
const elapsed = () => Math.round((performance.now()-started)*1000)/1000;
const now = () => ({at:new Date().toISOString(),elapsedMs:elapsed()});
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
const report = {
  kind:'read-only actual production render-route cold-start observation',
  startedAt:new Date().toISOString(),url:url.href,origin,headed:false,
  viewport:{width:1280,height:720},deviceScaleFactor:1,
  sourceModified:false,apiMocked:false,timeRetimed:false,
  originalReadyTimeoutMs:60000,laterObservationsSeconds:[90,120],
  navigation:{},readyGate60s:{status:'NOT_STARTED'},
  console:[],pageErrors:[],requestFailures:[],responses:[],lifecycle:[],
  snapshots:[],milestones:[],readyObservation:null,readyPng:null,
};
await mkdir(directory,{recursive:false}); // Never overwrite prior diagnosis.
await writeFile(path.join(directory,'run-started.json'),`${JSON.stringify(report,null,2)}\n`,{flag:'wx'});
let browser,page;
let gatePromise;
let observationStarted;
let readyCaptured = false;

async function snapshot(label) {
  const requested = now();
  // This independent diagnostic query has an observation budget, not an
  // altered application/validator timeout. A blocked utility context is itself
  // evidence. Pending read-only queries are released when this browser closes.
  let timer;
  try {
    const value = await Promise.race([
      page.evaluate(() => {
        const api=window.__VIDEO_RENDERER__;
        const canvas=document.querySelector('canvas');
        const safe = fn => { try{return fn();}catch(error){return {error:String(error)};} };
        return {
          documentReadyState:document.readyState,href:location.href,
          documentTitle:document.title,rendererPresent:Boolean(api),rendererReady:api?.ready===true,
          rendererFps:api?.fps,duration:api?.duration,
          engineDebug:window.__RENDER_DEBUG__ ?? null,
          canvas:canvas?{width:canvas.width,height:canvas.height,css:canvas.getBoundingClientRect().toJSON()}:null,
          surface:api?.ready&&api.getRenderSurface?safe(()=>api.getRenderSurface()):null,
          camera:api?.ready&&api.getCameraState?safe(()=>api.getCameraState()):null,
          loading:document.querySelector('.engine-loading')?.textContent ?? null,
          bodyText:document.body?.innerText.slice(0,1500) ?? '',
          lifecycle:window.__READINESS_QA_OBSERVATIONS__ ?? [],
        };
      }),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Read-only diagnostic utility query did not answer within 4 s.')),4000);}),
    ]);
    return {label,requested,received:now(),...value};
  } catch(error) {
    return {label,requested,received:now(),observationQueryError:{message:error.message,stack:error.stack}};
  } finally { clearTimeout(timer); }
}

async function captureReady(point) {
  if(readyCaptured) return;
  readyCaptured=true;
  report.readyObservation={...point,relativeToReadyWaitMs:point.received.elapsedMs-observationStarted};
  try {
    // One ordinary deterministic time-zero frame only. No assembly advancement,
    // export job, hardware mutation, historical frame reuse, or other seek.
    await page.evaluate(async()=>{await window.__VIDEO_RENDERER__.renderFrame(0);});
    const image=path.join(directory,'time-zero-ready.png');
    await page.screenshot({path:image,type:'png',animations:'disabled'});
    report.readyPng={path:image,time:0,width:1280,height:720,native:true,capturedAt:now()};
    report.timeZeroAfterCapture=await snapshot('after-one-time-zero-frame');
  } catch(error) {
    report.readyPngError={...now(),message:error.message,stack:error.stack};
  }
}

try {
  report.lifecycle.push({event:'browser-launch-start',...now()});
  browser=await chromium.launch({headless:true});
  report.lifecycle.push({event:'browser-launch-complete',...now()});
  browser.on('disconnected',()=>report.lifecycle.push({event:'browser-disconnected',...now()}));
  page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  report.lifecycle.push({event:'page-created',...now()});
  page.on('crash',()=>report.lifecycle.push({event:'page-crash',...now()}));
  page.on('domcontentloaded',()=>report.lifecycle.push({event:'domcontentloaded',...now()}));
  page.on('load',()=>report.lifecycle.push({event:'load',...now()}));
  page.on('console',message=>report.console.push({type:message.type(),text:message.text(),location:message.location(),...now()}));
  page.on('pageerror',error=>report.pageErrors.push({message:error.message,stack:error.stack,...now()}));
  page.on('requestfailed',request=>report.requestFailures.push({url:request.url(),method:request.method(),resourceType:request.resourceType(),failure:request.failure(),...now()}));
  page.on('response',response=>report.responses.push({url:response.url(),status:response.status(),resourceType:response.request().resourceType(),timing:response.request().timing(),...now()}));
  await page.addInitScript(()=>{
    // Passive observability only; never override a browser/app/renderer API.
    const observations=[];
    window.__READINESS_QA_OBSERVATIONS__=observations;
    const record=(event,extra={})=>observations.push({event,performanceMs:performance.now(),at:new Date().toISOString(),...extra});
    record('page-init');
    document.addEventListener('DOMContentLoaded',()=>record('DOMContentLoaded'),{once:true});
    window.addEventListener('load',()=>record('window-load'),{once:true});
    window.addEventListener('pageshow',event=>record('pageshow',{persisted:event.persisted}));
    const watched=new WeakSet();
    const watch=()=>document.querySelectorAll('canvas').forEach(canvas=>{
      if(watched.has(canvas)) return;
      watched.add(canvas);record('canvas-attached');
      canvas.addEventListener('webglcontextlost',event=>record('webglcontextlost',{statusMessage:event.statusMessage}));
      canvas.addEventListener('webglcontextrestored',()=>record('webglcontextrestored'));
    });
    new MutationObserver(watch).observe(document,{childList:true,subtree:true});
    watch();
  });
  report.navigation={started:now(),waitUntil:'domcontentloaded',timeoutMs:60000};
  try {
    const response=await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:60000});
    report.navigation={...report.navigation,completed:now(),status:response?.status(),ok:response?.ok(),success:true};
  } catch(error) {
    report.navigation={...report.navigation,finished:now(),success:false,error:{message:error.message,stack:error.stack}};
  }
  observationStarted=elapsed();
  if(report.navigation.success){
    report.readyGate60s={status:'RUNNING',started:now(),timeoutMs:60000,predicate:'window.__VIDEO_RENDERER__?.ready === true'};
    gatePromise=page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready===true,undefined,{timeout:60000})
      .then(async handle=>{
        report.readyGate60s={...report.readyGate60s,status:'PASS',finished:now()};
        await handle.dispose();
        console.log(JSON.stringify({kind:'original-60-second-ready-gate',...report.readyGate60s}));
      }).catch(error=>{
        report.readyGate60s={...report.readyGate60s,status:'FAIL',finished:now(),error:{message:error.message,stack:error.stack}};
        console.log(JSON.stringify({kind:'original-60-second-ready-gate',...report.readyGate60s}));
      });
  } else report.readyGate60s={status:'NOT_STARTED',reason:'Navigation did not complete within its unchanged 60 s budget.'};

  const thresholds=[60,90,120];
  let nextThreshold=0;
  while(nextThreshold<thresholds.length){
    const relative=elapsed()-observationStarted;
    const milestone=nextThreshold<thresholds.length&&relative>=thresholds[nextThreshold]*1000;
    const point=await snapshot(milestone?`ready-wait-${thresholds[nextThreshold]}s`:'poll');
    point.relativeToReadyWaitMs=point.received.elapsedMs-observationStarted;
    report.snapshots.push(point);
    if(milestone){
      report.milestones.push(point);
      console.log(JSON.stringify({kind:'read-only-readiness-milestone',label:point.label,requested:point.requested,received:point.received,rendererReady:point.rendererReady,engineDebug:point.engineDebug,observationQueryError:point.observationQueryError}));
      nextThreshold++;
    }
    if(point.rendererReady) await captureReady(point);
    if(nextThreshold===thresholds.length) break;
    await sleep(1000);
  }
  // Preserve an actual failed 60 s wait even when readiness appears at90/120.
  await gatePromise;
  report.diagnosticComplete=true;
} catch(error) {
  report.diagnosticComplete=false;
  report.diagnosticError={...now(),message:error.message,stack:error.stack};
} finally {
  report.rendererReadyEventually=Boolean(report.readyObservation);
  report.original60SecondGatePassed=report.readyGate60s.status==='PASS';
  report.interpretation=report.original60SecondGatePassed
    ? 'This isolated cold-start run met the unchanged 60 s readiness gate. It does not retroactively pass failed UI/export runs.'
    : 'The original 60 s ready gate is NOT PASS. Later readiness, if observed, is separate diagnostic evidence and does not change source, validators or timeout thresholds.';
  await browser?.close();
  report.finishedAt=new Date().toISOString();
  const destination=path.join(directory,'render-readiness-diagnostic.json');
  await writeFile(destination,`${JSON.stringify(report,null,2)}\n`,{flag:'wx'});
  await writeFile(path.join(directory,'RENDER-READINESS-DIAGNOSTIC.md'),
    `# Production render-route readiness diagnostic\n\nURL: ${url.href}\n\nHeadless Chromium, native 1280×720 / DPR 1, time zero only.\n\nOriginal unchanged 60 s ready gate: **${report.readyGate60s.status}**.\n\nEventually ready: ${report.rendererReadyEventually}.\n\n${report.interpretation}\n\nOne optional ready PNG: ${report.readyPng?.path??'not captured'}\n\nAll actual navigation, engine debug, canvas, camera, context-loss, console and network observations: ${destination}\n\nNo API mocks, exports, frame sequence, source changes or timeout/validator adjustments.\n`,{flag:'wx'});
  console.log(JSON.stringify({directory,report:destination,diagnosticComplete:report.diagnosticComplete,original60SecondGate:report.readyGate60s.status,eventualReady:report.rendererReadyEventually,readyPng:report.readyPng?.path},null,2));
}
