import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {fullProduct,mechanism,added21To31} from '../product/parts-step21-31';
import {steps01To20Product} from '../product/parts-step11-20';
import {fullPlan} from '../director/steps21-31';
import {steps01To20Plan,steps01To20Video} from '../director/steps11-20';
import {fullVideo} from '../director/steps21-31';
import {correctedReceiverHoles} from '../product/mechanism-reconstruction';
import {evaluatePivotCandidate} from '../validation/pivot-search';
import {createFullRuntime} from '../validation/full-validation';
import {correctFootCorners} from '../product/foot-corner-reconstruction';

// Exact WF311613 fit/hole correction snapshots; other timber locks remain.
const fitHoleGeometryHashes:Record<string,string>={
  "A5": "298f10181777360390866405561294b89fd46c8dade6f350e0914a36636dd426",
  "A7": "f8e49059b0118535677d96776e6664f1eb3f15a6e7c5bee8874937bb5cff73f1",
  "A8": "f8e49059b0118535677d96776e6664f1eb3f15a6e7c5bee8874937bb5cff73f1",
  "A9": "7c3deae51f3365f584e00e0b95690ddc763047df7ab3a7f60006ec5aa4c54b04",
  "A1": "d24c9ca5c76df3d7f3dddc953a6636707975b08d363e652b6002927442c9257f",
  "A3": "d3e61e546a191597bfb1fc12f95a188176395b6b51c0198d22b0e7976528336c",
  "A6": "aebcfe2ade564647d383325494fa15027b4fca918e17f86228ce96d2b7e6cf20",
  "A7-R": "4c8b21edd460cb260729cb785e26168aa5b72f468ce2403c87a550bc35d41788",
  "A8-R": "4c8b21edd460cb260729cb785e26168aa5b72f468ce2403c87a550bc35d41788",
  "A9-R": "1f2026e59f910b3db851eee1c644db18af72475c8b8aaf1c297048b18cc74fbe",
  "A2": "0d2b4654065a074918fb6195d8b65cc16a91a7f5ee7e2013135ad2109339ae9b",
  "A4": "495bcc1e3f39a3172dc834bdddcecc28115efe446a7d28cd0f428fd3eca71c58",
  "E3": "a648fb9ce7f0f16c2d8db211eb5de11eb2552c22d7e2416332be57f63df05043",
  "B9": "bf16221424f5a42ebb95904a6048d7e57890148ed84d56e257328bf38ef9f3e3",
  "D5": "9495318c5104ede892ad999566bb97478d036680baf2ddab85c54a3ef965bcec",
  "D4-1": "27c23d9d514f95d62d800bf0b5be02054a17c1f1888145093b2fd9d67b056edc",
  "D4-2": "27c23d9d514f95d62d800bf0b5be02054a17c1f1888145093b2fd9d67b056edc",
  "B5": "a3dac2e8498364eeb299d3c401dfc4e2f95a9179b138fe23474d6eed1f30e363",
  "B6": "b94c22e044ffe472351c0bba7955e446e5cbbb420d7f8cf43ceee6f2aa8ec7b2"
}
;

