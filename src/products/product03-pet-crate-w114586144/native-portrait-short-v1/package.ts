import type {ProductPackage} from '@/types/product-package';
import {longPackage} from '../continuous-production-v2-r2/full-long-package';
import {shots} from './edit';
export const shortPackage:ProductPackage={...longPackage,id:'product03-native-portrait-short-v1',label:'Product03 / native portrait assembly highlights',filename:'PRODUCT03-Short-native-v1-silent',video:{...longPackage.video,id:'product03-native-portrait-short-v1',title:'Wood & steel / assembly highlights',width:1080,height:1920,fps:30,scenes:shots.map(s=>({id:s.id,title:s.title,duration:s.end-s.start,phase:'assembly' as const,actions:[]}))}};
export function preflightPackage(count:number){return{...shortPackage,id:'product03-short-native-preflight-v1',filename:'PRODUCT03-Short-native-preflight-v1',video:{...shortPackage.video,id:'product03-short-native-preflight-v1',scenes:[{id:'native-keyframes',title:'Native keyframe preflight, not motion edit',duration:count/30,phase:'assembly' as const,actions:[]}]}};}
