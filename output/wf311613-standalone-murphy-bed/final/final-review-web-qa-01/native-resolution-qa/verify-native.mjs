// OUTPUT-ONLY verifier/comparison-sheet builder. No source edits or rendering.
// Run AFTER capture-native.mjs. Pictures are downscaled only for comparison
// sheets; native source PNGs and native proof frames remain untouched.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {canonical,loadNativeQaSpecification} from './native-checkpoints.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),spec=await loadNativeQaSpecification();
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const reportFile=path.join(dir,'native-verification.json');
try{await fs.access(reportFile);throw Error('Refusing to overwrite native verification history');}catch(e){if(e.code!=='ENOENT')throw e;}
const capture=await read(path.join(dir,'native-capture-manifest.json'));
if(!capture.complete||capture.failure)throw Error('Native capture was incomplete/failed');
const errors=[],warnings=[],profiles=[];
const manifests=new Map();
for(const p of spec.profiles){
  const m=await read(path.join(dir,p.id,'manifest.json'));manifests.set(p.id,m);
  if(m.profile.id!==p.id||m.profile.width!==p.width||m.profile.height!==p.height||m.profile.fps!==p.fps)errors.push('Profile identity '+p.id);
  if(m.checkpoints.length!==12)errors.push('Required 12 checkpoints missing '+p.id);
  if(m.pageErrors.length||(m.networkAudit ? !m.networkAudit.valid : m.consoleErrors.length||m.failedRequests.length||m.httpFailures.length))errors.push('Actual fatal browser/resource errors '+p.id);
  if(m.networkAudit?.knownNoncriticalConsole?.length)warnings.push({profile:p.id,message:'Observed optional favicon 404 only; retained in raw browser/network evidence.',networkAudit:m.networkAudit});
  const checked=[];
  for(const point of spec.checkpoints){
    const c=m.checkpoints.find(c=>c.label===point.label);
    if(!c){errors.push(`Missing ${p.id}/${point.label}`);continue;}
    const file=await fs.readFile(c.file),png=await sharp(file).metadata();
    if(png.width!==p.width||png.height!==p.height||!file.length)errors.push(`Wrong/empty native PNG ${p.id}/${point.label}`);
    if(hash(file)!==c.png.sha256)errors.push(`Native PNG changed ${p.id}/${point.label}`);
    const state=await read(c.stateFile);
    if(hash(canonical(state.sceneState))!==c.stateSha256||hash(canonical(state.camera))!==c.cameraSha256)errors.push(`Recorded actual state differs ${p.id}/${point.label}`);
    for(const key of ['viewport','canvas','canvasCss','drawingBuffer'])if(state.surface[key][0]!==p.width||state.surface[key][1]!==p.height)errors.push(`Wrong native ${key} ${p.id}/${point.label}`);
    if(state.surface.deviceScaleFactor!==1)errors.push(`DSF not one ${p.id}/${point.label}`);
    if(c.time!==point.time||Math.abs(state.duration-spec.duration)>1e-9)errors.push(`Timing changed ${p.id}/${point.label}`);
    checked.push({label:c.label,time:c.time,width:png.width,height:png.height,file:c.file,stateSha256:c.stateSha256,cameraSha256:c.cameraSha256,surface:state.surface});
  }
  if(m.resetExcursions.some(x=>!x.stateEqual||!x.cameraEqual))errors.push('Actual seek/reset non-deterministic '+p.id);
  warnings.push(...m.warnings.map(message=>({profile:p.id,message})));
  profiles.push({profile:p,checked,resetExcursions:m.resetExcursions,native:true,proof:m.proof});
}
const reference=manifests.get('720p'),comparisons=[];
for(const point of spec.checkpoints){
  const base=reference.checkpoints.find(c=>c.label===point.label),results=[];
  for(const p of spec.profiles){
    const c=manifests.get(p.id).checkpoints.find(c=>c.label===point.label);
    if(!base||!c)continue;
    const stateEqual=c.stateSha256===base.stateSha256,cameraEqual=c.cameraSha256===base.cameraSha256;
    if(!stateEqual||!cameraEqual)errors.push(`Non-raster state/camera differs ${point.label}/${p.id}`);
    if(c.captions.length!==base.captions.length)errors.push(`Caption visibility differs ${point.label}/${p.id}`);
    let maxNormalizedCaptionDifference=0;
    const captionDifferences=[];
    for(let i=0;i<Math.min(c.captions.length,base.captions.length);i++){
      const a=base.captions[i],b=c.captions[i];
      if(a.tag!==b.tag||a.className!==b.className||a.text!==b.text)errors.push(`Caption text/content changed ${point.label}/${p.id}`);
      for(const field of ['x','y','width','height','fontSize']){
        const delta=Math.abs(a[field]-b[field]);maxNormalizedCaptionDifference=Math.max(maxNormalizedCaptionDifference,delta);
        if(delta>.003)captionDifferences.push({index:i,field,reference:a[field],actual:b[field],delta});
      }
      if(typeof a.lineHeight==='number'&&typeof b.lineHeight==='number'){
        const delta=Math.abs(a.lineHeight-b.lineHeight);maxNormalizedCaptionDifference=Math.max(maxNormalizedCaptionDifference,delta);
        if(delta>.003)captionDifferences.push({index:i,field:'lineHeight',delta});
      }
      for(const field of ['padding','borderWidth'])for(let j=0;j<4;j++){
        const delta=Math.abs(a[field][j]-b[field][j]);maxNormalizedCaptionDifference=Math.max(maxNormalizedCaptionDifference,delta);
        if(delta>.003)captionDifferences.push({index:i,field:field+'-'+j,delta});
      }
    }
    if(captionDifferences.length)errors.push(`Normalized caption layout differs ${point.label}/${p.id}: ${JSON.stringify(captionDifferences)}`);
    results.push({profile:p.id,stateEqual,cameraEqual,maxNormalizedCaptionDifference,captionDifferences});
  }
  comparisons.push({label:point.label,time:point.time,results});
}
const active=reference.checkpoints.find(c=>c.label==='09-step26-corrected-active-connection');
if(active){
  const state=await read(active.stateFile),camera=state.camera;
  if(JSON.stringify(camera.position)!=='[-114.3,116,17]'||JSON.stringify(camera.target)!=='[-115.3,111,7]'||camera.fov!==62)errors.push('Approved Step26 camera identity differs');
}

