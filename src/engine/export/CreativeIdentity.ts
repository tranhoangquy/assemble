import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { ProductPackage } from '@/types/product-package';
import { sha256 } from './ExportCheckpoint';
/** Include evaluated mechanical, material, camera and presentation data; exclude audio mastering. */
export function creativeData(product: ProductPackage) {
  return { product: product.product, assembly: product.assembly, video: product.video };
}
export const creativeDataHash = (product: ProductPackage) => sha256(JSON.stringify(creativeData(product)));
export function creativePackageHash(product: ProductPackage): string {
  return sha256(JSON.stringify({ ...creativeData(product), directorPlan: product.directorPlan }));
}
/** Conservative renderer/assets fingerprint also protects a restart after an engine edit. */
export function rendererSourceHash(root = process.cwd()): string {
  const hash=createHash('sha256');
  function walk(relative: string) {
    const absolute=path.join(root,relative);
    let entries; try { entries=readdirSync(absolute,{withFileTypes:true}); } catch {return;}
    for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))) {
      const name=path.join(relative,entry.name);
      if(/(?:\.test\.|\/api\/export(?:\/|$)|\/engine\/export(?:\/|$)|\/components\/export(?:\/|$)|\/products\/export-manager\.ts$)/.test(name)) continue;
      if(entry.isDirectory()) walk(name);
      else if(entry.isFile()) hash.update(name).update('\0').update(readFileSync(path.join(root,name))).update('\0');
    }
  }
  walk('src'); walk('public');
  for(const file of ['package-lock.json','next.config.ts']) {
    try{hash.update(file).update(readFileSync(path.join(root,file)));}catch{/* Optional outside this repository. */}
  }
  return hash.digest('hex');
}
