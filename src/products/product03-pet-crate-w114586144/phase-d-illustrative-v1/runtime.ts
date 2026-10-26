import * as T from 'three';
import {createPrototype} from '../prototype-v2/model';
import {placements,steps,assemblyDuration,duration} from './timeline';
export const ease=(a:number,b:number,t:number)=>T.MathUtils.smootherstep(t,a,b);
export function createRuntime(){
 const r=createPrototype(),rig=new T.Group();rig.add(r.root,r.hardwareRoot);
 // Apply the separately approved static external-contact hypothesis to this revision only.
 const pivots=new Map<string,T.Group>();
 for(const [code,sign] of [['7',-1],['8',1]] as const){
  const d=r.registry.require(`part-${code}-1`);d.position.set(sign*289,400,286);
  const hingeGroups=d.children.filter(o=>o instanceof T.Group&&o.children.length===5);
  for(const h of hingeGroups){h.position.x=sign*285;h.position.z=12.3;for(const leaf of h.children.slice(0,2))leaf.position.z=-2.55;}
  r.root.updateMatrixWorld(true);
  // Frame leaf + end knuckles remain stationary; middle knuckle follows door.
  const stationary=new T.Group();stationary.name=`presentation-stationary-hinge-${code}`;r.root.add(stationary);
  for(const h of hingeGroups){const children=[...h.children];for(const idx of [sign<0?0:1,2,4])stationary.attach(children[idx]);}
  const pivot=new T.Group();pivot.name=`presentation-door-pivot-${code}`;pivot.position.set(sign*574,400,298.3);r.root.add(pivot);pivot.attach(d);pivots.set(code,pivot);
 }
 // Existing center carrier is lowered11 display units to meet adjustable foot.
 const centerRail=r.registry.require('part-5-1');const carrier=centerRail.children.find(c=>c instanceof T.Mesh&&Math.abs(c.position.y+21)<.01);if(carrier)carrier.position.y=-32;
 const baseline=r.registry.captureState();
 const hardwareMaterials=new Map<string,T.MeshStandardMaterial[]>();
 for(const row of placements.filter(x=>x.outward&&/hardware-[A-F]-/.test(x.id))){const mats:T.MeshStandardMaterial[]=[];r.registry.require(row.id).traverse(o=>{if(o instanceof T.Mesh){const source=Array.isArray(o.material)?o.material:[o.material];const clones=source.map(m=>{const c=(m as T.MeshStandardMaterial).clone();mats.push(c);return c;});o.material=clones.length===1?clones[0]:clones;}});hardwareMaterials.set(row.id,mats);}
 const finalPositions=new Map(placements.map(p=>[p.id,new T.Vector3(...p.position)]));
 const planeMap=new Map<string,T.Plane>();
 for(const p of placements)if(hardwareMaterials.has(p.id)&&p.outward)planeMap.set(p.id,new T.Plane().setFromNormalAndCoplanarPoint(new T.Vector3(...p.outward),new T.Vector3(...p.position)));
 function evaluate(time:number){
  const t=T.MathUtils.clamp(time,0,duration);r.registry.restoreState(baseline);r.setFinish('crafted');rig.position.set(0,0,0);rig.rotation.set(0,0,0);for(const [,o]of r.registry.entries())o.visible=false;
  const installed:string[]=[],active:string[]=[];
  for(const p of placements){const s=steps[p.step-1],start=s.start+p.localStart;if(t<start)continue;const o=r.registry.require(p.id),progress=ease(start,start+p.duration,t);o.visible=true;
   const pos=finalPositions.get(p.id)!.clone().addScaledVector(new T.Vector3(...p.offset),1-progress);
   // Doors are local to their external-hypothesis pivots; all other registry nodes are root-local.
   if(p.id==='part-7-1'||p.id==='part-8-1'){const code=p.id.includes('-7-')?'7':'8';const pivot=pivots.get(code)!;o.position.copy(pos.sub(pivot.position));}
   else o.position.copy(pos);
   if(p.outward){if(p.orientation)o.rotation.set(...p.orientation);else o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...p.outward));}
   if(progress>=1)installed.push(p.id);else active.push(p.id);
  }
  const s8=steps[7],s14=steps[13];
  for(const [id,sign] of [['part-1-1',-1],['part-2-1',1]] as const){if(t>=s8.start){const o=r.registry.require(id);o.position.x=sign*(685-100*ease(s8.start+.2,s8.start+2.7,t));}}
  if(t>=s14.start){const o=r.registry.require('part-5-1'),q=ease(s14.start+.2,s14.start+2.2,t);o.position.copy(new T.Vector3(820,62,370).lerp(new T.Vector3(0,62,286),q));}
  // Prepared A feet follow their actual host, never teleport independently.
  for(let i=1;i<=5;i++){const a=r.registry.require(`hardware-A-${i}`);if(!a.visible)continue;const host=r.registry.require(i<3?'part-1-1':i<5?'part-2-1':'part-5-1');const init=i<3?-685:i<5?685:820;a.position.x+=host.position.x-init;if(i===5)a.position.z+=host.position.z-370;}
  // Hinge frame leaves are displayed from the same door-introduction instant onward.
  for(const code of ['7','8']){const door=r.registry.require(`part-${code}-1`),g=r.root.children.find(o=>o.name===`presentation-stationary-hinge-${code}`)!;g.visible=door.visible;const pivot=pivots.get(code)!;pivot.rotation.y=0;}
  // Source S19 depicts open doors: purely illustrative35-degree pose; not a mechanical stop.
  let angle=0;const s19=steps[18];if(t>=s19.start)angle=35*ease(s19.start+.6,s19.start+1.4,t);
  if(t>=assemblyDuration)angle=35*(1-ease(assemblyDuration+3,assemblyDuration+6,t));
  for(const [code,sign]of [['7',-1],['8',1]] as const){const pivot=pivots.get(code)!;pivot.rotation.y=sign*angle*Math.PI/180;}
  // Release is a labeled illustrative exterior tab rotation, not a recovered latch mechanism.
  const release=ease(s19.start,s19.start+.5,t)*(1-ease(assemblyDuration+6,assemblyDuration+7,t));
  for(const row of placements.filter(p=>/^hardware-[IJ]-/.test(p.id))){const o=r.registry.require(row.id);if(!o.visible)continue;const center=new T.Vector3(row.position[0],row.position[1],row.position[2]);const localHole=new T.Vector3(0,8,0).applyQuaternion(o.quaternion);center.add(localHole);const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2*release);o.position.sub(center).applyQuaternion(q).add(center);o.quaternion.premultiply(q);}
  // N remains attached to the moving door when the illustrative door closes.
  for(const row of placements.filter(p=>p.id.startsWith('hardware-N-'))){const o=r.registry.require(row.id);if(!o.visible)continue;const code=row.host!.includes('-7-')?'7':'8',pivot=pivots.get(code)!;const point=o.position.clone().sub(pivot.position).applyAxisAngle(new T.Vector3(0,1,0),pivot.rotation.y).add(pivot.position);o.position.copy(point);o.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),pivot.rotation.y));}
  // One continuous presentation reorientation, not a validated human lifting procedure.
  const invert=ease(steps[6].end-2,steps[7].start+.15,t)*(1-ease(steps[14].start,steps[14].start+3,t));
  const angleX=invert*Math.PI;rig.rotation.x=angleX;rig.position.y=invert*984;
  // Support pedestal for the early elevated module is presentation-only.
  const supportHeight=t<steps[6].start?745:0;
  rig.updateMatrixWorld(true);
  for(const [id,plane]of planeMap){const p=plane.clone().applyMatrix4(rig.matrixWorld);hardwareMaterials.get(id)!.forEach(m=>m.clippingPlanes=[p]);}
  // A representative manual key appears at the first connection only. No certified access or torque.
  const L=r.registry.require('hardware-L-1');if(t>=8&&t<10.8){L.visible=true;const head=r.registry.require('hardware-D-1').position.clone();L.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(1,0,0));L.position.copy(head).add(new T.Vector3(-68-35*(1-ease(8,8.7,t)),0,0));L.rotateOnWorldAxis(new T.Vector3(1,0,0),.8*ease(8.9,9.8,t));}
  const M=r.registry.require('hardware-M-1');for(const n of [10,12]){const local=t-steps[n-1].start;if(local>=1&&local<2.8){const F=r.registry.require(`hardware-F-${n===10?1:5}`);M.visible=true;M.position.copy(F.position).add(new T.Vector3(0,75+30*(1-ease(1,1.5,local)),0));M.quaternion.identity();M.rotateY(.8*ease(1.5,2.2,local));}}
  const stagedSubassemblies=installed.filter(id=>(id==='part-5-1'&&t<steps[13].start+2.2)||(['part-1-1','part-2-1'].includes(id)&&t<steps[7].start+2.7));
  const index=steps.findIndex(s=>t<s.end);const current=index<0?steps.at(-1)!:steps[index];
  return{time:t,step:current.id,stepIndex:index<0?19:index+1,localTime:t-current.start,installed:installed.filter(id=>!stagedSubassemblies.includes(id)),stagedSubassemblies,active,visible:[...r.registry.entries()].filter(([,o])=>o.visible).map(([id])=>id),supportHeight,invertedPresentation:invert,doorAngleDegrees:angle,status:'HUMAN_AUTHORIZED_ILLUSTRATIVE_SIMULATION',physicalFit:'NOT_CERTIFIED',c13C14:'ALLOCATION_HYPOTHESIS',I_J:'J_UPPER_I_LOWER_HYPOTHESIS',hiddenReceivingGeometry:'OMITTED',symbolicClipping:'Fastener shafts beyond exterior host face are omitted graphically; raw overlap is not a collision PASS'};
 }
 function digest(){const rows:unknown[]=[];rig.traverse(o=>rows.push({n:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),v:o.visible}));return rows;}
 return{r,rig,evaluate,digest,pivots};
}
