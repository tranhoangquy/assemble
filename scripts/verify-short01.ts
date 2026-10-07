/** WF311613 review QA; uses the same viewer/render route and export API. */
import type { ExportJobView } from '../src/types/export';
import { chromium } from 'playwright';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { rendererSourceHash } from '../src/engine/export/CreativeIdentity';
import { short01Video,short01Shots } from '../src/products/wf311613-standalone-murphy-bed/director/short01';
const origin=process.env.SHORT_QA_ORIGIN??'http://127.0.0.1:3031';
const out=path.resolve('output/wf311613-standalone-murphy-bed/short/short01-visual-review-v1');
const productId='wf311613-final-micro-pass',videoId=short01Video.id;
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const delay=()=>new Promise(r=>setTimeout(r,250));
async function api(url:string,body?:unknown,method='PATCH') { const r=await fetch(origin+url,body===undefined?{cache:'no-store'}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(JSON.stringify(j));return j; }
async function wait(id:string,predicate:(j:ExportJobView)=>boolean) {const until=Date.now()+300000;while(Date.now()<until){const j=await api(`/api/export/${id}`);if(predicate(j))return j;if(['waiting_for_resume','stale','error'].includes(j.status))throw new Error(JSON.stringify(j));await delay();}throw new Error('QA timed out');}
async function main(){
 await mkdir(path.join(out,'stills'),{recursive:true}); const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});const report:Record<string,unknown>={status:'RUNNING',visualApproval:'REQUIRES DIRECTOR REVIEW'};browser.on('disconnected',()=>console.log('QA browser closed'));const checkpoint=async(stage:string)=>{report.stage=stage;console.log(new Date().toISOString(),stage);await writeFile(path.join(out,process.env.SHORT_QA_NATIVE_ONLY==='1'?'native-preflight.json':'browser-smoke.json'),JSON.stringify(report,null,2));};
 try {
  if(process.env.SHORT_QA_REUSE_NATIVE==='1'){
   const previous=JSON.parse(await readFile(path.join(out,process.env.SHORT_QA_REUSE_NATIVE_FROM_PREFLIGHT==='1'?'native-preflight.json':'browser-smoke.json'),'utf8'));const freeze=JSON.parse(await readFile(path.join(out,'creative-freeze.json'),'utf8'));
   if(previous.captionSafeArea!=='PASS'||previous.stills?.length!==27||previous.deterministic?.length!==7||freeze.rendererSourceHash!==rendererSourceHash()||(previous.rendererSourceHash??previous.nativeEvidenceReused?.rendererSourceHash)!==freeze.rendererSourceHash)throw new Error('Cannot reuse native QA after a creative/renderer change');
   for(const key of ['surface','stills','captionSafeArea','deterministic','creativeHash','rendererSourceHash'])report[key]=previous[key];report.nativeEvidenceReused={reason:'Only export recovery UI changed; creative and renderer fingerprint unchanged',rendererSourceHash:freeze.rendererSourceHash};await checkpoint('native-evidence-reused-PASS');
  }else {
  const render=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  await render.goto(`${origin}/render?project=${productId}&video=${videoId}&profile=vertical-1080p&fps=30`,{waitUntil:'domcontentloaded',timeout:60000});
  await render.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready===true,undefined,{timeout:90000});
  const freeze=JSON.parse(await readFile(path.join(out,'creative-freeze.json'),'utf8'));const actualCreative=await render.evaluate(()=>window.__VIDEO_RENDERER__!.getCreativeDefinition!());const actualHash=hash(Buffer.from(JSON.stringify(actualCreative)));if(actualHash!==freeze.shortDataHash)throw new Error('Exact native creative fingerprint FAIL');report.creativeHash=actualHash;report.rendererSourceHash=rendererSourceHash();
  const surface=await render.evaluate(()=>window.__VIDEO_RENDERER__!.getRenderSurface!());report.surface=surface;
  if(surface.width!==1080||surface.height!==1920||JSON.stringify(surface.drawingBuffer)!=='[1080,1920]')throw new Error('Native surface FAIL');
  let cursor=0;const shots=short01Shots.map(s=>{const start=cursor;cursor+=s.duration;return {...s,start,end:cursor};});
  const stills:unknown[]=[];report.stills=stills;
  for(const [index,s] of shots.entries()){
   const time=(s.start+s.end)/2;await render.evaluate(t=>window.__VIDEO_RENDERER__!.renderFrame(t),time);
   const filename=`${String(index+1).padStart(2,'0')}-${s.id}.png`;await render.screenshot({path:path.join(out,'stills',filename),animations:'disabled'});
   const bbox=await render.locator('.video-overlay').boundingBox();
   if(!bbox||bbox.x<.06*1080||bbox.x+bbox.width>.9*1080||bbox.y<.08*1920||bbox.y+bbox.height>.8*1920)throw new Error(`Caption safearea FAIL ${s.id}`);
   const camera=await render.evaluate(()=>window.__VIDEO_RENDERER__!.getCameraState!());const preset=short01Video.cameraPresets[s.camera];if(camera.position.some((n:number,i:number)=>Math.abs(n-preset.position[i])>1e-5)||Math.abs(camera.fov-(preset.fov??35))>1e-6)throw new Error(`Camera preset clamped/drifted ${s.id}`);stills.push({filename,time,caption:s.caption,captionBounds:bbox,camera});
  }
  report.captionSafeArea='PASS';
  const times=[0,8,25,34,41,48,57.5];const deterministic:unknown[]=[];report.deterministic=deterministic;
  for(const t of times){await render.evaluate(t=>window.__VIDEO_RENDERER__!.renderFrame(t),t);const first=await render.screenshot({animations:'disabled'});await render.evaluate(t=>window.__VIDEO_RENDERER__!.renderFrame(t),58-t);await render.evaluate(t=>window.__VIDEO_RENDERER__!.renderFrame(t),t);const again=await render.screenshot({animations:'disabled'});if(!first.equals(again))throw new Error(`Repeated/backward seek pixel identity FAIL ${t}`);deterministic.push({time:t,sha256:hash(first)});}
  for(const index of [4,5,9,10]){const s=shots[index];for(const [label,t]of [['start',s.start],['end',s.end-1/30]] as const){await render.evaluate(t=>window.__VIDEO_RENDERER__!.renderFrame(t),t);await render.screenshot({path:path.join(out,'stills',`framing-${s.id}-${label}.png`),animations:'disabled'});}}
  await render.close();await checkpoint('native-stills-and-determinism-PASS');
  }
  if(process.env.SHORT_QA_NATIVE_ONLY==='1'){report.status='PASS';return;}
  const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
  await page.goto(`${origin}/?product=${productId}`,{waitUntil:'domcontentloaded'});
  page.setDefaultTimeout(90000);const long=page.getByRole('button',{name:'Long Video',exact:true}),short=page.getByRole('button',{name:'Short Video',exact:true});
  await short.waitFor({timeout:90000});await page.waitForFunction(()=>{const b=document.querySelector<HTMLButtonElement>('.export-action');return b&&!b.disabled;},undefined,{timeout:90000});if(await long.getAttribute('aria-pressed')!=='true')throw new Error('Long default FAIL');
  await page.getByRole('button',{name:'Play',exact:true}).click({timeout:90000});await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('slider',{name:'Video timeline'}).fill('467');if(! (await page.locator('.timecode').innerText()).includes('07:47'))throw new Error('Long scrub FAIL');report.longPlayScrub='PASS';await checkpoint('long-play-scrub-PASS');await page.getByRole('button',{name:'Export video',exact:true}).click({timeout:90000});await page.locator('.export-ready').waitFor();if(!(await page.locator('.export-ready').innerText()).includes('08:44'))throw new Error('Long duration FAIL');
  await page.getByRole('button',{name:'Close export dialog'}).click();await short.click();await page.waitForFunction(()=>{const sliders=document.querySelectorAll<HTMLInputElement>('input[aria-label="Video timeline"]');return sliders.length===1&&sliders[0].max==='58';},undefined,{timeout:90000});if(Number(await page.getByRole('slider',{name:'Video timeline'}).getAttribute('max'))!==58)throw new Error('Short scrub bound FAIL');if(Number(await page.getByRole('slider',{name:'Video timeline'}).inputValue())>58)throw new Error('Long timestamp leaked');
  await page.getByRole('button',{name:'Export video',exact:true}).click({timeout:90000});await page.waitForFunction(()=>document.querySelector('[role=dialog]')?.getAttribute('aria-busy')==='false',undefined,{timeout:90000});await page.locator('.export-ready, .export-progress').waitFor({timeout:30000});if(await page.locator('.export-progress').count())await page.getByRole('button',{name:'New generation',exact:true}).click();await page.locator('.export-ready').waitFor({timeout:30000});if(!(await page.locator('.export-ready').innerText()).includes('1,740'))throw new Error('Short ready counts FAIL');
  await page.screenshot({path:path.join(out,'ui-short-ready.png')});
  await checkpoint('short-ready-PASS');const [response]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/api/export')&&r.request().method()==='POST',{timeout:120000}),page.getByRole('button',{name:'Generate File',exact:true}).click()]);const job=await response.json();report.smokeInitial=job;await checkpoint('short-job-created');
  if(job.videoId!==videoId||job.totalFrames!==6||job.width!==1080||job.height!==1920){await api(`/api/export/${job.id}`,{action:'cancel'});throw new Error('Smoke server must limit to6 native frames');}
  await wait(job.id,j=>(j.validFrames??0)>=1);const cancelled=await api(`/api/export/${job.id}`,{action:'cancel'});const preserved=await readFile(path.join(job.frameDirectory,'frame-000000.png'));report.cancelled=cancelled;await checkpoint('short-cancelled-with-frame');
  await page.getByRole('button',{name:'Continue in background',exact:true}).click().catch(async()=>{await page.getByRole('button',{name:'Close export dialog'}).click();});
  await long.click();await page.getByRole('button',{name:'Export video',exact:true}).click({timeout:90000});await page.locator('.export-ready').waitFor();if(await page.locator('.export-progress').count())throw new Error('Short job leaked intoLong UI');await page.getByRole('button',{name:'Close export dialog'}).click();
  await short.click();await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Export video',exact:true}).click({timeout:90000});await page.getByRole('button',{name:'Resume generation',exact:true}).waitFor({timeout:60000});
  await page.getByRole('button',{name:'Resume generation',exact:true}).click();const completed=await wait(job.id,j=>j.status==='completed');if(!preserved.equals(await readFile(path.join(job.frameDirectory,'frame-000000.png'))))throw new Error('Resume overwroteframezero');
  await page.getByRole('link',{name:'Download MP4',exact:true}).waitFor();report.smokeCompleted=completed;report.refreshShort='PASS';report.switchJobIsolation='PASS';report.cancelResume='PASS';await checkpoint('short-resume-PASS');
  await page.screenshot({path:path.join(out,'ui-short-completed.png')});
  await page.goto(`${origin}/?product=demo-cabinet`,{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Short Video',exact:true}).waitFor();if(!await page.getByRole('button',{name:'Short Video',exact:true}).isDisabled())throw new Error('Demo fakeShort');await page.getByRole('button',{name:'Export video',exact:true}).click({timeout:90000});await page.locator('.export-ready').waitFor();report.noShortProduct='PASS';
  report.longDefaultDurationProfile='PASS';
  await page.close();
  const independent=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  await independent.goto(`${origin}/render?project=${productId}&video=${videoId}&profile=vertical-1080p&fps=30`,{waitUntil:'domcontentloaded'});
  await independent.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready===true,undefined,{timeout:90000});
  for(const index of [1,2]){await independent.evaluate(t=>window.__VIDEO_RENDERER__!.renderFrame(t),index/30);const fresh=await independent.screenshot({animations:'disabled'});if(!fresh.equals(await readFile(path.join(job.frameDirectory,`frame-${String(index).padStart(6,'0')}.png`))))throw new Error('Independent chunk boundary pixel identity FAIL');}
  report.independentChunkBoundary='PASS';report.status='PASS';
 }catch(e){report.status='FAIL';report.error=String(e);throw e;}finally{await writeFile(path.join(out,process.env.SHORT_QA_NATIVE_ONLY==='1'?'native-preflight.json':'browser-smoke.json'),JSON.stringify(report,null,2));await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
