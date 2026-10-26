import * as T from 'three';
import {createModel,placements,representation} from './model';
import {createModel as previousModel,placements as previousPlacements} from '../p0-connections-v1/model';
export const duration=12,fps=24;
export type Group='S10'|'S12';
const ease=(t:number,a:number,b:number)=>T.MathUtils.smootherstep(t,a,b);
export function createProof(proposal=true){
 const m=proposal?createModel():previousModel(true),rows=proposal?placements:previousPlacements;
 function evaluate(group:Group,time:number){
  m.reset();const t=T.MathUtils.clamp(time,0,duration),step=Number(group.slice(1)),rear=step===10,active=rear?'hardware-F-1':'hardware-F-5';
  for(const [id,o]of m.r.registry.entries()){const p=rows.find(p=>p.id===id);o.visible=!!p&&p.step<=step;}
  for(const o of m.r.root.children)if(o.name.startsWith('presentation-stationary-hinge-'))o.visible=false;
  m.r.registry.require('part-5-1').visible=false;m.r.registry.require('hardware-A-5').visible=false;
  const screw=m.r.registry.require(active),tool=m.r.registry.require('hardware-M-1'),row=rows.find(p=>p.id===active)!,n=new T.Vector3(...row.outward!);
  let gap=0,roll=0,toolOffset=0;
  if(proposal){
   gap=37*(1-ease(t,2.5,6));
   // Symbolic rotation, no manufactured pitch, turn count or torque claimed.
   roll=Math.PI*(1.25*ease(t,2.5,6)+.5*ease(t,6,7.25));
   toolOffset=15*(1-ease(t,.5,1.5))+75*ease(t,7.5,10);
   screw.position.copy(new T.Vector3(...row.position)).addScaledVector(n,gap);
   screw.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n);screw.rotateOnAxis(new T.Vector3(0,1,0),roll);
   tool.visible=true;tool.quaternion.copy(screw.quaternion);
   tool.position.copy(screw.position).addScaledVector(n,72+1.3+toolOffset);
  }else tool.visible=false;
  m.rig.rotation.x=Math.PI;m.rig.position.y=984;m.rig.updateMatrixWorld(true);
  return{group,time:t,proposal,active,screwGap:gap,toolOffset,roll,
   stage:!proposal?'BEFORE — lower-face access HOLD':t<.5?'IDENTIFY / aligned lap faces':t<1.5?'ALIGN DRIVER':t<2.5?'ENGAGEMENT HOLD':t<6?'CONTINUOUS EXTERIOR APPROACH':t<7.5?'SYMBOLIC FASTENING':t<10?'DRIVER WITHDRAWAL':'INSTALLED HOLD',
   representation:proposal?representation:'Previously accepted provisional model; F remained unresolved',
   receiver:'OMITTED — raw shaft/stock overlap is a symbolic representation, not validated physical engagement',
   visible:[...m.r.registry.entries()].filter(([,o])=>o.visible).map(([id])=>id),clippingPlanes:0};
 }
 function digest(){const rows:unknown[]=[];m.rig.traverse(o=>rows.push({name:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible}));return rows;}
 return{...m,evaluate,digest};
}
