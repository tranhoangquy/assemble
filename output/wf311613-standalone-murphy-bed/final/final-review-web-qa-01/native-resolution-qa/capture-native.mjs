// OUTPUT-ONLY QA: run AFTER root authorizes and profile infrastructure is built.
// node --import tsx <this-script>; RENDER_URL points at the PRODUCTION app.
// RUN_SHORT_PROOFS=1 also captures/encodes 60 FRESH frames per profile.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {canonical,loadNativeQaSpecification} from './native-checkpoints.mjs';
import {classifyNetwork,probeImplicitFavicon} from '../network-classification.mjs';

const dir=path.dirname(fileURLToPath(import.meta.url));
const baseUrl=process.env.RENDER_URL??'http://localhost:3016';
const withProofs=process.env.RUN_SHORT_PROOFS==='1';
const hash=data=>createHash('sha256').update(data).digest('hex');
const spec=await loadNativeQaSpecification();
const {getRenderProfile}=await import(pathToFileURL(path.resolve('src/engine/export/RenderProfiles.ts')).href);
for(const expected of spec.profiles){
  const actual=getRenderProfile(expected.id);
  if(!actual||actual.width!==expected.width||actual.height!==expected.height||actual.fps!==expected.fps)throw Error('Authoritative profile differs from requirement: '+expected.id);
}
const manifestFile=path.join(dir,'native-capture-manifest.json');
try{await fs.access(manifestFile);throw Error('Refusing to overwrite native QA history');}catch(e){if(e.code!=='ENOENT')throw e;}
const manifest={candidate:spec.candidateId,renderUrl:baseUrl,spec,profileRegistry:'src/engine/export/RenderProfiles.ts',withProofs,profiles:[],complete:false,startedAt:new Date().toISOString()};
await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2),{flag:'wx'});

async function dimensions(file){
  const b=await fs.readFile(file);
  if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not PNG: '+file);
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20),bytes:b.length,sha256:hash(b)};
}

async function captureState(page,time) {
  await page.evaluate(t=>window.__VIDEO_RENDERER__.renderFrame(t),time);
  return page.evaluate(()=>{
    const api=window.__VIDEO_RENDERER__;
    if(typeof api.getSceneState!=='function')throw Error('Missing generic read-only getSceneState; cannot prove scene equality by images alone');
    const canvas=document.querySelector('canvas');
    if(!canvas)throw Error('No actual renderer canvas');
    const gl=canvas.getContext('webgl2')??canvas.getContext('webgl');
    if(!gl)throw Error('No actual native WebGL drawing buffer');
    const r=canvas.getBoundingClientRect();
    const caption=document.querySelector('.video-overlay');
    const metrics=caption?[caption,...caption.querySelectorAll('span,h2,p,li,strong,small,i')].map(el=>{
      const b=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {tag:el.tagName,className:el.className,text:el.textContent,x:b.x/innerWidth,y:b.y/innerHeight,width:b.width/innerWidth,height:b.height/innerHeight,fontSize:parseFloat(s.fontSize)/innerHeight,lineHeight:s.lineHeight==='normal'?'normal':parseFloat(s.lineHeight)/innerHeight,padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft].map(v=>parseFloat(v)/innerHeight),borderWidth:[s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth].map(v=>parseFloat(v)/innerHeight),opacity:s.opacity,transform:s.transform};
    }):[];
    return {sceneState:api.getSceneState(),camera:api.getCameraState(),duration:api.getDuration(),surface:{deviceScaleFactor:devicePixelRatio,viewport:[innerWidth,innerHeight],canvas:[canvas.width,canvas.height],canvasCss:[r.width,r.height],drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),maxRenderbufferSize:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)},captions:metrics};
  });
}

