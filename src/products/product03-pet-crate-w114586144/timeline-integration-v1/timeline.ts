import type {AssemblyDefinition,AnimationAction} from '@/types/assembly';
import {AssemblyGraph} from '@/engine/assembly/AssemblyGraph';
import {sourceSteps} from '../phase-d-illustrative-v2/source-ledger';
import {placements} from '../part-first-sequence-v1/model';
export {placements};
export type V3=[number,number,number];
export const budgets=[18,13,10,14,16,19,8,20,12,10,10,9,16,14,6,19,10,9,6];
let clock=0;
export const steps=sourceSteps.map((s,i)=>{if(i===18)clock+=15;const row={id:s.id,number:i+1,start:clock,end:clock+budgets[i],duration:budgets[i],source:s};clock=row.end;return row;});
export const duration=264,alignment={start:233,end:248},showcase={start:254,end:264};
export type BodyEvent={id:string;step:number;start:number;contact:number;from:V3;to:V3;prepared?:boolean;note:string};
export type HardwareEvent={id:string;step:number;start:number;end:number;kind:'threaded'|'foot'|'bracket'|'stack'|'held-pad';tool:'L'|'M'|null;host:string;backing?:string;length:number;note:string};
export const bodies:BodyEvent[]=[],hardware:HardwareEvent[]=[];
const s=(n:number)=>steps[n-1];
const row=(id:string)=>placements.find(p=>p.id===id)!;
const body=(n:number,id:string,start:number,contact:number,from:V3,to:V3=[0,0,0],prepared=false,note='Unmeasured visible approach; no certified installation trajectory')=>bodies.push({id,step:n,start:s(n).start+start,contact:s(n).start+contact,from,to,prepared,note});
body(1,'part-12-1',0,0,[0,0,0]);body(1,'part-10-1',.25,2.25,[-70,0,0]);body(1,'part-10-2',2.25,4.25,[70,0,0]);
body(2,'part-11-1',.25,2.1,[0,0,65]);body(2,'part-11-2',2.1,3.95,[0,0,65]);
body(3,'part-9-1',.25,2.25,[0,65,0]);body(5,'part-13-1',.25,2.25,[0,0,-65]);body(6,'part-15-1',.25,2.25,[0,-70,0]);
body(7,'part-1-1',.15,.15,[-315,0,0],[-315,0,0],true);body(7,'part-2-1',.15,.15,[315,0,0],[315,0,0],true);body(7,'part-5-1',.15,.15,[820,0,84],[820,0,84],true);
body(8,'part-1-1',1.5,3.5,[-315,0,0]);body(8,'part-2-1',3.5,5.5,[315,0,0]);
body(9,'part-4-1',.25,2.25,[0,0,-110]);body(11,'part-3-1',.25,2.25,[0,0,110]);
// Four rails are placed and fastened in forward order; end allocation stays inferred.
for(let i=0;i<4;i++){const start=i===0?.25:6.5+(i-1)*3;body(13,`part-6-${i+1}`,start,start+(i===0?2:1.25),[0,75,0]);}
// Prepared5 first centers OUTSIDE the side posts; then approaches straight in depth.
body(14,'part-5-1',.25,1.75,[820,0,84],[0,0,84],true,'Declared outside-carcase lateral staging; no OEM path certification');body(14,'part-5-1',1.75,3.25,[0,0,84],[0,0,0]);
body(15,'part-14-1',2.15,4.15,[0,130,0]);body(16,'part-7-1',.25,2.25,[0,0,110]);body(16,'part-8-1',9.75,11.75,[0,0,110]);
function backing(id:string):string|undefined{
 const p=row(id),k=Number(id.split('-').at(-1));
 if(id.startsWith('hardware-D-')){if(p.step===1)return'part-12-1';if(p.step===2)return`part-11-${p.position[0]>0?2:1}`;if(p.step===3)return`part-10-${p.position[0]<0?1:2}`;if(p.step===5)return p.position[1]===914?'part-9-1':`part-10-${p.position[0]<0?1:2}`;if(p.step===6)return Math.abs(p.position[0])===567?`part-10-${p.position[0]<0?1:2}`:Math.abs(p.position[0])===189?`part-11-${p.position[0]<0?1:2}`:'part-12-1';if(p.step===8)return p.position[1]===914?'part-9-1':`part-10-${p.position[0]<0?1:2}`;}
 if(id.startsWith('hardware-C-'))return p.step===9?'part-4-1':p.step===11?'part-3-1':p.step===13?`part-6-${k-8}`:k<=16?`part-6-${k-12}`:'part-5-1';
 if(id.startsWith('hardware-F-'))return p.step===10?'part-13-1':'part-15-1';
 return undefined;
}
function add(id:string,n:number,start:number,end:number,kind:HardwareEvent['kind']='threaded'){
 const p=row(id),code=id.split('-')[1],length=code==='B'?10:code==='C'||code==='F'?25:code==='D'?44:code==='E'?11:0;
 hardware.push({id,step:n,start:s(n).start+start,end:s(n).start+end,kind,tool:kind==='threaded'?('BC D'.replace(/ /g,'').includes(code)?'L':'M'):null,host:p.host!,backing:backing(id),length,note:kind==='stack'?'Exterior source stack posed only; stud/O grip/retention UNVERIFIED':kind==='held-pad'?'HELD: door/retainer release and pad access not validated':'Initial symbolic seating; full shafts, no hidden receiving geometry/torque certification'});
}
function threaded(n:number,start:number,end:number,ids=placements.filter(p=>p.step===n&&/^hardware-[BCDEF]-/.test(p.id)).map(p=>p.id)){
 const unit=(end-start)/(ids.length+1);let at=start;ids.forEach((id,i)=>{const d=unit*(i===0?2:1);add(id,n,at,at+d);at+=d;});
}
threaded(1,4.6,17.5);threaded(2,4.3,12.5);threaded(3,2.6,9.5);
for(let i=0;i<2;i++)add(`hardware-K-${i+1}`,4,.25+i*1.5,1.5+i*1.5,'bracket');threaded(4,3.3,13.5);
threaded(5,2.6,15.5);threaded(6,2.6,18.5);
for(let i=0;i<5;i++)add(`hardware-A-${i+1}`,7,.6+i*1.3,1.7+i*1.3,'foot');
threaded(8,5.9,19.5);threaded(9,2.6,11.5);threaded(10,.75,9.5);threaded(11,2.6,9.5);threaded(12,.75,8.5);
for(let i=0;i<4;i++){const b=bodies.find(b=>b.step===13&&b.id===`part-6-${i+1}`)!;add(`hardware-C-${9+i}`,13,b.contact-s(13).start+.2,i===0?6.25:6.5+i*3-.25);}
threaded(14,3.6,13.5);
threaded(16,2.6,9.25,placements.filter(p=>p.step===16&&p.host==='part-1-1').map(p=>p.id));threaded(16,12.1,18.75,placements.filter(p=>p.step===16&&p.host==='part-2-1').map(p=>p.id));
for(const n of [17,18]){const ids=placements.filter(p=>p.step===n).map(p=>p.id),d=(s(n).duration-1)/ids.length;ids.forEach((id,i)=>add(id,n,.25+i*d,.25+(i+1)*d,'stack'));}
for(let i=1;i<=4;i++)add(`hardware-N-${i}`,19,.5+(i-1),1.5+(i-1),'held-pad');
export const holds=[{step:4,scope:'B2/B4 + bracket/tool interface',reason:'Verified positive solid overlap B1/B2 and B3/B4 in accepted prototype. No unapproved hardware resizing or hole relocation. Hold B2/B4 uninstalled; downstream states are conditional QA only.'},{step:17,scope:'O tool/retention',reason:'Visible grip and depicted stud/receiver are unverified; no invented tightening animation.'},{step:18,scope:'I/J + O tool/retention',reason:'InsetI vs summaryJ conflict remains; source stack is an external pose only.'},{step:19,scope:'Door/retainer release + pad application',reason:'No new latch-release mechanism or physical door access may be invented. Keep N4 staged; functional sequence HELD.'}];
export const assembly:AssemblyDefinition={id:'product03-compact264-integration-v1',sourceNote:'Source19-step order; human-authorized illustrative exterior integration, no physical certification',steps:steps.map(st=>({id:st.id,name:st.source.action,dependsOn:[...st.source.sequence_prerequisites],orderSource:'reference',source:'image_visible',confidence:'low',actions:[...bodies.filter(b=>b.step===st.number).flatMap(b=>[{type:'show',target:b.id,at:b.start-st.start,source:'image_visible',confidence:'low'},{type:'move',target:b.id,at:b.start-st.start,duration:b.contact-b.start,to:row(b.id).position,source:'mechanically_inferred',confidence:'low'}] as AnimationAction[]),...hardware.filter(h=>h.step===st.number).flatMap(h=>[{type:'show',target:h.id,at:h.start-st.start,source:'image_visible',confidence:'low'},{type:'move',target:h.id,at:h.start-st.start,duration:h.end-h.start,to:row(h.id).position,source:'mechanically_inferred',confidence:'low'}] as AnimationAction[])]}))};
export const graph=new AssemblyGraph(assembly);
