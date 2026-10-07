import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readdir, rm, stat, readFile, lstat, open, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Page } from 'playwright';
import type { ProductManager } from '@/engine/product/ProductManager';
import type { ExportJobStatus, ExportJobView } from '@/types/export';
import { profileOutputFilename, resolveRenderProfile, type RenderProfileRequest } from './RenderProfiles';
import { createRenderIdentity, hashVideoDefinition, profileJobDirectoryName, renderIdentityHash } from './RenderIdentity';
import { assertNativeSurface, inspectNativeSurface } from './NativeSurface';
import { activeExportStates, atomicWrite, chunkPlan, frameName, overallProgress, sha256, validateFrameFile, validateFramePng, type ExportCheckpoint } from './ExportCheckpoint';
import { creativeDataHash, creativePackageHash, rendererSourceHash } from './CreativeIdentity';
import { assertFaststart, hashFile, packetFingerprint, processCommand, validateLockedAudio, validateMediaProbe, type MediaProbe } from './ExportMedia';

export interface StartExportOptions extends RenderProfileRequest { productId: string; videoId?: string; origin: string; }
export interface LegacyExportManager {
  get(id:string):ExportJobView|undefined;
  cancel(id:string):Promise<ExportJobView|undefined>;
  readOutput(id:string):Promise<{stream:ReadableStream<Uint8Array>;size:number;filename:string}|undefined>;
}
export interface ExportManagerPolicy {
  legacyManager?: LegacyExportManager;
  storageRoot?: string; chunkSize?: number; maxRetries?: number; recycleEveryChunks?: number;
  frameTimeoutMs?: number; chunkTimeoutMs?: number; encodeTimeoutMs?: number; verifyTimeoutMs?: number;
  sourceHash?: ()=>string;
}
interface InternalJob { checkpoint: ExportCheckpoint; directory: string; cancelRequested: boolean; running: boolean; generation: number; browser?: Browser; encoder?:ChildProcess; execution?:Promise<void>; startedAt?:number; }
export const RENDERER_READY_TIMEOUT_MS = 90_000;
const uuidPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const stoppedStates = new Set<ExportJobStatus>(['interrupted','waiting_for_resume','cancelled','error']);
const transitions: Record<ExportJobStatus, readonly ExportJobStatus[]> = {
  queued:['preparing','cancelled','waiting_for_resume','error'], preparing:['rendering','validating_frames','cancelled','waiting_for_resume','stale','error'],
  rendering:['rendering','retrying','validating_frames','cancelled','waiting_for_resume','stale','error'],
  retrying:['rendering','cancelled','waiting_for_resume','stale','error'],
  validating_frames:['rendering','encoding','cancelled','waiting_for_resume','stale','error'],
  encoding:['muxing_audio','verifying','cancelled','waiting_for_resume','stale','error'],
  muxing_audio:['verifying','cancelled','waiting_for_resume','stale','error'],
  verifying:['completed','cancelled','waiting_for_resume','stale','error'],
  interrupted:['queued','stale','cancelled'],waiting_for_resume:['queued','stale','cancelled'],cancelled:['queued','stale'],error:['queued','stale','cancelled'],
  completed:['stale','error'],stale:[],
};
export function assertExportTransition(from:ExportJobStatus,to:ExportJobStatus):void {
  if(from!==to && !transitions[from].includes(to))throw new Error(`Invalid export state transition: ${from} → ${to}`);
}
class ExportFailure extends Error { constructor(readonly code:string,message:string){super(message);} }
function integer(value:number|undefined,fallback:number,min=1):number {
  const selected=value??fallback;if(!Number.isSafeInteger(selected)||selected<min)throw new Error('Invalid export policy.');return selected;
}
export class ExportJobManager {
  private jobs=new Map<string,InternalJob>();
  private queue:Promise<void>=Promise.resolve();
  private initialization?:Promise<void>;
  readonly storageRoot:string;
  readonly pipelineVersion = 3;
  usesCatalog(manager: ProductManager): boolean { return this.productManager === manager; }
  private readonly legacyManager?:LegacyExportManager;
  private readonly policy:Required<Omit<ExportManagerPolicy,'storageRoot'|'legacyManager'>>;
  constructor(private readonly productManager:ProductManager, policy:ExportManagerPolicy={}) {
    this.legacyManager=policy.legacyManager;
    this.storageRoot=path.resolve(policy.storageRoot??path.join(process.cwd(),'output','export-jobs'));
    this.policy={chunkSize:integer(policy.chunkSize??Number(process.env.EXPORT_CHUNK_SIZE??300),300),maxRetries:integer(policy.maxRetries??Number(process.env.EXPORT_MAX_RETRIES??2),2,0),recycleEveryChunks:integer(policy.recycleEveryChunks??Number(process.env.EXPORT_RECYCLE_CHUNKS??5),5,0),frameTimeoutMs:integer(policy.frameTimeoutMs,60_000),chunkTimeoutMs:integer(policy.chunkTimeoutMs,30*60_000),encodeTimeoutMs:integer(policy.encodeTimeoutMs,2*60*60_000),verifyTimeoutMs:integer(policy.verifyTimeoutMs,60*60_000),sourceHash:policy.sourceHash??(()=>rendererSourceHash())};
  }
  async ready():Promise<void> {
    this.initialization??=this.recover(); await this.initialization;
  }
  private jobView(job:InternalJob):ExportJobView {
    const c=job.checkpoint,v=c.view;
    const elapsed=c.elapsedMs+(job.startedAt?Date.now()-job.startedAt:0);
    return {...v,stage:v.status,validFrames:Object.keys(c.frames).length,completedChunks:c.chunks.filter(x=>x.status==='completed').length,totalChunks:c.chunks.length,chunkSize:c.chunkSize,currentChunk:v.currentChunk?{...c.chunks[v.currentChunk.index]}:undefined,elapsedSeconds:Math.floor(elapsed/1000),canResume:stoppedStates.has(v.status)&&!job.running,canCancel:activeExportStates.has(v.status),canDelete:!job.running&&!activeExportStates.has(v.status),hasAudio:Boolean(c.audio)};
  }
  get(id:string):ExportJobView|undefined {
    const job=this.jobs.get(id);if(job)return this.jobView(job);
    const legacy=this.legacyManager?.get(id);
    return legacy?{...legacy,canResume:false,canDelete:false,canCancel:activeExportStates.has(legacy.status),message:`${legacy.message} Legacy job; resume unavailable.`}:undefined;
  }
  async list(productId:string):Promise<ExportJobView[]> {await this.ready();return [...this.jobs.values()].filter(j=>j.checkpoint.view.productId===productId).map(j=>this.jobView(j)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  start(options:StartExportOptions):ExportJobView {
    if(!this.productManager.has(options.productId))throw new Error(`Unknown product: ${options.productId}`);
    const profile=resolveRenderProfile(options),product=this.productManager.load(options.productId,options.videoId);
    if(options.videoId!==undefined&&options.videoId!==product.video.id)throw new Error('Requested video does not match the selected product package.');
    if(product.video.editorial && (profile.id!=='vertical-1080p'||profile.fps!==30))throw new Error('This Short requires native vertical 1080×1920 / 30 FPS.');
    const id=randomUUID(),videoHash=hashVideoDefinition(product.video),identity=createRenderIdentity(product.id,product.video.id,videoHash,profile);
    const creativeHash=creativePackageHash(product),sourceHash=this.policy.sourceHash();
    const directory=path.join(this.storageRoot,profileJobDirectoryName(id,identity));
    const filename=profileOutputFilename(product.filename,profile),duration=product.video.scenes.reduce((sum,scene)=>sum+scene.duration,0);
    const natural=Math.ceil(duration*profile.fps),limit=Number(process.env.EXPORT_FRAME_LIMIT??natural);
    const totalFrames=Math.min(natural,limit);if(!Number.isSafeInteger(totalFrames)||totalFrames<1)throw new Error('Render frame limit must be a positive integer.');
    const view:ExportJobView={id,productId:product.id,productName:product.label,filename,outputFilename:filename,outputPath:path.join(directory,'final',filename),frameDirectory:path.join(directory,'frames'),profileId:profile.id,profileLabel:profile.label,codec:profile.codec,pixelFormat:profile.pixelFormat,videoId:product.video.id,videoHash,renderIdentity:sha256(JSON.stringify({identity,creativeHash,sourceHash})),creativeHash,width:profile.width,height:profile.height,fps:profile.fps,duration,timelineDuration:duration,frameLimit:totalFrames<natural?totalFrames:undefined,status:'queued',progress:0,progressKind:'indeterminate',currentFrame:0,totalFrames,message:'Waiting to prepare generation…',createdAt:new Date().toISOString()};
    const checkpoint:ExportCheckpoint={version:2,view,profile,creativeHash,rendererSourceHash:sourceHash,identityHash:renderIdentityHash(identity),chunkSize:this.policy.chunkSize,chunks:chunkPlan(totalFrames,this.policy.chunkSize),frames:{},missingFrames:[],invalidFrames:[],retries:0,framePadding:Math.max(6,String(totalFrames-1).length),elapsedMs:0,audio:product.approvedAudioMaster?{...product.approvedAudioMaster}:undefined};
    const job:InternalJob={checkpoint,directory,cancelRequested:false,running:false,generation:0};
    this.jobs.set(id,job);this.schedule(job,options.origin);return this.jobView(job);
  }
  private schedule(job:InternalJob,origin:string):void {
    const generation=++job.generation;
    const run=this.run.bind(this);
    job.execution=this.queue=this.queue.catch(()=>undefined).then(async()=>{
      await this.ready();if(job.generation!==generation||job.cancelRequested||!this.jobs.has(job.checkpoint.view.id))return;
      await run(job,origin);
    }).catch(async(error)=>{
      const v=job.checkpoint.view;v.status='error';v.errorCode='CHECKPOINT_IO_FAILED';v.error=(error as Error).message;v.message='Could not persist generation. Existing work is kept.';
      await this.save(job).catch(()=>undefined);
    });
  }
  private async save(job:InternalJob):Promise<void> {
    const c=job.checkpoint;c.view.updatedAt=new Date().toISOString();
    c.view.validFrames=Object.keys(c.frames).length;c.view.currentFrame=c.view.validFrames;
    c.view.progress=overallProgress(c.view.status,c.view.validFrames,c.view.totalFrames,Boolean(c.audio));
    await atomicWrite(path.join(job.directory,'manifest.json'),JSON.stringify({...c,elapsedMs:c.elapsedMs+(job.startedAt?Date.now()-job.startedAt:0)},null,2));
  }
  private async stage(job:InternalJob,status:ExportJobStatus,message:string):Promise<void> {
    assertExportTransition(job.checkpoint.view.status,status);job.checkpoint.view.status=status;job.checkpoint.view.message=message;
    job.checkpoint.view.progressKind=status==='completed'?'complete':status==='rendering'?'frames':'indeterminate';await this.save(job);
    await mkdir(path.join(job.directory,'logs'),{recursive:true});
    await appendFile(path.join(job.directory,'logs','events.ndjson'),JSON.stringify({at:new Date().toISOString(),status,message,validFrames:Object.keys(job.checkpoint.frames).length,retries:job.checkpoint.retries,errorCode:job.checkpoint.view.errorCode,lastError:job.checkpoint.lastError})+'\n');
  }
  private checkIdentity(job:InternalJob):void {
    const c=job.checkpoint,v=c.view;
    if(!this.productManager.has(v.productId)||creativePackageHash(this.productManager.load(v.productId,v.videoId))!==c.creativeHash||this.policy.sourceHash()!==c.rendererSourceHash)throw new ExportFailure('RENDER_CHECKPOINT_INCOMPATIBLE','Creative sources changed. Start a new generation; old frames are preserved.');
    const profile=resolveRenderProfile({profileId:v.profileId,fps:v.fps});
    const identity=createRenderIdentity(v.productId,v.videoId,v.videoHash,profile);
    if(profile.width!==v.width||profile.height!==v.height||renderIdentityHash(identity)!==c.identityHash||v.renderIdentity!==sha256(JSON.stringify({identity,creativeHash:c.creativeHash,sourceHash:c.rendererSourceHash})))throw new ExportFailure('RENDER_CHECKPOINT_INCOMPATIBLE','Checkpoint profile/FPS/identity mismatch.');
    const packageDuration=this.productManager.load(v.productId,v.videoId).video.scenes.reduce((sum,scene)=>sum+scene.duration,0);
    const expected=Math.min(Math.ceil(packageDuration*v.fps),v.frameLimit??Infinity);
    if(v.timelineDuration!==packageDuration || v.totalFrames!==expected || JSON.stringify(profile)!==JSON.stringify(c.profile))throw new ExportFailure('RENDER_CHECKPOINT_INCOMPATIBLE','Checkpoint timeline/profile changed.');
    const currentAudio=this.productManager.load(v.productId,v.videoId).approvedAudioMaster;
    if(JSON.stringify(currentAudio)!==JSON.stringify(c.audio))throw new ExportFailure('RENDER_CHECKPOINT_INCOMPATIBLE','Approved audio identity changed. Start a new generation.');
  }
  private assertActive(job:InternalJob):void {if(job.cancelRequested)throw new Error('__EXPORT_CANCELLED__');}
  async cancel(id:string):Promise<ExportJobView|undefined> {
    await this.ready();const job=this.jobs.get(id);if(!job)return this.legacyManager?.cancel(id);
    if(!activeExportStates.has(job.checkpoint.view.status))return this.jobView(job);
    job.cancelRequested=true;job.generation++;
    job.encoder?.kill('SIGTERM');await job.browser?.close().catch(()=>undefined);
    if(job.running)await job.execution;
    else await this.stage(job,'cancelled','Generation cancelled. Checkpoint and valid frames kept.');
    return this.jobView(job);
  }
  async resume(id:string,origin:string):Promise<ExportJobView|undefined> {
    await this.ready();const job=this.jobs.get(id);if(!job){if(this.legacyManager?.get(id))throw new Error('Legacy jobs cannot resume without a verified checkpoint. Start a new generation.');return;}
    if(job.running||!stoppedStates.has(job.checkpoint.view.status))throw new Error('Job is not available to resume.');
    try{this.checkIdentity(job);}catch(error){await this.stage(job,'stale',(error as Error).message);job.checkpoint.view.errorCode='RENDER_CHECKPOINT_INCOMPATIBLE';await this.save(job);throw error;}
    job.cancelRequested=false;job.checkpoint.view.error=undefined;job.checkpoint.view.errorCode=undefined;job.checkpoint.retries=0;
    for(const chunk of job.checkpoint.chunks)chunk.retries=0;
    await this.stage(job,'queued','Resume queued. Existing frames will be validated.');this.schedule(job,origin);return this.jobView(job);
  }
  async delete(id:string):Promise<boolean> {
    await this.ready();if(!uuidPattern.test(id))throw new Error('Invalid export job ID.');
    const job=this.jobs.get(id);if(!job)return false;
    await this.cancel(id);job.generation++;
    // Only manager-owned isolated directories can be removed. No request contains a filesystem path.
    if(path.dirname(job.directory)!==this.storageRoot)throw new Error('Unsafe job directory.');
    await rm(job.directory,{recursive:true,force:true});this.jobs.delete(id);return true;
  }
  async readOutput(id:string):Promise<{stream:ReadableStream<Uint8Array>;size:number;filename:string}|undefined> {
    await this.ready();const job=this.jobs.get(id);if(!job)return this.legacyManager?.readOutput(id);if(job.checkpoint.view.status!=='completed')return;
    const v=job.checkpoint.view,metadata=await lstat(v.outputPath);
    if(!metadata.isFile()||await hashFile(v.outputPath)!==v.sha256)throw new Error('Final artifact integrity check failed.');
    return {stream:Readable.toWeb(createReadStream(v.outputPath)) as ReadableStream<Uint8Array>,size:metadata.size,filename:v.filename};
  }
  private async reconcile(job:InternalJob):Promise<void> {
    const c=job.checkpoint;c.missingFrames=[];c.invalidFrames=[];
    try { const directory=await lstat(c.view.frameDirectory); if(!directory.isDirectory() || directory.isSymbolicLink())throw new ExportFailure('RENDER_CHECKPOINT_INCOMPATIBLE','Frame directory is not an owned regular directory.'); }
    catch(error) { if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error; }
    for(let index=0;index<c.view.totalFrames;index++){
      this.assertActive(job);
      const filename=path.join(c.view.frameDirectory,frameName(index,c.framePadding));
      try{c.frames[String(index)]=await validateFrameFile(filename,c.profile,c.frames[String(index)]);}
      catch(error){delete c.frames[String(index)];if((error as NodeJS.ErrnoException).code==='ENOENT')c.missingFrames.push(index);else c.invalidFrames.push(index);}
    }
    for(const chunk of c.chunks){chunk.validFrames=Array.from({length:chunk.end-chunk.start+1},(_,i)=>c.frames[String(chunk.start+i)]).filter(Boolean).length;chunk.status=chunk.validFrames===chunk.end-chunk.start+1?'completed':'pending';}
    await this.save(job);
  }
  private async renderer(job:InternalJob,origin:string):Promise<Page> {
    const v=job.checkpoint.view;job.browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});this.assertActive(job);
    const page=await job.browser.newPage({viewport:{width:v.width,height:v.height},deviceScaleFactor:1});
    page.setDefaultTimeout(this.policy.frameTimeoutMs);
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    const url=new URL('/render',origin);url.searchParams.set('project',v.productId);url.searchParams.set('video',v.videoId);url.searchParams.set('profile',v.profileId);url.searchParams.set('fps',String(v.fps));
    try{
      await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:60_000});
      await page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready===true,undefined,{timeout:RENDERER_READY_TIMEOUT_MS});
    }catch(error){throw new ExportFailure('RENDERER_READINESS_TIMEOUT',`waiting for deterministic WebGL renderer ready: ${(error as Error).message}`);}
    this.assertActive(job);
    const metadata=await page.evaluate(()=>({duration:window.__VIDEO_RENDERER__!.getDuration(),creative:window.__VIDEO_RENDERER__!.getCreativeDefinition?.()}));
    if(Math.abs(metadata.duration-v.timelineDuration)>1e-6||sha256(JSON.stringify(metadata.creative))!==creativeDataHash(this.productManager.load(v.productId,v.videoId)))throw new ExportFailure('RENDER_CHECKPOINT_INCOMPATIBLE','Loaded renderer creative definition differs from frozen job.');
    try{assertNativeSurface(await page.evaluate(inspectNativeSurface),job.checkpoint.profile);}catch(error){throw new ExportFailure('RENDER_RESOURCE_LIMIT',(error as Error).message);}
    if(errors.length)throw new Error(errors.join('; '));
    page.on('pageerror',()=>{void job.browser?.close();});return page;
  }
  private async render(job:InternalJob,origin:string):Promise<void> {
    let page:Page|undefined;const c=job.checkpoint;let completedSinceRecycle=0;
    for(const chunk of c.chunks){
      if(chunk.status==='completed')continue;
      this.assertActive(job);this.checkIdentity(job);c.view.currentChunk=chunk;
      const deadline=Date.now()+this.policy.chunkTimeoutMs;
      await this.stage(job,'rendering',`Rendering work chunk ${chunk.index+1} of ${c.chunks.length}…`);chunk.status='rendering';
      for(let index=chunk.start;index<=chunk.end;index++){
        if(c.frames[String(index)])continue;
        let succeeded=false;
        for(let attempt=0;attempt<=this.policy.maxRetries;attempt++){
          this.assertActive(job);
          try{
            if(Date.now()>deadline)throw new ExportFailure('CHUNK_TIMEOUT','Chunk time budget exhausted; validated frames kept.');
            page??=await this.renderer(job,origin);
            let timeout:NodeJS.Timeout|undefined;
            const capture=async()=>{
              await page!.evaluate(time=>window.__VIDEO_RENDERER__!.renderFrame(time),index/c.view.fps);
              const bytes=await page!.screenshot({type:'png',animations:'disabled',timeout:this.policy.frameTimeoutMs});
              return bytes;
            };
            let captured:Buffer;
            try{captured=await Promise.race([capture(),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(new ExportFailure('FRAME_TIMEOUT',`Frame ${index} timed out.`)),this.policy.frameTimeoutMs);})]);}
            finally{if(timeout)clearTimeout(timeout);}
            this.assertActive(job);validateFramePng(captured!,c.profile);
            await atomicWrite(path.join(c.view.frameDirectory,frameName(index,c.framePadding)),captured!);c.frames[String(index)]=sha256(captured!);
            chunk.validFrames++;c.missingFrames=c.missingFrames.filter(f=>f!==index);c.invalidFrames=c.invalidFrames.filter(f=>f!==index);await this.save(job);succeeded=true;break;
          }catch(error){
            await job.browser?.close().catch(()=>undefined);job.browser=undefined;page=undefined;this.assertActive(job);
            if(error instanceof ExportFailure&&['CHUNK_TIMEOUT','RENDER_CHECKPOINT_INCOMPATIBLE','RENDER_RESOURCE_LIMIT'].includes(error.code))throw error;
            c.lastError=(error as Error).message;
            if(attempt===this.policy.maxRetries)throw new ExportFailure(error instanceof ExportFailure?error.code:'FRAME_RENDER_FAILED',`Retry budget exhausted at frame ${index}: ${c.lastError}`);
            chunk.retries++;c.retries++;await this.stage(job,'retrying',`Retrying frame ${index+1}; valid work kept.`);await this.stage(job,'rendering',`Rendering work chunk ${chunk.index+1}…`);
          }
        }
        if(!succeeded)throw new Error('Frame capture did not complete.');
      }
      chunk.status='completed';await this.save(job);completedSinceRecycle++;
      if(this.policy.recycleEveryChunks>0&&completedSinceRecycle>=this.policy.recycleEveryChunks){await job.browser?.close();job.browser=undefined;page=undefined;completedSinceRecycle=0;}
    }
    await job.browser?.close();job.browser=undefined;
  }
  private async command(job:InternalJob,command:string,args:string[],timeout:number):Promise<string> {
    await mkdir(path.join(job.directory,'logs'),{recursive:true});
    await appendFile(path.join(job.directory,'logs','commands.ndjson'),JSON.stringify({at:new Date().toISOString(),command,args,timeout})+'\n');
    try { return await processCommand(command,args,timeout,child=>{job.encoder=child;},()=>job.cancelRequested); }
    catch(error) {await appendFile(path.join(job.directory,'logs','commands.ndjson'),JSON.stringify({at:new Date().toISOString(),command,error:(error as Error).message})+'\n');throw error;}
  }
  private async probe(job:InternalJob,file:string):Promise<MediaProbe> {
    return JSON.parse(await this.command(job,'ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',file],this.policy.verifyTimeoutMs)) as MediaProbe;
  }
  private async encode(job:InternalJob):Promise<void> {
    const c=job.checkpoint,v=c.view;
    await mkdir(path.join(job.directory,'final'),{recursive:true});
    await this.command(job,'ffmpeg',['-y','-framerate',String(v.fps),'-start_number','0','-i',path.join(v.frameDirectory,`frame-%0${c.framePadding}d.png`),'-frames:v',String(v.totalFrames),'-c:v',c.profile.encoder,'-pix_fmt',v.pixelFormat,'-movflags','+faststart','-r',String(v.fps),'-an',path.join(job.directory,'silent.mp4')],this.policy.encodeTimeoutMs);
    if(c.audio){
      await this.stage(job,'muxing_audio','Muxing approved locked audio…');
      await validateLockedAudio(c,file=>this.probe(job,file));
      await this.command(job,'ffmpeg',['-y','-i',path.join(job.directory,'silent.mp4'),'-i',c.audio.path,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-movie_timescale','48000','-movflags','+faststart',v.outputPath],this.policy.encodeTimeoutMs);
    }else{
      const {copyFile}=await import('node:fs/promises');await copyFile(path.join(job.directory,'silent.mp4'),v.outputPath);
    }
  }
  private async verify(job:InternalJob):Promise<void> {
    const c=job.checkpoint,v=c.view;const media=await this.probe(job,v.outputPath);validateMediaProbe(media,c);
    await this.command(job,'ffmpeg',['-v','error','-xerror','-i',v.outputPath,'-map','0:v:0','-map','0:a?','-f','null','-'],this.policy.verifyTimeoutMs);
    await assertFaststart(v.outputPath);
    if(c.audio){
      const run=(args:string[])=>this.command(job,'ffprobe',args,this.policy.verifyTimeoutMs);
      const silent=await packetFingerprint(path.join(job.directory,'silent.mp4'),run,path.join(job.directory,'logs','silent-packets.txt'));
      const final=await packetFingerprint(v.outputPath,run,path.join(job.directory,'logs','final-packets.txt'));
      if(silent!==final)throw new Error('Mux changed ordered video packets/timestamps.');
      await validateLockedAudio(c,file=>this.probe(job,file));
    }
    this.checkIdentity(job);v.sha256=await hashFile(v.outputPath);v.fileSize=(await stat(v.outputPath)).size;v.outputDuration=v.totalFrames/v.fps;
    await atomicWrite(path.join(job.directory,'logs','verification.json'),JSON.stringify({status:'PASS',media,sha256:v.sha256,fileSize:v.fileSize,fullDecode:'PASS',faststart:'PASS',videoStreamIdentity:c.audio?'PASS':'NOT APPLICABLE: silent encode'},null,2));
  }
  private async workerLock(job:InternalJob):Promise<()=>Promise<void>> {
    await mkdir(this.storageRoot,{recursive:true});const filename=path.join(this.storageRoot,'.worker-lock');
    const deadline=Date.now()+60_000;
    while(true){
      this.assertActive(job);
      if(Date.now()>deadline)throw new ExportFailure('RENDER_WORKER_BUSY','Another render worker is active or its lock needs recovery. Valid work kept.');
      try{
        const handle=await open(filename,'wx');await handle.writeFile(JSON.stringify({pid:process.pid,job:job.checkpoint.view.id}));await handle.close();return ()=>rm(filename,{force:true});
      }catch(error){
        if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;
        try{
          const lock=JSON.parse(await readFile(filename,'utf8')) as {pid:number};
          if(!Number.isSafeInteger(lock.pid)||lock.pid<1)throw new Error('Invalid worker lock.');
          try{process.kill(lock.pid,0);}catch(error){if((error as NodeJS.ErrnoException).code==='ESRCH'){await rm(filename,{force:true});continue;}}
        }catch{ /* A concurrent atomic lock creation is not permission to steal it. */ }
        await new Promise(resolve=>setTimeout(resolve,250));
      }
    }
  }
  private async run(job:InternalJob,origin:string):Promise<void> {
    job.running=true;job.startedAt=Date.now();let release:(()=>Promise<void>)|undefined;
    try{
      await this.save(job);release=await this.workerLock(job);this.assertActive(job);
      await mkdir(job.checkpoint.view.frameDirectory,{recursive:true});await mkdir(path.join(job.directory,'logs'),{recursive:true});
      for(const name of ['', 'frames', 'logs', 'final']) {
        const directory=path.join(job.directory,name);await mkdir(directory,{recursive:true});
        const info=await lstat(directory);if(!info.isDirectory()||info.isSymbolicLink())throw new ExportFailure('RENDER_CHECKPOINT_INCOMPATIBLE','Unsafe export job directory.');
      }
      await this.stage(job,'preparing','Preparing generation and validating saved work…');this.checkIdentity(job);
      await validateLockedAudio(job.checkpoint,file=>this.probe(job,file));
      await this.reconcile(job);
      await this.stage(job,'rendering','Rendering missing or invalid frames…');await this.render(job,origin);
      await this.stage(job,'validating_frames','Validating the complete frame sequence…');await this.reconcile(job);
      if(job.checkpoint.missingFrames.length||job.checkpoint.invalidFrames.length||Object.keys(job.checkpoint.frames).length!==job.checkpoint.view.totalFrames)throw new ExportFailure('FRAME_VALIDATION_FAILED','Frame validation failed. Resume will repair missing/invalid work.');
      this.assertActive(job);this.checkIdentity(job);await this.stage(job,'encoding','Encoding validated frames…');
      try{await this.encode(job);}catch(error){if(job.cancelRequested)throw error;throw new ExportFailure('ENCODE_FAILED',(error as Error).message);}
      this.assertActive(job);await this.stage(job,'verifying','Verifying final video…');
      try{await this.verify(job);}catch(error){if(job.cancelRequested)throw error;throw new ExportFailure('FINAL_QA_FAILED',(error as Error).message);}
      this.assertActive(job);job.checkpoint.view.downloadUrl=`/api/export/${job.checkpoint.view.id}/download`;await this.stage(job,'completed','Generation complete. Ready to download.');
    }catch(error){
      await job.browser?.close().catch(()=>undefined);job.browser=undefined;
      const v=job.checkpoint.view;
      job.checkpoint.lastError=(error as Error).message;
      v.error=job.cancelRequested?undefined:(error as Error).message;v.errorCode=job.cancelRequested?undefined:error instanceof ExportFailure?error.code:'JOB_INTERRUPTION';
      await this.stage(job,job.cancelRequested?'cancelled':v.errorCode==='RENDER_CHECKPOINT_INCOMPATIBLE'?'stale':'waiting_for_resume',job.cancelRequested?'Generation cancelled. Valid frames kept.':'Generation stopped. Checkpoint and valid frames kept.').catch(()=>undefined);
    }finally{
      if(job.startedAt)job.checkpoint.elapsedMs+=Date.now()-job.startedAt;job.startedAt=undefined;job.running=false;
      await this.save(job).catch(()=>undefined);await release?.();
    }
  }
  private async recover():Promise<void> {
    await mkdir(this.storageRoot,{recursive:true});const entries=await readdir(this.storageRoot,{withFileTypes:true});
    for(const entry of entries){
      if(!entry.isDirectory()||!entry.name.startsWith('render-'))continue;
      const directory=path.join(this.storageRoot,entry.name);
      try{
        if((await lstat(directory)).isSymbolicLink())continue;
        const c=JSON.parse(await readFile(path.join(directory,'manifest.json'),'utf8')) as ExportCheckpoint;
        if(c.version!==2||!uuidPattern.test(c.view?.id)||!transitions[c.view.status]||this.jobs.has(c.view.id))continue;
        const identity=createRenderIdentity(c.view.productId,c.view.videoId,c.view.videoHash,resolveRenderProfile({profileId:c.view.profileId,fps:c.view.fps}));
        if(entry.name!==profileJobDirectoryName(c.view.id,identity)||c.view.frameDirectory!==path.join(directory,'frames')||c.view.outputPath!==path.join(directory,'final',profileOutputFilename(c.view.filename,c.profile))||!Number.isSafeInteger(c.view.totalFrames)||c.view.totalFrames<1||c.framePadding!==Math.max(6,String(c.view.totalFrames-1).length)||c.chunks.length!==chunkPlan(c.view.totalFrames,c.chunkSize).length)continue;
        const planned=chunkPlan(c.view.totalFrames,c.chunkSize);
        if(c.chunks.some((x,i)=>x.start!==planned[i].start||x.end!==planned[i].end||x.index!==i)||Object.keys(c.frames).some(i=>!/^\d+$/.test(i)||Number(i)>=c.view.totalFrames))continue;
        const job:InternalJob={checkpoint:c,directory,cancelRequested:false,running:false,generation:0};this.jobs.set(c.view.id,job);
        // Never adopt a job being processed by another live server.
        let live=false;try{const lock=JSON.parse(await readFile(path.join(this.storageRoot,'.worker-lock'),'utf8'));process.kill(lock.pid,0);live=lock.job===c.view.id;}catch{}
        if(live){this.jobs.delete(c.view.id);continue;}
        if(activeExportStates.has(c.view.status)){c.view.status='interrupted';c.view.message='Server interrupted. Resume generation to validate saved work.';c.view.errorCode='PROCESS_INTERRUPTION';}
        try{this.checkIdentity(job);}catch{c.view.status='stale';c.view.errorCode='RENDER_CHECKPOINT_INCOMPATIBLE';c.view.message='Creative sources changed. Start a new generation.';}
        if(c.view.status!=='stale'&&c.view.status!=='completed')await this.reconcile(job);
        if(c.view.status==='completed') {
          try {if(await hashFile(c.view.outputPath)!==c.view.sha256)throw new Error('Hash mismatch.');}
          catch {c.view.status='error';c.view.message='Final artifact missing or failed integrity check. Resume to rebuild from validated frames.';c.view.errorCode='FINAL_QA_FAILED';c.view.downloadUrl=undefined;}
        }
        await this.save(job);
      }catch{/* Legacy/corrupt/unidentified manifests are non-resumable and never deleted or assigned invented identities. */}
    }
  }
  /** Legacy hook now reconciles durable jobs instead of deleting resumable work. */
  async cleanupOrphans():Promise<void> {await this.ready();}
}
