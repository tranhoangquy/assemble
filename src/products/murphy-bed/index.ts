import product from './product.json';
import assembly from './assembly.json';
import video from './video.json';
import type {ProductPackage} from '@/types/product-package';
export const packages: readonly ProductPackage[] = [{id:'murphy-bed',productKey:'murphy-bed',label:'Murphy Bed + Side Bookcase',filename:'murphy-bed-side-bookcase-assembly.mp4',product:product as unknown as ProductPackage['product'],assembly:assembly as ProductPackage['assembly'],video:video as unknown as ProductPackage['video']}];
