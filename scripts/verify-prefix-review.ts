/** Focused presentation-prefix QA. Does not render a full movie or refit views. */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {getProductPackage} from '../src/products/registry';
async function main(){
  const entry=getProductPackage(process.env.PROJECT_ID!),baseline=getProductPackage(process.env.BASELINE_ID!);
  if(!entry.video.intro)throw new Error('Requested package has no presentation prefix');
  const prefix=entry.video.intro.duration;
  const dir=path.resolve(process.env.REVIEW_DIR??path.join('output',entry.productKey,'reviews',entry.reviewDirectory!));
  const stills=path.join(dir,'stills');await mkdir(stills,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1}),errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    const open=async(id:string)=>{await page.goto(`${process.env.RENDER_URL??'http://localhost:3000'}/render?project=${encodeURIComponent(id)}`,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready,{},{timeout:90000});};
    const capture=async(time:number,file?:string)=>{
      await page.evaluate(t=>window.__VIDEO_RENDERER__!.renderFrame(t),time);
      const buffer=await page.screenshot({path:file,animations:'disabled'});
      return {sha256:createHash('sha256').update(buffer).digest('hex'),camera:await page.evaluate(()=>window.__VIDEO_RENDERER__!.getCameraState?.())};
    };
    await open(baseline.id);
    const expectedStep1=await capture(0,path.join(stills,'baseline-step1-zero.png'));
    const active=entry.checkpoints!.find(c=>c.name.includes('active-connection'))!;
    const beforeTime=active.time-prefix;
    const before=await capture(beforeTime,path.join(stills,'07-before-occluded-step26.png'));
    await open(entry.id);
    const manifest=[];const expected=new Map<string,Awaited<ReturnType<typeof capture>>>();
    for(const c of entry.checkpoints??[]){const rendered=await capture(c.time,path.join(stills,c.name));expected.set(c.name,rendered);manifest.push({...c,...rendered});console.log('QA',c.name,c.time);}
    const replay=[];
    for(const c of [...entry.checkpoints!].reverse()){
      const again=await capture(c.time),first=expected.get(c.name)!;
      replay.push({name:c.name,time:c.time,pngIdentical:again.sha256===first.sha256,first,again});
    }
    const actualStep1=expected.get('06-step1-reset.png')!;
    const reset={pngIdentical:actualStep1.sha256===expectedStep1.sha256,approved:expectedStep1,afterIntro:actualStep1};
    const report={candidate:entry.id,baseline:baseline.id,errors,valid:!errors.length&&reset.pngIdentical&&replay.every(r=>r.pngIdentical),introDuration:prefix,
      step1Reset:reset,step26Before:{time:beforeTime,...before},replay,checkpoints:manifest};
    await writeFile(path.join(dir,'browser-qa.json'),JSON.stringify(report,null,2));
    await writeFile(path.join(stills,'render-manifest.json'),JSON.stringify({candidate:entry.id,width:1280,height:720,errors,checkpoints:manifest},null,2));
    console.log(JSON.stringify({valid:report.valid,errors,step1ResetIdentical:reset.pngIdentical,replay:replay.map(r=>({name:r.name,identical:r.pngIdentical}))}));
    if(!report.valid)process.exitCode=1;
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
