import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {createFullRuntime} from './full-validation';
import type {DirectorPlan} from '@/types/director';
import {fullPlan} from '../director/steps21-31';
import {fullProduct,mechanism,sideIds,legAnchor,bedAnchor,cabAnchor,legTimber,legHardware} from '../product/parts-step21-31';
import {legReconstruction} from '../product/foot-corner-reconstruction';

/** All distances are scene centimetres. Only sub-0.05-mm boundary contact
 * is tolerated. No part ID, mate list or collision mask waives a solid. */
const CONTACT=.005;
const trees=new WeakMap<THREE.BufferGeometry,MeshBVH>();
const vertices=new WeakMap<THREE.BufferGeometry,THREE.Vector3[]>();
const components=new WeakMap<THREE.BufferGeometry,THREE.Vector3[]>();
const directions=[new THREE.Vector3(1,.371,.619),new THREE.Vector3(.293,1,.557),new THREE.Vector3(.419,.233,1)].map(v=>v.normalize());
function tree(geometry:THREE.BufferGeometry){
  let value=trees.get(geometry);
  if(!value){value=new MeshBVH(geometry,{maxLeafTris:8});trees.set(geometry,value);}
  return value;
}
function points(geometry:THREE.BufferGeometry){
  let values=vertices.get(geometry);
  if(!values){const p=geometry.getAttribute('position'),unique=new Map<string,THREE.Vector3>();
    for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);unique.set(`${v.x},${v.y},${v.z}`,v);}
    values=[...unique.values()];vertices.set(geometry,values);
  }return values;
}
function bounds(mesh:THREE.Mesh){if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();return mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);}
function componentPoints(geometry:THREE.BufferGeometry){
  let result=components.get(geometry);if(result)return result;
  const p=geometry.getAttribute('position'),index=geometry.index,ids=new Map<string,number>(),coordinates:THREE.Vector3[]=[],vertexIds:number[]=[],parents:number[]=[];
  for(let i=0;i<p.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(x=>Math.round(x*1e6)).join(',');let id=ids.get(key);
    if(id===undefined){id=coordinates.length;ids.set(key,id);coordinates.push(v);parents.push(id);}vertexIds.push(id);
  }
  const find=(id:number):number=>parents[id]===id?id:(parents[id]=find(parents[id]));
  const join=(a:number,b:number)=>{const ra=find(a),rb=find(b);if(ra!==rb)parents[rb]=ra;};
  for(let i=0;i<(index?.count??p.count);i+=3){const a=vertexIds[index?index.getX(i):i],b=vertexIds[index?index.getX(i+1):i+1],c=vertexIds[index?index.getX(i+2):i+2];join(a,b);join(b,c);}
  result=[...new Map(coordinates.map((v,i)=>[find(i),v])).values()];components.set(geometry,result);return result;
}

/** Oriented crossing sum rather than odd/even parity: compound overlapping
 * solids must form a union, not cancel to a fictitious empty region. Actual
 * oppositely oriented bore walls make the bore remain empty. */
function strictlyInside(mesh:THREE.Mesh,p:THREE.Vector3,tolerance:number){
  if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
  if(!mesh.geometry.boundingBox!.containsPoint(p))return false;
  const bvh=tree(mesh.geometry);
  const e=mesh.matrixWorld.elements,maxScale=Math.max(Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10]));
  // Conservative world-space contact tolerance, including the scaled piston
  // rod: never forgive a large physical intrusion using local scaled units.
  const localTolerance=tolerance/maxScale,nearest=bvh.closestPointToPoint(p,undefined,0,localTolerance);
  // In the installed BVH version a root leaf can return a nearest result
  // beyond maxThreshold. Inspect its actual distance, not result existence.
  if(nearest&&nearest.distance<=localTolerance)return false;
  let votes=0;
  for(const direction of directions){
    const hits=bvh.raycast(new THREE.Ray(p,direction),THREE.DoubleSide).sort((a,b)=>a.distance-b.distance);
    let winding=0;
    for(let i=0;i<hits.length;){
      const distance=hits[i].distance;let entering=false,leaving=false;
      do{const normal=hits[i].face?.normal;if(normal){const sign=normal.dot(direction);entering ||= sign< -1e-8;leaving ||= sign>1e-8;}i++;}while(i<hits.length&&Math.abs(hits[i].distance-distance)<1e-6);
      // Coincident internal faces of touching compound pieces cancel.
      if(entering!==leaving)winding+=entering?-1:1;
    }
    if(winding!==0)votes++;
  }
  return votes>=2;
}

