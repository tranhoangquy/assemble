import * as THREE from 'three';
import type {PartDefinition,Vector3Tuple} from '@/types/product';
/** Rigid placements for the two completed sides; no wood member moves independently. */
export function standingPose(p:PartDefinition,right:boolean,outboard=0):{position:Vector3Tuple;rotation:Vector3Tuple}{
  const [x,y,z]=p.position;
  const position:Vector3Tuple=right?[116.45+y+outboard,112.5-x,z]:[-119.55+y,112.5+x,-z];
  const root=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,right?0:Math.PI,right?-Math.PI/2:Math.PI/2));
  const base=p.id.includes('cam')?[0,180,0] as Vector3Tuple:p.rotation??[0,0,0];
  const rotation=new THREE.Euler().setFromQuaternion(root.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...base.map(v=>v*Math.PI/180) as Vector3Tuple))));
  return {position,rotation:[rotation.x,rotation.y,rotation.z].map(v=>v*180/Math.PI) as Vector3Tuple};
}
