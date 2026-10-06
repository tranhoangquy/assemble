import { describe, expect, it } from 'vitest';
import { assertRenderIdentity, createRenderIdentity, hashVideoDefinition, profileJobDirectoryName, renderIdentityHash } from './RenderIdentity';
import { getRenderProfile, resolveRenderProfile } from './RenderProfiles';

describe('render/cache identity',()=>{
  const video={id:'generic-test-video',scenes:[{duration:12,camera:'view',actions:[]}],cameraPresets:{view:{position:[1,2,3],target:[0,0,0],fov:35}}};
  const hash=hashVideoDefinition(video);
  const identity=createRenderIdentity('generic-test-product',video.id,hash,getRenderProfile('720p'));
  it('binds product/video/profile/dimensions/FPS/codec and start timestamp',()=>{
    expect(identity).toMatchObject({productId:'generic-test-product',videoId:video.id,videoHash:hash,profileId:'720p',width:1280,height:720,fps:30,codec:'h264',pixelFormat:'yuv420p',startTime:0});
    expect(()=>assertRenderIdentity(identity,{...identity})).not.toThrow();
  });
  it('rejects unknown historical metadata and every conflicting identity field',()=>{
    expect(()=>assertRenderIdentity(identity,null)).toThrow();
    for(const key of Object.keys(identity))expect(()=>assertRenderIdentity(identity,{...identity,[key]:'different'})).toThrow('identity mismatch');
  });
  it('isolates all profiles and same-sized legacy profiles without scene mutations',()=>{
    const before=JSON.stringify(video);
    const profiles=['1280x720','1920x1080','720p','1080p','1440p','2160p'];
    const keys=profiles.map(id=>renderIdentityHash(createRenderIdentity('generic-test-product',video.id,hash,getRenderProfile(id))));
    expect(new Set(keys).size).toBe(profiles.length);
    expect(JSON.stringify(video)).toBe(before);
    expect(hashVideoDefinition(video)).toBe(hash);
    expect(profileJobDirectoryName('job-a',identity)).toContain('render-720p-');
    expect(profileJobDirectoryName('job-a',identity)).not.toBe(profileJobDirectoryName('job-b',identity));
  });
  it('separates FPS, timestamp, product and changed video hash',()=>{
    const changed=[
      createRenderIdentity('other-product',video.id,hash,getRenderProfile('720p')),
      createRenderIdentity('generic-test-product',video.id,'different-sha',getRenderProfile('720p')),
      createRenderIdentity('generic-test-product',video.id,hash,resolveRenderProfile({profileId:'720p',fps:60})),
      createRenderIdentity('generic-test-product',video.id,hash,getRenderProfile('720p'),2),
    ];
    for(const next of changed)expect(renderIdentityHash(next)).not.toBe(renderIdentityHash(identity));
  });
});
