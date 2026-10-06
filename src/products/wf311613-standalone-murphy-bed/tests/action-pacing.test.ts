import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { directorPlan, reviewVideo } from '../director/directorPlan';
import { actionPacing, tuneActionPacing } from '../director/actionPacing';
import { product } from '../product/product';
import { assembly } from '../assembly/assembly';
import { step03CorrectedPlan, step03CorrectedVideo, step03CorrectedProduct } from '../director/step03-corrected';
import { DirectorPlanCompiler } from '@/engine/director/DirectorPlanCompiler';
import { AssemblyValidator } from '@/engine/assembly/AssemblyValidator';
import { AnimationEngine } from '@/engine/animation/AnimationEngine';
import { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import type { DirectorPlan } from '@/types/director';

function runtime(plan: DirectorPlan) {
  const registry = new ObjectRegistry();
  for (const part of product.parts) {
    const object = new THREE.Group(); object.position.set(...part.position);
    object.rotation.set(...(part.rotation ?? [0,0,0]).map(v=>v*Math.PI/180) as [number,number,number]);
    object.visible = part.visible ?? true; registry.register(part.id,object);
  }
  registry.captureBaseline();
  const engine = new AnimationEngine(registry,new Map(product.parts.map(p=>[p.id,p])));
  let cursor = 0;
  for(const step of plan.steps) {
    engine.addActions(DirectorPlanCompiler.actions(step),cursor);
    cursor += step.shots.reduce((sum,shot)=>sum+shot.duration,0);
  }
  return {registry,engine,duration:cursor};
}
describe('Steps 1–3 action-only speed checkpoint',()=>{
  it('preserves approved geometry, materials, cameras, shot order and transitions',()=>{
    expect(product).toBe(step03CorrectedProduct);
    expect(reviewVideo.cameraPresets).toBe(step03CorrectedVideo.cameraPresets);
    for(const [index,step] of directorPlan.steps.entries())
      expect(step.shots.map(s=>[s.id,s.camera,s.transition])).toEqual(step03CorrectedPlan.steps[index].shots.map(s=>[s.id,s.camera,s.transition]));
    expect(directorPlan.steps.map(s=>s.step)).toEqual([1,2,3]);
    expect(()=>tuneActionPacing({...directorPlan,steps:[{...directorPlan.steps[0],step:4}]})).toThrow(/restricted/);
  });
  it('reduces each duration through action timing, never global speed',()=>{
    const oldDurations=step03CorrectedPlan.steps.map(s=>s.shots.reduce((t,x)=>t+x.duration,0));
    expect(oldDurations).toEqual(expect.arrayContaining([expect.closeTo(78.7),expect.closeTo(47.6),expect.closeTo(51.75)]));
    for(const [index,step] of directorPlan.steps.entries()) {
      expect(reviewVideo.scenes[index].duration).toBeLessThan(oldDurations[index]);
      for(const shot of step.shots)for(const a of shot.actions)expect((a.at??0)+(a.duration??0)).toBeLessThanOrEqual(shot.duration+1e-8);
    }
    // Coupled cabinet / dowel translations accelerate together, never independently.
    const old=step03CorrectedPlan.steps[2].shots.find(s=>s.id==='S3-seat-first-side');
    const faster=directorPlan.steps[2].shots.find(s=>s.id==='S3-seat-first-side')!;
    expect(faster.duration).toBeLessThan(old!.duration);
    for(const [i,a] of faster.actions.entries()) {
      expect(a.duration).toBeCloseTo((old!.actions[i].duration??0)*actionPacing.assemblyMotionDurationCap);
      expect(a.at).toBeCloseTo((old!.actions[i].at??0)*actionPacing.assemblyMotionDurationCap);
    }
  });
  it('keeps initial hardware readable, accelerates repeats, and retains visible turns',()=>{
    const actions=directorPlan.steps.flatMap(s=>s.shots.flatMap(x=>x.actions));
    for(const kind of ['installBolt','installDowel','installNut'] as const) {
      const items=actions.filter(a=>a.type===kind);
      expect(items[1].duration).toBeLessThan(items[0].duration!);
      expect(items[2].duration).toBeLessThan(items[1].duration!);
      for(const a of items) {
        if(!('installation' in a))throw new Error('Expected installation action');
        expect(a.duration).toBeGreaterThan(0.3);
        expect(a.installation?.mechanicalPhases).toBe(true);
        expect(a.installation?.motionTiming).toBeDefined();
        if(a.type==='installBolt')expect(a.turns).toBeGreaterThanOrEqual(1.5);
      }
    }
    expect(actionPacing.repeatedPhases.contact).toBe(0.02);
  });
  it('starts all six Step 3 bolts before the final tightening pass',()=>{
    const actions=DirectorPlanCompiler.actions(directorPlan.steps[2]);
    const starts=actions.filter(a=>a.type==='installBolt');
    const firstTighten=actions.find(a=>a.type==='rotate'&&a.to===900)!;
    expect(starts).toHaveLength(6);
    expect(firstTighten.at).toBeGreaterThan(Math.max(...starts.map(a=>(a.at??0)+(a.duration??0))));
    const result=AssemblyValidator.validate(product,assembly);
    expect(result.errors).toEqual([]);expect(result.warnings).toEqual([]);expect(result.operationsChecked).toBe(72);
  });
  it('ends at the identical assembled physical state, including backward seek',()=>{
    const old=runtime(step03CorrectedPlan),fast=runtime(directorPlan);
    const frameInsert=DirectorPlanCompiler.actions(directorPlan.steps[2]).find(a=>a.type==='installPart'&&a.target==='E3')!;
    const step3Start=reviewVideo.scenes[0].duration+reviewVideo.scenes[1].duration;
    for(const fraction of [0.05,0.35,0.6,0.85,0.99]) {
      fast.engine.seek(step3Start+frameInsert.at!+frameInsert.duration!*fraction);
      expect(fast.registry.get('S3-E3--1-dowel')!.position.x-fast.registry.get('E3')!.position.x).toBeCloseTo(-116.5,5);
    }
    old.engine.seek(old.duration-0.05);fast.engine.seek(fast.duration-0.05);
    for(const p of product.parts) {
      const a=old.registry.get(p.id)!,b=fast.registry.get(p.id)!;
      expect(a.position.distanceTo(b.position),p.id).toBeLessThan(1e-6);
      expect(a.quaternion.angleTo(b.quaternion),p.id).toBeLessThan(1e-6);
      expect(a.visible,p.id).toBe(b.visible);
    }
    const before=fast.registry.get('A4')!.position.clone();
    fast.engine.seek(0);fast.engine.seek(fast.duration-0.05);
    expect(fast.registry.get('A4')!.position.distanceTo(before)).toBeLessThan(1e-6);
    old.engine.dispose();fast.engine.dispose();
  });
  it('physically approaches before spinning, feeds after contact, and seats deterministically',()=>{
    const rt=runtime(directorPlan);
    const bolt=DirectorPlanCompiler.actions(directorPlan.steps[0]).find(a=>a.type==='installBolt')!;
    if(bolt.type!=='installBolt')throw new Error('Missing bolt');
    const start=bolt.at!,d=bolt.duration!,object=rt.registry.get(bolt.target)!;
    rt.engine.seek(start+0.001);const staged=object.position.clone(),orientation=object.quaternion.clone();
    rt.engine.seek(start+d*0.27);const contact=object.position.clone();
    expect(staged.distanceTo(contact)).toBeGreaterThan(1);
    expect(object.quaternion.angleTo(orientation)).toBeLessThan(1e-6);
    rt.engine.seek(start+d*0.5);
    expect(object.position.distanceTo(contact)).toBeGreaterThan(0.01);
    expect(object.quaternion.angleTo(orientation)).toBeGreaterThan(0.1);
    rt.engine.dispose();
  });
});
