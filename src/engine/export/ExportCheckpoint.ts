import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import path from 'node:path';
import type { ExportChunkView, ExportJobView, ExportJobStatus } from '@/types/export';
import type { RenderProfile } from './RenderProfiles';
import { assertNativePng } from './NativeSurface';

export interface LockedExportAudio {
  path: string; sha256: string; approvalEvidence: string; rightsEvidence: string;
  /** Bind an approved mix to this evaluated product/assembly/video definition. */
  creativeHash: string;
}
export interface ExportCheckpoint {
  version: 2; view: ExportJobView; profile: RenderProfile;
  creativeHash: string; rendererSourceHash: string; identityHash: string;
  chunkSize: number; chunks: ExportChunkView[];
  frames: Record<string, string>; missingFrames: number[]; invalidFrames: number[];
  retries: number; lastError?: string; audio?: LockedExportAudio;
  framePadding: number; elapsedMs: number;
}
export const activeExportStates = new Set<ExportJobStatus>(['queued','preparing','rendering','validating_frames','encoding','muxing_audio','verifying','retrying']);
export function chunkPlan(total: number, size: number): ExportChunkView[] {
  if (!Number.isSafeInteger(total) || total < 1 || !Number.isSafeInteger(size) || size < 1) throw new Error('Invalid frame/chunk count.');
  return Array.from({length: Math.ceil(total / size)}, (_, index) => ({ index, start: index * size, end: Math.min(total - 1, (index + 1) * size - 1), status: 'pending', validFrames: 0, retries: 0 }));
}
export const frameName = (index: number, padding = 6) => `frame-${String(index).padStart(padding, '0')}.png`;
export const sha256 = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');

export async function atomicWrite(filename: string, data: string | Uint8Array): Promise<void> {
  await mkdir(path.dirname(filename), {recursive:true});
  const temporary = `${filename}.${randomUUID()}.tmp`;
  await writeFile(temporary, data);
  await rename(temporary, filename);
}
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit=0;bit<8;bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
/** Full CRC/zlib/scanline integrity, not just a PNG signature or file existence. */
export function validateFramePng(bytes: Buffer, profile: Pick<RenderProfile,'id'|'width'|'height'>): void {
  assertNativePng(bytes, profile);
  let offset=8, ended=false, header=false, channels=0; const compressed: Buffer[]=[];
  while (offset+12 <= bytes.length) {
    const length=bytes.readUInt32BE(offset), end=offset+12+length;
    if (end>bytes.length) throw new Error('Truncated PNG chunk.');
    const type=bytes.toString('ascii',offset+4,offset+8);
    if (crc32(bytes.subarray(offset+4,end-4))!==bytes.readUInt32BE(end-4)) throw new Error('PNG CRC mismatch.');
    if (type==='IHDR') {
      if (header || offset!==8 || length!==13 || bytes[offset+16]!==8 || bytes[offset+18]!==0 || bytes[offset+19]!==0 || bytes[offset+20]!==0) throw new Error('Unsupported PNG header.');
      channels=({0:1,2:3,4:2,6:4} as Record<number,number>)[bytes[offset+17]] ?? 0;
      if (!channels) throw new Error('Unsupported PNG color type.');
      header=true;
    } else if (type==='IDAT') compressed.push(bytes.subarray(offset+8,end-4));
    else if (type==='IEND') { if(length!==0) throw new Error('Invalid PNG end.'); ended=true; offset=end; break; }
    offset=end;
  }
  if(!header || !ended || offset!==bytes.length || compressed.length===0) throw new Error('Incomplete PNG.');
  const stride=profile.width*channels+1;
  const decoded=inflateSync(Buffer.concat(compressed),{maxOutputLength:stride*profile.height});
  if(decoded.length!==stride*profile.height) throw new Error('Invalid PNG scanline length.');
  for(let row=0;row<profile.height;row++) if(decoded[row*stride]>4) throw new Error('Invalid PNG filter.');
}
export async function validateFrameFile(filename: string, profile: RenderProfile, expectedHash?: string): Promise<string> {
  const metadata=await lstat(filename);
  if(!metadata.isFile() || metadata.isSymbolicLink()) throw new Error('Frame must be a regular file.');
  const bytes=await readFile(filename); validateFramePng(bytes,profile);
  const hash=sha256(bytes);
  if(expectedHash && expectedHash!==hash) throw new Error('Frame checksum mismatch.');
  return hash;
}
export function overallProgress(status: ExportJobStatus, valid: number, total: number, hasAudio: boolean): number {
  if(status==='completed') return 100;
  if(status==='queued') return 0;
  if(status==='preparing') return 2;
  if(status==='encoding') return 85;
  if(status==='muxing_audio') return 93;
  if(status==='verifying') return hasAudio ? 96 : 94;
  if(status==='validating_frames') return 82;
  return Math.min(80, 5 + Math.floor(75 * valid / total));
}
