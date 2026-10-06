import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { defaultProductId, getProductPackage } from '../src/products/registry';
import { profileOutputFilename, resolveCliRenderProfile } from '../src/engine/export/RenderProfiles';
import { createRenderIdentity, hashVideoDefinition, renderIdentityHash } from '../src/engine/export/RenderIdentity';
import { prepareFrameManifest } from '../src/engine/export/FrameManifest';
import { assertNativePng, assertNativeSurface, inspectNativeSurface } from '../src/engine/export/NativeSurface';

const baseUrl = process.env.RENDER_URL ?? 'http://localhost:3000';
const entry = getProductPackage(process.env.PROJECT_ID ?? process.env.PRODUCT_ID ?? defaultProductId);
const outputRoot = path.resolve('output', entry.productKey);
let framesDirectory: string;
const selectedProfile = resolveCliRenderProfile({ profileId: process.env.OUTPUT_PROFILE,
  width: process.env.OUTPUT_WIDTH, height: process.env.OUTPUT_HEIGHT, fps: process.env.OUTPUT_FPS });
const outputFile = path.resolve(process.env.OUTPUT_FILE ?? path.join(outputRoot, 'reviews', entry.reviewDirectory ?? entry.id, profileOutputFilename(entry.filename, selectedProfile)));
const requestedFrameLimit = Number(process.env.FRAME_LIMIT ?? Number.POSITIVE_INFINITY);
const startTime = Math.max(0, Number(process.env.START_TIME ?? 0));
const projectId = entry.id;
const outputFps = selectedProfile.fps;
const outputWidth = selectedProfile.width;
const outputHeight = selectedProfile.height;
const identity = createRenderIdentity(entry.id, entry.video.id, hashVideoDefinition(entry.video), selectedProfile, startTime);
const identityHash = renderIdentityHash(identity);
// Opt-in recovery for an interrupted render of the SAME deterministic timeline.
// Verify cached prefix screenshots in the current renderer before reusing them;
// this is not concatenation of historical video exports.
const resumeFrame = Number(process.env.RESUME_FROM_FRAME ?? 0);

