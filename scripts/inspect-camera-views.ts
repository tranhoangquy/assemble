/** Read-only camera trials: explicit QA override, never an exported preset. */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import type {CameraPreset} from '../src/types/video';
async function main(){
  const views=JSON.parse(process.env.CAMERA_VIEWS!) as Array<CameraPreset&{id:string}>;
  const directory=path.resolve(process.env.REVIEW_DIR!);await mkdir(directory,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
    await page.goto(`${process.env.RENDER_URL}/render?project=${process.env.PROJECT_ID}`,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready,{},{timeout:90000});
    const results=[];
    for(const view of views)for(const t of JSON.parse(process.env.REVIEW_TIMES!) as number[]){
      await page.evaluate(({t,view})=>window.__VIDEO_RENDERER__!.renderFrame(t,view),{t,view});
      await page.screenshot({path:path.join(directory,`${view.id}-${t}.png`),animations:'disabled'});
      results.push({view,time:t,camera:await page.evaluate(()=>window.__VIDEO_RENDERER__!.getCameraState?.())});
    }
    await writeFile(path.join(directory,'trials.json'),JSON.stringify(results,null,2));
    console.log('Camera trials complete',results.length);
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
