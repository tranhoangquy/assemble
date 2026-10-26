import * as T from 'three';
import {createModel as baselineModel,placements as baselinePlacements} from '../f-illustrative-proof-v1/model';
export const placements=baselinePlacements.map(p=>({...p,position:[...p.position] as [number,number,number]}));
// A demonstrated perpendicular D/D shaft crossing at S8 requires relocating the
// four repeated provisional rail-axis positions. No bore or OEM coordinate is claimed.
for(const p of placements.filter(p=>p.step===8&&Math.abs(p.position[2])===230)){p.position[2]=Math.sign(p.position[2])*190;p.note='Illustrative S8 rail-axis relocation to avoid prior D shafts; no OEM receiving-hole claim';}
export const drive={keyAcrossFlats:4,visibleSlotAcrossFlats:4.2,headDepth:2.8,tipPlane:1.2,
 confidence:'ManualL markedM4; key proportions and0.2 display clearance illustrative, not OEM tolerance'};
export function createModel(){
 const m=baselineModel();
 for(const p of placements.filter(p=>p.step===8&&p.id.startsWith('hardware-D-')))m.r.registry.require(p.id).position.set(...p.position);
 // Only the existing visible D drive is enlarged for the source-listed M4 key.
 // Outer heads, full shafts, panels and hidden receiving geometry are unchanged.
 for(const p of placements.filter(p=>p.id.startsWith('hardware-D-'))){
  const obj=m.r.registry.require(p.id).children[0].children[0] as T.Mesh;
  const s=new T.Shape();s.absarc(0,0,4.5,0,Math.PI*2,false);
  const hole=new T.Path(),r=drive.visibleSlotAcrossFlats/Math.sqrt(3);
  for(let i=0;i<6;i++){const a=-i*Math.PI/3,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i)hole.lineTo(x,y);else hole.moveTo(x,y);}
  hole.closePath();s.holes.push(hole);obj.geometry=new T.ExtrudeGeometry(s,{depth:drive.headDepth,bevelEnabled:false,curveSegments:32});
 }
 const key=m.r.registry.require('hardware-L-1'),material=(key.children[0] as T.Mesh).material;
 key.clear();
 function hex(a:T.Vector3,b:T.Vector3){const delta=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(drive.keyAcrossFlats/Math.sqrt(3),drive.keyAcrossFlats/Math.sqrt(3),delta.length(),6,1,false,Math.PI/2),material);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());key.add(o);}
 hex(new T.Vector3(),new T.Vector3(0,65,0));hex(new T.Vector3(),new T.Vector3(24,0,0));
 key.userData={...key.userData,representation:drive.confidence};
 m.rig.updateMatrixWorld(true);const baseline=m.r.registry.captureState();
 const reset=()=>{m.r.registry.restoreState(baseline);m.rig.position.set(0,0,0);m.rig.rotation.set(0,0,0);m.rig.updateMatrixWorld(true);};
 return{...m,reset,baseline};
}