async function main() {
await mkdir(path.join(outputRoot, 'frames'), { recursive: true });
framesDirectory = process.env.FRAMES_DIR ? path.resolve(process.env.FRAMES_DIR) : await mkdtemp(path.join(outputRoot, 'frames', `${entry.id}-${selectedProfile.id}-${identityHash.slice(0,12)}-`));
await mkdir(framesDirectory, { recursive: true });
await mkdir(path.dirname(outputFile), { recursive: true });
try { await stat(outputFile); throw new Error(`Output already exists; choose a new OUTPUT_FILE to preserve render history: ${outputFile}`); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }

const browser = await chromium.launch({ headless: true, executablePath: chromium.executablePath() });
try {
const page = await browser.newPage({ viewport: { width: outputWidth, height: outputHeight }, deviceScaleFactor: 1 });
const pageErrors: string[] = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') console.log(`[browser:${message.type()}] ${message.text()}`);
});
const renderUrl = new URL('/render', baseUrl);
renderUrl.searchParams.set('project', projectId);
// Explicit historical custom CLI dimensions remain supported without making
// arbitrary custom profiles valid in the public web/API registry.
if (selectedProfile.kind !== 'custom-cli' && selectedProfile.supportedFps.includes(outputFps)) renderUrl.searchParams.set('profile', selectedProfile.id);
renderUrl.searchParams.set('fps', String(outputFps));
await page.goto(renderUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(1500);
console.log('Render diagnostics:', await page.evaluate(() => ({
  api: Boolean(window.__VIDEO_RENDERER__),
  debug: (window as unknown as { __RENDER_DEBUG__?: unknown }).__RENDER_DEBUG__,
  canvas: Boolean(document.querySelector('canvas')),
  text: document.body.innerText.slice(0, 300),
})));
await page.waitForFunction(() => window.__VIDEO_RENDERER__?.ready === true, {}, {timeout:90000});

const metadata = await page.evaluate(() => ({
  duration: window.__VIDEO_RENDERER__!.getDuration(),
}));
const totalFrames = Math.min(Math.ceil((metadata.duration - startTime) * outputFps), requestedFrameLimit);
if (!Number.isSafeInteger(totalFrames) || totalFrames <= 0) throw new Error('Frame limit/start time must define a positive whole frame count.');
if (!Number.isInteger(resumeFrame) || resumeFrame < 0 || resumeFrame > totalFrames) throw new Error('Invalid RESUME_FROM_FRAME');
if (resumeFrame > 0 && (!process.env.FRAMES_DIR || startTime !== 0)) throw new Error('Resume requires the original FRAMES_DIR and time-zero timeline');
const nativeSurface = await page.evaluate(inspectNativeSurface);
assertNativeSurface(nativeSurface, selectedProfile);
await prepareFrameManifest(framesDirectory, { identity, identityHash, frameDirectory: framesDirectory, outputPath: outputFile,
  totalFrames, timelineDuration: metadata.duration, createdAt: new Date().toISOString() }, resumeFrame);
await writeFile(path.join(framesDirectory, 'native-surface.json'), JSON.stringify(nativeSurface, null, 2));

if (resumeFrame > 0) {
  for (const frame of [...new Set([0, Math.floor(resumeFrame / 3), Math.floor(resumeFrame * 2 / 3), resumeFrame - 1])]) {
    await page.evaluate(value => window.__VIDEO_RENDERER__!.renderFrame(value), frame / outputFps);
    const current = await page.screenshot({type:'png',animations:'disabled',timeout:0});
    const previous = await readFile(path.join(framesDirectory,`frame-${String(frame).padStart(6,'0')}.png`));
    assertNativePng(current, selectedProfile);
    assertNativePng(previous, selectedProfile);
    if (!current.equals(previous)) throw new Error(`Cached frame ${frame} differs from the current deterministic renderer; rerender from zero`);
  }
  console.log(`Verified ${resumeFrame} contiguous cached frames; four sampled PNGs exactly match the current renderer.`);
}

// Optional actual-timeline review stills share the same loaded renderer as
// the video, avoiding a second expensive scene initialization.
if (process.env.CHECKPOINTS_DIR) {
  const checkpointDirectory = path.resolve(process.env.CHECKPOINTS_DIR);
  await mkdir(checkpointDirectory,{recursive:true});
  for (const checkpoint of entry.checkpoints ?? []) {
    await page.evaluate(check=>window.__VIDEO_RENDERER__!.renderFrame(check.time,check.camera),checkpoint);
    const png = await page.screenshot({path:path.join(checkpointDirectory,checkpoint.name),type:'png',animations:'disabled',timeout:0});
    assertNativePng(png, selectedProfile);
    console.log(`Checkpoint ${checkpoint.name} at ${checkpoint.time.toFixed(3)}s`);
  }
}

for (let frame = resumeFrame; frame < totalFrames; frame += 1) {
  if (pageErrors.length) throw new Error(`Render page errors:\n${pageErrors.join('\n')}`);
  const time = startTime + frame / outputFps;
  await page.evaluate((value) => window.__VIDEO_RENDERER__!.renderFrame(value), time);
  const png = await page.screenshot({
    path: path.join(framesDirectory, `frame-${String(frame).padStart(6, '0')}.png`),
    type: 'png',
    animations: 'disabled',
    timeout: 0,
  });
  assertNativePng(png, selectedProfile);
  if (frame % outputFps === 0) process.stdout.write(`\rCaptured ${Math.floor(time)}s / ${Math.ceil(metadata.duration)}s`);
}

await browser.close();
if (pageErrors.length) throw new Error(`Render page errors:\n${pageErrors.join('\n')}`);
process.stdout.write('\nEncoding MP4…\n');
execFileSync('ffmpeg', [
  '-y', '-framerate', String(outputFps), '-start_number', '0',
  '-i', path.join(framesDirectory, 'frame-%06d.png'),
  '-frames:v', String(totalFrames), '-c:v', selectedProfile.encoder, '-pix_fmt', selectedProfile.pixelFormat, '-movflags', '+faststart', '-r', String(outputFps), '-an', outputFile,
], { stdio: 'inherit' });

console.log(`Video written to ${outputFile}`);
} finally { await browser.close(); }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
