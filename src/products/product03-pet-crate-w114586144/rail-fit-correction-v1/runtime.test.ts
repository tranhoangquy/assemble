import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {createProof} from './runtime';
describe('source-grounded visible rail correction proof',()=>{
 it('closes all four proposed rear exterior interfaces with real mesh hits, without hiding shafts',()=>{
  const p=createProof(true);p.evaluate(12);
  for(const x of [-350,-350+700/3,-350+1400/3,350]){
   const point=new T.Vector3(x,62,-295).applyMatrix4(p.rig.matrixWorld),normal=new T.Vector3(0,0,-1).transformDirection(p.rig.matrixWorld);
   const hit=new T.Raycaster(point.clone().addScaledVector(normal,100),normal.clone().negate()).intersectObject(p.rear,true)[0];
   expect(hit).toBeDefined();expect(hit.distance).toBeCloseTo(100,7);
  }
  const shaft=new T.Box3().setFromObject(p.screw);expect(shaft.getSize(new T.Vector3()).z).toBeCloseTo(27.8,4);
  p.rig.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])expect(m.clippingPlanes??[]).toHaveLength(0);});
 });
 it('keeps the rail installed while the screw approaches, and gives repeatable backward/forward seeks',()=>{
  const p=createProof(true);p.evaluate(5.8);const contact=p.rail.position.clone();
  for(const t of [6,7,8,9.5,12]){p.evaluate(t);expect(p.rail.position.distanceTo(contact)).toBe(0);}
  p.evaluate(7.25);const a=p.digest();for(const t of [12,0,9.7,2,5])p.evaluate(t);p.evaluate(7.25);expect(p.digest()).toEqual(a);
 });
});