export interface MeshPenetration {point:number[];source:'contained-vertex'|'triangle-intersection';depth:number;}
/** Exact generated surfaces + solid containment. Mere coplanar seating
 * contact is not a penetration. A bolt is accepted only if its actual bore
 * leaves its volume outside the timber; no metadata mate exemption exists. */
export function findActualMeshPenetration(a:THREE.Mesh,b:THREE.Mesh,tolerance=CONTACT):MeshPenetration|undefined{
  const overlap=bounds(a).intersect(bounds(b));
  if(overlap.isEmpty()||Math.min(...overlap.getSize(new THREE.Vector3()).toArray())<=tolerance)return;
  const inverseA=a.matrixWorld.clone().invert(),inverseB=b.matrixWorld.clone().invert();
  const result=(world:THREE.Vector3,target:THREE.Mesh,local:THREE.Vector3,source:MeshPenetration['source']):MeshPenetration=>({
    point:world.toArray(),source,depth:tree(target.geometry).closestPointToPoint(local)!.point.clone().applyMatrix4(target.matrixWorld).distanceTo(world),
  });
  let hit:MeshPenetration|undefined;
  const relative=inverseA.clone().multiply(b.matrixWorld),line=new THREE.Line3();
  const aTree=tree(a.geometry),bTree=tree(b.geometry);
  const boundariesCross=aTree.bvhcast(bTree,relative,{intersectsTriangles:(t1,t2)=>t1.intersectsTriangle(t2)});
  const containment=()=>{
    // If two closed surfaces do not cross, inside/outside is constant over
    // each connected surface component. Check every actual mesh component,
    // including compound bolt head/shaft/thread pieces, not just one part.
    for(const [source,target,inverse]of [[a,b,inverseB],[b,a,inverseA]] as const)for(const p of componentPoints(source.geometry)){
      const world=p.clone().applyMatrix4(source.matrixWorld),local=world.clone().applyMatrix4(inverse);
      if(strictlyInside(target,local,tolerance))return result(world,target,local,'contained-vertex');
    }
  };
  if(!boundariesCross)return containment();
  const probe=(point:THREE.Vector3,n1:THREE.Vector3,n2:THREE.Vector3)=>{
    const world=point.clone().applyMatrix4(a.matrixWorld);
    const normalMatrix=new THREE.Matrix3().getNormalMatrix(a.matrixWorld);
    const worldN1=n1.clone().applyNormalMatrix(normalMatrix),worldN2=n2.clone().applyNormalMatrix(normalMatrix);
    for(const scale of [2,4,8])for(const sign1 of [-1,1])for(const sign2 of [-1,1]){
      const candidate=world.clone().addScaledVector(worldN1,sign1*tolerance*scale).addScaledVector(worldN2,sign2*tolerance*scale);
      const pa=candidate.clone().applyMatrix4(inverseA),pb=candidate.clone().applyMatrix4(inverseB);
      if(strictlyInside(a,pa,tolerance)&&strictlyInside(b,pb,tolerance)){
        hit=result(candidate,a,pa,'triangle-intersection');return true;
      }
    }return false;
  };
  aTree.bvhcast(bTree,relative,{intersectsTriangles:(t1,t2)=>{
    if(!t1.intersectsTriangle(t2))return false;
    const n1=t1.getNormal(new THREE.Vector3()),n2=t2.getNormal(new THREE.Vector3());
    // Oppositely facing coincident triangles are actual seated boundary
    // contact: their solid interiors lie on opposite sides of that face.
    // This excludes only this proved contact triangle, never a part/mate or
    // a bore wall; other penetrating triangles remain fully tested.
    if(n1.dot(n2)< -1+1e-8&&Math.abs(t2.a.clone().sub(t1.a).dot(n1))<=tolerance)return false;
    for(const [triangle,target,inverse]of [[t1,b,inverseB],[t2,a,inverseA]] as const)for(const point of [triangle.a,triangle.b,triangle.c,triangle.getMidpoint(new THREE.Vector3())]){
      const world=point.clone().applyMatrix4(a.matrixWorld),local=world.clone().applyMatrix4(inverse);
      if(strictlyInside(target,local,tolerance)){hit=result(world,target,local,'contained-vertex');return true;}
    }
    if(Math.abs(n1.dot(n2))>1-1e-8){
      // ExtendedTriangle cannot return a unique intersection line for
      // coplanar triangles. Probe their actual shared face, not a BVH box.
      for(const p of [t1.getMidpoint(new THREE.Vector3()),t2.getMidpoint(new THREE.Vector3()),t1.a,t1.b,t1.c,t2.a,t2.b,t2.c]){
        const q1=t1.closestPointToPoint(p,new THREE.Vector3()),q2=t2.closestPointToPoint(p,new THREE.Vector3());
        if(q1.distanceToSquared(p)<=tolerance*tolerance&&q2.distanceToSquared(p)<=tolerance*tolerance&&probe(p,n1,n2))return true;
      }return false;
    }
    return t1.intersectsTriangle(t2,line)&&probe(line.getCenter(new THREE.Vector3()),n1,n2);
  }});
  return hit??containment();
}

