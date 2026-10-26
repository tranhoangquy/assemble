import {describe,it,expect} from 'vitest';
import {createProof} from './proof';
describe('Product03 limited Phase C evidence boundary',()=>{
 it('retains both panels after contact and stops both screws outside the exterior face',()=>{
  const p=createProof();for(let frame=0;frame<=192;frame++){const s=p.joint(frame/12);expect(s.screws.every(x=>x.tipGapDisplay>=2-1e-8)).toBe(true);expect(s.visiblePartIds).toHaveLength(2);if(s.t>=5)expect(s.panelContactGapDisplay).toBeCloseTo(0,8);}expect(p.r.registry.size).toBe(123);
 },15000);
 it('resets descendants and is independent of arbitrary/backward seek and hinge alternatives',()=>{
  const p=createProof();p.joint(12.25);const expected=p.stateDigest();p.hinge(true);p.joint(1);p.hinge(false);p.joint(16);p.joint(12.25);expect(p.stateDigest()).toEqual(expected);p.hinge(false);const first=p.stateDigest();const leaves=()=>{const out:unknown[]=[];p.r.root.traverse(o=>out.push({p:o.position.toArray(),q:o.quaternion.toArray(),v:o.visible}));return out;};const fullBefore=leaves();p.hinge(true);p.hinge(false);expect(p.stateDigest()).toEqual(first);expect(leaves()).toEqual(fullBefore);
 },15000);
 it('reports raw baseline hinge penetration and candidate exterior contact separately from physical fit',()=>{
  const p=createProof();const before=p.hinge(false),after=p.hinge(true);expect(before.interfaces).toHaveLength(4);expect(before.interfaces.every(x=>x.movingLeafSignedGap<0)).toBe(true);expect(after.interfaces.every(x=>Math.abs(x.stationaryLeafSignedGap)<1e-8&&Math.abs(x.movingLeafSignedGap)<1e-8&&Math.abs(x.barrelVsMovingFaceSignedGap)<1e-8)).toBe(true);expect(after.scope).toContain('HYPOTHESIS');
 },15000);
});
