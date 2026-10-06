import * as THREE from 'three';
import {createFullRuntime} from '../validation/full-validation';
import {polish02Plan} from '../director/polish-pass02';
import {step26Camera} from '../director/final-micro-pass';
const rt=createFullRuntime(true,polish02Plan);
const visible=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(!p.visible)return false;return true;};
const ray=new THREE.Raycaster();
const views=process.env.CAMERA_VIEWS?JSON.parse(process.env.CAMERA_VIEWS) as Array<typeof step26Camera&{id:string}>:[{...step26Camera,id:'current'}];
try{
 for(const view of views){
  for(const [shot,p]of [['S26-target',.7],['S26-eye-align',.5],['S26-eye-align',.9],['S26-verify',.8]] as const){
    const s=rt.shots.get(shot)!;rt.engine.seek(s.start+s.duration*p);rt.root.updateMatrixWorld(true);
    const meshes:THREE.Object3D[]=[];rt.root.traverse(o=>{if(o instanceof THREE.Mesh&&visible(o))meshes.push(o);});
    const origin=new THREE.Vector3(...view.position),object=rt.registry.require('E2--1-eyeB');
    const point=object.getWorldPosition(new THREE.Vector3());ray.set(origin,point.clone().sub(origin).normalize());
    const camera=new THREE.PerspectiveCamera(view.fov,1280/720,1,1800);camera.position.copy(origin);camera.lookAt(new THREE.Vector3(...view.target));camera.updateMatrixWorld(true);
    console.log(JSON.stringify({view:view.id,shot,p,origin:origin.toArray(),eye:point.toArray(),eyeNDC:point.clone().project(camera).toArray(),mountNDC:new THREE.Vector3(-115.4,110,9.5).project(camera).toArray(),first:ray.intersectObjects(meshes,false).slice(0,2).map(h=>({part:h.object.parent?.name,distance:h.distance}))}));
  }
 }
}finally{rt.dispose();}
