/** Generic export policy. Legacy IDs/labels/dimensions/defaults are preserved. */
export interface RenderProfile {
  readonly id: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly codec: 'h264';
  readonly encoder: 'libx264';
  readonly pixelFormat: 'yuv420p';
  readonly kind: 'legacy' | 'standard' | 'custom-cli';
  readonly supportedFps: readonly number[];
}

const supportedFps = Object.freeze([30, 60]);
const profile = (id: string, label: string, width: number, height: number, kind: RenderProfile['kind']): RenderProfile => Object.freeze({
  id, label, width, height, fps: 30, codec: 'h264', encoder: 'libx264', pixelFormat: 'yuv420p', kind, supportedFps,
});

export const defaultRenderProfileId = '1920x1080';
export const renderProfiles: readonly RenderProfile[] = Object.freeze([
  profile('1280x720', '720p', 1280, 720, 'legacy'),
  profile('1920x1080', '1080p', 1920, 1080, 'legacy'),
  profile('720p', '720p — 1280×720', 1280, 720, 'standard'),
  profile('1080p', '1080p — 1920×1080', 1920, 1080, 'standard'),
  profile('1440p', '2K / 1440p — 2560×1440', 2560, 1440, 'standard'),
  Object.freeze({ ...profile('vertical-1080p', 'Vertical — 1080×1920', 1080, 1920, 'standard'), supportedFps: Object.freeze([30]) }),
  profile('2160p', '4K / 2160p — 3840×2160', 3840, 2160, 'standard'),
]);

export function getRenderProfile(id: string): RenderProfile {
  const result = renderProfiles.find(item => item.id === id);
  if (!result) throw new Error(`Unknown render profile: ${String(id)}.`);
  return result;
}

export interface RenderProfileRequest {
  profileId?: unknown;
  width?: unknown;
  height?: unknown;
  fps?: unknown;
}

function numeric(value: unknown, name: string): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '') throw new Error(`${name} must be a positive integer.`);
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error(`${name} must be a positive integer.`);
  return result;
}

function withFps(selected: RenderProfile, fps: unknown): RenderProfile {
  const value = fps === undefined ? selected.fps : numeric(fps, 'Frame rate');
  if (!selected.supportedFps.includes(value)) throw new Error('Frame rate must be 30 or 60 FPS.');
  return value === selected.fps ? selected : Object.freeze({ ...selected, fps: value });
}

/** Public API accepts known profiles only. Old dimension-only requests map to
 * their original IDs explicitly, never to a newer profile with equal pixels. */
export function resolveRenderProfile(request: RenderProfileRequest): RenderProfile {
  const hasWidth = request.width !== undefined;
  const hasHeight = request.height !== undefined;
  if (hasWidth !== hasHeight) throw new Error('Width and height must be supplied together.');
  let selected: RenderProfile;
  if (request.profileId !== undefined) {
    if (typeof request.profileId !== 'string' || !request.profileId) throw new Error('A known render profile ID is required.');
    selected = getRenderProfile(request.profileId);
  } else {
    if (!hasWidth) throw new Error('Select a known render profile or supply legacy width and height.');
    const width = numeric(request.width, 'Width'), height = numeric(request.height, 'Height');
    const legacy = renderProfiles.find(item => item.kind === 'legacy' && item.width === width && item.height === height);
    if (!legacy) throw new Error('Legacy resolution must be 1280×720 or 1920×1080; use a known profile ID for standard resolutions.');
    selected = legacy;
  }
  if (hasWidth && (numeric(request.width, 'Width') !== selected.width || numeric(request.height, 'Height') !== selected.height)) {
    throw new Error(`Dimensions do not match render profile ${selected.id} (${selected.width}×${selected.height}).`);
  }
  return withFps(selected, request.fps);
}

/** CLI historically permits explicit custom sizes. Keep that separate from
 * public web/API policy; known OUTPUT_PROFILE never accepts size overrides. */
export function resolveCliRenderProfile(request: RenderProfileRequest): RenderProfile {
  const cliFps = request.fps === undefined ? 30 : Number(request.fps);
  if (!Number.isFinite(cliFps) || cliFps <= 0 || (typeof request.fps !== 'number' && typeof request.fps !== 'string' && request.fps !== undefined)) throw new Error('CLI frame rate must be a positive finite number.');
  if (request.profileId !== undefined) {
    const selected = resolveRenderProfile({...request,fps:undefined});
    return cliFps === selected.fps ? selected : Object.freeze({...selected,fps:cliFps});
  }
  const width = request.width === undefined ? 1280 : numeric(request.width, 'Width');
  const height = request.height === undefined ? 720 : numeric(request.height, 'Height');
  if (width % 2 || height % 2) throw new Error('H.264/yuv420p native dimensions must be even.');
  const known = renderProfiles.find(item => item.width === width && item.height === height);
  const selected = known ?? profile(`custom-${width}x${height}`, `Custom CLI — ${width}×${height}`, width, height, 'custom-cli');
  return cliFps === selected.fps ? selected : Object.freeze({...selected,fps:cliFps});
}

export function profileOutputFilename(filename: string, selected: Pick<RenderProfile, 'id'>): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const stem = sanitized.replace(/\.mp4$/i, '');
  return stem.endsWith(`-${selected.id}`) ? `${stem}.mp4` : `${stem}-${selected.id}.mp4`;
}
