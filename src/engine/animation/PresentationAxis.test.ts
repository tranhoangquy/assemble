import {it,expect} from 'vitest';
import * as THREE from 'three';
import {ObjectRegistry} from '@/engine/product/ObjectRegistry';
import {MechanismSolver} from './MechanismSolver';
it('keeps a supported contact corner fixed on a normalized arbitrary axis across direct/reset seeks',()=>{
  const registry=new ObjectRegistry(),o=new THREE.Group();registry.register('part',o);registry.captureBaseline();
  const solver=new MechanismSolver(registry);
  solver.add({type:'pivotPose',target:'part',axis:[2,0,-2],localPivot:[10,3,20],from:{pivot:[10,0,20],angle:0},to:{pivot:[10,0,20],angle:35},duration:1},0);
  for(const t of [1,.2,0,.8,1]){solver.sync(t);expect(o.localToWorld(new THREE.Vector3(10,3,20)).distanceTo(new THREE.Vector3(10,0,20))).toBeLessThan(1e-8);expect(o.quaternion.length()).toBeCloseTo(1,9);}
});
