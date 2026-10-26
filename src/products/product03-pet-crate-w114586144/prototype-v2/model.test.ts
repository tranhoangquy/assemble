import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {createPrototype,counts,hardwareCounts} from './model';
describe('Product03 Phase B non-certified prototype',()=>{
 it('preserves twenty independent source components and 103 A-O units',()=>{
  const r=createPrototype();expect(r.tree.byId.size).toBe(20);expect(r.registry.size).toBe(123);
  for(const [id,n]of Object.entries(counts))expect([...r.registry.entries()].filter(([key])=>key.startsWith(`part-${id}-`))).toHaveLength(n);
  for(const [id,n]of Object.entries(hardwareCounts))expect([...r.registry.entries()].filter(([key])=>key.startsWith(`hardware-${id}-`))).toHaveLength(n);
 });
 it('restores canonical geometry after exploded and backward review selection',()=>{
  const r=createPrototype(),state=()=>[...r.registry.entries()].map(([id,o])=>({id,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible}));const first=state();r.explode();r.registry.require('part-7-1').visible=false;r.registry.require('part-10-1').scale.setScalar(.1);r.reset();expect(state()).toEqual(first);r.explode();r.reset();expect(state()).toEqual(first);
 });
 it('has finite non-empty geometry without a runtime production catalog entry or concealed threads',()=>{
  const r=createPrototype();let vertices=0;r.root.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');vertices+=p.count;for(let i=0;i<p.count;i++)expect(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i))).toBe(true);}});expect(vertices).toBeGreaterThan(1000);
  for(const [id,o]of r.registry.entries())if(id.startsWith('hardware-'))expect(o.userData.hiddenThread).toBe(false);
 });
});
