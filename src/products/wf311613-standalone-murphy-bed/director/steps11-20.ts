import * as THREE from 'three';
import type {AnimationAction,InstallationDefinition,InstallPartAction} from '@/types/assembly';
import type {DirectorPlan,DirectorShot,DirectorShotType,DirectorStep} from '@/types/director';
import type {Vector3Tuple} from '@/types/product';
import type {VideoDefinition} from '@/types/video';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {fitInstructionalBox} from '@/engine/camera/InstructionalFraming';
import {steps01To10Plan as prefix,steps01To10Video as prefixVideo} from './steps04-10';
import {actionPacing} from './actionPacing';
import {bed,parts11To20,faceRailIds,faceJoints,carrierCorners,carrierMembers,carrierWood,brackets,matingJoints,hardwareSpecs,pos,world} from '../product/parts-step11-20';

export const pacing11To20={firstBolt22:1.55,repeatedCam:.40,repeatedBolt:.65,firstScrew:1.05,
  repeatedScrew:.30,bracketRepeatScrew:.28,firstPanel:1.25,repeatedPanel:.90,firstPart:1.05,repeatedPart:.70,
  hold:.12,repeatHold:.06} as const;
export const cameras11To20={...prefixVideo.cameraPresets};
function view(id:string,min:Vector3Tuple,max:Vector3Tuple,direction:Vector3Tuple,underside=false){
  const preset=fitInstructionalBox(min,max,direction,.76,35),v=new THREE.Vector3(...direction).normalize(),right=new THREE.Vector3(0,1,0).cross(v).normalize(),up=v.clone().cross(right).normalize();
  const distance=new THREE.Vector3(...preset.position).distanceTo(new THREE.Vector3(...preset.target)),tan=Math.tan(35*Math.PI/360);
  // Reserve the existing lower-left caption area; change new shot composition,
  // not the approved UI or the locked prefix's camera dictionary.
  const shift=right.multiplyScalar(-distance*tan*(16/9)*.13).add(up.multiplyScalar(-distance*tan*.20));
  preset.position=new THREE.Vector3(...preset.position).add(shift).toArray() as Vector3Tuple;preset.target=new THREE.Vector3(...preset.target).add(shift).toArray() as Vector3Tuple;
  cameras11To20[id]={...preset,...(underside?{allowUnderside:true}:{})};return id;
}
const offset=(id:string,d:Vector3Tuple)=>pos(id).map((v,i)=>v+d[i]) as Vector3Tuple;
const showAt=(id:string,d:Vector3Tuple):AnimationAction[]=>[{type:'move',target:id,to:offset(id,d),duration:0},{type:'show',target:id}];
function shot(id:string,type:DirectorShotType,duration:number,camera:string,note:string,actions:AnimationAction[]=[]):DirectorShot{return{id,type,duration,camera,transition:'cut',note,actions};}
function insert(id:string,host:string,staging:Vector3Tuple,duration:number,extra:InstallationDefinition={}):InstallPartAction{return{type:'installPart',target:id,connection:{part:host,point:'mount'},duration,installation:{stagingOffset:staging,preInstallOffset:staging.map(v=>v*.25) as Vector3Tuple,approachDirection:staging,approachDistance:.6,collisionTolerance:.04,estimated:true,...extra}};}
export function hardwareAction(id:string,duration:number,at=0,extra:InstallationDefinition={}):AnimationAction{
  const h=hardwareSpecs.get(id)!;const axis=h.normal.reduce((max,v,i)=>Math.abs(v)>Math.abs(h.normal[max])?i:max,0);
  return{type:h.kind,target:id,connection:{part:h.host,point:'mount'},at,duration,turns:h.kind==='installNut'||h.kind==='installDowel'?0:duration>.9?3.5:2.2,spinAxis:(['x','y','z'] as const)[axis],
    installation:{approachDirection:h.normal,approachDistance:h.kind==='installBolt'?h.length+3:h.kind==='installScrew'?h.length+3:4,
      contactDistance:h.kind==='installBolt'?h.length:h.kind==='installScrew'?h.length:h.kind==='installDowel'?1.5:1.3,
      mechanicalPhases:true,motionTiming:duration>.9?actionPacing.firstPhases:actionPacing.repeatedPhases,allowedContacts:h.mates,collisionTolerance:.025,estimated:true,...extra}};
}
function camJoint(id:string,camera:string,first=false,park?:Vector3Tuple):DirectorShot{
  const c=first?.65:.40,b=first?pacing11To20.firstBolt22:.65,extra=park?{seatedOffset:park,allowStagedTarget:true}:{};
  return shot(`${id}-connect`,'INSTALL_HARDWARE',c+b+.20,camera,first?`#8 cam enters its cross-bore; #${hardwareSpecs.get(`${id}-bolt`)!.number} aligns, contacts, visibly threads into the cam and seats.`:'Repeated cam joint: physical cam insertion, rapid visible bolt feed/rotation, then cam lock.',[
    hardwareAction(`${id}-cam`,c,0,extra),hardwareAction(`${id}-bolt`,b,c+.03,extra),
    {type:'rotate',target:`${id}-cam`,axis:hardwareSpecs.get(`${id}-cam`)!.normal[1]?'y':'x',space:'world',from:0,to:180,unit:'deg',duration:.12,at:c+b+.03,ease:'none'},
  ]);
}
const steps:DirectorStep[]=[];
function finish(n:number,title:string,parts:string[],hardwareLabel:string,shots:DirectorShot[]){steps.push({step:n,id:`step-${n}`,title,subtitle:`PDF page ${Math.floor((n-11)/2)+17}`,pdfPage:Math.floor((n-11)/2)+17,parts,hardwareLabel,shots});}
const wide=view('S11-face-wide',world([-128,0,-120]),world([128,34,133]),[.65,1.4,1.3]);
const faceResult=view('S15-face-result',world([-119,1,-106]),world([119,18,106]),[.45,1.9,1.3]);
const allContext=view('S11-cabinet-and-face',[-127,0,-24],[127,232,bed.z+118],[.45,1,1.6]);
const firstJoint=faceJoints.find(j=>j.step===11)!;
function faceCamera(j:typeof firstJoint){return view(`${j.id}-macro`,world([j.x-13,0,j.end<0?-119:82]),world([j.x+13,24,j.end<0?-82:119]),[.7,1.1,j.end*1.7]);}
finish(11,'Start the separate bed-face grid',['C1-start','C4-left'],'#8 ×1 · #22 ×1',[
  shot('S11-context','ESTABLISHING',1.5,allContext,'The corrected cabinet is complete and parked. Begin a NEW, separate bed-face subassembly in the supported work area.'),
  shot('S11-introduce','INTRODUCE_PART',.9,wide,'C1 cross rail and C4 longitudinal rail — a right-angle starting joint.',[...showAt('C1-start',[0,0,0]),...showAt('C4-left',[0,0,18])]),
  shot('S11-target','SHOW_TARGET',.8,faceCamera(firstJoint),'C4 tongue and C1 groove: identify the right-angle mating surfaces and the two intersecting receiver axes.'),
  shot('S11-C4-seat','INSERT_PART',1.3,wide,'C4 approaches axially from the open end; its integral tongue enters C1, with no wood crossing.',[insert('C4-left','C1-start',[0,0,18],1.18)]),
  camJoint(firstJoint.id,faceCamera(firstJoint),true),
  shot('S11-complete','STEP_COMPLETE',.7,wide,'C1/C4 corner secured at 90°. Cabinet remains unchanged and separate.'),
]);
function panels(n:number,bays:number[],rails:string[],joints:typeof faceJoints){
  const shots:DirectorShot[]=[],camera=view(`S${n}-layout`,world([-119,0,-110]),world([119,24,168]),[.6,1.65,1.3]);
  shots.push(shot(`S${n}-context`,'ESTABLISHING',.65,camera,'Continue the existing face grid; the closing end stays open for axial panel insertion.'));
  for(const rail of rails){shots.push(shot(`S${n}-${rail}-introduce`,'INTRODUCE_PART',.3,camera,'Introduce the next longitudinal rail, parallel to the existing grid.',showAt(rail,[0,0,18])));shots.push(shot(`S${n}-${rail}-seat`,'INSERT_PART',.88,camera,'Seat the rail at the C1 receiver. The panel groove remains open at its far end.',[insert(rail,'C1-start',[0,0,18],.78)]));}
  const layer=view(`S${n}-layer`,world([bays[0]===0?-118:-63,3,-110]),world([bays[0]===0?-49:7,17,-57]),[.55,.50,-1.8]);
  shots.push(shot(`S${n}-layer-target`,'SHOW_TARGET',.65,layer,'Layer order: exposed rail face ABOVE the C6 panel; panel edges rest inside the actual routed support channels.'));
  for(const bay of bays){
    const id=`C6-${bay}-first`;
    shots.push(shot(`S${n}-${id}-introduce`,'INTRODUCE_PART',.30,camera,'C6 stages beyond the OPEN end, clear of the existing rails.',showAt(id,[0,16,210])));
    shots.push(shot(`S${n}-${id}-seat`,'INSERT_PART',1.37,camera,'Lower outside the rail ends, then slide C6 axially through its support channels into the first bay. Never drop it through a rail.',[insert(id,'C1-start',[0,16,210],1.25,{preInstallOffset:[0,0,200],approachDirection:[0,0,1],approachDistance:4,allowedContacts:faceRailIds})]));
    const c=`C3-${bay}`;
    shots.push(shot(`S${n}-${c}-seat`,'INSERT_PART',.91,camera,'C3 enters from the empty bay; its end tongues enter the same side channels and its front groove captures the seated panel edge.',[...showAt(c,[0,0,24]),insert(c,faceRailIds[bay],[0,0,24],.81,{allowedContacts:[faceRailIds[bay+1],id]})]));
  }
  for(const j of joints)shots.push(camJoint(j.id,faceCamera(j)));
  shots.push(shot(`S${n}-complete`,'STEP_COMPLETE',.7,faceResult,n===12?'Two C6 panels captured below the rail faces; two C3 center ties installed.':'Four first-half C6 panels and all four C3 center ties installed symmetrically.'));
  finish(n,n===12?'Fit the first panels and rail network':'Extend the face grid symmetrically',[...rails,...bays.flatMap(i=>[`C6-${i}-first`,`C3-${i}`])],'#8 ×2 · #22 ×2',shots);
}
panels(12,[1,2],['C4-right','C5'],faceJoints.filter(j=>j.step===12));
const c7Shots:DirectorShot[]=[shot('S13-context','ESTABLISHING',.7,wide,'Three C7 support profiles belong BELOW C5, not on the decorative panel face.')];
for(const i of [0,1,2]){
  const p=pos(`C7-${i}`),camera=view(`S13-C7-${i}-edge`,[p[0]-12,p[1]-4,p[2]-32],[p[0]+12,p[1]+14,p[2]+32],[1.8,.35,.65]);
  const underside=view(`S13-C7-${i}-underside`,[p[0]-12,p[1]-7,p[2]-32],[p[0]+12,p[1]+8,p[2]+32],[1.8,-.7,.65],true);
  c7Shots.push(shot(`S13-C7-${i}-seat`,'INSERT_PART',i===0?1.1:.8,underside,'Approach C7 from the clear underside and seat its top face against C5.',[...showAt(`C7-${i}`,[0,-3,0]),insert(`C7-${i}`,'C5',[0,-3,0],i===0?.98:.70)]));
  cameras11To20[camera]={...cameras11To20[view(`S13-C7-${i}-screw-top`,[p[0]-12,p[1]-4,p[2]-22],[p[0]+12,p[1]+18,p[2]+22],[1.5,1.4,.7])]};
  const d=i===0?1.0:.40;
  c7Shots.push(shot(`S13-C7-${i}-screws`,'INSTALL_HARDWARE',2*d+.12,camera,'Two #12 screws drive downward through C5 into this C7 support.',[hardwareAction(`S13-H12-${i}-0`,d),hardwareAction(`S13-H12-${i}-1`,d,d+.04)]));
}
c7Shots.push(shot('S13-complete','STEP_COMPLETE',.65,wide,'All three C7 profiles secured beneath C5, with two #12 screws each.'));
finish(13,'Fasten three underside C7 supports',['C7-0','C7-1','C7-2'],'#12 ×6',c7Shots);
panels(14,[0,3],['C2-left','C2-right'],faceJoints.filter(j=>j.step===14));
const closeShots:DirectorShot[]=[shot('S15-context','ESTABLISHING',.7,faceResult,'Four matching second-half bays remain open. Keep C1 clear until all panels are seated.')];
for(const i of [0,1,2,3]){
  const id=`C6-${i}-second`;
  closeShots.push(shot(`S15-${id}-seat`,'INSERT_PART',1.0,wide,'C6 enters from the open end in the SAME support layer; its first edge meets the C3 center groove.',[...showAt(id,[0,12,110]),insert(id,`C3-${i}`,[0,12,110],.9,{preInstallOffset:[0,0,100],approachDirection:[0,0,1],approachDistance:4,allowedContacts:faceRailIds})]));
}
closeShots.push(shot('S15-C1-introduce','INTRODUCE_PART',.6,wide,'All EIGHT panels are seated. Introduce the closing C1 end rail.',showAt('C1-close',[0,0,18])));
closeShots.push(shot('S15-C1-seat','INSERT_PART',1.35,wide,'Align all five rail tongues with the end groove, then close C1 axially without crossing a panel.',[insert('C1-close','C4-left',[0,0,18],1.23,{allowedContacts:[...faceRailIds,...[0,1,2,3].map(i=>`C6-${i}-second`)]})]));
for(const j of faceJoints.filter(j=>j.step===15))closeShots.push(camJoint(j.id,faceCamera(j)));
closeShots.push(shot('S15-complete','STEP_COMPLETE',.85,faceResult,'Eight supported C6 panels, four center ties, five long rails and both C1 ends form one complete face grid.'));
finish(15,'Close the completed eight-panel face grid',['C1-close',...[0,1,2,3].map(i=>`C6-${i}-second`)],'#8 ×5 · #22 ×5',closeShots);