try {
  // Explicitly sequential: only one profile browser/capture/encode exists.
  for(const expected of spec.profiles){
    const profile=getRenderProfile(expected.id);
    const profileDir=path.join(dir,profile.id);
    await fs.mkdir(profileDir,{recursive:false});
    const stillsDir=path.join(profileDir,'stills');await fs.mkdir(stillsDir);
    const report={profile,startedAt:new Date().toISOString(),checkpoints:[],proof:null,pageErrors:[],consoleErrors:[],consoleRecords:[],warnings:[],responses:[],failedRequests:[],httpFailures:[],networkAudit:null};
    const project=`${spec.candidateId}:${profile.id}`;
    const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
    try {
      const page=await browser.newPage({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:1});
      page.on('pageerror',e=>report.pageErrors.push(e.message));
      page.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push(m.text());report.consoleRecords.push({text:m.text(),location:m.location(),project});}if(m.type()==='warning')report.warnings.push(m.text());});
      page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),method:r.method(),resourceType:r.resourceType(),failure:r.failure(),project}));
      page.on('response',r=>{const request=r.request(),record={url:r.url(),status:r.status(),method:request.method(),resourceType:request.resourceType(),project};report.responses.push(record);if(r.status()>=400)report.httpFailures.push(record);});
      const url=`${baseUrl}/render?project=${encodeURIComponent(spec.candidateId)}&profile=${encodeURIComponent(profile.id)}`;
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
      await page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready===true,{}, {timeout:90000});
      for(const point of spec.checkpoints){
        const observed=await captureState(page,point.time);
        const file=path.join(stillsDir,point.label+'.png');
        await page.screenshot({path:file,animations:'disabled',timeout:0});
        const png=await dimensions(file);
        for(const key of ['viewport','canvas','canvasCss','drawingBuffer'])if(observed.surface[key][0]!==profile.width||observed.surface[key][1]!==profile.height)throw Error(`${profile.id} ${point.label}: non-native ${key} ${observed.surface[key]}`);
        if(observed.surface.deviceScaleFactor!==1||png.width!==profile.width||png.height!==profile.height)throw Error('Non-native screenshot/DSF');
        if(Math.abs(observed.duration-spec.duration)>1e-9)throw Error('Deterministic timeline changed');
        if(!observed.sceneState||typeof observed.sceneState!=='object')throw Error('Actual diagnostic scene state is missing');
        const stateFile=path.join(profileDir,point.label+'-state.json');
        await fs.writeFile(stateFile,JSON.stringify(observed,null,2),{flag:'wx'});
        report.checkpoints.push({...point,file,png,stateFile,stateSha256:hash(canonical(observed.sceneState)),cameraSha256:hash(canonical(observed.camera)),surface:observed.surface,captions:observed.captions});
        console.log(`Native ${profile.id} ${point.label}: ${png.width}x${png.height} t=${point.time.toFixed(9)}`);
      }
      // Revisit intro/reset/final/mechanism in this same loaded browser. This
      // compares actual full scene snapshots, not a separately modeled state.
      report.resetExcursions=[];
      for(const index of [11,1,2,8,0,2]){
        const point=spec.checkpoints[index],again=await captureState(page,point.time),first=report.checkpoints[index];
        const stateEqual=hash(canonical(again.sceneState))===first.stateSha256,cameraEqual=hash(canonical(again.camera))===first.cameraSha256;
        report.resetExcursions.push({label:point.label,time:point.time,stateEqual,cameraEqual});
        if(!stateEqual||!cameraEqual)throw Error(`Seek/reset state changed at ${profile.id}/${point.label}`);
      }
      if(withProofs){
        const frames=path.join(profileDir,'proof-frames');await fs.mkdir(frames);
        const proof={...spec.proof,profileId:profile.id,frames,output:path.join(profileDir,`${spec.candidateId}-native-proof-${profile.id}.mp4`),captureMethod:'Actual current renderFrame API; fresh native viewport/drawing buffer; DSF=1; no historical frame use; no scaling filters',nativeFrames:[],rendererExitedNormally:false};
        for(let frame=0;frame<proof.frameCount;frame++){
          const time=proof.start+frame/profile.fps;
          await page.evaluate(t=>window.__VIDEO_RENDERER__.renderFrame(t),time);
          const file=path.join(frames,`frame-${String(frame).padStart(6,'0')}.png`);
          await page.screenshot({path:file,animations:'disabled',timeout:0});
          const png=await dimensions(file);
          if(png.width!==profile.width||png.height!==profile.height)throw Error('Proof frame not native');
          proof.nativeFrames.push({frame,time,file,...png});
        }
        report.proof=proof;
      }
    } finally {
      await browser.close();
      // Keep ALL raw errors/responses. Only a same-origin GET /favicon.ico 404
      // paired with the EXACT generic console 404 may be noncritical. Missing
      // textures, unrelated 404s, unpaired console errors and failed requests
      // remain fatal, exactly as in the parent whole-scene verifier.
      const probe=await probeImplicitFavicon(report.responses,report.consoleRecords,baseUrl);
      report.faviconConfirmations=probe.confirmations;
      report.networkAudit=classifyNetwork(probe.responses,report.failedRequests,report.consoleRecords,baseUrl);
      for(const known of report.networkAudit.knownNoncriticalConsole)report.warnings.push(`${known.classification}: ${known.response.url}`);
      await fs.writeFile(path.join(profileDir,'network-audit.json'),JSON.stringify({pageErrors:report.pageErrors,consoleErrors:report.consoleErrors,consoleRecords:report.consoleRecords,httpFailures:report.httpFailures,networkAudit:report.networkAudit},null,2),{flag:'wx'});
    }
    if(report.pageErrors.length||!report.networkAudit.valid)throw Error('Actual production renderer reported fatal errors: '+JSON.stringify(report));
    if(report.proof){
      report.proof.rendererExitedNormally=true;
      const args=['-hide_banner','-nostdin','-v','warning','-n','-framerate',String(profile.fps),'-start_number','0','-i',path.join(report.proof.frames,'frame-%06d.png'),'-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','-r',String(profile.fps),report.proof.output];
      report.proof.encoderArgs=args;
      execFileSync('ffmpeg',args,{stdio:'pipe',maxBuffer:8*1024*1024});
    }
    report.finishedAt=new Date().toISOString();
    await fs.writeFile(path.join(profileDir,'manifest.json'),JSON.stringify(report,null,2),{flag:'wx'});
    manifest.profiles.push({profileId:profile.id,manifest:path.join(profileDir,'manifest.json'),finishedAt:report.finishedAt});
    await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2));
  }
  manifest.complete=true;manifest.finishedAt=new Date().toISOString();
  await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2));
  console.log('All native captures complete. Run verify-native.mjs; inspect comparison sheets.');
} catch(error){
  manifest.failure={message:error.message,stack:error.stack,at:new Date().toISOString()};
  await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2));
  throw error;
}
