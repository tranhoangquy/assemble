import { describe, expect, it } from 'vitest';
import { assertNativePng, assertNativeSurface, pngDimensions, type NativeSurfaceSnapshot } from './NativeSurface';
import { getRenderProfile } from './RenderProfiles';

function pngHeader(width:number,height:number){
  const bytes=new Uint8Array(24);
  bytes.set([137,80,78,71,13,10,26,10]);bytes.set([73,72,68,82],12);
  const view=new DataView(bytes.buffer);view.setUint32(16,width);view.setUint32(20,height);
  return bytes;
}
function surface(width:number,height:number):NativeSurfaceSnapshot{
  return{viewportWidth:width,viewportHeight:height,deviceScaleFactor:1,canvasWidth:width,canvasHeight:height,cssWidth:width,cssHeight:height,
    drawingBufferWidth:width,drawingBufferHeight:height,contextLost:false,maxRenderbufferSize:16384,maxTextureSize:16384,maxViewportDimensions:[16384,16384]};
}
describe('native raster invariants',()=>{
  it.each(['720p','1080p','1440p','2160p'])('requires exact viewport/canvas/drawing-buffer/PNG for%s',id=>{
    const selected=getRenderProfile(id),native=surface(selected.width,selected.height),png=pngHeader(selected.width,selected.height);
    expect(()=>assertNativeSurface(native,selected)).not.toThrow();
    expect(pngDimensions(png)).toEqual({width:selected.width,height:selected.height});
    expect(()=>assertNativePng(png,selected)).not.toThrow();
  });
  it('rejects lower native source relabeling, DPR mismatch, context loss and WebGL limits',()=>{
    const selected=getRenderProfile('2160p');
    expect(()=>assertNativeSurface(surface(1280,720),selected)).toThrow('No upscaling');
    expect(()=>assertNativePng(pngHeader(1280,720),selected)).toThrow('expected native');
    expect(()=>assertNativeSurface({...surface(3840,2160),deviceScaleFactor:2},selected)).toThrow('deviceScaleFactor');
    expect(()=>assertNativeSurface({...surface(3840,2160),contextLost:true},selected)).toThrow('context was lost');
    expect(()=>assertNativeSurface({...surface(3840,2160),maxRenderbufferSize:2048},selected)).toThrow('WebGL limits');
    expect(()=>assertNativePng(new Uint8Array(),selected)).toThrow('valid PNG');
  });
});
