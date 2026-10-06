import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import type {GeometryDefinition,Vector3Tuple} from '@/types/product';
import type {DirectorPlan} from '@/types/director';
import {ObjectRegistry} from '@/engine/product/ObjectRegistry';
import {AnimationEngine} from '@/engine/animation/AnimationEngine';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {fullProduct,bedMembers,mechanism,sideIds,bedAnchor,cabAnchor,legTimber,hardware31} from '../product/parts-step21-31';
import {newWoodIds} from '../product/parts-step11-20';
import {fullPlan} from '../director/steps21-31';

export function createFullRuntime(actual=true,plan:DirectorPlan=fullPlan){
  const registry=new ObjectRegistry(),root=new THREE.Group(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),geometries=new Set<THREE.BufferGeometry>();
  for(const p of fullProduct.parts){const o=new THREE.Group();o.name=p.id;o.position.set(...p.position);o.rotation.set(...(p.rotation??[0,0,0]).map(a=>a*Math.PI/180) as Vector3Tuple);o.scale.set(...(p.scale??[1,1,1]));o.visible=p.visible??true;
    if(p.type==='mesh'&&(actual||p.geometryVariants)){
      const variants=Object.fromEntries(Object.entries({baseline:p.geometry,...p.geometryVariants}).map(([id,g])=>{const geometry=actual?GeometryFactory.create(g):new THREE.BoxGeometry(1,1,1);geometry.computeBoundingBox();geometries.add(geometry);return[id,geometry];}));o.userData.geometryVariants=variants;o.add(new THREE.Mesh(variants.baseline,material));
    }registry.register(p.id,o);
  }
  for(const p of fullProduct.parts){const o=registry.require(p.id);(p.parent?registry.require(p.parent):root).add(o);}
  registry.captureBaseline();const engine=new AnimationEngine(registry,new Map(fullProduct.parts.map(p=>[p.id,p])));
  let cursor=0;const shots=new Map<string,{start:number;duration:number}>(),ends=new Map<number,number>();
  for(const step of plan.steps){engine.addActions(DirectorPlanCompiler.actions(step),cursor);for(const s of step.shots){shots.set(s.id,{start:cursor,duration:s.duration});cursor+=s.duration;}ends.set(step.step,cursor);}
  return{root,registry,engine,shots,ends,duration:cursor,dispose:()=>{engine.dispose();for(const g of geometries)g.dispose();material.dispose();}};
}

/** Whole-scene audit, deliberately broader than the mechanism-owned seek
 * regression. A failed legacy first-frame transform is NOT waived because
 * the articulated roots themselves are deterministic. */
