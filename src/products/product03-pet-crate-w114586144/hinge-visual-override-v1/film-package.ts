import {longPackage as longPrior} from '../final-camera-fix-v1/film-package';
import {shortPackage as shortPrior} from '../human-3-image-correction-v1/film-package';
export const longPackage={...longPrior,id:'product03-hinge-human-long-v5',filename:'PRODUCT03-Long-V5-278s-SILENT',video:{...longPrior.video,id:'product03-hinge-human-long-v5'}};
export const shortPackage={...shortPrior,id:'product03-hinge-human-short-v3',filename:'PRODUCT03-Short-V3-59s-SILENT',video:{...shortPrior.video,id:'product03-hinge-human-short-v3'}};
export function capturePackage(start:number,end:number){return{...longPackage,id:`hinge-long-v5-${start}-${end}`,video:{...longPackage.video,id:`hinge-long-v5-${start}-${end}`,scenes:[{id:'window',title:'Hinge integration',duration:end-start,phase:'assembly' as const,actions:[]}]}};}
export function preflightPackage(count:number){return{...shortPackage,id:'hinge-short-v3-preflight',video:{...shortPackage.video,id:'hinge-short-v3-preflight',scenes:[{id:'keyframes',title:'Native selected frames',duration:count/30,phase:'assembly' as const,actions:[]}]}};}