const proofResults=[];
for(const p of spec.profiles){
  const proof=manifests.get(p.id).proof;
  if(!proof){warnings.push({profile:p.id,message:'Short proof was not requested in capture; no encode-success claim.'});continue;}
  const names=(await fs.readdir(proof.frames)).filter(n=>/^frame-\d{6}\.png$/.test(n)).sort();
  if(names.length!==60||proof.nativeFrames.length!==60||!proof.rendererExitedNormally)errors.push('Incomplete short proof '+p.id);
  for(let i=0;i<names.length;i++){
    const expected=`frame-${String(i).padStart(6,'0')}.png`;
    if(names[i]!==expected)errors.push(`Missing short proof frame ${p.id}/${i}`);
    const b=await fs.readFile(path.join(proof.frames,names[i])),png=await sharp(b).metadata();
    if(png.width!==p.width||png.height!==p.height||!b.length)errors.push('Non-native/empty proof PNG '+p.id+'/'+i);
    if(hash(b)!==proof.nativeFrames[i]?.sha256)errors.push('Proof frame altered '+p.id+'/'+i);
    if(proof.nativeFrames[i]?.time!==spec.proof.start+i/30)errors.push('Proof timing changed '+p.id+'/'+i);
  }
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',proof.output],{encoding:'utf8'}));
  await fs.writeFile(path.join(dir,p.id,'proof-ffprobe.json'),JSON.stringify(probe,null,2),{flag:'wx'});
  const video=probe.streams.find(s=>s.codec_type==='video'),audio=probe.streams.filter(s=>s.codec_type==='audio');
  const valid=video?.width===p.width&&video?.height===p.height&&video?.r_frame_rate==='30/1'&&video?.avg_frame_rate==='30/1'&&video?.codec_name==='h264'&&video?.pix_fmt==='yuv420p'&&Number(video?.nb_read_frames)===60&&audio.length===0&&Math.abs(Number(probe.format.duration)-2)<1e-6;
  if(!valid)errors.push('Encoded proof properties differ '+p.id);
  // Decode the actual proof once and save ffmpeg's stderr as evidence. This
  // does not alter or relax any existing product/mechanical validator.
  const {spawnSync}=await import('node:child_process');
  const check=spawnSync('ffmpeg',['-hide_banner','-nostdin','-v','info','-xerror','-i',proof.output,'-vf','blackdetect=d=0.033:pix_th=0.05:pic_th=0.98','-an','-f','null','-'],{encoding:'utf8',maxBuffer:8*1024*1024});
  await fs.writeFile(path.join(dir,p.id,'proof-complete-decode.log'),check.stderr,{flag:'wx'});
  if(check.status!==0||/black_start:/.test(check.stderr))errors.push('Proof decode/black detection failed '+p.id);
  if(proof.encoderArgs.some(x=>/\bscale[=:]/.test(x)))errors.push('Proof encoder scaling filter present '+p.id);
  const outputBytes=await fs.readFile(proof.output);
  proofResults.push({profile:p.id,output:proof.output,width:video.width,height:video.height,fps:video.avg_frame_rate,codec:video.codec_name,pixelFormat:video.pix_fmt,frames:Number(video.nb_read_frames),duration:Number(probe.format.duration),audioStreams:audio.length,nativeSourceFrames:names.length,sourceTime:proof.start,noUpscaling:true,completeDecode:check.status===0,unexpectedBlackIntervals:/black_start:/.test(check.stderr)?1:0,valid,bytes:outputBytes.length,sha256:hash(outputBytes)});
}

