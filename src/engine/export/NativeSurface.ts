import type { RenderProfile } from './RenderProfiles';

export interface NativeSurfaceSnapshot {
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  canvasWidth: number;
  canvasHeight: number;
  cssWidth: number;
  cssHeight: number;
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  contextLost: boolean;
  maxRenderbufferSize: number;
  maxTextureSize: number;
  maxViewportDimensions: number[];
}

/** Serializable browser inspection; has no module closure dependencies. */
export function inspectNativeSurface(): NativeSurfaceSnapshot {
  const canvas = document.querySelector('canvas');
  if (!canvas) throw new Error('Native renderer has no canvas.');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) throw new Error('WebGL is unavailable in the native renderer.');
  const box = canvas.getBoundingClientRect();
  return { viewportWidth: innerWidth, viewportHeight: innerHeight, deviceScaleFactor: devicePixelRatio,
    canvasWidth: canvas.width, canvasHeight: canvas.height, cssWidth: box.width, cssHeight: box.height,
    drawingBufferWidth: gl.drawingBufferWidth, drawingBufferHeight: gl.drawingBufferHeight, contextLost: gl.isContextLost(),
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxViewportDimensions: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array) };
}

export function assertNativeSurface(surface: NativeSurfaceSnapshot, selected: Pick<RenderProfile, 'id' | 'width' | 'height'>): void {
  if (surface.contextLost) throw new Error(`WebGL context was lost for native ${selected.id}; no resolution fallback is permitted.`);
  if (surface.deviceScaleFactor !== 1) throw new Error('Native export requires deviceScaleFactor 1.');
  for (const [name, actual, expected] of [
    ['viewport width', surface.viewportWidth, selected.width], ['viewport height', surface.viewportHeight, selected.height],
    ['canvas width', surface.canvasWidth, selected.width], ['canvas height', surface.canvasHeight, selected.height],
    ['CSS canvas width', surface.cssWidth, selected.width], ['CSS canvas height', surface.cssHeight, selected.height],
    ['drawing-buffer width', surface.drawingBufferWidth, selected.width], ['drawing-buffer height', surface.drawingBufferHeight, selected.height],
  ] as const) {
    if (actual !== expected) throw new Error(`Native ${selected.id} ${name} is ${actual}, expected ${expected}. No upscaling or silent downgrade is allowed.`);
  }
  if (Math.max(selected.width, selected.height) > surface.maxRenderbufferSize ||
      selected.width > surface.maxViewportDimensions[0] || selected.height > surface.maxViewportDimensions[1]) {
    throw new Error(`WebGL limits cannot support native ${selected.id} (${selected.width}×${selected.height}).`);
  }
}

export function pngDimensions(bytes: Uint8Array): { width: number; height: number } {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value) || String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') throw new Error('Captured frame is not a valid PNG.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export function assertNativePng(bytes: Uint8Array, selected: Pick<RenderProfile, 'id' | 'width' | 'height'>): void {
  const dimensions = pngDimensions(bytes);
  if (dimensions.width !== selected.width || dimensions.height !== selected.height) {
    throw new Error(`Captured PNG is ${dimensions.width}×${dimensions.height}, expected native ${selected.id} ${selected.width}×${selected.height}.`);
  }
}
