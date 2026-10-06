import { parts, cams, dowels } from '../product/parts-step01';
import type { Vector3Tuple } from '@/types/product';
import type { AnimationAction } from '@/types/assembly';
import type { DirectorPlan, DirectorShot, DirectorShotType } from '@/types/director';
import type { VideoDefinition } from '@/types/video';
import { DirectorPlanCompiler } from '@/engine/director/DirectorPlanCompiler';
import { fitInstructionalBox } from '@/engine/camera/InstructionalFraming';

const cameras: VideoDefinition['cameraPresets'] = {
  context: fitInstructionalBox([-118,0,-47],[118,8,47],[0.16,1.5,1.1],0.8,32),
  result: fitInstructionalBox([-118,0,-25],[118,5,25],[0.12,1.5,0.85],0.82,32),
  panel: fitInstructionalBox([-118,0,-25],[114,14,25],[0.13,1.5,1],0.79,32),
};
const shots: DirectorShot[] = [];
function add(id: string, type: DirectorShotType, duration: number, camera: string, note: string, actions: AnimationAction[] = []) {
  shots.push({id,type,duration,camera,transition:'cut',note,actions});
}
function staged(id: string, offset: Vector3Tuple): AnimationAction[] {
  const p = parts.find(p=>p.id===id)!.position;
  return [{type:'move',target:id,to:[p[0]+offset[0],p[1]+offset[1],p[2]+offset[2]],duration:0},{type:'show',target:id}];
}
function seat(id: string, host: string, direction: Vector3Tuple, distance: number, mates: string[], duration=2.3): AnimationAction {
  return {type:'installPart',target:id,connection:{part:host,point:'mount'},duration,installation:{stagingOffset:direction.map(v=>v*distance) as Vector3Tuple,preInstallOffset:direction.map(v=>v*distance*0.55) as Vector3Tuple,approachDirection:direction,approachDistance:distance*0.22,allowedContacts:mates,collisionTolerance:0.08,estimated:true}};
}
add('context','ESTABLISHING',3,'context','Six PDF-coded wood parts laid flat. No storage or side-bookcase geometry.',[
  {type:'visibility',targets:'all',visible:false},...staged('A5',[0,0,0]),...staged('A7',[0,0,0]),...staged('A8',[0,0,0]),...staged('A9',[0,12,0]),...staged('A1',[0,0,-22]),...staged('A3',[0,0,22]),
]);
add('part-introduction','INTRODUCE_PART',3,'panel','A5 main panel · A7 middle tie · A8 end tie · A9 thin panel.',[
  {type:'highlight',target:'A9',color:'#d6b98a',intensity:0.12,duration:0.3},
]);
add('panel-alignment','ALIGN_CONNECTION',3.2,'panel','Lower A9 between A7 and A8; keep the panel edges visible.',[seat('A9','A7',[0,1,0],12,['A8']),{type:'unhighlight',target:'A9',at:2.4,duration:0.4}]);

for (const [index,d] of dowels.entries()) {
  const key=`dowel-view-${index}`;
  cameras[key]=fitInstructionalBox([d.x-9,0,d.side<0?-33:6],[d.x+9,8,d.side<0?-6:33],[0.65,1.1,d.side*1.3],0.76,35);
  if (!index) add('dowel-target','SHOW_TARGET',1.7,key,'Locate the edge bore. The upright stays separated so the mating axis remains visible.');
  add(index===0?'dowel-macro':`dowel-${index}`,'INSTALL_HARDWARE',index===0?4:2.2,key,`#6 dowel ${index+1}/6 — push halfway into ${d.host}; leave half exposed for the upright.`,[
    {type:'installDowel',target:d.id,connection:{part:d.host,point:'mount'},duration:index===0?3.3:1.7,turns:0,spinAxis:'z',installation:{approachDirection:[0,0,d.side],approachDistance:7,preInstallOffset:[0,0,d.side*2],mechanicalPhases:true,allowedContacts:[],collisionTolerance:0.05}},
  ]);
}
for (const [index,side] of [-1,1].entries()) {
  const rail=side<0?'A1':'A3'; const key=`rail-${index}`;
  cameras[key]=fitInstructionalBox([-118,0,side<0?-48:4],[114,9,side<0?-4:48],[0.08,1.6,side*1.1],0.8,32);
  add(`rail-stage-${index}`,'STAGE_PART',1.8,key,`${rail} approaches from the ${side<0?'near':'opposite'} outside edge, parallel to the six dowel axes.`);
  add(`rail-seat-${index}`,'INSERT_PART',4,key,`Slide ${rail} straight onto its three exposed dowels; seat against A5, A7 and A8.`,[
    seat(rail,'A5',[0,0,side],22,['A7','A8','A9',...dowels.filter(d=>d.side===side).map(d=>d.id)],3.2),
  ]);
}

