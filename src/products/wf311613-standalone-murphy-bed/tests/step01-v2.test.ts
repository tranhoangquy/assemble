import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {step01V2Product,step01V2Assembly,step01V2Plan,step01V2Video} from '@/products/wf311613-standalone-murphy-bed/director/step01-v2';
import {AssemblyValidator} from '@/engine/assembly/AssemblyValidator';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {ObjectRegistry} from '@/engine/product/ObjectRegistry';
import {AnimationEngine} from '@/engine/animation/AnimationEngine';

describe('Step 1 V2 director gate',()=>{
  it('contains only six PDF wood parts and exact Step 1 hardware quantities',()=>{
    expect(step01V2Product.parts.filter(p=>p.category==='cabinet').map(p=>p.id).sort()).toEqual(['A1','A3','A5','A7','A8','A9']);
    expect(step01V2Product.parts.filter(p=>p.id.startsWith('dowel'))).toHaveLength(6);
    expect(step01V2Product.parts.filter(p=>p.id.startsWith('cam'))).toHaveLength(8);
    expect(step01V2Product.parts.filter(p=>p.id.startsWith('bolt'))).toHaveLength(8);
    expect(step01V2Assembly.steps).toHaveLength(1);
    expect(step01V2Video.scenes).toHaveLength(1);
  });
  it('validates without a global contact whitelist and keeps dowels before upright seating',()=>{
    const result=AssemblyValidator.validate(step01V2Product,step01V2Assembly);
    expect(result.errors).toEqual([]);expect(result.warnings).toEqual([]);expect(result.operationsChecked).toBe(25);
    const installs=result.installations;
    const rails=installs.filter(i=>['A1','A3'].includes(i.action.target));
    const lastDowel=Math.max(...installs.filter(i=>i.action.type==='installDowel').map(i=>(i.action.at??0)+(i.action.duration??0)));
    expect(Math.min(...rails.map(i=>i.action.at??0))).toBeGreaterThan(lastDowel);
    for(const operation of installs) expect(operation.action.installation?.allowedContacts?.length??0).toBeLessThan(8);
  });
  it('uses deliberate cuts and fits local camera distances, not a 180 cm orbit clamp',()=>{
    for(const shot of step01V2Plan.steps[0].shots) expect(shot.transition).toBe('cut');
    const c=step01V2Video.cameraPresets['joint-0'];
    expect(new THREE.Vector3(...c.position).distanceTo(new THREE.Vector3(...c.target))).toBeLessThan(180);
    expect(step01V2Video.reviewCaptions?.at(-1)?.end).toBeCloseTo(100.6);
  });
  it('creates physically distinct bores, dowel flutes, socket recess and bolt threads',()=>{
    for(const part of step01V2Product.parts) if(part.type==='mesh'){
      const g=GeometryFactory.create(part.geometry);g.computeBoundingBox();
      expect(g.boundingBox?.isEmpty()).toBe(false);
      expect(g.getAttribute('position').count).toBeGreaterThan(20);g.dispose();
    }
  });
  it('spins an oriented bolt about its spindle without tumbling, deterministically',()=>{
    const registry=new ObjectRegistry(),object=new THREE.Group();object.rotation.x=-Math.PI/2;registry.register('bolt',object);registry.captureBaseline();
    const definition=step01V2Product.parts.find(p=>p.id.startsWith('bolt'))!;
    const engine=new AnimationEngine(registry,new Map([['bolt',{...definition,id:'bolt'}]]));
    engine.addActions([{type:'installBolt',target:'bolt',connection:{part:'host',point:'mount'},turns:2,duration:4,spinAxis:'z',installation:{mechanicalPhases:true,approachDirection:[0,0,-1],approachDistance:10}}]);
    engine.timeline.seek(3,false);
    const axis=new THREE.Vector3(0,1,0).applyQuaternion(object.quaternion);
    expect(Math.abs(axis.z)).toBeCloseTo(1);expect(axis.x).toBeCloseTo(0);expect(axis.y).toBeCloseTo(0);
    const q=object.quaternion.clone();engine.timeline.seek(0,false);engine.timeline.seek(3,false);expect(object.quaternion.angleTo(q)).toBeCloseTo(0);engine.dispose();
  });
});
