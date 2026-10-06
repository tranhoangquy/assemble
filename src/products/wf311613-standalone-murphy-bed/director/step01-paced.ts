import {step01V2Plan,step01V2Product,step01V2Video} from './step01-v2';
import {retimeStepOne} from './pacing';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
export const step01PacedPlan=retimeStepOne(step01V2Plan);
export const step01PacedProduct=step01V2Product;
export const step01PacedAssembly=DirectorPlanCompiler.assembly(step01PacedPlan);
let cursor=0;
export const step01PacedVideo={...step01V2Video,id:'wf311613-step01-pacing',scenes:DirectorPlanCompiler.scenes(step01PacedPlan).map(s=>({...s,partIntro:undefined})),reviewCaptions:step01PacedPlan.steps[0].shots.map(s=>{const start=cursor;cursor+=s.duration;return {start,end:cursor,title:s.id==='result'?'Cabinet side complete':s.type.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase()),note:s.note??''};})};
