import * as T from 'three';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRuntime} from './runtime';
import {createRuntime as createV1} from '../timeline-integration-v1/runtime';
import {createProof} from '../s04-two-bolt-proof-v1/proof';
import {steps,bodies,hardware,graph,placements,duration,holds,mapToV1} from './timeline';
const out=new URL('../../../../output/product03-pet-crate-w114586144/s04-integration-v2/',import.meta.url);
const save=(n:string,v:unknown)=>writeFileSync(new URL(n,out),JSON.stringify(v,null,2));
const r=createRuntime(),ref=createProof(),v1=createV1();
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const near=(a:number[],b:number[])=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<1e-8);
const pose=(o:T.Object3D)=>[...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()];
const bk=['hardware-K-1','hardware-K-2',...Array.from({length:4},(_,i)=>`hardware-B-${i+1}`)];
const geometry=(o:T.Object3D)=>{const h=createHash('sha256');o.traverse(c=>{if(c instanceof T.Mesh){h.update(JSON.stringify([c.position.toArray(),c.quaternion.toArray(),c.scale.toArray()]));for(const n of Object.keys(c.geometry.attributes).sort()){const a=c.geometry.attributes[n].array;h.update(n);h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}if(c.geometry.index){const a=c.geometry.index.array;h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}}});return h.digest('hex');};
save('EXACT-ACCEPTED-GEOMETRY.json',[...r.r.registry.entries()].map(([id,o])=>({id,geometrySha256:geometry(o),matchesAcceptedS04:geometry(o)===geometry(ref.r.registry.require(id))})));
const endRows=steps.map(st=>{const first=r.evaluate(st.start),last=r.evaluate(st.end);return{id:st.id,start:st.start,end:st.end,duration:st.duration,pdf:st.source.pdf_page,source:st.source.hardware,actual:Object.fromEntries(Object.keys(st.source.hardware).map(code=>[code,hardware.filter(h=>h.step===st.number&&h.id.startsWith(`hardware-${code}-`)).length])),installed:last.installed,seated:last.hardwareSeated,posedHeld:last.posedHeld,pending:last.pending,firstVisible:first.visible,lastVisible:last.visible,holds:holds.filter(h=>h.step<=st.number)};});save('19-STEP-ENDPOINTS.json',endRows);
let deterministic=true,finite=true,retention=true,localPoseRetention=true,noEarlyHardware=true;const seek:Record<string,string>={},poseMap=new Map<string,number[]>(),visibleInstalled=new Set<string>(),failures:unknown[]=[];
for(const t of [0,278,41,69,55,68.999,40.999,112,115,197,211,247,262,268,12,0,55,69,278,112,41,247]){r.evaluate(t);const h=hash(r.digest());if(seek[t]&&seek[t]!==h)deterministic=false;seek[t]=h;}
for(let i=0;i<=2780;i++){
 const t=i/10,s=r.evaluate(t),vis=new Set(s.visible);
 for(const id of visibleInstalled)if(!vis.has(id)){retention=false;failures.push({kind:'VISIBILITY',t,id});}
 for(const id of [...s.installed,...s.hardwareSeated]){
  const o=r.r.registry.require(id),p=pose(o);
  if(id.startsWith('hardware-A-')){const host=r.r.registry.require(placements.find(p=>p.id===id)!.host!);p.splice(0,3,...o.position.clone().sub(host.position).toArray());}
  if(poseMap.has(id)&&!near(poseMap.get(id)!,p)){localPoseRetention=false;failures.push({kind:'LOCAL_POSE',t,id});}poseMap.set(id,p);visibleInstalled.add(id);
 }
 r.rig.traverse(o=>{finite&&=pose(o).every(Number.isFinite);});
 for(const h of hardware.filter(h=>h.kind==='threaded'&&h.start<=t))for(const id of [h.host,h.backing].filter(Boolean) as string[]){const b=bodies.filter(b=>b.id===id&&b.step<=h.step&&!b.prepared&&b.start<=h.start).at(-1);if(b&&h.start<b.contact-1e-6)noEarlyHardware=false;}
}
save('RETENTION-AND-SEEK.json',{deterministic,finite,retention,localPoseRetention,noEarlyHardware,samples:2781,seek,failures,qualification:'Numerical equality tolerance1e-8 for poses, not collision tolerance. Feet compared relative to their prepared moving host; common rig reorientation preserved.'});
let exactS04=true,s01s03Unchanged=true,laterNonBKUnchanged=true;const mismatches:unknown[]=[];
for(let i=0;i<=280;i++){
 const local=i/10,t=41+local,side=local<14?'left':'right';ref.evaluate(side,Math.round((local<14?local:Math.min(local-14,14))*1e9)/1e9);r.evaluate(t);
 for(const id of [...bk,...(t<69?['hardware-L-1']:[])]){const a=r.r.registry.require(id),b=ref.r.registry.require(id);if(a.visible!==b.visible||!near(pose(a),pose(b))){exactS04=false;mismatches.push({t,id});}}
}
for(const t of [0,.25,4.25,5,17.99,18,26,30.99,31,40.9,69,85,103,112,130,173,207,247,267,278]){
 r.evaluate(t);v1.evaluate(mapToV1(t));for(const[id,a]of r.r.registry.entries())if(!bk.includes(id)){const b=v1.r.registry.require(id);const match=a.visible===b.visible&&near(pose(a),pose(b));if(t<41)s01s03Unchanged&&=match;else laterNonBKUnchanged&&=match;}
}
const boundaryRows=[];for(const boundary of [41,55,69])for(const t of [boundary-1e-4,boundary,boundary+1e-4]){const s=r.evaluate(t);boundaryRows.push({boundary,t,step:s.step,visible:s.visible,poses:Object.fromEntries([...s.installed,...s.hardwareSeated].map(id=>[id,pose(r.r.registry.require(id))]))});}
save('S04-INTEGRATION-EQUIVALENCE.json',{exactS04,s01s03Unchanged,laterNonBKUnchanged,mismatches,method:'Actual V2 actor poses/visibility versus accepted S04 evaluator; unchanged other actors versus frozen V1 at mapped absolute times. No MP4 reuse.'});save('BOUNDARY-CONTINUITY.json',boundaryRows);
// Relative-to-rig matrices expose unwanted resets while allowing the declared
// whole-module presentation inversion, which is not a physical lift simulation.
r.evaluate(69);const inv=r.rig.matrixWorld.clone().invert(),canonical=Object.fromEntries(bk.map(id=>[id,new T.Matrix4().multiplyMatrices(inv,r.r.registry.require(id).matrixWorld).toArray()]));
const propagated=[];for(const t of [69,...steps.filter(s=>s.number>=5).map(s=>s.end),112.1,112.7,113.4,209.2,210.0,211.0,278]){const s=r.evaluate(t),inv=r.rig.matrixWorld.clone().invert();propagated.push({t,step:s.step,rigQuaternion:r.rig.quaternion.toArray(),interfaces:bk.map(id=>({id,visible:r.r.registry.require(id).visible,retainedRelativeMatrix:near(canonical[id],new T.Matrix4().multiplyMatrices(inv,r.r.registry.require(id).matrixWorld).toArray()),seated:s.hardwareSeated.includes(id)}))});}save('BK-PROPAGATION.json',propagated);
type MB={owner:string;box:T.Box3};const meshRows=(owner:string,o:T.Object3D)=>{const list:MB[]=[],inv=r.rig.matrixWorld.clone().invert();o.traverse(c=>{if(c instanceof T.Mesh){if(!c.geometry.boundingBox)c.geometry.computeBoundingBox();list.push({owner,box:c.geometry.boundingBox!.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv,c.matrixWorld))});}});return list;};
type Hit={event:string;a:string;b:string;kind:string;first:number;last:number;samples:number;maxMinimumDepth:number};const hits=new Map<string,Hit>();
function add(event:string,a:MB,b:MB,t:number,kind:string){const v=a.box.clone().intersect(b.box).getSize(new T.Vector3()),depth=Math.min(v.x,v.y,v.z);if(depth<=1e-6)return;const key=[event,a.owner,b.owner,kind].join('|'),old=hits.get(key);if(old){old.last=t;old.samples++;old.maxMinimumDepth=Math.max(old.maxMinimumDepth,depth);}else hits.set(key,{event,a:a.owner,b:b.owner,kind,first:t,last:t,samples:1,maxMinimumDepth:depth});}
const factory=(id:string)=>id==='part-7-1'||id==='part-8-1'?r.r.root.children.find(o=>o.name===`presentation-stationary-hinge-${id.includes('-7-')?'7':'8'}`):undefined;
function visibleMeshes(except:Set<string>){const a:MB[]=[];for(const[id,o]of r.r.registry.entries())if(o.visible&&!except.has(id)&&!/^hardware-[LMO]-/.test(id))a.push(...meshRows(id,o));for(const code of ['7','8']){const id=`part-${code}-1`,g=factory(id);if(g?.visible&&!except.has(id))a.push(...meshRows(id,g));}return a;}
for(const b of bodies.filter(b=>b.contact>b.start))for(let i=0;i<=40;i++){
 const t=T.MathUtils.lerp(b.start,b.contact,i/40);r.evaluate(t);const own=new Set([b.id,...(b.id==='part-1-1'?['hardware-A-1','hardware-A-2']:b.id==='part-2-1'?['hardware-A-3','hardware-A-4']:b.id==='part-5-1'?['hardware-A-5']:[])]),moving=meshRows(b.id,r.r.registry.require(b.id)),g=factory(b.id);if(g?.visible)moving.push(...meshRows(b.id,g));for(const a of moving)for(const other of visibleMeshes(own))add(`${b.id}@${b.step}`,a,other,t,other.owner.startsWith('hardware-')?'MOVING_BODY_VS_RETAINED_HARDWARE':'MOVING_BODY_VS_OTHER_STRUCTURE');
}
for(const h of hardware.filter(h=>h.kind!=='held-pad'))for(let i=0;i<=40;i++){
 const t=T.MathUtils.lerp(h.start,h.end,i/40),state=r.evaluate(t),actor=r.r.registry.require(h.id),other=visibleMeshes(new Set([h.id]));
 for(const a of meshRows(h.id,actor))for(const b of other){const kId=`hardware-K-${Math.ceil(Number(h.id.split('-').at(-1))/2)}`,receiving=b.owner===h.host||b.owner===h.backing||h.id.startsWith('hardware-B-')&&b.owner===kId||h.id.startsWith('hardware-E-')&&b.owner===`part-${h.host.includes('-1-')?'7':'8'}-1`;add(h.id,a,b,t,h.kind==='threaded'?(receiving?'RECEIVING_STOCK_RAW_CANDIDATE':'UNRELATED_FASTENER_CANDIDATE'):h.kind==='foot'?'FOOT_RECEIVING_CANDIDATE':h.kind==='stack'?'EXTERIOR_STACK_UNVERIFIED':'BRACKET_CONTACT_CANDIDATE');}
 if(h.tool){const tool=r.r.registry.require(`hardware-${h.tool}-1`);if(tool.visible)for(const a of meshRows(`tool-${h.tool}`,tool)){for(const b of other)add(h.id,a,b,t,'TOOL_VS_INSTALLED_CANDIDATE');for(const b of meshRows(h.id,actor.children[0]))add(h.id,a,b,t,'TOOL_VS_VISIBLE_DRIVE_AABB');}}
 if(state.clippingPlanes!==0)throw Error('Shaft clipping forbidden');
}
const raw=[...hits.values()],suspect=raw.filter(h=>['MOVING_BODY_VS_RETAINED_HARDWARE','MOVING_BODY_VS_OTHER_STRUCTURE','UNRELATED_FASTENER_CANDIDATE','TOOL_VS_INSTALLED_CANDIDATE'].includes(h.kind)),refinements:Array<Hit & {minPreciseSeparatingAxisGap:number;preciseOverlapSamples:number;method:string}>=[];
for(const c of suspect.filter(c=>c.a.startsWith('hardware-B-')&&c.b.startsWith('hardware-B-'))){let minGap=Infinity,overlap=0;for(let i=0;i<=100;i++){r.evaluate(T.MathUtils.lerp(c.first,c.last,i/100));const A=new T.Box3().setFromObject(r.r.registry.require(c.a),true),B=new T.Box3().setFromObject(r.r.registry.require(c.b),true),gap=Math.max(...(['x','y','z']as const).map(k=>Math.max(0,A.min[k]-B.max[k],B.min[k]-A.max[k])));minGap=Math.min(minGap,gap);if(gap<=0)overlap++;}refinements.push({...c,minPreciseSeparatingAxisGap:minGap,preciseOverlapSamples:overlap,method:'Actual transformed mesh vertices,101 samples; original conservative AABB candidate retained.'});}
const unresolved=suspect.filter(c=>!refinements.some(f=>f.event===c.event&&f.a===c.a&&f.b===c.b&&f.preciseOverlapSamples===0));
save('RAW-INSTALLATION-AND-TOOL-CANDIDATES.json',raw);save('PRECISE-B-PAIR-REFINEMENT.json',refinements);
const final=r.evaluate(278),software={deterministic,finite,retention,localPoseRetention,noEarlyHardware,exactS04,s01s03Unchanged,laterNonBKUnchanged},propagation=propagated.every(p=>p.interfaces.every(i=>i.visible&&i.retainedRelativeMatrix&&i.seated));const summary={review:'PRODUCT03-S04-INTEGRATION-V2-20261023',status:!Object.values(software).every(Boolean)||!propagation?'FAIL — SOFTWARE REGRESSION':unresolved.length?'REQUIRES REVIEW — UNRESOLVED RAW CANDIDATES':'BOUNDED SOFTWARE/ILLUSTRATIVE INTEGRATION QA PASS — DIRECTOR REVIEW REQUIRED',duration,sourceOperations:253,alignmentInterlude:15,showcase:10,graph:{steps:graph.steps.length,cycles:graph.cycles,missing:graph.missingDependencies},inventory:{numberedInstances:new Set(bodies.map(b=>b.id)).size,hardwareUnits:hardware.length,uniqueHardware:new Set(hardware.map(h=>h.id)).size,tools:3},software,propagation,final:{structural:final.installed.length,initialSeats:final.hardwareSeated.length,poseOnly:final.posedHeld.length,pending:final.pending},rawCandidates:raw.length,unresolved,sourceHolds:holds,physicalConfidence:'NOT_CERTIFIED; all receiving stock/concave-drive outcomes preserved; no pair removed or collision tolerance changed',fullFilmRender:'NOT RUN'};
save('INTEGRATION-QA.json',summary);console.log(JSON.stringify(summary,null,2));
