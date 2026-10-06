/** TWO presentation deltas only: five-second prefix + one camera definition.
 * Baseline product, AssemblyDefinition, DirectorPlan and all scene/action data
 * are referenced, not regenerated. */
import type {VideoDefinition,VideoScene,CameraPreset} from '@/types/video';
import type {ExplodedIntroDefinition} from '@/presentation/intro/definition';
import type {RenderCheckpoint} from '@/types/product-package';
import {fullProduct,sideIds} from '../product/parts-step21-31';
import {polish02Plan,polish02Assembly,polish02bVideo,polish02bCheckpoints} from './polish-pass02b';
import {polishRuntime,polishShotTime} from './polish-pass01';
export {polish02Plan,polish02Assembly};
export const microId='wf311613-final-micro-pass';
// Open rear/interior three-quarter access: both the free eye and stud stay in
// frame. This does not rely on near-vertical OrbitControls clamping.
export const step26Camera:CameraPreset={position:[-114.3,116,17],target:[-115.3,111,7],fov:62};
const ids=(test:(id:string)=>boolean)=>fullProduct.parts.filter(p=>p.type==='mesh'&&test(p.id)).map(p=>p.id);
const mechanismIds=(side:number)=>{const s=sideIds(side);return [s.e1,s.bearing,s.piston];};
const left=['A1','A3','A5','A7','A8','A9','D8',...mechanismIds(-1)];
const right=['A2','A4','A6','A7-R','A8-R','A9-R','D9',...mechanismIds(1)];
const major=new Set([...mechanismIds(-1),...mechanismIds(1)]);
export const microIntro:ExplodedIntroDefinition={
  duration:5,heroDuration:1.25,separationDuration:2.5,holdDuration:.875,transitionDuration:.375,
  assembledTime:polish02bCheckpoints[0].time,explodedEnvironmentTime:polishRuntime-.001,
  heroCamera:'residential-closed',explodedCamera:'micro-exploded-overview',
  groups:[
    {id:'cabinet-left-with-mechanism',targets:left,worldOffset:[-36,0,0]},
    {id:'cabinet-right-with-mechanism',targets:right,worldOffset:[36,0,0]},
    {id:'complete-top-cap',targets:ids(id=>/^B[1-4](?:-|$)/.test(id)),worldOffset:[0,34,0]},
    {id:'cabinet-back-face',targets:ids(id=>/^B[578]-/.test(id)||['B5','B6'].includes(id)||id.startsWith('D4-')),worldOffset:[0,0,-20]},
    {id:'cabinet-cross-members-and-center-bracket',targets:['E3','B9','D5','E4','E5'],worldOffset:[0,0,-35]},
    {id:'bed-carrier-perimeter',targets:['C8-left','C8-right','C9','D1'],worldOffset:[0,0,-55]},
    {id:'mattress-support-slats',targets:ids(id=>/^D2-/.test(id)),worldOffset:[0,0,-78]},
    // Captured rebate panels stay with their actual face-grid subassembly;
    // pulling them normal to a captive groove would cross its retaining lip.
    {id:'complete-bed-face-grid',targets:ids(id=>/^C[1-6](?:-|$)/.test(id)),worldOffset:[0,0,-105]},
    {id:'underside-cross-ties',targets:ids(id=>/^C7-/.test(id)),worldOffset:[0,0,-165]},
    {id:'folded-leg-left',targets:['leg--1'],worldOffset:[-16,0,-190]},
    {id:'folded-leg-right',targets:['leg-1'],worldOffset:[16,0,-190]},
  ],
  // No props are registered here. Tiny fasteners hidden only during overview;
  // their first-occurrence assembly demonstrations remain wholly unchanged.
  hiddenTargets:fullProduct.parts.filter(p=>p.category==='hardware'&&!major.has(p.id)&&!p.parent?.startsWith('E2-')).map(p=>p.id),
};
const prefix:VideoScene[]=[
  {id:'micro-intro-finished',title:'',phase:'intro',duration:1.25,camera:'residential-closed',actions:[]},
  {id:'micro-intro-explode',title:'',phase:'intro',duration:2.5,camera:'micro-exploded-overview',actions:[]},
  {id:'micro-intro-hold',title:'',phase:'intro',duration:.875,camera:'micro-exploded-overview',actions:[]},
  {id:'micro-intro-cut',title:'',phase:'intro',duration:.375,actions:[]},
];
export const microVideo:VideoDefinition={...polish02bVideo,id:microId,title:'Standalone Murphy Bed · Intro + Step 26 camera QA',intro:microIntro,
  cameraPresets:{...polish02bVideo.cameraPresets,'S26-cabinet-eye':step26Camera,
    'micro-exploded-overview':{position:[-340,235,-400],target:[0,126,-60],fov:42}},
  scenes:[...prefix,...polish02bVideo.scenes],
  reviewCaptions:polish02bVideo.reviewCaptions,
};
export const microCheckpoints:RenderCheckpoint[]=[
  {name:'01-intro-finished.png',time:0},
  {name:'02-exploded-50-percent.png',time:2.5},
  {name:'03-fully-exploded.png',time:3.75},
  {name:'04-exploded-hold.png',time:4.125},
  {name:'05-before-step1-transition.png',time:4.625-1/30},
  {name:'06-step1-reset.png',time:5},
  {name:'08-step26-alignment.png',time:5+polishShotTime('S26-target',.7)},
  {name:'09-step26-active-connection.png',time:5+390.1666666666667},
  {name:'10-step26-secured.png',time:5+polishShotTime('S26-verify',.8)},
];
