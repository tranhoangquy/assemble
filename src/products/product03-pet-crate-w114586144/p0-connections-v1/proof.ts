import * as T from 'three';
import {createModel,placements} from './model';
export const fps=24,clipDuration=8;
export const groups=['S02','S05','S06','S08','S15'] as const;
export type Group=typeof groups[number];
const ease=(t:number,a:number,b:number)=>T.MathUtils.smootherstep(t,a,b);
export function createProof(corrected=true){
 const m=createModel(corrected),r=m.r;
 function evaluate(group:Group,time:number){
  m.reset();const t=T.MathUtils.clamp(time,0,8),step=Number(group.slice(1));
  for(const [id,o]of r.registry.entries()){
   const row=placements.find(p=>p.id===id);o.visible=!!row&&row.step<=step;
   if(/^hardware-[LMO]-/.test(id))o.visible=false;
  }
  for(const o of r.root.children)if(o.name.startsWith('presentation-stationary-hinge-'))o.visible=false;
  // Retain earlier installed parts; show the active part already staged at t0.
  const active=group==='S02'?'part-11-2':group==='S05'?'part-13-1':group==='S06'?'part-15-1':group==='S08'?'part-2-1':'part-14-1';
  const screw=group==='S02'?'hardware-D-5':group==='S05'?'hardware-D-13':group==='S06'?'hardware-D-20':group==='S08'?'hardware-D-35':null;
  const a=r.registry.require(active),q=ease(t,1,4),off=group==='S02'?new T.Vector3(0,0,65):group==='S05'?new T.Vector3(0,0,-65):group==='S06'?new T.Vector3(0,-70,0):group==='S08'?new T.Vector3(85,0,0):new T.Vector3(0,130,0);
  a.position.addScaledVector(off,1-q);
  // Unshown repetitions remain out of this isolated exemplification, rather than
  // falsely appearing secured before their supporting part has arrived.
  for(const row of placements.filter(p=>p.step===step&&p.id.startsWith('hardware-')))r.registry.require(row.id).visible=row.id===screw;
  if(group==='S02')r.registry.require('part-11-1').visible=false;
  if(screw){const o=r.registry.require(screw);
   const n=new T.Vector3(0,1,0).applyQuaternion(o.quaternion);const engagement=ease(t,5,7);
   o.position.addScaledVector(n,50*(1-engagement));o.rotateOnAxis(new T.Vector3(0,1,0),engagement*Math.PI*2);
  }
  // S08 frame feet follow the moving prepared side; no independently fixed feet.
  if(group==='S08')for(const id of ['hardware-A-3','hardware-A-4'])r.registry.require(id).position.x+=85*(1-q);
  // Keep5 staged forS14 rather than install early in S08; its feet follow.
  if(step>=7&&step<14){r.registry.require('part-5-1').visible=false;r.registry.require('hardware-A-5').visible=false;}
  // All source-inverted operations share one retained rigid presentation pose.
  m.rig.rotation.x=group==='S08'?Math.PI:0;m.rig.position.y=group==='S08'?984:0;m.rig.updateMatrixWorld(true);
  return{group,time:t,active,screw,progress:q,representation:'Unmeasured illustrative exterior contacts; hidden engagement NOT VERIFIED',F:'No F insertion path rendered: source access/ladder obstruction unresolved',installedRetained:true};
 }
 function digest(){const rows:unknown[]=[];m.rig.traverse(o=>rows.push({name:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible}));return rows;}
 return{...m,evaluate,digest};
}
