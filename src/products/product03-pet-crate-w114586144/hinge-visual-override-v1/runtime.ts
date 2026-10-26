import * as T from 'three';
import {createRuntime as prior,hardware} from '../human-3-image-correction-v1/runtime';
import {placements} from '../s04-integration-v2/timeline';
import {blocks,cycle,blockStart,extendedClock,proposedLongClock} from './clock';
const ease=(u:number,a:number,b:number)=>T.MathUtils.smootherstep(u,a,b);
function plate(){const s=new T.Shape();s.moveTo(-6,-15);s.lineTo(6,-15);s.lineTo(6,15);s.lineTo(-6,15);s.closePath();for(const y of [-8,8]){const h=new T.Path();h.absarc(0,y,2,0,Math.PI*2,true);s.holes.push(h);}const g=new T.ExtrudeGeometry(s,{depth:1.5,bevelEnabled:false,curveSegments:24});g.translate(0,0,-.75);return g;}
export function createRuntime(enabled=true){
 const base=prior();base.evaluate(278);const {r,rig}=base,extra=new Map<string,T.Group>(),records:any[]=[],leafChanges:any[]=[];
 for(const b of blocks){const host=r.registry.require(`part-${b.door}-1`),leaves:T.Mesh[]=[];host.traverse(o=>{if(o instanceof T.Mesh&&o.name.includes('leaf-unverified'))leaves.push(o);});leaves.sort((a,b)=>a.getWorldPosition(new T.Vector3()).y-b.getWorldPosition(new T.Vector3()).y);const leaf=leaves[b.upper?1:0];if(!leaf)throw Error('Missing existing door leaf');
  const old=leaf.geometry;old.computeBoundingBox();if(enabled)leaf.geometry=plate();leafChanges.push({door:b.door,upper:b.upper,leafName:leaf.name,oldBox:old.boundingBox!.min.toArray().concat(old.boundingBox!.max.toArray()),newBox:[-6,-15,-.75,6,15,.75],authority:'HUMAN VISUAL OVERRIDE, not OEM bore evidence'});
  for(const [j,y]of[-8,8].entries()){const id=`illustration-hinge-door-${b.door}-${b.upper?'upper':'lower'}-${j+1}`,o=r.registry.require('hardware-E-1').clone(true) as T.Group;o.name=id;o.userData={authority:'HUMAN_APPROVED_ILLUSTRATION',oem:false,inventory:'SEPARATE from E8 / OEM103',hiddenReceivers:false,threads:false};const world=leaf.localToWorld(new T.Vector3(0,y,.75)),target=host.worldToLocal(world.clone());host.add(o);o.position.copy(target);o.visible=false;extra.set(id,o);records.push({id,hinge:b.index+1,door:b.door,upper:b.upper,index:j,target:target.toArray(),worldTarget:world.toArray(),start:blockStart(b.index)+j*cycle,end:blockStart(b.index)+j*cycle+cycle,source:'human override; legacy leaf visual pattern only',oem:false});}
 }
 const n=new T.Vector3(0,0,1),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),n);
 const setWorld=(o:T.Object3D,p:T.Vector3,quat:T.Quaternion)=>{o.parent!.updateWorldMatrix(true,false);o.position.copy(o.parent!.worldToLocal(p.clone()));o.quaternion.copy(o.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(quat));};
 function evaluate(time:number,mode:'extended'|'long'='extended'){
  const clock=mode==='long'?proposedLongClock(time):extendedClock(time),state=base.evaluate(clock.source),rows:any[]=[],tool=r.registry.require('hardware-M-1');
  // Existing E8 final poses/counts stay fixed. Bound only hinge presentation approach distances.
  const h=state.currentHardware;if(enabled&&h?.id.startsWith('hardware-E-')){const p=placements.find(p=>p.id===h.id)!,u=h.progress,o=r.registry.require(h.id),gap=11+60*(1-ease(u,0,.15))-11*ease(u,.4,.8);o.position.set(...p.position).addScaledVector(n,gap);if(tool.visible){const travel=140*(1-ease(u,.25,.4))+140*ease(u,.87,.97);tool.position.copy(o.position).addScaledVector(n,73.3+travel);}}
  if(enabled&&clock.block){const next=hardware.find(h=>h.id===`hardware-E-${clock.block!.index*2+3}`);if(next&&next.start===clock.source)r.registry.require(next.id).visible=false;}
  let current:any=null;
  for(const rec of records){const o=extra.get(rec.id)!,u=T.MathUtils.clamp((time-rec.start)/cycle,0,1);o.visible=enabled&&time>=rec.start;const gap=11+60*(1-ease(u,0,.16))-11*ease(u,.4,.73),target=new T.Vector3(...rec.target),world=o.parent!.localToWorld(target.clone()).addScaledVector(n,gap),roll=Math.PI*2*ease(u,.4,.79),quat=q.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),roll));setWorld(o,world,quat);
   const visualState=!o.visible?'HIDDEN':u>=1?'ILLUSTRATED_SEATED':u<.16?'APPROACH':u<.26?'ALIGNED':u<.4?'TOOL_APPROACH':u<.79?'ILLUSTRATIVE_INSERTION':u<.9?'TOOL_WITHDRAWAL':'TOOL_CLEAR_HOLD';rows.push({id:rec.id,u,visible:o.visible,state:visualState,oem:false});
   if(o.visible&&time<rec.end){current={...rec,progress:u,visualState};tool.visible=u>=.26&&u<.9;if(tool.visible){const travel=140*(1-ease(u,.26,.4))+140*ease(u,.79,.9);setWorld(tool,world.clone().addScaledVector(n,73.3+travel),quat);}}
  }
  rig.updateMatrixWorld(true);return{...state,time,sourceTime:clock.source,clock,currentIllustration:current,illustrations:rows,illustratedSeated:rows.filter(r=>r.state==='ILLUSTRATED_SEATED').map(r=>r.id),visible:[...r.registry.entries()].filter(([,o])=>o.visible).map(([id])=>id),doorSideFasteners:'HUMAN-APPROVED ILLUSTRATION',oemAttachmentDetails:'UNVERIFIED',doorFunction:'HOLD',oemInventory:103,additionalIllustrativeFasteners:8};
 }
 const evaluateSourceFinal=(source:number)=>evaluate(source+16);
 return{base,r,rig,extra,records,leafChanges,evaluate,evaluateSourceFinal,enabled};
}
