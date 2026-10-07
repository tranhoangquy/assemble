import type { ProductPackage } from '@/types/product-package';
export type VideoType = 'long' | 'short';
export function selectPresentation(product: ProductPackage, type: VideoType = 'long'): ProductPackage {
  if (type === 'long') return product;
  const short = product.shortPresentation;
  if (!short) throw new Error('Short Video unavailable for this product.');
  // Keep registry/product/assembly identity; never inherit Long audio or DirectorPlan.
  return { ...product, video: short.video, filename: short.filename, checkpoints: short.checkpoints, directorPlan: undefined, approvedAudioMaster: undefined };
}
export function selectVideoId(product: ProductPackage, videoId?: string): ProductPackage {
  if (videoId === undefined || videoId === product.video.id) return product;
  if (videoId === product.shortPresentation?.video.id) return selectPresentation(product, 'short');
  throw new Error('Requested video does not match the selected product presentations.');
}
export function presentationType(product: ProductPackage): VideoType {
  return product.video.id === product.shortPresentation?.video.id ? 'short' : 'long';
}
export const presentationFocusKey = (product: ProductPackage) => `export-job:${product.id}:${product.video.id}`;
