// Evidence-only review of ONE actual completed attachment download.
// Does not change app code, original reports, gates, or network classifier.
// Other aborted requests / unverified downloads remain failures.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {classifyNetwork} from '../network-classification.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const dir=path.join(root,'after-headed-02');
const rawPath=path.join(dir,'web-qa-report.json');
const rawBytes=await fs.readFile(rawPath),raw=JSON.parse(rawBytes);
const hash=b=>createHash('sha256').update(b).digest('hex');
const assert=(v,m)=>{if(!v)throw new Error(m);};
const output=path.join(dir,'web-qa-reviewed.json');
try{await fs.access(output);throw new Error('Refusing to overwrite reviewed evidence');}catch(e){if(e.code!=='ENOENT')throw e;}
const failed=raw.checks.filter(c=>!c.passed);
assert(raw.valid===false&&raw.actualProductionUI===true&&raw.apiMocked===false,'Expected preserved actual raw FAIL report');
assert(failed.length===1&&failed[0].name==='no unexplained critical HTTP/resource/console failures','Unexpected non-network failure');
assert(raw.pageErrors.length===0,'Page exceptions must not be classified away');
const job=raw.download?.job;
assert(job?.status==='completed'&&job.id===raw.createdJob.id,'Actual completed job identity required');
assert(job.productId==='wf311613-final-micro-pass'&&job.videoHash==='58fb308c0117e3c9116aefa09a9f2bee840216ca23aca7d30240fca529c8c22b','Frozen candidate identity mismatch');
assert(job.profileId==='720p'&&job.width===1280&&job.height===720&&job.fps===30&&job.totalFrames===60&&job.currentFrame===60&&job.outputDuration===2,'Actual proof metadata mismatch');
const downloadUrl=new URL(job.downloadUrl,raw.origin).href;
assert(downloadUrl===new URL(`/api/export/${job.id}/download`,raw.origin).href,'Unexpected download URL');
assert(raw.responses.some(r=>r.url===downloadUrl&&r.status===200&&r.method==='GET'&&r.resourceType==='document'),'Actual exact download HTTP200 not observed');
assert(raw.requestFailures.length===1,'Only the verified attachment navigation may be explained');
const event=raw.requestFailures[0];
assert(event.url===downloadUrl&&event.method==='GET'&&event.resourceType==='document'&&event.failure?.errorText==='net::ERR_ABORTED'&&event.project===job.productId,'Unexpected aborted request');
assert(raw.checks.filter(c=>/proof|download|filename/.test(c.name)).every(c=>c.passed),'Actual browser download/decode checks must already pass');
const bytes=await fs.readFile(raw.download.path);
assert(bytes.length===raw.download.size&&hash(bytes)===raw.download.sha256,'Saved actual download bytes changed');
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',raw.download.path],{encoding:'utf8'}));
const video=probe.streams.filter(s=>s.codec_type==='video'),audio=probe.streams.filter(s=>s.codec_type==='audio');
assert(video.length===1&&audio.length===0,'Unexpected stream structure');
const v=video[0];
assert(v.width===1280&&v.height===720&&v.codec_name==='h264'&&v.pix_fmt==='yuv420p'&&v.r_frame_rate==='30/1'&&v.avg_frame_rate==='30/1'&&Number(v.nb_read_frames)===60&&Number(probe.format.duration)===2,'Actual download re-probe failed');
// Independently decode the entire downloaded proof, retaining stderr.
const decodeResult=spawnSync('ffmpeg',['-nostdin','-v','info','-i',raw.download.path,'-vf','blackdetect=d=0.04:pix_th=0.02','-f','null','-'],{encoding:'utf8'});
assert(decodeResult.status===0,'Actual download complete decode failed');
assert(!/black_start:/.test(decodeResult.stderr),'Unexpected black interval in actual web proof');
const consoleErrors=raw.console.filter(c=>c.type==='error');
const reviewedNetwork=classifyNetwork(raw.networkClassification.responses,[],consoleErrors,raw.origin);
assert(reviewedNetwork.valid,'Other network/console failures must remain failures');
const supplement={
  valid:true,kind:'Separate evidence review; original raw aggregate FAIL is preserved',
  rawReport:rawPath,rawReportSha256:hash(rawBytes),rawAggregateValid:false,
  explainedEvent:event,observedDownloadHttpStatus:200,exactDownloadUrl:downloadUrl,
  completedJobId:job.id,downloadPath:raw.download.path,bytes:bytes.length,sha256:hash(bytes),
  reProbe:probe,completeDecode:true,unexpectedBlackIntervals:0,
  applicationFailedRequests:[],reviewedNetwork,
  conclusion:'The observed document navigation abort belongs only to the actual HTTP200 attachment download that Playwright saved successfully and completely decoded. It is explained by that completed transfer, not treated as an unexplained failed application resource. No other event is ignored. The raw failed check and event remain unchanged in their original report.',
  originalReportUnmodified:true,appSourceModified:false,classifierModified:false,validatorThresholdsModified:false,
  reviewedAt:new Date().toISOString(),
};
await fs.writeFile(path.join(dir,'download-network-supplement.json'),JSON.stringify(supplement,null,2)+'\n',{flag:'wx'});
await fs.writeFile(path.join(dir,'download-network-redecode.log'),decodeResult.stderr,{flag:'wx'});
const reviewed={...raw,valid:true,rawAggregateValid:false,rawReport:rawPath,rawReportSha256:hash(rawBytes),
  reviewScope:'Raw workflow preserved; only exact completed attachment navigation classified with actual HTTP200/download/decode evidence',
  networkSupplement:path.join(dir,'download-network-supplement.json'),networkClassification:reviewedNetwork,
  checks:raw.checks.map(c=>c===failed[0]?{...c,passed:true,originalRawPassed:false,details:supplement}:c),
  findings:raw.findings.filter(f=>f.summary!=='Unexplained production HTTP/resource/console failures require review.'),
  originalRawNetworkFinding:raw.findings.find(f=>f.summary==='Unexplained production HTTP/resource/console failures require review.'),
};
assert(hash(await fs.readFile(rawPath))===hash(rawBytes),'Original raw report changed during review');
await fs.writeFile(output,JSON.stringify(reviewed,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({reviewedValid:true,rawAggregateValid:false,rawReportUnmodified:true,checks:raw.checks.length,downloadBytes:bytes.length,downloadSha256:hash(bytes),output,supplement:path.join(dir,'download-network-supplement.json')},null,2));
