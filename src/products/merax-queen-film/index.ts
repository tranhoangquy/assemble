import product from './product.json';
import assembly from './assembly.json';
import video from './video.json';
import type {ProductPackage} from '@/types/product-package';
export const packages: readonly ProductPackage[] = [{id:'merax-queen-film',productKey:'merax-queen-film',label:'Merax Queen · New 16-Scene Film',filename:'merax-queen-murphy-bed-new-assembly-film.mp4',product:product as unknown as ProductPackage['product'],assembly:assembly as ProductPackage['assembly'],video:video as unknown as ProductPackage['video']}];
