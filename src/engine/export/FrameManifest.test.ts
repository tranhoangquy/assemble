import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prepareFrameManifest, type FrameManifest } from './FrameManifest';
import { createRenderIdentity, renderIdentityHash } from './RenderIdentity';
import { getRenderProfile } from './RenderProfiles';

const temporaryDirectories:string[]=[];
async function directory(){const result=await mkdtemp(path.join(tmpdir(),'render-manifest-unit-'));temporaryDirectories.push(result);return result;}
function manifest(frameDirectory:string,profileId='720p'):FrameManifest{
  const identity=createRenderIdentity('generic-product','generic-video','sha-unchanged',getRenderProfile(profileId));
  return{identity,identityHash:renderIdentityHash(identity),frameDirectory,outputPath:path.join(frameDirectory,`review-${profileId}.mp4`),totalFrames:60,timelineDuration:2,createdAt:'test'};
}
afterEach(async()=>{for(const item of temporaryDirectories.splice(0))await rm(item,{recursive:true,force:true});});
describe('isolated frame manifest/resume',()=>{
  it('writes fresh identity and accepts exact same-profile contiguous nonempty resume',async()=>{
    const folder=await directory(),spec=manifest(folder);
    await prepareFrameManifest(folder,spec);
    await writeFile(path.join(folder,'frame-000000.png'),new Uint8Array(24));
    await expect(prepareFrameManifest(folder,spec,1)).resolves.toBeUndefined();
    await expect(prepareFrameManifest(folder,spec)).rejects.toThrow('already contains a render');
  });
  it('rejects cross-profile reuse even when physical sizes are identical',async()=>{
    const folder=await directory();await prepareFrameManifest(folder,manifest(folder));
    await expect(prepareFrameManifest(folder,manifest(folder,'1280x720'),1)).rejects.toThrow('profileId');
    await expect(prepareFrameManifest(folder,manifest(folder,'2160p'),1)).rejects.toThrow('identity mismatch');
  });
  it('rejects historical/no-manifest, missing frames, zero-byte and changed range',async()=>{
    const historical=await directory();await writeFile(path.join(historical,'frame-000000.png'),new Uint8Array(24));
    await expect(prepareFrameManifest(historical,manifest(historical),1)).rejects.toThrow('requires a verified');
    const folder=await directory(),spec=manifest(folder);await prepareFrameManifest(folder,spec);
    await expect(prepareFrameManifest(folder,spec,1)).rejects.toThrow('Missing cached frame');
    await writeFile(path.join(folder,'frame-000000.png'),new Uint8Array());
    await expect(prepareFrameManifest(folder,spec,1)).rejects.toThrow('missing or empty');
    await expect(prepareFrameManifest(folder,{...spec,totalFrames:61},1)).rejects.toThrow('timeline/range');
  });
});
