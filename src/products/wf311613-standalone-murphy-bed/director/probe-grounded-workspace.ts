import * as THREE from 'three';
import {writeFile} from 'node:fs/promises';
import {polishPlan,polishVideo} from './polish-pass01';
import {groundWorkspace} from './grounded-workspace';
import {createFullRuntime} from '../validation/full-validation';
import {newWoodIds} from '../product/parts-step11-20';

async function main(){
const plan=groundWorkspace(polishPlan),rt=createFullRuntime(true,plan),old=createFullRuntime(false,polishPlan);
const failures:unknown[]=[];let minimum=Infinity;
const visible=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(!p.visible)return false;return true;};
const cameras:Record<string,unknown>={},shotCameras:Record<string,string>={},floorCameraCorrections:string[]=[];
for(const step of plan.steps.filter(s=>s.step>=11&&s.step<=24))for(const shot of step.shots){
  const timing=rt.shots.get(shot.id)!;
  for(let i=0;i<=12;i++){
    rt.engine.seek(timing.start+timing.duration*i/12);rt.root.updateMatrixWorld(true);
    for(const id of newWoodIds){const o=rt.registry.require(id),mesh=o.children[0];if(!(mesh instanceof THREE.Mesh)||!visible(mesh))continue;
      const box=new THREE.Box3().setFromObject(mesh),low=box.min.y;minimum=Math.min(minimum,low);
      if(low<-.005&&failures.length<60)failures.push({shot:shot.id,p:i/12,id,low});
    }
  }
  rt.engine.seek(timing.start+timing.duration*.9);old.engine.seek(timing.start+timing.duration*.9);
  rt.root.updateMatrixWorld(true);old.root.updateMatrixWorld(true);
  const transform=rt.registry.require('bed-motion-root').matrixWorld.clone().multiply(old.registry.require('bed-motion-root').matrixWorld.clone().invert());
  const source=polishVideo.cameraPresets[shot.camera!];if(!source)throw new Error(shot.camera);
  const id=`grounded-${shot.id}`;
  const position=new THREE.Vector3(...source.position).applyMatrix4(transform),target=new THREE.Vector3(...source.target).applyMatrix4(transform);
  const underside=shot.id.match(/^S13-C7-(\d)-seat$/);
  if(underside){
    // A grazing historical edge view hides the support profile when the frame
    // is edge-held. Look onto its real underside, retaining lens/distance.
    const distance=position.distanceTo(target),root=rt.registry.require('bed-motion-root');
    const part=rt.registry.require(`C7-${underside[1]}`);
    target.copy(part.getWorldPosition(new THREE.Vector3()));
    const direction=new THREE.Vector3(.35,-1,.45).normalize().applyQuaternion(root.quaternion);
    position.copy(target).addScaledVector(direction,distance);
  }
  // Keep lens and camera-to-joint distance, but view from the clear upper side
  // if rigidly transforming the historical viewpoint would put it under floor.
  if(position.y<2){const delta=position.clone().sub(target);delta.y=Math.abs(delta.y);position.copy(target).add(delta);floorCameraCorrections.push(shot.id);}
  cameras[id]={...source,position:position.toArray(),target:target.toArray()};shotCameras[shot.id]=id;
}
console.log(JSON.stringify({minimum,failures},null,2));
await writeFile('src/products/wf311613-standalone-murphy-bed/director/polish02-workspace-cameras.json',JSON.stringify({cameraPresets:cameras,shotCameras,floorCameraCorrections},null,2));
rt.dispose();old.dispose();
}
main().catch(error=>{console.error(error);process.exitCode=1;});
