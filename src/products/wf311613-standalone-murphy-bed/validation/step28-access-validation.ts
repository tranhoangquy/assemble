import * as THREE from 'three';
import {fullPlan} from '../director/steps21-31';
import type {DirectorPlan} from '@/types/director';
import {createFullRuntime} from './full-validation';
import {findActualMeshPenetration} from './folding-leg-validation';

/** Supplement the generic continuous staging/tool-envelope gate with the
 * actual installed meshes. There are no allowed-contact or mate waivers. */
export function validateStep28ActualPaths(plan:DirectorPlan=fullPlan){
  const rt=createFullRuntime(true,plan),errors=new Set<string>();
  let operations=0,sampledPoses=0,meshPairs=0;
  const visible=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(!p.visible)return false;return true;};
  try{
    for(const shot of plan.steps[27].shots)for(const action of shot.actions){
      if(!('target' in action)||!['installPart','installDowel','installNut','installBolt'].includes(action.type))continue;
      operations++;
      const moving=rt.registry.require(action.target),sources:THREE.Mesh[]=[];
      moving.traverse(o=>{if(o instanceof THREE.Mesh)sources.push(o);});
      const sourceSet=new Set(sources),start=rt.shots.get(shot.id)!.start+(action.at??0);
      for(let i=0;i<=24;i++){
        rt.engine.seek(start+(action.duration??0)*i/24);rt.root.updateMatrixWorld(true);sampledPoses++;
        const targets:THREE.Mesh[]=[];
        rt.root.traverse(o=>{if(o instanceof THREE.Mesh&&visible(o)&&!sourceSet.has(o))targets.push(o);});
        for(const source of sources){
          if(!visible(source))continue;
          source.geometry.computeBoundingBox();
          const a=source.geometry.boundingBox!.clone().applyMatrix4(source.matrixWorld);
          for(const target of targets){
            if(!target.geometry.boundingBox)target.geometry.computeBoundingBox();
            const b=target.geometry.boundingBox!.clone().applyMatrix4(target.matrixWorld);
            if(!a.intersectsBox(b))continue;
            meshPairs++;
            const hit=findActualMeshPenetration(source,target);
            if(hit)errors.add(`${action.target} crosses ${target.parent?.name} at ${shot.id} (${i}/24): ${hit.source}`);
          }
        }
      }
    }
    return{valid:!errors.size,errors:[...errors],operations,sampledPoses,meshPairs,
      note:'25 actual timeline samples per installation plus the independent continuous staging/tool-envelope validator. Installed arm children follow their parent. No mate exemptions, transparency, collision masks or radius inflation.'};
  }finally{rt.dispose();}
}
