import {describe,it,expect} from 'vitest';
import {evaluatePivotCandidate,evaluateAttachedPistonSweep} from '../validation/pivot-search';
import {fullProduct} from '../product/parts-step21-31';
import {steps01To20Product} from '../product/parts-step11-20';
import {correctFootCorners} from '../product/foot-corner-reconstruction';
import {correctReceiverReconstruction} from '../product/mechanism-reconstruction';

describe('independent receiver-axis kinematics',()=>{
  it('clears every locked timber over a quarter-degree complete articulation sweep',()=>{
    const result=evaluatePivotCandidate(36.5,80,.25);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.angularIncrement).toBe(.25);
    expect(result.meshPairs).toBe(0);
    expect(result.minFloorClearance).toBeGreaterThan(12.7);
    expect(result.topClearance).toBeGreaterThan(.45);
    expect(result.rearClearance).toBeGreaterThan(2.4);
    expect(result.cabWidthClearance).toBeGreaterThan(.45);
  },180_000);
  it('detects the legacy pivot contradiction rather than waiving cabinet contacts',()=>{
    const result=evaluatePivotCandidate(63,58,5);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('C1-start crosses B6');
    expect(result.errors).toContain('C8-left crosses B8-4--1');
    expect(result.errors).toContain('C5 crosses E5');
    // The exact nominal bore shell no longer grows the timber envelope by
    // a floating-point sliver. The legacy contradiction remains ~4 cm.
    expect(result.topClearance).toBeCloseTo(-4,4);
    expect(result.topClearance).toBeLessThan(-3.99);
    expect(result.hitCount).toBeGreaterThan(50);
  },180_000);
  it('keeps both attached E2 ends and actual cylinder/rod solids clear across the entire articulation',()=>{
    const result=evaluateAttachedPistonSweep(.25);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.cylinderChecks).toBeGreaterThan(100_000);
    expect(result.minLength).toBeGreaterThan(result.bodyLength);
    expect(result.maxLength).toBeLessThan(result.maximumLength);
  },180_000);
  it('locks B8 and the corrected receivers while allowing only the authorized local foot-corner reconstruction',()=>{
    const authorized=structuredClone(steps01To20Product.parts);
    correctReceiverReconstruction(authorized);
    correctFootCorners(authorized);
    const locked=(id:string)=>id.startsWith('B8-')||['C1-start','C2-left','C2-right','D8','D9'].includes(id);
    for(const approved of steps01To20Product.parts.filter(p=>locked(p.id))){
      const current=fullProduct.parts.find(p=>p.id===approved.id)!;
      const expected=authorized.find(p=>p.id===approved.id)!;
      expect(current.type==='mesh'?current.geometry:undefined).toEqual(expected.type==='mesh'?expected.geometry:undefined);
      expect(current.position).toEqual(approved.position);
      expect(current.rotation).toEqual(approved.rotation);
      expect(current.type==='mesh'?current.material:undefined).toEqual(approved.type==='mesh'?approved.material:undefined);
    }
    for(const [id,material]of Object.entries(steps01To20Product.materials))expect(fullProduct.materials[id]).toEqual(material);
  });
});
