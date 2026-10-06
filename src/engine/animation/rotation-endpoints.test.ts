import * as THREE from 'three';
import {describe,it,expect} from 'vitest';
import {ObjectRegistry} from '@/engine/product/ObjectRegistry';
import {AnimationEngine} from './AnimationEngine';

describe('Exact terminal orientation without changing action timing',()=>{
  it('preserves exact PI angles on long mating boards after forward/backward seeking',()=>{
    const registry=new ObjectRegistry(),object=new THREE.Group();registry.register('board',object);registry.captureBaseline();
    const engine=new AnimationEngine(registry,new Map());
    try{
      engine.addActions([{type:'rotate',target:'board',to:[-180,0,-90],at:1,duration:0},{type:'wait',at:5,duration:1}]);
      for(const time of [6,1,3,0,2,6]){
        engine.seek(time);
        if(time>=1){expect(object.rotation.x).toBe(-Math.PI);expect(object.rotation.z).toBe(-Math.PI/2);}
        else expect(object.rotation.x).toBe(0);
      }
    }finally{engine.dispose();}
  });
  it('does not pin an active later rotation or hardware installation to an earlier completed pose',()=>{
    const registry=new ObjectRegistry(),object=new THREE.Group();registry.register('bolt',object);registry.captureBaseline();
    const engine=new AnimationEngine(registry,new Map());
    try{
      engine.addActions([{type:'rotate',target:'bolt',to:[0,0,90],duration:0},
        {type:'rotate',target:'bolt',axis:'x',from:0,to:180,at:1,duration:2,ease:'none'},
        {type:'installBolt',target:'bolt',connection:{part:'bolt',point:'mount'},at:4,duration:1,turns:2.25,spinAxis:'x',
          installation:{approachDirection:[1,0,0],mechanicalPhases:true}},
        {type:'wait',at:6,duration:1}]);
      engine.seek(2);expect(object.rotation.x).toBeCloseTo(Math.PI/2,5);
      engine.seek(3);expect(object.rotation.x).toBe(Math.PI);
      engine.seek(5);expect(object.quaternion.angleTo(new THREE.Quaternion())).toBeGreaterThan(.5);
      engine.seek(0);expect(object.rotation.z).toBe(Math.PI/2);
    }finally{engine.dispose();}
  });
});
