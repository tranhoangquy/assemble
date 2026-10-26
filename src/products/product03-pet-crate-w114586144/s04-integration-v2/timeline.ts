import type {AssemblyDefinition,AnimationAction} from '@/types/assembly';
import {AssemblyGraph} from '@/engine/assembly/AssemblyGraph';
import * as v1 from '../timeline-integration-v1/timeline';
import {placements} from '../s04-two-bolt-proof-v1/model';
import {timing} from '../s04-two-bolt-proof-v1/proof';
export {placements};export type HardwareEvent=v1.HardwareEvent;
export const duration=278,alignment={start:247,end:262},showcase={start:268,end:278};
export const steps=v1.steps.map(s=>({...s,start:s.start+(s.number>=5?14:0),end:s.end+(s.number>=4?14:0),duration:s.duration+(s.number===4?14:0)}));
export const bodies=v1.bodies.map(b=>({...b,start:b.start+(b.step>=5?14:0),contact:b.contact+(b.step>=5?14:0)}));
export const hardware:HardwareEvent[]=v1.hardware.map(h=>{
 if(h.step!==4)return{...h,start:h.start+(h.step>=5?14:0),end:h.end+(h.step>=5?14:0)};
 const code=h.id.split('-')[1],i=Number(h.id.split('-').at(-1)),side=code==='K'?i-1:Math.floor((i-1)/2),offset=41+side*14;
 if(code==='K')return{...h,start:offset,end:offset+timing.bracketContact,note:'Exact accepted unmeasured S04 K pose/contact motion; not physical certification'};
 const t=i%2?timing.first:timing.second;return{...h,start:offset+t.start,end:offset+t.end,note:'Exact accepted S04 B approach/key/retained pose; illustrative initial seating only'};
});
export const holds=v1.holds.filter(h=>h.step!==4);
export const warnings=['K22/10 UNMEASURED DISPLAY APPROXIMATION','C13/C14 and I/J OPEN','Receiving/retention/torque/support/hand access NOT CERTIFIED'];
export const assembly:AssemblyDefinition={...v1.assembly,id:'product03-s04-integration-v2',sourceNote:'Versioned278s illustrative integration; frozen V1 and accepted S04 sources unchanged',steps:v1.assembly.steps.map(s=>s.id!=='S04'?{...s}:{...s,actions:hardware.filter(h=>h.step===4).flatMap(h=>[
 {type:'show',target:h.id,at:h.start-41,source:'image_visible',confidence:'low'},
 {type:'move',target:h.id,at:h.start-41,duration:h.end-h.start,to:placements.find(p=>p.id===h.id)!.position,source:'mechanically_inferred',confidence:'low'},
] as AnimationAction[])})};
export const graph=new AssemblyGraph(assembly);
export const mapToV1=(t:number)=>t<41?t:t<69?41+(t-41)/2:t-14;