const frameWide=view('S16-separate-frame',world([177,0,-116]),world([423,33,116]),[.55,1.7,1.3]);
const twoAssemblies=view('S16-two-assemblies',world([-120,0,-112]),world([422,45,112]),[.25,1.75,1.4]);
const frameShots:DirectorShot[]=[shot('S16-context','ESTABLISHING',1.2,twoAssemblies,'The completed face stays parked. Build a SECOND, independent rectangular carrier from C8 ×2, C9 and D1.',carrierWood.flatMap(id=>showAt(id,id==='C9'?[300,0,-16]:id==='D1'?[300,0,16]:bed.carrierPark)))];
for(const [index,j]of carrierCorners.entries()){
  const p=offset(j.rail,bed.carrierPark),z=bed.z+j.end*96.4,camera=view(`${j.id}-macro`,[p[0]-11,p[1]-9,z-13],[p[0]+11,p[1]+10,z+13],[-j.side*.9,1,j.end*1.7]);
  const d=index===0?.65:.30;
  frameShots.push(shot(`${j.id}-dowels`,'INSTALL_HARDWARE',d*2+.1,camera,'Insert the TWO #6 corner dowels into C8. The separate end rail remains outboard until both corners are aligned.',[hardwareAction(`${j.id}-dowel-0`,d,0,{seatedOffset:bed.carrierPark,allowStagedTarget:true}),hardwareAction(`${j.id}-dowel-1`,d,d+.03,{seatedOffset:bed.carrierPark,allowStagedTarget:true})]));
}
for(const end of [-1,1])frameShots.push(shot(`S16-${end}-end-seat`,'INSERT_PART',1.2,frameWide,'The end rail seats along BOTH pairs of exposed dowels at once. C8 members are supported in parallel; no corner sweeps through a dowel.',[insert(end<0?'C9':'D1','C8-left',[0,0,end*16],1.08,{seatedOffset:bed.carrierPark,allowStagedTarget:true,allowedContacts:['C8-right',...carrierCorners.filter(j=>j.end===end).flatMap(j=>[`${j.id}-dowel-0`,`${j.id}-dowel-1`])],approachDirection:[0,0,end]})]));
for(const [i,j]of carrierCorners.entries())frameShots.push(camJoint(j.id,`${j.id}-macro`,i===0,bed.carrierPark));
frameShots.push(shot('S16-square','VERIFY_CONNECTION',.75,frameWide,'Verify the two diagonals and four square corners. Carrier remains SEPARATE from the face grid.'));
frameShots.push(shot('S16-complete','STEP_COMPLETE',.65,twoAssemblies,'Two complete large subassemblies: face grid and rectangular carrier.'));
finish(16,'Build the separate carrier frame',carrierWood,'#6 ×8 · #8 ×4 · #3 ×4',frameShots);

