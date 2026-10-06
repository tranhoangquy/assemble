import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {assertNativePng,assertNativeSurface,inspectNativeSurface} from '../../../../src/engine/export/NativeSurface.ts';
import {getRenderProfile} from '../../../../src/engine/export/RenderProfiles.ts';
const out=path.resolve('output/wf311613-standalone-murphy-bed/final/product-fit-hole-audit'),origin=process.env.QA_ORIGIN??'http://127.0.0.1:3019';
const frames=path.join(out,'targeted-frames');await fs.mkdir(frames,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
const profile=getRenderProfile('720p'),report={profile,origin,start:460,end:517.3,fps:30,audio:false,stills:[],pageErrors:[]};
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>report.pageErrors.push(e.message));
 await page.goto(`${origin}/render?project=wf311613-final-micro-pass&profile=720p`,{waitUntil:'domcontentloaded',timeout:90000});const start=Date.now();
 await page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready===true,{}, {timeout:90000});report.readinessMs=Date.now()-start;
 const surface=await page.evaluate(inspectNativeSurface);assertNativeSurface(surface,profile);report.surface=surface;
 const checkpoints=[['AFTER-467',467],['CLOSE-UP-467',467,{position:[-165,228,-25],target:[-118,217,0],fov:35}],['WIDER-CONTEXT-467',467,{position:[-310,255,-230],target:[0,125,0],fov:42}],['CLOSED-ENDPOINT',509.5],['OPEN-ENDPOINT',516.5],['FINAL-ASSEMBLED',503]];
 for(const [name,time,camera]of checkpoints){await page.evaluate(({time,camera})=>window.__VIDEO_RENDERER__.renderFrame(time,camera),{time,camera});const png=await page.screenshot({path:path.join(out,name+'.png'),timeout:0});assertNativePng(png,profile);await fs.writeFile(path.join(out,name+'-state.json'),JSON.stringify(await page.evaluate(()=>window.__VIDEO_RENDERER__.getSceneState()),null,2));report.stills.push({name,time,camera:camera??'frozen playback camera'});console.log('still',name,time);}
 const count=Math.ceil((report.end-report.start)*30);report.frames=count;
 for(let i=0;i<count;i++){const time=report.start+i/30;await page.evaluate(t=>window.__VIDEO_RENDERER__.renderFrame(t),time);const png=await page.screenshot({path:path.join(frames,`frame-${String(i).padStart(6,'0')}.png`),timeout:0});assertNativePng(png,profile);if(i%90===0)console.log('FRAME',i,'/',count,'global',time);}
 const mp4=path.join(out,'wf311613-late-fit-hole-QA-720p.mp4');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','30','-i',path.join(frames,'frame-%06d.png'),'-an','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',mp4]);report.mp4=mp4;
 report.ffprobe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',mp4],{encoding:'utf8'}));execFileSync('ffmpeg',['-v','error','-i',mp4,'-f','null','-']);report.completeDecode='PASS';report.valid=report.pageErrors.length===0;console.log('COMPLETE',mp4);
} catch(e){report.valid=false;report.error=String(e);throw e;}finally{await fs.writeFile(path.join(out,'targeted-qa-report.json'),JSON.stringify(report,null,2));await browser.close();}
