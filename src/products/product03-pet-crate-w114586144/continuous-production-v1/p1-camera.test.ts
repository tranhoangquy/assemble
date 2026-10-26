import {describe,it,expect} from 'vitest';
import {createRuntime} from '../s04-integration-v2/runtime';
import {p1Camera} from './p1-camera';
describe('Product03 P1 camera-only pilot',()=>{
 it('preserves every frozen product/tool pose while seeking forwards and backwards',()=>{
  const r=createRuntime(),seen=new Map<number,string>();
  for(const t of [108,109,110,112.7,115.5,117.9,120.7,123.9,108,115.5,123.9,110]){
   r.evaluate(t);const before=JSON.stringify(r.digest());const c=p1Camera(r,t);expect(JSON.stringify(r.digest())).toBe(before);
   const result=JSON.stringify({p:c.position.toArray(),q:c.quaternion.toArray(),f:c.fov});if(seen.has(t))expect(result).toBe(seen.get(t));seen.set(t,result);
   expect(c.position.toArray().every(Number.isFinite)).toBe(true);
  }
 },30000);
 it('does not change inherited cameras outside its declared entry/pilot/exit window',()=>{
  const r=createRuntime();for(const t of [0,41,69,106.499,125,185,209,278]){const original=r.camera(t),actual=p1Camera(r,t);expect(actual.position.toArray()).toEqual(original.position.toArray());expect(actual.quaternion.toArray()).toEqual(original.quaternion.toArray());}
 },30000);
});
