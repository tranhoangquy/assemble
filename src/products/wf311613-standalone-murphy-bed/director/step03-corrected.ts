import {parts,joints,frameRails} from '../product/parts-step03';
import {standingPose} from '../assembly/installationPaths';
import type {AnimationAction} from '@/types/assembly';
import type {DirectorPlan,DirectorShot,DirectorShotType} from '@/types/director';
import type {Vector3Tuple} from '@/types/product';
import type {VideoDefinition} from '@/types/video';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {fitInstructionalBox} from '@/engine/camera/InstructionalFraming';
import {step01PacedProduct} from './step01-paced';
import {step02PacedPlan,step02PacedVideo,mirroredSideParts} from './step02-paced';

export {step03Motion} from '../product/parts-step03';
export {standingPose} from '../assembly/installationPaths';
const cameras:VideoDefinition['cameraPresets']={...step02PacedVideo.cameraPresets,
  'S3-context':fitInstructionalBox([-123,0,-26],[161,229,26],[0,0.6,1.5],0.77,32),
  'S3-frame':fitInstructionalBox([-122,0,-27],[156,80,29],[0.22,0.9,1.5],0.76,32),
  'S3-center':fitInstructionalBox([-12,0,10],[25,79,28],[0.28,0.8,1.6],0.76,35),
  'S3-result':fitInstructionalBox([-123,-3,-26],[123,95,26],[0,0.8,1.5],0.74,32),
  'S3-close-side':fitInstructionalBox([96,0,-27],[160,69,29],[1,0.6,1.9],0.76,35),
};
for(const j of joints){
  cameras[j.id]=fitInstructionalBox([j.side*116-15,j.rail.y-6,j.rail.z-6],[j.side*116+15,j.rail.y+10,j.rail.z+18],[j.side,0.85,1.9],0.76,35);
  cameras[`${j.id}-staged`]=fitInstructionalBox([j.side*116.5+14-12,j.rail.y-6,j.rail.z-5],[j.side*116.5+14+12,j.rail.y+11,j.rail.z+12],[j.side,1.1,1.7],0.76,35);
}
const shots:DirectorShot[]=[];
function add(id:string,type:DirectorShotType,duration:number,camera:string,note:string,actions:AnimationAction[]=[]){shots.push({id,type,duration,camera,transition:'cut',note,actions});}
const positionOf=(id:string)=>parts.find(p=>p.id===id)!.position;
const stage=(id:string,offset:Vector3Tuple):AnimationAction[]=>[{type:'move',target:id,to:positionOf(id).map((v,i)=>v+offset[i]) as Vector3Tuple,duration:0},{type:'show',target:id}];
const sideSetup=[...step01PacedProduct.parts.flatMap(p=>{const pose=standingPose(p,false);return [{type:'move' as const,target:p.id,to:pose.position,duration:0},{type:'rotate' as const,target:p.id,to:pose.rotation,unit:'deg' as const,duration:0}];}),...mirroredSideParts.flatMap(p=>{const pose=standingPose(p,true,36);return [{type:'move' as const,target:p.id,to:pose.position,duration:0},{type:'rotate' as const,target:p.id,to:pose.rotation,unit:'deg' as const,duration:0}];})];
add('S3-supported-sides','ESTABLISHING',2,'S3-context','Both finished sides are supported upright. Keep the second side outboard until all rail-end dowels are aligned.',sideSetup);
add('S3-introduce-lower-frame','INTRODUCE_PART',1.8,'S3-frame','E3 and B9 remain supported in the open gap; introduce E4 and D5 before mating the frame to the sides.',[...stage('E3',[14,0,0]),...stage('B9',[14,0,0]),...stage('E4',[14,10,0]),...stage('D5',[14,16,0])]);
add('S3-center-target','SHOW_TARGET',1.2,'S3-center','Align the E4 bottom tongue with the center receiver in E3; D5 remains raised.');
add('S3-seat-E4','INSERT_PART',2,'S3-center','Lower E4 into E3 without trapping its upper tongue.',[{type:'installPart',target:'E4',connection:{part:'E3',point:'mount'},duration:1.7,installation:{seatedOffset:[14,0,0],stagingOffset:[0,10,0],preInstallOffset:[0,4,0],approachDirection:[0,1,0],approachDistance:1.1,allowStagedTarget:true,collisionTolerance:0.08,estimated:true}}]);
add('S3-seat-D5-on-E4','ALIGN_CONNECTION',1.8,'S3-center','Lower D5 onto the E4 upper tongue while the lower frame is still supported clear of both cabinet sides.',[{type:'move',target:'D5',from:[14,71,18],to:[14,55,18],duration:1.5}]);
for(const [i,j]of joints.entries())add(`${j.id}-dowel-insert`,'INSTALL_HARDWARE',i?1.05:1.8,`${j.id}-staged`, `#6 dowel ${i+1}/6 — insert halfway into ${j.rail.id}; keep the other half exposed along the cabinet-width axis.`,[{type:'installDowel',target:`${j.id}-dowel`,connection:{part:j.rail.id,point:'mount'},duration:i?0.85:1.5,turns:0,spinAxis:'x',installation:{seatedOffset:[14,0,0],approachDirection:[j.side,0,0],approachDistance:7,mechanicalPhases:true,allowStagedTarget:true,collisionTolerance:0.04,estimated:true}}]);
add('S3-first-side-target','SHOW_TARGET',1.3,'S3-E3--1','All three exposed dowels at the first side align with its receiver holes. Translate the supported lower frame only along X.');
const frameDuration=2.8;
const attachedTranslation=(id:string):AnimationAction[]=>{
  const p=positionOf(id),xs=[14,7.7,1.2,0],times=[0,frameDuration*.42,frameDuration*.76],durations=[frameDuration*.42,frameDuration*.34,frameDuration*.24],eases=['power2.inOut','power2.inOut','power2.in'];
  return times.map((at,i)=>({type:'move',target:id,from:[p[0]+xs[i],p[1],p[2]],to:[p[0]+xs[i+1],p[1],p[2]],at,duration:durations[i],ease:eases[i]}));
};
add('S3-seat-first-side','INSERT_PART',3.2,'S3-frame','Seat the complete lower frame on the FIRST side. E4 and all six dowels move rigidly with their rails; the second side stays outboard.',[
  ...frameRails.map(r=>({type:'installPart' as const,target:r.id,connection:{part:r.z>0?'A1':'A3',point:'mount'},duration:frameDuration,installation:{stagingOffset:[14,0,0] as Vector3Tuple,preInstallOffset:[7.7,0,0] as Vector3Tuple,approachDirection:[1,0,0] as Vector3Tuple,approachDistance:1.2,allowedContacts:['E4',...joints.filter(j=>j.rail.id===r.id).map(j=>`${j.id}-dowel`)],collisionTolerance:0.08,estimated:true}})),
  ...attachedTranslation('E4'),...joints.flatMap(j=>attachedTranslation(`${j.id}-dowel`)),
]);
add('S3-second-side-alignment','ALIGN_CONNECTION',1.5,'S3-close-side','Keep the second side supported. Align its three holes with the exposed dowels before closing the gap.');
add('S3-close-second-side','INSERT_PART',3,'S3-close-side','Close the SECOND side straight along the dowel axes. The installed lower frame does not move.',mirroredSideParts.map(p=>({type:'move',target:p.id,from:standingPose(p,true,36).position,to:standingPose(p,true).position,duration:2.6,ease:'power2.inOut'})));
add('S3-start-all-warning','SHOW_TARGET',1.4,'S3-frame','START ALL SIX BOLTS FIRST — no final tightening until every #4 bolt has engaged its #8 cam.');
for(const [i,j]of joints.entries()){
  add(`${j.id}-cam-insert`,'INSTALL_HARDWARE',i?1.05:1.7,j.id,`#8 cam ${i+1}/6 — its opening faces the outside bolt axis.`,[{type:'installNut',target:`${j.id}-cam`,connection:{part:j.rail.id,point:'mount'},duration:i?0.85:1.4,turns:0,spinAxis:'z',installation:{approachDirection:[0,0,1],approachDistance:6,mechanicalPhases:true,collisionTolerance:0.04,estimated:true}}]);
  add(`${j.id}-bolt-start`,'INSTALL_HARDWARE',i?1.45:2.8,j.id,`#4 bolt ${i+1}/6 — approach, contact and turn only to START the joint; leave it loose for squaring.`,[{type:'installBolt',target:`${j.id}-bolt`,connection:{part:j.host,point:'mount'},duration:i?1.2:2.4,turns:1.5,spinAxis:'x',installation:{seatedOffset:[j.side*0.5,0,0],approachDirection:[j.side,0,0],approachDistance:9,mechanicalPhases:true,allowedContacts:[j.rail.id,`${j.id}-cam`],collisionTolerance:0.04,estimated:true}}]);
}
add('S3-square-before-tightening','VERIFY_CONNECTION',1.6,'S3-frame','All six bolts have started. Verify parallel cabinet sides and square lower-frame corners before the tightening pass.');
for(const j of joints)add(`${j.id}-final-tightening`,'TIGHTEN_HARDWARE',0.9,j.id,'Final tightening pass — turn the engaged bolt, seat its head, then lock its cam.',[
  {type:'move',target:`${j.id}-bolt`,from:positionOf(`${j.id}-bolt`).map((v,i)=>v+(i===0?j.side*.5:0)) as Vector3Tuple,to:positionOf(`${j.id}-bolt`),duration:0.45,ease:'none'},
  {type:'rotate',target:`${j.id}-bolt`,axis:'x',space:'world',from:540,to:900,unit:'deg',duration:0.45,ease:'none'},
  {type:'rotate',target:`${j.id}-cam`,axis:'z',space:'world',from:0,to:180,unit:'deg',at:0.45,duration:0.3,ease:'none'},
]);
add('S3-complete','STEP_COMPLETE',1.5,'S3-result','Step 3 complete — D5, B9, E3 and E4 joined to both sides; 6 dowels, 6 cams and 6 bolts installed.');

export const step03CorrectedPlan:DirectorPlan={...step02PacedPlan,id:'wf311613-steps01-03-corrected',steps:[...step02PacedPlan.steps,{step:3,id:'step-03',title:'Join the supported cabinet sides',subtitle:'PDF page 10 · User-approved axial mating correction',pdfPage:10,parts:['D5','B9','E3','E4'],hardwareLabel:'#6 ×6 · #8 ×6 · #4 ×6',shots}]};
export {step03CorrectedProduct} from '../product/parts-step03';
export const step03CorrectedAssembly=DirectorPlanCompiler.assembly(step03CorrectedPlan);
let cursor=0;
export const step03CorrectedVideo:VideoDefinition={...step02PacedVideo,id:step03CorrectedPlan.id,cameraPresets:cameras,scenes:DirectorPlanCompiler.scenes(step03CorrectedPlan).map(s=>({...s,partIntro:undefined})),reviewCaptions:step03CorrectedPlan.steps.flatMap(step=>step.shots.map(s=>{const start=cursor;cursor+=s.duration;return {start,end:cursor,title:s.type.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase()),note:s.note??''};}))};
