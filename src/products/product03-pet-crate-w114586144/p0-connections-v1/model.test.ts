import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {createModel,placements} from './model';
import {createProof,groups} from './proof';
describe('Product03 focused P0 geometry proposals',()=>{
 it('removes positive-volume wood intersections and puts14 on all four6 rails',()=>{
  const m=createModel(true),wood=[...m.r.registry.entries()].filter(([id])=>/^part-(9|10|11|12|13|14|15)-/.test(id));
  for(let i=0;i<wood.length;i++)for(let j=i+1;j<wood.length;j++){
   const x=new T.Box3().setFromObject(wood[i][1]).intersect(new T.Box3().setFromObject(wood[j][1])).getSize(new T.Vector3());expect(Math.min(x.x,x.y,x.z)).toBeLessThan(1e-5);
  }
  const floor=new T.Box3().setFromObject(m.r.registry.require('part-14-1'));
  for(let i=1;i<=4;i++)expect(floor.min.y).toBeCloseTo(new T.Box3().setFromObject(m.r.registry.require(`part-6-${i}`)).max.y,5);
 });
 it('keeps all10 S8 axes incident on proposed backing without pretending the F path is clear',()=>{
  const m=createModel(true);
  for(const p of placements.filter(p=>p.step===8&&p.id.startsWith('hardware-'))){
   const receiver=p.position[2]<0?'part-13-1':p.position[1]<800?'part-15-1':'part-9-1';
   expect(new T.Raycaster(new T.Vector3(...p.position),new T.Vector3(...p.outward!).negate(),0,44).intersectObject(m.r.registry.require(receiver),true).length).toBeGreaterThan(0);
  }
  for(let i=1;i<=8;i++){
   const p=placements.find(p=>p.id===`hardware-F-${i}`)!,head=new T.Vector3(...p.position);
   expect(new T.Raycaster(head.add(new T.Vector3(0,-60,0)),new T.Vector3(0,1,0),0,59.9).intersectObject(m.r.registry.require(p.host!),true).length).toBeGreaterThan(0);
  }
 });
 it('seeks the five focused clips without history dependence or hidden geometry/clipping',()=>{
  const p=createProof(true);for(const group of groups){p.evaluate(group,6);const a=p.digest();p.evaluate(group,8);p.evaluate(group,0);p.evaluate(group,6);expect(p.digest()).toEqual(a);}
  p.rig.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])expect(m.clippingPlanes??[]).toHaveLength(0);});
 });
});
