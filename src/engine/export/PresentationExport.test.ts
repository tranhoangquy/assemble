import { it,expect,vi } from 'vitest';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ProductManager } from '@/engine/product/ProductManager';
import { getProductPackage,defaultProductId } from '@/products/registry';
import { selectVideoId } from '@/engine/video/PresentationSelection';
import { ExportJobManager } from './ExportJobManager';
it('freezes requestedShort in the existing export and recovers its video identity',async()=>{
 const p=getProductPackage(defaultProductId),root=await mkdtemp(path.join(tmpdir(),'short-export-'));
 const manager={has:(id:string)=>id===p.id,load:(_id:string,videoId?:string)=>selectVideoId(p,videoId)} as ProductManager;
 const first=new ExportJobManager(manager,{storageRoot:root,sourceHash:()=> 'frozen-test-source'});
 const mock=vi.spyOn(first as unknown as {run:()=>Promise<void>},'run').mockResolvedValue(undefined);
 try {
  const long=first.start({productId:p.id,profileId:'1080p',origin:'http://localhost'});
  const short=first.start({productId:p.id,videoId:p.shortPresentation!.video.id,profileId:'vertical-1080p',origin:'http://localhost'});
  await first.ready();await first.cancel(short.id);await first.cancel(long.id);
  expect(short).toMatchObject({productId:p.id,videoId:p.shortPresentation!.video.id,width:1080,height:1920,totalFrames:1740,duration:58});
  expect(long).toMatchObject({videoId:p.video.id,width:1920,height:1080});expect(short.frameDirectory).not.toBe(long.frameDirectory);expect(short.creativeHash).not.toBe(long.creativeHash);
  expect(first.get(short.id)?.videoId).toBe(short.videoId);
  const recovered=new ExportJobManager(manager,{storageRoot:root,sourceHash:()=> 'frozen-test-source'});await recovered.ready();expect(recovered.get(short.id)).toMatchObject({videoId:short.videoId,profileId:'vertical-1080p',canResume:true,status:'cancelled'});
  expect(()=>first.start({productId:p.id,videoId:short.videoId,profileId:'1080p',origin:'http://localhost'})).toThrow('native vertical');
 } finally {mock.mockRestore();await rm(root,{recursive:true,force:true});}
});
