import * as T from 'three';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {createModel as baselineModel} from '../part-first-sequence-v1/model';
import {createModel,placements,proposal} from './model';
import {createProof,groups,duration,timing} from './proof';
const out=new URL('../../../../output/product03-pet-crate-w114586144/s04-two-bolt-proof-v1/',import.meta.url);
const save=(n:string,v:unknown)=>writeFileSync(new URL(n,out),JSON.stringify(v,null,2));
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const geometry=(o:T.Object3D)=>{const a:unknown[]=[];o.traverse(c=>{if(c instanceof T.Mesh){const pos=c.geometry.getAttribute('position');a.push([c.position.toArray(),c.quaternion.toArray(),Array.from(pos.array),c.geometry.index?Array.from(c.geometry.index.array):null]);}});return hash(a);};
const base=baselineModel(),model=createModel();const changes=[];
for(const[id,o]of model.r.registry.entries()){const b=base.r.registry.require(id);changes.push({id,geometryMatch:geometry(o)===geometry(b),positionBefore:b.position.toArray(),positionAfter:o.position.toArray(),positionMatch:o.position.equals(b.position)});}
save('BASELINE-DELTA.json',{proposal,entries:changes});
type Pair={side:string,actor:string,other:string,kind:string,first:number,last:number,count:number,maxAABBMinimum:number};const hitMap=new Map<string,Pair>();
const proof=createProof();
function meshes(owner:string,o:T.Object3D){const rows:{owner:string;box:T.Box3}[]=[];o.traverse(c=>{if(c instanceof T.Mesh){if(!c.geometry.boundingBox)c.geometry.computeBoundingBox();rows.push({owner,box:c.geometry.boundingBox!.clone().applyMatrix4(c.matrixWorld)});}});return rows;}
function hit(side:string,a:{owner:string;box:T.Box3},b:{owner:string;box:T.Box3},time:number,kind:string){const s=a.box.clone().intersect(b.box).getSize(new T.Vector3()),depth=Math.min(s.x,s.y,s.z);if(depth<=1e-6)return;const key=[side,a.owner,b.owner,kind].join('|'),row=hitMap.get(key);if(row){row.last=time;row.count++;row.maxAABBMinimum=Math.max(row.maxAABBMinimum,depth);}else hitMap.set(key,{side,actor:a.owner,other:b.owner,kind,first:time,last:time,count:1,maxAABBMinimum:depth});}
const results=[];const refinements=new Map<string,{side:string;actor:string;other:string;samples:number;first:number;last:number;minPositiveSeparatingAxis:number;preciseOverlapSamples:number}>();
for(const side of groups){
 const level=side==='left'?1:2,ids=[`hardware-B-${level*2-1}`,`hardware-B-${level*2}`],kId=`hardware-K-${level}`;
 let finite=true,retained=true,early=0,deterministic=true,maxAxisError=0;const seen=new Map<string,string>();const expected=new Map<number,string>();
 for(const t of [0,14,5.2,12,0,8.4,14,2.2,5.2,8.4,14]){proof.evaluate(side,t);const h=hash(proof.digest());if(expected.has(t)&&expected.get(t)!==h)deterministic=false;expected.set(t,h);}
 // Sweep100Hz: paths are deterministic and no hand-access certification follows.
 for(let j=0;j<=duration*100;j++){
  const time=j/100,state=proof.evaluate(side,time);
  const fixed=[...state.previous,...(time>=timing.bracketContact?[kId]:[]),...state.seated];
  for(const id of fixed){const o=proof.r.registry.require(id),h=hash([o.visible,o.position.toArray(),o.quaternion.toArray()]);if(seen.has(id)&&seen.get(id)!==h)retained=false;seen.set(id,h);}
  if(time<timing.bracketContact)for(const id of ids)if(proof.r.registry.require(id).visible)early++;
  proof.rig.traverse(o=>{finite&&=[...o.position.toArray(),...o.quaternion.toArray()].every(Number.isFinite);});
  const actors=[kId,...ids,'hardware-L-1'].filter(id=>proof.r.registry.require(id).visible);
  const visible=[...proof.r.registry.entries()].filter(([,o])=>o.visible);
  for(const actor of actors){for(const a of meshes(actor,proof.r.registry.require(actor)))for(const[other,o]of visible){if(other===actor||other==='hardware-L-1')continue;
   const h=placements.find(p=>p.id===actor),host=h?.host===other;
   const receiving=actor.startsWith('hardware-B-')&&(host||other===kId);
   let kind=receiving?'RAW_B_RECEIVING_STOCK_OR_VISIBLE_K_AABB':actor==='hardware-L-1'&&state.active?.id===other?'KEY_VS_ACTIVE_CONCAVE_DRIVE_AABB':'UNRELATED';
   if(actor===kId&&ids.includes(other))kind='RAW_K_VS_CURRENT_B_AABB';
   for(const b of meshes(other,o))hit(side,a,b,time,kind);
   if(actor.startsWith('hardware-B-')&&other.startsWith('hardware-B-')){
    const A=new T.Box3().setFromObject(proof.r.registry.require(actor),true),B=new T.Box3().setFromObject(o,true),axes=['x','y','z'].map(k=>{const c=k as 'x'|'y'|'z';return Math.max(0,A.min[c]-B.max[c],B.min[c]-A.max[c]);}),gap=Math.max(...axes),key=[side,actor,other].join('|'),v=refinements.get(key);
    if(v){v.samples++;v.last=time;v.minPositiveSeparatingAxis=Math.min(v.minPositiveSeparatingAxis,gap);if(gap<=0)v.preciseOverlapSamples++;}
    else refinements.set(key,{side,actor,other,samples:1,first:time,last:time,minPositiveSeparatingAxis:gap,preciseOverlapSamples:gap<=0?1:0});
   }
  }}
  const key=proof.r.registry.require('hardware-L-1');if(key.visible&&state.active&&state.active.progress>=.55&&state.active.progress<=.83){const bolt=proof.r.registry.require(state.active.id),n=new T.Vector3(0,1,0).applyQuaternion(bolt.quaternion),tip=key.localToWorld(new T.Vector3(0,65,0)),delta=tip.sub(bolt.position);maxAxisError=Math.max(maxAxisError,delta.clone().cross(n).length());}
 }
 proof.evaluate(side,14);const final=ids.map(id=>{const o=proof.r.registry.require(id),p=placements.find(p=>p.id===id)!;return{id,visible:o.visible,head:o.position.toArray(),target:p.position,gap:o.position.distanceTo(new T.Vector3(...p.position))};});
 const headBoxes=ids.map(id=>new T.Box3().setFromObject(proof.r.registry.require(id).children[0],true));const gapAxes=['x','y','z'].map(key=>{const c=key as 'x'|'y'|'z';return Math.max(0,headBoxes[0].min[c]-headBoxes[1].max[c],headBoxes[1].min[c]-headBoxes[0].max[c]);});
 const k=proof.r.registry.require(kId),horizontal=new T.Box3().setFromObject(k.children[0]),vertical=new T.Box3().setFromObject(k.children[1]),wood9=new T.Box3().setFromObject(proof.r.registry.require('part-9-1')),wood11=new T.Box3().setFromObject(proof.r.registry.require(`part-11-${level}`));
 results.push({side,finite,retained,earlyHardware:early,deterministic,maxToolAxisError:maxAxisError,final,seatedCount:proof.evaluate(side,14).seated.length,headBoundsSeparated:gapAxes.some(x=>x>0),headAABBSeparationAxes:gapAxes,KtoTopGap:wood9.min.y-horizontal.max.y,KtoDividerGap:side==='left'?vertical.min.x-wood11.max.x:wood11.min.x-vertical.max.x,samples:1401});
}
const raw=[...hitMap.values()],refined=[...refinements.values()],unresolved=raw.filter(r=>r.kind==='UNRELATED'&&!refined.some(v=>v.side===r.side&&v.actor===r.actor&&v.other===r.other&&v.preciseOverlapSamples===0&&v.minPositiveSeparatingAxis>0));
save('RAW-PATH-AUDIT.json',raw);save('PRECISE-B-PAIR-REFINEMENT.json',{method:'Actual world-transformed mesh vertices, not transformed local bounding-box corners. A positive axis separates every actual point and proves these sampled mesh pairs disjoint. Raw conservative AABB candidates retained; no threshold increase or pair exclusion.',pairs:refined});
save('S04-PAIR-AND-MOTION-QA.json',{results,rawCandidates:raw.length,rawUnrelated:raw.filter(r=>r.kind==='UNRELATED'),unresolved,qualification:'Conservative AABB sweep plus precise actual-vertex separation for B pairs. All receiving/concave-drive candidates retained. B shafts penetrate solid wood because receivers remain unmodeled. Not physical fit/tool-hand certification.',proposal});
console.log(JSON.stringify({results,raw:raw.length,unresolved,geometryChanges:changes.filter(r=>!r.geometryMatch).map(r=>r.id),placementChanges:changes.filter(r=>!r.positionMatch).map(r=>r.id)},null,2));
