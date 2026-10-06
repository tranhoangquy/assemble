import {chromium} from 'playwright';import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const origin='http://127.0.0.1:3019',out=path.resolve('output/wf311613-standalone-murphy-bed/final/product-fit-hole-audit'),report={origin,checks:[],responses:[],requestFailures:[],pageErrors:[],downloads:[],actualBrowser:true,apiMocked:false,cdpResponses:[],cdpFailures:[]};
const browser=await chromium.launch({headless:false,executablePath:chromium.executablePath()});
const check=(name,pass,detail)=>{report.checks.push({name,pass,detail});if(!pass)throw Error(name);};
try{
 const inspection=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await inspection.goto(origin+'/render?project=wf311613-final-micro-pass&profile=720p',{waitUntil:'domcontentloaded',timeout:90000});
 await inspection.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready===true,{}, {timeout:90000});
 const inspectionCamera={position:[-165,228,-25],target:[-118,217,0],fov:35};
 await inspection.evaluate(c=>window.__VIDEO_RENDERER__.renderFrame(467,c),inspectionCamera);
 try{await fs.rename(path.join(out,'CLOSE-UP-467.png'),path.join(out,'CLOSE-UP-467-occluded-probe.png'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const png=await inspection.screenshot({path:path.join(out,'CLOSE-UP-467.png'),timeout:0});
 check('corrected-close-up-native-size',png.readUInt32BE(16)===1280&&png.readUInt32BE(20)===720);
 await fs.writeFile(path.join(out,'CLOSE-UP-467-state.json'),JSON.stringify(await inspection.evaluate(()=>window.__VIDEO_RENDERER__.getSceneState()),null,2));
 report.inspection={time:467,camera:inspectionCamera,reason:'Original positive-Z inspection camera was behind the context wall; replace only the QA inspection view.'};
 await inspection.close();
 const page=await browser.newPage({viewport:{width:1600,height:1000},acceptDownloads:true});page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('response',r=>{if(r.url().includes('/api/'))report.responses.push({url:r.url(),status:r.status()});});page.on('requestfailed',r=>report.requestFailures.push({url:r.url(),error:r.failure()}));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');cdp.on('Network.responseReceived',e=>{if(e.response.url.includes('/api/'))report.cdpResponses.push({requestId:e.requestId,url:e.response.url,status:e.response.status});});cdp.on('Network.loadingFailed',e=>report.cdpFailures.push(e));
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>!document.querySelector('.export-action')?.disabled,{}, {timeout:180000});
 check('default-current-WF311613',await page.locator('select[aria-label="Select product"]').inputValue()==='wf311613-final-micro-pass');
 for(const text of ['Debug','Assembly state','Validation','QA only'])check('production hides '+text,!(await page.locator('body').innerText()).includes(text));
 check('duration-08:44',(await page.locator('.timecode').innerText()).includes('08:44'));await page.screenshot({path:path.join(out,'PRODUCTION-WEB.png'),fullPage:true});
 await page.getByRole('button',{name:'Export video',exact:true}).click();const expected=['1280x720','1920x1080','720p','1080p','1440p','2160p'];
 check('all-six-profile-IDs-retained',JSON.stringify(await page.locator('[data-profile-id]').evaluateAll(els=>els.map(e=>e.dataset.profileId)))===JSON.stringify(expected));
 for(const id of expected){await page.locator(`[data-profile-id="${id}"]`).check();check('profile-select-'+id,await page.locator(`[data-profile-id="${id}"]`).isChecked());}
 await page.locator('[data-profile-id="720p"]').check();check('export-duration-08:44',(await page.locator('.export-summary').innerText()).includes('08:44'));await page.screenshot({path:path.join(out,'PRODUCTION-EXPORT-PROFILES.png'),fullPage:true});
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/export')&&r.request().method()==='POST');await page.getByRole('button',{name:'Start export',exact:true}).click();const response=await responsePromise;report.startResponse={status:response.status(),job:await response.json()};check('real-export-start',response.status()===202);
 const id=report.startResponse.job.id;let job;const deadline=Date.now()+300000;do{const r=await page.request.get(`${origin}/api/export/${id}`);job=await r.json();if(['completed','error','cancelled'].includes(job.status))break;await new Promise(r=>setTimeout(r,1000));}while(Date.now()<deadline);report.job=job;check('real-short-export-completed',job.status==='completed',job.error);
 await page.getByRole('link',{name:'Download MP4',exact:true}).waitFor();const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Download MP4',exact:true}).click();const download=await downloadPromise;const target=path.join(out,'fresh-web-download-720p.mp4');await download.saveAs(target);report.downloads.push({suggestedFilename:download.suggestedFilename(),path:target,failure:await download.failure()});check('download-file-saved',await download.failure()===null);
 const digest=async p=>crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex');report.downloadSha256=await digest(target);report.sourceSha256=await digest(job.outputPath);check('download-SHA-matches-rendered-file',report.downloadSha256===report.sourceSha256);
 report.ffprobe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',target],{encoding:'utf8'}));execFileSync('ffmpeg',['-v','error','-i',target,'-f','null','-']);check('download-complete-decode',true);await page.screenshot({path:path.join(out,'PRODUCTION-DOWNLOAD-COMPLETE.png'),fullPage:true});
 await page.goto(origin+'/?debug=1',{waitUntil:'domcontentloaded',timeout:90000});await page.getByText('Debug assembly',{exact:true}).first().waitFor({timeout:180000});await page.waitForFunction(()=>!document.querySelector('.export-action')?.disabled,{}, {timeout:180000});await page.locator('summary.debug-toggle').click();check('explicit-debug-mode-reachable',(await page.locator('body').innerText()).includes('Debug'));await page.screenshot({path:path.join(out,'DEBUG-MODE.png'),fullPage:true});
 report.valid=report.checks.every(c=>c.pass)&&report.pageErrors.length===0;
}catch(e){report.valid=false;report.error=String(e);throw e;}finally{await fs.writeFile(path.join(out,'production-web-qa.json'),JSON.stringify(report,null,2));await browser.close();}
