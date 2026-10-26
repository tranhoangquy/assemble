import * as T from 'three';
import {createRuntime as baseline} from '../continuous-production-v1/option-n-runtime';
export {steps,hardware,bodies,duration} from '../continuous-production-v1/option-n-runtime';
/** Bounded human revision. Source clock/actor roots/counts are unchanged.
 * No door retention or hidden receiving detail is recovered by this adapter. */
export function createRuntime(corrected=true){
 const r=baseline();
 if(corrected){
  // A prototype is built stem along +Y; legacy outward quaternion maps +Y to
  // -Y. Reverse constituent geometry locally, preserving root/host trajectory.
  // PDF p7/S7 shows the stem toward the frame and disc outside, not vice versa.
  for(let i=1;i<=5;i++)for(const c of r.r.registry.require(`hardware-A-${i}`).children){if(!(c instanceof T.Mesh))throw Error('Unexpected A constituent');c.geometry=c.geometry.clone();c.geometry.translate(0,-2*c.position.y,0);}
  // PDF p3 lists hinge constituents with doors; p11/S16 shows two loose E on
  // one leaf. The legacy second pair of door-leaf bores was unsupported.
  // Omit those four pairs, without substituting welds, screws or a bond claim.
  for(const code of ['7','8']){
   const d=r.r.registry.require(`part-${code}-1`);
   for(const g of d.children.filter(o=>o instanceof T.Group&&o.children.length===2)){
    const leaf=g.children.find(o=>o instanceof T.Mesh&&o.geometry instanceof T.ExtrudeGeometry) as T.Mesh|undefined;
    if(!leaf)continue;
    leaf.geometry=new T.BoxGeometry(12,30,1.5);
    leaf.name=`door-${code}-leaf-unverified-attachment`;
    leaf.userData={source:'PDF p3/p11 exterior constituent only',attachment:'OPEN; no added bores, screws or welds'};
   }
  }
 }
 const evaluate=(time:number)=>({...r.evaluate(time),mode:corrected?'HUMAN_3_IMAGE_CORRECTION_V1':'HUMAN_REJECTED_BASELINE',doorAttachment:'OPEN — constituent association is not physical retention evidence',doorOperation:'HOLD',NStatus:'HELD_STAGED — not installed'});
 const camera=(time:number,overview=false)=>{const c=r.camera(time,overview);evaluate(time);return c;};
 return{...r,evaluate,camera,reset:()=>evaluate(0)};
}
