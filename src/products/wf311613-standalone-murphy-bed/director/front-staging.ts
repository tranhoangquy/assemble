import type {AnimationAction, PivotPoseAction} from '@/types/assembly';
import type {DirectorPlan} from '@/types/director';
import type {Vector3Tuple} from '@/types/product';
import {mechanism, sideIds} from '../product/parts-step21-31';

/** Presentation-space placement, not product geometry or a connection edit.
 * The EMPTY rigid-bed root is placed before the first bed-face parts appear.
 * Steps 11–24 therefore genuinely build in this front work area; a completed
 * assembly is never teleported or transported invisibly under a camera cut. */
// The full Step 12/14 C6 staging sweep (not only the completed flat bed)
// needs this extra 45 cm ahead of D5. Product-local paths stay unchanged.
export const frontWorkPlacement:Vector3Tuple=[0,0,-460];
export const frontWorkPivot:Vector3Tuple=mechanism.sourcePivot.map((v,i)=>v+frontWorkPlacement[i]) as Vector3Tuple;
export const frontStagingRoute:PivotPoseAction['from'][]=[
  {pivot:frontWorkPivot,angle:0},
  {pivot:[0,85,frontWorkPivot[2]],angle:70},
  {pivot:[0,47,-9.2],angle:70},
  {pivot:[...mechanism.cabinetPivot],angle:70},
];

const translate=(p:Vector3Tuple)=>p.map((v,i)=>v+frontWorkPlacement[i]) as Vector3Tuple;
const pistonRoots=new Set([-1,1].map(side=>sideIds(side).piston));

/** Makes a new plan; the accepted fullPlan and its nested data stay immutable.
 * Product-local installation normals/offsets, hardware and all locked timings
 * are retained. E2 roots are intentionally not reparented: their pre-link
 * GLOBAL staging and seated destinations receive the same workspace shift. */
export function applyFrontStaging(baseline:DirectorPlan):DirectorPlan {
  const plan=structuredClone(baseline);
  plan.id=`${baseline.id}-front-stage-polish-01`;
  const step11=plan.steps.find(step=>step.step===11);
  if(!step11?.shots.length)throw new Error('Front staging requires the existing PDF Step 11');
  step11.shots[0].actions.unshift({type:'move',target:'bed-motion-root',to:[...frontWorkPlacement],duration:0});
  step11.shots[0].note='The cabinet is complete. Begin the separate bed-face subassembly in the supported FRONT work area; the empty bed root was positioned before any of its parts became visible.';
  for(const step of plan.steps.filter(step=>step.step>=21&&step.step<=24))for(const shot of step.shots){
    shot.actions=shot.actions.map((action):AnimationAction=>{
      if(!('target'in action)||!pistonRoots.has(action.target))return action;
      if(action.type==='move')return {...action,...(action.from?{from:translate(action.from)}:{}),to:translate(action.to)};
      if(action.type==='installPart')return {...action,installation:{...action.installation,seatedOffset:translate(action.installation?.seatedOffset??[0,0,0])}};
      return action;
    });
  }
  const step25=plan.steps.find(step=>step.step===25);
  if(!step25)throw new Error('Front staging requires the existing PDF Step 25');
  step25.shots=step25.shots.filter(shot=>!/^S25-route-[0-3]$/.test(shot.id));
  const notes=[
    '4 people required — the complete bed has been built in this FRONT work area. Lift and orient under continuous support; keep both free E2 ends controlled upright.',
    'Short supported approach from the open front BELOW the retained mounting web. Align both bearings above their two open cabinet cradles.',
    'Lower BOTH bearing centers together onto the unchanged shared pivot axis. Continue support until both #18 retainers are fitted.',
  ];
  for(let i=0;i<3;i++){
    const shot=step25.shots.find(shot=>shot.id===`S25-route-${i+4}`);
    if(!shot)throw new Error(`Missing baseline Step 25 route ${i+4}`);
    const pose=shot.actions.find(action=>action.type==='pivotPose');
    if(!pose||pose.type!=='pivotPose')throw new Error(`Missing Step 25 pivot action ${i+4}`);
    pose.from=structuredClone(frontStagingRoute[i]);
    pose.to=structuredClone(frontStagingRoute[i+1]);
    shot.type=i===0?'STAGE_PART':i===1?'ALIGN_CONNECTION':'INSERT_PART';
    shot.note=notes[i];
  }
  const context=step25.shots.find(shot=>shot.id==='S25-context');
  if(context)context.note='Cabinet at rear + complete bed DIRECTLY IN FRONT, built in the same supported workspace since PDF Step 11. These two assemblies are about to join; four-person support required.';
  return plan;
}
