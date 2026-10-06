import type {AnimationAction,InstallationDefinition} from '@/types/assembly';
import * as THREE from 'three';
import type {DirectorPlan,DirectorShot,DirectorShotType,DirectorStep} from '@/types/director';
import type {Vector3Tuple} from '@/types/product';
import type {VideoDefinition} from '@/types/video';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {fitInstructionalBox} from '@/engine/camera/InstructionalFraming';
import {directorPlan as approvedPrefix,reviewVideo as approvedVideo} from './directorPlan';
import {actionPacing} from './actionPacing';
import {parts,rows,rowJoints,capOffset,capWood,capMembers,capScrewIds,topDowels,topScrews,mechanisms,mechanismScrews,centerScrewY,b8Insertion,b8Staging,b7Staging} from '../product/parts-step04-10';

export const cameras:VideoDefinition['cameraPresets']={...approvedVideo.cameraPresets};
const pos=(id:string)=>parts.find(p=>p.id===id)!.position;
const offset=(id:string,d:Vector3Tuple)=>pos(id).map((v,i)=>v+d[i]) as Vector3Tuple;
const set=(id:string,d:Vector3Tuple):AnimationAction[]=>[{type:'move',target:id,to:offset(id,d),duration:0},{type:'show',target:id}];
function view(id:string,min:Vector3Tuple,max:Vector3Tuple,direction:Vector3Tuple){cameras[id]=fitInstructionalBox(min,max,direction,.76,35);return id;}
function shot(id:string,type:DirectorShotType,duration:number,camera:string,note:string,actions:AnimationAction[]=[]):DirectorShot{return{id,type,duration,camera,transition:'cut',note,actions};}
function install(id:string,host:string,staging:Vector3Tuple,duration=1.15,extra:InstallationDefinition={}):AnimationAction{
  return {type:'installPart',target:id,connection:{part:host,point:'mount'},duration,installation:{stagingOffset:staging,preInstallOffset:staging.map(v=>v*.25) as Vector3Tuple,approachDirection:staging,approachDistance:.7,estimated:true,collisionTolerance:.08,...extra}};
}
function fastener(id:string,host:string,kind:'installDowel'|'installNut'|'installBolt'|'installScrew',direction:Vector3Tuple,duration:number,extra:InstallationDefinition={},turns=kind==='installDowel'||kind==='installNut'?0:3):AnimationAction{
  const part=parts.find(p=>p.id===id)!,length=part.type==='mesh'&&part.geometry.type==='screw'?part.geometry.length:0;
  const contact=kind==='installScrew'?length:kind==='installDowel'?(id.startsWith('S8')?1.5:4.5):kind==='installNut'?1.05:1.8;
  return {type:kind,target:id,connection:{part:host,point:'mount'},duration,turns,spinAxis:direction[0]?'x':direction[1]?'y':'z',installation:{approachDirection:direction,approachDistance:kind==='installScrew'?length+4:kind==='installDowel'?6:kind==='installNut'?4:7,contactDistance:contact,mechanicalPhases:true,motionTiming:actionPacing.repeatedPhases,collisionTolerance:.04,estimated:true,...extra}};
}
const steps:DirectorStep[]=[];
for(const row of rows){
  const prefix=`S${row.step}`,shots:DirectorShot[]=[];
  const context=view(`${prefix}-context`,[-123,row.bottom-12,-24],[123,row.top+17,44],[.15,.45,1.6]);
  const center=view(`${prefix}-center`,[-11,row.bottom-3,10],[11,row.top+6,42],[.2,.4,1.8]);
  const panelIds=[`B8-${row.step}--1`,`B8-${row.step}-1`],beamIds=[row.rail,...(row.step===6?['B6']:[])];
  const variantActions:AnimationAction[]=row.step===4?parts.filter(p=>p.type==='mesh'&&p.geometryVariants&&['A1','A2','A3','A4','D5'].includes(p.id)).map(p=>({type:'geometryVariant',target:p.id,variant:'receivers'})):[];
  shots.push(shot(`${prefix}-context`,'ESTABLISHING',.8,context,`Continue the cabinet: add row ${row.step-3} above the completed structure.`,variantActions));
  shots.push(shot(`${prefix}-introduce`,'INTRODUCE_PART',.9,context,'B8 ×2, B7 center tie, and the spanning rail. Keep B7 in front of the open row and the upper rail clear until the panels seat.',[...panelIds.flatMap((id,i)=>set(id,b8Staging(i===0?-1:1))),...set(`B7-${row.step}`,b7Staging),...beamIds.flatMap(id=>set(id,[0,2,16]))]));
  shots.push(shot(`${prefix}-target`,'SHOW_TARGET',.65,center,'Identify the center receiver and both row edges. The two thin B8 panels fill the open span.'));
  for(const [i,id]of panelIds.entries()){
    const side=i===0?-1:1;
    shots.push(shot(`${prefix}-${id}-seat`,'INSERT_PART',1.05,context,'Approach just inward and above the support edges, clear the rear post easing, align outward, then settle onto the lower rail. B7 and the upper rail remain clear.',[install(id,row.prior,b8Staging(side),.93,{preInstallOffset:[-side*b8Insertion.clearance,b8Insertion.clearance,b8Insertion.preInstallZ],approachDirection:[0,1,0],approachDistance:b8Insertion.clearance})]));
  }
  shots.push(shot(`${prefix}-B7-seat`,'INSERT_PART',1.25,center,'Bring B7 from its clear front staging position into the center channel, then lower onto the receiver; its upper tongue remains exposed.',[install(`B7-${row.step}`,row.prior,b7Staging,1.13,{preInstallOffset:[0,5,0],approachDirection:[0,1,0]})]));
  for(const id of beamIds)shots.push(shot(`${prefix}-${id}-seat`,'INSERT_PART',1.4,context,`${id} — align between the side frames, then lower onto the center tongue.`,[install(id,id==='B6'?'A3':'A1',[0,2,16],1.28,{preInstallOffset:[0,2,0],approachDirection:[0,1,0],allowedContacts:[id==='B6'?'A2':'A4',`B7-${row.step}`,...panelIds]})]));
  const joints=rowJoints.filter(j=>j.step===row.step);
  for(const j of joints){
    const cam=view(j.id,[j.side*116-13,j.y-7,j.z-6],[j.side*116+17,j.y+8,j.z+12],[j.side,.8,1.9]);
    shots.push(shot(`${j.id}-target`,'CONNECTION_MACRO',.35,cam,'Aligned end holes — dowel above, bolt/cam below. Insert from the outside now that the rail is seated.'));
    shots.push(shot(`${j.id}-dowel`,'INSTALL_HARDWARE',.50,cam,'#6 dowel — push through the aligned outside receiver, leaving half its length in the rail.',[fastener(`${j.id}-dowel`,j.host,'installDowel',[j.side,0,0],.44,{allowedContacts:[j.rail]})]));
    shots.push(shot(`${j.id}-cam`,'INSTALL_HARDWARE',.48,cam,'#8 cam — slot faces the outside bolt axis.',[fastener(`${j.id}-cam`,j.rail,'installNut',[0,0,1],.42)]));
    shots.push(shot(`${j.id}-start`,'INSTALL_HARDWARE',.71,cam,'#4 bolt — start the thread only; keep the joint loose until ALL bolts are started.',[fastener(`${j.id}-bolt`,j.host,'installBolt',[j.side,0,0],.65,{seatedOffset:[j.side*.5,0,0],allowedContacts:[j.rail,`${j.id}-cam`]},1.5)]));
  }
  shots.push(shot(`${prefix}-square`,'VERIFY_CONNECTION',.8,context,'ALL bolts are started. Verify alignment and squareness BEFORE the final tightening pass.'));
  for(const j of joints)shots.push(shot(`${j.id}-tighten`,'TIGHTEN_HARDWARE',.36,j.id,'Seat the engaged bolt, then lock the cam.',[
    {type:'move',target:`${j.id}-bolt`,from:offset(`${j.id}-bolt`,[j.side*.5,0,0]),to:pos(`${j.id}-bolt`),duration:.18,ease:'none'},
    {type:'rotate',target:`${j.id}-bolt`,axis:'x',space:'world',from:540,to:900,unit:'deg',duration:.18,ease:'none'},
    {type:'rotate',target:`${j.id}-cam`,axis:'z',space:'world',from:0,to:180,unit:'deg',at:.18,duration:.12,ease:'none'},
  ]));
  shots.push(shot(`${prefix}-complete`,'STEP_COMPLETE',.85,context,`Row ${row.step-3} complete — panels retained, center tie aligned, all end joints secured.`));
  steps.push({step:row.step,id:`step-0${row.step}`,title:row.step===6?'Complete the upper cabinet rails':`Install cabinet panel row ${row.step-3}`,subtitle:`PDF page ${row.step+7} · start all bolts before tightening`,pdfPage:row.step+7,parts:[...panelIds,`B7-${row.step}`,...beamIds],hardwareLabel:`#6 ×${joints.length} · #8 ×${joints.length} · #4 ×${joints.length}`,shots});
}