// Every cam/bolt gets its own joint-aware cut; no camera remains at the first fastener.
for (const [index,c] of cams.entries()) {
  const key=`joint-${index}`, side=c.side;
  cameras[key]=fitInstructionalBox([c.x-7,0,side<0?-35:9],[c.x+7,10,side<0?-9:35],[0.7,1.1,side*1.4],0.82,35);
  add(`joint-target-${index}`,'CONNECTION_MACRO',index===0?1.8:0.8,key,`${c.host} ↔ ${side<0?'A1':'A3'} — top cam bore and outside bolt axis. Both members are seated.`);
  add(`cam-install-${index}`,'INSTALL_HARDWARE',index===0?2.8:1.8,key,`#8 cam ${index+1}/8 — lower into the cross-bore, with its opening facing the incoming bolt.`,[
    {type:'installNut',target:c.id,connection:{part:c.host,point:'mount'},duration:index===0?2.2:1.4,turns:0,spinAxis:'y',installation:{approachDirection:[0,1,0],approachDistance:7,mechanicalPhases:true,allowedContacts:[],collisionTolerance:0.05}},
  ]);
  add(index===0?'bolt-macro':`bolt-install-${index}`,'INSTALL_HARDWARE',index===0?4.5:3.0,key,`#5 bolt ${index+1}/8 — approach → align → contact → turn and feed → seat in #8.`,[
    {type:'installBolt',target:c.bolt,connection:{part:side<0?'A1':'A3',point:'mount'},duration:index===0?4:2.5,turns:3,spinAxis:'z',installation:{approachDirection:[0,0,side],approachDistance:11,mechanicalPhases:true,allowedContacts:[c.host,c.id],collisionTolerance:0.04}},
  ]);
  add(`cam-lock-${index}`,'TIGHTEN_HARDWARE',1.1,key,'Turn the horizontal-hole cam to lock the engaged bolt; verify the closed seam.',[
    {type:'rotate',target:c.id,axis:'y',from:0,to:180,unit:'deg',duration:0.8,ease:'none'},
  ]);
}
add('verify','VERIFY_CONNECTION',2.5,'result','All 6 dowels and all 8 cam/bolt joints installed. Both long uprights are seated.');
add('result','STEP_COMPLETE',3.5,'result','Step 1 complete — one flat cabinet-side subassembly. Stop for director review.');

export const step01V2Plan: DirectorPlan = {id:'wf311613-step01-v2',source:'Authoritative PDF page 9 and approved DirectorPlan Step 1. Appearance reference is material-only.',presentationReference:'https://www.youtube.com/watch?v=0U14ugOw5vw',steps:[{step:1,id:'step-01',title:'Build the first cabinet side',subtitle:'Standalone Murphy Bed · Step 1 V2',pdfPage:9,parts:['A1','A3','A5','A7','A8','A9'],hardwareLabel:'#6 ×6 · #5 ×8 · #8 ×8',shots}]};
export { step01V2Product } from '../product/parts-step01';
export const step01V2Assembly = DirectorPlanCompiler.assembly(step01V2Plan);
let cursor=0;
export const step01V2Captions=shots.map(s=>{const start=cursor;cursor+=s.duration;return {start,end:cursor,title:s.id==='result'?'Cabinet side complete':s.type.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase()),note:s.note??''};});
export const step01V2Video: VideoDefinition = {id:'wf311613-step01-v2',title:'WF311613 Standalone Murphy Bed — Step 1 Director V2',width:1280,height:720,fps:30,background:'#eeece7',cameraPresets:cameras,scenes:DirectorPlanCompiler.scenes(step01V2Plan).map(s=>({...s,partIntro:undefined})),reviewCaptions:step01V2Captions,audio:{voiceover:null,music:null}};
