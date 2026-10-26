import * as T from 'three';
import {createModel,placements} from './model';
import {createProof,type Group} from './proof';
export function exteriorChecks(){
 const m=createModel(),rows=[];
 for(const p of placements.filter(p=>/^hardware-[BCDEF]-/.test(p.id))){
  const o=m.r.registry.require(p.id),point=o.getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,1,0).applyQuaternion(o.getWorldQuaternion(new T.Quaternion()));let target=m.r.registry.require(p.host!),targetId=p.host!;
  if(p.step===4){targetId=`hardware-K-${Number(p.id.split('-').at(-1))<=2?1:2}`;target=m.r.registry.require(targetId);point.z+=4;}
  if(p.step===16){targetId=`presentation-stationary-hinge-${p.host!.includes('-1-')?'7':'8'}`;target=m.r.root.children.find(o=>o.name===targetId)!;point.y+=3;}
  const hit=new T.Raycaster(point.clone().addScaledVector(normal,2),normal.clone().negate(),0,7).intersectObject(target,true)[0];
  rows.push({id:p.id,step:p.step,target:targetId,gap:hit?hit.distance-2:null,confidence:p.id.startsWith('hardware-F-')||p.step===8?'HUMAN B NONLITERAL':'PREVIOUS PROVISIONAL / NOT OEM COORDINATES'});
 }
 return{m,rows};
}
export function contactChecks(m:ReturnType<typeof createModel>){
 const box=(id:string)=>new T.Box3().setFromObject(m.r.registry.require(id));
 const pairs:[string,string,'x'|'y'|'z','min'|'max','min'|'max'][]=[
  ['part-11-1','part-12-1','z','min','max'],['part-11-2','part-12-1','z','min','max'],
  ['part-10-1','part-9-1','y','max','min'],['part-11-1','part-9-1','y','max','min'],
  ['part-10-1','part-13-1','z','min','max'],['part-9-1','part-13-1','z','min','max'],
  ['part-15-1','part-10-1','y','max','min'],['part-15-1','part-11-1','y','max','min'],['part-15-1','part-12-1','y','max','min'],
  ...Array.from({length:4},(_,i)=>['part-14-1',`part-6-${i+1}`,'y','min','max'] as [string,string,'y','min','max']),
 ];
 const contacts=pairs.map(([a,b,axis,fa,fb])=>({a,b,axis,faceA:box(a)[fa][axis],faceB:box(b)[fb][axis],gap:box(a)[fa][axis]-box(b)[fb][axis]}));
 const wood=[...m.r.registry.entries()].map(([id])=>id).filter(id=>/^part-(9|10|11|12|13|14|15)-/.test(id)),woodPairs=[];
 for(let i=0;i<wood.length;i++)for(let j=i+1;j<wood.length;j++){const a=wood[i],b=wood[j],size=box(a).intersect(box(b)).getSize(new T.Vector3());woodPairs.push({a,b,overlap:size.toArray(),positiveVolume:Math.min(size.x,size.y,size.z)>1e-6});}
 const lap=[];
 for(let i=1;i<=8;i++){
  const p=placements.find(p=>p.id===`hardware-F-${i}`)!,n=new T.Vector3(...p.outward!),head=new T.Vector3(...p.position),backing=i<=4?'part-13-1':'part-15-1';
  const woodHit=new T.Raycaster(head.clone(),n.clone().negate(),0,25).intersectObject(m.r.registry.require(backing),true)[0];
  const obstruction=new T.Raycaster(head.clone().addScaledVector(n,160),n.clone().negate(),0,159.99).intersectObject(m.r.registry.require(p.host!),true)[0];
  const woodDepth=box(backing).getSize(new T.Vector3()).z;
  lap.push({id:p.id,host:p.host,backing,head:head.toArray(),outward:n.toArray(),backingDistance:woodHit?.distance??null,
   rawHostApproachHit:obstruction?.point.toArray()??null,stockDepth:18,woodDepth,visualShaftLength:25,woodPenetration:7,farFaceClearance:woodDepth-7,
   confidence:'Nonliteral visual reconstruction; no bore/thread/physical fit claim'});
 }
 const backing=[];
 for(const p of placements.filter(p=>p.step===8&&p.id.startsWith('hardware-D-'))){const receiver=p.position[1]===914?'part-9-1':`part-10-${p.position[0]<0?1:2}`,hits=new T.Raycaster(new T.Vector3(...p.position),new T.Vector3(...p.outward!).negate(),0,44).intersectObject(m.r.registry.require(receiver),true);backing.push({id:p.id,receiver,distance:hits[0]?.distance??null,classification:'Nonliteral F-related propagation, not OEM receiver mapping'});}
 return{contacts,woodPairs,lap,backing};
}
type MeshRow={owner:string;mesh:T.Mesh;box:T.Box3};
function meshes(owner:string,o:T.Object3D):MeshRow[]{const rows:MeshRow[]=[];o.traverse(c=>{if(c instanceof T.Mesh)rows.push({owner,mesh:c,box:new T.Box3().setFromObject(c)});});return rows;}
/** All pairs are classified; expected symbolic engagement is retained in raw results. */
export function accessChecks(group:Group){
 const p=createProof(true);p.evaluate(group,0);const active=group==='S10'?'hardware-F-1':'hardware-F-5',target=group==='S10'?'part-4-1':'part-3-1',backing=group==='S10'?'part-13-1':'part-15-1';
 const installed:MeshRow[]=[];
 for(const [id,o]of p.r.registry.entries())if(o.visible&&id!==active&&id!=='hardware-M-1')installed.push(...meshes(id,o));
 const records=new Map<string,{moving:string;other:string;classification:string;firstTime:number;lastTime:number;samples:number}>();let maxTipAxisError=0,minHeadExterior=Infinity;
 const n=new T.Vector3(0,0,group==='S10'?1:-1),seatedWorld=new T.Vector3(-450,744,group==='S10'?-295:295).applyMatrix4(p.rig.matrixWorld);
 for(let frame=0;frame<=288;frame++){
  const t=frame/24,state=p.evaluate(group,t),screw=p.r.registry.require(active),tool=p.r.registry.require('hardware-M-1');
  const toolRows=meshes('M',tool),shaftRows=[...meshes('Fshaft',screw.children[1]),...meshes('Fshaft',screw.children[2])],headRows=meshes('Fhead',screw.children[0]);
  const tip=new T.Vector3(0,-72,0).applyMatrix4(tool.matrixWorld),center=screw.getWorldPosition(new T.Vector3()),delta=tip.clone().sub(center);maxTipAxisError=Math.max(maxTipAxisError,delta.clone().addScaledVector(n,-delta.dot(n)).length());
  for(const row of headRows){const a=row.mesh.geometry.getAttribute('position');for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(row.mesh.matrixWorld);minHeadExterior=Math.min(minHeadExterior,v.sub(seatedWorld).dot(n));}}
  const activeHead=meshes(active,screw.children[0]);
  for(const moving of [...toolRows,...shaftRows,...headRows])for(const other of [...installed,...activeHead]){
   if(other.owner===active&&moving.owner!=='M')continue;
   const size=moving.box.clone().intersect(other.box).getSize(new T.Vector3());if(Math.min(size.x,size.y,size.z)<=1e-6)continue;
   let classification='UNRELATED_POSITIVE_AABB_CANDIDATE';
   if(moving.owner==='Fshaft'&&(other.owner===target||other.owner===backing))classification='RAW_SOLID_OVERLAP_UNMODELED_RECEIVER';
   if(moving.owner==='M'&&other.owner===active)classification='VISIBLE_DRIVE_INTERFACE_AABB_CANDIDATE';
   const key=[moving.owner,other.owner,classification].join('|'),old=records.get(key);if(old){old.lastTime=t;old.samples++;}else records.set(key,{moving:moving.owner,other:other.owner,classification,firstTime:t,lastTime:t,samples:1});
  }
  if(state.clippingPlanes!==0)throw Error('Clipping forbidden');
 }
 return{group,samples:289,maxTipAxisError,minHeadExterior,records:[...records.values()],
  driveGeometry:{modelCrossSlotHalfWidth:.648,modelCrossSlotHalfLength:2.232,bladeHalfWidth:.5,bladeHalfLength:2,modeledSideClearance:.148,modeledEndClearance:.232,bladeToBackingDiskClearance:.45},
  rawPhysicalGate:'NOT_A_PHYSICAL_PASS — shaft enters unbored solid stock in symbolic representation',
  scope:'Per-mesh AABB candidates and exact exterior-plane/axis tests. No hand-access or engineering certification.'};
}
