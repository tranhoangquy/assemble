import {describe,expect,it} from 'vitest';
import {fullPlan,fullVideo} from '../director/steps21-31';
import overrides from '../director/polish-camera-overrides.json';
import {frontWorkPlacement} from '../director/front-staging';

describe('director polish camera-only data',()=>{
  it('leaves accepted opening/prefix views alone',()=>{
    for(const step of fullPlan.steps.filter(step=>step.step<=10))for(const shot of step.shots)
      expect(overrides.shotCameras).not.toHaveProperty(shot.id);
  });
  it('relocates useful underside and bracket close-ups without widening them',()=>{
    for(const id of ['S17-side--1--55-bolt-up','S18-H20-0-screws','S13-C7-0-seat']){
      const shot=fullPlan.steps.flatMap(step=>step.shots).find(shot=>shot.id===id)!;
      const key=overrides.shotCameras[id as keyof typeof overrides.shotCameras];
      const next=overrides.cameraPresets[key as keyof typeof overrides.cameraPresets];
      const original=fullVideo.cameraPresets[shot.camera!];
      expect(next.fov).toBe(original.fov);
      expect(next.position).toEqual(original.position.map((value,index)=>value+frontWorkPlacement[index]));
      expect(next.target).toEqual(original.target.map((value,index)=>value+frontWorkPlacement[index]));
    }
  });
  it('reframes the reported 224-second operation from the front with a shorter distance',()=>{
    const shot=fullPlan.steps.flatMap(step=>step.shots).find(shot=>shot.id==='S14-C2-right-seat')!;
    const next=overrides.cameraPresets[overrides.shotCameras['S14-C2-right-seat'] as keyof typeof overrides.cameraPresets];
    const original=fullVideo.cameraPresets[shot.camera!];
    expect(next.position[2]).toBeLessThan(next.target[2]);
    expect(Math.hypot(...next.position.map((value,index)=>value-next.target[index]))).toBeLessThan(
      Math.hypot(...original.position.map((value,index)=>value-original.target[index])));
  });
});
