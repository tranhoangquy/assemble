import * as T from 'three';
import {createRuntime as createV1} from '../timeline-integration-v1/runtime';
import {createProof} from '../s04-two-bolt-proof-v1/proof';
import {steps,hardware,bodies,holds,warnings,duration,mapToV1,placements} from './timeline';
const isBK=(id:string)=>/^hardware-[BK]-/.test(id);
/** Product-owned pose composition. The final scene uses the accepted S04 model;
 * unchanged V1 operations supply absolute poses for other actors. No video splice,
 * engine/schema change, new geometry, or mutation of frozen source is involved. */
export function createRuntime(){
 const previous=createV1(),accepted=createProof(),r=accepted.r,rig=accepted.rig;
 function evaluate(time:number){
  const t=T.MathUtils.clamp(time,0,duration),old=previous.evaluate(mapToV1(t)),inside=t>=41&&t<69;
  // Canonical nanosecond local time avoids IEEE subtraction changing visibility
  // at an exact 2.7s/7.7s event boundary. This is time precision, not fit tolerance.
  const side=t<55?'left':'right',local=t<41?0:t>=69?14:Math.round((t-(side==='left'?41:55))*1e9)/1e9,micro=accepted.evaluate(side,local);
  for(const[id,target]of r.registry.entries()){
   if(t>=41&&isBK(id)||inside&&id==='hardware-L-1')continue;
   const source=previous.r.registry.require(id);target.position.copy(source.position);target.quaternion.copy(source.quaternion);target.scale.copy(source.scale);target.visible=source.visible;
  }
  // Factory hinge groups are descendants outside the registry. Preserve their
  // absolute introduction/offset state alongside the registered source doors.
  for(const code of ['7','8']){const name=`presentation-stationary-hinge-${code}`,source=previous.r.root.children.find(o=>o.name===name)!,target=r.root.children.find(o=>o.name===name)!;target.position.copy(source.position);target.quaternion.copy(source.quaternion);target.visible=source.visible;}
  rig.position.copy(previous.rig.position);rig.quaternion.copy(previous.rig.quaternion);rig.scale.copy(previous.rig.scale);rig.updateMatrixWorld(true);
  const step=steps.find(s=>s.id===old.step)!,seated=old.hardwareSeated.filter(id=>!isBK(id));
  if(t>=41){for(const h of hardware.filter(h=>h.step===4&&h.kind==='bracket'&&t>=h.end))seated.push(h.id);seated.push(...micro.seated);}
  const current=inside?(micro.active?hardware.find(h=>h.id===micro.active!.id):hardware.find(h=>h.step===4&&h.kind==='bracket'&&t>=h.start&&t<h.end)):old.currentHardware?hardware.find(h=>h.id===old.currentHardware!.id):undefined;
  const currentHardware=current?{...current,progress:micro.active&&inside?micro.active.progress:inside?(t-current.start)/(current.end-current.start):old.currentHardware!.progress,gap:inside?micro.active?.gap??r.registry.require(current.id).position.distanceTo(new T.Vector3(...placements.find(p=>p.id===current.id)!.position)):old.currentHardware!.gap,visualState:inside?micro.stage:old.currentHardware!.visualState}:null;
  const body=old.body?bodies.find(b=>b.id===old.body!.id&&b.step===old.body!.step&&Math.abs(b.start-old.body!.start-(b.step>=5?14:0))<1e-6):undefined;
  return{...old,time:t,localTime:t-step.start,step:step.id,stepNumber:step.number,stage:inside?micro.stage:old.stage,
   hardwareSeated:seated,pending:old.pending.filter(id=>!isBK(id)),currentHardware,body,
   visible:[...r.registry.entries()].filter(([,o])=>o.visible).map(([id])=>id),holds:holds.filter(h=>h.step<=step.number),warnings,
   mode:'S04_INTEGRATION_V2',conditional:step.number>=17,physicalConfidence:'NOT_CERTIFIED — accepted illustrative S04 only; receiving/source holds remain',completeFilmAuthorized:false,
   sourceV1Time:mapToV1(t),s04:inside?micro:null};
 }
 function camera(time:number,overview=false){
  const t=T.MathUtils.clamp(time,0,duration);
  const camera=t>=41&&t<69&&!overview?accepted.camera(t<55?'left':'right'):previous.camera(mapToV1(t),overview);
  evaluate(t);return camera;
 }
 function digest(){const a:unknown[]=[];rig.traverse(o=>a.push({n:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible}));return a;}
 return{r,rig,evaluate,camera,digest,reset:()=>evaluate(0)};
}
