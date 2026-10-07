import { afterEach, describe, expect, it, vi } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import type { ProductManager } from '@/engine/product/ProductManager';
import type { ProductPackage } from '@/types/product-package';
import { ExportJobManager, RENDERER_READY_TIMEOUT_MS } from './ExportJobManager';
import { hashVideoDefinition } from './RenderIdentity';

const entry={id:'generic-product',label:'Generic product',filename:'generic-review.mp4',video:{id:'generic-video',scenes:[{duration:2,actions:[]}]}} as unknown as ProductPackage;
const createdManagers: ExportJobManager[] = [];
function newManager(products:ProductManager) {
  const jobs=new ExportJobManager(products,{ storageRoot:path.join(tmpdir(),`profile-export-test-${randomUUID()}`),maxRetries:0 });
  createdManagers.push(jobs);return jobs;
}
function manager(){
  const products={has:(id:string)=>id===entry.id,load:()=>entry} as unknown as ProductManager;
  const result=newManager(products);
  // Unit tests never launch browsers/render jobs. The real production workflow
  // is separately audited through the actual API/browser with no mocks.
  vi.spyOn(result as unknown as{run:(job:unknown,origin:string)=>Promise<void>},'run').mockResolvedValue(undefined);
  return result;
}
afterEach(async()=>{
  for(const jobs of createdManagers.splice(0)){await jobs.ready();for(const job of await jobs.list(entry.id))await jobs.delete(job.id);await rm(jobs.storageRoot,{recursive:true,force:true});}
  vi.restoreAllMocks();vi.unstubAllGlobals();
});
describe('render-job profile propagation',()=>{
  it.each([['720p',1280,720],['1080p',1920,1080],['1440p',2560,1440],['2160p',3840,2160]] as const)('carries one authoritative%s profile through publicjob/output/isolation', (profileId,width,height)=>{
    const jobs=manager(),job=jobs.start({productId:entry.id,profileId,origin:'http://127.0.0.1:3017'});
    expect(job).toMatchObject({profileId,width,height,fps:30,codec:'h264',pixelFormat:'yuv420p',videoId:entry.video.id,videoHash:hashVideoDefinition(entry.video),timelineDuration:2,totalFrames:60,status:'queued',progressKind:'indeterminate'});
    expect(job.outputFilename).toBe(`generic-review-${profileId}.mp4`);
    expect(job.filename).toBe(job.outputFilename);
    expect(job.outputPath.endsWith(job.outputFilename)).toBe(true);
    expect(job.frameDirectory).toContain(`render-${profileId}-`);
    expect(jobs.get(job.id)).toEqual(job);
  });
  it('keeps old width/height30/60 requests and distinctsame-sizeprofile identity',()=>{
    const jobs=manager(),legacy=jobs.start({productId:entry.id,width:1280,height:720,fps:60,origin:'http://127.0.0.1:3017'});
    const standard=jobs.start({productId:entry.id,profileId:'720p',fps:60,origin:'http://127.0.0.1:3017'});
    expect(legacy).toMatchObject({profileId:'1280x720',fps:60,totalFrames:120});
    expect(legacy.renderIdentity).not.toBe(standard.renderIdentity);
    expect(legacy.frameDirectory).not.toBe(standard.frameDirectory);
  });
  it('rejects unknown profiles/products/mismatchedvideo before invoking a render',()=>{
    const jobs=manager();
    expect(()=>jobs.start({productId:entry.id,profileId:'unknown',origin:'http://127.0.0.1'})).toThrow('Unknown render profile');
    expect(()=>jobs.start({productId:'unknown',profileId:'720p',origin:'http://127.0.0.1'})).toThrow('Unknown product');
    expect(()=>jobs.start({productId:entry.id,videoId:'another-video',profileId:'720p',origin:'http://127.0.0.1'})).toThrow('does not match');
  });
  it('uses the existing CLI readiness budget in the real job lifecycle without changing navigation or starting a capture',async()=>{
    const products={has:(id:string)=>id===entry.id,load:()=>entry} as unknown as ProductManager;
    const jobs=newManager(products);
    // Exercise the real run until its readiness wait, then stop deliberately.
    // No browser or encoder is launched. Only this job's unique owned temporary
    // manifest is written, and real error cleanup removes that directory.
    const page={
      on:vi.fn(),
      setDefaultTimeout:vi.fn(),
      goto:vi.fn().mockResolvedValue(undefined),
      waitForFunction:vi.fn().mockRejectedValue(new Error('controlled readiness stop')),
      evaluate:vi.fn(),
      screenshot:vi.fn(),
    };
    const browser={newPage:vi.fn().mockResolvedValue(page),close:vi.fn().mockResolvedValue(undefined)};
    const launch=vi.spyOn(chromium,'launch').mockResolvedValue(browser as unknown as Browser);
    const run=vi.spyOn(jobs as unknown as{run:(job:unknown,origin:string)=>Promise<void>},'run');
    const job=jobs.start({productId:entry.id,profileId:'720p',origin:'http://127.0.0.1:3017'});
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    await run.mock.results[0].value;

    expect(launch).toHaveBeenCalledTimes(1);
    expect(launch).toHaveBeenCalledWith({headless:true,executablePath:chromium.executablePath()});
    expect(browser.newPage).toHaveBeenCalledWith({viewport:{width:1280,height:720},deviceScaleFactor:1});
    expect(page.goto).toHaveBeenCalledWith(
      'http://127.0.0.1:3017/render?project=generic-product&video=generic-video&profile=720p&fps=30',
      {waitUntil:'domcontentloaded',timeout:60_000},
    );
    expect(RENDERER_READY_TIMEOUT_MS).toBe(90_000);
    expect(page.waitForFunction).toHaveBeenCalledTimes(1);
    expect(page.waitForFunction).toHaveBeenCalledWith(expect.any(Function),undefined,{timeout:90_000});
    const predicate=page.waitForFunction.mock.calls[0][0] as ()=>boolean;
    const fakeWindow:{__VIDEO_RENDERER__?:{ready:unknown}}={};
    vi.stubGlobal('window',fakeWindow);
    expect(predicate()).toBe(false);
    fakeWindow.__VIDEO_RENDERER__={ready:false};
    expect(predicate()).toBe(false);
    fakeWindow.__VIDEO_RENDERER__.ready=1;
    expect(predicate()).toBe(false);
    fakeWindow.__VIDEO_RENDERER__.ready=true;
    expect(predicate()).toBe(true);
    expect(page.evaluate).not.toHaveBeenCalled();
    expect(page.screenshot).not.toHaveBeenCalled();
    expect(browser.close).toHaveBeenCalledTimes(1);
    expect(jobs.get(job.id)).toMatchObject({status:'waiting_for_resume',currentFrame:0,canResume:true,
      error:expect.stringContaining('controlled readiness stop')});
    await jobs.delete(job.id);
  });
});
