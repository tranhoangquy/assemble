/** Director QA variant only. The accepted mechanical product/plan remains
 * available as a separate package; no product material or mesh is cloned. */
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import type {DirectorPlan} from '@/types/director';
import type {Vector3Tuple} from '@/types/product';
import type {CameraPreset, VideoDefinition} from '@/types/video';
import type {RenderCheckpoint} from '@/types/product-package';
import type {BedroomSupportDefinition} from '@/types/presentation';
import {fullPlan, fullVideo} from './steps21-31';
import {applyFrontStaging,frontWorkPlacement} from './front-staging';
import cameraOverrides from './polish-camera-overrides.json';
import presentationCameras from './polish-presentation-cameras.json';

const tuple=(values:number[]):Vector3Tuple=>{
  if(values.length!==3||!values.every(Number.isFinite))throw new Error('Invalid serialised polish camera');
  return [values[0],values[1],values[2]];
};
const auditedCameras:Record<string,CameraPreset>=Object.fromEntries(Object.entries({...cameraOverrides.cameraPresets,...presentationCameras.cameraPresets}).map(([id,camera])=>[
  id,{position:tuple(camera.position),target:tuple(camera.target),fov:camera.fov,
    ...('allowUnderside'in camera?{allowUnderside:Boolean(camera.allowUnderside)}:{})},
]));

const staged=applyFrontStaging(fullPlan);
const shotCameras:Record<string,string>={...cameraOverrides.shotCameras,...presentationCameras.shotCameras};
export const polishPlan:DirectorPlan={...staged,id:'wf311613-director-polish-01',steps:staged.steps.map(step=>({...step,
  shots:step.shots.map(shot=>({...shot,camera:shotCameras[shot.id]??shot.camera})),
}))};
export const polishAssembly=DirectorPlanCompiler.assembly(polishPlan);

const shotTimes=new Map<string,{start:number;duration:number;step:number}>();
let cursor=0;
for(const step of polishPlan.steps)for(const shot of step.shots){
  shotTimes.set(shot.id,{start:cursor,duration:shot.duration,step:step.step});cursor+=shot.duration;
}
export function polishShotTime(id:string,fraction=0){
  const shot=shotTimes.get(id);if(!shot)throw new Error(`Unknown polish shot ${id}`);
  return shot.start+shot.duration*fraction;
}

/** Tiny padded stands in the presentation layer make the EXISTING lifted work
 * convention readable. Their contact pads avoid the center/end hardware axes;
 * they are not PDF components and never enter the product part registry. */
const supports:BedroomSupportDefinition[]=[
  ...[-30,30].flatMap(x=>[161.8,358.2].map(localZ=>({id:`face-${x}-${localZ}`,position:[x,localZ+frontWorkPlacement[2]] as [number,number],
    topY:36,start:polishShotTime('S11-context'),end:polishShotTime('S25-route-4'),padSize:[4,4] as [number,number]}))),
  ...[270,330].flatMap(x=>[162.1,357.9].map(localZ=>({id:`carrier-${x}-${localZ}`,position:[x,localZ+frontWorkPlacement[2]] as [number,number],
    topY:39,start:polishShotTime('S16-context'),end:polishShotTime('S17-lift'),padSize:[4,4] as [number,number]}))),
];

let captionCursor=0;
export const polishVideo:VideoDefinition={...fullVideo,id:polishPlan.id,title:'WF311613 · Director polish 01 · QA stills',
  background:'#b9afa0',
  presentation:{background:'#b9afa0',exposure:.97,fog:{color:'#b9afa0',near:1400,far:2300},
    environment:{preset:'bedroom',floorY:0,width:1800,depth:1500,floorCenterZ:150,height:600,farWallZ:700,
      wallColor:'#e9e6de',floorColor:'#a5937b',
      installationWall:{z:22.3,start:polishShotTime('wall-position')},
      window:{position:[-490,190],size:[130,165]},supports,
    }},
  cameraPresets:{...fullVideo.cameraPresets,...auditedCameras},
  scenes:DirectorPlanCompiler.scenes(polishPlan).map(scene=>({...scene,partIntro:undefined})),
  reviewCaptions:polishPlan.steps.flatMap(step=>step.shots.map(shot=>{
    const start=captionCursor;captionCursor+=shot.duration;
    return {start,end:captionCursor,title:shot.type.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase()),
      note:(shot.note??'').replace('STOP before Step 11.','Cabinet complete; continue with separate bed assembly.')
        .replace('STOP before Step 21.','Bed complete; continue with E1 mechanism plates.')};
  })),
};

const checkpoint=(name:string,id:string,fraction=.8):RenderCheckpoint=>({name,time:polishShotTime(id,fraction)});
/** Actual playback cameras and actions only: no diagnostic camera override. */
export const polishCheckpoints:RenderCheckpoint[]=[
  checkpoint('01-early-assembly.png','rail-seat-0',.9),
  checkpoint('02-cabinet-working-medium.png','S4-D4-1-seat',.85),
  {name:'03-after-distant-224s.png',time:224},
  checkpoint('04-step25-front-staging.png','S25-context'),
  checkpoint('05-step25-supported-approach.png','S25-route-4',.60),
  checkpoint('06-step25-bearing-alignment.png','S25-route-5',.92),
  checkpoint('07-step25-seated-connection.png','S25--1-connection'),
  checkpoint('08-step28-leg-work.png','S28--1-D7-join',.78),
  checkpoint('09-step30-wall-anchoring.png','S30-0-wall-screw',.75),
  checkpoint('10-final-open-bedroom.png','final-result',.75),
  checkpoint('11-final-closed-bedroom.png','final-closed',.75),
  checkpoint('12-early-connection-macro.png','bolt-macro',.70),
  checkpoint('13-top-cap-installation.png','S8-cap-seat',.90),
  checkpoint('14-carrier-and-face.png','S16-complete',.8),
  checkpoint('15-step25-bearing-lowering.png','S25-route-6',.5),
  checkpoint('16-step25-retainer-installation.png','S25--1-retainer',.65),
  checkpoint('17-pdf-left-D8-target.png','S10-target',.80),
  checkpoint('18-pdf-right-D9-seating.png','S9-seat-link',.82),
  checkpoint('19-step25-connected-pullback.png','S25-complete',.75),
  checkpoint('20-step29-leg-pivot.png','S29-1-bolt',.75),
];

export const polishRuntime=cursor;
export const polishStepDurations=polishPlan.steps.map(step=>({step:step.step,seconds:step.shots.reduce((n,shot)=>n+shot.duration,0)}));
