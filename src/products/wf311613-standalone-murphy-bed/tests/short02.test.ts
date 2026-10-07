import { it,expect } from 'vitest';
import * as THREE from 'three';
import type { OrbitControls } from 'three-stdlib';
import { CameraEngine } from '@/engine/camera/CameraEngine';
import { ProductEngine } from '@/engine/product/ProductEngine';
import { PrefixedVideoEngine } from '@/presentation/intro/PrefixedVideoEngine';
import { EditorialVideoEngine,editorialSourceTime } from '@/engine/video/EditorialVideoEngine';
import { createFullRuntime } from '../validation/full-validation';
import { fullProduct } from '../product/parts-step21-31';
import { microVideo,polish02Plan,polish02Assembly } from '../director/final-micro-pass';
import { short02Video } from '../director/short02';
it('Short-directed states equal approved source mechanics including cuts/backward seeks',()=>{
 const rt=createFullRuntime(false,polish02Plan);rt.engine.dispose();rt.registry.reset();
 const camera=new THREE.PerspectiveCamera(),target=new THREE.Vector3();
 const controls={target,maxPolarAngle:Math.PI-.15,update:()=>{camera.lookAt(target);camera.updateMatrixWorld(true);}} as OrbitControls;
 const tree=ProductEngine.build(fullProduct);
 const state=()=>{rt.root.updateMatrixWorld(true);return JSON.stringify([...rt.registry.entries()].map(([id,o])=>{const children:unknown[]=[];o.traverse(c=>children.push({p:c.position.toArray(),q:c.quaternion.toArray(),s:c.scale.toArray(),v:c.visible,g:c instanceof THREE.Mesh?c.geometry.uuid:undefined}));return {id,children};}),(_key,value)=>typeof value==='number'?Math.round(value*1e9)/1e9:value);};
 let cursor=0;const times=short02Video.scenes.flatMap(s=>{const start=cursor;cursor+=s.duration;return [start,start+s.duration*.5,cursor-1/30];});
 const source=new PrefixedVideoEngine(rt.registry,tree,polish02Assembly,microVideo,new CameraEngine(camera,controls,microVideo.cameraPresets));
 const expected=new Map<number,string>();for(const t of times){source.seek(editorialSourceTime(short02Video,t));expected.set(t,state());}source.dispose();rt.registry.reset();
 const short=new EditorialVideoEngine(rt.registry,tree,polish02Assembly,short02Video,new CameraEngine(camera,controls,short02Video.cameraPresets));
 try {for(const t of [...times,...times.slice().reverse()]){short.seek(t);const actual=JSON.parse(state()), prior=JSON.parse(expected.get(t)!); const differences=actual.filter((x:unknown,i:number)=>JSON.stringify(x)!==JSON.stringify(prior[i]));expect(differences.map((x:{id:string})=>x.id),`State differences at ${t}: ${JSON.stringify(differences.slice(0,1).map((x:{id:string})=>({actual:x,expected:prior.find((p:{id:string})=>p.id===x.id)}))).slice(0,1400)}`).toEqual([]);expect(short.time).toBeCloseTo(t,6);}}
 finally {short.dispose();rt.dispose();}
},60000);

it('keeps the moving cap and both carrier/face assemblies inside the vertical action region',async()=>{
 const {materialCells}=await import('../validation/full-validation');
 const {capWood}=await import('../product/parts-step04-10');
 const {carrierWood,faceGridWood}=await import('../product/parts-step11-20');
 const {short02Shots}=await import('../director/short02');
 const rt=createFullRuntime(false,polish02Plan);rt.engine.dispose();rt.registry.reset();
 const sourceCamera=new THREE.PerspectiveCamera(),target=new THREE.Vector3();
 const controls={target,maxPolarAngle:Math.PI-.15,update:()=>{sourceCamera.lookAt(target);sourceCamera.updateMatrixWorld(true);}} as OrbitControls;
 const engine=new PrefixedVideoEngine(rt.registry,ProductEngine.build(fullProduct),polish02Assembly,microVideo,new CameraEngine(sourceCamera,controls,microVideo.cameraPresets));
 const definitions=new Map(fullProduct.parts.map(p=>[p.id,p]));
 try {
  for(const id of ['cabinet-cap-lift','cabinet-cap-seat','bed-carrier-lift','bed-carrier-seat','hook-opening','final-close','final-open','final-hero']){
   const shot=short02Shots.find(s=>s.id===id)!,preset=short02Video.cameraPresets[shot.camera];
   const camera=new THREE.PerspectiveCamera(preset.fov,9/16,.1,10000);camera.position.set(...preset.position);camera.lookAt(new THREE.Vector3(...preset.target));camera.updateMatrixWorld(true);
   const parts=id.startsWith('cabinet')?capWood:id.startsWith('hook')||id.startsWith('final')?fullProduct.parts.filter(p=>p.type==='mesh'&&p.material.startsWith('oak-')).map(p=>p.id):[...carrierWood,...faceGridWood];
   for(let sample=0;sample<=10;sample++){
    engine.seek(shot.sourceIn+(shot.sourceOut-shot.sourceIn)*sample/10);rt.root.updateMatrixWorld(true);
    for(const part of parts){const definition=definitions.get(part)!;if(definition.type!=='mesh')continue;const object=rt.registry.require(part);if(!object.visible)continue;
     // Conservative material-cell corners from approved geometry definitions;
     // no replacement geometry is added to the production renderer.
     for(const box of materialCells(definition.geometry))for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const point=new THREE.Vector3(x,y,z).applyMatrix4(object.matrixWorld).project(camera);
      expect(Math.abs(point.x),`${id}/${part}: horizontal clipping at ${sample}`).toBeLessThan(.8);
      expect(point.y,`${id}/${part}: caption/edge overlap at ${sample}`).toBeLessThan(.7);
      expect(point.y,`${id}/${part}: bottom clipping at ${sample}`).toBeGreaterThan(-.7);
     }
    }
   }
  }
 }finally {engine.dispose();rt.dispose();}
},60000);


