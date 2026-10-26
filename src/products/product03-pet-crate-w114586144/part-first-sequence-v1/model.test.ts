import {describe,it,expect} from 'vitest';
import {sequenceAudit} from './checks';
import {createProof,groups,duration,times,plan} from './proof';
describe('Part contact before new hardware and tool',()=>{
 it('keeps current screws/tools hidden while structure moves; then retains every connection',()=>{
  const p=createProof();for(const g of groups){const cfg=plan[g];for(const t of [0,1,2.49,3]){p.evaluate(g,t);if(cfg.screw)expect(p.r.registry.require(cfg.screw).visible).toBe(false);expect(p.r.registry.require('hardware-L-1').visible).toBe(false);}
   p.evaluate(g,times.partContact);const contact=p.r.registry.require(cfg.active).matrixWorld.toArray();for(const t of [3,4.5,5.75,8,9.5]){p.evaluate(g,Math.min(t,duration(g)));expect(p.r.registry.require(cfg.active).matrixWorld.toArray()).toEqual(contact);}
  }
 },20000);
 it('has no premature part/fastener crossings or unrelated tool paths and seeks reproducibly',()=>{
  const a=sequenceAudit();for(const r of a.result){expect(r.earlyScrew+r.earlyTool+r.retentionFailures+r.structuralDrift+r.entryVisible+r.exitVisible).toBe(0);expect(r.deterministic).toBe(true);expect(r.maxToolAxisError).toBeLessThan(1e-6);expect(r.headGap).toBe(0);expect(r.rawCandidates.filter(c=>c.kind.startsWith('PART_')||c.kind==='KEY_VS_INSTALLED_CANDIDATE'||(c.kind==='SCREW_VS_INSTALLED_CANDIDATE'&&c.b.startsWith('hardware-')))).toEqual([]);}
 },30000);
});
