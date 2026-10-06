/** Generic visual seek/reset verification; no product IDs or automatic refit. */
import {chromium} from 'playwright';
import {createHash} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {getProductPackage,defaultProductId} from '../src/products/registry';
async function main(){
  const entry=getProductPackage(process.env.PROJECT_ID??defaultProductId),dir=path.resolve(process.env.REVIEW_DIR??path.join('output',entry.productKey,'reviews',entry.reviewDirectory??entry.id));
  const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}}),errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${process.env.RENDER_URL??'http://localhost:3000'}/render?project=${encodeURIComponent(entry.id)}`,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready,{},{timeout:90000});
    const checks=(entry.checkpoints??[]).filter(c=>process.env.VERIFY_ALL_CHECKPOINTS==='1'||/front-context|finished-closed|finished-opening|finished-open-bare|mattress-fit|final-hero|underside-support/.test(c.name));
    const capture=async(time:number)=>{
      await page.evaluate(async t=>{await window.__VIDEO_RENDERER__!.renderFrame(t);await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));},time);
      const buffer=await page.screenshot({animations:'disabled'});
      return {sha256:createHash('sha256').update(buffer).digest('hex'),camera:await page.evaluate(()=>window.__VIDEO_RENDERER__!.getCameraState?.())};
    };
    const baseline=new Map<string,Awaited<ReturnType<typeof capture>>>();
    for(const c of checks)baseline.set(c.name,await capture(c.time));
    const result=[];
    for(const c of [...checks].reverse()){
      const repeat=await capture(c.time),first=baseline.get(c.name)!;
      // Optional presentation-only camera comparison: OrbitControls can leave
      // 1e-14 roundoff after a different cut. Keep exact PNG comparison and
      // retain raw camera values; never change mechanical gate tolerances.
      const numbers=(camera:typeof first.camera)=>camera?[...camera.position,...camera.direction,...camera.target,camera.fov]:[];
      const a=numbers(first.camera),b=numbers(repeat.camera);
      const maxCameraDelta=a.length===b.length?Math.max(0,...a.map((n,i)=>Math.abs(n-b[i]))):Infinity;
      const cameraTolerance=Number(process.env.PRESENTATION_CAMERA_EPSILON??0);
      const sameCamera=cameraTolerance>0?maxCameraDelta<=cameraTolerance:JSON.stringify(first.camera)===JSON.stringify(repeat.camera);
      result.push({name:c.name,time:c.time,identical:first.sha256===repeat.sha256&&sameCamera,pngIdentical:first.sha256===repeat.sha256,maxCameraDelta,cameraTolerance,first,repeat});
    }
    const report={candidate:entry.id,errors,valid:!errors.length&&result.every(r=>r.identical),checks:result};
    await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'presentation-seek-verification.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({valid:report.valid,errors,checks:result.map(r=>({name:r.name,identical:r.identical}))}));if(!report.valid)process.exitCode=1;
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
