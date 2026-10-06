/** QA artifact builder only. Never encodes a video or changes a camera. */
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp,{type OverlayOptions} from 'sharp';
import {polish02bId,polish02bCheckpoints} from '../director/polish-pass02b';
const dir='output/wf311613-standalone-murphy-bed/reviews/director-polish-02b';
const baseline='output/wf311613-standalone-murphy-bed/reviews/director-polish-02';
const labels=['Finished closed bedroom','Finished open bare bed','Mattress medium view','Mattress and bedding','Final open bedroom hero'];
const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
async function main(){
  await mkdir(`${dir}/baseline`,{recursive:true});
  const pairs=[{label:'Closed bedroom',before:'10-finished-closed.png',after:'01-finished-closed.png'},
    {label:'Mattress / bedding',before:'14-mattress-bedding.png',after:'04-mattress-bedding.png'},
    {label:'Final hero',before:'15-final-hero.png',after:'05-final-hero.png'}];
  for(const p of pairs)await copyFile(`${baseline}/stills/${p.before}`,`${dir}/baseline/${p.before}`);
  await copyFile(`${baseline}/validation-results.json`,`${dir}/mechanical-validation.json`);
  for(const [src,dest]of [['/private/tmp/wf-polish02b-tests.log','tests.log'],['/private/tmp/wf-polish02b-build.log','build.log'],['/private/tmp/wf-polish02b-gates.log','gates.log']])await copyFile(src,`${dir}/${dest}`);
  const lock=JSON.parse(await readFile(`${dir}/lock-verification.json`,'utf8'));
  const gates=JSON.parse(await readFile(`${dir}/mechanical-validation.json`,'utf8'));
  const seek=JSON.parse(await readFile(`${dir}/presentation-seek-verification.json`,'utf8'));
  const render=JSON.parse(await readFile(`${dir}/stills/render-manifest.json`,'utf8'));
  const fit=JSON.parse(await readFile(`${dir}/presentation-fit.json`,'utf8'));
  if(!lock.valid||!gates.valid||!gates.complete||!seek.valid||!fit.valid||render.errors.length)throw new Error('QA verification incomplete or failed');
  const presentationSources=['src/presentation/finished-bedroom/FinishedBedroom.tsx','src/presentation/finished-bedroom/ResidentialBedroom.tsx','src/types/presentation.ts','src/products/wf311613-standalone-murphy-bed/director/polish-pass02b.ts'];
  const presentationHashes=Object.fromEntries(await Promise.all(presentationSources.map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
  const stillHashes=Object.fromEntries(await Promise.all(polish02bCheckpoints.map(async c=>[c.name,createHash('sha256').update(await readFile(`${dir}/stills/${c.name}`)).digest('hex')])));
  await writeFile(`${dir}/candidate-manifest.json`,JSON.stringify({candidate:polish02bId,planSha256:lock.planSha256,videoSha256:lock.videoSha256,presentationHashes,stillHashes,fullMp4Rendered:false,audioApproved:false},null,2));
  const composites:OverlayOptions[]=[];
  const header=(text:string,w:number)=>Buffer.from(`<svg width="${w}" height="38"><rect width="100%" height="100%" fill="#e9e3d8"/><text x="18" y="25" font-family="sans-serif" font-size="17" fill="#292b28">${escape(text)}</text></svg>`);
  composites.push({input:header('POLISH 02 — approved baseline',800),top:0,left:0},{input:header('POLISH 02B — presentation QA',800),top:0,left:800});
  for(const[pIndex,p]of pairs.entries())for(const[column,file]of [[0,`${dir}/baseline/${p.before}`],[1,`${dir}/stills/${p.after}`]] as const){
    const top=38+pIndex*488;
    composites.push({input:await sharp(file).resize(800,450).png().toBuffer(),left:column*800,top},
      {input:header(p.label,800),left:column*800,top:top+450});
  }
  await sharp({create:{width:1600,height:1502,channels:3,background:'#e9e3d8'}}).composite(composites).png().toFile(`${dir}/comparison-sheet.png`);
  const tiles:OverlayOptions[]=[];
  for(const[i,c]of polish02bCheckpoints.entries()){
    tiles.push({input:await sharp(`${dir}/stills/${c.name}`).resize(640,360).png().toBuffer(),left:i%2*640,top:Math.floor(i/2)*398},
      {input:header(labels[i],640),left:i%2*640,top:Math.floor(i/2)*398+360});
  }
  await sharp({create:{width:1280,height:1194,channels:3,background:'#e9e3d8'}}).composite(tiles).png().toFile(`${dir}/contact-sheet.png`);
  await writeFile(`${dir}/index.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Director Polish 02B QA</title><style>body{background:#e9e3d8;color:#292b28;font:16px system-ui;margin:30px auto;max-width:1440px;padding:0 24px}img{width:100%;display:block}figure{margin:0;background:#faf8f2}figcaption{padding:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}a{color:#435941}@media(max-width:700px){.grid{grid-template-columns:1fr}}</style><h1>Director Polish 02B — presentation QA only</h1><p>Assembly locked. Awaiting director review. No full MP4 or music.</p><p><a href="report.md">Presentation report + lock confirmations</a> · <a href="comparison-sheet.png">Polish 02 vs 02B comparison sheet</a> · <a href="contact-sheet.png">All five QA stills</a></p><h2>Baseline vs candidate</h2><img src="comparison-sheet.png" alt="Three comparisons: closed bedroom, bedding and final hero"><h2>Fresh deterministic 1280 × 720 stills</h2><div class="grid">${polish02bCheckpoints.map((c,i)=>`<figure><a href="stills/${c.name}"><img src="stills/${c.name}" alt="${labels[i]}"></a><figcaption>${labels[i]} · ${c.time.toFixed(3)} s · actual showcase camera</figcaption></figure>`).join('')}</div></html>`);
  await writeFile(`${dir}/report.md`,`# Director Polish 02B — presentation-only QA

Candidate: ${polish02bId}. Five fresh deterministic 1280 × 720 stills, plus ONE three-pair comparison sheet. No full MP4, no music, no claimed director/production approval.

## Presentation changes ONLY

- Finished room: bedside table enlarged from 40 × 48 × 38 to 49 × 54 × 42 cm, restrained drawer fronts and pulls, ceramic-base linen-shade lamp, one neutral book; one plant; one minimal framed abstract landscape; dimensional window frame/sill and fixed pleated linen curtains; subtle baseboard detail outside the cabinet span.
- Area rug expanded from 340 × 330 to 395 × 320 cm, repositioned to [0, -107] in X/Z. Low-contrast woven surface and border. Floor-height presentation plane does not lift the product or become structural support.
- Mattress: identical center [0, 41.8, -89.2], size 217 × 19 × 182 cm, rounded radius 1.6. **PRESENTATION ESTIMATE, not manufacturer/commercial specification.** Warm off-white textile, subtle quilting/stitches, actual rounded perimeter piping instead of opaque seam slabs. Cosmetic top stitches extend only about 0.03 cm above the top; horizontal footprint stays inside the approved envelope.
- Bedding: fitted cover, a fixed parametric softly filled neutral duvet with sloped perimeter/low folds, turned-back edge, two rounded pillows. No simulation, randomness, brands or rail-obscuring skirt. Bed frame and both folding legs remain visible.
- Only showcase cameras change: closer 3/4 open hero, separate closed-bedroom framing, dedicated mattress medium shot. No depth of field. Same room remains continuous through closed/open/mattress/bedding cuts.
- Very small warm ambient/directional fill is parented to finished-room visibility. Existing assembly lighting, exposure 0.97, fog and product materials stay unchanged. No colored/cinematic lighting or downloaded assets.

All these objects remain generic **presentation-only** children outside ProductRenderer/ObjectRegistry, PDF parts, AssemblyGraph and hardware. They are invisible before ${lock.assemblyRuntime.toFixed(6)} s. Mattress/bedding retain the approved later editorial onset. No additional assembly step.

## Explicit lock confirmations

- Assembly timeline remains **498.253694 seconds** (floating source ${lock.assemblyRuntime}).
- Steps 1–31 are byte-equivalent: approved DirectorPlan and AssemblyDefinition reused directly; first 31 VideoScenes retain byte-identical data.
- All **${lock.lockedSourceFiles}** approved source files in product/assembly/director/presentation metadata/validation/engine and assembly room/viewer/light code retain exact SHA-256. No changed path, coordinate, geometry, mechanism, hardware, helper semantic or validator threshold.
- Product geometry hash **4645bcf33682cbf377d84a2d0f8139674b6d80f5a5014a29505bf97287f82a45** and material hash **d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc** PASS.
- No assembly camera changed: every pre-existing preset retained; new cameras referenced ONLY after Step 31.
- No assembly caption changed: same approved caption array/reference.
- No mechanical path changed: same action objects even for post-assembly showcase; Step 25 untouched.
- No validator/tolerance changed: exact file hashes PASS; existing full Polish 02 gate suite rerun unchanged.
- Assembly environment/exposure unchanged; finished-only lighting/props deterministically disappear on backward seek.
- Showcase remains **20.8 s**; total remains **519.053694 s (~8:39.054)**. No retiming.

[Exact locks and candidate SHA](lock-verification.json), [92-file SHA manifest](approved-source-locks.json).

## QA and verification

Existing mechanical/grounded-floor/front-path/B8/pivot/bearing/piston/leg/receiver/seek gates: **PASS**, complete=true. [Fresh unchanged gate suite](mechanical-validation.json), [execution log](gates.log). Its candidate ID remains Polish 02 intentionally: 02B reuses the exact same plan and assembly, rather than renaming or duplicating validated mechanics.

Additional actual-mesh presentation-fit check: **PASS**. Mattress, fitted cover and new duvet bounds do not intersect rails/ends/folding-leg parts. Piping's horizontal extension is at most 0.044 cm, inside the existing +0.06 cm allowance. Table, plant, curtains and art lie outside the product span. [Presentation fit and measured bounds](presentation-fit.json). No engineering gate was changed to accommodate these props.

Typecheck/lint: PASS. Tests: 146/146 PASS. Production build: PASS. [Tests](tests.log), [build](build.log).

Browser render errors: none. Reverse-seek PNG/camera checks: PASS (${seek.checks.length} checkpoints). [Render manifest](stills/render-manifest.json), [determinism](presentation-seek-verification.json). All five QA views use actual post-assembly camera presets, no inspection-camera substitution. Visual QA checks mattress/body clearance, visible rails/legs, duvet folds, room continuity and furnishing silhouette.

Tooling: checkpoint/seek scripts use the full Chromium executable already used by the video renderer; production mode avoids the dev initialization stall. No timeline/camera/geometry logic changed. PNG comparisons remain exact SHA comparisons. The presentation-only seek check explicitly permits camera floating-point roundoff up to 1e-10 scene units (an initial mattress check produced identical PNGs but ~3e-14 camera roundoff); raw values and maximum deltas remain in the report. Default strict camera comparison and ALL existing mechanical validator tolerances remain unchanged.

## Files / stop boundary

[Five-still gallery](index.html), [contact sheet](contact-sheet.png), [Polish 02 vs 02B comparison sheet](comparison-sheet.png).

No optional second hero angle added: the five requested primary views cover the micro-pass without adding another showcase cut. No approved licensed music exists; no music downloaded or muxed. Audio pipeline remains ready and silent. **STOP after QA; awaiting director review before any full MP4.**
`);
  console.log(`${dir}/index.html`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
