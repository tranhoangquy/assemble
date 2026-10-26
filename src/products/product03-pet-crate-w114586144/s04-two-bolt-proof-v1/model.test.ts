import {describe,it,expect} from 'vitest';
import {createProof,groups,timing} from './proof';
describe('S04 two bolts per bracket',()=>{
 it('places K before new bolts and retains the first while installing the second, on both sides',()=>{
  const p=createProof();for(const side of groups){const i=side==='left'?1:2,first=p.r.registry.require(`hardware-B-${i*2-1}`),second=p.r.registry.require(`hardware-B-${i*2}`);
   for(const t of [0,1,2.2,2.69]){p.evaluate(side,t);expect(first.visible).toBe(false);expect(second.visible).toBe(false);expect(p.r.registry.require('hardware-L-1').visible).toBe(false);}
   p.evaluate(side,timing.first.end);const pos=first.position.toArray(),q=first.quaternion.toArray();
   for(const t of [7.5,8,9,10,11,12,14]){p.evaluate(side,t);expect(first.visible).toBe(true);expect(first.position.toArray()).toEqual(pos);expect(first.quaternion.toArray()).toEqual(q);}
   expect(p.evaluate(side,14).seated).toHaveLength(side==='left'?2:4);expect(second.visible).toBe(true);
  }
 },20000);
 it('restores exact state after backwards seeks without clipping full screws',()=>{
  const p=createProof(),expected=new Map<string,string>();for(const side of groups)for(const t of [0,14,5,10,2.2,0,10,14,5]){
   const s=p.evaluate(side,t),key=`${side}-${t}`,v=JSON.stringify(p.digest());if(expected.has(key))expect(v).toBe(expected.get(key));expected.set(key,v);expect(s.clippingPlanes).toBe(0);
  }
 },20000);
});
