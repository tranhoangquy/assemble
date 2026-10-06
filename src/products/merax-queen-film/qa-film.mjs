import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_URL ?? 'http://127.0.0.1:3001';
const projectId = process.env.QA_PROJECT ?? 'merax-queen-film';
const output = path.resolve(`tmp/qa-${projectId}`);
const sampleTimes = process.env.QA_TIMES
  ? process.env.QA_TIMES.split(',').map(Number)
  : [4, 13, 21, 33, 50, 66, 79, 90, 104, 116, 130, 143, 154, 167, 179, 189, 194];
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await page.goto(`${baseUrl}/?product=${projectId}`, { waitUntil: 'networkidle' });
const editor = await page.evaluate(() => ({
  selected: document.querySelector('select')?.value,
  options: [...document.querySelectorAll('select option')].map((option) => option.textContent),
  scenes: document.querySelectorAll('.scene-list button').length,
  text: document.body.innerText.slice(0, 500),
}));
await page.screenshot({ path: path.join(output, 'editor.png') });

await page.goto(`${baseUrl}/render?project=${projectId}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__VIDEO_RENDERER__?.ready === true);
for (const time of sampleTimes) {
  await page.evaluate((value) => window.__VIDEO_RENDERER__.renderFrame(value), time);
  await page.screenshot({ path: path.join(output, `scene-${String(time).padStart(3, '0')}.png`) });
}

console.log(JSON.stringify({ editor, errors }, null, 2));
await browser.close();
if (errors.length) process.exitCode = 1;
