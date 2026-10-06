import {describe,it,expect} from 'vitest';
import {step01V2Plan,step01V2Product} from '@/products/wf311613-standalone-murphy-bed/director/step01-v2';
import {step01PacedPlan,step01PacedProduct} from '@/products/wf311613-standalone-murphy-bed/director/step01-paced';
import {step02PacedPlan,step02PacedProduct,step02PacedAssembly,mirroredSideParts} from '@/products/wf311613-standalone-murphy-bed/director/step02-paced';
import {AssemblyValidator} from '@/engine/assembly/AssemblyValidator';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';

describe('Approved visuals and semantic pacing',()=>{
  it('locks the exact approved Step 1 product without changing materials or geometry',()=>{
    expect(step01PacedProduct).toBe(step01V2Product);
    const original=step01V2Plan.steps[0].shots,retimed=step01PacedPlan.steps[0].shots;
    const total=(shots:typeof original)=>shots.reduce((t,s)=>t+s.duration,0);
    expect(total(retimed)).toBeCloseTo(78.7);
    expect(total(retimed)/total(original)).toBeGreaterThan(0.75);
    expect(total(retimed)/total(original)).toBeLessThan(0.8);
    for(const id of ['dowel-macro','bolt-macro','dowel-target','panel-alignment']){
      const a=original.find(s=>s.id===id)!,b=retimed.find(s=>s.id===id)!;
      expect(b.duration).toBe(a.duration);expect(b.actions).toEqual(a.actions);
    }
    for(const s of retimed){
      expect(s.camera).toBe(original.find(a=>a.id===s.id)!.camera);
      for(const a of s.actions)expect((a.at??0)+(a.duration??0)).toBeLessThanOrEqual(s.duration+1e-6);
    }
  });
  it('keeps six dowels, eight cams and eight bolts as separate mirrored Step 2 objects',()=>{
    expect(mirroredSideParts.filter(p=>p.category==='cabinet').map(p=>p.id).sort()).toEqual(['A2','A4','A6','A7-R','A8-R','A9-R']);
    for(const [prefix,count]of [['R-dowel',6],['R-cam',8],['R-bolt',8]] as const)expect(mirroredSideParts.filter(p=>p.id.startsWith(prefix))).toHaveLength(count);
    const a=step01V2Product.parts.find(p=>p.id==='A8')!,b=mirroredSideParts.find(p=>p.id==='A8-R')!;
    expect(b.position[0]).toBe(-a.position[0]);
    expect(step02PacedProduct.materials).toBe(step01V2Product.materials);
  });
  it('does not pop repeated hardware in and starts all mirrored bolts before locking cams',()=>{
    const step=step02PacedPlan.steps[1],actions=DirectorPlanCompiler.actions(step);
    const bolts=actions.filter(a=>a.type==='installBolt'),locks=actions.filter(a=>a.type==='rotate');
    expect(Math.min(...locks.map(a=>a.at??0))).toBeGreaterThanOrEqual(Math.max(...bolts.map(a=>(a.at??0)+(a.duration??0))));
    for(const a of actions.filter(a=>['installBolt','installDowel','installNut'].includes(a.type))){
      expect(a.duration).toBeGreaterThan(0.7);
      expect('installation' in a&&a.installation?.mechanicalPhases).toBe(true);
    }
    for(const shot of step.shots)for(const a of shot.actions)expect((a.at??0)+(a.duration??0)).toBeLessThanOrEqual(shot.duration+1e-6);
  });
  it('validates two independent sides without collision exemptions between the sides',()=>{
    const result=AssemblyValidator.validate(step02PacedProduct,step02PacedAssembly);
    expect(result.errors).toEqual([]);expect(result.warnings).toEqual([]);
    expect(result.operationsChecked).toBe(50);
  });
});
