import {describe,it,expect} from 'vitest';
import {createRuntime} from './runtime';
import {placements,steps,graph,duration} from './timeline';
import {hardwareCounts} from '../prototype-v2/model';
describe('Product03 human-authorized illustrative assembly',()=>{
 it('retains19 OEM dependencies,20 component instances and100 hardware/accessory placements',()=>{
  expect(graph.steps).toHaveLength(19);expect(graph.cycles).toEqual([]);expect(graph.missingDependencies).toEqual([]);
  expect(placements.filter(p=>p.id.startsWith('part-'))).toHaveLength(20);expect(new Set(placements.map(p=>p.id)).size).toBe(120);
  for(const [code,n]of Object.entries(hardwareCounts))expect(placements.filter(p=>p.id.startsWith(`hardware-${code}-`))).toHaveLength('LMO'.includes(code)?0:n);
  for(const p of placements)expect(p.localStart+p.duration).toBeLessThanOrEqual(steps[p.step-1].duration+.00001);
 });
 it('retains visible parts and hardware throughout forward assembly and is seek-history independent',()=>{
  const r=createRuntime();let previous:string[]=[];for(let i=0;i<=duration*4;i++){const s=r.evaluate(i/4);const visible=s.visible.filter(id=>!/^hardware-[LMO]-/.test(id));expect(previous.every(id=>visible.includes(id))).toBe(true);previous=visible;}
  r.evaluate(129.75);const a=r.digest();r.evaluate(0);r.evaluate(duration);r.evaluate(14);r.evaluate(129.75);expect(r.digest()).toEqual(a);
 },15000);
 it('retains100 accounted hardware units and20 parts at final illustrative pose without creating hidden receiver geometry',()=>{
  const r=createRuntime(),s=r.evaluate(duration);expect(s.visible.filter(id=>id.startsWith('part-'))).toHaveLength(20);expect(s.visible.filter(id=>id.startsWith('hardware-'))).toHaveLength(100);expect(s.physicalFit).toBe('NOT_CERTIFIED');expect(s.hiddenReceivingGeometry).toBe('OMITTED');expect(s.doorAngleDegrees).toBe(0);
 },15000);
});
