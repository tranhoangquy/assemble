import * as T from 'three';
import {createModel,placements} from './model';
export const duration=14,groups=['left','right'] as const;export type Side=typeof groups[number];
export const timing={bracketContact:2.2,first:{start:2.7,end:7.2},second:{start:7.7,end:12.2},end:14};
const ease=(t:number,a:number,b:number)=>T.MathUtils.smootherstep(t,a,b);
const position=(id:string)=>new T.Vector3(...placements.find(p=>p.id===id)!.position);
export function createProof(){
 const m=createModel(),r=m.r,base=new Map<T.Object3D,{p:T.Vector3;q:T.Quaternion;s:T.Vector3;v:boolean}>();
 m.rig.traverse(o=>base.set(o,{p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone(),v:o.visible}));
 const orientation=(id:string)=>{const p=placements.find(p=>p.id===id)!;return new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...p.outward!));};
 const rolls=[0,Math.PI,Math.PI,0];
 function bolt(index:number,t:number,start:number,end:number){
  const id=`hardware-B-${index}`,o=r.registry.require(id),normal=new T.Vector3(...placements.find(p=>p.id===id)!.outward!),u=T.MathUtils.clamp((t-start)/(end-start),0,1);
  if(t<start)return null;o.visible=true;
  const gap=40-30*ease(u,.15,.3)-10*ease(u,.55,.78),front=140*(1-ease(u,0,.15));
  o.position.copy(position(id)).addScaledVector(normal,gap).add(new T.Vector3(0,0,front));
  o.quaternion.copy(orientation(id));o.rotateOnAxis(new T.Vector3(0,1,0),rolls[index-1]+Math.PI/3*ease(u,.55,.78));
  const key=r.registry.require('hardware-L-1');
  if(u>=.35&&u<.99){
   const extra=70*(1-ease(u,.45,.55))+70*ease(u,.83,.91),z=140*(1-ease(u,.35,.45)),down=140*ease(u,.91,.99);
   key.visible=true;key.quaternion.copy(o.quaternion).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI));
   key.position.copy(o.position).addScaledVector(normal,66.2+extra).add(new T.Vector3(0,-down,z));
  }
  return{id,progress:u,gap,front,stage:u<.15?'BRING B FROM OPEN FRONT':u<.3?'ALIGN B / TIP TO VISIBLE K HOLE':u<.35?'TIP CONTACT HOLD':u<.55?'BRING L THROUGH OPEN BAY':u<.78?'INITIAL SYMBOLIC SEATING / LIMITED KEY STROKE':u<.83?'EXTERIOR SEAT HOLD':u<.99?'WITHDRAW L INTO OPEN BAY':'RETAIN B'};
 }
 function installedBolt(index:number){const id=`hardware-B-${index}`,o=r.registry.require(id);o.visible=true;o.position.copy(position(id));o.quaternion.copy(orientation(id));o.rotateOnAxis(new T.Vector3(0,1,0),rolls[index-1]+Math.PI/3);}
 function evaluate(side:Side,time:number){
  for(const[o,s]of base){o.position.copy(s.p);o.quaternion.copy(s.q);o.scale.copy(s.s);o.visible=s.v;}
  for(const[,o]of r.registry.entries())o.visible=false;for(const o of r.root.children)if(o.name.startsWith('presentation-stationary-hinge-'))o.visible=false;
  const t=T.MathUtils.clamp(time,0,duration),level=side==='left'?1:2;
  const previous=['part-12-1','part-10-1','part-10-2','part-11-1','part-11-2','part-9-1',...Array.from({length:12},(_,i)=>`hardware-D-${i+1}`)];
  for(const id of previous)r.registry.require(id).visible=true;
  if(side==='right'){r.registry.require('hardware-K-1').visible=true;installedBolt(1);installedBolt(2);previous.push('hardware-K-1','hardware-B-1','hardware-B-2');}
  const k=r.registry.require(`hardware-K-${level}`);k.visible=true;k.position.copy(position(k.name)).add(new T.Vector3(0,-35*(1-ease(t,1.4,timing.bracketContact)),55*(1-ease(t,.5,1.4))));
  const first=bolt(level*2-1,t,timing.first.start,timing.first.end),second=bolt(level*2,t,timing.second.start,timing.second.end),active=second&&t<timing.second.end?second:first&&t<timing.first.end?first:null;
  m.rig.updateMatrixWorld(true);
  return{side,time:t,stage:t<timing.bracketContact?'PLACE K / BOTH WOOD FACES RETAINED':active?.stage??(t>=timing.second.end?'K + B×2 RETAINED / EXTERIOR VISUAL PROPOSAL':'K CONTACT HOLD'),active,previous,bracketContact:t>=timing.bracketContact,
   seated:[...(side==='right'?['hardware-B-1','hardware-B-2']:[]),...(t>=timing.first.start+.78*(timing.first.end-timing.first.start)?[`hardware-B-${level*2-1}`]:[]),...(t>=timing.second.start+.78*(timing.second.end-timing.second.start)?[`hardware-B-${level*2}`]:[])],
   sourceStep:4,sourceCount:'K×2 / B×4',physical:'NOT CERTIFIED; unmeasured K proportions / hidden receivers and hand access unresolved',clippingPlanes:0};
 }
 function camera(side:Side){const sign=side==='left'?-1:1,target=new T.Vector3(sign*175,894,220),c=new T.PerspectiveCamera(40,1280/720,.1,10000);c.position.copy(target).add(new T.Vector3(-sign*100,-100,155));c.lookAt(target);c.updateMatrixWorld(true);return c;}
 function digest(){const rows:unknown[]=[];m.rig.traverse(o=>rows.push([o.name,o.visible,o.position.toArray(),o.quaternion.toArray()]));return rows;}
 return{...m,evaluate,camera,digest};
}
