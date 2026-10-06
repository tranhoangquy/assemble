import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import type {OrbitControls} from 'three-stdlib';
import {CameraEngine} from './CameraEngine';
import {AnimationEngine} from '../animation/AnimationEngine';
import {ObjectRegistry} from '../product/ObjectRegistry';
import type {CameraPreset} from '@/types/video';

describe('camera orientation after all deterministic seek tracks',()=>{
  it('looks at the final target on forward, backward and repeated cut seeks',()=>{
    const camera=new THREE.PerspectiveCamera(),target=new THREE.Vector3();
    const controls={target,maxPolarAngle:Math.PI*.49,update:()=>{camera.lookAt(target);camera.updateMatrixWorld(true);}} as unknown as OrbitControls;
    const presets:Record<string,CameraPreset>={
      wide:{position:[240,238,-581],target:[49,79,-7],fov:35},
      result:{position:[210,253,-475],target:[66,32,-77],fov:55},
      underside:{position:[16,-4,-32],target:[6,12,18],fov:42,allowUnderside:true},
    };
    const cameraEngine=new CameraEngine(camera,controls,presets);
    const registry=new ObjectRegistry();registry.captureBaseline();
    const engine=new AnimationEngine(registry,new Map(),cameraEngine);
    engine.addActions([{type:'camera',to:'wide',at:0,duration:0},{type:'camera',to:'result',at:4,duration:0},
      {type:'camera',to:'underside',at:8,duration:0}]);
    engine.timeline.to({},{duration:2},8);
    try{
      for(const [time,id]of [[1,'wide'],[5,'result'],[9,'underside'],[1,'wide'],[9,'underside'],[5,'result'],[0,'wide'],[0,'wide']] as const){
        engine.seek(time);const preset=presets[id];
        expect(camera.getWorldDirection(new THREE.Vector3()).distanceTo(new THREE.Vector3(...preset.target).sub(camera.position).normalize())).toBeLessThan(1e-9);
        expect(camera.fov).toBe(preset.fov);
        expect(controls.maxPolarAngle).toBe(id==='underside'?Math.PI-.15:Math.PI*.49);
      }
    }finally{engine.dispose();}
  });
});
