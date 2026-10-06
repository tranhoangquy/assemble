import { chromium } from '/Users/quyth/development/three/POC/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out='output/wf311613-standalone-murphy-bed/final/product-fit-hole-audit';
const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('console',m=>{if(m.type()==='error')console.log(m.text())});page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto('http://127.0.0.1:3000/render?project=wf311613-final-micro-pass&profile=720p',{waitUntil:'domcontentloaded',timeout:90000});console.log('loaded');const start=Date.now();await page.waitForFunction(()=>window.__VIDEO_RENDERER__?.ready,{}, {timeout:300000});console.log('ready ms',Date.now()-start);
for(const [name,time,camera]of [['AFTER-467',467],['CLOSE-UP-467',467,{position:[-150,229,35],target:[-118,218,0],fov:38}],['WIDER-CONTEXT-467',467,{position:[-310,255,-230],target:[0,125,0],fov:42}],['CLOSED',507],['OPEN',514],['FINAL',503]]){await page.evaluate(({time,camera})=>window.__VIDEO_RENDERER__.renderFrame(time,camera),{time,camera});await page.screenshot({path:`${out}/${name}.png`,timeout:0});fs.writeFileSync(`${out}/${name}-state.json`,JSON.stringify(await page.evaluate(()=>window.__VIDEO_RENDERER__.getSceneState()),null,2));console.log('captured',name);}
fs.writeFileSync(out+'/qa-readiness.json',JSON.stringify({elapsedMs:Date.now()-start,qaProbeBudgetMs:300000,productionBudgetUnchanged:90000}));
}finally{await browser.close();}
