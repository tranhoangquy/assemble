// Output-only orchestration: run existing gate code unchanged, redirect only
// its report writes so historical approval evidence is never overwritten.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {syncBuiltinESMExports} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const evidence=path.dirname(fileURLToPath(import.meta.url));
const mappings=[
  ['director-polish-02b','polish02b-presentation'],
  ['director-polish-02','approved-mechanical-gates'],
  ['final-micro-pass','micro-native'],
].map(([from,to])=>[path.resolve('output/wf311613-standalone-murphy-bed/reviews',from),path.join(evidence,to)]);
const redirect=p=>{
  if(typeof p!=='string'&&!(p instanceof URL))return p;
  const absolute=p instanceof URL?fileURLToPath(p):path.resolve(p);
  for(const [from,to]of mappings)if(absolute===from||absolute.startsWith(from+path.sep))return to+absolute.slice(from.length);
  return p;
};
for(const method of ['writeFile','mkdir']){
  const original=fsp[method].bind(fsp);fsp[method]=(p,...args)=>original(redirect(p),...args);
}
for(const method of ['writeFileSync','mkdirSync']){
  const original=fs[method].bind(fs);fs[method]=(p,...args)=>original(redirect(p),...args);
}
syncBuiltinESMExports();
const entries={
  mechanical:'src/products/wf311613-standalone-murphy-bed/validation/run-polish02-gates.ts',
  micro:'src/products/wf311613-standalone-murphy-bed/tools/validate-micro-pass.ts',
  props:'src/products/wf311613-standalone-murphy-bed/tools/verify-polish02b-props.ts',
};
const entry=entries[process.argv[2]];if(!entry)throw new Error('Use mechanical, micro or props');
console.log('Running unchanged approved gate:',entry,'; reports redirected to',evidence);
await import(pathToFileURL(path.resolve(entry)).href);
