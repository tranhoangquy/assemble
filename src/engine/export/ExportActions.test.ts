import { beforeEach, describe, expect, it, vi } from 'vitest';
const handlers=vi.hoisted(()=>({ready:vi.fn().mockResolvedValue(undefined),get:vi.fn(),resume:vi.fn().mockResolvedValue({status:'queued'}),cancel:vi.fn().mockResolvedValue({status:'cancelled'}),delete:vi.fn().mockResolvedValue(true)}));
vi.mock('@/products/export-manager',()=>({exportJobManager:handlers}));
import { PATCH, DELETE } from '@/app/api/export/[jobId]/route';
const context={params:Promise.resolve({jobId:'safe-job'})} as RouteContext<'/api/export/[jobId]'>;
const request=(body:unknown)=>new Request('http://127.0.0.1:3017/api/export/safe-job',{method:'PATCH',body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();handlers.get.mockReturnValue({id:'safe-job',productId:'generic',profileId:'720p',fps:30});});
describe('typed export recovery actions',()=>{
  it('keeps legacy DELETE as cancellation, not artifact deletion',async()=>{
    expect((await DELETE(request({}),context)).status).toBe(200);expect(handlers.cancel).toHaveBeenCalledWith('safe-job');expect(handlers.delete).not.toHaveBeenCalled();
  });
  it('resumes using same-origin server renderer address',async()=>{
    expect((await PATCH(request({action:'resume',productId:'generic',profileId:'720p',fps:30}),context)).status).toBe(202);
    expect(handlers.resume).toHaveBeenCalledWith('safe-job','http://127.0.0.1:3017');
  });
  it('deletes only through an explicit action',async()=>{
    const response=await PATCH(request({action:'delete'}),context);expect(await response.json()).toEqual({deleted:true});expect(handlers.delete).toHaveBeenCalledWith('safe-job');
  });
  it.each([{productId:'other'},{videoId:'other-video'},{profileId:'2160p'},{fps:60}])('rejects a mismatched selector claim %j',async fields=>{
    expect((await PATCH(request({action:'resume',...fields}),context)).status).toBe(409);expect(handlers.resume).not.toHaveBeenCalled();
  });
  it('does not invent a resume for missing job or unknown action',async()=>{
    expect((await PATCH(request({action:'unknown'}),context)).status).toBe(400);
    handlers.get.mockReturnValue(undefined);expect((await PATCH(request({action:'resume'}),context)).status).toBe(404);
  });
});