export function validateFullSeekReset(plan:DirectorPlan=fullPlan){
  const rt=createFullRuntime(true,plan),errors=new Set<string>();let comparisons=0;
  // Parent identity must be checked independently from matrixWorld: two
  // different parent/local-transform combinations can produce the same world
  // transform. Include render descendants as well as registered part roots.
  const objectIds=new Map<THREE.Object3D,string>([[rt.root,'scene'],...[...rt.registry.entries()].map(([id,o])=>[o,id] as [THREE.Object3D,string])]);
  const identifyChildren=(o:THREE.Object3D)=>{
    o.children.forEach((child,i)=>{if(!objectIds.has(child))objectIds.set(child,`${objectIds.get(o)}/child-${i}`);identifyChildren(child);});
  };
  identifyChildren(rt.root);
  const round=(values:number[])=>values.map(v=>Math.round(v*1e6)/1e6);
  const capture=(o:THREE.Object3D):unknown=>{
    const variants=o.parent?.userData.geometryVariants as Record<string,THREE.BufferGeometry>|undefined;
    return{id:objectIds.get(o),parent:o.parent?objectIds.get(o.parent):null,
      position:round(o.position.toArray()),quaternion:round(o.quaternion.toArray()),scale:round(o.scale.toArray()),
      visible:o.visible,matrix:round(o.matrixWorld.elements),
      geometry:o instanceof THREE.Mesh?o.geometry.uuid:undefined,
      variant:o instanceof THREE.Mesh&&variants?Object.entries(variants).find(([,g])=>g===o.geometry)?.[0]:undefined,
      children:o.children.map(capture)};
  };
  const snapshot=()=>new Map(fullProduct.parts.map(p=>[p.id,capture(rt.registry.require(p.id))]));
  const time=(id:string,p=.5)=>{const s=rt.shots.get(id)!;return s.start+s.duration*p;};
  const times=[0,time('S23-piston-intro'),time('S23-eye-seat',.2),time('S23-eye-seat',.8),time('S25-route-5'),time('S28--1-D7-join'),time('S29-fold-test'),time('final-closed'),time('final-open'),rt.duration-.00001];
  try{
    const expected=times.map(t=>{rt.engine.seek(t);rt.root.updateMatrixWorld(true);return snapshot();});
    for(const i of [9,3,8,1,7,0,0,6,2,5,4,9,0,0]){
      rt.engine.seek(times[i]);rt.root.updateMatrixWorld(true);
      for(const[id,now]of snapshot()){
        if(JSON.stringify(now)!==JSON.stringify(expected[i].get(id)))errors.add(`Seek/reset mismatch: ${id} at ${times[i].toFixed(6)} s`);
        comparisons++;
      }
    }
    return{valid:!errors.size,errors:[...errors],comparisons,registeredObjects:rt.registry.size,sceneObjects:objectIds.size,
      note:'Compares actual compiled scene local position/quaternion/scale, exact parent identity, world transforms, visibility, actual mesh geometry/variants and render descendants at direct, forward, backward and repeated reset-to-zero times. No geometry correctness is inferred from deterministic replay.'};
  }finally{rt.dispose();}
}
/** Actual orthogonal material cells, not a routed profile's enclosing volume. */
export function materialCells(g:GeometryDefinition):THREE.Box3[]{
  if(g.type==='compound')return g.pieces.flatMap(p=>{const m=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...(p.rotation??[0,0,0]).map(v=>v*Math.PI/180) as Vector3Tuple));m.setPosition(new THREE.Vector3(...(p.position??[0,0,0])));return materialCells(p.geometry).map(b=>b.applyMatrix4(m));});
  if(g.type==='box'||g.type==='bored-panel'){const h=new THREE.Vector3(...g.size).multiplyScalar(.5);return[new THREE.Box3(h.clone().negate(),h)];}
  if(g.type!=='profile-prism')return[];
  const xs=[...new Set(g.points.map(p=>p[0]))].sort((a,b)=>a-b),ys=[...new Set(g.points.map(p=>p[1]))].sort((a,b)=>a-b),result:THREE.Box3[]=[];
  const inside=(x:number,y:number)=>{let yes=false;for(let i=0,j=g.points.length-1;i<g.points.length;j=i++){const a=g.points[i],b=g.points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++)if(inside((xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2)){
    const map=(x:number,y:number,z:number)=>g.axis==='x'?new THREE.Vector3(z,x,y):g.axis==='y'?new THREE.Vector3(x,z,-y):new THREE.Vector3(x,y,z);
    result.push(new THREE.Box3().setFromPoints([map(xs[i],ys[j],-g.depth/2),map(xs[i+1],ys[j+1],g.depth/2)]));
  }return result;
}
export function validateFullMechanics(plan:DirectorPlan=fullPlan){
  const rt=createFullRuntime(true,plan),errors=new Set<string>();let rigidChecks=0,pivotChecks=0,pistonChecks=0,pistonSolidChecks=0,structuralPoses=0,legChecks=0;
  const trees=new WeakMap<THREE.BufferGeometry,MeshBVH>();
  const defs=new Map(fullProduct.parts.map(p=>[p.id,p]));
  const cabMeshes=fullProduct.parts.filter(p=>p.type==='mesh'&&!p.parent&&p.category!=='hardware'&&!['D8','D9','installation-wall'].includes(p.id)).map(p=>p.id);
  const woodCells=new Map([...newWoodIds,...legTimber,...cabMeshes].map(id=>{const p=defs.get(id)!;return[id,p.type==='mesh'?materialCells(p.geometry):[]];}));
  function collision(id:string,targets:string[],label:string){
    const o=rt.registry.require(id),boxes=woodCells.get(id);if(!boxes?.length||!o.visible)return;
    o.updateWorldMatrix(true,true);const inv=o.matrixWorld.clone().invert(),worldBox=new THREE.Box3().setFromObject(o);
    for(const target of targets){const ob=rt.registry.require(target);if(!ob.visible)continue;ob.updateWorldMatrix(true,true);const mesh=ob.children[0];if(!(mesh instanceof THREE.Mesh))continue;
      if(!worldBox.intersectsBox(mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld)))continue;
      // Same actual-triangle versus shrunken material-cell test as before,
      // accelerated with BVH OBB queries. No new collision exemption or
      // altered contact threshold; crossed cells still report an error.
      let tree=trees.get(mesh.geometry);if(!tree){tree=new MeshBVH(mesh.geometry);trees.set(mesh.geometry,tree);}
      const cellToMesh=mesh.matrixWorld.clone().invert().multiply(inv.clone().invert());
      const hit=boxes.some(b=>tree!.intersectsBox(b.clone().expandByScalar(-.005),cellToMesh));
      if(hit)errors.add(`${label}: ${id} crosses ${target}`);
    }
  }
  try{
    rt.engine.seek(rt.ends.get(20)!-.00001);rt.root.updateMatrixWorld(true);
    const seatedOrientations=new Map(bedMembers.map(id=>[id,rt.registry.require(id).quaternion.clone()]));
    for(const step of plan.steps.slice(24))for(const shot of step.shots){
      if(!shot.actions.some(a=>a.type==='pivotPose'))continue;const start=rt.shots.get(shot.id)!.start;
      const samples=shot.id.includes('route')?32:45;
      for(let i=0;i<=samples;i++){
        rt.engine.seek(start+shot.duration*i/samples);rt.root.updateMatrixWorld(true);
        const root=rt.registry.require('bed-motion-root');
        for(const id of bedMembers){const o=rt.registry.require(id),definition=defs.get(id)!,expected=new THREE.Vector3(...definition.position).applyMatrix4(root.matrixWorld);
          if(o.getWorldPosition(new THREE.Vector3()).distanceTo(expected)>1e-4)errors.add(`Rigid bed: ${id} at ${shot.id}`);
          const relative=root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(o.getWorldQuaternion(new THREE.Quaternion())),baseline=seatedOrientations.get(id)!;
          if(relative.angleTo(baseline)>1e-4)errors.add(`Rigid bed orientation: ${id} at ${shot.id}`);rigidChecks++;}
        for(const id of newWoodIds){collision(id,cabMeshes,shot.id);structuralPoses++;const bb=new THREE.Box3().setFromObject(rt.registry.require(id));if(bb.min.y<-.01)errors.add(`Floor penetration: ${id} at ${shot.id}`);}
        if(step.step>=26)for(const side of [-1,1]){const bearing=rt.registry.require(sideIds(side).bearing).getWorldPosition(new THREE.Vector3()),target=new THREE.Vector3(side*mechanism.bearingX,mechanism.cabinetPivot[1],mechanism.cabinetPivot[2]);if(bearing.distanceTo(target)>1e-4)errors.add(`Pivot axis: side ${side} at ${shot.id}`);pivotChecks++;}
        for(const side of [-1,1]){
          const s=sideIds(side),piston=rt.registry.require(s.piston);piston.updateWorldMatrix(true,true);
          const a=piston.localToWorld(new THREE.Vector3(0,0,0)),expected=new THREE.Vector3(...bedAnchor(side)).applyMatrix4(root.matrixWorld);
          if(a.distanceTo(expected)>1e-4)errors.add(`Piston bed end: ${side} at ${shot.id}`);
          if(step.step>=28||shot.id.startsWith('S27-small')||shot.id==='S27-complete'){
            const b=rt.registry.require(`${s.piston}-eyeB`).getWorldPosition(new THREE.Vector3());if(b.distanceTo(new THREE.Vector3(...cabAnchor(side)))>1e-4)errors.add(`Piston cabinet end: ${side} at ${shot.id}`);
            if(a.distanceTo(b)<mechanism.bodyLength||a.distanceTo(b)>mechanism.freeLength+.1)errors.add(`Piston stroke: ${side} at ${shot.id}`);
          }
          for(const wood of [...newWoodIds,...cabMeshes,...(step.step>=29?legTimber:[])]){
            collision(wood,[`${s.piston}-body`,`${s.piston}-rod`],`${shot.id} piston solid`);pistonSolidChecks+=2;
          }
          pistonChecks++;
        }
        if(step.step>=29&&shot.id!=='S29-supported-open')for(const id of legTimber){collision(id,[...newWoodIds,...cabMeshes],shot.id);legChecks++;}
      }
    }
    return{valid:errors.size===0,errors:[...errors],rigidChecks,pivotChecks,pistonChecks,pistonSolidChecks,structuralPoses,legChecks};
  }finally{rt.dispose();}
}

