import * as T from 'three';
import {createModel,placements,drive} from './model';
export const fps=24;
export const groups=['S02','S05','S06','S08','S15'] as const;
export type Group=typeof groups[number];
export const duration=(g:Group)=>g==='S15'?6:10;
export const plan:Record<Group,{active:string;screw:string|null;offset:[number,number,number];target:[number,number,number];cameraOffset:[number,number,number];source:string}>={
 S02:{active:'part-11-2',screw:'hardware-D-5',offset:[0,0,65],target:[189,800,-69],cameraOffset:[240,240,-380],source:'PDFp4 S2 / D4; one of two active-divider fasteners shown'},
 S05:{active:'part-13-1',screw:'hardware-D-13',offset:[0,0,-65],target:[-558,914,-277],cameraOffset:[-220,140,-340],source:'PDFp6 S5 / D7; one exemplar shown'},
 S06:{active:'part-15-1',screw:'hardware-D-20',offset:[0,-70,0],target:[-567,735,-20],cameraOffset:[-308,-231,264],source:'PDFp6 S6 / D10; one exemplar shown'},
 S08:{active:'part-2-1',screw:'hardware-D-35',offset:[85,0,0],target:[594,914,-190],cameraOffset:[300,170,350],source:'PDFp7 S8 / D10; one active-side exemplar shown'},
 S15:{active:'part-14-1',screw:null,offset:[0,130,0],target:[0,150,0],cameraOffset:[-1100,800,1550],source:'PDFp11 S15 / rests on6; NO fastener or tool added'},
};
const ease=(t:number,a:number,b:number)=>T.MathUtils.smootherstep(t,a,b);
export const times={partStart:.5,partContact:2.5,screwEnter:3.25,screwAtTarget:4.25,toolEnter:4.75,toolEngaged:5.75,insertionEnd:7.75,tighteningEnd:8.25,toolWithdrawn:9.25};
export function createProof(){
 const m=createModel(),r=m.r;
 function evaluate(group:Group,time:number){
  m.reset();const t=T.MathUtils.clamp(time,0,duration(group)),step=Number(group.slice(1)),p=plan[group],q=ease(t,times.partStart,times.partContact);
  for(const [id,o]of r.registry.entries()){const row=placements.find(p=>p.id===id);o.visible=!!row&&row.step<=step&&!/^hardware-[LMO]-/.test(id);}
  for(const o of r.root.children)if(o.name.startsWith('presentation-stationary-hinge-'))o.visible=false;
  // Current fasteners wait until structural contact. Earlier installed fasteners persist.
  for(const row of placements.filter(p=>p.step===step&&p.id.startsWith('hardware-')))r.registry.require(row.id).visible=false;
  if(group==='S02')for(const id of ['hardware-D-7','hardware-D-8'])r.registry.require(id).visible=true; // previously completed first divider
  if(group==='S08')for(let i=30;i<=34;i++)r.registry.require(`hardware-D-${i}`).visible=true; // earlier left side within S8
  r.registry.require(p.active).position.addScaledVector(new T.Vector3(...p.offset),1-q);
  if(group==='S08')for(const id of ['hardware-A-3','hardware-A-4'])r.registry.require(id).position.x+=85*(1-q);
  if(step>=7&&step<14){r.registry.require('part-5-1').visible=false;r.registry.require('hardware-A-5').visible=false;}
  const tool=r.registry.require('hardware-L-1');tool.visible=false;
  let screwGap:number|null=null,toolOffset:number|null=null;
  if(p.screw){
   const screw=r.registry.require(p.screw),row=placements.find(row=>row.id===p.screw)!,n=new T.Vector3(...row.outward!);
   screwGap=44+606*(1-ease(t,times.screwEnter,times.screwAtTarget))-44*ease(t,times.toolEngaged,times.insertionEnd);
   const roll=Math.PI*(1.5*ease(t,times.toolEngaged,times.insertionEnd)+.5*ease(t,times.insertionEnd,times.tighteningEnd));
   screw.position.copy(new T.Vector3(...row.position)).addScaledVector(n,screwGap);
   screw.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n);screw.rotateOnAxis(new T.Vector3(0,1,0),roll);
   screw.visible=t>=times.screwEnter;
   toolOffset=650*(1-ease(t,times.toolEnter,times.toolEngaged))+650*ease(t,times.tighteningEnd,times.toolWithdrawn);
   tool.quaternion.copy(screw.quaternion).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI));
   tool.position.copy(screw.position).addScaledVector(n,65+drive.tipPlane+toolOffset);
   tool.visible=t>=times.toolEnter&&t<times.toolWithdrawn;
  }
  m.rig.rotation.x=group==='S08'?Math.PI:0;m.rig.position.y=group==='S08'?984:0;m.rig.updateMatrixWorld(true);
  const stage=t<.5?'IDENTIFY PART AND TARGET':t<2.5?'PLACE PART / NO NEW SCREW':group==='S15'?'CONTACT / RETAINED SUPPORT — NO SCREW':t<3.25?'CONTACT HOLD / PART RETAINED':t<4.25?'BRING SCREW TO CONTACT':t<4.75?'SCREW TIP ALIGNED / NO TOOL YET':t<5.75?'BRING HEX KEY L':t<7.75?'SYMBOLIC INSERTION AND TURN':t<8.25?'EXTERIOR SEATING':t<9.25?'WITHDRAW KEY / KEEP CONNECTION':'INSTALLED HOLD';
  return{group,time:t,active:p.active,screw:p.screw,stage,partProgress:q,screwGap,toolOffset,visible:[...r.registry.entries()].filter(([,o])=>o.visible).map(([id])=>id),source:p.source,
   scope:'Illustrative exterior sequence. Exact positions/receivers/support/hand access unverified; no hidden receiving geometry.',clippingPlanes:0};
 }
 function camera(group:Group){const p=plan[group],c=new T.PerspectiveCamera(35,1280/720,.1,20000),center=new T.Vector3(...p.target).applyMatrix4(m.rig.matrixWorld);c.position.copy(center).add(new T.Vector3(...p.cameraOffset));c.lookAt(center);c.updateMatrixWorld(true);return c;}
 function digest(){const rows:unknown[]=[];m.rig.traverse(o=>rows.push({name:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible}));return rows;}
 return{...m,evaluate,camera,digest};
}