const bench=view('S7-bench',[-139,0,45],[139,22,124],[.12,1.8,1.15]);
const capCenter=view('S7-center',[-12,-1,64],[12,14,109],[.4,1.2,1.6]);
const capEnd=view('S7-end',[100,-1,58],[133,18,113],[1.2,1.1,1.5]);
const capLeft=view('S7-left-end',[-133,-1,58],[-100,18,113],[-1.2,1.1,1.5]);
const capShots:DirectorShot[]=[shot('S7-context','ESTABLISHING',1.1,bench,'Build the top cap separately: B1 ×2, B2 ×2, B3 ×1, B4 ×2. All parts remain supported on the work surface.',capWood.flatMap(id=>set(id,[capOffset[0]+(id==='B2-left'?-12:id==='B2-right'?12:0),capOffset[1]+(id.startsWith('B4')?12:0),capOffset[2]+(id==='B1-front'||id==='B3'?12:id==='B1-rear'?-12:0)])))];
capShots.push(shot('S7-groove-target','SHOW_TARGET',.9,capEnd,'The thin B4 panels fit inside the routed B1 channels. Leave the long rails open while arranging the panels.'));
for(const id of ['B4-left','B4-right'])capShots.push(shot(`${id}-seat`,'INSERT_PART',1.35,bench,'Lower B4 into the open layout; the rails are still spread apart, so no panel crosses a groove lip.',[install(id,'B1-rear',[0,12,0],1.23,{seatedOffset:capOffset,allowStagedTarget:true})]));
for(const id of ['B2-left','B3','B2-right']){
  const direction:Vector3Tuple=id==='B3'?[0,0,12]:[id==='B2-left'?-12:12,0,0];
  capShots.push(shot(`${id}-align`,'ALIGN_CONNECTION',1.25,id==='B3'?capCenter:id==='B2-left'?capLeft:capEnd,`${id.startsWith('B2')?'B2 end tie':'B3 center tie'} — fit into the clear notch between the two B4 panels.`,[install(id,'B4-left',direction,1.13,{seatedOffset:capOffset,allowStagedTarget:true})]));
}
for(const id of ['B1-rear','B1-front'])capShots.push(shot(`${id}-close`,'INSERT_PART',1.35,bench,'Close B1 along the panel edges; the B4 edges enter the routed channel without passing through the rail.',[install(id,'B2-left',[0,0,id==='B1-front'?12:-12],1.23,{seatedOffset:capOffset,allowedContacts:['B4-left','B4-right','B2-right','B3']})]));
for(const [i,id]of capScrewIds.entries()){
  const p=offset(id,capOffset),side=p[2]>85?1:-1;
  const camera=view(`${id}-macro`,[p[0]-12,-1,p[2]-18],[p[0]+12,12,p[2]+18],[.5,1.2,side*1.8]);
  const d=i===0?1.3:i===1?1:.65;
  capShots.push(shot(`${id}-install`,'INSTALL_HARDWARE',d+.08,camera,`#13 screw ${i+1}/6 — EDGE axis into B2/B3, not downward through the cap.`,[fastener(id,side>0?'B1-front':'B1-rear','installScrew',[0,0,side],d,{seatedOffset:capOffset,allowedContacts:[i%3===0?'B2-left':i%3===1?'B3':'B2-right'],motionTiming:i===0?actionPacing.firstPhases:actionPacing.repeatedPhases})]));
}
capShots.push(shot('S7-complete','STEP_COMPLETE',1,bench,'Complete top cap: two rails, two end ties, one center tie, two infills and all six edge screws.'));
steps.push({step:7,id:'step-07',title:'Build the complete top cap',subtitle:'PDF page 14 · separate subassembly',pdfPage:14,parts:capWood,hardwareLabel:'#13 ×6',shots:capShots});

