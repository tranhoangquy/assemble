import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { hashFile } from './ExportMedia';
import { chromium, type Browser } from 'playwright';
import type { ProductPackage } from '@/types/product-package';
import type { ProductManager } from '@/engine/product/ProductManager';
import { ExportJobManager, assertExportTransition } from './ExportJobManager';
import { chunkPlan, frameName, validateFramePng, type ExportCheckpoint } from './ExportCheckpoint';
import { getRenderProfile } from './RenderProfiles';
import { creativePackageHash } from './CreativeIdentity';

function crc(bytes:Buffer) { let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0; }
function png(w=1280,h=720) {
  const chunk=(name:string,body:Buffer)=>{const out=Buffer.alloc(body.length+12);out.writeUInt32BE(body.length);out.write(name,4);body.copy(out,8);out.writeUInt32BE(crc(out.subarray(4,-4)),out.length-4);return out;};
  const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.alloc((w*3+1)*h))),chunk('IEND',Buffer.alloc(0))]);
}
let root:string,entry:ProductPackage,source:string,times:number[],captures:number,failAt:number|undefined;
const fixture=png();
function products() {return {has:(id:string)=>id===entry.id,load:()=>entry} as unknown as ProductManager;}
function manager(policy={}) {return new ExportJobManager(products(),{storageRoot:root,chunkSize:2,maxRetries:1,recycleEveryChunks:1,sourceHash:()=>source,...policy});}
function mockRenderer() {
  const page={setDefaultTimeout:vi.fn(),on:vi.fn(),goto:vi.fn().mockResolvedValue(undefined),waitForFunction:vi.fn().mockResolvedValue(undefined),evaluate:vi.fn(async(fn:unknown,arg?:number)=>{
    if(typeof arg==='number'){times.push(arg);if(failAt===Math.round(arg*30))throw new Error('frame interruption');return;}
    if(String(fn).includes('creative'))return {duration:2,creative:{product:entry.product,assembly:entry.assembly,video:entry.video}};
    return {viewportWidth:1280,viewportHeight:720,deviceScaleFactor:1,canvasWidth:1280,canvasHeight:720,cssWidth:1280,cssHeight:720,drawingBufferWidth:1280,drawingBufferHeight:720,contextLost:false,maxRenderbufferSize:4096,maxTextureSize:4096,maxViewportDimensions:[4096,4096]};
  }),screenshot:vi.fn(async()=>{captures++;return fixture;})};
  const browser={newPage:vi.fn().mockResolvedValue(page),close:vi.fn().mockResolvedValue(undefined)};
  vi.spyOn(chromium,'launch').mockResolvedValue(browser as unknown as Browser);return {page,browser};
}
function fakeMedia(jobs:ExportJobManager,verifyError?:Error,encodeError?:Error) {
  const internal=jobs as unknown as {encode:(job:unknown)=>Promise<void>;verify:(job:unknown)=>Promise<void>};
  const encode=vi.spyOn(internal,'encode').mockImplementation(async()=>{if(encodeError)throw encodeError;});
  const verify=vi.spyOn(internal,'verify').mockImplementation(async()=>{if(verifyError)throw verifyError;});
  return {encode,verify};
}
async function stopped(jobs:ExportJobManager,id:string) {await vi.waitFor(()=>expect(jobs.get(id)?.canCancel).toBe(false),{timeout:10_000});await vi.waitFor(()=>expect(jobs.get(id)?.canDelete).toBe(true),{timeout:10_000});}
async function manifest(job:{frameDirectory:string}) {return JSON.parse(await readFile(path.join(job.frameDirectory,'..','manifest.json'),'utf8')) as ExportCheckpoint;}
const start=(jobs:ExportJobManager)=>jobs.start({productId:entry.id,profileId:'720p',origin:'http://127.0.0.1:3017'});
beforeEach(async()=>{root=await mkdtemp(path.join(tmpdir(),'resumable-export-test-'));source='source-1';times=[];captures=0;failAt=undefined;entry={id:'generic-product',label:'Generic',filename:'generic.mp4',product:{parts:[],materials:{}},assembly:{steps:[]},video:{id:'generic-video',scenes:[{duration:2,actions:[]}]}} as unknown as ProductPackage;vi.stubEnv('EXPORT_FRAME_LIMIT','4');});
afterEach(async()=>{vi.restoreAllMocks();vi.unstubAllEnvs();await rm(root,{recursive:true,force:true});});

