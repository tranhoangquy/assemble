import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import type {DirectorPlan} from '@/types/director';
import type {CameraPreset,VideoDefinition,VideoScene} from '@/types/video';
import type {Vector3Tuple} from '@/types/product';
import type {RenderCheckpoint} from '@/types/product-package';
import {polishPlan,polishVideo,polishRuntime,polishShotTime} from './polish-pass01';
import {groundWorkspace} from './grounded-workspace';
import workCameras from './polish02-workspace-cameras.json';
import {cleanCaptions,stepTitles} from '../presentation/captions';
import {presentationNames} from '../presentation/labels';

const cameras:Record<string,CameraPreset>=Object.fromEntries(Object.entries(workCameras.cameraPresets).map(([id,c])=>[id,{...c,position:c.position as Vector3Tuple,target:c.target as Vector3Tuple}]));
const shotCameras:Record<string,string>=workCameras.shotCameras;
const grounded=groundWorkspace(polishPlan);
export const polish02Plan:DirectorPlan={...grounded,id:'wf311613-director-polish-02',steps:grounded.steps.map(s=>({...s,shots:s.shots.map(shot=>({...shot,camera:shotCameras[shot.id]??shot.camera}))}))};
export const polish02Assembly=DirectorPlanCompiler.assembly(polish02Plan);

/** A separate video-only presentation section, NOT PDF Step 32. Every moving
 * product action is cloned from the validated post-anchor functional check.
 * Initial pose is the actual completed OPEN pose; therefore we show a real
 * controlled close first rather than jumping straight into a closed pose. */
const showCamera='finished-bedroom-hero';
const showcaseSources=['final-support-lift','final-fold-legs','final-close','final-closed','final-open','final-deploy-legs','final-lower-support','final-result'];
const last=polish02Plan.steps[30];
export const polish02Showcase:VideoScene[]=showcaseSources.map(id=>{
  const s=last.shots.find(shot=>shot.id===id)!;
  return {id:`showcase-${id}`,title:'Finished Bedroom',phase:'showcase',duration:s.duration,camera:showCamera,actions:structuredClone(s.actions)};
});
const showcase=polish02Showcase;
const bareEnd=polishRuntime+showcase.reduce((sum,s)=>sum+s.duration,0);
showcase.push({id:'showcase-mattress',title:'Finished Bedroom',phase:'showcase',duration:1.8,camera:showCamera,actions:[]},
  {id:'showcase-bedding',title:'Finished Bedroom',phase:'showcase',duration:2,camera:showCamera,actions:[]},
  {id:'showcase-hero',title:'Finished Bedroom',phase:'showcase',duration:3,camera:showCamera,actions:[]});
export const polish02ShowcaseDuration=showcase.reduce((n,s)=>n+s.duration,0);
export const polish02Runtime=polishRuntime+polish02ShowcaseDuration;
export const polish02Video:VideoDefinition={...polishVideo,id:polish02Plan.id,title:'Standalone Murphy Bed · Presentation review',
  presentationNames,quickActions:[],audio:{voiceover:null,music:null},
  cameraPresets:{...polishVideo.cameraPresets,...cameras,
    [showCamera]:{position:[-345,244,-485],target:[0,102,-57],fov:39}},
  presentation:{...polishVideo.presentation,
    // Support SEMANTICS are preserved, but no helper object is rendered.
    finishedBedroom:{start:polishRuntime,mattressStart:bareEnd,beddingStart:bareEnd+1.8,
      mattress:{center:[0,41.8,-89.2],size:[217,19,182],radius:1.6},
      rug:{center:[0,-125],size:[340,330]},bedsideTable:{center:[-166,-14],size:[40,48,38]},plant:{center:[169,-17],height:103}}},
  scenes:[...DirectorPlanCompiler.scenes(polish02Plan).map((s,i)=>({...s,title:stepTitles[i],subtitle:undefined,partIntro:undefined,callouts:undefined,step:`Step ${i+1} / 31`,completionAt:undefined,phase:'assembly' as const})),...showcase],
  reviewCaptions:[...cleanCaptions(polish02Plan),
    {start:polishRuntime,end:polishRuntime+.9,title:'Finished bedroom',note:'Presentation only'},
    {start:polishRuntime+.9,end:polish02Runtime,title:'',note:'',hidden:true}],
};
const checkpoint=(name:string,id:string,p=.8):RenderCheckpoint=>({name,time:polishShotTime(id,p)});
const showTime=(id:string,p=.8)=>{let time=polishRuntime;for(const s of showcase){if(s.id===id)return time+s.duration*p;time+=s.duration;}throw new Error(id);};
export const polish02Checkpoints:RenderCheckpoint[]=[
  checkpoint('02-after-grounded-no-helpers.png','S16-complete'),
  checkpoint('03-clean-wood-caption.png','rail-seat-0',.80),
  checkpoint('04-clean-hardware-caption.png','bolt-macro',.65),
  checkpoint('05-caption-omitted.png','S16-complete'),
  checkpoint('06-step25-front-context.png','S25-context'),
  checkpoint('07-step25-bearing-connection.png','S25--1-connection'),
  checkpoint('08-working-medium.png','S4-D4-1-seat',.85),
  checkpoint('09-assembly-complete.png','final-result'),
  {name:'10-finished-closed.png',time:showTime('showcase-final-closed')},
  {name:'11-finished-opening.png',time:showTime('showcase-final-open',.55)},
  {name:'12-finished-open-bare.png',time:showTime('showcase-final-result')},
  {name:'13-mattress-fit.png',time:showTime('showcase-mattress')},
  {name:'14-mattress-bedding.png',time:showTime('showcase-bedding')},
  {name:'15-final-hero.png',time:showTime('showcase-hero')},
  checkpoint('16-underside-support-access.png','S13-C7-0-seat'),
  checkpoint('17-frame-joining-access.png','S17-side--1--55-bolt-up'),
];
