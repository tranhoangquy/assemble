import * as T from 'three';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {createRuntime as legacyRuntime} from '../phase-d-illustrative-v2/runtime';
import {duration as oldDuration,placements as oldPlacements} from '../phase-d-illustrative-v2/timeline';
import {createProof as acceptedRailProof} from '../rail-fit-correction-v1/runtime';

export const description='Unmeasured contact-consistent visual proposal. No hidden bores/threads/receivers.';
export const placements=oldPlacements.map(p=>({...p,position:[...p.position] as [number,number,number],outward:p.outward?[...p.outward] as [number,number,number]:undefined}));
function at(id:string,position:[number,number,number],outward?:[number,number,number],host?:string){const p=placements.find(p=>p.id===id)!;p.position=position;if(outward)p.outward=outward;if(host)p.host=host;}
for(const sign of [-1,1]){
 at(`part-10-${sign<0?1:2}`,[sign*567,838,0]);at(`part-11-${sign<0?1:2}`,[sign*189,838,113]);
}
at('part-9-1',[0,914,9]);at('part-12-1',[0,838,-60]);at('part-13-1',[0,868.5,-286]);at('part-15-1',[0,762,113]);at('part-14-1',[0,80,0]);
at('part-1-1',[-585,0,0]);at('part-2-1',[585,0,0]);at('part-5-1',[0,62,286]);
for(let i=1;i<=5;i++)at(`hardware-A-${i}`,i===5?[0,3,286]:[i<3?-585:585,3,i%2?-286:286]);
for(let i=1;i<=4;i++)at(`part-6-${i}`,[-350+(i-1)*700/3,62,0]);
const D=placements.filter(p=>p.id.startsWith('hardware-D-'));
for(let k=0;k<4;k++){const sign=k<2?-1:1;at(D[k].id,[sign*576,k%2?876:800,-60]);}
for(let k=0;k<4;k++)at(D[4+k].id,[k<2?189:-189,k%2?876:800,-69]);
const rearD:[number,number,number][]=[[-558,914,-295],[0,914,-295],[558,914,-295],[-567,800,-295],[-567,876,-295],[567,800,-295],[567,876,-295]];
rearD.forEach((p,k)=>at(D[12+k].id,p,[0,0,-1],'part-13-1'));
const floorD:[number,number,number][]=[];
for(const x of [-567,-189,189,567])for(const z of [-20,245])floorD.push([x,753,z]);
floorD.push([-350,753,-60],[350,753,-60]);
floorD.forEach((p,k)=>at(D[19+k].id,p,[0,-1,0],'part-15-1'));
for(let k=0;k<10;k++){const sign=k<5?-1:1,j=k%5;at(D[29+k].id,[sign*594,[800,876,954,762,914][j],j<3?-286:282],[sign,0,0],`part-${sign<0?1:2}-1`);}
for(let k=0;k<4;k++)at(`hardware-C-${k+1}`,[k<2?-594:594,k%2?744:62,-286]);
for(let k=0;k<4;k++)at(`hardware-C-${k+5}`,[k<2?-594:594,k%2?744:712,286]);
for(let i=0;i<4;i++){at(`hardware-C-${i+9}`,[-350+i*700/3,62,-295]);at(`hardware-C-${i+13}`,[-350+i*700/3,62,295]);}
for(let i=0;i<8;i++)at(`hardware-F-${i+1}`,[-450+(i%4)*300,735,i<4?-286:286],[0,-1,0]);

export function createModel(corrected=true){
 const p=legacyRuntime();p.evaluate(oldDuration);const r=p.r;
 // The old runtime remains immutable. Evaluate once, then use a NEW snapshot/evaluator.
 if(corrected){
  const accepted=acceptedRailProof(true);
  for(const id of ['part-3-1','part-4-1',...Array.from({length:4},(_,i)=>`part-6-${i+1}`)]){
   const target=r.registry.require(id),source=accepted.p.registry.require(id);target.clear();
   for(const child of source.children)target.add(child.clone());
  }
  function board(code:number,size:[number,number,number]){
   const mesh=r.registry.require(`part-${code}-1`).children[0] as T.Mesh;
   mesh.geometry=GeometryFactory.create({type:'box',size,bevel:.8});
  }
  board(9,[1152,18,572]);board(12,[1116,134,18]);board(13,[1152,231,18]);board(15,[1152,18,364]);
  for(let i=1;i<=2;i++){
   (r.registry.require(`part-10-${i}`).children[0] as T.Mesh).geometry=GeometryFactory.create({type:'box',size:[18,134,554],bevel:.8});
   (r.registry.require(`part-11-${i}`).children[0] as T.Mesh).geometry=GeometryFactory.create({type:'box',size:[18,134,328],bevel:.8});
  }
  // Map the established local procedural wood at a common display scale.
  for(const [id,g]of r.registry.entries())if(/^part-(9|10|11|12|13|15)-/.test(id)){
   const mesh=g.children[0] as T.Mesh,geo=mesh.geometry,pos=geo.getAttribute('position'),normal=geo.getAttribute('normal'),uv=new Float32Array(pos.count*2);
   const code=Number(id.split('-')[1]),longZ=code===10||code===11;
   for(let k=0;k<pos.count;k++){uv[k*2]=(longZ?pos.getZ(k):pos.getX(k))/620+code*.31;uv[k*2+1]=(Math.abs(normal.getY(k))>.5?(longZ?pos.getX(k):pos.getZ(k)):pos.getY(k))/210+.27;}
   geo.setAttribute('uv',new T.BufferAttribute(uv,2));
  }
  for(const row of placements){const o=r.registry.require(row.id);if(row.id==='part-7-1'||row.id==='part-8-1')continue;o.position.set(...row.position);if(row.outward){if(row.orientation)o.rotation.set(...row.orientation);else o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...row.outward));}}
  // All screw heads exterior; never use clipping to hide invalid stock or target placement.
  for(const row of placements.filter(p=>/^hardware-[BCDEF]-/.test(p.id))){const h=r.registry.require(row.id);h.children[0].children[1].position.y+=.35;}
 }
 p.rig.traverse(o=>{if(o instanceof T.Mesh){const mats=Array.isArray(o.material)?o.material:[o.material];const copies=mats.map(m=>{const c=m.clone();c.clippingPlanes=[];return c;});o.material=copies.length===1?copies[0]:copies;}});
 p.rig.position.set(0,0,0);p.rig.rotation.set(0,0,0);p.rig.updateMatrixWorld(true);
 const baseline=r.registry.captureState();
 const reset=()=>{r.registry.restoreState(baseline);p.rig.position.set(0,0,0);p.rig.rotation.set(0,0,0);p.rig.updateMatrixWorld(true);};
 return{r,rig:p.rig,reset,baseline,corrected};
}
