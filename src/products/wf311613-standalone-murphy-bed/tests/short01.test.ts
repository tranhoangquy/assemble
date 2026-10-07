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
import { short01Video } from '../director/short01';
it('Short-directed states equal approved source mechanics including cuts/backward seeks',()=>{
 const rt=createFullRuntime(false,polish02Plan);rt.engine.dispose();rt.registry.reset();
 const camera=new THREE.PerspectiveCamera(),target=new THREE.Vector3();
 const controls={target,maxPolarAngle:Math.PI-.15,update:()=>{camera.lookAt(target);camera.updateMatrixWorld(true);}} as OrbitControls;
 const tree=ProductEngine.build(fullProduct);
 const state=()=>{rt.root.updateMatrixWorld(true);return JSON.stringify([...rt.registry.entries()].map(([id,o])=>{const children:unknown[]=[];o.traverse(c=>children.push({p:c.position.toArray(),q:c.quaternion.toArray(),s:c.scale.toArray(),v:c.visible,g:c instanceof THREE.Mesh?c.geometry.uuid:undefined}));return {id,children};}),(_key,value)=>typeof value==='number'?Math.round(value*1e9)/1e9:value);};
 let cursor=0;const times=short01Video.scenes.flatMap(s=>{const start=cursor;cursor+=s.duration;return [start,start+s.duration*.5,cursor-1/30];});
 const source=new PrefixedVideoEngine(rt.registry,tree,polish02Assembly,microVideo,new CameraEngine(camera,controls,microVideo.cameraPresets));
 const expected=new Map<number,string>();for(const t of times){source.seek(editorialSourceTime(short01Video,t));expected.set(t,state());}source.dispose();rt.registry.reset();
 const short=new EditorialVideoEngine(rt.registry,tree,polish02Assembly,short01Video,new CameraEngine(camera,controls,short01Video.cameraPresets));
 try {for(const t of [...times,...times.slice().reverse()]){short.seek(t);const actual=JSON.parse(state()), prior=JSON.parse(expected.get(t)!); const differences=actual.filter((x:unknown,i:number)=>JSON.stringify(x)!==JSON.stringify(prior[i]));expect(differences.map((x:{id:string})=>x.id),`State differences at ${t}: ${JSON.stringify(differences.slice(0,1).map((x:{id:string})=>({actual:x,expected:prior.find((p:{id:string})=>p.id===x.id)}))).slice(0,1400)}`).toEqual([]);expect(short.time).toBeCloseTo(t,6);}}
 finally {short.dispose();rt.dispose();}
},60000);

it('keeps the moving cap and both carrier/face assemblies inside the vertical action region',async()=>{
 const {materialCells}=await import('../validation/full-validation');
 const {capWood}=await import('../product/parts-step04-10');
 const {carrierWood,faceGridWood}=await import('../product/parts-step11-20');
 const {short01Shots}=await import('../director/short01');
 const rt=createFullRuntime(false,polish02Plan);rt.engine.dispose();rt.registry.reset();
 const sourceCamera=new THREE.PerspectiveCamera(),target=new THREE.Vector3();
 const controls={target,maxPolarAngle:Math.PI-.15,update:()=>{sourceCamera.lookAt(target);sourceCamera.updateMatrixWorld(true);}} as OrbitControls;
 const engine=new PrefixedVideoEngine(rt.registry,ProductEngine.build(fullProduct),polish02Assembly,microVideo,new CameraEngine(sourceCamera,controls,microVideo.cameraPresets));
 const definitions=new Map(fullProduct.parts.map(p=>[p.id,p]));
 try {
  for(const id of ['cabinet-cap-lift','cabinet-cap-seat','bed-carrier-lift','bed-carrier-seat']){
   const shot=short01Shots.find(s=>s.id===id)!,preset=short01Video.cameraPresets[shot.camera];
   const camera=new THREE.PerspectiveCamera(preset.fov,9/16,.1,10000);camera.position.set(...preset.position);camera.lookAt(new THREE.Vector3(...preset.target));camera.updateMatrixWorld(true);
   const parts=id.startsWith('cabinet')?capWood:[...carrierWood,...faceGridWood];
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