describe('Authorized narrow pivot reconstruction',()=>{
  it('preserves every Step 4–20 shot and action duration',()=>{
    for(let i=3;i<20;i++){
      const old=steps01To20Plan.steps[i],now=fullPlan.steps[i];
      expect(now.shots.map(s=>[s.id,s.type,s.duration,s.transition])).toEqual(old.shots.map(s=>[s.id,s.type,s.duration,s.transition]));
      expect(now.shots.map(s=>s.actions.map(a=>[a.type,a.duration,a.at]))).toEqual(old.shots.map(s=>s.actions.map(a=>[a.type,a.duration,a.at])));
    }
  });
  it('keeps B8, other locked wood and materials unchanged',()=>{
    // The additional authorization is LOCAL to these three foot-corner
    // profiles. Their exact authorized reconstruction is checked below;
    // the other existing timber baselines are not broadly exempted.
    const allowed=new Set(['D8','D9','C1-start','C2-left','C2-right']);
    const correctedCorners=structuredClone(steps01To20Product.parts);
    correctFootCorners(correctedCorners);
    for(const part of steps01To20Product.parts){
      const now=fullProduct.parts.find(p=>p.id===part.id)!;
      expect(now.position).toEqual(part.position);
      expect(now.rotation).toEqual(part.rotation);
      expect(now.scale).toEqual(part.scale);
      if(part.type==='mesh'&&now.type==='mesh'){
        expect(now.material).toBe(part.material);
        if(fitHoleGeometryHashes[part.id])expect(createHash('sha256').update(JSON.stringify(now.geometry)).digest('hex')).toBe(fitHoleGeometryHashes[part.id]);
        else if(!allowed.has(part.id))expect(now.geometry).toEqual(part.geometry);
        if(['C1-start','C2-left','C2-right'].includes(part.id)){
          const expected=correctedCorners.find(p=>p.id===part.id)!;
          expect(expected.type).toBe('mesh');
          if(expected.type==='mesh')expect(now.geometry).toEqual(expected.geometry);
        }
      }
    }
    for(const [id,material]of Object.entries(steps01To20Product.materials))expect(fullProduct.materials[id]).toEqual(material);
    expect(fullProduct.rendering).toEqual(steps01To20Product.rendering);
    for(const [id,camera]of Object.entries(steps01To20Video.cameraPresets))expect(fullVideo.cameraPresets[id]).toEqual(camera);
  });
  it('retains handed L receivers and ten PDF mounting screws on each side',()=>{
    expect(correctedReceiverHoles).toHaveLength(10);
    for(const side of [-1,1]){
      const d=fullProduct.parts.find(p=>p.id===(side<0?'D8':'D9'))!;
      expect(d.position).toEqual([side*116.35,80,0]);
      expect(d.type==='mesh'&&d.geometry.type==='profile-prism'&&d.geometry.holes?.length).toBe(10);
      const ids=fullProduct.parts.filter(p=>p.id.startsWith(`S${side<0?10:9}-H21-`));expect(ids).toHaveLength(10);
      for(let i=0;i<10;i++)expect(ids[i].position.slice(1)).toEqual(correctedReceiverHoles[i].slice(1));
    }
  });
  it('passes an actual-mesh full sweep and detects the rejected reconstruction',()=>{
    const fit=evaluatePivotCandidate(mechanism.cabinetPivot[1],mechanism.sourcePivot[2]-260,.25);
    expect(fit.valid).toBe(true);expect(fit.hitCount).toBe(0);
    expect(fit.topClearance).toBeGreaterThan(.4);expect(fit.cabWidthClearance).toBeGreaterThan(.4);
    const old=evaluatePivotCandidate(63,58,5);expect(old.valid).toBe(false);
    expect(old.errors).toContain('C1-start crosses B6');expect(old.errors).toContain('C5 crosses E5');
  },300000);
  it('keeps the last E1 screw pair clear of the actual installed head dowels',()=>{
    const rt=createFullRuntime();
    try{
      rt.engine.seek(rt.ends.get(22)!-.00001);rt.root.updateMatrixWorld(true);
      for(const side of [-1,1])for(const i of [0,1]){
        const screw=rt.registry.require(`S${side<0?21:22}-H21-${i+6}`),dowel=rt.registry.require(`S16-${side}-1-dowel-${i}`);
        const a=new THREE.Box3().setFromObject(screw),b=new THREE.Box3().setFromObject(dowel);
        // All approach/feed translations and spins are along X; this Z
        // separation therefore also bounds their entire installation paths.
        expect(b.min.z-a.max.z).toBeGreaterThan(.49);
      }
    }finally{rt.dispose();}
  },180000);
  it('replays mechanism-owned transforms, visibility and variants after reverse seeks and reset',()=>{
    const rt=createFullRuntime(false);
    const owned=new Set(['bed-motion-root',...added21To31.map(p=>p.id)]);
    const state=()=>fullProduct.parts.filter(p=>owned.has(p.id)).map(p=>{
      const o=rt.registry.require(p.id),mesh=o.children[0];
      return {id:p.id,visible:o.visible,matrix:o.matrixWorld.elements.map(v=>Math.round(v*1e6)/1e6),
        variant:mesh instanceof THREE.Mesh?Object.entries(o.userData.geometryVariants).find(([,g])=>g===mesh.geometry)?.[0]:undefined};
    });
    const time=(id:string,p=.5)=>{const s=rt.shots.get(id)!;return s.start+s.duration*p;};
    const times=[0,time('S23-piston-intro'),time('S23-eye-seat',.2),time('S23-eye-seat',.8),
      time('S25-route-5'),time('S28--1-D7-join'),time('S29-fold-test'),time('final-closed'),time('final-open'),rt.duration-.00001];
    try{
      const expected=times.map(t=>{rt.engine.seek(t);rt.root.updateMatrixWorld(true);return state();});
      for(const i of [9,3,8,1,7,0,6,2,5,4,9,0]){
        rt.engine.seek(times[i]);rt.root.updateMatrixWorld(true);expect(state()).toEqual(expected[i]);
      }
      rt.engine.seek(0);rt.engine.seek(times[9]);rt.root.updateMatrixWorld(true);expect(state()).toEqual(expected[9]);
    }finally{rt.dispose();}
  },180000);
});
