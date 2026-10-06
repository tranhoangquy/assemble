/** Record immutable approved source files before the presentation-only pass. */
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='src/products/wf311613-standalone-murphy-bed';
async function files(dir:string):Promise<string[]>{const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(`${dir}/${e.name}`):[`${dir}/${e.name}`]))).flat();}
async function main(){
  const list=[...(await Promise.all(['product','assembly','director','validation','presentation'].map(d=>files(`${base}/${d}`)))).flat(),
    ...await files('src/engine'),
    'src/presentation/environment/BedroomEnvironment.tsx','src/presentation/environment/bedroom-config.ts',
    'src/components/viewer/Lighting.tsx','src/components/viewer/Scene.tsx','src/components/viewer/ProductViewer.tsx'];
  const hashes=Object.fromEntries(await Promise.all(list.sort().map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
  const dir='output/wf311613-standalone-murphy-bed/reviews/director-polish-02b';await mkdir(dir,{recursive:true});
  await writeFile(`${dir}/approved-source-locks.json`,JSON.stringify(hashes,null,2));
  console.log(`Locked ${list.length} approved source files.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
