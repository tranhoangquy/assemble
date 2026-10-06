// Artifact-only focused actual-browser diagnosis. No application/source edits,
// API mocks, forced clicks, DOM checked-state assignments or timeout increases.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'profile-selection-diagnostic-headed-01');
await fs.mkdir(dir,{recursive:false});
const report={startedAt:new Date().toISOString(),viewport:[1280,900],headed:true,actualProductionUI:true,apiMocked:false,sourceModified:false,pageErrors:[],operations:[]};
const browser=await chromium.launch({headless:false});
const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
page.on('pageerror',e=>report.pageErrors.push(e.message));
await page.addInitScript(()=>{
  window.__profileEventAudit=[];
  for(const type of ['click','input','change'])document.addEventListener(type,e=>{
    const t=e.target;
    if(t instanceof HTMLInputElement&&t.name==='resolution')window.__profileEventAudit.push({type,trusted:e.isTrusted,at:performance.now(),id:t.dataset.profileId,checked:t.checked});
  },true);
});
try{
  await page.goto('http://127.0.0.1:3016/?product=wf311613-final-micro-pass',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>{const b=document.querySelector('.export-action');return b&&!b.disabled&&!document.querySelector('.engine-loading');},undefined,{timeout:180000});
  await page.getByRole('button',{name:'Export video',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  report.default=await page.locator('input[name="resolution"]:checked').getAttribute('data-profile-id');
  for(const id of ['720p','1080p','1440p','2160p']){
    const input=page.locator(`input[data-profile-id="${id}"]`),began=Date.now();
    // Click visible label text like a user; do not use Playwright check's
    // additional automatic checkbox re-click/recheck behavior.
    await input.locator('..').locator('span').click();
    await page.waitForFunction(id=>document.querySelector(`input[data-profile-id="${id}"]`)?.checked,id,{timeout:30000});
    report.operations.push({id,elapsedMs:Date.now()-began,selected:await page.locator('input[name="resolution"]:checked').getAttribute('data-profile-id'),summary:await page.locator('.export-summary').innerText()});
    await page.screenshot({path:path.join(dir,`selected-${id}.png`),animations:'disabled'});
    console.log(JSON.stringify(report.operations.at(-1)));
  }
  report.valid=report.operations.length===4&&report.pageErrors.length===0;
}catch(e){report.valid=false;report.error={message:e.message,stack:e.stack};process.exitCode=1;}
finally{
  report.events=await page.evaluate(()=>window.__profileEventAudit).catch(()=>[]);
  report.finalInputs=await page.locator('input[name="resolution"]').evaluateAll(xs=>xs.map(x=>({id:x.dataset.profileId,checked:x.checked,disabled:x.disabled}))).catch(()=>[]);
  report.finishedAt=new Date().toISOString();
  await fs.writeFile(path.join(dir,'diagnostic.json'),JSON.stringify(report,null,2),{flag:'wx'});
  await browser.close();
}
