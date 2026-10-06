import { packages as standalone } from './wf311613-standalone-murphy-bed';
import { packages as merax } from './merax-queen-film';
import { packages as bookcase } from './murphy-bed';
import { packages as cabinet } from './demo-cabinet';
export const productCatalog = [...standalone,...merax,...bookcase,...cabinet];
export const defaultProductId = 'wf311613-final-micro-pass';
export function resolveProductSelection(requested?:string) {
  return productCatalog.find(p=>p.id===requested)?.id ?? defaultProductId;
}
export function productionProductLabel(id:string) {
  return id===defaultProductId?'WF311613 · Standalone Murphy Bed':getProductPackage(id).product.name;
}
export function getProductPackage(id: string) {
  const entry = productCatalog.find(p => p.id === id || p.productKey === id);
  if (!entry) throw new Error(`Unknown product/project: ${id}`);
  return entry;
}
