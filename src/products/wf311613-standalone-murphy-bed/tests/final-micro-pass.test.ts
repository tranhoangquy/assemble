import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import type {OrbitControls} from 'three-stdlib';
import {CameraEngine} from '@/engine/camera/CameraEngine';
import {ProductEngine} from '@/engine/product/ProductEngine';
import {VideoEngine} from '@/engine/video/VideoEngine';
import {PrefixedVideoEngine,presentationTime} from '@/presentation/intro/PrefixedVideoEngine';
import {createFullRuntime} from '../validation/full-validation';
import {fullProduct} from '../product/parts-step21-31';
import {polish02Plan,polish02Assembly,polish02bVideo} from '../director/polish-pass02b';
import {microVideo,microIntro,step26Camera} from '../director/final-micro-pass';
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
it('micro-pass adds exactly five presentation seconds, without rewriting assembly or showcase',()=>{
  expect(hash(fullProduct)).toBe('29ef4258730c3e3691c84223d98e240d9a25854d079402377f97489ace5f9fb5');
  expect(hash(fullProduct.materials)).toBe('d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc');
  expect(hash(polish02Plan)).toBe('71d51ebb80ef00f1890e29a27490768da8f10382c11a7be4b896c37f58e6c424');
  expect(hash(polish02bVideo)).toBe('f222e140bea7131b36003150b450372689458972b69d4705d3caee7345b76882');
  expect(microVideo.scenes.slice(4)).toEqual(polish02bVideo.scenes);
  expect(microVideo.scenes.slice(4).every((s,i)=>s===polish02bVideo.scenes[i])).toBe(true);
  expect(microVideo.presentation).toBe(polish02bVideo.presentation);
  for(const [id,c]of Object.entries(polish02bVideo.cameraPresets))expect(microVideo.cameraPresets[id]).toBe(id==='S26-cabinet-eye'?step26Camera:c);
  expect(microIntro.heroDuration+microIntro.separationDuration+microIntro.holdDuration+microIntro.transitionDuration).toBe(5);
  expect(microVideo.scenes.reduce((n,s)=>n+s.duration,0)).toBeCloseTo(524.0536938888888,9);
  expect(microIntro.groups.flatMap(g=>g.targets).every(id=>fullProduct.parts.some(p=>p.id===id))).toBe(true);
  const all=microIntro.groups.flatMap(g=>g.targets);expect(new Set(all).size).toBe(all.length);
  expect(microVideo.reviewCaptions).toBe(polish02bVideo.reviewCaptions);
  expect(microVideo.audio).toEqual({music:null,voiceover:null});
});
it('intro/reset wrapper preserves complete registry, geometry variants, camera and local timing',()=>{
  const rt=createFullRuntime(false,polish02Plan);rt.engine.dispose();
  const camera=new THREE.PerspectiveCamera(),target=new THREE.Vector3();
  const controls={target,maxPolarAngle:Math.PI-.15,update:()=>{camera.lookAt(target);camera.updateMatrixWorld(true);}} as OrbitControls;
  const cam=new CameraEngine(camera,controls,microVideo.cameraPresets),tree=ProductEngine.build(fullProduct);
  const state=()=>{rt.root.updateMatrixWorld(true);return [...rt.registry.entries()].map(([id,o])=>{
    const children:unknown[]=[];o.traverse(c=>children.push({p:c.position.toArray(),q:c.quaternion.toArray(),s:c.scale.toArray(),v:c.visible,g:c instanceof THREE.Mesh?c.geometry.uuid:undefined}));return {id,children};
  });};
  const base=new VideoEngine(rt.registry,tree,polish02Assembly,polish02bVideo,cam);base.seek(0);
  const expected=state(),expectedCamera=camera.position.clone(),expectedTarget=target.clone(),fov=camera.fov;
  base.dispose();rt.registry.reset();
  const prefix=new PrefixedVideoEngine(rt.registry,tree,polish02Assembly,microVideo,cam);
  try{
    const introStates=new Map<number,string>();
    for(const t of [0,2.5,3.75,4.125]){prefix.seek(t);introStates.set(t,JSON.stringify(state()));}
    for(const t of [5,2.5,5,0,5,4.125,5,3.75,5]){
      prefix.seek(t);
      if(t===5){expect(state()).toEqual(expected);expect(camera.position.distanceTo(expectedCamera)).toBeLessThan(1e-10);expect(target.distanceTo(expectedTarget)).toBeLessThan(1e-10);expect(camera.fov).toBe(fov);expect(presentationTime(microVideo,t)).toBe(0);}
      else expect(JSON.stringify(state())).toBe(introStates.get(t));
    }
    prefix.seek(5+200);expect(prefix.animation.timeline.time()).toBeCloseTo(200,9);
    prefix.seek(5);expect(state()).toEqual(expected);
    expect(presentationTime(microVideo,5+519)).toBe(519);
  }finally{prefix.dispose();rt.dispose();}
});
