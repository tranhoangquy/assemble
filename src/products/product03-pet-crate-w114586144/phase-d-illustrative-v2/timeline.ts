import type {AssemblyDefinition,AnimationAction} from '@/types/assembly';
import type {Vector3Tuple} from '@/types/product';
import {AssemblyGraph} from '@/engine/assembly/AssemblyGraph';
import {sourceSteps} from './source-ledger';
export type Placement={id:string;step:number;localStart:number;duration:number;position:Vector3Tuple;offset:Vector3Tuple;outward?:Vector3Tuple;host?:string;orientation?:Vector3Tuple;note:string};
export const stepDurations=[14,8,7,9,7,8,8,10,7,6,6,5,7,7,8,12,7,6,6];
let clock=0;
export const steps=sourceSteps.map((s,i)=>{const row={id:s.id,title:s.action,start:clock,end:clock+stepDurations[i],duration:stepDurations[i],pdfPage:s.pdf_page,hardware:s.hardware};clock=row.end;return row;});
export const assemblyDuration=clock;
export const duration=assemblyDuration+10;
export const placements:Placement[]=[];
const part=(code:number,i:number,step:number,position:Vector3Tuple,offset:Vector3Tuple,start=.5,dur=2)=>placements.push({id:`part-${code}-${i}`,step,position,offset,localStart:start,duration:dur,note:'OEM association; unmeasured visual approach, not validated installation trajectory'});
part(12,1,1,[0,825,-270],[0,0,0],0,.1);part(10,1,1,[-567,825,0],[-100,0,0],1,2);part(10,2,1,[567,825,0],[100,0,0],3,1.7);
part(11,1,2,[-189,825,0],[0,0,100],.4,1.7);part(11,2,2,[189,825,0],[0,0,100],2,1.5);
part(9,1,3,[0,914,0],[0,100,0],.5,2.2);
part(13,1,5,[0,954,-270],[0,0,-100],.5,2.1);
part(15,1,6,[0,736,0],[0,-100,0],.4,2.3);
part(1,1,7,[-685,0,0],[-100,0,0],.2,1.3);part(2,1,7,[685,0,0],[100,0,0],1.4,1.3);
part(5,1,7,[820,62,370],[0,0,80],2.7,1.1);
part(4,1,9,[0,408,-286],[0,0,-110],.4,2);
part(3,1,11,[0,712,286],[0,0,100],.4,1.8);
for(let i=1;i<=4;i++)part(6,i,13,[-350+(i-1)*700/3,60,0],[0,90,0],.3+(i-1)*.8,1);
part(14,1,15,[0,88,0],[0,140,0],3.8,2);
part(7,1,16,[-289,400,286],[0,0,110],.4,2.2);part(8,1,16,[289,400,286],[0,0,110],2.6,1.8);
const next:Record<string,number>={};
function hw(code:string,step:number,pos:Vector3Tuple,out:Vector3Tuple,host:string,start:number,dur=1,note='OEM qualitative face; display position/engagement are illustrative'){
 const id=`hardware-${code}-${next[code]=(next[code]??0)+1}`;placements.push({id,step,position:pos,outward:out,host,offset:out.map(x=>x*55) as Vector3Tuple,localStart:start,duration:dur,note});return placements.at(-1)!;
}
for(const [side,sign] of [[1,-1],[2,1]])for(let j=0;j<2;j++)hw('D',1,[sign*576,j?785:865,-270],[sign,0,0],`part-10-${side}`,5+((side-1)*2+j)*1.65,1.25);
for(let i=0;i<2;i++)for(let j=0;j<2;j++)hw('D',2,[i?-189:189,j?785:865,-279],[0,0,-1],'part-12-1',3.6+(i*2+j)*.8,.7);
for(const x of [-567,567])for(const z of [-230,230])hw('D',3,[x,923,z],[0,1,0],'part-9-1',3+next.D!%4*.65,.65);
for(let i=0;i<2;i++){
 const x=i?171:-171;const bracket=hw('K',4,[x,904,220],[0,-1,0],`part-11-${i+1}`,.4+i*3,1.1);bracket.orientation=[Math.PI,i?-Math.PI/2:Math.PI/2,0];
 hw('B',4,[x,903,220],[0,-1,0],'part-9-1',1.6+i*3,.8);hw('B',4,[i?178:-178,896,220],[i?-1:1,0,0],`part-11-${i+1}`,2.4+i*3,.7);
}
for(let i=0;i<7;i++)hw('D',5,[-540+i*180,954,-279],[0,0,-1],'part-13-1',2.8+i*.45,.45,'S5 D7 quantity confirmed; individual backing unknown. Exterior-only symbol; no receiver claim.');
for(const [i,x]of [-550,-189,189,550,0].entries())for(const z of [-235,235])hw('D',6,[x,727,z],[0,-1,0],'part-15-1',2.8+i*.8+(z>0?.4:0),.4);
for(const [i,pos]of [[-685,3,-286],[-685,3,286],[685,3,-286],[685,3,286],[820,3,370]].entries())hw('A',7,pos as Vector3Tuple,[0,-1,0],i<4?`part-${i<2?1:2}-1`:'part-5-1',3.5+i*.7,.65);
for(const sign of [-1,1])for(let i=0;i<5;i++)hw('D',8,[sign*594,[752,810,875,914,954][i],i<3?[-220,0,220][i]:-240],[sign,0,0],`part-${sign<0?1:2}-1`,3+i*.75+(sign>0?3.4:0),.6);
for(const sign of [-1,1])for(const y of [116,700])hw('C',9,[sign*594,y,-286],[sign,0,0],`part-${sign<0?1:2}-1`,2.7+(next.C??0)*.7,.6);
for(let i=0;i<4;i++)hw('F',10,[-450+i*300,717,-286],[0,1,0],'part-4-1',.6+i*1,.8);
for(const sign of [-1,1])for(const y of [706,718])hw('C',11,[sign*594,y,286],[sign,0,0],`part-${sign<0?1:2}-1`,2.4+((next.C??0)-4)*.65,.6);
for(let i=0;i<4;i++)hw('F',12,[-450+i*300,721,286],[0,1,0],'part-3-1',.6+i*.85,.65);
for(let i=0;i<4;i++)hw('C',13,[-350+i*700/3,60,-295],[0,0,-1],'part-4-1',3.5+i*.8,.65,'C13 rear-end distribution is an explicitly unverified visual hypothesis.');
for(let i=0;i<4;i++)hw('C',14,[-350+i*700/3,60,295],[0,0,1],'part-5-1',2.6+i*.7,.6,'C14 opposite rail6 ends + two rail5 ends: unverified allocation hypothesis.');
for(const sign of [-1,1])hw('C',14,[sign*594,62,286],[sign,0,0],`part-${sign<0?1:2}-1`,5.5+(sign>0?.7:0),.6,'C14 rail5 end target is inferred, not source-confirmed.');
for(const sign of [-1,1])for(const y of [177,623])for(const dy of [-8,8])hw('E',16,[sign*581,y+dy,296.5],[0,0,1],`part-${sign<0?1:2}-1`,5.2+(sign>0?2.7:0)+(y>400?1.1:0)+(dy>0?.5:0),.5);
for(const [step,code,y]of [[17,'J',724],[18,'I',74]] as const)for(const sign of [-1,1]){
 const start=.5+(sign>0?2.6:0);const x=sign*16;hw('H',step,[x,y,297.3],[0,0,1],step===17?'part-3-1':'part-5-1',start,.7);
 const tab=hw(code,step,[x,y-(code==='I'?8:0),298.1],[0,0,1],step===17?'part-3-1':'part-5-1',start+.7,.8,'I/J ambiguity retained; exterior stack only, no stud geometry invented.');tab.orientation=[0,0,code==='J'?sign*Math.PI/2:0];if(code==='J')tab.position[0]-=-sign*8;
 hw('G',step,[x,y,299.6],[0,0,1],step===17?'part-3-1':'part-5-1',start+1.5,.7);
}
for(const sign of [-1,1])for(const y of [120,680]){const p=hw('N',19,[sign*42,y,275.5],[0,0,-1],`part-${sign<0?7:8}-1`,.5+(sign>0?2.3:0)+(y>400?1.1:0),.8,'N4 at inside door latch-side margins; approximate source association, no adhesive/fit claim.');}
export const assembly:AssemblyDefinition={id:'product03-phase-d-illustrative-v2',sourceNote:'Human-authorized illustrative simulation. Source order retained; transforms/hidden engagement not physical evidence.',steps:steps.map((s,i)=>({id:s.id,name:`OEM ${i+1}`,dependsOn:i?[steps[i-1].id]:[],orderSource:'reference',source:'image_visible',confidence:'low',actions:placements.filter(p=>p.step===i+1).flatMap(p=>[{type:'show',target:p.id,at:p.localStart,source:'image_visible',confidence:'low'},{type:'move',target:p.id,at:p.localStart,duration:p.duration,to:p.position,source:'mechanically_inferred',confidence:'low'}] as AnimationAction[])}))};
export const graph=new AssemblyGraph(assembly);
