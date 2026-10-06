import { ProductManager } from '@/engine/product/ProductManager';
import { productCatalog } from './registry';
export const productManager = new ProductManager(productCatalog);
