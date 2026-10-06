/** Generic still-set handoff. Uses the registered product's actual render
 * checkpoints; never makes a video or changes a playback camera. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {defaultProductId,getProductPackage} from '../src/products/registry';

const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
async function main(){
  const entry=getProductPackage(process.env.PROJECT_ID??defaultProductId);
  const directory=path.resolve(process.env.REVIEW_DIR??path.join('output',entry.productKey,'reviews',entry.reviewDirectory??entry.id));
  await mkdir(directory,{recursive:true});
  const checks=entry.checkpoints??[],comparisons=JSON.parse(await readFile(path.join(directory,'comparisons.json'),'utf8')) as Array<{title:string;before:string;after:string}>;
  const label=(name:string)=>name.replace(/\.png$/,'').replaceAll('-',' ');
  const figure=(src:string,title:string)=>`<figure><a href="${escape(src)}"><img src="${escape(src)}" loading="lazy" alt="${escape(title)}"></a><figcaption>${escape(title)}</figcaption></figure>`;
  const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(entry.label)}</title>
<style>body{margin:0;background:#eee9df;color:#282a27;font:16px system-ui,sans-serif}main{max-width:1440px;margin:36px auto;padding:0 24px}h1{font-size:28px}h2{margin-top:38px}p{max-width:950px;line-height:1.6}.grid,.comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;background:#faf8f3;border:1px solid #d2c8b8;border-radius:8px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:12px 16px;font-size:14px}.badge{display:inline-block;background:#566457;color:white;padding:6px 12px;border-radius:5px;font-size:13px}a{color:#465e49}@media(max-width:700px){.grid,.comparison{grid-template-columns:1fr}}</style>
<main><h1>${escape(entry.label)}</h1><span class="badge">QA STILLS · AWAITING DIRECTOR REVIEW</span><p>Actual deterministic timeline at 1280 × 720. No inspection-camera substitution. No new full MP4 has been rendered. Product geometry and materials remain locked.</p><p><a href="contact-sheet.png">Contact sheet</a> · <a href="report.md">Technical report</a> · <a href="validation-results.json">Mechanical gates</a> · <a href="final-camera-audit.json">All-shot camera audit</a> · <a href="stills/render-manifest.json">Render manifest</a></p>
<h2>Before / after</h2>${comparisons.map(pair=>`<h3>${escape(pair.title)}</h3><div class="comparison">${figure(pair.before,'BEFORE — accepted baseline MP4')}${figure(pair.after,'AFTER — polish QA timeline')}</div>`).join('')}
<h2>Required checkpoints and additional connection views</h2><div class="grid">${checks.map(check=>figure(`stills/${check.name}`,`${label(check.name)} · ${check.time.toFixed(3)} s`)).join('')}</div></main></html>`;
  await writeFile(path.join(directory,'index.html'),html);
  const tileWidth=480,imageHeight=270,tileHeight=308,columns=4;
  const sheetItems=[...(process.env.INCLUDE_BEFORE==='1'?comparisons.map(pair=>({name:'01-before-grey-supports.png',source:pair.before})):[]),...checks.map(check=>({name:check.name,source:`stills/${check.name}`}))];
  const tiles=await Promise.all(sheetItems.map(async(check,index)=>{
    const rendered=await sharp(path.join(directory,check.source)).resize(tileWidth,imageHeight).png().toBuffer();
    const caption=Buffer.from(`<svg width="${tileWidth}" height="38"><rect width="100%" height="100%" fill="#eee9df"/><text x="12" y="24" font-size="14" font-family="sans-serif" fill="#282a27">${escape(label(check.name))}</text></svg>`);
    const x=index%columns*tileWidth,y=Math.floor(index/columns)*tileHeight;
    return [{input:rendered,left:x,top:y},{input:caption,left:x,top:y+imageHeight}];
  }));
  await sharp({create:{width:columns*tileWidth,height:Math.ceil(sheetItems.length/columns)*tileHeight,channels:3,background:'#eee9df'}})
    .composite(tiles.flat()).png().toFile(path.join(directory,'contact-sheet.png'));
  console.log(path.join(directory,'index.html'));console.log(path.join(directory,'contact-sheet.png'));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
