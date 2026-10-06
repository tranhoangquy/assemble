import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {step03CorrectedPlan,step03CorrectedProduct,step03CorrectedAssembly,standingPose} from '@/products/wf311613-standalone-murphy-bed/director/step03-corrected';
import {step01PacedProduct} from '@/products/wf311613-standalone-murphy-bed/director/step01-paced';
import {mirroredSideParts} from '@/products/wf311613-standalone-murphy-bed/director/step02-paced';
import {AssemblyValidator} from '@/engine/assembly/AssemblyValidator';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {ObjectRegistry} from '@/engine/product/ObjectRegistry';
import {AnimationEngine} from '@/engine/animation/AnimationEngine';

describe('Step 3 user-approved axial assembly correction',()=>{
  const step=step03CorrectedPlan.steps[2],actions=DirectorPlanCompiler.actions(step);
  it('uses exactly four PDF wood parts and six of each required hardware',()=>{
    expect(step.parts).toEqual(['D5','B9','E3','E4']);
    for(const type of ['dowel','cam','bolt'])expect(step03CorrectedProduct.parts.filter(p=>p.id.startsWith('S3-')&&p.id.endsWith(type))).toHaveLength(6);
    expect(step03CorrectedPlan.steps).toHaveLength(3);
    for(const p of step03CorrectedProduct.parts)if(p.type==='mesh'){const g=GeometryFactory.create(p.geometry);g.computeBoundingBox();expect(g.boundingBox!.isEmpty()).toBe(false);g.dispose();}
  },30_000);
  it('seats the first side before closing the second; all six bolts start before tightening',()=>{
    const order=step.shots.map(s=>s.id);
    expect(order.indexOf('S3-close-second-side')).toBeGreaterThan(order.indexOf('S3-seat-first-side'));
    expect(order.indexOf('S3-start-all-warning')).toBeGreaterThan(order.indexOf('S3-close-second-side'));
    const starts=actions.filter(a=>a.type==='installBolt'),tightening=step.shots.filter(s=>s.type==='TIGHTEN_HARDWARE');
    expect(starts).toHaveLength(6);expect(tightening).toHaveLength(6);
    const firstTighten=actions.find(a=>a.type==='rotate'&&typeof a.to==='number'&&a.to===900)!;
    expect(firstTighten.at).toBeGreaterThan(Math.max(...starts.map(a=>(a.at??0)+(a.duration??0))));
    for(const s of step.shots)for(const a of s.actions)expect((a.at??0)+(a.duration??0)).toBeLessThanOrEqual(s.duration+1e-6);
  });
  it('keeps all second-side members rigid while moving only along the mating axis',()=>{
    for(const p of mirroredSideParts){const start=standingPose(p,true,36),end=standingPose(p,true);expect(start.rotation).toEqual(end.rotation);expect(start.position[0]-end.position[0]).toBeCloseTo(36);expect(start.position.slice(1)).toEqual(end.position.slice(1));}
    const a=step01PacedProduct.parts.find(p=>p.id==='A1')!,b=step01PacedProduct.parts.find(p=>p.id==='A3')!;
    expect(standingPose(a,false).position[2]).toBe(18);expect(standingPose(b,false).position[2]).toBe(-18);
  });
  it('aligns all six dowel centers with real side-face receiver bores',()=>{
    const rails=[{id:'E3',y:3,z:18},{id:'B9',y:3,z:-18},{id:'D5',y:55,z:18}];
    for(const rail of rails)for(const side of [-1,1]){
      const id=side<0?(rail.z>0?'A1':'A3'):(rail.z>0?'A4':'A2');
      const host=step03CorrectedProduct.parts.find(p=>p.id===id)!;
      if(host.type!=='mesh'||host.geometry.type!=='bored-panel')throw new Error('Missing receiver');
      const pose=standingPose(host,side>0),matrix=new THREE.Matrix4().compose(new THREE.Vector3(...pose.position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...pose.rotation.map(v=>v*Math.PI/180) as [number,number,number])),new THREE.Vector3(1,1,1));
      const expected=new THREE.Vector3(side*116.5,rail.y+1.2,rail.z);
      const receivers=host.geometry.faceBores!.filter(b=>b.radius===0.42).map(b=>new THREE.Vector3(b.position[0],side<0?1.5:-1.5,b.position[2]).applyMatrix4(matrix));
      expect(Math.min(...receivers.map(p=>p.distanceTo(expected)))).toBeLessThan(1e-6);
    }
  });
  it('validates local mating contacts without an all-part collision whitelist',()=>{
    const result=AssemblyValidator.validate(step03CorrectedProduct,step03CorrectedAssembly);
    expect(result.errors).toEqual([]);expect(result.warnings).toEqual([]);
    expect(result.operationsChecked).toBe(72);
    for(const operation of result.installations.filter(o=>o.step==='step-03'))expect(operation.action.installation?.allowedContacts?.length??0).toBeLessThan(5);
  });
  it('moves dowels rigidly with each rail and reaches the same state on backward seek',()=>{
    const registry=new ObjectRegistry(),definitions=new Map(step03CorrectedProduct.parts.map(p=>[p.id,p]));
    for(const p of step03CorrectedProduct.parts){const object=new THREE.Group();object.position.set(...p.position);object.rotation.set(...(p.rotation??[0,0,0]).map(v=>v*Math.PI/180) as [number,number,number]);registry.register(p.id,object);}registry.captureBaseline();
    const engine=new AnimationEngine(registry,definitions);engine.addActions(actions);
    const insert=actions.find(a=>a.type==='installPart'&&a.target==='E3')!,start=insert.at!;
    for(const relative of [0.01,0.5,1.4,2.4,2.79]){
      engine.seek(start+relative);
      const rail=registry.get('E3')!,dowel=registry.get('S3-E3--1-dowel')!;
      expect(dowel.position.x-rail.position.x).toBeCloseTo(-116.5,5);
    }
    const tighten=actions.find(a=>a.type==='rotate'&&a.target==='S3-E3--1-cam')!;
    for(const relative of [0.01,0.15,0.29]){
      engine.seek(tighten.at!+relative);
      const cam=registry.get('S3-E3--1-cam')!;
      const spindle=new THREE.Vector3(0,1,0).applyQuaternion(cam.quaternion);
      expect(spindle.x).toBeCloseTo(0);expect(spindle.y).toBeCloseTo(0);expect(spindle.z).toBeCloseTo(1);
    }
    const endTime=step.shots.reduce((t,s)=>t+s.duration,0)-0.1;
    engine.seek(endTime);const p=registry.get('A4')!.position.clone();engine.seek(0);engine.seek(endTime);expect(registry.get('A4')!.position.distanceTo(p)).toBeLessThan(1e-6);
    engine.dispose();
  });
});
