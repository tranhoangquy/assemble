import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {createFullRuntime} from './full-validation';
import {fullProduct,legTimber,legHardware,mechanism,sideIds,legAnchor} from '../product/parts-step21-31';
import {legReconstruction} from '../product/foot-corner-reconstruction';

/** Distance measurement only. Collision acceptance remains the independent
 * solid-containment gate; these distances never waive an intersection. */
export function measureMechanismClearances(){
  const rt=createFullRuntime(),trees=new WeakMap<THREE.BufferGeometry,MeshBVH>();
  const tree=(g:THREE.BufferGeometry)=>{let t=trees.get(g);if(!t){t=new MeshBVH(g);trees.set(g,t);g.boundsTree=t;}return t;};
  const mesh=(id:string)=>rt.registry.require(id).children[0] as THREE.Mesh;
  const box=(m:THREE.Mesh)=>{if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();return m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld);};
  const boxDistance=(a:THREE.Box3,b:THREE.Box3)=>Math.hypot(...['x','y','z'].map(k=>{
    const axis=k as 'x'|'y'|'z';return Math.max(0,a.min[axis]-b.max[axis],b.min[axis]-a.max[axis]);
  }));
  const pose=(bedAngle:number,legAngle:number)=>{
    const root=rt.registry.require('bed-motion-root');root.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),bedAngle*Math.PI/180);
    root.position.set(...mechanism.cabinetPivot).sub(new THREE.Vector3(...mechanism.sourcePivot).applyQuaternion(root.quaternion));
    for(const side of [-1,1]){const leg=rt.registry.require(sideIds(side).leg),p=new THREE.Vector3(...legAnchor(side));
      leg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),legAngle*Math.PI/180);leg.position.copy(p).sub(p.clone().applyQuaternion(leg.quaternion));}
    rt.root.updateMatrixWorld(true);
  };
  const closest=(sources:string[],targets:string[],best:{cm:number;moving?:string;fixed?:string;angle?:number},angle:number)=>{
    const targetBoxes=targets.map(id=>({id,b:box(mesh(id))}));
    for(const id of sources){const source=mesh(id),a=box(source);
      for(const target of targetBoxes){if(boxDistance(a,target.b)>=best.cm)continue;
        const fixed=mesh(target.id);tree(fixed.geometry);
        const transform=source.matrixWorld.clone().invert().multiply(fixed.matrixWorld);
        const result=tree(source.geometry).closestPointToGeometry(fixed.geometry,transform,undefined,undefined,0,best.cm);
        if(result&&result.distance<best.cm)Object.assign(best,{cm:result.distance,moving:id,fixed:target.id,angle});
      }
    }
  };
  try{
    rt.engine.seek(rt.duration-.00001);rt.root.updateMatrixWorld(true);
    const foot={cm:Infinity},cabinet={cm:Infinity};let supportedFloor=Infinity;
    for(let i=0;i<=360;i++){
      const angle=-90+i*.25;pose(legReconstruction.supportedBedAngle,angle);
      closest([...legTimber,...legHardware],['C1-start','C2-left','C2-right'],foot,angle);
      for(const id of legTimber){const m=mesh(id),p=m.geometry.getAttribute('position'),e=m.matrixWorld.elements;
        for(let j=0;j<p.count;j++)supportedFloor=Math.min(supportedFloor,e[1]*p.getX(j)+e[5]*p.getY(j)+e[9]*p.getZ(j)+e[13]);}
    }
    const fixed=fullProduct.parts.filter(p=>p.type==='mesh'&&!p.parent).map(p=>p.id);
    for(let i=0;i<=348;i++){const angle=3+i*.25;pose(angle,-90);closest([...legTimber,...legHardware],fixed,cabinet,angle);}
    return{supportedLegFootCorner:foot,storedLegCabinet: cabinet,minSupportedTimberFloorCm:supportedFloor,
      angularIncrement:.25,legSamples:361,closingSamples:349,
      note:'Actual generated triangle surface distances, rigid world-space transforms. Joint contact is separately tested as a solid penetration, not accepted by a minimum-distance rule. Scene centimetres, not manufacturer tolerances.'};
  }finally{rt.dispose();}
}
