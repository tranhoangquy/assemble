import {describe,it,expect} from 'vitest';
import {fullProduct} from '../product/parts-step21-31';
import {validateFullSeekReset} from '../validation/full-validation';

describe('Complete product scene replay',()=>{
  it('preserves every part, parent, local transform and actual render descendant across reverse seeks and repeated resets',()=>{
    const audit=validateFullSeekReset();
    expect(audit.errors).toEqual([]);
    expect(audit.valid).toBe(true);
    expect(audit.registeredObjects).toBe(fullProduct.parts.length);
    expect(audit.sceneObjects).toBeGreaterThan(audit.registeredObjects);
    expect(audit.comparisons).toBe(fullProduct.parts.length*14);
  },180000);
});
