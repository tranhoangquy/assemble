import type {CameraPreset} from '@/types/video';

export interface FurnitureRenderApi {
  getSceneState?:()=>unknown;
  /** Read-only evaluated sources for export compatibility; does not change creative state. */
  getCreativeDefinition?:()=>unknown;
  getRenderSurface?:()=>{profileId:string|null;width:number;height:number;drawingBuffer:number[];deviceScaleFactor:number};
  getCameraState?:()=>{position:number[];direction:number[];target:number[];fov:number};
  seek: (time: number) => Promise<void>;
  setTime: (time: number) => Promise<void>;
  renderFrame: (time: number, inspectionCamera?:CameraPreset) => Promise<void>;
  getDuration: () => number;
  duration: number;
  fps: number;
  ready: boolean;
}

declare global {
  interface Window {
    __FURNITURE_RENDER__?: FurnitureRenderApi;
    __VIDEO_RENDERER__?: FurnitureRenderApi;
  }
}

export function installFrameRenderer(api: FurnitureRenderApi): () => void {
  window.__FURNITURE_RENDER__ = api;
  window.__VIDEO_RENDERER__ = api;
  return () => {
    delete window.__FURNITURE_RENDER__;
    delete window.__VIDEO_RENDERER__;
  };
}
