import * as THREE from 'three';
import type {GeometryDefinition,ProductDefinition,Vector3Tuple} from '@/types/product';
import type {DirectorPlan} from '@/types/director';
import {ObjectRegistry} from '@/engine/product/ObjectRegistry';
import {AnimationEngine} from '@/engine/animation/AnimationEngine';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {steps01To20Product as product,newWoodIds,brackets,bed,hardwareSpecs,pos,carrierMembers} from '../product/parts-step11-20';
import {steps01To20Plan as plan} from '../director/steps11-20';

const epsilon=1e-4; // Float32 numeric tolerance only, not a furniture clearance.
/** Split orthogonal routed profiles into actual solid cells, excluding channels.
 * Hardware bores are checked separately by their shared receiver coordinates.
 * Enclosing boxes would incorrectly fill the C6 channels and integral tongues. */
function cells(g:GeometryDefinition):THREE.Box3[]{
  if(g.type==='compound')return g.pieces.flatMap(p=>{
    const m=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...(p.rotation??[0,0,0]).map(v=>v*Math.PI/180) as Vector3Tuple));m.setPosition(new THREE.Vector3(...(p.position??[0,0,0])));
    return cells(p.geometry).map(b=>b.applyMatrix4(m));
  });
  if(g.type==='profile-prism'){
    const xs=[...new Set(g.points.map(p=>p[0]))].sort((a,b)=>a-b),ys=[...new Set(g.points.map(p=>p[1]))].sort((a,b)=>a-b),result:THREE.Box3[]=[];
    const inside=(x:number,y:number)=>{let hit=false;for(let i=0,j=g.points.length-1;i<g.points.length;j=i++){
      const a=g.points[i],b=g.points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
    }return hit;};
    for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++)if(inside((xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2)){
      const map=(x:number,y:number,z:number)=>g.axis==='x'?new THREE.Vector3(z,x,y):g.axis==='y'?new THREE.Vector3(x,z,-y):new THREE.Vector3(x,y,z);
      const a=map(xs[i],ys[j],-g.depth/2),b=map(xs[i+1],ys[j+1],g.depth/2);result.push(new THREE.Box3().setFromPoints([a,b]));
    }
    return result;
  }
  if(g.type==='box'||g.type==='bored-panel'){
    const half=new THREE.Vector3(...g.size).multiplyScalar(.5);return[new THREE.Box3(half.clone().negate(),half)];
  }
  throw new Error(`No structural envelope for ${g.type}`);
}

export function createSteps20Runtime(actualGeometry=false,sourceProduct:ProductDefinition=product,sourcePlan:DirectorPlan=plan){
  const registry=new ObjectRegistry(),geometries=new Set<THREE.BufferGeometry>(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const p of sourceProduct.parts){
    const object=new THREE.Group();object.name=p.id;object.position.set(...p.position);object.rotation.set(...(p.rotation??[0,0,0]).map(v=>v*Math.PI/180) as Vector3Tuple);object.visible=p.visible??true;
    if(p.type==='mesh'&&(actualGeometry||p.geometryVariants)){
      const variants=Object.fromEntries(Object.entries({baseline:p.geometry,...p.geometryVariants}).map(([id,g])=>{
        const geometry=actualGeometry?GeometryFactory.create(g):new THREE.BoxGeometry(1,1,1);geometry.computeBoundingBox();geometries.add(geometry);return[id,geometry];
      }));object.userData.geometryVariants=variants;object.add(new THREE.Mesh(variants.baseline,material));
    }
    registry.register(p.id,object);
  }
  for(const p of sourceProduct.parts)if(p.parent)registry.require(p.parent).add(registry.require(p.id));
  registry.captureBaseline();const engine=new AnimationEngine(registry,new Map(sourceProduct.parts.map(p=>[p.id,p])));
  let cursor=0;const shots=new Map<string,{start:number;duration:number}>(),ends=new Map<number,number>();
  for(const step of sourcePlan.steps){engine.addActions(DirectorPlanCompiler.actions(step),cursor);for(const s of step.shots){shots.set(s.id,{start:cursor,duration:s.duration});cursor+=s.duration;}ends.set(step.step,cursor);}
  return{registry,engine,shots,ends,duration:cursor,dispose:()=>{engine.dispose();for(const g of geometries)g.dispose();material.dispose();}};
}