const carry=(from:Vector3Tuple,to:Vector3Tuple,duration:number):AnimationAction[]=>carrierMembers.map(id=>({type:'move',target:id,from:offset(id,from),to:offset(id,to),duration,ease:'power2.inOut'}));
const matingWide=view('S17-mating-wide',world([-122,0,-113]),world([422,64,113]),[.4,1.8,1.25]);
const matingLayer=view('S17-layer',world([-124,0,-115]),world([124,55,115]),[.65,.65,1.7]);
const combined=view('S17-combined',world([-122,0,-110]),world([122,25,110]),[.45,1.9,1.25]);
const mateShots:DirectorShot[]=[shot('S17-context','ESTABLISHING',1.25,twoAssemblies,'TWO completed assemblies become ONE bed. Keep the face grid supported and stationary.')];
mateShots.push(shot('S17-lift','STAGE_PART',1.65,matingWide,'Lift the COMPLETE carrier, including every installed corner fastener, clear of the work surface.',carry(bed.carrierPark,[300,28,0],1.5)));
mateShots.push(shot('S17-above','ALIGN_CONNECTION',1.65,matingWide,'Translate above the face grid only after the underside clears the highest face member.',carry([300,28,0],[0,28,0],1.5)));
mateShots.push(shot('S17-target','SHOW_TARGET',.9,matingLayer,'Eight vertical dowel pairs and eight underside bolt/cam joints must align before lowering.'));
for(const [i,j]of matingJoints.entries()){
  const p=j.dowel,camera=view(`${j.id}-dowel-macro`,[p[0]-9,p[1]-4,p[2]-9],[p[0]+9,p[1]+15,p[2]+9],[.6,1.4,1.6]);
  mateShots.push(shot(`${j.id}-dowel`,'INSTALL_HARDWARE',i===0?.75:.46,i===0?camera:matingLayer,'#6 vertical dowel: leave half exposed for the aligned carrier receiver.',[hardwareAction(`${j.id}-dowel`,i===0?.65:.40)]));
}
mateShots.push(shot('S17-lower','ALIGN_CONNECTION',2.0,matingLayer,'Controlled lowering: retain the separation between the face panels and the carrier; align all eight dowels.',carry([0,28,0],[0,1.5,0],1.85)));
mateShots.push(shot('S17-seat','INSERT_PART',1.15,matingLayer,'Eight dowels enter the carrier and its lower faces seat on the face rails, not through C6.',carry([0,1.5,0],[0,0,0],1.03)));
for(const [i,j]of matingJoints.entries()){
  const p=j.cam,cam=view(`${j.id}-cam-view`,[p[0]-8,p[1]-5,p[2]-8],[p[0]+8,p[1]+10,p[2]+8],[j.normal[0]*1.8+.15,.55,j.normal[2]*1.8+.5]);
  const bolt=view(`${j.id}-underside`,[j.bolt[0]-9,j.bolt[1]-11,j.bolt[2]-9],[j.bolt[0]+9,j.bolt[1]+6,j.bolt[2]+9],[j.normal[0]*1.7+.15,-.55,j.normal[2]*1.7+.5],true);
  const c=i===0?.65:.35,b=i===0?1.25:.60;
  mateShots.push(shot(`${j.id}-cam-seat`,'INSTALL_HARDWARE',c+.05,cam,'#8 installs from the accessible INNER carrier face. Its window meets the vertical bolt bore.',[hardwareAction(`${j.id}-cam`,c)]));
  mateShots.push(shot(`${j.id}-bolt-up`,'INSTALL_HARDWARE',b+.08,bolt,'PDF Step 17: #3 enters UP from the underside of the face rail into the carrier cam. Visible thread engagement and seating.',[hardwareAction(`${j.id}-bolt`,b)]));
}
mateShots.push(shot('S17-complete','STEP_COMPLETE',1,combined,'Face outside/below, structural carrier inside/above: one rigid bed assembly, all eight joining cam bolts and dowels installed.'));
finish(17,'Mate the two complete bed subassemblies',[],'#6 ×8 · #8 ×8 · #3 ×8',mateShots);