const topWide=view('S8-wide',[-128,0,-28],[128,264,110],[.22,.9,1.5]);
const topContext=view('S8-top',[-126,213,-25],[126,267,25],[.35,1.4,1.5]);
const carry=(from:Vector3Tuple,to:Vector3Tuple,duration:number):AnimationAction[]=>capMembers.map(id=>({type:'move',target:id,from:offset(id,from),to:offset(id,to),duration,ease:'power2.inOut'}));
const topShots:DirectorShot[]=[shot('S8-context','ESTABLISHING',.9,topWide,'The completed top cap and cabinet are separate assemblies. Lift the cap clear before moving it over the cabinet.')];
topShots.push(shot('S8-cap-lift','STAGE_PART',1.45,topWide,'Lift the COMPLETE top cap, including all six installed screws, above the cabinet.',carry(capOffset,[0,34,85],1.33)));
topShots.push(shot('S8-cap-above','ALIGN_CONNECTION',1.25,topWide,'Translate the cap over the cabinet only after its underside clears the highest installed part.',carry([0,34,85],[0,34,0],1.13)));
topShots.push(shot('S8-four-targets','SHOW_TARGET',.85,topContext,'Identify all FOUR vertical dowel receiver pairs before lowering.'));
for(const [i,d]of topDowels.entries()){
  const p=pos(d.id),cam=view(`${d.id}-macro`,[p[0]-10,217,p[2]-10],[p[0]+10,242,p[2]+10],[d.side*.8,1,1.7]);
  topShots.push(shot(`${d.id}-insert`,'INSTALL_HARDWARE',.82,cam,`#6 top dowel ${i+1}/4 — insert halfway, leaving the upper half for the cap.`,[fastener(d.id,d.host,'installDowel',[0,1,0],.76)]));
}
topShots.push(shot('S8-lower-align','ALIGN_CONNECTION',1.2,topContext,'Lower to the exposed dowel tips; stop with all four cap holes aligned.',carry([0,34,0],[0,2,0],1.08)));
topShots.push(shot('S8-cap-seat','INSERT_PART',1.15,topContext,'Controlled final lowering: four dowels enter their holes and the perimeter seats flush.',carry([0,2,0],[0,0,0],1.03)));
for(const [i,s]of topScrews.entries()){
  const cam=view(`${s.id}-macro`,[s.x-11,219,s.z-9],[s.x+11,240,s.z+9],[.45,1.5,1.3]),d=i===0?1.3:i===1?1:.65;
  topShots.push(shot(`${s.id}-install`,'INSTALL_HARDWARE',d+.06,cam,`#12 top screw ${i+1}/10 — drive DOWN through the seated cap into ${s.z>0?'B5':'B6'}.`,[fastener(s.id,s.host,'installScrew',[0,1,0],d,{allowedContacts:[s.z>0?'B5':'B6']})]));
}
topShots.push(shot('S8-complete','STEP_COMPLETE',1,topContext,'Top cap seated and fastened: four dowels, ten downward screws.'));
steps.push({step:8,id:'step-08',title:'Mount the complete top cap',subtitle:'PDF page 14 · four dowels, ten screws',pdfPage:14,parts:capWood,hardwareLabel:'#6 ×4 · #12 ×10',shots:topShots});

