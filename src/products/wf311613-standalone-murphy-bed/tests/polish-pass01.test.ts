import {createHash} from 'node:crypto';
import {describe,expect,it} from 'vitest';
import {fullProduct} from '../product/parts-step21-31';
import {fullPlan,fullVideo} from '../director/steps21-31';
import {polishPlan,polishVideo,polishCheckpoints,polishRuntime,polishShotTime} from '../director/polish-pass01';
import {bedroomSupportVisible} from '@/presentation/environment/bedroom-config';

const hash=(data:unknown)=>createHash('sha256').update(JSON.stringify(data)).digest('hex');
describe('polish 01 mechanical and presentation locks',()=>{
  it('retains the exact accepted product, materials and baseline plan',()=>{
    expect(hash(fullProduct)).toBe('29ef4258730c3e3691c84223d98e240d9a25854d079402377f97489ace5f9fb5');
    expect(hash(fullProduct.materials)).toBe('d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc');
    expect(hash(fullPlan)).toBe('8f6e7f76addeebfa9fc2a95b15298e348e8e1f3ba314956736ee118f094d7bc7');
    expect(polishVideo.cameraPresets.context).toEqual(fullVideo.cameraPresets.context);
    expect(fullVideo.presentation).toBeUndefined();
  });
  it('keeps Step 1–3 exactly and all Step 4–20 action timing',()=>{
    expect(polishPlan.steps.slice(0,3)).toEqual(fullPlan.steps.slice(0,3));
    for(const step of polishPlan.steps.slice(3,20)){
      const old=fullPlan.steps.find(s=>s.step===step.step)!;
      expect(step.shots.map(s=>[s.id,s.duration])).toEqual(old.shots.map(s=>[s.id,s.duration]));
      for(let i=0;i<step.shots.length;i++){
        const actions=step.shots[i].actions.filter(a=>!(step.step===11&&i===0&&a.type==='move'&&a.target==='bed-motion-root'));
        expect(actions).toEqual(old.shots[i].actions);
      }
    }
    expect(polishRuntime).toBeCloseTo(498.253693888889,8);
  });
  it('uses only actual playback checkpoints and independent presentation props',()=>{
    expect(polishCheckpoints.length).toBeGreaterThanOrEqual(11);
    expect(polishCheckpoints.every(c=>!c.camera&&c.time>=0&&c.time<polishRuntime)).toBe(true);
    const room=polishVideo.presentation!.environment!;
    expect(room.preset).toBe('bedroom');expect(room.floorY).toBe(0);
    expect(room.installationWall!.start).toBe(polishShotTime('wall-position'));
    for(const support of room.supports!){
      expect(fullProduct.parts.some(p=>p.id===support.id)).toBe(false);
      expect(bedroomSupportVisible(support,support.start)).toBe(true);
      expect(bedroomSupportVisible(support,support.end)).toBe(false);
    }
    expect(polishPlan.steps[24].shots[0].camera).toBe('polish01-actual-front-context');
    expect(polishPlan.steps[24].shots.filter(s=>s.id.endsWith('connection')).map(s=>s.camera)).toEqual(['S25--1-pivot','S25-1-pivot']);
  });
});
