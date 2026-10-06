// Post-export read-only verification; output artifacts only, no candidate edits.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {getProductPackage}=require(path.resolve('src/products/registry.ts'));
const dir=__dirname;
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name)));
const write=(name,data)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(data,null,2));
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const provenance=read('render-provenance.json'),exit=read('render-exit.json');
if(exit.code!==0)throw Error('Render did not exit successfully');
const frozen=read('frozen-source-hashes.json'),changed=Object.entries(frozen.hashes).filter(([p,h])=>sha(fs.readFileSync(p))!==h).map(([p])=>p);
if(changed.length)throw Error('Frozen sources changed: '+changed.join(', '));
const e=getProductPackage(provenance.candidate),approved=read('approved-qa/candidate-manifest.json');
if(sha(JSON.stringify(e.video))!==approved.videoSha256||sha(JSON.stringify(e.directorPlan))!==approved.planSha256)throw Error('Candidate identity differs');
if(sha(JSON.stringify(e.video.cameraPresets))!==provenance.camerasSha256)throw Error('Camera preset identity differs');
const frames=fs.readdirSync(provenance.frames).filter(n=>/^frame-\d{6}\.png$/.test(n)).sort();
if(frames.length!==provenance.expectedFrames)throw Error('Wrong source frame count');
for(let i=0;i<frames.length;i++)if(frames[i]!==`frame-${String(i).padStart(6,'0')}.png`||fs.statSync(path.join(provenance.frames,frames[i])).size===0)throw Error('Missing/empty source frame: '+i);
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',provenance.output],{encoding:'utf8'}));
write('ffprobe.json',probe);
const video=probe.streams.find(s=>s.codec_type==='video'),audio=probe.streams.filter(s=>s.codec_type==='audio');
if(!video||video.width!==1280||video.height!==720||video.r_frame_rate!=='30/1'||video.avg_frame_rate!=='30/1'||video.codec_name!=='h264'||video.pix_fmt!=='yuv420p'||Number(video.nb_read_frames)!==frames.length||audio.length)throw Error('MP4 technical properties differ from requested master');
if(Math.abs(Number(probe.format.duration)-frames.length/30)>.00001)throw Error('Encoded duration does not equal frame cadence');
const decodeLog=path.join(dir,'complete-decode-blackdetect.log'),fd=fs.openSync(decodeLog,'w');
try {execFileSync('ffmpeg',['-hide_banner','-nostdin','-v','info','-xerror','-i',provenance.output,'-vf','blackdetect=d=0.033:pix_th=0.05:pic_th=0.98','-an','-f','null','-'],{stdio:['ignore','ignore',fd]});}finally{fs.closeSync(fd);}
const decodeText=fs.readFileSync(decodeLog,'utf8');
if(/black_start:/.test(decodeText))throw Error('Unexpected black frame interval; inspect decode log');
if(!decodeText.includes('frame='+String(frames.length).padStart(5,' '))&&!new RegExp('frame=\\s*'+frames.length+'\\b').test(decodeText))throw Error('Complete decoder did not report expected final frame');
let cursor=0;const shots=new Map();
for(const step of e.directorPlan.steps)for(const shot of step.shots){shots.set(shot.id,{...shot,start:cursor});cursor+=shot.duration;}
const point=(label,id,p=.8)=>{const shot=shots.get(id);if(!shot)throw Error('Missing approved shot '+id);return {label,shot:id,time:shot.start+shot.duration*p,camera:shot.camera};};
const points=[point('01-early-assembly','rail-seat-0',.9),point('02-first-hardware-closeup','bolt-macro',.7),
  point('03-cabinet-assembly','S4-D4-1-seat',.85),point('04-bed-face-assembly','S15-complete'),
  point('05-carrier-assembly','S16-complete'),point('06-step25-front-context','S25-context'),
  point('07-step25-supported-approach','S25-route-4',.6),point('08-step25-bearing-seating','S25--1-connection'),
  point('09-step25-connected-pullback','S25-complete',.75),point('10-gas-piston-mechanism','S26-eye-align',.9),
  point('11-folding-legs','S28--1-D7-join',.78),point('12-wall-anchoring','S30-0-wall-screw',.75),
  point('13-assembly-complete','final-result')];
const showcases=new Map();cursor=0;for(const s of e.video.scenes){showcases.set(s.id,{...s,start:cursor});cursor+=s.duration;}
for(const [label,id,p] of [['14-finished-closed','showcase-final-closed',.8],['15-finished-opening','showcase-final-open',.55],['16-mattress','showcase-mattress',.8],['17-bedding','showcase-bedding',.8],['18-final-hero','showcase-hero',.8]]){const s=showcases.get(id);points.push({label,shot:id,time:s.start+s.duration*p,camera:s.camera});}
fs.mkdirSync(path.join(dir,'decoded-spot-checks'),{recursive:true});
for(const p of points){p.frame=Math.floor(p.time*30);p.encodedTime=p.frame/30;p.file=path.join(dir,'decoded-spot-checks',p.label+'.png');
  execFileSync('ffmpeg',['-hide_banner','-v','error','-nostdin','-ss',Math.max(0,p.encodedTime-.000001).toFixed(9),'-i',provenance.output,'-frames:v','1','-update','1',p.file],{stdio:'pipe'});
  console.log('Decoded',p.label,'frame',p.frame,'camera',p.camera);
}
write('decoded-spot-checks.json',points);
const sheetArgs=points.flatMap(p=>['-i',p.file]);
const thumbs=points.map((_,i)=>`[${i}:v]scale=426:240[t${i}]`).join(';');
const grid=points.map((_,i)=>`${i%3*426}_${Math.floor(i/3)*240}`).join('|');
execFileSync('ffmpeg',['-hide_banner','-nostdin','-v','error',...sheetArgs,'-filter_complex',`${thumbs};${points.map((_,i)=>`[t${i}]`).join('')}xstack=inputs=${points.length}:layout=${grid}[sheet]`,'-map','[sheet]','-frames:v','1','-update','1',path.join(dir,'decoded-contact-sheet.png')],{stdio:'pipe'});
const warnings=fs.readFileSync(path.join(dir,'render.log'),'utf8').split(/[\r\n]/).filter(line=>/warning|deprecated/i.test(line));
const report={valid:true,candidate:e.id,output:provenance.output,duration:Number(probe.format.duration),timelineDuration:provenance.timelineDuration,
  frameCount:Number(video.nb_read_frames),sourceFrameCount:frames.length,sourceSequenceContiguous:true,
  resolution:[video.width,video.height],fps:video.avg_frame_rate,codec:video.codec_name,pixelFormat:video.pix_fmt,
  fileSizeBytes:fs.statSync(provenance.output).size,sha256:sha(fs.readFileSync(provenance.output)),
  sourceFilesUnchanged:Object.keys(frozen.hashes).length,modifiedSources:changed,approvedCandidateIdentity:true,
  approvedCameraIdentity:true,completeDecode:true,unexpectedBlackIntervals:0,audioStreams:audio.length,
  historicalVideoOrFramesUsed:false,freshFrameDirectory:provenance.frames,spotCheckCount:points.length,
  validation:{locks:read('locks-results.json').valid,props:read('props-results.json').valid,
    mechanicalGates:read('gates-results.json').valid,presentationSeekReset:read('presentation-seek-verification.json').valid},
  warnings,verifiedAt:new Date().toISOString(),visualInspection:'Pending human/model inspection of decoded spot frames'};
write('technical-verification.json',report);console.log(JSON.stringify(report,null,2));
