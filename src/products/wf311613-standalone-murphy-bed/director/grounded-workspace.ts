/** Presentation poses only. No dimensions, topology, apertures or timings are
 * edited. Installed PDF timber is the floor contact; underside access uses a
 * supported, edge-held pose rather than an invented stand. */
import type {AnimationAction, PivotPoseAction} from '@/types/assembly';
import type {DirectorPlan} from '@/types/director';
import type {Vector3Tuple} from '@/types/product';
import {carrierMembers} from '../product/parts-step11-20';
import {mechanism,sideIds} from '../product/parts-step21-31';

// Moving only 25 units forward clears the cabinet's bottom rear rail during
// the existing axial panel insertion after lowering the work plane to floor.
// The bed remains immediately in front; no historical transport leg returns.
export const groundedPlacement:Vector3Tuple=[0,-36,-485];
export const groundedCompletedPivot:Vector3Tuple=[0,12,-145];
const corner:Vector3Tuple=[116,36,362];
const axis:Vector3Tuple=[Math.SQRT1_2,0,-Math.SQRT1_2];
const accessAngle=70; // Exposes underside joints to the unchanged neutral rig.
const hold=(fromAngle:number,toAngle:number,fromY:number,toY:number,duration:number):PivotPoseAction=>({
  type:'pivotPose',target:'bed-motion-root',axis,localPivot:corner,
  from:{pivot:[corner[0],fromY,corner[2]+groundedPlacement[2]],angle:fromAngle},
  to:{pivot:[corner[0],toY,corner[2]+groundedPlacement[2]],angle:toAngle},duration,ease:'power2.inOut',
});
const carriers=new Set(carrierMembers);
const pistons=new Set([-1,1].map(side=>sideIds(side).piston));
const y=(p:Vector3Tuple,amount:number):Vector3Tuple=>[p[0],p[1]+amount,p[2]];

export function groundWorkspace(baseline:DirectorPlan):DirectorPlan {
  const plan=structuredClone(baseline);
  for(const step of plan.steps)for(const shot of step.shots){
    if(shot.id==='S11-context'){
      const action=shot.actions.find(a=>a.type==='move'&&a.target==='bed-motion-root');
      if(action?.type!=='move')throw new Error('Missing empty-root placement');
      action.to=[...groundedPlacement];
    }
    if(shot.id==='S13-context')shot.actions.push(hold(0,accessAngle,0,0,.6));
    if(shot.id==='S13-complete')shot.actions.push(hold(accessAngle,0,0,3,.60));
    // The independently assembled carrier is six units lower than its joined
    // pose, so its existing lower rail face also rests on the same floor.
    if(step.step===16)shot.actions=shot.actions.map((action):AnimationAction=>{
      if(!('target'in action)||!carriers.has(action.target))return action;
      if(action.type==='move')return {...action,...(action.from?{from:y(action.from,-6)}:{}),to:y(action.to,-6)};
      if('installation'in action)return {...action,installation:{...action.installation,seatedOffset:y(action.installation?.seatedOffset??[0,0,0],-6)}};
      return action;
    });
    if(shot.id==='S17-lift')for(const action of shot.actions)if(action.type==='move'&&action.from)action.from=y(action.from,-6);
    // Tilt only AFTER the carrier is lifted clear. The contact corner belongs
    // to the PDF face frame. All mating normals remain product-local.
    if(shot.id==='S17-target')shot.actions.push(hold(0,accessAngle,3,0,.65));
    if(shot.id==='S17-complete')shot.actions.push(hold(accessAngle,0,0,3,.9));
    if(step.step>=21&&step.step<=24)shot.actions=shot.actions.map((action):AnimationAction=>{
      if(!('target'in action)||!pistons.has(action.target))return action;
      const shifted=(p:Vector3Tuple):Vector3Tuple=>[p[0],p[1]-33,p[2]-25];
      if(action.type==='move')return {...action,...(action.from?{from:shifted(action.from)}:{}),to:shifted(action.to)};
      if(action.type==='installPart')return {...action,installation:{...action.installation,seatedOffset:shifted(action.installation?.seatedOffset??[0,0,0])}};
      return action;
    });
    // Still exactly the approved three-segment front route. Only the lift's
    // starting height follows the now-grounded construction pose; its upper
    // endpoint, short approach, bearing alignment and seating are unchanged.
    if(shot.id==='S25-route-4')for(const action of shot.actions)if(action.type==='pivotPose')action.from={pivot:[...groundedCompletedPivot],angle:0};
  }
  // Guard against accidentally changing the approved receiver endpoint.
  const last=plan.steps.find(s=>s.step===25)!.shots.find(s=>s.id==='S25-route-6')!.actions.find(a=>a.type==='pivotPose');
  if(last?.type!=='pivotPose'||JSON.stringify(last.to.pivot)!==JSON.stringify(mechanism.cabinetPivot))throw new Error('Receiver endpoint changed');
  return plan;
}
