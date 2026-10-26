import * as T from 'three';
import {createModel} from '../part-first-sequence-v1/model';
import {bodies,hardware,placements,steps,duration,alignment,holds,type HardwareEvent} from './timeline';
const ease=(t:number,a:number,b:number)=>a===b?(t>=b?1:0):T.MathUtils.smootherstep(t,a,b);
const row=(id:string)=>placements.find(p=>p.id===id)!;
export function createRuntime(mode:'guarded'|'candidate'='guarded'){
 const m=createModel(),r=m.r;
 const all=new Map<T.Object3D,{p:T.Vector3;q:T.Quaternion;s:T.Vector3;v:boolean}>();m.rig.traverse(o=>all.set(o,{p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone(),v:o.visible}));
 const position=new Map(placements.map(p=>[p.id,r.registry.require(p.id).position.clone()]));
 const reset=()=>{m.reset();for(const[o,a]of all){o.position.copy(a.p);o.quaternion.copy(a.q);o.scale.copy(a.s);o.visible=a.v;}};
 function partOffset(id:string,t:number){
  const list=bodies.filter(b=>b.id===id);let off=new T.Vector3(...(list[0]?.from??[0,0,0]));
  for(const b of list){if(t<b.start)break;off.set(...b.from).lerp(new T.Vector3(...b.to),ease(t,b.start,b.contact));}
  return off;
 }
 function setHardware(h:HardwareEvent,t:number){
  const obj=r.registry.require(h.id),p=row(h.id),n=new T.Vector3(...(p.outward??[0,0,1])),u=T.MathUtils.clamp((t-h.start)/(h.end-h.start),0,1);
  obj.visible=t>=h.start;let gap=0;
  if(mode==='guarded'&&['hardware-B-2','hardware-B-4'].includes(h.id)){
   obj.position.copy(position.get(h.id)!).addScaledVector(n,55).add(new T.Vector3(0,0,80));
   return{...h,progress:u,gap:55,visualState:'HELD_UNINSTALLED_HEAD_COLLISION'};
  }
  if(h.kind==='threaded'){
   gap=h.length+606*(1-ease(u,0,.15))-h.length*ease(u,.4,.8);obj.position.copy(position.get(h.id)!).addScaledVector(n,gap);
   const shortStroke=h.id==='hardware-B-1'||h.id==='hardware-B-3',base=h.id==='hardware-B-3'?Math.PI:0;
   // B1/B3 can use a bounded sixty-degree visual key stroke away from the divider.
   // This is presentation choreography, not a torque/turn-count specification.
   obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n);obj.rotateOnAxis(new T.Vector3(0,1,0),base+(shortStroke?Math.PI/3*(.8*ease(u,.4,.8)+.2*ease(u,.8,.87)):Math.PI*(1.5*ease(u,.4,.8)+.5*ease(u,.8,.87))));
   if(u>=.25&&u<.97){const tool=r.registry.require(`hardware-${h.tool}-1`),extra=650*(1-ease(u,.25,.4))+650*ease(u,.87,.97);tool.visible=true;
    if(h.tool==='L'){tool.quaternion.copy(obj.quaternion).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI));tool.position.copy(obj.position).addScaledVector(n,66.2+extra);}
    else{tool.quaternion.copy(obj.quaternion);tool.position.copy(obj.position).addScaledVector(n,73.3+extra);}
   }
  }else if(h.kind==='foot'){
   const host=r.registry.require(h.host),hostBase=position.get(h.host)!;obj.position.copy(position.get(h.id)!).add(host.position.clone().sub(hostBase)).addScaledVector(n,35*(1-ease(u,0,.8)));obj.rotateOnAxis(new T.Vector3(0,1,0),Math.PI*ease(u,.2,.9));
  }else if(h.kind==='bracket')obj.position.copy(position.get(h.id)!).addScaledVector(new T.Vector3(0,-1,0),45*(1-ease(u,0,.85)));
  else if(h.kind==='stack')obj.position.copy(position.get(h.id)!).addScaledVector(new T.Vector3(0,0,1),60*(1-ease(u,0,.85)));
  else{obj.position.set(760+(Number(h.id.split('-').at(-1))%2)*25,100+Math.floor((Number(h.id.split('-').at(-1))!-1)/2)*25,350);gap=null as unknown as number;}
  return{...h,progress:u,gap,visualState:h.kind==='held-pad'?'HELD_STAGED':h.kind==='stack'?'POSED_ONLY_RECEIVER_HOLD':u>=1?'INITIAL_SEATED':u<.15?'STAGED':u<.4?'ALIGNED':'INSERTING_SYMBOLIC'};
 }
 function evaluate(time:number){
  reset();const t=T.MathUtils.clamp(time,0,duration);for(const[,o]of r.registry.entries())o.visible=false;
  for(const o of r.root.children)if(o.name.startsWith('presentation-stationary-hinge-'))o.visible=false;
  const installed:string[]=[],prepared:string[]=[],active:string[]=[];
  for(const id of new Set(bodies.map(b=>b.id))){const events=bodies.filter(b=>b.id===id),first=events[0];if(t<first.start)continue;const o=r.registry.require(id),off=partOffset(id,t);o.visible=true;o.position.copy(position.get(id)!).add(off);
   const current=events.filter(b=>b.start<=t).at(-1)!;
   if(current.prepared||off.lengthSq()>1e-10){if(id==='part-1-1'||id==='part-2-1'||id==='part-5-1')prepared.push(id);if(t<current.contact)active.push(id);}else installed.push(id);
   if(id==='part-7-1'||id==='part-8-1'){const code=id.includes('-7-')?'7':'8',factory=r.root.children.find(o=>o.name===`presentation-stationary-hinge-${code}`)!;factory.visible=true;factory.position.copy(all.get(factory)!.p).add(off);}
  }
  let currentHardware:ReturnType<typeof setHardware>|null=null;const posed:string[]=[],seated:string[]=[],pending:string[]=[];
  for(const h of hardware){if(t<h.start)continue;const st=setHardware(h,t);if(t<h.end)currentHardware=st;if(st.visualState.startsWith('HELD'))pending.push(h.id);else if(h.kind==='stack')posed.push(h.id);else if(t>=h.end)seated.push(h.id);}
  // Whole-rig orientation is presentation staging; relative installed state remains.
  const inv=ease(t,steps[7].start,steps[7].start+1.4)*(1-ease(t,steps[14].start,steps[14].start+2));m.rig.rotation.x=inv*Math.PI;m.rig.position.y=inv*984;m.rig.updateMatrixWorld(true);
  const step=steps.find(st=>t<st.end&&t>=st.start)??(t>=alignment.start&&t<alignment.end?steps[17]:steps.at(-1)!);
  const body=bodies.find(b=>t>=b.start&&t<b.contact),stage=t>=alignment.start&&t<alignment.end?'ALIGNMENT / FINAL-RETENTION HOLD — NO TORQUE CLAIM':t>=254?'CANONICAL TARGET / FUNCTIONAL HOLD':currentHardware?`${currentHardware.id} / ${currentHardware.visualState}`:body?`${body.id} / PLACE BEFORE CURRENT FASTENERS`:'RETAINED CONTACT / SOURCE STEP HOLD';
  return{time:t,step:step.id,stepNumber:step.number,localTime:t-step.start,stage,installed,prepared,active,hardwareSeated:seated,posedHeld:posed,pending,currentHardware,body,
   visible:[...r.registry.entries()].filter(([,o])=>o.visible).map(([id])=>id),holds:holds.filter(h=>h.step<=step.number),mode,conditional:step.number>=4,clippingPlanes:0,physicalConfidence:'NOT_CERTIFIED — raw receiving overlaps remain',completeFilmAuthorized:false};
 }
 function camera(time:number,overview=false){
  const state=evaluate(time),camera=new T.PerspectiveCamera(35,1280/720,.1,20000);
  if(!overview&&state.currentHardware?.kind==='threaded'&&!state.currentHardware.visualState.startsWith('HELD')){
   const p=row(state.currentHardware.id),center=new T.Vector3(...p.position).applyMatrix4(m.rig.matrixWorld),n=new T.Vector3(...p.outward!).transformDirection(m.rig.matrixWorld),side=new T.Vector3().crossVectors(n,new T.Vector3(0,1,0));if(side.lengthSq()<.1)side.set(1,0,0);side.normalize();center.addScaledVector(n,20);camera.position.copy(center).addScaledVector(n,270).addScaledVector(side,210).add(new T.Vector3(0,145,0));camera.lookAt(center);
  }else{
   const box=new T.Box3();for(const [id,o]of r.registry.entries())if(o.visible&&id.startsWith('part-'))box.union(new T.Box3().setFromObject(o));const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),distance=Math.max(size.y*2.0,size.x*1.55,1800);camera.position.copy(center).add(new T.Vector3(-.75,.42,1).normalize().multiplyScalar(distance));camera.lookAt(center);
  }
  camera.updateMatrixWorld(true);return camera;
 }
 function digest(){const rows:unknown[]=[];m.rig.traverse(o=>rows.push({n:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible}));return rows;}
 return{...m,evaluate,camera,digest,reset};
}
