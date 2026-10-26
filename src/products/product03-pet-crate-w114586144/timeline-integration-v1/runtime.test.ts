import {describe,it,expect} from 'vitest';
import {createRuntime} from './runtime';
import {bodies,hardware,steps,graph,duration} from './timeline';

describe('Bounded19-step integration',()=>{
 it('retains source inventory/order while refusing known-invalid or unsupported completion',()=>{
  expect(graph.cycles).toEqual([]);expect(graph.missingDependencies).toEqual([]);
  expect(steps).toHaveLength(19);expect(new Set(bodies.map(b=>b.id)).size).toBe(20);
  expect(hardware).toHaveLength(100);expect(new Set(hardware.map(h=>h.id)).size).toBe(100);
  for(const st of steps)for(const[code,count]of Object.entries(st.source.hardware))expect(hardware.filter(h=>h.step===st.number&&h.id.startsWith(`hardware-${code}-`))).toHaveLength(count);
  const r=createRuntime(),end=r.evaluate(duration);
  expect(end.installed).toHaveLength(20);expect(end.hardwareSeated).toHaveLength(82);expect(end.posedHeld).toHaveLength(12);
  expect(end.pending.sort()).toEqual(['hardware-B-2','hardware-B-4',...Array.from({length:4},(_,i)=>`hardware-N-${i+1}`)].sort());
  expect(end.completeFilmAuthorized).toBe(false);expect(end.clippingPlanes).toBe(0);
 });
 it('keeps installed local poses after contact and restores them after reverse/random seeks, including prepared feet',()=>{
  const r=createRuntime();
  for(const id of new Set(bodies.map(b=>b.id))){const contact=Math.max(...bodies.filter(b=>b.id===id).map(b=>b.contact));r.evaluate(contact+.001);const actor=r.r.registry.require(id),p=actor.position.toArray(),q=actor.quaternion.toArray();
   for(const t of [264,0,(contact+264)/2,contact+.001,264]){r.evaluate(t);if(t>=contact){expect(actor.position.toArray()).toEqual(p);expect(actor.quaternion.toArray()).toEqual(q);expect(actor.visible).toBe(true);}}
  }
  for(const t of [100,177,264,98.1,185,0,100]){r.evaluate(t);for(const[foot,host]of [['hardware-A-1','part-1-1'],['hardware-A-5','part-5-1']]){const f=r.r.registry.require(foot),h=r.r.registry.require(host);if(f.visible){const relative=f.position.clone().sub(h.position).toArray();r.evaluate(264);const final=r.r.registry.require(foot).position.clone().sub(r.r.registry.require(host).position).toArray();expect(relative).toEqual(final);r.evaluate(t);}}}
 });
 it('does not reveal current screws while their connection bodies are approaching',()=>{
  const r=createRuntime();for(const b of bodies.filter(b=>!b.prepared&&b.contact>b.start)){r.evaluate((b.start+b.contact)/2);for(const h of hardware.filter(h=>h.step===b.step&&h.kind==='threaded'&&(h.host===b.id||h.backing===b.id)))expect(r.r.registry.require(h.id).visible).toBe(false);}
 });
});
