import { names, mapped, point, direction } from '../product/parts-step02';
import type {AnimationAction} from '@/types/assembly';
import type {DirectorPlan, DirectorShot} from '@/types/director';
import type {Vector3Tuple} from '@/types/product';
import type {VideoDefinition} from '@/types/video';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {fitInstructionalBox} from '@/engine/camera/InstructionalFraming';
import {step01PacedPlan,step01PacedProduct,step01PacedVideo} from './step01-paced';

function actionForMirror(a:AnimationAction):AnimationAction {
  const clone=structuredClone(a);
  if('target' in clone)clone.target=mapped(clone.target);
  if(clone.type==='move')clone.to=point(clone.to);
  if('connection' in clone)clone.connection.part=mapped(clone.connection.part);
  if('installation' in clone&&clone.installation){
    const i=clone.installation;
    if(i.approachDirection)i.approachDirection=direction(i.approachDirection);
    if(i.stagingOffset)i.stagingOffset=direction(i.stagingOffset);
    if(i.preInstallOffset)i.preInstallOffset=direction(i.preInstallOffset);
    i.allowedContacts=i.allowedContacts?.map(mapped);
  }
  return clone;
}
const cameras:VideoDefinition['cameraPresets']={...step01PacedVideo.cameraPresets};
for(const [key,c]of Object.entries(step01PacedVideo.cameraPresets))cameras[`R-${key}`]={...c,position:point(c.position),target:point(c.target)};
cameras['two-side-context']=fitInstructionalBox([-398,0,-47],[118,15,47],[0.1,1.6,1.05],0.78,32);

const shots:DirectorShot[]=step01PacedPlan.steps[0].shots.filter(s=>s.id!=='dowel-target').map(s=>{
  let duration=s.duration,operationDuration:number|undefined;
  if(s.id==='context')duration=1.5;
  if(s.id==='part-introduction')duration=1.2;
  if(s.id==='panel-alignment'){duration=1.6;operationDuration=1.3;}
  if(s.id==='dowel-macro'||/^dowel-\d/.test(s.id)){duration=1.05;operationDuration=0.85;}
  if(s.id.startsWith('rail-stage'))duration=0.6;
  if(s.id.startsWith('rail-seat')){duration=1.9;operationDuration=1.6;}
  if(s.id.startsWith('joint-target'))duration=s.id.endsWith('-0')?1:0.25;
  if(s.id.startsWith('cam-install')){duration=s.id.endsWith('-0')?2.4:1;operationDuration=s.id.endsWith('-0')?2.1:0.75;}
  if(s.id==='bolt-macro'){duration=3.6;operationDuration=3.2;}
  if(s.id.startsWith('bolt-install')){duration=1.35;operationDuration=1.1;}
  if(s.id.startsWith('cam-lock')){duration=0.55;operationDuration=0.4;}
  if(s.id==='verify'||s.id==='result')duration=1.2;
  return {...s,id:`R-${s.id}`,camera:s.id==='context'?'two-side-context':`R-${s.camera}`,duration,
    note:s.id==='context'?'First side remains parked. Build the mirrored A2 / A4 / A6 side.':s.id==='result'?'Two mirrored cabinet-side assemblies complete.':s.note?.replace(/A1|A3|A5|A7|A8|A9/g,id=>names[id].replace('-R','')),
    actions:[...(s.id==='context'?step01PacedProduct.parts.map(p=>({type:'move' as const,target:p.id,to:[p.position[0]-280,p.position[1],p.position[2]] as Vector3Tuple,duration:0})):[]),...s.actions.filter(a=>a.type!=='visibility').map(a=>{
      const clone=actionForMirror(a);
      if(operationDuration!==undefined&&(clone.duration??0)>0)clone.duration=operationDuration;
      // Keep highlight cleanup within the shortened panel operation.
      if(clone.type==='unhighlight'){clone.at=1.3;clone.duration=0.25;}
      return clone;
    })]};
});
// Step 2's plan specifies starting every cam/bolt before the final lock pass.
const locks=shots.filter(s=>s.type==='TIGHTEN_HARDWARE');
const step2shots=[...shots.filter(s=>s.type!=='TIGHTEN_HARDWARE'&&s.type!=='VERIFY_CONNECTION'&&s.type!=='STEP_COMPLETE'),...locks,...shots.filter(s=>s.type==='VERIFY_CONNECTION'||s.type==='STEP_COMPLETE')];
export const step02PacedPlan:DirectorPlan={...step01PacedPlan,id:'wf311613-steps01-02-paced',steps:[step01PacedPlan.steps[0],{
  step:2,id:'step-02',title:'Build the mirrored cabinet side',subtitle:'PDF page 9 · Mirrored operation, compressed repetitions',pdfPage:9,parts:['A2','A4','A6','A7-R','A8-R','A9-R'],hardwareLabel:'#6 ×6 · #5 ×8 · #8 ×8',shots:step2shots,
}]};
export { mirroredSideParts, step02PacedProduct } from '../product/parts-step02';
export const step02PacedAssembly=DirectorPlanCompiler.assembly(step02PacedPlan);
let cursor=0;
export const step02PacedVideo:VideoDefinition={...step01PacedVideo,id:'wf311613-steps01-02-paced',cameraPresets:cameras,scenes:DirectorPlanCompiler.scenes(step02PacedPlan).map(s=>({...s,partIntro:undefined})),reviewCaptions:step02PacedPlan.steps.flatMap(step=>step.shots.map(s=>{
  const start=cursor;cursor+=s.duration;
  return {start,end:cursor,title:s.type.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase()),note:s.note??''};
}))};
