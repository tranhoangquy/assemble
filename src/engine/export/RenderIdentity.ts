import { createHash } from 'node:crypto';
import type { RenderProfile } from './RenderProfiles';

export interface RenderIdentity {
  version: 1;
  productId: string;
  videoId: string;
  videoHash: string;
  profileId: string;
  width: number;
  height: number;
  fps: number;
  codec: string;
  pixelFormat: string;
  startTime: number;
}

export function hashVideoDefinition(video: unknown): string {
  return createHash('sha256').update(JSON.stringify(video)).digest('hex');
}

export function createRenderIdentity(productId: string, videoId: string, videoHash: string, selected: RenderProfile, startTime = 0): Readonly<RenderIdentity> {
  return Object.freeze({ version: 1, productId, videoId, videoHash, profileId: selected.id, width: selected.width, height: selected.height,
    fps: selected.fps, codec: selected.codec, pixelFormat: selected.pixelFormat, startTime });
}

export function renderIdentityHash(identity: RenderIdentity): string {
  return createHash('sha256').update(JSON.stringify(identity)).digest('hex');
}

export function assertRenderIdentity(expected: RenderIdentity, actual: unknown): void {
  if (!actual || typeof actual !== 'object') throw new Error('Frame cache has no render identity; render fresh frames instead of reusing an unverified legacy sequence.');
  for (const key of Object.keys(expected) as (keyof RenderIdentity)[]) {
    if ((actual as Partial<RenderIdentity>)[key] !== expected[key]) throw new Error(`Frame cache identity mismatch: ${key}. No cross-profile or historical frame reuse is allowed.`);
  }
}

export function profileJobDirectoryName(jobId: string, identity: RenderIdentity): string {
  const safeProfile = identity.profileId.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `render-${safeProfile}-${renderIdentityHash(identity).slice(0, 12)}-${jobId}`;
}
