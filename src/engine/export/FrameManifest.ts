import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertRenderIdentity, renderIdentityHash, type RenderIdentity } from './RenderIdentity';

export interface FrameManifest {
  identity: RenderIdentity;
  identityHash: string;
  frameDirectory: string;
  outputPath: string;
  totalFrames: number;
  timelineDuration: number;
  createdAt: string;
}

/** Only an exact, explicit resume of this same candidate/profile may reuse
 * frames. New runs never overwrite existing frame sequences or manifests. */
export async function prepareFrameManifest(directory: string, manifest: FrameManifest, resumeFrame = 0): Promise<void> {
  if (!Number.isSafeInteger(resumeFrame) || resumeFrame < 0 || resumeFrame > manifest.totalFrames) throw new Error('Invalid resume frame.');
  await mkdir(directory, { recursive: true });
  const manifestPath = path.join(directory, 'render-manifest.json');
  const existing = await readdir(directory);
  if (resumeFrame === 0) {
    if (existing.includes('render-manifest.json') || existing.some(name => /^frame-\d+\.png$/.test(name))) {
      throw new Error('Frame directory already contains a render; use a fresh isolated directory or an explicit same-identity resume.');
    }
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), { flag: 'wx' });
    return;
  }
  let previous: FrameManifest;
  try { previous = JSON.parse(await readFile(manifestPath, 'utf8')) as FrameManifest; }
  catch { throw new Error('Resume requires a verified render-manifest.json; historical/unidentified frames cannot be reused.'); }
  assertRenderIdentity(manifest.identity, previous.identity);
  if (previous.identityHash !== renderIdentityHash(manifest.identity)) throw new Error('Frame cache identity hash does not match the requested render.');
  if (previous.totalFrames !== manifest.totalFrames || previous.timelineDuration !== manifest.timelineDuration) throw new Error('Frame cache timeline/range differs from the requested render.');
  for (let frame = 0; frame < resumeFrame; frame++) {
    const name = `frame-${String(frame).padStart(6, '0')}.png`;
    if (!existing.includes(name)) throw new Error(`Missing cached frame ${frame}.`);
    const info = await stat(path.join(directory, name));
    if (!info.isFile() || info.size < 24) throw new Error(`Cached frame ${frame} is missing or empty.`);
  }
}
