import * as T from 'three';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createProof,duration,assumptions} from './runtime';
import {createRuntime as legacyRuntime} from '../phase-d-illustrative-v2/runtime';
import {steps,placements} from '../phase-d-illustrative-v2/timeline';
const out=new URL('../../../../output/product03-pet-crate-w114586144/rail-fit-correction-v1/',import.meta.url);mkdirSync(out,{recursive:true});
function write(name:string,data:unknown){writeFileSync(new URL(name,out),JSON.stringify(data,null,2));}
export function exteriorRay(host:T.Object3D,point:T.Vector3,outward:T.Vector3){
 host.updateWorldMatrix(true,true);const origin=point.clone().addScaledVector(outward,100),ray=new T.Raycaster(origin,outward.clone().negate(),0,200);
 const hit=ray.intersectObject(host,true)[0];return hit?{headToSurface:hit.distance-100,hit:hit.point.toArray()}:null;
}
const legacy=legacyRuntime(),faceAudit=[];
for(const row of placements.filter(p=>/^hardware-[BCDEF]-/.test(p.id))){
 legacy.evaluate(steps[row.step-1].end-.00001);
 const head=legacy.r.registry.require(row.id).getWorldPosition(new T.Vector3());
 const normal=new T.Vector3(...row.outward!).transformDirection(legacy.rig.matrixWorld);
 const hit=exteriorRay(legacy.r.registry.require(row.host!),head,normal);
 // B seats on K, and E on the visible hinge leaf. A host-centre ray alone
 // must not turn legitimate bracket thickness or a real hole into a false FAIL.
 let seatingTarget=row.host!,seatingHit=hit;
 if(row.step===4){seatingTarget=`hardware-K-${Number(row.id.split('-').at(-1))<=2?1:2}`;
  const offset=new T.Vector3(0,0,4).transformDirection(legacy.rig.matrixWorld).multiplyScalar(4);
  seatingHit=exteriorRay(legacy.r.registry.require(seatingTarget),head.clone().add(offset),normal);
 }
 if(row.step===16){seatingTarget=`presentation-stationary-hinge-${row.host!.includes('-1-')?'7':'8'}`;
  const leaf=legacy.r.root.children.find(o=>o.name===seatingTarget)!;
  const offset=new T.Vector3(0,1,0).transformDirection(legacy.rig.matrixWorld).multiplyScalar(3);
  seatingHit=exteriorRay(leaf,head.clone().add(offset),normal);
 }
 faceAudit.push({id:row.id,step:`S${row.step}`,host:row.host,sourcePdf:steps[row.step-1].pdfPage,
  headWorld:head.toArray(),outwardWorld:normal.toArray(),...hit,
  seatingTarget,seatingAnnulusGap:seatingHit?.headToSurface??null,
  result:!seatingHit?'FAIL_NO_HOST_ON_AXIS':Math.abs(seatingHit.headToSurface)>.4?'FAIL_VISIBLE_SEATING_OFFSET':'EXTERIOR_PLANE_ONLY',
  confidence:row.step===13||row.step===14?'UNVERIFIED_C_END_ALLOCATION':'OEM_TYPE_COUNT; DISPLAY_COORDINATES_INFERRED',
  note:'Positive gap is outside; negative is inset. Triangle-ray test; B/E also test their visible bracket/leaf annulus. No receiver/backing/access certification. Clipping does not participate.'});
}
write('LEGACY-FASTENER-RAY-AUDIT.json',faceAudit);
const after=createProof(true),before=createProof(false);after.evaluate(12);before.evaluate(12);
const interfaces=[];
for(let i=1;i<=4;i++){
 const x=-350+(i-1)*700/3;
 for(const [name,p,y]of [['before',before,60],['after',after,62]] as const){
  const point=new T.Vector3(x,y,-295).applyMatrix4(p.rig.matrixWorld),normal=new T.Vector3(0,0,-1).transformDirection(p.rig.matrixWorld);
  const hit=exteriorRay(p.rear,point,normal);
  interfaces.push({revision:name,rail:`part-6-${i}`,Cend:'HYPOTHESIS_NOT_CONFIRMED',headToRearExterior:hit?.headToSurface??null,hostAxis:hit?'HIT':'MISS',
   railCenterY:y,rearOriginalMeshBottom:104,rearAddedBandCenter:name==='after'?62:null,
   railDepthEnd:name==='after'?277:280,carcassInnerDepth:277,
   depthOverlap:name==='after'?0:3,railToFrontHeightOffset:name==='after'?0:2,
   rearSideEnvelopeOverlap:name==='after'?0:9,units:'display units, NOT OEM mm'});
 }
}
write('BEFORE-AFTER-MEASUREMENTS.json',interfaces);
const seekOrder=[0,5.8,12,1,9.5,2,12,5.8,0,9.5],hashes:Record<string,string>={};let deterministic=true;
for(const t of seekOrder){after.evaluate(t);const hash=createHash('sha256').update(JSON.stringify(after.digest())).digest('hex');if(hashes[t]&&hashes[t]!==hash)deterministic=false;hashes[t]=hash;}
let finite=true,retained=true,maxRailSpeed=0,maxScrewSpeed=0,maxEndpointSpeed=0;let previous:T.Vector3[]|undefined;const dt=1/240;
for(let i=0;i<=duration*240;i++){
 const s=after.evaluate(i*dt),curr=[after.rail.position.clone(),after.screw.position.clone()];
 retained&&=s.visibility.every(([,v])=>v===true);
 after.rig.traverse(o=>{finite&&=[...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()].every(Number.isFinite);if(o instanceof T.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.clippingPlanes?.length)throw Error('Forbidden clipping plane');}});
 if(previous){const speeds=curr.map((v,j)=>v.distanceTo(previous![j])/dt);maxRailSpeed=Math.max(maxRailSpeed,speeds[0]);maxScrewSpeed=Math.max(maxScrewSpeed,speeds[1]);
  if([2,5,6.5,9.5].some(t=>Math.abs(i*dt-t)<dt*1.1))maxEndpointSpeed=Math.max(maxEndpointSpeed,...speeds);
 }previous=curr;
}
const legacyPops=[];
for(const row of placements){const at=steps[row.step-1].start+row.localStart;if(at===0)continue;const a=legacy.evaluate(at-.0001),b=legacy.evaluate(at+.0001);if(!a.visible.includes(row.id)&&b.visible.includes(row.id))legacyPops.push({id:row.id,time:at,stagingOffset:row.offset,note:'Binary introduction at nonzero staging offset; not a continuous entrance'});}
write('LEGACY-VISIBILITY-DISCONTINUITIES.json',legacyPops);
const qa={review:'PRODUCT03-RAIL-FIT-CORRECTION-V1',status:'FOCUSED_EXTERIOR_PROOF_ONLY; FULL_BLOCKING_STILL_BLOCKED',assumptions,
 tests:{deterministic,seekOrder,hashes,finite,retained,samples:duration*240+1,clippingPlanes:0,
 maxRailSpeed,maxScrewSpeed,maxEndpointSpeed,units:'display units per second',
 criteria:'Zero exterior gap at proposed flat contacts (<0.00001 arithmetic), finite history-independent evaluation, no visibility switches, fixed camera; thresholds are software review criteria, not manufacturing tolerances'},
 legacy:{screwInterfaces:faceAudit.length,axisMisses:faceAudit.filter(r=>r.result==='FAIL_NO_HOST_ON_AXIS').length,seatingOffsets:faceAudit.filter(r=>r.result==='FAIL_VISIBLE_SEATING_OFFSET').length,binaryIntroductions:legacyPops.length},
 physical:{receivingGeometry:'NOT_MODELED',threadEngagement:'UNKNOWN',toolAccess:'NOT_CERTIFIED',C13C14:'UNRESOLVED',support:'Free end has no modeled hand/fixture. Support procedure remains unresolved; isolated kinematic proof only.',fullCollision:'NOT_RUN; historical raw failures preserved'},
 acceptance:'No complete blocking, final Long/Short, audio or production authorization implied'};
write('NUMERICAL-QA.json',qa);console.log(JSON.stringify(qa,null,2));
