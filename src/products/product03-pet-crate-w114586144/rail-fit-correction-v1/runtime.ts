import * as T from 'three';
import {createPrototype} from '../prototype-v2/model';

/** Source-visible factory bands, NOT new OEM parts. Dimensions remain display proposals. */
export const assumptions={
 units:'Unmeasured display units; NOT millimetres or OEM dimensions',
 source:'Local manual PDF p1/p3 (factory frame silhouettes), p8 S9, p10 S13/S14',
 rearLowerRail:62,rearUpperRail:744,rail6Center:62,rail6Length:554,
 receiver:'No bore, thread, insert or concealed receiver added',
 C13C14:'Four rear/four front rail-end allocation remains an UNVERIFIED HYPOTHESIS',
};
export const duration=12,fps=24;
export const ease=(t:number,a:number,b:number)=>T.MathUtils.smootherstep(t,a,b);
export function createProof(corrected=true){
 const p=createPrototype(),rig=new T.Group();rig.add(p.root,p.hardwareRoot);
 const part=(id:string)=>p.registry.require(id);
 const rear=part('part-4-1');
 function bar(parent:T.Object3D,name:string,size:[number,number,number],center:[number,number,number]){
  // Plain visible frame stock only. No receiving feature represented.
  const m=new T.Mesh(new T.BoxGeometry(...size),p.metal);m.name=name;m.position.set(...center);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
 }
 if(corrected){
  // Existing 4 mesh/frame retained: source shows additional ladder bands at both edges.
  rear.children[0].scale.x=1152/1170;
  for(const y of [62,744])bar(rear,`factory-4-edge-${y}`,[1152,18,18],[0,y-408,0]);
  for(const x of [-558,-372,-186,0,186,372,558]){
   bar(rear,`factory-4-lower-spacer-${x}`,[18,33,18],[x,87.5-408,0]);
   bar(rear,`factory-4-upper-spacer-${x}`,[18,23,18],[x,723.5-408,0]);
  }
  const header=part('part-3-1');
  bar(header,'factory-3-upper-band',[1152,18,18],[0,32,0]);
  for(const x of [-558,-372,-186,0,186,372,558])bar(header,`factory-3-spacer-${x}`,[18,14,18],[x,16,0]);
  for(let i=1;i<=4;i++){
   const rail=part(`part-6-${i}`);rail.position.y=62;
   (rail.children[0] as T.Mesh).geometry=new T.BoxGeometry(18,18,554);
  }
 }
 // This is an isolated S13 connection proof, not a new complete assembly timeline.
 // All included objects are visible before motion; no show/hide or camera cuts.
 const included=['part-1-1','part-2-1','part-3-1','part-4-1','part-6-1','hardware-C-9'];
 for(const [id,o]of p.registry.entries())o.visible=included.includes(id);
 const rail=part('part-6-1'),screw=part('hardware-C-9');
 const head=screw.children[0];
 // The old head backing disk extended 0.35 behind its nominal seating plane.
 // Keep the complete head exterior; full shaft is retained and NEVER clipped.
 if(corrected)head.children[1].position.y+=.35;
 screw.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(0,0,-1));
 rig.rotation.x=Math.PI;rig.position.y=984;
 const targetY=corrected?62:60;
 function evaluate(time:number){
  const t=T.MathUtils.clamp(time,0,duration),q=ease(t,2,5),insert=ease(t,6.5,9.5);
  rail.position.set(-350,targetY-85*(1-q),0);
  // Full shaft is drawn. Opaque host naturally occludes it; no clipping or cutaway.
  // Internal engagement remains unknown, despite exterior seating at t=9.5.
  screw.position.set(-350,targetY,-295-48*(1-insert));
  screw.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(0,0,-1));
  screw.rotateOnAxis(new T.Vector3(0,1,0),Math.PI*2*insert);
  rig.updateMatrixWorld(true);
  return{time:t,corrected,railProgress:q,screwProgress:insert,rail:rail.position.toArray(),screw:screw.position.toArray(),
   visibility:included.map(id=>[id,part(id).visible]),clippingPlanes:0,
   representation:'Exterior visual contact proposal only; internal receiver/engagement NOT VERIFIED',
   screwRotation:'Illustrative rotation without a claimed thread pitch or tightening torque',
   source:'S13 type C ×4 confirmed; this particular end allocation remains a hypothesis'};
 }
 function digest(){const rows:unknown[]=[];rig.traverse(o=>rows.push({n:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible}));return rows;}
 evaluate(0);return{p,rig,rail,screw,rear,evaluate,digest,included};
}
