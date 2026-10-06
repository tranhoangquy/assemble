import { spawn, type ChildProcess } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { lstat, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { ExportCheckpoint } from './ExportCheckpoint';
import { sha256 } from './ExportCheckpoint';
export async function hashFile(filename: string): Promise<string> {
  const hash=createHash('sha256');
  for await(const bytes of createReadStream(filename)) hash.update(bytes);
  return hash.digest('hex');
}
export function processCommand(command: string, args: string[], timeout: number, setChild: (child?:ChildProcess)=>void, cancelled:()=>boolean): Promise<string> {
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:['ignore','pipe','pipe']}); setChild(child);
    let output='',errors='',expired=false;
    const timer=setTimeout(()=>{expired=true;child.kill('SIGKILL');},timeout);
    child.stdout?.on('data', bytes=>{output=(output+String(bytes)).slice(-2_000_000);});
    child.stderr?.on('data', bytes=>{errors=(errors+String(bytes)).slice(-6000);});
    child.once('error',error=>{clearTimeout(timer);setChild();reject(error);});
    child.once('close',code=>{
      clearTimeout(timer);setChild();
      if(cancelled()) reject(new Error('__EXPORT_CANCELLED__'));
      else if(expired) reject(new Error(`${command} timeout.`));
      else if(code!==0) reject(new Error(`${command} failed (exit ${code}): ${errors.slice(-1200)}`));
      else resolve(output);
    });
  });
}
export interface MediaProbe { streams: {codec_type:string;codec_name:string;pix_fmt?:string;width?:number;height?:number;avg_frame_rate?:string;nb_read_frames?:string;duration?:string;sample_rate?:string;channels?:number;bit_rate?:string}[]; format: {duration:string;size:string}; }
export function validateMediaProbe(probe: MediaProbe, checkpoint: ExportCheckpoint): void {
  const v=checkpoint.view,video=probe.streams.find(s=>s.codec_type==='video'),audios=probe.streams.filter(s=>s.codec_type==='audio');
  if(!video || video.width!==v.width || video.height!==v.height || video.codec_name!==v.codec || video.pix_fmt!==v.pixelFormat || Number(video.nb_read_frames)!==v.totalFrames) throw new Error('Output video profile/frame count mismatch.');
  const [n,d]=(video.avg_frame_rate??'0/1').split('/').map(Number);
  if(n/d!==v.fps || Math.abs(Number(probe.format.duration)-v.totalFrames/v.fps)>1/v.fps) throw new Error('Output timing mismatch.');
  if(checkpoint.audio) {
    if(audios.length!==1 || audios[0].codec_name!=='aac' || audios[0].sample_rate!=='48000' || audios[0].channels!==2 || Math.abs(Number(audios[0].duration)-v.totalFrames/v.fps)>1/v.fps) throw new Error('Output audio properties/duration mismatch.');
  } else if(audios.length) throw new Error('Silent output unexpectedly contains audio.');
}
export async function assertFaststart(file:string):Promise<void> {
  // Read box headers via positioned reads; never buffer the whole master.
  const {open}=await import('node:fs/promises'); const handle=await open(file,'r');
  try{
    const size=(await handle.stat()).size;let offset=0,moov=-1,mdat=-1;
    while(offset+8<=size){
      const bytes=Buffer.alloc(16);await handle.read(bytes,0,16,offset);
      let length=bytes.readUInt32BE(0);const type=bytes.toString('ascii',4,8);
      if(length===1) length=Number(bytes.readBigUInt64BE(8));
      if(length===0) length=size-offset;
      if(!Number.isSafeInteger(length)||length<8||offset+length>size)throw new Error('Invalid MP4 box.');
      if(type==='moov')moov=offset;if(type==='mdat')mdat=offset;offset+=length;
    }
    if(moov<0||mdat<0||moov>mdat)throw new Error('MP4 faststart verification failed.');
  } finally {await handle.close();}
}
export async function validateLockedAudio(checkpoint: ExportCheckpoint, probe:(file:string)=>Promise<MediaProbe>): Promise<void> {
  const audio=checkpoint.audio;if(!audio)return;
  if(!audio.approvalEvidence?.trim() || !audio.rightsEvidence?.trim() || audio.creativeHash!==checkpoint.creativeHash || !/^[a-f0-9]{64}$/.test(audio.sha256))throw new Error('Approved audio is not bound to this creative revision.');
  if(!(await lstat(audio.path)).isFile() || await hashFile(audio.path)!==audio.sha256) throw new Error('Approved audio hash mismatch.');
  const media=await probe(audio.path);
  if(!media.streams.some(s=>s.codec_type==='audio') || Math.abs(Number(media.format.duration)-checkpoint.view.totalFrames/checkpoint.view.fps)>1/checkpoint.view.fps)throw new Error('Approved audio duration does not match export. No music rebuilding or looping is allowed.');
}
export async function packetFingerprint(file:string, run:(args:string[])=>Promise<string>, destination:string): Promise<string> {
  // ffprobe writes packet hashes to a file through its output option. No whole packet list retained in Node memory.
  await run(['-v','error','-select_streams','v:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=pts,dts,duration,size,flags,data_hash','-of','compact','-o',destination,file]);
  return hashFile(destination);
}
// Useful for small test probes and logs; not used to load media into RAM.
export const evidenceHash = async (file:string) => sha256(await readFile(file));
