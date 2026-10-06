import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers=vi.hoisted(()=>({
  validation:vi.fn(()=>({valid:true,errors:[]})),
  start:vi.fn((options:Record<string,unknown>)=>({id:'unit-job',status:'queued',...options})),
}));
vi.mock('@/products/manager',()=>({productManager:{validation:handlers.validation}}));
vi.mock('@/products/export-manager',()=>({exportJobManager:{start:handlers.start}}));
import { POST } from '@/app/api/export/route';

beforeEach(()=>{handlers.validation.mockClear();handlers.start.mockClear();});
const request=(body:unknown)=>new Request('http://127.0.0.1:3017/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

describe('export API authoritative profile validation',()=>{
  it.each(['720p','1080p','1440p','2160p'])('accepts known%s and preserves exact same-origin server address',async profileId=>{
    const response=await POST(request({productId:'generic-product',profileId,fps:30}));
    expect(response.status).toBe(202);
    expect(handlers.start).toHaveBeenCalledWith({productId:'generic-product',videoId:undefined,profileId,fps:30,origin:'http://127.0.0.1:3017'});
  });
  it('explicitly maps previous dimension/FPS request to its original legacyID',async()=>{
    const response=await POST(request({productId:'generic-product',width:1920,height:1080,fps:60}));
    expect(response.status).toBe(202);
    expect(handlers.start).toHaveBeenCalledWith(expect.objectContaining({profileId:'1920x1080',fps:60}));
  });
  it('rejects unknown/mismatched/custom dimensions before any renderer starts',async()=>{
    for(const body of [{profileId:'2k'},{profileId:'2160p',width:1280,height:720},{width:640,height:480},{profileId:'720p',fps:24}]){
      const response=await POST(request({productId:'generic-product',...body}));
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBeTypeOf('string');
    }
    expect(handlers.start).not.toHaveBeenCalled();
    expect(handlers.validation).not.toHaveBeenCalled();
  });
});