for(const n of [18,19]){
  const shots:DirectorShot[]=[shot(`S${n}-context`,'ESTABLISHING',.65,combined,n===18?'Identify the first six bare inside corners. Each angle bracket uses FOUR #14 screws.':'Opposite locations remain bare; the first six brackets stay installed. Repeat the same physical bracket operation.')];
  for(const [i,b]of brackets.filter(b=>b.step===n).entries()){
    const dir=new THREE.Vector3(.8,1.2,1.4).applyEuler(new THREE.Euler(...b.rotation.map(v=>v*Math.PI/180) as Vector3Tuple)).toArray() as Vector3Tuple,p=b.position;
    const camera=view(`${b.id}-view`,[p[0]-8,p[1]-3,p[2]-8],[p[0]+8,p[1]+13,p[2]+8],dir);
    const first=n===18&&i===0,normal=new THREE.Vector3(1,1,0).applyEuler(new THREE.Euler(...b.rotation.map(v=>v*Math.PI/180) as Vector3Tuple)).toArray() as Vector3Tuple;
    shots.push(shot(`${b.id}-seat`,'INSERT_PART',first?1.0:.55,camera,'The separate bent #20 bracket approaches from the open corner, aligns all four pilots, and seats on BOTH faces.',[...showAt(b.id,normal.map(v=>v*5) as Vector3Tuple),insert(b.id,b.host,normal.map(v=>v*5) as Vector3Tuple,first?.9:.48,{allowedContacts:[b.support]})]));
    const ids=['v0','h0','v1','h1'].map(t=>`${b.id}-H14-${t}`),d=first?.65:.28;
    shots.push(shot(`${b.id}-screws`,'INSTALL_HARDWARE',4*d+.14,camera,'Two screws into the vertical carrier face, two DOWN into the horizontal face rail. Each physically approaches, threads and seats.',ids.map((id,j)=>hardwareAction(id,d,j*(d+.02)))));
  }
  shots.push(shot(`S${n}-complete`,'STEP_COMPLETE',.8,combined,n===18?'First six #20 brackets secured with 24 #14 screws.':'All TWELVE #20 brackets secured; 48 #14 screws, both perpendicular faces at every joint.'));
  finish(n,n===18?'Reinforce the first six inside corners':'Reinforce the opposite six corners',brackets.filter(b=>b.step===n).map(b=>b.id),'#20 ×6 · #14 ×24',shots);
}
const slatShots:DirectorShot[]=[shot('S20-context','ESTABLISHING',.8,combined,'The exposed +Y side is the MATTRESS-facing side. Five D2 slats sit above the face-grid rails, inside the carrier.')];
for(const [i,z]of bed.slatZ.entries()){
  const edge=view(`S20-D2-${i}-edge`,world([-114,3,z-10]),world([114,25,z+10]),[.45,.8,1.8]);
  const first=view(`S20-D2-${i}-screw`,world([-117,5,z-9]),world([-98,23,z+9]),[1,1.2,1.3]);
  slatShots.push(shot(`S20-D2-${i}-seat`,'INSERT_PART',i===0?1.3:.8,edge,'D2 lowers onto the five rail support faces. Its ends remain INSIDE the carrier, never beneath the deck.',[...showAt(`D2-${i}`,[0,8,0]),insert(`D2-${i}`,'C5',[0,8,0],i===0?1.18:.70,{allowedContacts:faceRailIds})]));
  slatShots.push(shot(`S20-D2-${i}-first-screw`,'INSTALL_HARDWARE',i===0?1.1:.39,i===0?first:edge,'#16 screw enters the D2 pilot, visibly rotates/feeds, and seats into the support rail.',[hardwareAction(`S20-H16-${i}-0`,i===0?1.0:.33)]));
  slatShots.push(shot(`S20-D2-${i}-remaining-screws`,'INSTALL_HARDWARE',1.42,edge,'Four remaining #16 screws install sequentially across the slat; no hardware pop-in.',[1,2,3,4].map((j)=>hardwareAction(`S20-H16-${i}-${j}`,.32,(j-1)*.35))));
}
slatShots.push(shot('S20-complete','STEP_COMPLETE',1.2,combined,'Five D2 slats and all 25 #16 screws installed on the mattress-facing side. Verify even spacing. STOP before Step 21.'));
finish(20,'Fit five mattress-support slats',Array.from({length:5},(_,i)=>`D2-${i}`),'D2 ×5 · #16 ×25',slatShots);

export const steps01To20Plan:DirectorPlan={...prefix,id:'wf311613-steps01-20-paced',steps:[...prefix.steps,...steps]};
export const steps01To20Assembly=DirectorPlanCompiler.assembly(steps01To20Plan);
let cursor=0;
export const steps01To20Video:VideoDefinition={...prefixVideo,id:steps01To20Plan.id,title:'WF311613 · Steps 1–20 paced director review',cameraPresets:cameras11To20,
  scenes:DirectorPlanCompiler.scenes(steps01To20Plan).map(s=>({...s,partIntro:undefined})),
  reviewCaptions:steps01To20Plan.steps.flatMap(step=>step.shots.map(s=>{const start=cursor;cursor+=s.duration;return{start,end:cursor,title:s.type.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase()),note:step.step===10?(s.note??'').replace('STOP before Step 11.','Cabinet complete; continue with the separate bed-face assembly.'):(s.note??'')};}))};
export const runtime11To20=steps.map(s=>({step:s.step,duration:s.shots.reduce((n,s)=>n+s.duration,0)}));
export const partsByStep11To20=steps.map(s=>({step:s.step,parts:parts11To20.filter(p=>s.parts.includes(p.id)).map(p=>p.id)}));
