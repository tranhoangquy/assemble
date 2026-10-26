import * as T from 'three';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createModel,placements,drive} from './model';
import {createModel as oldModel,placements as oldPlacements} from '../f-illustrative-proof-v1/model';
import {contactChecks} from '../f-illustrative-proof-v1/checks';
import {createProof} from './proof';
import {sourceSteps} from '../phase-d-illustrative-v2/source-ledger';
const out=new URL('../../../../output/product03-pet-crate-w114586144/part-first-sequence-v1/',import.meta.url);
const save=(n:string,v:unknown)=>writeFileSync(new URL(n,out),JSON.stringify(v,null,2));
const m=createModel(),old=oldModel(),rows=[];
for(const p of placements.filter(p=>/^hardware-[BCDEF]-/.test(p.id))){
 const o=m.r.registry.require(p.id),point=o.getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,1,0).applyQuaternion(o.getWorldQuaternion(new T.Quaternion()));let target=m.r.registry.require(p.host!),targetId=p.host!;
 if(p.step===4){targetId=`hardware-K-${Number(p.id.split('-').at(-1))<=2?1:2}`;target=m.r.registry.require(targetId);point.z+=4;}
 if(p.step===16){targetId=`presentation-stationary-hinge-${p.host!.includes('-1-')?'7':'8'}`;target=m.r.root.children.find(o=>o.name===targetId)!;point.y+=3;}
 const hit=new T.Raycaster(point.clone().addScaledVector(normal,2),normal.clone().negate(),0,7).intersectObject(target,true)[0];rows.push({id:p.id,step:p.step,target:targetId,gap:hit?hit.distance-2:null});
}
save('ALL-77-EXTERIOR-SEATING.json',rows);save('CONTACT-AND-BACKING-REGRESSION.json',contactChecks(m));
const hashObject=(o:T.Object3D)=>{const v:unknown[]=[];o.traverse(c=>{if(c instanceof T.Mesh)v.push({p:c.position.toArray(),q:c.quaternion.toArray(),s:c.scale.toArray(),positions:Array.from(c.geometry.getAttribute('position').array),indices:c.geometry.index?Array.from(c.geometry.index.array):null});});return createHash('sha256').update(JSON.stringify(v)).digest('hex');};
const unchanged=[...m.r.registry.entries()].filter(([id])=>id.startsWith('part-')||id.startsWith('hardware-F-')).map(([id,o])=>({id,meshMatch:hashObject(o)===hashObject(old.r.registry.require(id)),positionMatch:o.position.equals(old.r.registry.require(id).position),orientationMatch:o.quaternion.equals(old.r.registry.require(id).quaternion)}));
const deltas=placements.filter(p=>JSON.stringify(p.position)!==JSON.stringify(oldPlacements.find(o=>o.id===p.id)!.position)).map(p=>({id:p.id,before:oldPlacements.find(o=>o.id===p.id)!.position,after:p.position,confidence:'EXPLICIT ILLUSTRATIVE RECEIVING POSITION; NOT OEM coordinates'}));
save('BASELINE-AND-PLACEMENT-DELTAS.json',{unchanged,placementChanges:deltas,visibleDriveChange:'D39 existing hex mouths across-flats3.741→4.2 display units; outer shells/shafts unchanged',toolChange:'ExistingL object: hex profile across-flats4, long65/short24 display proportions; manual listsL M4'});
save('ALL-19-STEP-COUNTS.json',sourceSteps.map(s=>({id:s.id,pdf:s.pdf_page,hardware:s.hardware,actual:Object.fromEntries(Object.keys(s.hardware).map(c=>[c,placements.filter(p=>p.step===s.OEM_step&&p.id.startsWith(`hardware-${c}-`)).length])),uncertainty:s.OEM_step===18?'I/J INSET/SUMMARY CONFLICT STILL OPEN':s.OEM_step===13||s.OEM_step===14?'C END ALLOCATION STILL OPEN':'Qualitative source association; unmeasured display geometry'})));
const p=createProof();p.evaluate('S02',7);const screw=p.r.registry.require('hardware-D-5'),key=p.r.registry.require('hardware-L-1'),inverse=screw.matrixWorld.clone().invert();let radialMargin=Infinity,minTipY=Infinity,insideCount=0;
key.traverse(o=>{if(o instanceof T.Mesh){const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).applyMatrix4(inverse);minTipY=Math.min(minTipY,v.y);if(v.y>=.35-1e-6&&v.y<=2.8+1e-6){insideCount++;for(let k=0;k<6;k++){const angle=Math.PI/6+k*Math.PI/3;radialMargin=Math.min(radialMargin,drive.visibleSlotAcrossFlats/2-v.x*Math.cos(angle)-v.z*Math.sin(angle));}}}}});
save('VISIBLE-DRIVE-FIT.json',{actualTipVerticesInHeadDepth:insideCount,minHexSidePlaneMargin:radialMargin,lowestKeyPlane:minTipY,backingDiskExteriorPlane:.35,tipToBackingGap:minTipY-.35,method:'Actual key mesh vertices transformed into existing visibleD-drive space. Parallel straight hex shaft cross-section is constant; no hidden bore or torque claim.'});
console.log(JSON.stringify({exteriorChecks:rows.length,exteriorFailures:rows.filter(r=>r.gap===null||Math.abs(r.gap)>1e-5),partsAndFUnchanged:unchanged.every(r=>r.meshMatch&&r.positionMatch&&r.orientationMatch),placementChanges:deltas,radialMargin,minTipY},null,2));
