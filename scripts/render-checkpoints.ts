import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { defaultProductId, getProductPackage } from '../src/products/registry';
import { resolveCliRenderProfile } from '../src/engine/export/RenderProfiles';
import { createRenderIdentity, hashVideoDefinition, renderIdentityHash } from '../src/engine/export/RenderIdentity';
import { assertNativePng, assertNativeSurface, inspectNativeSurface } from '../src/engine/export/NativeSurface';

async function main() {
  const entry = getProductPackage(process.env.PROJECT_ID ?? process.env.PRODUCT_ID ?? defaultProductId);
  const selected = resolveCliRenderProfile({profileId:process.env.OUTPUT_PROFILE,width:process.env.OUTPUT_WIDTH,height:process.env.OUTPUT_HEIGHT,fps:process.env.OUTPUT_FPS});
  const identity = createRenderIdentity(entry.id,entry.video.id,hashVideoDefinition(entry.video),selected);
  const directory = path.resolve(process.env.SCREENSHOTS_DIR ?? path.join('output',entry.productKey,'screenshots',entry.id,selected.id));
  await mkdir(directory,{recursive:true});
  const browser = await chromium.launch({headless:true,executablePath:chromium.executablePath()});
  try {
    const page = await browser.newPage({viewport:{width:selected.width,height:selected.height},deviceScaleFactor:1});
    const errors: string[] = [];
    const rendered:unknown[]=[];
    page.on('pageerror',error=>errors.push(error.message));
    const renderUrl=new URL('/render',process.env.RENDER_URL??'http://localhost:3000');
    renderUrl.searchParams.set('project',entry.id);
    if(selected.kind!=='custom-cli'&&selected.supportedFps.includes(selected.fps))renderUrl.searchParams.set('profile',selected.id);
    renderUrl.searchParams.set('fps',String(selected.fps));
    await page.goto(renderUrl.toString(),{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready===true,{},{timeout:90000});
    const nativeSurface=await page.evaluate(inspectNativeSurface);
    assertNativeSurface(nativeSurface,selected);
    for(const checkpoint of (entry.checkpoints ?? []).filter(check=>!process.env.CHECKPOINT_PREFIX||check.name.startsWith(process.env.CHECKPOINT_PREFIX))) {
      await page.evaluate(check=>window.__VIDEO_RENDERER__!.renderFrame(check.time,check.camera),checkpoint);
      const destination=path.join(directory,checkpoint.name);
      try{await stat(destination);throw new Error(`Checkpoint already exists; choose a fresh SCREENSHOTS_DIR: ${destination}`);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
      const png=await page.screenshot({path:destination,type:'png',animations:'disabled'});
      assertNativePng(png,selected);
      const camera=await page.evaluate(()=>window.__VIDEO_RENDERER__!.getCameraState?.());
      rendered.push({...checkpoint,camera});
      console.log(checkpoint.name,checkpoint.time);
    }
    if(errors.length)throw new Error(errors.join('\n'));
    await writeFile(path.join(directory,'render-manifest.json'),JSON.stringify({project:entry.id,profile:selected,identity,identityHash:renderIdentityHash(identity),nativeSurface,errors,checkpoints:rendered},null,2),{flag:'wx'});
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