it('keeps the locked product, independent identity and complete functional story',async()=>{
 const {createHash}=await import('node:crypto');
 const {short02Shots}=await import('../director/short02');
 const {short01Video,short01Shots}=await import('../director/short01');
 expect(createHash('sha256').update(JSON.stringify(fullProduct)).digest('hex')).toBe('29ef4258730c3e3691c84223d98e240d9a25854d079402377f97489ace5f9fb5');
 expect(short02Video.id).not.toBe(short01Video.id);
 expect(short02Shots.slice(0,3).map(s=>s.duration)).toEqual([.6,.9,.5]);
 expect(short02Shots.slice(-4).map(s=>[s.id,s.duration])).toEqual([['final-finished',1],['final-close',2],['final-open',2],['final-hero',1]]);
 expect(short02Shots.filter(s=>short01Shots.slice(2,16).some(old=>old.id===s.id)).reduce((n,s)=>n+s.duration,0)).toBeCloseTo(22);
 expect(short02Shots.find(s=>s.id==='attach-context')!.duration).toBe(.6);
 expect(short02Video.editorial!.source).toBe(microVideo);
 const rt=createFullRuntime(false,polish02Plan);rt.engine.dispose();rt.registry.reset();
 const camera=new THREE.PerspectiveCamera(),target=new THREE.Vector3();
 const controls={target,update:()=>{camera.lookAt(target);camera.updateMatrixWorld(true);}} as OrbitControls;
 const engine=new EditorialVideoEngine(rt.registry,ProductEngine.build(fullProduct),polish02Assembly,short02Video,new CameraEngine(camera,controls,short02Video.cameraPresets));
 const bed=rt.registry.require('bed-motion-root');
 try {
  engine.seek(44.5);const start=bed.quaternion.clone();engine.seek(46-1e-7);
  expect(THREE.MathUtils.radToDeg(start.angleTo(bed.quaternion))).toBeCloseTo(15,3);
  engine.seek(0);const closed=bed.quaternion.clone();engine.seek(1.5);const open=bed.quaternion.clone();
  expect(THREE.MathUtils.radToDeg(closed.angleTo(open))).toBeCloseTo(90,3);
  engine.seek(54.999999);expect(bed.quaternion.angleTo(closed)).toBeLessThan(1e-5);
  engine.seek(57);expect(bed.quaternion.angleTo(open)).toBeLessThan(1e-5);
  const snapshot=()=>JSON.stringify([...rt.registry.entries()].map(([id,o])=>({id,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible})),(_key,value)=>typeof value==='number'?Math.round(value*1e6)/1e6:value);
  for(const [left,right] of [[0,.6],[52,53],[54.999999,55],[56.999999,57]]){engine.seek(left);const prior=snapshot();engine.seek(right);expect(snapshot(),`Full registry continuity ${left} → ${right}`).toBe(prior);}
  engine.seek(2);expect(rt.registry.require('S31-H15-0').visible).toBe(false);
 }finally{engine.dispose();rt.dispose();}
},60000);

it('rejects checkpoint identity reuse across Short01, Short02 and Long',async()=>{
 const {createRenderIdentity,renderIdentityHash,hashVideoDefinition}=await import('@/engine/export/RenderIdentity');
 const {getRenderProfile}=await import('@/engine/export/RenderProfiles');
 const {short01Video}=await import('../director/short01');
 const identity=(v:typeof microVideo)=>renderIdentityHash(createRenderIdentity('wf311613-final-micro-pass',v.id,hashVideoDefinition(v),getRenderProfile(v===microVideo?'720p':'vertical-1080p')));
 expect(new Set([identity(short01Video),identity(short02Video),identity(microVideo)]).size).toBe(3);
});