type BoreAxis={position:THREE.Vector3;normal:THREE.Vector3;radius:number;through:boolean};
function boreAxes(g:GeometryDefinition,matrix=new THREE.Matrix4()):BoreAxis[]{
  const axes:BoreAxis[]=[];
  if(g.type==='compound')return g.pieces.flatMap(p=>{
    const local=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...(p.rotation??[0,0,0]).map(v=>v*Math.PI/180) as Vector3Tuple));local.setPosition(new THREE.Vector3(...(p.position??[0,0,0])));return boreAxes(p.geometry,matrix.clone().multiply(local));
  });
  const add=(position:Vector3Tuple,axis:'x'|'y'|'z',radius:number,through=true)=>axes.push({position:new THREE.Vector3(...position).applyMatrix4(matrix),normal:new THREE.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0).transformDirection(matrix),radius,through});
  if(g.type==='profile-prism')for(const hole of g.holes??[]){const axis=g.axis??'z',p:Vector3Tuple=axis==='x'?[0,hole.x,hole.y]:axis==='y'?[hole.x,0,-hole.y]:[hole.x,hole.y,0];add(p,axis,hole.radius);}
  if(g.type==='bored-panel')for(const hole of g.holes)add(g.boreAxis==='z'?[hole.x,-hole.z,0]:[hole.x,0,hole.z],g.boreAxis??'y',hole.radius);
  if(g.type==='bored-panel'||g.type==='profile-prism')for(const hole of g.faceBores??[])add(hole.position,hole.axis,hole.radius,!hole.face||hole.face==='both');
  return axes;
}

