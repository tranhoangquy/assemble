import {describe,it,expect} from 'vitest';
import {fullPlan} from '../director/steps21-31';
import {applyFrontStaging,frontWorkPlacement,frontStagingRoute} from '../director/front-staging';
import {mechanism} from '../product/parts-step21-31';
import {validateFrontStaging} from '../validation/front-staging-validation';

describe('Director polish: continuous front-work construction and short Step 25',()=>{
  it('does not mutate the accepted plan or change the PDF order / locked action durations',()=>{
    const original=JSON.stringify(fullPlan),plan=applyFrontStaging(fullPlan);
    expect(JSON.stringify(fullPlan)).toBe(original);
    expect(plan.steps.map(step=>[step.step,step.parts,step.hardwareLabel,step.pdfPage])).toEqual(fullPlan.steps.map(step=>[step.step,step.parts,step.hardwareLabel,step.pdfPage]));
    expect(plan.steps.slice(0,10)).toEqual(fullPlan.steps.slice(0,10));
    for(let i=0;i<31;i++)if(i!==24){
      expect(plan.steps[i].shots.map(shot=>[shot.id,shot.duration])).toEqual(fullPlan.steps[i].shots.map(shot=>[shot.id,shot.duration]));
      for(let j=0;j<plan.steps[i].shots.length;j++){
        const current=plan.steps[i].shots[j].actions,baseline=fullPlan.steps[i].shots[j].actions;
        expect(current.filter(action=>!('target'in action&&action.target==='bed-motion-root'&&i===10)).map(action=>[action.type,action.at,action.duration])).toEqual(baseline.map(action=>[action.type,action.at,action.duration]));
      }
    }
    expect(plan.steps.slice(25)).toEqual(fullPlan.steps.slice(25));
  });
  it('places only an empty root and removes only the now-unnecessary long transport shots',()=>{
    const plan=applyFrontStaging(fullPlan),s11=plan.steps[10],s25=plan.steps[24];
    expect(s11.shots[0].actions[0]).toEqual({type:'move',target:'bed-motion-root',to:frontWorkPlacement,duration:0});
    expect(s25.shots.some(shot=>/^S25-route-[0-3]$/.test(shot.id))).toBe(false);
    const original25=fullPlan.steps[24];
    for(const shot of s25.shots)expect(shot.duration).toBe(original25.shots.find(old=>old.id===shot.id)!.duration);
    expect(original25.shots.reduce((n,shot)=>n+shot.duration,0)).toBeCloseTo(26.5,8);
    expect(s25.shots.reduce((n,shot)=>n+shot.duration,0)).toBeCloseTo(16.9,8);
    expect(frontStagingRoute.at(-1)).toEqual({pivot:mechanism.cabinetPivot,angle:70});
    expect(s25.shots.filter(shot=>shot.id.endsWith('retainer')).map(shot=>shot.actions)).toEqual(original25.shots.filter(shot=>shot.id.endsWith('retainer')).map(shot=>shot.actions));
  });
  it('keeps free unparented E2 roots coherent before and after linkage ownership',()=>{
    const plan=applyFrontStaging(fullPlan);
    for(const n of [23,24]){
      const step=plan.steps[n-1],original=fullPlan.steps[n-1];
      const move=step.shots.find(shot=>shot.id===`S${n}-piston-intro`)!.actions[0];
      const oldMove=original.shots.find(shot=>shot.id===`S${n}-piston-intro`)!.actions[0];
      expect(move.type).toBe('move');expect(oldMove.type).toBe('move');
      if(move.type==='move'&&oldMove.type==='move')expect(move.to).toEqual(oldMove.to.map((v,i)=>v+frontWorkPlacement[i]));
      const insert=step.shots.find(shot=>shot.id===`S${n}-eye-seat`)!.actions[0];
      expect(insert.type).toBe('installPart');
      if(insert.type==='installPart')expect(insert.installation?.seatedOffset).toEqual(frontWorkPlacement);
      expect(step.shots.find(shot=>shot.id===`S${n}-retain`)!.actions).toEqual(original.shots.find(shot=>shot.id===`S${n}-retain`)!.actions);
    }
  });
  it('validates the supplied candidate path on actual meshes rather than the accepted baseline',()=>{
    const plan=applyFrontStaging(fullPlan),result=validateFrontStaging(plan);
    expect(result.planId).toBe(plan.id);
    expect(result.errors).toEqual([]);expect(result.valid).toBe(true);
    expect(result.sampledPoses).toBeGreaterThanOrEqual(273);
    expect(result.actualPairChecks).toBeGreaterThan(0);
    expect(result.rigidRelativeChecks).toBeGreaterThan(10000);
    expect(result.maxPistonLinkJump).toBeLessThan(1e-4);
    expect(result.maxCompletedBedJump).toBeLessThan(1e-4);
    expect(result.minBedFloorClearance).toBeGreaterThanOrEqual(-.005);
  },300000);
});