const full=view('S10-result',[-125,-2,-25],[125,234,28],[.22,.55,-1.6]);
for(const m of mechanisms){
  const shots:DirectorShot[]=[],prefix=`S${m.step}`,x=m.side*116.35;
  // Camera stays in the open interior, looking towards the inside side face.
  const interior=view(`${prefix}-interior`,[x-2,53,-18],[x+2,121,21],[-m.side*1.8,.5,-1]);
  const topCorner=view(`${prefix}-bracket`,[x-9,205,8],[x+2,222,25],[-m.side*1.8,.8,-1.3]);
  // Stay below the installed top cap: an above-cabinet angle hides this joint.
  cameras[topCorner]={position:[m.side*95,212,-5],target:[m.side*116.4,214,15.3],fov:35};
  const sideResult=view(`${prefix}-side-result`,[x-4,53,-19],[x+2,223,21],[-m.side*1.8,.35,-1.2]);
  const resultPreset=cameras[sideResult],forward=new THREE.Vector3(...resultPreset.position).sub(new THREE.Vector3(...resultPreset.target)).normalize();
  const shift=new THREE.Vector3(0,1,0).cross(forward).normalize().multiplyScalar(-65);
  resultPreset.position=new THREE.Vector3(...resultPreset.position).add(shift).toArray() as Vector3Tuple;
  resultPreset.target=new THREE.Vector3(...resultPreset.target).add(shift).toArray() as Vector3Tuple;
  shots.push(shot(`${prefix}-context`,'ESTABLISHING',1,interior,`${m.id} = ${m.label}. Mount it on the INNER lower side face, with the curved receiver facing the opening.`,[{type:'geometryVariant',target:m.host,variant:'receivers'}]));
  shots.push(shot(`${prefix}-introduce`,'INTRODUCE_PART',.9,interior,'Separate metal L-link: show its tall arm, lower arm, curved receiver and ten mounting holes.',set(m.id,[-m.side*12,0,0])));
  shots.push(shot(`${prefix}-target`,'SHOW_TARGET',.7,interior,'Match the metal holes with the side-panel pilots before closing the gap.'));
  shots.push(shot(`${prefix}-seat-link`,'INSERT_PART',1.32,interior,'Approach perpendicular to the inner face; align and seat the plate flush.',[install(m.id,m.host,[-m.side*12,0,0],1.2)]));
  for(const [i,s]of mechanismScrews.filter(s=>s.host===m.id).entries()){
    const p=s.position,cam=view(`${s.id}-macro`,[x-(m.side>0?14:4),p[1]-7,p[2]-7],[x+(m.side<0?14:4),p[1]+7,p[2]+7],[-m.side*1.8,.7,-1]);
    const d=m.step===9&&i===0?1.3:i===0?.95:.65;
    shots.push(shot(`${s.id}-install`,'INSTALL_HARDWARE',d+.06,cam,`#21 screw ${i+1}/10 — align, engage, rotate/feed and seat through ${m.id} into the side panel.`,[fastener(s.id,m.id,'installScrew',[-m.side,0,0],d,{allowedContacts:[m.host]})]));
  }
  if(m.step===10){
    const center=view('S10-center',[-14,0,-5],[14,226,18],[.1,.08,-1.8]);
    shots.push(shot('S10-E5-introduce','INTRODUCE_PART',1,center,'E5 is the CENTER stile — D8 remains PDF-left; D9 remains PDF-right.',set('E5',[0,0,-14])));
    shots.push(shot('S10-E5-seat','INSERT_PART',1.35,center,'Align E5 vertically on the cabinet center line, then seat it over the center connectors.',[install('E5','E4',[0,0,-14],1.23,{allowedContacts:['B7-4','B7-5','B7-6','E3','D5','D4-1','D4-2','B5']})]));
    const bottom=view('S10-E5-bottom',[-8,-1,-3],[8,42,19],[.25,.3,-1.8]);
    shots.push(shot('S10-E5-dimension','SHOW_TARGET',.85,bottom,'PDF 284 mm reference: lower rail to the second-lowest #24 pilot. Remaining centers are proportionally reconstructed.'));
    for(const i of [...centerScrewY.keys()].reverse()){
      const y=centerScrewY[i],cam=view(`S10-H24-${i}-macro`,[-7,y-6,-3],[7,y+6,19],[.2,i===8?.1:.65,-1.7]),d=i===8?1.3:.65;
      // The first E5 hole lies behind the already-installed B6 top rail.
      // Put the camera INSIDE the open cabinet, below the cap, not through B6.
      if(i===8)cameras[cam]={position:[6,223,-10],target:[0,222,15.3],fov:35};
      const host=i===0?'E3':i===1?'E4':i===2?'D5':i===3?'B7-4':i===4?'D4-1':i===5?'B7-5':i===6?'D4-2':i===7?'B7-6':'B5';
      shots.push(shot(`S10-H24-${i}-install`,'INSTALL_HARDWARE',d+.06,cam,`#24 screw ${9-i}/9 — top-to-bottom installation through E5 into the center structure.`,[fastener(`S10-H24-${i}`,'E5','installScrew',[0,0,-1],d,{allowedContacts:[host]})]));
    }
  }
  const bracket=`${prefix}-H25`,wing=`${bracket}-bend`;
  shots.push(shot(`${prefix}-bracket-target`,'SHOW_TARGET',.65,topCorner,'#25 angle metal: drilled face mounts to the upper inside post; its return flange meets the back panel.',[{type:'geometryVariant',target:m.bracketHost,variant:'bracketReceivers'}]));
  shots.push(shot(`${prefix}-bracket-seat`,'INSERT_PART',1.22,topCorner,'Seat the ONE bent bracket; both surfaces move rigidly together.',[install(bracket,m.bracketHost,[-m.side*9,0,0],1.1),install(wing,bracket,[-m.side*9,0,0],1.1,{allowStagedTarget:true})]));
  for(const i of [0,1])shots.push(shot(`${prefix}-H14-${i}-install`,'INSTALL_HARDWARE',.82,topCorner,`#14 screw ${i+1}/2 — fasten the bracket’s drilled face to the upper inside post.`,[fastener(`${prefix}-H14-${i}`,bracket,'installScrew',[-m.side,0,0],.76,{allowedContacts:[m.bracketHost]})]));
  if(m.step===10){shots.push(shot('S10-verify-left','VERIFY_CONNECTION',.7,interior,'D8 secured on PDF-left: verify the lower receiver and all ten mounting screws.'));shots.push(shot('S10-verify-right','VERIFY_CONNECTION',.7,'S9-interior','D9 remains secured on PDF-right: verify the mirrored receiver before the final cabinet overview.'));}
  shots.push(shot(`${prefix}-complete`,'STEP_COMPLETE',m.step===10?1.5:.95,m.step===10?full:sideResult,m.step===10?'Step 10 complete — D8 PDF-left, D9 PDF-right, E5 center; both brackets and all specified screws installed. STOP before Step 11.':'D9 and the first #25 bracket secured on PDF-right. The opposite side remains available for Step 10.'));
  steps.push({step:m.step,id:`step-${String(m.step).padStart(2,'0')}`,title:m.step===9?'Install PDF-right mechanism D9':'Install PDF-left D8 and center stile E5',subtitle:`PDF page ${m.step+6} · explicit handedness`,pdfPage:m.step+6,parts:[m.id,...(m.step===10?['E5']:[]),bracket],hardwareLabel:m.step===9?'#21 ×10 · #14 ×2 · #25 ×1':'#21 ×10 · #24 ×9 · #14 ×2 · #25 ×1',shots});
}

export const steps01To10Plan:DirectorPlan={...approvedPrefix,id:'wf311613-steps01-10-paced',steps:[...approvedPrefix.steps,...steps]};
export const steps01To10Assembly=DirectorPlanCompiler.assembly(steps01To10Plan);
let cursor=0;
export const steps01To10Video:VideoDefinition={...approvedVideo,id:steps01To10Plan.id,title:'WF311613 · Steps 1–10 paced director review',cameraPresets:cameras,scenes:DirectorPlanCompiler.scenes(steps01To10Plan).map(s=>({...s,partIntro:undefined})),reviewCaptions:steps01To10Plan.steps.flatMap(step=>step.shots.map(s=>{const start=cursor;cursor+=s.duration;return{start,end:cursor,title:s.type.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase()),note:s.note??''};}))};