describe('persistent resumable export',()=>{
  it('plans the approved long timeline generically, including final partial chunk',async()=>{
    const { getProductPackage, defaultProductId }=await import('@/products/registry');
    const video=getProductPackage(defaultProductId).video;
    const duration=video.scenes.reduce((sum,scene)=>sum+scene.duration,0);
    const chunks=chunkPlan(Math.ceil(duration*30),300);
    expect(chunks).toHaveLength(53);expect(chunks[0]).toMatchObject({start:0,end:299});expect(chunks.at(-1)).toMatchObject({start:15600,end:15721});
    expect(chunkPlan(3,2).map(c=>[c.start,c.end])).toEqual([[0,1],[2,2]]);
  });
  it('validates complete PNGs, rejecting truncated, CRC-corrupt and wrong dimensions',()=>{
    expect(()=>validateFramePng(fixture,getRenderProfile('720p'))).not.toThrow();
    const corrupt=Buffer.from(fixture);corrupt[corrupt.length-5]^=1;
    for(const bytes of [fixture.subarray(0,24),corrupt,png(2,2)])expect(()=>validateFramePng(bytes,getRenderProfile('720p'))).toThrow();
  });
  it('automatically validates, encodes and verifies after the final frame, with safe recycle and boundary times',async()=>{
    const render=mockRenderer(),jobs=manager(),media=fakeMedia(jobs);
    const stages=vi.spyOn(jobs as unknown as {stage:(job:unknown,status:string,message:string)=>Promise<void>},'stage');
    const job=start(jobs);await stopped(jobs,job.id);
    expect(jobs.get(job.id)).toMatchObject({status:'completed',progress:100,validFrames:4,completedChunks:2});
    expect(times).toEqual([0,1/30,2/30,3/30]);expect(render.browser.newPage).toHaveBeenCalledTimes(2);
    expect(media.encode).toHaveBeenCalledOnce();expect(media.verify).toHaveBeenCalledOnce();
    expect(stages.mock.calls.map(x=>x[1])).toEqual(expect.arrayContaining(['preparing','rendering','validating_frames','encoding','verifying','completed']));
    expect((await manifest(job)).frames).toHaveProperty('3');expect(await stat(job.frameDirectory)).toBeTruthy();
  });
  it('preserves frames after retry exhaustion and resumes only missing/corrupt/wrong-resolution work',async()=>{
    mockRenderer();const jobs=manager();fakeMedia(jobs);failAt=2;
    const job=start(jobs);await stopped(jobs,job.id);
    expect(jobs.get(job.id)).toMatchObject({status:'waiting_for_resume',validFrames:2,canResume:true,errorCode:'FRAME_RENDER_FAILED'});
    const before=await readFile(path.join(job.frameDirectory,frameName(0)));
    await writeFile(path.join(job.frameDirectory,frameName(1)),Buffer.from('broken'));
    await writeFile(path.join(job.frameDirectory,frameName(2)),png(2,2));
    failAt=undefined;times=[];
    await jobs.resume(job.id,'http://127.0.0.1:3017');await stopped(jobs,job.id);
    expect(times).toEqual([1/30,2/30,3/30]);expect(await readFile(path.join(job.frameDirectory,frameName(0)))).toEqual(before);
    expect(jobs.get(job.id)?.status).toBe('completed');
  });
  it('cancel preserves checkpoint and valid work; resume and explicit delete are separate',async()=>{
    const render=mockRenderer(),jobs=manager();fakeMedia(jobs);
    let release:()=>void=()=>{};const held=new Promise<void>(resolve=>{release=resolve;});
    render.page.screenshot.mockImplementationOnce(async()=>fixture).mockImplementationOnce(async()=>{await held;return fixture;});
    const job=start(jobs);await vi.waitFor(()=>expect(jobs.get(job.id)?.validFrames).toBe(1));
    const cancellation=jobs.cancel(job.id);release();await cancellation;
    expect(jobs.get(job.id)).toMatchObject({status:'cancelled',validFrames:1,canResume:true});expect(jobs.get(job.id)?.error).toBeUndefined();
    expect((await manifest(job)).view.status).toBe('cancelled');
    const unrelated=path.join(root,'approved-master.mp4');await writeFile(unrelated,'protected');
    await jobs.resume(job.id,'http://127.0.0.1:3017');await stopped(jobs,job.id);
    expect(jobs.get(job.id)?.status).toBe('completed');
    expect(await jobs.delete(job.id)).toBe(true);expect(jobs.get(job.id)).toBeUndefined();
    expect(await readFile(unrelated,'utf8')).toBe('protected');
    await expect(jobs.delete('../approved-master.mp4')).rejects.toThrow('Invalid export job ID');
  });
  it.each(['product','assembly','video','directorPlan','renderer'])('rejects changed %s before reusing frames',async field=>{
    mockRenderer();const jobs=manager();fakeMedia(jobs);failAt=2;
    const job=start(jobs);await stopped(jobs,job.id);
    if(field==='renderer')source='source-2';else (entry as unknown as Record<string,unknown>)[field]={changed:true};
    const oldCaptures=captures;await expect(jobs.resume(job.id,'http://127.0.0.1:3017')).rejects.toThrow('Creative sources changed');
    expect(jobs.get(job.id)).toMatchObject({status:'stale',canResume:false});expect(captures).toBe(oldCaptures);
  });
  it('recovers incomplete jobs and disk/manifest disagreement after server restart',async()=>{
    mockRenderer();const jobs=manager();fakeMedia(jobs);failAt=2;
    const job=start(jobs);await stopped(jobs,job.id);const c=await manifest(job);c.view.status='rendering';
    delete c.frames['1'];await writeFile(path.join(job.frameDirectory,'..','manifest.json'),JSON.stringify(c));
    await rm(path.join(job.frameDirectory,frameName(0)));
    const recovered=manager();await recovered.ready();
    expect(recovered.get(job.id)).toMatchObject({status:'interrupted',validFrames:1,canResume:true});
    const reconciled=await manifest(job);expect(reconciled.frames).toHaveProperty('1');expect(reconciled.missingFrames).toContain(0);
    failAt=undefined;times=[];fakeMedia(recovered);await recovered.resume(job.id,'http://127.0.0.1:3017');await stopped(recovered,job.id);
    expect(times).toEqual([0,2/30,3/30]);
  });
  it('never adopts legacy or traversal/mismatched-profile manifests',async()=>{
    await mkdir(path.join(root,'render-legacy'));await writeFile(path.join(root,'render-legacy','manifest.json'),JSON.stringify({version:1}));
    mockRenderer();const jobs=manager();fakeMedia(jobs);failAt=2;const job=start(jobs);await stopped(jobs,job.id);
    const c=await manifest(job);c.view.frameDirectory='/tmp/foreign';await writeFile(path.join(job.frameDirectory,'..','manifest.json'),JSON.stringify(c));
    const recovered=manager();await recovered.ready();expect(await recovered.list(entry.id)).toEqual([]);
    expect(await stat(path.join(root,'render-legacy'))).toBeTruthy();
  });
  it.each(['encode','verify'])('keeps frames on %s failure and never reports completed',async which=>{
    mockRenderer();const jobs=manager();fakeMedia(jobs,which==='verify'?new Error('bad output'):undefined,which==='encode'?new Error('encoder failure'):undefined);
    const job=start(jobs);await stopped(jobs,job.id);
    expect(jobs.get(job.id)).toMatchObject({status:'waiting_for_resume',validFrames:4,canResume:true,errorCode:which==='encode'?'ENCODE_FAILED':'FINAL_QA_FAILED'});
    expect(await stat(job.frameDirectory)).toBeTruthy();
  });
  it('pre-encode validation refuses changed frames',async()=>{
    mockRenderer();const jobs=manager();const media=fakeMedia(jobs);
    const intern=jobs as unknown as {render:(job:unknown,origin:string)=>Promise<void>};const original=intern.render.bind(jobs);
    vi.spyOn(intern,'render').mockImplementation(async(job,origin)=>{await original(job,origin);const c=(job as {checkpoint:ExportCheckpoint}).checkpoint;await writeFile(path.join(c.view.frameDirectory,frameName(3)),'broken');});
    const job=start(jobs);await stopped(jobs,job.id);
    expect(jobs.get(job.id)).toMatchObject({errorCode:'FRAME_VALIDATION_FAILED',validFrames:3});expect(media.encode).not.toHaveBeenCalled();
  });
  it('encodes one continuous real MP4 and verifies full decode/hash/faststart without audio',async()=>{
    mockRenderer();const jobs=manager();const job=start(jobs);await stopped(jobs,job.id);
    expect(jobs.get(job.id)).toMatchObject({status:'completed',fileSize:expect.any(Number),sha256:expect.stringMatching(/^[a-f0-9]{64}$/),hasAudio:false});
    const output=await jobs.readOutput(job.id);expect(output?.size).toBeGreaterThan(0);await output?.stream.cancel();
    const evidence=JSON.parse(await readFile(path.join(job.frameDirectory,'..','logs','verification.json'),'utf8'));
    expect(evidence).toMatchObject({fullDecode:'PASS',faststart:'PASS'});
  });
  it('muxes a pre-approved exact-length audio fixture once and preserves every video packet',async()=>{
    mockRenderer();const audio=path.join(root,'approved-fixture.wav');
    execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',String(4/30),'-c:a','pcm_s24le',audio]);
    entry.approvedAudioMaster={path:audio,sha256:await hashFile(audio),approvalEvidence:'unit-test fixture approval only',rightsEvidence:'generated silence fixture',creativeHash:creativePackageHash(entry)};
    const jobs=manager(),job=start(jobs);await stopped(jobs,job.id);
    expect(jobs.get(job.id)).toMatchObject({status:'completed',hasAudio:true});
    const events=(await readFile(path.join(job.frameDirectory,'..','logs','events.ndjson'),'utf8')).split('\n').filter(Boolean).map(line=>JSON.parse(line).status);
    expect(events.filter(status=>status==='muxing_audio')).toHaveLength(1);
    const evidence=JSON.parse(await readFile(path.join(job.frameDirectory,'..','logs','verification.json'),'utf8'));
    expect(evidence.videoStreamIdentity).toBe('PASS');
  });
  it('keeps live legacy downloads/cancellation but never invents resume identity',async()=>{
    const legacyView={id:'legacy-job',status:'completed',message:'Ready'} as unknown as import('@/types/export').ExportJobView;
    const legacy={get:vi.fn(()=>legacyView),cancel:vi.fn().mockResolvedValue({...legacyView,status:'cancelled'}),readOutput:vi.fn().mockResolvedValue({size:12,filename:'legacy.mp4'})};
    const jobs=manager({legacyManager:legacy});await jobs.ready();
    expect(jobs.get('legacy-job')).toMatchObject({canResume:false,canDelete:false});
    await expect(jobs.resume('legacy-job','http://localhost')).rejects.toThrow('Legacy jobs cannot resume');
    expect(await jobs.readOutput('legacy-job')).toMatchObject({filename:'legacy.mp4'});
    expect(await jobs.cancel('legacy-job')).toMatchObject({status:'cancelled'});
  });
  it('validates explicit state transitions and cannot complete directly from rendering',()=>{
    expect(()=>assertExportTransition('rendering','completed')).toThrow();
    expect(()=>assertExportTransition('cancelled','queued')).not.toThrow();
  });
  it('preserves profile/FPS/product isolation and audio binding',async()=>{
    expect(creativePackageHash(entry)).toHaveLength(64);
    const jobs=manager();vi.spyOn(jobs as unknown as {run:()=>Promise<void>},'run').mockResolvedValue();
    const a=start(jobs),b=jobs.start({productId:entry.id,profileId:'2160p',fps:60,origin:'http://localhost'});
    expect(a.renderIdentity).not.toBe(b.renderIdentity);expect(a.frameDirectory).not.toBe(b.frameDirectory);await jobs.ready();
  });
});
