import * as T from 'three';
import {createProof,groups,plan,duration,times,type Group} from './proof';
import {drive,placements} from './model';
type Row={owner:string;mesh:T.Mesh;box:T.Box3};
function meshes(owner:string,o:T.Object3D):Row[]{const rows:Row[]=[];o.traverse(c=>{if(c instanceof T.Mesh)rows.push({owner,mesh:c,box:new T.Box3().setFromObject(c)});});return rows;}
function overlaps(a:T.Box3,b:T.Box3){const s=a.clone().intersect(b).getSize(new T.Vector3());return Math.min(s.x,s.y,s.z)>1e-6?s.toArray():null;}
export function sequenceAudit(){
 const p=createProof(),result=[];
 for(const g of groups){
  const cfg=plan[g],limit=duration(g),records=new Map<string,{a:string;b:string;kind:string;first:number;last:number;samples:number;maxMinimumAABBDepth:number}>();
  p.evaluate(g,0);const linked=new Set([cfg.active,...(g==='S08'?['hardware-A-3','hardware-A-4']:[])]);
  const fixed:Row[]=[];
  for(const [id,o]of p.r.registry.entries())if(o.visible&&!linked.has(id)&&id!==cfg.screw&&!/^hardware-[LMO]-/.test(id))fixed.push(...meshes(id,o));
  const retained=new Map([...p.r.registry.entries()].filter(([id,o])=>o.visible&&!linked.has(id)&&id!==cfg.screw&&!/^hardware-[LMO]-/.test(id)).map(([id,o])=>[id,JSON.stringify(o.matrixWorld.toArray())]));
  let earlyScrew=0,earlyTool=0,retentionFailures=0,structuralDrift=0,entryVisible=0,exitVisible=0,maxToolAxisError=0,headGap=0;
  let contactTransform='';let lastVisible:string[]=[];let digestAtEnd='';
  const record=(a:string,b:string,kind:string,t:number,size:number[])=>{const k=[a,b,kind].join('|'),old=records.get(k),depth=Math.min(...size);if(old){old.last=t;old.samples++;old.maxMinimumAABBDepth=Math.max(old.maxMinimumAABBDepth,depth);}else records.set(k,{a,b,kind,first:t,last:t,samples:1,maxMinimumAABBDepth:depth});};
  const visibleInFrustum=(o:T.Object3D,cam:T.Camera)=>new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse)).intersectsBox(new T.Box3().setFromObject(o));
  for(let f=0;f<=limit*24;f++){
   const t=f/24,s=p.evaluate(g,t),part=p.r.registry.require(cfg.active),key=p.r.registry.require('hardware-L-1');
   if(t>=times.partContact){const k=JSON.stringify(part.matrixWorld.toArray());if(!contactTransform)contactTransform=k;else if(k!==contactTransform)structuralDrift++;}
   for(const[id,transform]of retained){const o=p.r.registry.require(id);if(!o.visible||JSON.stringify(o.matrixWorld.toArray())!==transform)retentionFailures++;}
   const visible=s.visible.filter(id=>!/^hardware-[LMO]-/.test(id));if(!lastVisible.every(id=>visible.includes(id)))retentionFailures++;lastVisible=visible;
   const movingPart=meshes(cfg.active,part);
   for(const a of movingPart)for(const b of fixed){const size=overlaps(a.box,b.box);if(size)record(a.owner,b.owner,b.owner.startsWith('hardware-')?'PART_VS_RETAINED_HARDWARE':'PART_VS_INSTALLED_STRUCTURE',t,size);}
   if(cfg.screw){
    const screw=p.r.registry.require(cfg.screw),row=placements.find(p=>p.id===cfg.screw)!,normal=new T.Vector3(...row.outward!).transformDirection(p.rig.matrixWorld),head=screw.getWorldPosition(new T.Vector3());
    if(t<times.partContact&&screw.visible)earlyScrew++;
    if(t<times.screwAtTarget&&key.visible)earlyTool++;
    const cam=p.camera(g);
    if(t===times.screwEnter&&visibleInFrustum(screw,cam))entryVisible++;
    if(t===times.toolEnter&&visibleInFrustum(key,cam))entryVisible++;
    if(t===times.toolWithdrawn&&visibleInFrustum(key,cam))exitVisible++;
    if(key.visible){const tip=new T.Vector3(0,65,0).applyMatrix4(key.matrixWorld).sub(head);maxToolAxisError=Math.max(maxToolAxisError,tip.clone().addScaledVector(normal,-tip.dot(normal)).length());}
    if(t>=times.insertionEnd)headGap=Math.max(headGap,Math.abs(s.screwGap!));
    if(screw.visible)for(const a of meshes(cfg.screw,screw))for(const b of [...fixed,...movingPart]){const size=overlaps(a.box,b.box);if(size)record(a.owner,b.owner,'SCREW_VS_INSTALLED_CANDIDATE',t,size);}
    if(key.visible)for(const a of meshes('key-L',key))for(const b of [...fixed,...movingPart,...meshes(cfg.screw,screw.children[0])]){const size=overlaps(a.box,b.box);if(size)record(a.owner,b.owner,b.owner===cfg.screw?'KEY_VS_DRIVE_AABB_CANDIDATE':'KEY_VS_INSTALLED_CANDIDATE',t,size);}
   }
   if(f===limit*24)digestAtEnd=JSON.stringify(p.digest());
  }
  // Seek through arbitrary future/past states; canonical endpoints must repeat exactly.
  let deterministic=true;const hashes=new Map<number,string>();
  for(const t of [0,limit,1.8,7,3,5.75,1.8,0,limit]){p.evaluate(g,t);const h=JSON.stringify(p.digest());if(hashes.has(t)&&hashes.get(t)!==h)deterministic=false;hashes.set(t,h);}
  deterministic&&=hashes.get(limit)===digestAtEnd;
  result.push({group:g,samples:limit*24+1,earlyScrew,earlyTool,retentionFailures,structuralDrift,entryVisible,exitVisible,maxToolAxisError,headGap,deterministic,rawCandidates:[...records.values()],scope:'Actual per-mesh AABB candidates, retained rather than filtered. Raw receiver intersections need classification; no physical certification.'});
 }
 return{result,drive:{...drive,modeledRadialClearanceAcrossFlats:.1,tipBackingClearance:.85,tool:'Source-listedL M4; assignment to D follows visible hex drive, no torque/tool-envelope claim'}};
}
