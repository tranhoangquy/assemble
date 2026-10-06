/** Small, explicit API/browser smoke; requires a server started with EXPORT_FRAME_LIMIT<=6.
 * Usage: node --import tsx scripts/verify-resumable-export.ts --origin http://127.0.0.1:3027 --product <existing-id>
 * No product/master edits and never a full export. Optional --high-res adds four native 2160p frames.
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { ExportJobView } from '../src/types/export';
const option=(name:string)=>{const index=process.argv.indexOf(name);if(index<0||!process.argv[index+1])throw new Error(`Required ${name}`);return process.argv[index+1];};
const origin=option('--origin'),productId=option('--product');
const output=path.resolve('output','export-infrastructure-qa',new Date().toISOString().replace(/[:.]/g,'-'));
const delay=()=>new Promise(resolve=>setTimeout(resolve,100));
async function json<T>(url:string,body?:unknown):Promise<T>{
  const response=await fetch(origin+url,body===undefined?{cache:'no-store'}:{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const value=await response.json();if(!response.ok)throw new Error(JSON.stringify(value));return value as T;
}
async function create(profileId:string):Promise<ExportJobView>{
  const response=await fetch(origin+'/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId,profileId,fps:30})});
  const job=await response.json() as ExportJobView;if(!response.ok)throw new Error(JSON.stringify(job));
  if(!job.frameLimit||job.totalFrames>6){await json(`/api/export/${job.id}`,{action:'cancel'});throw new Error('Smoke server must use explicit EXPORT_FRAME_LIMIT<=6; job cancelled.');}
  return job;
}
async function wait(job:ExportJobView,condition:(j:ExportJobView)=>boolean):Promise<ExportJobView>{
  const deadline=Date.now()+180_000;
  while(Date.now()<deadline){const next=await json<ExportJobView>(`/api/export/${job.id}`);if(condition(next))return next;if(['error','stale','waiting_for_resume'].includes(next.status))throw new Error(JSON.stringify(next));await delay();}
  await json(`/api/export/${job.id}`,{action:'cancel'});throw new Error('Small smoke timed out; checkpoint retained.');
}
async function main(){
  await mkdir(output,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
  const report:Record<string,unknown>={productId,origin,fullRender:'NOT RUN',highResolution:'NOT RUN'};
  try{
    const job=await create('720p');
    const partial=await wait(job,j=>(j.validFrames??0)>=1);
    await json(`/api/export/${job.id}`,{action:'cancel'});
    const cancelled=await wait(job,j=>j.status==='cancelled');
    if(!cancelled.canResume||(cancelled.validFrames??0)<1)throw new Error('Cancel failed to preserve resumable work.');
    const before=await readFile(path.join(job.frameDirectory,'frame-000000.png'));
    await page.goto(origin+`/?product=${encodeURIComponent(productId)}`,{waitUntil:'domcontentloaded',timeout:60_000});
    await page.getByRole('button',{name:'Export video',exact:true}).click({timeout:90_000});
    await page.locator('input[data-profile-id="720p"]').check();
    await page.getByRole('button',{name:'Resume generation',exact:true}).waitFor({timeout:30_000});
    await page.screenshot({path:path.join(output,'01-resumable-ui.png')});
    await page.getByRole('button',{name:'Resume generation',exact:true}).click();
    const completed=await wait(job,j=>j.status==='completed');
    if(!before.equals(await readFile(path.join(job.frameDirectory,'frame-000000.png'))))throw new Error('Resume overwrote verified frame zero.');
    await page.getByRole('link',{name:'Download MP4',exact:true}).waitFor({timeout:30_000});
    await page.screenshot({path:path.join(output,'02-completed-ui.png')});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Export video',exact:true}).click({timeout:90_000});
    await page.getByRole('link',{name:'Download MP4',exact:true}).waitFor({timeout:30_000});
    report.refreshRehydration='PASS';
    // Compare the first frame after a chunk boundary against an independent seek in a fresh browser page.
    const independent=await browser.newPage({viewport:{width:job.width,height:job.height},deviceScaleFactor:1});
    await independent.goto(origin+`/render?project=${encodeURIComponent(productId)}&profile=720p&fps=30`,{waitUntil:'domcontentloaded',timeout:60_000});
    await independent.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready===true,undefined,{timeout:90_000});
    const boundary=job.chunkSize??300;
    if(boundary<job.totalFrames){
      const hashes:Record<string,string>={};
      for(const index of [boundary-1,boundary]){
        await independent.evaluate(time=>window.__VIDEO_RENDERER__!.renderFrame(time),index/job.fps);
        const actual=await independent.screenshot({type:'png',animations:'disabled'});
        const cached=await readFile(path.join(job.frameDirectory,`frame-${String(index).padStart(6,'0')}.png`));
        if(!actual.equals(cached))throw new Error(`Chunk boundary frame ${index} differs from independently rendered frame.`);
        hashes[String(index)]=createHash('sha256').update(cached).digest('hex');
      }
      report.chunkBoundaryIndependentSha256=hashes;
    }else throw new Error('Smoke server must use chunk size below frame limit.');
    await independent.close();
    const download=await fetch(origin+completed.downloadUrl!);if(!download.ok)throw new Error('Final download failed.');await download.body?.cancel();
    report.native720p={status:'PASS',partial,cancelled,completed,cancelPreservesFrameZero:true,independentChunkBoundary:'PASS',finalDownload:'PASS'};
    if(process.argv.includes('--high-res')){
      const high=await create('2160p');const finished=await wait(high,j=>j.status==='completed');
      if(finished.width!==3840||finished.height!==2160)throw new Error('High-resolution output was not native.');
      report.highResolution={status:'PASS',job:finished,limitedFrames:finished.totalFrames};
    }
    await writeFile(path.join(output,'smoke-report.json'),JSON.stringify(report,null,2));console.log(output);
  }catch(error){report.status='FAIL';report.error=(error as Error).message;await page.screenshot({path:path.join(output,'failure-ui.png')}).catch(()=>undefined);await writeFile(path.join(output,'smoke-report.json'),JSON.stringify(report,null,2));throw error;}
  finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