interface CollisionDetail extends MeshPenetration {phase:string;bedAngle:number;legAngle:number;moving:string;fixed:string;}
/** Separately posed connected mechanism, independent of edit/camera timing.
 * Sequence: usable open -> supported lift -> fold -> close -> reopen ->
 * deploy under support -> lower to usable open. */
export function validateFoldingLegFunction(angularIncrement=.25,plan:DirectorPlan=fullPlan){
  if(!Number.isFinite(angularIncrement)||angularIncrement<=0||angularIncrement>.25)throw new Error('Folding-leg validation requires an increment of at most 0.25 degrees');
  const rt=createFullRuntime(true,plan),errors=new Set<string>(),details:CollisionDetail[]=[],failedPhases=new Set<string>();
  const movingIds=[...legTimber,...legHardware];
  const jointIds=[-1,1].flatMap(side=>[10,9,2].map(n=>`S29-${side}-H${n}`));
  const moving=new Set([...movingIds,...jointIds]);
  const meshes=new Map<string,THREE.Mesh>();
  const seenPairs=new Map<string,MeshPenetration|undefined>();
  let sampledPoses=0,broadphasePairs=0,actualPairChecks=0,cachedPairChecks=0,floorVertexChecks=0,minFloorClearance=Infinity;
  const phaseSamples:Record<string,number>={};
  const checkpoints:Array<{progress:number;bedAngle:number;legAngle:number;leftPivot:number[];rightPivot:number[];minFloorClearance:number}>=[];
  const root=rt.registry.require('bed-motion-root');
  const bedPivot=new THREE.Vector3(...mechanism.cabinetPivot),sourcePivot=new THREE.Vector3(...mechanism.sourcePivot);
  const pose=(bedAngle:number,legAngle:number)=>{
    root.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),bedAngle*Math.PI/180);
    root.position.copy(bedPivot).sub(sourcePivot.clone().applyQuaternion(root.quaternion));
    for(const side of [-1,1]){
      const leg=rt.registry.require(sideIds(side).leg),pivot=new THREE.Vector3(...legAnchor(side));
      leg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),legAngle*Math.PI/180);
      leg.position.copy(pivot).sub(pivot.clone().applyQuaternion(leg.quaternion));
    }
    rt.root.updateMatrixWorld(true);
    for(const side of [-1,1]){
      const ids=sideIds(side),a=new THREE.Vector3(...bedAnchor(side)).applyMatrix4(root.matrixWorld),b=new THREE.Vector3(...cabAnchor(side)),length=a.distanceTo(b);
      const piston=rt.registry.require(ids.piston);
      piston.position.copy(a);piston.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
      const rod=rt.registry.require(`${ids.piston}-rod`);rod.position.y=(length+mechanism.bodyLength)/2;rod.scale.y=length-mechanism.bodyLength;
      rt.registry.require(`${ids.piston}-eyeB`).position.y=length;
      if(length<mechanism.bodyLength||length>mechanism.freeLength+1e-5)errors.add(`Piston stroke at bed ${bedAngle}°: ${length} cm`);
    }
    rt.root.updateMatrixWorld(true);
  };
  const check=(phase:string,bedAngle:number,legAngle:number)=>{
    sampledPoses++;phaseSamples[phase]=(phaseSamples[phase]??0)+1;
    const boxes=new Map([...meshes].map(([id,mesh])=>[id,bounds(mesh)]));
    for(const id of moving){const mesh=meshes.get(id);if(!mesh)continue;
      if(boxes.get(id)!.min.y<minFloorClearance){
        const e=mesh.matrixWorld.elements;
        for(const p of points(mesh.geometry)){const y=e[1]*p.x+e[5]*p.y+e[9]*p.z+e[13];floorVertexChecks++;minFloorClearance=Math.min(minFloorClearance,y);
          if(y< -CONTACT){errors.add(`Floor penetration: ${id} at ${phase}, bed ${bedAngle}°, leg ${legAngle}°`);failedPhases.add(phase);}
        }
      }
    }
    const visited=new Set<string>();
    for(const movingId of moving)for(const [fixedId,target]of meshes){
      if(movingId===fixedId)continue;
      const pair=[movingId,fixedId].sort().join('/');if(visited.has(pair))continue;visited.add(pair);
      if(!boxes.get(movingId)!.intersectsBox(boxes.get(fixedId)!))continue;broadphasePairs++;
      const mesh=meshes.get(movingId)!;
      const relative=mesh.matrixWorld.clone().invert().multiply(target.matrixWorld);
      // Cache only an identical actual mesh pair with an identical relative
      // transform. Rigid internal leg joints still undergo the same exact
      // solid check; caching is not a mate/contact exemption.
      const key=`${movingId}/${fixedId}/${mesh.geometry.uuid}/${target.geometry.uuid}/${relative.elements.map(v=>Math.round(v*1e7)/1e7).join(',')}`;
      let penetration:MeshPenetration|undefined;
      if(seenPairs.has(key)){const cached=seenPairs.get(key);penetration=cached?{...cached,point:new THREE.Vector3(...cached.point).applyMatrix4(mesh.matrixWorld).toArray()}:undefined;cachedPairChecks++;}
      else{penetration=findActualMeshPenetration(mesh,target);seenPairs.set(key,penetration?{...penetration,point:new THREE.Vector3(...penetration.point).applyMatrix4(mesh.matrixWorld.clone().invert()).toArray()}:undefined);actualPairChecks++;}
      if(penetration){
        const error=`${movingId} crosses ${fixedId}`;errors.add(error);failedPhases.add(phase);
        if(!details.some(h=>h.phase===phase&&h.moving===movingId&&h.fixed===fixedId))details.push({...penetration,phase,bedAngle,legAngle,moving:movingId,fixed:fixedId});
      }
    }
    for(const side of [-1,1]){
      const pivot=new THREE.Vector3(...legAnchor(side)),leg=rt.registry.require(sideIds(side).leg);
      const actual=leg.localToWorld(pivot.clone()),expected=root.localToWorld(pivot.clone());
      if(actual.distanceTo(expected)>1e-6){errors.add(`Detached leg pivot ${side} at ${phase}`);failedPhases.add(phase);}
    }
  };
  const sweep=(phase:string,bedFrom:number,bedTo:number,legFrom:number,legTo:number)=>{
    const samples=Math.ceil(Math.max(Math.abs(bedTo-bedFrom),Math.abs(legTo-legFrom))/angularIncrement);
    for(let i=0;i<=samples;i++){
      const p=samples?i/samples:0,bed=THREE.MathUtils.lerp(bedFrom,bedTo,p),leg=THREE.MathUtils.lerp(legFrom,legTo,p);
      pose(bed,leg);check(phase,bed,leg);
    }
  };
  try{
    rt.engine.seek(rt.duration-.00001);rt.root.updateMatrixWorld(true);
    for(const p of fullProduct.parts){if(p.type!=='mesh')continue;const object=rt.registry.require(p.id),mesh=object.children[0];
      if(!(mesh instanceof THREE.Mesh))throw new Error(`Missing actual generated mesh for ${p.id}`);
      let visible=true;for(let parent:THREE.Object3D|null=object;parent;parent=parent.parent)visible&&=parent.visible;
      if(visible)meshes.set(p.id,mesh);
      else if(moving.has(p.id))errors.add(`Required leg/hardware is hidden: ${p.id}`);
    }
    sweep('supported-lift',0,legReconstruction.supportedBedAngle,0,0);
    sweep('leg-fold',legReconstruction.supportedBedAngle,legReconstruction.supportedBedAngle,0,legReconstruction.storedAngle);
    sweep('stored-bed-close',legReconstruction.supportedBedAngle,90,legReconstruction.storedAngle,legReconstruction.storedAngle);
    sweep('stored-bed-open',90,legReconstruction.supportedBedAngle,legReconstruction.storedAngle,legReconstruction.storedAngle);
    sweep('leg-deploy',legReconstruction.supportedBedAngle,legReconstruction.supportedBedAngle,legReconstruction.storedAngle,0);
    sweep('usable-open-lower',legReconstruction.supportedBedAngle,0,0,0);
    for(let i=0;i<=10;i++){
      const progress=i/10,angle=legReconstruction.storedAngle*(1-progress);pose(legReconstruction.supportedBedAngle,angle);
      let checkpointFloorClearance=Infinity;
      for(const id of moving){const mesh=meshes.get(id);if(!mesh)continue;const e=mesh.matrixWorld.elements;
        for(const p of points(mesh.geometry))checkpointFloorClearance=Math.min(checkpointFloorClearance,e[1]*p.x+e[5]*p.y+e[9]*p.z+e[13]);
      }
      checkpoints.push({progress,bedAngle:legReconstruction.supportedBedAngle,legAngle:angle,
        leftPivot:rt.registry.require(sideIds(-1).leg).localToWorld(new THREE.Vector3(...legAnchor(-1))).toArray(),
        rightPivot:rt.registry.require(sideIds(1).leg).localToWorld(new THREE.Vector3(...legAnchor(1))).toArray(),minFloorClearance:checkpointFloorClearance});
    }
    return{valid:errors.size===0,errors:[...errors],collisionDetails:details,
      gates:{legFold:!failedPhases.has('leg-fold'),legDeploy:!failedPhases.has('leg-deploy'),storedBedClose:!failedPhases.has('stored-bed-close'),storedBedOpen:!failedPhases.has('stored-bed-open'),supportedLift:!failedPhases.has('supported-lift'),usableOpenLower:!failedPhases.has('usable-open-lower')},
      angularIncrement,contactTolerance:CONTACT,sampledPoses,phaseSamples,broadphasePairs,actualPairChecks,cachedPairChecks,
      installedMeshCount:meshes.size,movingMeshCount:moving.size,floorVertexChecks,minFloorClearance,checkpoints,
      method:'Actual generated MeshBVH triangles, bidirectional solid containment and oriented crossing sums; exact bore geometry is retained. No mate exclusions, collision masks or geometry changes. All intended motion uses the connected 3-degree supported bed lift. Estimated reconstruction is not structural certification.'};
  }finally{rt.dispose();}
}
