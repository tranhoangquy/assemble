/** Generic fresh browser audit renderer. The product audit entry stays outside
 * the registered product catalog until its mechanical review has passed. */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

async function main() {
  if (!process.env.PRODUCT_AUDIT_MODULE || !process.env.SCREENSHOTS_DIR) {
    throw new Error('PRODUCT_AUDIT_MODULE and SCREENSHOTS_DIR are required.');
  }
  const directory = path.resolve(process.env.SCREENSHOTS_DIR);
  await mkdir(directory, { recursive: true });
  const bundle = await build({ entryPoints: [path.resolve(process.env.PRODUCT_AUDIT_MODULE)], bundle: true,
    write: false, platform: 'browser', format: 'iife', target: 'es2020',
    define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'warning' });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<!doctype html><html><head><title>Mechanism diagnostics</title></head><body></body></html>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.waitForFunction(() => window.__MECHANISM_AUDIT_RENDERER__?.ready === true, {}, { timeout: 120000 });
    const available = await page.evaluate(() => window.__MECHANISM_AUDIT_RENDERER__!.checkpoints);
    const selection=process.env.CHECKPOINT_PATTERN?new RegExp(process.env.CHECKPOINT_PATTERN):undefined;
    const checkpoints=selection?available.filter(check=>selection.test(check.name)):available;
    if(!checkpoints.length)throw new Error('No diagnostic checkpoints matched the requested selection.');
    const manifest: Record<string, unknown>[] = [];
    for (const check of checkpoints) {
      manifest.push(await page.evaluate(name => window.__MECHANISM_AUDIT_RENDERER__!.render(name), check.name));
      await page.screenshot({ path: path.join(directory, check.name), animations: 'disabled' });
      console.log(check.name, check.time);
    }
    if (errors.length) throw new Error(errors.join('\n'));
    await writeFile(path.join(directory, selection?'selected-diagnostic-manifest.json':'diagnostic-manifest.json'), JSON.stringify(manifest, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
