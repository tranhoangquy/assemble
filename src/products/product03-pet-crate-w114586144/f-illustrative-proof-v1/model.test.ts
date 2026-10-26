import {describe,it,expect} from 'vitest';
import {exteriorChecks,contactChecks,accessChecks} from './checks';
import {createProof} from './proof';
describe('Human B local nonliteral F reconstruction',()=>{
 it('seats all77 exterior fasteners and preserves every checked contact without wood overlap',()=>{const {m,rows}=exteriorChecks(),c=contactChecks(m);expect(rows).toHaveLength(77);for(const r of rows){expect(r.gap).not.toBeNull();expect(Math.abs(r.gap!)).toBeLessThan(.00001);}for(const r of c.contacts)expect(Math.abs(r.gap)).toBeLessThan(.00001);expect(c.woodPairs.some(r=>r.positiveVolume)).toBe(false);expect(c.lap.every(r=>r.backingDistance!==null&&r.rawHostApproachHit===null)).toBe(true);expect(c.backing.every(r=>r.distance!==null)).toBe(true);},20000);
 it('keeps explicit raw receiver overlap while clearing unrelated driver geometry',()=>{for(const g of ['S10','S12'] as const){const a=accessChecks(g);expect(a.records.some(r=>r.classification==='RAW_SOLID_OVERLAP_UNMODELED_RECEIVER')).toBe(true);expect(a.records.filter(r=>r.classification==='UNRELATED_POSITIVE_AABB_CANDIDATE')).toEqual([]);expect(a.maxTipAxisError).toBeLessThan(1e-6);expect(a.minHeadExterior).toBeGreaterThan(-1e-6);}},30000);
 it('repeats arbitrary forward/backward seeks with the tool and installed screw retained',()=>{const p=createProof();for(const g of ['S10','S12'] as const){p.evaluate(g,7);const a=p.digest();p.evaluate(g,12);p.evaluate(g,0);p.evaluate(g,4);p.evaluate(g,7);expect(p.digest()).toEqual(a);expect(p.evaluate(g,12).visible).toContain('hardware-M-1');} });
});