// Comparison thumbnails ONLY, downscaled from the four ORIGINAL native PNGs.
const sheets=path.join(dir,'comparison-sheets');await fs.mkdir(sheets,{recursive:false});
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const comparisonSheets=[];
for(const point of spec.checkpoints){
  const width=4*480,height=314,layers=[];
  for(let i=0;i<4;i++){
    const p=spec.profiles[i],c=manifests.get(p.id).checkpoints.find(c=>c.label===point.label);if(!c)continue;
    layers.push({input:await sharp(c.file).resize({width:480,height:270,fit:'fill',withoutEnlargement:true}).png().toBuffer(),left:i*480,top:44});
    const title=`${p.id} — native ${p.width} × ${p.height}`;
    layers.push({input:Buffer.from(`<svg width="480" height="44"><rect width="480" height="44" fill="#ede8dd"/><text x="14" y="28" font-family="Arial,sans-serif" font-size="18" fill="#292b28">${esc(title)}</text></svg>`),left:i*480,top:0});
  }
  const file=path.join(sheets,point.label+'.png');
  await sharp({create:{width,height,channels:3,background:'#ede8dd'}}).composite(layers).png().toFile(file);
  comparisonSheets.push({...point,file,thumbsOnly:true,nativeSourcePNGsPreserved:true});
}
// All 12 comparisons in one overview. Individual sheets preserve readable text.
const overviewLayers=[];
for(let i=0;i<comparisonSheets.length;i++)overviewLayers.push({input:await sharp(comparisonSheets[i].file).resize({width:1280}).png().toBuffer(),left:0,top:i*210});
await sharp({create:{width:1280,height:comparisonSheets.length*210,channels:3,background:'#ede8dd'}}).composite(overviewLayers).png().toFile(path.join(dir,'native-comparison-contact-sheet.png'));
const report={valid:!errors.length,candidate:spec.candidateId,timeline:spec.duration,profiles,comparisons,proofResults,comparisonSheets,comparisonContactSheet:path.join(dir,'native-comparison-contact-sheet.png'),errors,warnings,noFullHighResolutionRenders:true,noAudioAdded:true,noProductStateInferredFromRaster:true,crossResolutionStateMethod:'Exact canonical hashes of actual current renderer getSceneState plus actual camera at identical timestamps; excludes raster only through generic API implementation.',captionToleranceNormalized:.003,visualInspection:'Native stills/sheets require root/director visual inspection; this technical report is not creative approval',finishedAt:new Date().toISOString()};
await fs.writeFile(reportFile,JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify({valid:report.valid,profiles:profiles.length,comparisons:comparisons.length,proofs:proofResults.length,errors,warnings,report:reportFile},null,2));
if(!report.valid)process.exitCode=1;
