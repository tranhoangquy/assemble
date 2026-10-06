// Post-export read-only verification. NEW output artifacts only, no source edits.
// node --import tsx <this-script> <fresh-frame-directory> <new-master.mp4>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {candidateId,loadCandidate,checkpoints} from './checkpoints.mjs';
import {missingResource404,isOptionalFavicon404} from './network-classification.mjs';
const evidence=path.dirname(fileURLToPath(import.meta.url));
const framesDirectory=path.resolve(process.argv[2]??''),output=path.resolve(process.argv[3]??'');
if(process.argv.length!==4)throw Error('Required arguments: fresh frame directory and new MP4 path');
const read=name=>JSON.parse(fs.readFileSync(path.join(evidence,name),'utf8'));
const write=(name,data)=>fs.writeFileSync(path.join(evidence,name),JSON.stringify(data,null,2));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=s=>{throw Error(s);};
if(fs.existsSync(path.join(evidence,'technical-verification.json')))fail('Refusing to overwrite technical verification history');
const provenance=read('render-provenance.json'),exit=read('render-exit.json'),frozen=read('frozen-source-hashes.json');
if(exit.code!==0||exit.signal)fail('Renderer did not exit successfully');
if(provenance.candidate!==candidateId||path.resolve(provenance.frames)!==framesDirectory||path.resolve(provenance.output)!==output)fail('Frame/MP4 arguments differ from recorded fresh-render provenance');
if(provenance.resumeFromFrame!==0)fail('Render did not start from time zero');
const changed=Object.entries(frozen.hashes).filter(([p,h])=>!fs.existsSync(p)||sha(fs.readFileSync(p))!==h).map(([p])=>p);
if(changed.length)fail('Frozen sources changed: '+changed.join(', '));
const history=read('preserved-history-hashes.json');
const changedHistory=Object.entries(history.hashes).filter(([p,h])=>!fs.existsSync(p)||sha(fs.readFileSync(p))!==h).map(([p])=>p);
if(changedHistory.length)fail('Preserved QA/history changed: '+changedHistory.join(', '));
const {entry,baseline}=await loadCandidate(),timeline=checkpoints(entry),approved=JSON.parse(fs.readFileSync('output/wf311613-standalone-murphy-bed/reviews/final-micro-pass/micro-validation.json','utf8'));
const identity={product:sha(JSON.stringify(entry.product)),material:sha(JSON.stringify(entry.product.materials)),assembly:sha(JSON.stringify(entry.assembly)),plan:sha(JSON.stringify(entry.directorPlan)),video:sha(JSON.stringify(entry.video)),cameras:sha(JSON.stringify(entry.video.cameraPresets)),intro:sha(JSON.stringify(entry.video.intro))};
if(identity.product!==approved.productHash||identity.material!==approved.materialHash||identity.assembly!==approved.assemblyHash||identity.plan!==approved.approvedPlanHash||identity.video!==approved.microVideoHash)fail('Candidate does not match approved micro-pass identity');
if(identity.video!==provenance.videoSha256||identity.plan!==provenance.planSha256||identity.cameras!==provenance.camerasSha256)fail('Candidate differs from pre-render identity');
if(entry.assembly!==baseline.assembly||entry.directorPlan!==baseline.directorPlan)fail('Original assembly/DirectorPlan references changed');
if(entry.video.intro.duration!==5||entry.video.intro.heroDuration!==1.25||entry.video.intro.separationDuration!==2.5||entry.video.intro.holdDuration!==.875||entry.video.intro.transitionDuration!==.375)fail('Intro timing changed');
const mechanismCamera=entry.video.cameraPresets['S26-cabinet-eye'];
if(JSON.stringify(mechanismCamera.position)!=='[-114.3,116,17]'||JSON.stringify(mechanismCamera.target)!=='[-115.3,111,7]'||mechanismCamera.fov!==62)fail('Approved Step26 camera changed');
if(Math.abs(timeline.duration-524.053693888889)>1e-9||Math.abs(timeline.duration-provenance.timelineDuration)>1e-9)fail('Full deterministic timeline changed');
const expectedFrames=Math.ceil(timeline.duration*30);
const frames=fs.readdirSync(framesDirectory).filter(n=>/^frame-\d{6}\.png$/.test(n)).sort();
if(frames.length!==expectedFrames||frames.length!==provenance.expectedFrames)fail('Wrong source frame count');
const sequenceHash=crypto.createHash('sha256');
for(let i=0;i<frames.length;i++){
  const filename=`frame-${String(i).padStart(6,'0')}.png`;
  if(frames[i]!==filename)fail('Missing source frame '+i);
  const b=fs.readFileSync(path.join(framesDirectory,filename));
  if(!b.length)fail('Empty source frame '+i);
  if(b.length<24||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.readUInt32BE(16)!==1280||b.readUInt32BE(20)!==720)fail('Invalid/wrong-dimension source PNG '+i);
  sequenceHash.update(filename+'\0'+sha(b)+'\n');
}
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',output],{encoding:'utf8',maxBuffer:32*1024*1024}));write('ffprobe.json',probe);
const video=probe.streams.find(s=>s.codec_type==='video'),audio=probe.streams.filter(s=>s.codec_type==='audio');
if(probe.streams.filter(s=>s.codec_type==='video').length!==1||!video||video.width!==1280||video.height!==720||video.r_frame_rate!=='30/1'||video.avg_frame_rate!=='30/1'||video.codec_name!=='h264'||video.pix_fmt!=='yuv420p'||Number(video.nb_read_frames)!==expectedFrames||audio.length)fail('MP4 technical properties differ from requested silent master');
const encodedDuration=Number(probe.format.duration);
if(Math.abs(encodedDuration-expectedFrames/30)>.00001)fail('Encoded duration does not match 30fps frame cadence');
const frameProbe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time,pkt_duration_time','-of','json',output],{encoding:'utf8',maxBuffer:32*1024*1024}));
const timestamps=frameProbe.frames.map(f=>Number(f.best_effort_timestamp_time));
if(timestamps.length!==expectedFrames||timestamps.some((t,i)=>!Number.isFinite(t)||Math.abs(t-i/30)>1.1e-6))fail('Non-constant or missing decoded frame timestamps');
write('frame-cadence-verification.json',{valid:true,frameCount:timestamps.length,first:timestamps[0],last:timestamps.at(-1),cadence:'Each decoded timestamp equals n / 30 within ffprobe six-decimal serialization accuracy',maxTimestampError:Math.max(...timestamps.map((t,i)=>Math.abs(t-i/30)))});
const decodeLog=path.join(evidence,'complete-decode-blackdetect.log'),fd=fs.openSync(decodeLog,'w');
try{execFileSync('ffmpeg',['-hide_banner','-nostdin','-v','info','-xerror','-i',output,'-vf','blackdetect=d=0.033:pix_th=0.05:pic_th=0.98','-an','-f','null','-'],{stdio:['ignore','ignore',fd]});}finally{fs.closeSync(fd);}
const decodeText=fs.readFileSync(decodeLog,'utf8');
if(/black_start:/.test(decodeText))fail('Unexpected black-frame interval; inspect complete-decode-blackdetect.log');
if(!new RegExp('frame=\\s*'+expectedFrames+'\\b').test(decodeText))fail('Complete decoder did not report expected final frame count');
const renderLog=fs.readFileSync(path.join(evidence,'render.log'),'utf8');
const rawWholeScene=read('whole-scene-seek-verification.json');
const supplementPath=path.join(evidence,'whole-scene-supplementary-verification.json');
const wholeScene=fs.existsSync(supplementPath)?read('whole-scene-supplementary-verification.json'):rawWholeScene;
const cameraJsonReplayExact=rawWholeScene.reverseReplay.every(r=>r.cameraIdentical);
let adjacentBinary64Only=false;
if(wholeScene!==rawWholeScene){
  const rawBytes=fs.readFileSync(path.join(evidence,'whole-scene-seek-verification.json'));
  if(wholeScene.originalReportSha256!==sha(rawBytes)||!wholeScene.originalReportUnchanged)fail('Supplement does not match preserved raw whole-scene report');
  const cameraAuditBytes=fs.readFileSync(path.join(evidence,'camera-replay-numeric-audit.json')),audit=JSON.parse(cameraAuditBytes);
  if(!audit.valid||audit.sourceSha256!==sha(rawBytes)||wholeScene.supplementalEvidence.cameraAuditSha256!==sha(cameraAuditBytes))fail('Supplement does not match numeric ULP diagnostic');
  const sign=1n<<63n,mask=(1n<<64n)-1n;
  const ordered=value=>{const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value,false);const bits=view.getBigUint64(0,false);return bits&sign?~bits&mask:bits|sign;};
  const representationEquivalent=(a,b)=>{
    if(JSON.stringify(a)===JSON.stringify(b))return true;
    if(JSON.stringify(Object.keys(a))!==JSON.stringify(Object.keys(b))||a.fov!==b.fov||JSON.stringify(a.target)!==JSON.stringify(b.target))return false;
    for(const property of ['position','direction']){
      if(a[property].length!==3||b[property].length!==3)return false;
      for(let i=0;i<3;i++){
        const x=a[property][i],y=b[property][i];if(Object.is(x,y))continue;
        if(!Number.isFinite(x)||!Number.isFinite(y))return false;
        const q=ordered(x),r=ordered(y);if((q>r?q-r:r-q)!==1n)return false;
      }
    }return true;
  };
  adjacentBinary64Only=rawWholeScene.reverseReplay.every(r=>r.pngIdentical&&representationEquivalent(r.first.camera,r.again.camera));
  if(!adjacentBinary64Only||!rawWholeScene.exactStep1Reset.pngIdentical||!rawWholeScene.exactStep1Reset.cameraIdentical||!rawWholeScene.introShowcaseMechanismResetExcursions.every(r=>r.pngIdentical&&r.cameraIdentical))fail('Supplement cannot justify a meaningful camera, pixel or reset difference');
}
if(!wholeScene.valid)fail('Whole-scene seek/reset verification not PASS');
const rendererConsoleErrors=renderLog.split(/[\r\n]/).filter(l=>/\[browser:error\]/.test(l));
const rendererPageErrors=renderLog.split(/[\r\n]/).filter(l=>/Render page errors:/.test(l));
const generic404=rendererConsoleErrors.filter(l=>l.trim()==='[browser:error] '+missingResource404);
const fatalRendererConsoleErrors=rendererConsoleErrors.filter(l=>l.trim()!=='[browser:error] '+missingResource404);
const network=wholeScene.networkAudit;
const frozenAppFaviconEvidence=network?.valid&&wholeScene.candidate===candidateId&&!network.unexplainedHttpFailures.length&&!network.requestFailures.length&&!network.fatalConsoleErrors.length&&network.optionalFavicon404.every(r=>isOptionalFavicon404(r,wholeScene.renderUrl));
if(rendererPageErrors.length||fatalRendererConsoleErrors.length)fail('Fatal renderer page/console errors were reported');
if(generic404.length&&(!frozenAppFaviconEvidence||generic404.length>network.optionalFavicon404.length))fail('Generic render 404 lacks exclusive observed frozen-app favicon evidence');
const knownNoncriticalRendererWarnings=generic404.map(message=>({message,classification:'Only generic 404 resource message; actual frozen application network audit identifies sole failed resource as optional /favicon.ico',evidenceReport:path.join(evidence,'whole-scene-seek-verification.json'),observedResources:network.optionalFavicon404}));
if(!renderLog.includes('Video written to '+output))fail('Renderer successful output confirmation absent');
const points=timeline.points.map(p=>({...p,frame:Math.floor(p.time*30),encodedTime:Math.floor(p.time*30)/30,file:path.join(evidence,'decoded-spot-checks',p.label+'.png')}));
fs.mkdirSync(path.join(evidence,'decoded-spot-checks'),{recursive:true});
const selected=points.map(p=>`eq(n\\,${p.frame})`).join('+');
// Decode once and select exact frame indices. No seek approximations/old frames.
execFileSync('ffmpeg',['-hide_banner','-nostdin','-v','error','-xerror','-i',output,'-vf',`select=${selected}`,'-fps_mode','passthrough','-start_number','0',path.join(evidence,'decoded-spot-checks','selected-%02d.png')],{stdio:'pipe',maxBuffer:8*1024*1024});
for(let i=0;i<points.length;i++){
  const p=points[i],selectedFile=path.join(evidence,'decoded-spot-checks',`selected-${String(i).padStart(2,'0')}.png`);
  if(!fs.existsSync(selectedFile)||!fs.statSync(selectedFile).size)fail('Missing actual decoded QA frame '+p.label);
  fs.renameSync(selectedFile,p.file);p.sourceFrameSha256=sha(fs.readFileSync(path.join(framesDirectory,`frame-${String(p.frame).padStart(6,'0')}.png`)));p.decodedPngSha256=sha(fs.readFileSync(p.file));
  console.log('Decoded actual new MP4',p.label,'frame',p.frame,'camera',p.camera??'original Step1 camera');
}
write('decoded-spot-checks.json',points);
const sheetArgs=points.flatMap(p=>['-threads','1','-i',p.file]);
const thumbs=points.map((_,i)=>`[${i}:v]scale=426:240[t${i}]`).join(';'),grid=points.map((_,i)=>`${i%3*426}_${Math.floor(i/3)*240}`).join('|');
execFileSync('ffmpeg',['-hide_banner','-nostdin','-v','error','-filter_complex_threads','1',...sheetArgs,'-filter_complex',`${thumbs};${points.map((_,i)=>`[t${i}]`).join('')}xstack=inputs=${points.length}:layout=${grid}:fill=white[sheet]`,'-map','[sheet]','-frames:v','1','-update','1',path.join(evidence,'decoded-contact-sheet.png')],{stdio:'pipe',maxBuffer:8*1024*1024});
const resetFrameSha=points.find(p=>p.label==='06-step1-exact-reset').sourceFrameSha256;
if(resetFrameSha!==wholeScene.exactStep1Reset.baseline.sha256)fail('Rendered frame 150 is not byte-identical to approved baseline Step1');
const warnings=renderLog.split(/[\r\n]/).filter(l=>/warning|deprecated/i.test(l));
const report={valid:true,candidate:candidateId,output,encodedDuration,timelineDuration:timeline.duration,finalFrameRoundingDifference:encodedDuration-timeline.duration,introDuration:5,frameCount:expectedFrames,sourceFrameCount:frames.length,sourceSequenceContiguous:true,sourceFrameSequenceSha256:sequenceHash.digest('hex'),resolution:[video.width,video.height],fps:video.avg_frame_rate,constantFrameRate:true,codec:video.codec_name,pixelFormat:video.pix_fmt,fileSizeBytes:fs.statSync(output).size,sha256:sha(fs.readFileSync(output)),audioStreams:audio.length,completeDecode:true,unexpectedBlackIntervals:0,rendererPageErrors,rendererConsoleErrors,fatalRendererConsoleErrors,knownNoncriticalRendererWarnings,missingOrEmptyFrames:0,frozenSourceCount:Object.keys(frozen.hashes).length,modifiedSources:changed,preservedHistoryCount:Object.keys(history.hashes).length,changedHistory,approvedIdentity:identity,assemblyAndDirectorPlanUnchanged:true,introTimingUnchanged:true,approvedStep26Camera:mechanismCamera,wholeSceneSeekReset:true,wholeSceneVerification:{originalStrictReportValid:rawWholeScene.valid,cameraJsonReplayExact,wholeScenePngReplayExact:rawWholeScene.reverseReplay.every(r=>r.pngIdentical),supplementUsed:wholeScene!==rawWholeScene,adjacentBinary64Only,strictStep1Reset:rawWholeScene.exactStep1Reset.pngIdentical&&rawWholeScene.exactStep1Reset.cameraIdentical,rawEvidence:path.join(evidence,'whole-scene-seek-verification.json'),supplementEvidence:wholeScene!==rawWholeScene?supplementPath:null,nativeValidatorThresholdsUnchanged:true},exactStep1ResetSourcePng:true,noHistoricalMp4OrFramesUsed:true,freshFrameDirectory:framesDirectory,renderedFromTimeZero:true,resumeFromFrame:provenance.resumeFromFrame,decodedSpotCheckCount:points.length,decodedContactSheet:path.join(evidence,'decoded-contact-sheet.png'),warnings,verifiedAt:new Date().toISOString(),visualInspection:'Pending inspection of decoded PNGs by director/root; technical verification does not imply creative approval'};
write('technical-verification.json',report);console.log(JSON.stringify(report,null,2));
