import * as T from 'three';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createModel,placements} from './model';
import {createProof,groups} from './proof';
import {placements as oldPlacements} from '../phase-d-illustrative-v2/timeline';
import {sourceSteps} from '../phase-d-illustrative-v2/source-ledger';
const out=new URL('../../../../output/product03-pet-crate-w114586144/p0-connections-v1/',import.meta.url);
function write(name:string,data:unknown){writeFileSync(new URL(name,out),JSON.stringify(data,null,2));}
export function cast(host:T.Object3D,point:T.Vector3,n:T.Vector3,reach=2){host.updateWorldMatrix(true,true);const hits=new T.Raycaster(point.clone().addScaledVector(n,reach),n.clone().negate(),0,reach+5).intersectObject(host,true);return hits[0]?{gap:hits[0].distance-reach,hit:hits[0].point.toArray()}:null;}
const pairs=[createModel(false),createModel(true)];
const rows:Array<{revision:string;id:string;step:number;targetId:string;nearExteriorGap:number|null;wideAxisFirstGap:number|null;result:string;confidence:string}>=[];
for(const m of pairs){
 for(const p of (m.corrected?placements:oldPlacements).filter(p=>/^hardware-[BCDEF]-/.test(p.id))){
  const obj=m.r.registry.require(p.id),head=obj.getWorldPosition(new T.Vector3()),n=new T.Vector3(0,1,0).applyQuaternion(obj.getWorldQuaternion(new T.Quaternion()));let target=m.r.registry.require(p.host!);let targetId=p.host!;
  if(p.step===4){targetId=`hardware-K-${Number(p.id.split('-').at(-1))<=2?1:2}`;target=m.r.registry.require(targetId);head.z+=4;}
  if(p.step===16){targetId=`presentation-stationary-hinge-${p.host!.includes('-1-')?'7':'8'}`;target=m.r.root.children.find(o=>o.name===targetId)!;head.y+=3;}
  const near=cast(target,head,n),wide=cast(target,head,n,100);
  rows.push({revision:m.corrected?'proposal':'old',id:p.id,step:p.step,targetId,nearExteriorGap:near?.gap??null,wideAxisFirstGap:wide?.gap??null,
   result:near&&Math.abs(near.gap)<.4?'EXTERIOR_SEATING_ONLY':near?'FAIL_SEATING':'FAIL_NO_NEAR_HOST',
   confidence:p.step===13||p.step===14?'C_END_ALLOCATION_UNVERIFIED':'SOURCE_TYPE_COUNT; EXACT_COORDINATES_ILLUSTRATIVE'});
 }
}
write('ALL-77-FASTENERS-BEFORE-AFTER.json',rows);
const model=pairs[1],Fblocked=[];
for(let i=1;i<=8;i++){
 const id=`hardware-F-${i}`,p=placements.find(p=>p.id===id)!,head=model.r.registry.require(id).position.clone(),normal=new T.Vector3(0,-1,0);
 const hits=new T.Raycaster(head.clone().addScaledVector(normal,60),normal.clone().negate(),0,59.9).intersectObject(model.r.registry.require(p.host!),true);
 Fblocked.push({id,host:p.host,seatedHead:head.toArray(),outward:normal.toArray(),nearFace:cast(model.r.registry.require(p.host!),head,normal),
  fullStraightApproach:'BLOCKED',firstObstruction:hits[0]?{point:hits[0].point.toArray(),distanceFromHead:60-hits[0].distance,mesh:hits[0].object.name||'Existing mesh/frame submesh'}:null,
  disposition:'STOP F motion; no receiver/tool path invented. Same-OEM host submeshes included, not excluded.'});
}
write('F-ACCESS-STOP.json',Fblocked);
const geometry=[
 {joint:'11 rear end → 12 inner front',old:{overlapDepth:18},proposal:{planeA:-51,planeB:-51,gap:0},source:'p4 S2; inner connector position is an unmeasured reconstruction'},
 {joint:'10/11 upper edges → 9 underside',old:{gap:0},proposal:{planeA:905,planeB:905,gap:0},source:'p5 S3/S4'},
 {joint:'9 and10 rear edges → 13 front',old:{panel13Bottom:924,side10Top:905,noSideBacking:true},proposal:{planeA:-277,planeB:-277,gap:0},source:'p6 S5;13 closure association reconstructed, not measured'},
 {joint:'10/11/12 bottom → 15 top',old:{panel15Top:745},proposal:{planeA:771,planeB:771,gap:0},source:'p6 S6'},
 {joint:'13 bottom → accepted4 upper band',proposal:{planeA:753,planeB:753,gap:0},source:'Contact-derived visual proposal; exact stock sizes unknown'},
 {joint:'15 bottom → accepted3 upper band',proposal:{planeA:753,planeB:753,gap:0},source:'p9 S11/S12 association; visual contact proposal'},
 {joint:'14 bottom → all four6 rails',old:{planeA:79,planeB:69,gap:10},proposal:{planeA:71,planeB:71,gap:0},source:'p11 S15 rests on supports; no fastener'},
];
write('GEOMETRY-CONTACTS.json',geometry);
// Measure actual mesh bounds, rather than treating the contact design ledger as a test.
const bounds=(m:typeof model,id:string)=>new T.Box3().setFromObject(m.r.registry.require(id));
const contacts=[];
for(const m of pairs){
 for(const [a,b,axis,faceA,faceB]of [
  ['part-11-1','part-12-1','z','min','max'],['part-11-2','part-12-1','z','min','max'],
  ['part-10-1','part-9-1','y','max','min'],['part-11-1','part-9-1','y','max','min'],
  ['part-10-1','part-13-1','z','min','max'],['part-9-1','part-13-1','z','min','max'],
  ['part-15-1','part-10-1','y','max','min'],['part-15-1','part-11-1','y','max','min'],
  ['part-15-1','part-12-1','y','max','min'],
  ...Array.from({length:4},(_,i)=>['part-14-1',`part-6-${i+1}`,'y','min','max']),
 ] as [string,string,'x'|'y'|'z','min'|'max','min'|'max'][]){
  const ba=bounds(m,a),bb=bounds(m,b);contacts.push({revision:m.corrected?'proposal':'old',a,b,axis,faceA:ba[faceA][axis],faceB:bb[faceB][axis],signedFaceDifference:ba[faceA][axis]-bb[faceB][axis],units:'unmeasured display units'});
 }
}
write('ACTUAL-MESH-CONTACT-MEASUREMENTS.json',contacts);
const woodIds=[...model.r.registry.entries()].map(([id])=>id).filter(id=>/^part-(9|10|11|12|13|14|15)-/.test(id)),woodPairs=[];
for(const m of pairs)for(let i=0;i<woodIds.length;i++)for(let j=i+1;j<woodIds.length;j++){
 const a=woodIds[i],b=woodIds[j],overlap=bounds(m,a).intersect(bounds(m,b)).getSize(new T.Vector3());
 woodPairs.push({revision:m.corrected?'proposal':'old',a,b,overlap:overlap.toArray(),volume:overlap.x*overlap.y*overlap.z,classification:Math.min(overlap.x,overlap.y,overlap.z)>1e-5?'SOLID_OVERLAP':'NO_POSITIVE_VOLUME'});
}
write('ALL-WOOD-PAIR-OVERLAPS.json',woodPairs);
const backing=[];
for(const p of placements.filter(p=>p.step===8||p.id.startsWith('hardware-F-'))){
 const id=p.id;if(!id.startsWith('hardware-'))continue;const n=new T.Vector3(...p.outward!);
 const receiver=p.step===8?(p.position[2]<0?'part-13-1':p.position[1]<800?'part-15-1':'part-9-1'):p.position[2]<0?'part-13-1':'part-15-1';
 const head=new T.Vector3(...p.position),hits=new T.Raycaster(head.clone(),n.clone().negate(),0,p.step===8?44:25).intersectObject(model.r.registry.require(receiver),true);
 backing.push({id,receiver,firstBackingDistance:hits[0]?.distance??null,axisHitsProposedBacking:!!hits[0],confidence:'INFERRED exterior backing allocation, NOT OEM receiving coordinates or internal fastening proof'});
}
write('PROPOSED-BACKING-AXES.json',backing);
const steps=sourceSteps.map(s=>({step:s.id,pdf:s.pdf_page,hardware:s.hardware,
 actualCounts:Object.fromEntries(Object.keys(s.hardware).map(code=>[code,placements.filter(p=>p.step===s.OEM_step&&p.id.startsWith(`hardware-${code}-`)).length])),
 exteriorChecks:rows.filter(r=>r.revision==='proposal'&&r.step===s.OEM_step),
 scope:s.OEM_step===10||s.OEM_step===12?'EXTERIOR CORRECTED; APPROACH BLOCKED — STOP':s.OEM_step===13||s.OEM_step===14?'ACCEPTED RAIL EXTERIOR; C ALLOCATION STILL UNVERIFIED':s.OEM_step===18?'I/J SOURCE CONFLICT OPEN':'CONTROLLED ILLUSTRATIVE PROPOSAL; NO INTERNAL ENGAGEMENT CLAIM'}));
