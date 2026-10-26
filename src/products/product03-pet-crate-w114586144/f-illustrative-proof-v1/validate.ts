import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exteriorChecks,contactChecks,accessChecks} from './checks';
import {createProof} from './proof';
import {placements,boardSizes} from './model';
import {sourceSteps} from '../phase-d-illustrative-v2/source-ledger';
const out=new URL('../../../../output/product03-pet-crate-w114586144/f-illustrative-proof-v1/',import.meta.url);
const write=(name:string,x:unknown)=>writeFileSync(new URL(name,out),JSON.stringify(x,null,2));
const {m,rows}=exteriorChecks(),contacts=contactChecks(m);write('ALL-77-EXTERIOR-CHECKS.json',rows);write('CONTACT-AND-BACKING-CHECKS.json',contacts);
const access=[accessChecks('S10'),accessChecks('S12')];write('RAW-ACCESS-AND-CONTACT-CLASSIFICATION.json',access);
const proof=createProof(true),seekHashes:Record<string,Record<string,string>>={};let deterministic=true,retention=true,finite=true,maxPositionFrameDelta=0;
for(const group of ['S10','S12'] as const){
 seekHashes[group]={};for(const t of [0,7,12,1,4.5,7,0,12]){proof.evaluate(group,t);const h=createHash('sha256').update(JSON.stringify(proof.digest())).digest('hex');if(seekHashes[group][t]&&seekHashes[group][t]!==h)deterministic=false;seekHashes[group][t]=h;}
 let visible:string[]=[];let prev:number[][]|undefined;
 for(let i=0;i<=12*120;i++){const s=proof.evaluate(group,i/120);retention&&=visible.every(id=>s.visible.includes(id));visible=s.visible;proof.rig.traverse(o=>{finite&&=[...o.position.toArray(),...o.quaternion.toArray()].every(Number.isFinite);});const curr=[proof.r.registry.require(s.active).position.toArray(),proof.r.registry.require('hardware-M-1').position.toArray()];if(prev)maxPositionFrameDelta=Math.max(maxPositionFrameDelta,...curr.map((v,k)=>Math.hypot(...v.map((x,j)=>x-prev![k][j]))));prev=curr;}
}
const steps=sourceSteps.map(s=>({id:s.id,pdf:s.pdf_page,sourceHardware:s.hardware,actualCounts:Object.fromEntries(Object.keys(s.hardware).map(code=>[code,placements.filter(p=>p.step===s.OEM_step&&p.id.startsWith(`hardware-${code}-`)).length])),status:s.OEM_step===10||s.OEM_step===12?'HUMAN B NONLITERAL F':s.OEM_step===8?'NONLITERAL CONTACT PROPAGATION':s.OEM_step===13||s.OEM_step===14?'C END ALLOCATION STILL UNVERIFIED':s.OEM_step===18?'I/J CONFLICT STILL OPEN':'PREVIOUS PROVISIONAL SOURCE ASSOCIATION; exact coordinates not certified'}));
write('ALL-19-STEP-REGRESSION.json',steps);
const ids=[...m.r.registry.entries()].map(([id])=>id);
const report={review:'PRODUCT03-F-ILLUSTRATIVE-PROOF-V1-20261022',humanAuthorization:'Direct human B; local nonliteral F proof only',
 inventory:{parts:ids.filter(id=>id.startsWith('part-')).length,hardwareAccessories:ids.filter(id=>id.startsWith('hardware-')&&!/^hardware-[LMO]-/.test(id)).length,tools:3,steps:19},
 exterior:{checks:rows.length,failures:rows.filter(r=>r.gap===null||Math.abs(r.gap)>.4)},
 contacts:{checks:contacts.contacts.length,maxGap:Math.max(...contacts.contacts.map(r=>Math.abs(r.gap))),woodPairs:contacts.woodPairs.length,woodPositiveOverlaps:contacts.woodPairs.filter(p=>p.positiveVolume).length},
 F:{checks:8,backingMisses:contacts.lap.filter(r=>r.backingDistance===null).length,hostApproachObstructions:contacts.lap.filter(r=>r.rawHostApproachHit).length,lapPlane:'rear4 front−277 meets13 back−277; front3 inner277 meets15 front277',engagement:'raw stock overlap retained; no receiving bore/thread modeled'},
 propagatedS8:{checks:10,backingMisses:contacts.backing.filter(r=>r.distance===null).length},
 motion:{deterministic,retention,finite,seekHashes,samplesPerClip:1441,maxPositionDeltaAt120Hz:maxPositionFrameDelta},
 access:{unrelatedCandidates:access.flatMap(r=>r.records.filter(p=>p.classification==='UNRELATED_POSITIVE_AABB_CANDIDATE')),maxToolAxisError:Math.max(...access.map(r=>r.maxTipAxisError)),minHeadExterior:Math.min(...access.map(r=>r.minHeadExterior)),rawPhysicalResult:'UNVERIFIED/RAW SHAFT-STOCK OVERLAP; not a certified installation'},
 assumptions:{boardSizes,allCoordinates:'unmeasured display units, not OEM mm',Faxis:'explicitly nonliteral, not evidence recovery',toolBlade:'visible prototype adjusted to existing modeled cross recess; not a manufacturer tool specification',I_J:'OPEN',C13C14:'OPEN'},
 boundary:'Local Director proof only. No complete158s render, final Long/Short or audio authorized.'};
write('VALIDATION.json',report);console.log(JSON.stringify({inventory:report.inventory,exterior:report.exterior,contacts:report.contacts,F:report.F,propagatedS8:report.propagatedS8,motion:{deterministic,retention,finite},access:report.access},null,2));
