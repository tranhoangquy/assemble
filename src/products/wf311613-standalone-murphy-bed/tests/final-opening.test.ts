import {describe,it,expect} from 'vitest';
import {steps01To20Plan} from '../director/steps11-20';
import {compressOpening} from '../director/final-opening-pacing';
import {fullPlan,fullRuntimes} from '../director/steps21-31';
import {fullProduct} from '../product/parts-step21-31';

describe('Final pass opening retime — later approved steps remain locked',()=>{
  it('retimes only Steps 1–3 within the requested semantic budget',()=>{
    const p=compressOpening(steps01To20Plan),durations=p.steps.slice(0,3).map(s=>s.shots.reduce((n,x)=>n+x.duration,0));
    expect(durations[0]).toBeGreaterThanOrEqual(28);expect(durations[0]).toBeLessThanOrEqual(32);
    expect(durations[1]).toBeGreaterThanOrEqual(16);expect(durations[1]).toBeLessThanOrEqual(19);
    expect(durations[2]).toBeGreaterThanOrEqual(21);expect(durations[2]).toBeLessThanOrEqual(24);
    expect(durations.reduce((a,b)=>a+b)).toBeGreaterThanOrEqual(65);expect(durations.reduce((a,b)=>a+b)).toBeLessThanOrEqual(75);
    expect(p.steps.slice(3)).toEqual(steps01To20Plan.steps.slice(3));
  });
  it('preserves every existing camera, path, hardware turn count and action order in the opening',()=>{
    for(let i=0;i<3;i++){
      const a=steps01To20Plan.steps[i],b=fullPlan.steps[i];expect(b.shots.map(s=>s.id)).toEqual(a.shots.map(s=>s.id));
      for(let j=0;j<a.shots.length;j++){
        expect(b.shots[j].camera).toBe(a.shots[j].camera);
        const withoutTime=(shot:typeof a.shots[number])=>shot.actions.map(action=>{const copy={...action};delete copy.at;delete copy.duration;return copy;});
        expect(withoutTime(b.shots[j])).toEqual(withoutTime(a.shots[j]));
      }
    }
  });
  it('keeps all six Step 3 bolt starts before every final tightening pass',()=>{
    const s=fullPlan.steps[2].shots,starts=s.map((x,i)=>x.id.endsWith('bolt-start')?i:-1).filter(i=>i>=0),tight=s.findIndex(x=>x.type==='TIGHTEN_HARDWARE');
    expect(starts).toHaveLength(6);expect(Math.max(...starts)).toBeLessThan(tight);
  });
  it('does not mutate the source checkpoint or install Option 2',()=>{
    expect(steps01To20Plan.steps[0].shots[0].duration).toBe(2.4);
    expect(fullPlan.steps).toHaveLength(31);
    expect(fullRuntimes.reduce((n,s)=>n+s.duration,0)).toBeLessThan(600);
    expect(fullProduct.name).toContain('Option 1');
    expect(fullProduct.parts.some(p=>/bookshelf|storage|daybed/i.test(p.name))).toBe(false);
  });
});