write('ALL-19-STEP-REGRESSION.json',steps);
let deterministic=true,retained=true,finite=true;const hashes:Record<string,Record<string,string>>={};
const proof=createProof(true);
for(const group of groups){hashes[group]={};let previous:string[]=[];
 for(let i=0;i<=8*120;i++){proof.evaluate(group,i/120);const current=[...proof.r.registry.entries()].filter(([,o])=>o.visible).map(([id])=>id);retained&&=previous.every(id=>current.includes(id));previous=current;proof.rig.traverse(o=>{finite&&=[...o.position.toArray(),...o.quaternion.toArray()].every(Number.isFinite);});}
 for(const t of [0,3.75,8,1,6,3.75,0,8]){proof.evaluate(group,t);const h=createHash('sha256').update(JSON.stringify(proof.digest())).digest('hex');if(hashes[group][t]&&hashes[group][t]!==h)deterministic=false;hashes[group][t]=h;}
}
const registryIds=[...model.r.registry.entries()].map(([id])=>id);
const summary={review:'PRODUCT03-P0-CONNECTIONS-V1',inventory:{parts:registryIds.filter(id=>id.startsWith('part-')).length,hardwareAccessories:registryIds.filter(id=>id.startsWith('hardware-')&&!/^hardware-[LMO]-/.test(id)).length,tools:registryIds.filter(id=>/^hardware-[LMO]-/.test(id)).length,steps:steps.length},
 exterior:{oldFailures:rows.filter(r=>r.revision==='old'&&r.result!=='EXTERIOR_SEATING_ONLY').length,proposalFailures:rows.filter(r=>r.revision==='proposal'&&r.result!=='EXTERIOR_SEATING_ONLY').length,checks:77},
 meshContacts:{checks:contacts.filter(r=>r.revision==='proposal').length,maxAbsoluteDifference:Math.max(...contacts.filter(r=>r.revision==='proposal').map(r=>Math.abs(r.signedFaceDifference)))},
 woodPairs:{pairsPerRevision:woodPairs.length/2,oldOverlaps:woodPairs.filter(r=>r.revision==='old'&&r.classification==='SOLID_OVERLAP').length,proposalOverlaps:woodPairs.filter(r=>r.revision==='proposal'&&r.classification==='SOLID_OVERLAP').length},
 backingAxes:{checks:backing.length,misses:backing.filter(r=>!r.axisHitsProposedBacking).length},
 F_access:{blocked:Fblocked.filter(r=>r.firstObstruction).length,total:8,action:'STOP; no F installation motion rendered'},
 software:{deterministic,retained,finite,samplesPerClip:961,clips:groups.length,hashes},
 confidence:'Display proportions, backing allocation and source coordinate interpretation are visual proposals. No OEM dimension, bore/thread/tool access certification. C13/C14 and I/J remain OPEN.',
 wholeProduct:'P0 NOT CLEARED; F paths blocked; complete blocking/final films/audio NOT AUTHORIZED'};
write('VALIDATION.json',summary);console.log(JSON.stringify(summary,null,2));