/** Shared axes AND actual radial fit. A concentric hole that is smaller than
 * the installed barrel is not accepted merely because its centers agree. */
export function validateFullHardwareFits(plan:DirectorPlan=fullPlan){
  const rt=createFullRuntime(true,plan),errors=new Set<string>(),apertureHits:Array<{id:string;host:string;point:number[];distance:number}>=[];let axesChecked=0,receiversChecked=0,actualApertureRays=0;
  const definitions=new Map(fullProduct.parts.map(p=>[p.id,p]));
  const geometry=(id:string):GeometryDefinition|undefined=>{
    const part=definitions.get(id);if(part?.type!=='mesh')return undefined;
    const mesh=rt.registry.require(id).children[0] as THREE.Mesh;
    const variants=rt.registry.require(id).userData.geometryVariants as Record<string,THREE.BufferGeometry>;
    const name=Object.entries(variants).find(([,g])=>g===mesh.geometry)?.[0];return name&&name!=='baseline'?part.geometryVariants?.[name]:part.geometry;
  };
  try{
    rt.engine.seek(rt.duration-.00001);rt.root.updateMatrixWorld(true);
    for(const [id,h]of hardware31){
      const definition=definitions.get(id)!,o=rt.registry.require(id),parent=o.parent!;
      const expected=new THREE.Vector3(...definition.position).applyMatrix4(parent.matrixWorld);
      if(o.getWorldPosition(new THREE.Vector3()).distanceTo(expected)>1e-4)errors.add(`Hardware not seated: ${id}`);
      const factoryAxis=h.kind==='installNut'||h.kind==='installWasher'?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0);
      const actual=factoryAxis.applyQuaternion(o.getWorldQuaternion(new THREE.Quaternion())).normalize(),normal=new THREE.Vector3(...h.normal).transformDirection(parent.matrixWorld);
      if(Math.abs(actual.dot(normal))<1-1e-5)errors.add(`Hardware axis: ${id}`);axesChecked++;
      if(h.number===17||h.number===10)continue;
      const physicalTimberMate=h.mates.find(id=>{const p=definitions.get(id);return p?.type==='mesh'&&p.material.startsWith('oak');});
      const host=h.number===18?(physicalTimberMate??h.host):h.host,hostGeometry=geometry(host);
      if(!hostGeometry){errors.add(`Missing physical receiver: ${id}/${host}`);continue;}
      const hostObject=rt.registry.require(host),bores=boreAxes(hostGeometry,hostObject.matrixWorld);
      const nominal=definitions.get(host),local=hostObject.worldToLocal(expected.clone()),direction=normal.clone().transformDirection(hostObject.matrixWorld.clone().invert());
      const throughNominalMaterial=nominal?.type==='mesh'&&materialCells(nominal.geometry).some(cell=>new THREE.Ray(local.clone().addScaledVector(direction,500),direction.clone().negate()).intersectsBox(cell));
      if(!throughNominalMaterial)errors.add(`Receiver bore has no nominal material host: ${id}/${host}`);
      const aligned=bores.filter(b=>Math.abs(b.normal.dot(normal))>1-1e-5&&expected.clone().sub(b.position).cross(normal).length()<1e-4);
      if(!aligned.length)errors.add(`Receiver axis mismatch: ${id}/${host}`);
      else{
        const part=definition.type==='mesh'?definition.geometry:undefined;
        const radius=part?.type==='socket-bolt'||part?.type==='fluted-dowel'||part?.type==='screw'?part.radius:part?.type==='profile-prism'?Math.max(...part.points.map(p=>Math.hypot(...p))):0;
        if(Math.max(...aligned.map(b=>b.radius))+1e-5<radius)errors.add(`Receiver too small: ${id}/${host} needs radius ${radius}, has ${Math.max(...aligned.map(b=>b.radius))}`);
        // Check the generated apertures, not metadata alone. A through-bore
        // center ray plus four off-axis rays must pass the actual host mesh.
        if(aligned.some(b=>b.through)){
          const tangent=normal.clone().cross(Math.abs(normal.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0)).normalize(),cross=normal.clone().cross(tangent).normalize(),ray=new THREE.Raycaster();
          const mesh=hostObject.children[0] as THREE.Mesh;
          for(const offset of [new THREE.Vector3(),tangent.clone().multiplyScalar(radius*.85),tangent.clone().multiplyScalar(-radius*.85),cross.clone().multiplyScalar(radius*.85),cross.clone().multiplyScalar(-radius*.85)]){
            ray.set(expected.clone().add(offset).addScaledVector(normal,500),normal.clone().negate());ray.far=500+h.length/2-.001;
            const hits=ray.intersectObject(mesh,false);
            if(hits.length){errors.add(`Actual receiver aperture blocked: ${id}/${host}`);const p=hostObject.worldToLocal(hits[0].point.clone());apertureHits.push({id,host,point:p.toArray(),distance:hits[0].distance-500});}actualApertureRays++;
          }
        }
      }receiversChecked++;
    }
    for(const side of [-1,1]){
      const s=sideIds(side),e1=geometry(s.e1),bearing=geometry(s.bearing),washer=geometry(`S29-${side}-H10`),bolt=geometry(`S29-${side}-H2`);
      if(e1?.type==='compound'&&bearing?.type==='compound'){
        const spindle=e1.pieces.find(p=>p.geometry.type==='profile-prism'&&p.position&&Math.abs(p.position[2])>1)?.geometry;
        const inner=bearing.pieces.filter(p=>p.geometry.type==='profile-prism').flatMap(p=>p.geometry.type==='profile-prism'?p.geometry.holes??[]:[]).map(h=>h.radius);
        if(spindle?.type==='profile-prism'&&Math.max(...spindle.points.map(p=>Math.hypot(...p)))>Math.min(...inner)+1e-5)errors.add(`Bearing inner bore smaller than E1 spindle: side ${side}`);
      }
      if(washer?.type==='profile-prism'&&bolt?.type==='socket-bolt'&&(washer.holes?.[0].radius??0)<bolt.radius)errors.add(`White washer #10 bore smaller than #2 shaft: side ${side}`);
    }
    const messages=[...errors];
    return{valid:errors.size===0,metadataFitValid:!messages.some(e=>!e.startsWith('Actual receiver aperture blocked:')),actualAperturesValid:!messages.some(e=>e.startsWith('Actual receiver aperture blocked:')),errors:messages,axesChecked,receiversChecked,actualApertureRays,apertureHits};
  }finally{rt.dispose();}
}

