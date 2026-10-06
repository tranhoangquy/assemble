import { describe, expect, it } from 'vitest';
import { defaultRenderProfileId, getRenderProfile, profileOutputFilename, renderProfiles, resolveCliRenderProfile, resolveRenderProfile } from './RenderProfiles';

describe('backward-compatible generic render profiles', () => {
  it('preserves every old ID, label, dimensions, FPS choices and web default', () => {
    expect(defaultRenderProfileId).toBe('1920x1080');
    expect(renderProfiles.filter(item => item.kind === 'legacy').map(item => ({id:item.id,label:item.label,width:item.width,height:item.height,fps:item.fps,supportedFps:item.supportedFps}))).toEqual([
      {id:'1280x720',label:'720p',width:1280,height:720,fps:30,supportedFps:[30,60]},
      {id:'1920x1080',label:'1080p',width:1920,height:1080,fps:30,supportedFps:[30,60]},
    ]);
    expect(new Set(renderProfiles.map(item => item.id)).size).toBe(renderProfiles.length);
  });

  it.each([
    ['720p',1280,720],['1080p',1920,1080],['1440p',2560,1440],['2160p',3840,2160],
  ] as const)('registers native %s with exact16:9 dimensions/default30 and current codec', (id,width,height) => {
    const selected=getRenderProfile(id);
    expect(selected).toMatchObject({id,width,height,fps:30,codec:'h264',encoder:'libx264',pixelFormat:'yuv420p',kind:'standard'});
    expect(selected.width/selected.height).toBe(16/9);
    expect(resolveRenderProfile({profileId:id,fps:60}).fps).toBe(60);
  });

  it('maps legacy dimension-only requests to old IDs without reinterpreting them', () => {
    expect(resolveRenderProfile({width:1280,height:720,fps:30}).id).toBe('1280x720');
    expect(resolveRenderProfile({width:1920,height:1080,fps:60})).toMatchObject({id:'1920x1080',fps:60});
    expect(getRenderProfile('1920x1080').fps).toBe(30);
  });

  it('rejects unknown IDs and invalid/mismatched client dimensions/FPS without fallback', () => {
    for(const request of [{profileId:'2k'},{profileId:'unknown'},{profileId:''},{profileId:720},
      {profileId:'2160p',width:1280,height:720},{profileId:'720p',width:1280},
      {width:2560,height:1440},{width:1280,height:721},{profileId:'720p',fps:24},
      {profileId:'720p',fps:Infinity},{profileId:'720p',fps:null},{}]) {
      expect(()=>resolveRenderProfile(request)).toThrow();
    }
  });

  it('keeps existing CLI720p30 defaults and explicit custom dimensions separate from API', () => {
    expect(resolveCliRenderProfile({})).toMatchObject({id:'1280x720',width:1280,height:720,fps:30});
    expect(resolveCliRenderProfile({width:640,height:480,fps:60})).toMatchObject({id:'custom-640x480',width:640,height:480,fps:60,kind:'custom-cli'});
    expect(resolveCliRenderProfile({fps:24})).toMatchObject({id:'1280x720',fps:24});
    expect(resolveCliRenderProfile({width:640,height:480,fps:23.976}).fps).toBe(23.976);
    expect(()=>resolveRenderProfile({profileId:'1280x720',fps:24})).toThrow('30 or 60');
    expect(()=>resolveRenderProfile({profileId:'custom-640x480'})).toThrow('Unknown render profile');
    expect(()=>resolveCliRenderProfile({profileId:'2160p',width:1280,height:720})).toThrow('Dimensions do not match');
    expect(()=>resolveCliRenderProfile({width:641,height:480})).toThrow('must be even');
  });

  it('names output by stable profile ID without duplicate suffixes', () => {
    expect(profileOutputFilename('review.mp4',getRenderProfile('2160p'))).toBe('review-2160p.mp4');
    expect(profileOutputFilename('review-720p.mp4',getRenderProfile('720p'))).toBe('review-720p.mp4');
    expect(profileOutputFilename('review.mp4',getRenderProfile('1280x720'))).toBe('review-1280x720.mp4');
  });
});
