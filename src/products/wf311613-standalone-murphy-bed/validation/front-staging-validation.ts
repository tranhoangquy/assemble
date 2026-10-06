import * as THREE from 'three';
import type {DirectorPlan} from '@/types/director';
import {fullProduct, mechanism, sideIds, bedAnchor} from '../product/parts-step21-31';
import {newWoodIds} from '../product/parts-step11-20';
import {frontWorkPlacement, frontWorkPivot} from '../director/front-staging';
import {createFullRuntime} from './full-validation';
import {findActualMeshPenetration} from './folding-leg-validation';

/** Tests the explicitly supplied presentation plan against actual generated
 * meshes. It does not silently compile the historical accepted fullPlan.
 * Product geometry remains identical; only placement/path are under test. */
export function validateFrontStaging(plan:DirectorPlan, samplesPerSegment=90,workspace={placement:frontWorkPlacement,pivot:frontWorkPivot}){
  if(samplesPerSegment<90)throw new Error('Front path validation requires at least 90 samples per segment');
  const rt=createFullRuntime(true,plan),errors=new Set<string>();
  const details:Array<{shot:string;progress:number;moving:string;fixed:string;point:number[];depth:number}>=[];
  const definitions=new Map(fullProduct.parts.map(part=>[part.id,part]));
  const bedRoot=rt.registry.require('bed-motion-root');
  const isBed=(object:THREE.Object3D)=>{for(let p:THREE.Object3D|null=object;p;p=p.parent)if(p===bedRoot)return true;return false;};
  const visible=(object:THREE.Object3D)=>{for(let p:THREE.Object3D|null=object;p;p=p.parent)if(!p.visible)return false;return true;};
  const actualMeshes=()=>new Map([...rt.registry.entries()].flatMap(([id,object])=>{
    const mesh=object.children.find(child=>child instanceof THREE.Mesh);
    return mesh instanceof THREE.Mesh&&visible(mesh)?[[id,mesh] as [string,THREE.Mesh]]:[];
  }));
  const box=(mesh:THREE.Mesh)=>{mesh.geometry.computeBoundingBox();return mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);};
  const pose=(time:number)=>{rt.engine.seek(time);rt.root.updateMatrixWorld(true);};
  const at=(id:string,fraction=0)=>{const shot=rt.shots.get(id);if(!shot)throw new Error(`Missing ${id} in supplied front plan`);return shot.start+shot.duration*fraction;};
  let sampledPoses=0, broadphasePairs=0, actualPairChecks=0, rigidRelativeChecks=0, pistonEndpointChecks=0, maxPistonLinkJump=0, maxCompletedBedJump=0, minBedFloorClearance=Infinity;
  const collisions=(shot:string,progress:number,moving:Map<string,THREE.Mesh>,fixed:Map<string,THREE.Mesh>)=>{
    const bounds=new Map([...moving,...fixed].map(([id,mesh])=>[id,box(mesh)]));
    for(const [id,mesh]of moving)for(const [target,other]of fixed){
      if(id===target)continue;broadphasePairs++;
      if(!bounds.get(id)!.intersectsBox(bounds.get(target)!))continue;
      actualPairChecks++;
      const penetration=findActualMeshPenetration(mesh,other);
      if(penetration){errors.add(`${shot}: ${id} penetrates ${target}`);if(details.length<24)details.push({shot,progress,moving:id,fixed:target,point:penetration.point,depth:penetration.depth});}
    }
  };
  try{
    pose(at('S11-context')-.00001);
    if([...actualMeshes()].some(([,mesh])=>isBed(mesh)))errors.add('A bed part is visible BEFORE the front-work placement');
    pose(at('S11-context')+.00001);
    if(bedRoot.position.distanceTo(new THREE.Vector3(...workspace.placement))>1e-5)errors.add('Empty bed root did not enter front workspace before Step 11');
    if([...actualMeshes()].some(([,mesh])=>isBed(mesh)))errors.add('Front placement moves an already-visible bed assembly');
    pose(rt.ends.get(24)!-.00001);
    if(bedRoot.localToWorld(new THREE.Vector3(...mechanism.sourcePivot)).distanceTo(new THREE.Vector3(...workspace.pivot))>1e-5)errors.add('Completed bed is not in the continuous front workspace at end of Step 24');
    const initial=actualMeshes();
    const rigidMatrices=new Map([...initial].filter(([,mesh])=>isBed(mesh)).map(([id,mesh])=>[id,bedRoot.matrixWorld.clone().invert().multiply(mesh.matrixWorld)]));
    for(const side of [-1,1]){
      const id=`S${side<0?23:24}-retain`,root=rt.registry.require(sideIds(side).piston);
      pose(at(id)-.000001);const before=root.getWorldPosition(new THREE.Vector3());
      pose(at(id)+.000001);const after=root.getWorldPosition(new THREE.Vector3());
      const jump=before.distanceTo(after);maxPistonLinkJump=Math.max(maxPistonLinkJump,jump);
      if(jump>1e-4)errors.add(`E2 side ${side} teleports ${jump} cm at first linkage ownership`);
    }
    for(const id of ['S25-route-4','S25-route-5','S25-route-6']){
      pose(at(id)-.000001);
      const before=bedRoot.localToWorld(new THREE.Vector3(...mechanism.sourcePivot)),orientation=bedRoot.quaternion.clone();
      pose(at(id)+.000001);
      const jump=before.distanceTo(bedRoot.localToWorld(new THREE.Vector3(...mechanism.sourcePivot)));
      maxCompletedBedJump=Math.max(maxCompletedBedJump,jump);
      if(jump>1e-4||orientation.angleTo(bedRoot.quaternion)>1e-5)errors.add(`Completed bed teleports at ${id} instead of a continuous supported approach`);
    }
    // Check the already-visible completed front assembly plus every sample of
    // its three physical segments. Shared-axis seating is actual mesh contact,
    // not a masked receiver or a metadata-only connection assertion.
    const segments=['S25-context','S25-route-4','S25-route-5','S25-route-6'];
    for(const id of segments){
      const count=id==='S25-context'?1:samplesPerSegment;
      for(let i=0;i<=count;i++){
        const progress=i/count;pose(at(id,progress));sampledPoses++;
        const meshes=actualMeshes();
        const moving=new Map([...meshes].filter(([,mesh])=>isBed(mesh)));
        const cabinet=new Map([...meshes].filter(([id,mesh])=>!isBed(mesh)&&id!=='installation-wall'&&!id.startsWith('E2-')));
        collisions(id,progress,moving,cabinet);
        const inverse=bedRoot.matrixWorld.clone().invert();
        for(const [part,matrix]of rigidMatrices){
          const mesh=meshes.get(part);if(!mesh){errors.add(`${id}: secured bed mesh ${part} disappeared`);continue;}
          const now=inverse.clone().multiply(mesh.matrixWorld);
          if(now.elements.some((value,index)=>Math.abs(value-matrix.elements[index])>1e-4))errors.add(`${id}: bed self-relationship changed for ${part}`);
          rigidRelativeChecks++;
        }
        for(const part of newWoodIds){const mesh=meshes.get(part);if(!mesh)continue;const lower=box(mesh).min.y;minBedFloorClearance=Math.min(minBedFloorClearance,lower);if(lower<-.005)errors.add(`${id}: ${part} penetrates floor`);}
        const timber=new Map([...meshes].filter(([part])=>definitions.get(part)?.type==='mesh'&&definitions.get(part)?.category!=='hardware'&&part!=='installation-wall'));
        for(const side of [-1,1]){
          const ids=sideIds(side),piston=rt.registry.require(ids.piston);
          const a=piston.getWorldPosition(new THREE.Vector3());
          const expected=bedRoot.localToWorld(new THREE.Vector3(...bedAnchor(side)));
          const b=rt.registry.require(`${ids.piston}-eyeB`).getWorldPosition(new THREE.Vector3());
          if(a.distanceTo(expected)>1e-4)errors.add(`${id}: E2 ${side} bed endpoint is not rigidly connected`);
          if(b.distanceTo(expected.clone().add(new THREE.Vector3(0,mechanism.freeLength,0)))>1e-4)errors.add(`${id}: E2 ${side} free supported end is not coherent`);
          pistonEndpointChecks+=2;
          const solids=new Map([`${ids.piston}-body`,`${ids.piston}-rod`].map(part=>[part,meshes.get(part)!]));
          collisions(`${id} free E2`,progress,solids,timber);
        }
      }
    }
    pose(at('S25-route-6',1));
    for(const side of [-1,1]){
      const actual=rt.registry.require(sideIds(side).bearing).getWorldPosition(new THREE.Vector3());
      const expected=new THREE.Vector3(side*mechanism.bearingX,mechanism.cabinetPivot[1],mechanism.cabinetPivot[2]);
      if(actual.distanceTo(expected)>1e-4)errors.add(`Front path ends at the wrong bearing/receiver axis on side ${side}`);
    }
    return {valid:!errors.size,errors:[...errors],details,sampledPoses,broadphasePairs,actualPairChecks,rigidRelativeChecks,pistonEndpointChecks,maxPistonLinkJump,maxCompletedBedJump,minBedFloorClearance,
      planId:plan.id,frontWorkPlacement:workspace.placement,frontWorkPivot:workspace.pivot,finalPivot:mechanism.cabinetPivot,
      note:'Actual generated mesh surfaces and solid containment; no ghosting, transparency, physical masks or mate-based collision exemptions. Secured bed relative mesh transforms remain identical at every pose, so the accepted self-assembly topology cannot acquire a new self-intersection. Free E2 ends remain controlled in world-up before cabinet attachment. This does not certify loads or manufacturing tolerances.'};
  }finally{rt.dispose();}
}
