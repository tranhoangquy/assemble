import {describe,it,expect} from 'vitest';
import {createRuntime} from './runtime';
import {createProof} from '../s04-two-bolt-proof-v1/proof';
describe('bounded S04 integration V2',()=>{
 it('retains all four B and both K through later steps and rig inversion',()=>{
  const r=createRuntime();for(const t of [69,85,103,112.1,113.4,132,173,209.2,211,247,262,278]){
   const s=r.evaluate(t);for(const id of ['hardware-K-1','hardware-K-2',...Array.from({length:4},(_,i)=>`hardware-B-${i+1}`)]){expect(r.r.registry.require(id).visible).toBe(true);expect(s.hardwareSeated).toContain(id);}
  }
  const final=r.evaluate(278);expect(final.installed).toHaveLength(20);expect(final.hardwareSeated).toHaveLength(84);expect(final.posedHeld).toHaveLength(12);expect(final.pending).toHaveLength(4);
 },30000);
 it('matches accepted S04 at exact right-side visibility boundaries',()=>{
  const r=createRuntime(),p=createProof();for(const [global,local,id]of [[57.7,2.7,'hardware-B-3'],[62.7,7.7,'hardware-B-4']] as const){
   r.evaluate(global);p.evaluate('right',local);const a=r.r.registry.require(id),b=p.r.registry.require(id);expect(a.visible).toBe(true);expect(a.visible).toBe(b.visible);expect(a.position.toArray()).toEqual(b.position.toArray());expect(a.quaternion.toArray()).toEqual(b.quaternion.toArray());
  }
 },30000);
 it('restores exact poses and visibility after backwards seeks and camera calls',()=>{
  const r=createRuntime(),seen=new Map<number,string>();for(const t of [0,278,41,55,57.7,62.7,69,113,211,0,55,69,278,57.7,41]){r.evaluate(t);r.camera(t);const state=JSON.stringify(r.digest());if(seen.has(t))expect(state).toBe(seen.get(t));seen.set(t,state);}
 },30000);
});