export interface Steps20PathResult {valid:boolean;errors:string[];structuralPaths:number;sampledPoses:number;sweptSegments:number;hardwareAxes:number;rigidCarrierChecks:number;}
export function validateSteps11To20Paths(sourceProduct:ProductDefinition=product,sourcePlan:DirectorPlan=plan):Steps20PathResult {
  // The default preserves the historical checkpoint. Final integration can
  // pass the current product so its local rebates and corrected receivers
  // are checked on the same actual generated scene, through Step 20 only.
  const rt=createSteps20Runtime(true,sourceProduct,sourcePlan),{registry,engine}=rt,errors=new Set<string>();
  let structuralPaths=0,sampledPoses=0,sweptSegments=0,hardwareAxes=0,rigidCarrierChecks=0;
  const definitions=new Map(sourceProduct.parts.map(p=>[p.id,p]));
  const envelopes=new Map([...newWoodIds,...brackets.map(b=>b.id)].map(id=>{const p=definitions.get(id)!;if(p.type!=='mesh')throw new Error(id);return[id,cells(p.geometry)];}));
  const shapes=new WeakMap<THREE.Mesh,{key:string;box:THREE.Box3;triangles:THREE.Triangle[]}>();
  // Evaluate both sides in the rigid bed frame. A rotated WORLD AABB would
  // fill air around inclined timber and falsely reject a supported work pose.
  // Actual surfaces, sample counts and tolerances are not relaxed.
  const queryFrame=()=>{const root=registry.get('bed-motion-root');root?.updateWorldMatrix(true,true);return root?root.matrixWorld.clone().invert():new THREE.Matrix4();};
  function worldCells(id:string){const o=registry.require(id);o.updateWorldMatrix(true,true);const m=queryFrame().multiply(o.matrixWorld);return envelopes.get(id)!.map(b=>b.clone().applyMatrix4(m).expandByScalar(-epsilon));}
  function shape(mesh:THREE.Mesh){
    mesh.updateWorldMatrix(true,true);const matrix=queryFrame().multiply(mesh.matrixWorld),key=mesh.geometry.uuid+matrix.elements.join(','),old=shapes.get(mesh);if(old?.key===key)return old;
    const box=mesh.geometry.boundingBox!.clone().applyMatrix4(matrix),p=mesh.geometry.getAttribute('position'),index=mesh.geometry.index,triangles:THREE.Triangle[]=[];
    for(let i=0;i<(index?.count??p.count);i+=3){const v=(j:number)=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(matrix);triangles.push(new THREE.Triangle(v(0),v(1),v(2)));}
    const result={key,box,triangles};shapes.set(mesh,result);return result;
  }
  function collision(id:string,boxes:THREE.Box3[],exclude:string[]=[]){
    for(const [bid,object]of registry.entries()){
      const p=definitions.get(bid);if(bid===id||exclude.includes(bid)||!object.visible||p?.category==='hardware')continue;
      const mesh=object.children[0];if(!(mesh instanceof THREE.Mesh))continue;
      object.updateWorldMatrix(true,true);mesh.updateWorldMatrix(true,true);const bounds=mesh.geometry.boundingBox!.clone().applyMatrix4(queryFrame().multiply(mesh.matrixWorld));
      if(!boxes.some(b=>b.intersectsBox(bounds)))continue;
      const s=shape(mesh);
      if(boxes.some(b=>b.intersectsBox(s.box)&&s.triangles.some(t=>b.intersectsTriangle(t))))errors.add(`${id} penetrates actual solid ${bid}`);
    }
  }
  try{
    for(const step of sourcePlan.steps.slice(10,20))for(const shot of step.shots)for(const a of shot.actions){
      if(a.type!=='installPart'||!envelopes.has(a.target))continue;
      structuralPaths++;const start=rt.shots.get(shot.id)!.start+(a.at??0);
      for(let i=0;i<=24;i++){engine.seek(start+a.duration!*i/24);collision(a.target,worldCells(a.target));sampledPoses++;}
      let previous:THREE.Box3[]|undefined;
      // Dense consecutive swept bounds follow the actual diagonal staging
      // path; one huge union across several waypoints encloses empty space.
      // This INCREASES sweep sampling, with the original numeric tolerance.
      for(const t of Array.from({length:97},(_,i)=>i/96)){
        engine.seek(start+a.duration!*t);const now=worldCells(a.target);
        if(previous){collision(a.target,now.map((b,i)=>b.clone().union(previous![i])));sweptSegments++;}previous=now;
      }
    }
    // Large Step 17 assembly remains rigid; its complete swept solids clear the
    // stationary face. Do not omit the frame because it uses generic move actions.
    for(const shot of sourcePlan.steps[16].shots.filter(s=>['S17-lift','S17-above','S17-lower','S17-seat'].includes(s.id))){
      const start=rt.shots.get(shot.id)!.start,d=shot.actions[0].duration!;let previous:Map<string,THREE.Box3[]>|undefined;
      for(let i=0;i<=40;i++){
        engine.seek(start+d*i/40);const now=new Map<string,THREE.Box3[]>(),origin=registry.require(carrierMembers[0]).position;
        for(const id of carrierMembers){
          const expected=new THREE.Vector3(...pos(id)).sub(new THREE.Vector3(...pos(carrierMembers[0]))),actual=registry.require(id).position.clone().sub(origin);
          if(actual.distanceTo(expected)>epsilon)errors.add(`Carrier loses rigidity at ${shot.id}: ${id}`);rigidCarrierChecks++;
          if(!envelopes.has(id))continue;const boxes=worldCells(id);now.set(id,boxes);collision(id,boxes,carrierMembers);
          if(previous){collision(id,boxes.map((b,k)=>b.clone().union(previous!.get(id)![k])),carrierMembers);sweptSegments++;}sampledPoses++;
        }previous=now;
      }
    }
    engine.seek(rt.ends.get(20)!-.01);
    // Exact shared-axis contract for every physical fastener and its receiver.
    for(const [id,h]of hardwareSpecs){
      const o=registry.require(id),normal=new THREE.Vector3(0,1,0).applyQuaternion(o.quaternion).normalize();
      if(Math.abs(normal.dot(new THREE.Vector3(...h.normal)))<1-epsilon)errors.add(`Hardware axis ${id}`);
      if(o.position.distanceTo(new THREE.Vector3(...pos(id)))>epsilon)errors.add(`Hardware seating position ${id}`);hardwareAxes++;
    }
    for(const id of newWoodIds)collision(id,worldCells(id));
    // Layer assertions use nominal manufactured contact planes, not renderer AABBs.
    if(!(bed.panelY+bed.panelDepth/2<9&&bed.slatY-1.8/2===9&&bed.carrierY-bed.carrierHeight/2===9))errors.add('Face/carrier/slat layer inversion');
    return{valid:errors.size===0,errors:[...errors],structuralPaths,sampledPoses,sweptSegments,hardwareAxes,rigidCarrierChecks};
  }finally{rt.dispose();}
}
