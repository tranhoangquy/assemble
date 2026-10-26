import {createRuntime as createV2} from '../s04-integration-v2/runtime';
import * as baseline from '../s04-integration-v2/timeline';
import {toV2,fromV2} from './option-n-clock';
export const duration=278;
export const steps=baseline.steps.map(s=>({...s,start:fromV2(s.start),end:fromV2(s.end),duration:fromV2(s.end)-fromV2(s.start)}));
export const hardware=baseline.hardware.map(h=>({...h,start:fromV2(h.start),end:fromV2(h.end)}));
export const bodies=baseline.bodies.map(b=>({...b,start:fromV2(b.start),contact:fromV2(b.contact)}));
export function createRuntime(){
 const v2=createV2();
 const evaluate=(time:number)=>{const t=Math.max(0,Math.min(duration,time)),sourceTime=toV2(t),s=v2.evaluate(sourceTime),step=steps.find(a=>a.id===s.step)!;
  return{...s,time:t,sourceV2Time:sourceTime,localTime:t-step.start,currentHardware:s.currentHardware?{...s.currentHardware,start:fromV2(s.currentHardware.start),end:fromV2(s.currentHardware.end)}:null,mode:'OPTION_N_TIMING_ONLY',completeFilmAuthorized:false};
 };
 // Baseline camera rule at mapped source time: deliberately no camera improvement.
 const camera=(time:number,overview=false)=>v2.camera(toV2(time),overview);
 return{...v2,evaluate,camera,source:v2,digest:v2.digest,reset:()=>evaluate(0)};
}
