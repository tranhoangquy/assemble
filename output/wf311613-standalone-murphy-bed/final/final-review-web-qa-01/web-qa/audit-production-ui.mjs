/** Artifact-only real-browser QA. Do not execute during full master render.
 * No API mocks, job-state injection, source changes or historical output reuse.
 * MODE=before: start actual current-profile export, observe rendering, cancel.
 * MODE=after: use720p and complete the real short job on a server deliberately
 * started with EXPORT_FRAME_LIMIT=60, then download/ffprobe/decode its output.
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyNetwork, probeImplicitFavicon } from '../network-classification.mjs';

const mode = process.env.MODE ?? 'before';
if (!['before', 'after'].includes(mode)) throw new Error('MODE must be before or after.');
const origin = process.env.WEB_QA_URL ?? 'http://localhost:3017';
const candidate = 'wf311613-final-micro-pass';
const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
const directory = path.resolve(process.env.WEB_QA_OUTPUT_DIR ?? path.join(baseDirectory, mode));
const screenshotsDirectory = path.join(directory, 'screenshots');
const jobWaitMs = Number(process.env.WEB_QA_JOB_TIMEOUT_MS ?? 300000);
const report = {
  mode, origin, candidate, startedAt: new Date().toISOString(),
  actualProductionUI: true, apiMocked: false, sourceModified: false,
  checks: [], screenshots: [], findings: [], console: [], pageErrors: [],
  responses: [], requestFailures: [], jobs: [],
};
let browser;
let page;
let currentJobId;
let responseWait;

function check(name, passed, details) {
  report.checks.push({ name, passed: Boolean(passed), details });
  return Boolean(passed);
}
function finding(severity, summary, evidence) {
  report.findings.push({ severity, summary, evidence });
}
function assert(value, message) { if (!value) throw new Error(message); }
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function screenshot(name) {
  const filename = `${name}.png`;
  const destination = path.join(screenshotsDirectory, filename);
  await page.screenshot({ path: destination, type: 'png', fullPage: true, animations: 'disabled' });
  report.screenshots.push({ name, path: destination, timestamp: new Date().toISOString() });
}

async function ready() {
  await page.getByRole('button', { name: /^Export video$/ }).waitFor({ timeout: 180000 });
  await page.waitForFunction(() => {
    const button = document.querySelector('.export-action');
    return button && !button.disabled && !document.querySelector('.engine-loading');
  }, undefined, { timeout: 180000 });
}

async function timelineValue() { return Number(await page.getByRole('slider', { name: 'Video timeline' }).inputValue()); }

async function readOptions() {
  return page.locator('.export-settings fieldset').evaluateAll(fieldsets => fieldsets.map(fieldset => ({
    legend: fieldset.querySelector('legend')?.textContent,
    options: [...fieldset.querySelectorAll('label')].map(label => {
      const input = label.querySelector('input');
      return { text: label.innerText, profileId: input?.dataset.profileId ?? label.dataset.profileId ?? null,
        inputName: input?.name, inputValue: input?.value, checked: input?.checked };
    }),
  })));
}

async function profileInput(id) {
  const identified = page.locator(`[data-profile-id="${id}"]`);
  if (await identified.count()) {
    const first = identified.first();
    return (await first.evaluate(element => element.tagName === 'INPUT')) ? first : first.locator('input').first();
  }
  // Older UI has no value/id on radio inputs. Locate its actual labels.
  const patternById = {
    '1280x720': /720p[\s\S]*1280\s*[×x]\s*720/,
    '1920x1080': /1080p[\s\S]*1920\s*[×x]\s*1080/,
    '720p': /720p[\s\S]*1280\s*[×x]\s*720/,
    '1080p': /1080p[\s\S]*1920\s*[×x]\s*1080/,
    '1440p': /(?:2K\s*\/\s*1440p|1440p)[\s\S]*2560\s*[×x]\s*1440/,
    '2160p': /(?:4K\s*\/\s*2160p|2160p)[\s\S]*3840\s*[×x]\s*2160/,
  };
  const labels = page.locator('.export-settings label').filter({ hasText: patternById[id] });
  assert(await labels.count(), `Missing profile control ${id}.`);
  // Preserve labels but require new data-profile-id to disambiguate duplicate
  // dimensions if legacy and standard720p/1080p coexist.
  if (mode === 'after' && ['720p', '1080p'].includes(id) && await labels.count() > 1) {
    throw new Error(`New ${id} needs data-profile-id for unambiguous real UI audit.`);
  }
  return labels.first().locator('input');
}

async function getJob(id) {
  const response = await page.request.get(new URL(`/api/export/${id}`, origin).href);
  const payload = await response.json();
  assert(response.ok(), `Could not read actual export ${id}: ${JSON.stringify(payload)}`);
  return payload;
}

async function waitJob(predicate, timeoutMs = jobWaitMs) {
  const began = Date.now();
  while (Date.now() - began < timeoutMs) {
    const job = await getJob(currentJobId);
    report.jobs.push({ observedAt: new Date().toISOString(), ...job });
    if (predicate(job)) return job;
    if (['error', 'cancelled'].includes(job.status)) throw new Error(`Actual export ended ${job.status}: ${job.error ?? job.message}`);
    await pause(700);
  }
  throw new Error(`Actual render job wait exceeded ${timeoutMs}ms.`);
}

async function startActualJob() {
  responseWait = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname === '/api/export' && response.request().method() === 'POST';
  }, { timeout: 180000 });
  const startButton = page.getByRole('button', { name: /^(?:Start export|Generate video)$/i });
  await startButton.click();
  const response = await responseWait;
  const job = await response.json();
  assert(response.status() === 202, `Start actual export failed: ${response.status()} ${JSON.stringify(job)}`);
  currentJobId = job.id;
  report.createdJob = job;
  check('actual export request accepted', true, { status: response.status(), job });
  check('selected product/job isolation', job.productId === candidate, job.productId);
  assert(job.productId === candidate, 'Actual export belongs to a different product.');
  await screenshot('10-job-started');
  return job;
}

async function checkDownload(job) {
  const link = page.getByRole('link', { name: 'Download MP4' });
  await link.waitFor({ timeout: 20000 });
  const downloadWait = page.waitForEvent('download', { timeout: 60000 });
  await link.click();
  const download = await downloadWait;
  const filename = download.suggestedFilename();
  const destination = path.join(directory, filename);
  await download.saveAs(destination);
  assert(!(await download.failure()), `Download failed: ${await download.failure()}`);
  const bytes = await readFile(destination);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', destination], { encoding: 'utf8' }));
  await writeFile(path.join(directory, 'download-ffprobe.json'), `${JSON.stringify(probe, null, 2)}\n`, { flag: 'wx' });
  const stream = probe.streams.find(item => item.codec_type === 'video');
  const audioStreams = probe.streams.filter(item => item.codec_type === 'audio');
  check('actual downloaded native720p proof', stream?.width === 1280 && stream?.height === 720,
    { width: stream?.width, height: stream?.height });
  check('proof frame rate/codec/pixel format', stream?.r_frame_rate === '30/1' && stream?.avg_frame_rate === '30/1' && stream?.codec_name === 'h264' && stream?.pix_fmt === 'yuv420p', stream);
  check('proof contains60 frames /2 seconds', Number(stream?.nb_read_frames ?? stream?.nb_frames) === 60 && Math.abs(Number(probe.format?.duration) - 2) < .000001,
    { frames: stream?.nb_read_frames ?? stream?.nb_frames, duration: probe.format?.duration });
  check('proof silent', audioStreams.length === 0, { audioStreams: audioStreams.length });
  check('output filename identifies720p', /(?:^|-)720p(?:\.|-)/.test(filename), filename);
  execFileSync('ffmpeg', ['-v', 'error', '-i', destination, '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] });
  check('download complete decode', true, destination);
  report.download = { path: destination, suggestedFilename: filename, size: (await stat(destination)).size, sha256, job, probe };
  assert(report.checks.filter(item => /proof|download|filename/.test(item.name)).every(item => item.passed), 'Downloaded proof failed native-output verification.');
}

async function main() {
  if (mode === 'after' && process.env.WEB_QA_EXPECT_FRAME_LIMIT !== '60') {
    throw new Error('After QA requires WEB_QA_EXPECT_FRAME_LIMIT=60 and production server started with EXPORT_FRAME_LIMIT=60. No full new resolution export is authorized here.');
  }
  await mkdir(screenshotsDirectory, { recursive: true });
  // New evidence destinations must not overwrite history.
  await writeFile(path.join(directory, 'run-started.json'), `${JSON.stringify({ mode, origin, startedAt: report.startedAt }, null, 2)}\n`, { flag: 'wx' });
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1, acceptDownloads: true });
  page.on('console', message => report.console.push({ type: message.type(), text: message.text(), location: message.location(), project: candidate, at: new Date().toISOString() }));
  page.on('pageerror', error => report.pageErrors.push({ message: error.message, stack: error.stack, at: new Date().toISOString() }));
  page.on('requestfailed', request => report.requestFailures.push({ url: request.url(), method: request.method(), failure: request.failure(), resourceType: request.resourceType(), project: candidate }));
  page.on('response', response => report.responses.push({ url: response.url(), status: response.status(), method: response.request().method(), resourceType: response.request().resourceType(), project: candidate }));
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await ready();
  await screenshot('01-initial-product-selection');
  const selector = page.getByRole('combobox', { name: 'Select product' });
  report.initialSelection = await selector.inputValue();
  report.catalog = await selector.locator('option').evaluateAll(options => options.map(option => ({ id: option.value, label: option.textContent })));
  check('product selector available', report.catalog.length > 1, report.catalog);
  await selector.selectOption(candidate);
  await ready();
  check('current candidate selected', (await selector.inputValue()) === candidate, { selected: await selector.inputValue(), url: page.url() });
  await screenshot('02-current-product-viewer');

  const layout = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    body: { scrollWidth: document.body.scrollWidth, clientWidth: document.body.clientWidth },
    canvas: (() => { const canvas = document.querySelector('canvas'); return canvas ? { width: canvas.width, height: canvas.height, box: canvas.getBoundingClientRect().toJSON() } : null; })(),
    exportButton: (() => { const button = document.querySelector('.export-action'); return button ? { disabled: button.disabled, box: button.getBoundingClientRect().toJSON() } : null; })(),
    debugSummary: document.querySelector('.debug-menu')?.textContent,
    diagnosticPanels: document.querySelectorAll('.state-inspector,.validation-panel').length,
    displayedProductText: document.querySelector('.project-meta')?.textContent,
  }));
  report.layout = layout;
  check('product preview canvas visible', Boolean(layout.canvas?.box.width > 100 && layout.canvas?.box.height > 100), layout.canvas);
  check('no horizontal page overflow', layout.body.scrollWidth <= layout.body.clientWidth, layout.body);
  if (layout.debugSummary || layout.diagnosticPanels) finding('P2', 'Diagnostic-only UI is exposed in the production viewer.', { debugSummary: layout.debugSummary, diagnosticPanels: layout.diagnosticPanels });
  if (/POC|QA only|QA-only/.test(layout.displayedProductText ?? '')) finding('P2', 'Production UI contains development/QA-only labeling.', layout.displayedProductText);
  if (report.initialSelection !== candidate) finding('P1', 'Default product selection is not the currently approved candidate; explicit selector/URL is needed.', report.initialSelection);

  const beforePlay = await timelineValue();
  await page.getByRole('button', { name: /^Play$/ }).click();
  await page.waitForFunction(previous => Number(document.querySelector('input[aria-label="Video timeline"]')?.value) > previous + .1, beforePlay, { timeout: 12000 });
  await page.getByRole('button', { name: /^Pause$/ }).click();
  const paused = await timelineValue();
  await pause(600);
  const stillPaused = await timelineValue();
  check('play advances timeline', paused > beforePlay, { beforePlay, paused });
  check('pause keeps timeline stable', Math.abs(stillPaused - paused) < .04, { paused, stillPaused });
  await screenshot('03-video-preview-paused');

  const range = page.getByRole('slider', { name: 'Video timeline' });
  await range.focus();
  await range.press('End');
  const sought = await timelineValue();
  const max = Number(await range.getAttribute('max'));
  check('timeline seek reaches final timestamp', Math.abs(sought - max) < .05, { sought, max });
  await screenshot('04-video-preview-seek-final');
  await page.getByRole('button', { name: 'Reset all', exact: true }).click();
  const reset = await timelineValue();
  check('reset returns exact time zero', Math.abs(reset) < .000001, reset);
  await page.getByRole('button', { name: 'Next assembly state' }).click();
  check('assembly preview after intro reset', Math.abs((await timelineValue()) - 5) < .1, await timelineValue());
  await screenshot('05-step1-preview-after-reset');

  const other = report.catalog.find(item => item.id === 'demo-cabinet') ?? report.catalog.find(item => item.id !== candidate && !item.id.startsWith('wf311613'));
  assert(other, 'No second isolated product available for switch QA.');
  await selector.selectOption(other.id);
  await ready();
  const otherMax = Number(await range.getAttribute('max'));
  check('switch resets independent product timeline', (await selector.inputValue()) === other.id && (await timelineValue()) === 0 && otherMax !== max, { productId: await selector.inputValue(), time: await timelineValue(), duration: otherMax });
  await screenshot('06-isolated-second-product');
  await selector.selectOption(candidate);
  await ready();
  check('return restores candidate without second-product state', (await selector.inputValue()) === candidate && (await timelineValue()) === 0 && Math.abs(Number(await range.getAttribute('max')) - max) < .000001,
    { productId: await selector.inputValue(), time: await timelineValue(), duration: await range.getAttribute('max') });
  await page.getByRole('button', { name: 'Export video', exact: true }).scrollIntoViewIfNeeded();
  await screenshot('07-generate-video-area');
  await page.getByRole('button', { name: 'Export video', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  report.qualityOptions = await readOptions();
  await screenshot('08-quality-settings-current-default');
  const oldDefault = await profileInput('1920x1080');
  check('existing1080p default retained', await oldDefault.isChecked(), report.qualityOptions);
  const fps30 = page.locator('.export-settings label').filter({ hasText: /^30 FPS/ }).locator('input');
  const fps60 = page.locator('.export-settings label').filter({ hasText: /^60 FPS/ }).locator('input');
  check('existing FPS30 default retained', await fps30.isChecked(), report.qualityOptions);
  check('existing FPS30/60 options retained', await fps30.count() === 1 && await fps60.count() === 1, report.qualityOptions);
  const old720 = await profileInput('1280x720');
  check('legacy720p still present', await old720.count() === 1, report.qualityOptions);
  await screenshot('09-existing-options-preserved');

  if (mode === 'after') {
    const selections = [];
    for (const id of ['720p', '1080p', '1440p', '2160p']) {
      const input = await profileInput(id);
      await input.check();
      check(`new profile ${id} selectable`, await input.isChecked(), { id });
      selections.push({ id, checked: await input.isChecked(), options: await readOptions() });
      await screenshot(`09-profile-${id}-selected`);
    }
    report.profileSelections = selections;
    await (await profileInput('720p')).check();
    await fps30.check();
    await screenshot('09-profile720p-ready-to-generate');
  }

  await startActualJob();
  const activeJob = await waitJob(job => job.status === 'rendering' && job.currentFrame >= 1 || job.status === 'completed');
  check('real native renderer started', ['rendering', 'completed'].includes(activeJob.status), activeJob);
  await screenshot('11-actual-render-status');
  if (mode === 'before') {
    if (activeJob.status === 'completed') {
      finding('P2', 'Before audit job completed before cancellation; no full video rerender requested by audit.', activeJob);
      report.beforeJobOutcome = 'already-completed';
    } else {
      await page.getByRole('button', { name: 'Cancel export', exact: true }).click();
      const cancelled = await waitJob(job => job.status === 'cancelled', 60000);
      check('actual export cancellation works', cancelled.status === 'cancelled', cancelled);
      await screenshot('12-actual-render-cancelled');
      report.beforeJobOutcome = 'cancelled-after-real-render-start';
    }
  } else {
    const completed = activeJob.status === 'completed' ? activeJob : await waitJob(job => job.status === 'completed');
    check('short actual export completes', completed.status === 'completed', completed);
    check('short job uses selected720p', completed.profileId === '720p' || completed.profile?.id === '720p', completed);
    check('short job metadata native dimensions/fps', completed.width === 1280 && completed.height === 720 && completed.fps === 30, completed);
    check('short server-limited job contains60 frames', completed.totalFrames === 60 && completed.currentFrame === 60, completed);
    await page.getByRole('link', { name: 'Download MP4' }).waitFor({ timeout: 20000 });
    report.completedUIText = await page.getByRole('dialog').innerText();
    check('completed output metadata understandable', /720p/i.test(report.completedUIText) && /1280/.test(report.completedUIText) && /720/.test(report.completedUIText) && /30/.test(report.completedUIText), report.completedUIText);
    await screenshot('12-completed-output-metadata');
    await checkDownload(completed);
  }

  const httpFailures = report.responses.filter(item => item.status >= 400);
  const consoleErrors = report.console.filter(item => item.type === 'error');
  const probe=await probeImplicitFavicon(report.responses,consoleErrors,origin);
  report.faviconConfirmations=probe.confirmations;
  report.networkClassification = classifyNetwork(probe.responses, report.requestFailures, consoleErrors, origin);
  check('no browser page exceptions', report.pageErrors.length === 0, report.pageErrors);
  check('no unexplained critical HTTP/resource/console failures', report.networkClassification.valid, report.networkClassification);
  if (report.pageErrors.length) finding('P0', 'Unexpected page exceptions occurred during real production workflow.', report.pageErrors);
  if (!report.networkClassification.valid) finding('P1', 'Unexplained production HTTP/resource/console failures require review.', { httpFailures, classification: report.networkClassification });
  if (report.networkClassification.optionalFavicon404.length) finding('P2', 'Observed optional favicon.ico GET404 only.', report.networkClassification.optionalFavicon404);
  report.finishedAt = new Date().toISOString();
  report.valid = report.checks.every(item => item.passed);
  await writeFile(path.join(directory, 'web-qa-report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  await writeFile(path.join(directory, 'WEB-QA-REPORT.md'), `# Actual production web QA — ${mode}\n\nResult: ${report.valid ? 'PASS' : 'FAIL'}\n\nCandidate: ${candidate}\n\nOrigin: ${origin}\n\nChecks:\n\n${report.checks.map(item => `- ${item.passed ? 'PASS' : 'FAIL'}: ${item.name}`).join('\n')}\n\nFindings:\n\n${report.findings.map(item => `- ${item.severity}: ${item.summary}`).join('\n') || 'None.'}\n\nScreenshots:\n\n${report.screenshots.map(item => `- ${item.path}`).join('\n')}\n\nNo API/job-state mocks or source changes. After proof is a fresh actual server render, not a historical output.\n`, { flag: 'wx' });
  console.log(JSON.stringify({ valid: report.valid, mode, directory, checks: report.checks.map(item => ({ name: item.name, passed: item.passed })), findings: report.findings, download: report.download && { path: report.download.path, size: report.download.size, sha256: report.download.sha256 } }, null, 2));
  if (!report.valid) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  report.valid = false;
  report.error = { message: error.message, stack: error.stack };
  report.finishedAt = new Date().toISOString();
  // Best-effort cleanup only the real job created by this audit, never another
  // browser/job or the root's full review render.
  if (currentJobId && page && !page.isClosed()) {
    try {
      const job = await getJob(currentJobId);
      if (!['completed', 'error', 'cancelled'].includes(job.status)) await page.request.delete(new URL(`/api/export/${currentJobId}`, origin).href);
    } catch (cleanupError) { report.cleanupWarning = cleanupError.message; }
  }
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'web-qa-error.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' }).catch(() => undefined);
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