/** Explicit source-material host diagnosis for the reconstructed cabinet
 * receiver. Ignore geometry grown outside a panel by an invalid bore: a hole
 * cannot itself create a timber host. All coordinates remain world-space cm. */
export function diagnoseReceiverMaterialHosts(){
  const rt=createFullRuntime(),definitions=new Map(fullProduct.parts.map(p=>[p.id,p]));
  try{
    rt.engine.seek(rt.ends.get(25)!-.00001);rt.root.updateMatrixWorld(true);
    const timber=fullProduct.parts.filter(p=>p.type==='mesh'&&!p.parent&&p.material.startsWith('oak'));
    const result:Array<{hardware:string;axisPoint:number[];nominalHosts:Array<{id:string;min:number[];max:number[];axisThickness:number}>}> = [];
    for(const id of ['S25-H18--1','S25-H18-1',...[-1,1].flatMap(side=>[7,8,9].map(i=>`S${side<0?10:9}-H21-${i}`))]){
      const part=rt.registry.require(id),point=part.getWorldPosition(new THREE.Vector3()),hosts:Array<{id:string;min:number[];max:number[];axisThickness:number}>=[];
      for(const wood of timber){
        const object=rt.registry.require(wood.id),local=object.worldToLocal(point.clone()),direction=new THREE.Vector3(1,0,0).transformDirection(object.matrixWorld.clone().invert()),ray=new THREE.Ray(local.clone().addScaledVector(direction,500),direction.clone().negate());
        const definition=definitions.get(wood.id)!;
        if(definition.type!=='mesh')continue;
        if(materialCells(definition.geometry).some(cell=>ray.intersectsBox(cell))){
          const box=materialCells(definition.geometry).reduce((a,b)=>a.union(b),new THREE.Box3()).applyMatrix4(object.matrixWorld);
          if(Math.sign(box.getCenter(new THREE.Vector3()).x)!==Math.sign(point.x))continue;
          hosts.push({id:wood.id,min:box.min.toArray(),max:box.max.toArray(),axisThickness:box.max.x-box.min.x});
        }
      }result.push({hardware:id,axisPoint:point.toArray(),nominalHosts:hosts});
    }
    return result;
  }finally{rt.dispose();}
}
