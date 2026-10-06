import * as THREE from 'three';
import {AnimationEngine} from '@/engine/animation/AnimationEngine';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {ObjectRegistry} from '@/engine/product/ObjectRegistry';
import {steps01To10Plan as plan} from '../director/steps04-10';
import {steps01To10Product as product,rows,rowJoints,cabinetFace,b8PanelWidth,b8CenterX} from '../product/parts-step04-10';

// Numerical guard for Float32 tessellation, NOT a construction clearance.
const numericEpsilon=1e-4;
/** Distance to an ACTUAL triangle boundary, not another nearby test ray or
 * nominal panel bounds. Tangential seam rays can miss at machine precision. */
export function actualRayBoundaryResidual(ray:THREE.Ray,triangles:Iterable<THREE.Triangle>):number{
  let distanceSq=Infinity;const onRay=new THREE.Vector3(),onEdge=new THREE.Vector3();
  for(const triangle of triangles)for(const [a,b]of [[triangle.a,triangle.b],[triangle.b,triangle.c],[triangle.c,triangle.a]]){
    ray.distanceSqToSegment(a,b,onRay,onEdge);
    // Recompute from the returned closest points: the analytic squared
    // distance can cancel to zero for nearly tangent world-space edges.
    distanceSq=Math.min(distanceSq,onRay.distanceToSquared(onEdge));
  }
  return Math.sqrt(Math.max(0,distanceSq));
}
export interface B8ValidationResult {
  valid:boolean; errors:string[]; panelsChecked:number; pathSamples:number; sweptSegments:number;
  hardwareJointsChecked:number; closureRays:number;
  upperCornerSurfaceHits:string[];
  nominalOuterSeamCm:number;nominalCenterSeamCm:number;nominalHorizontalSeamCm:number;
  numericBoundaryRays:number;maxActualBoundaryResidualCm:number;
}

/** Product-scoped checks; no WF311613 rules added to the generic engine. */
export function validateB8Face():B8ValidationResult {
  const errors:string[]=[],registry=new ObjectRegistry(),geometries=new Set<THREE.BufferGeometry>();
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const part of product.parts){
    const group=new THREE.Group();group.name=part.id;group.position.set(...part.position);
    group.rotation.set(...(part.rotation??[0,0,0]).map(x=>x*Math.PI/180) as [number,number,number]);
    group.visible=part.visible??true;
    if(part.type==='mesh'){
      const variants=Object.fromEntries(Object.entries({baseline:part.geometry,...part.geometryVariants}).map(([id,g])=>{
        const geometry=GeometryFactory.create(g);geometry.computeBoundingBox();geometries.add(geometry);return[id,geometry];
      }));
      group.userData.geometryVariants=variants;group.add(new THREE.Mesh(variants.baseline,material));
    }
    registry.register(part.id,group);
  }
  registry.captureBaseline();
  const engine=new AnimationEngine(registry,new Map(product.parts.map(p=>[p.id,p])));
  const shotTimes=new Map<string,{start:number;duration:number}>();let cursor=0,completedRows=0;
  for(const step of plan.steps){
    engine.addActions(DirectorPlanCompiler.actions(step),cursor);
    for(const shot of step.shots){shotTimes.set(shot.id,{start:cursor,duration:shot.duration});cursor+=shot.duration;}
    if(step.step===6)completedRows=cursor-.05;
  }
  let pathSamples=0,sweptSegments=0,closureRays=0,hardwareJointsChecked=0,numericBoundaryRays=0,maxActualBoundaryResidualCm=0;
  const upperCornerSurfaceHits:string[]=[];
  const result=():B8ValidationResult=>({valid:errors.length===0,errors,panelsChecked:6,pathSamples,sweptSegments,hardwareJointsChecked,closureRays,upperCornerSurfaceHits,numericBoundaryRays,maxActualBoundaryResidualCm,
    nominalOuterSeamCm:cabinetFace.rightInnerX-(b8CenterX+b8PanelWidth/2),
    nominalCenterSeamCm:b8CenterX-b8PanelWidth/2-cabinetFace.centerWidth/2,
    nominalHorizontalSeamCm:0});
  const requireNear=(actual:number,expected:number,label:string)=>{if(Math.abs(actual-expected)>numericEpsilon)errors.push(`${label}: ${actual} != ${expected}`);};
  const visibleSolids=()=>{
    const meshes:THREE.Mesh[]=[];
    for(const [,object]of registry.entries())if(object.visible){object.updateWorldMatrix(true,true);for(const child of object.children)if(child instanceof THREE.Mesh)meshes.push(child);}
    return meshes;
  };
  const cache=new WeakMap<THREE.Mesh,{key:string;box:THREE.Box3;triangles:THREE.Triangle[]}>();
  function shape(mesh:THREE.Mesh){
    const key=mesh.geometry.uuid+mesh.matrixWorld.elements.join(','),cached=cache.get(mesh);
    if(cached?.key===key)return cached;
    const box=mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld),p=mesh.geometry.getAttribute('position'),index=mesh.geometry.index;
    const triangles:THREE.Triangle[]=[];
    for(let i=0;i<(index?.count??p.count);i+=3){
      const vertex=(j:number)=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld);
      triangles.push(new THREE.Triangle(vertex(0),vertex(1),vertex(2)));
    }
    const value={key,box,triangles};cache.set(mesh,value);return value;
  }
  function movingBounds(panel:THREE.Mesh){
    const part=product.parts.find(p=>p.id===panel.parent?.name)!;
    // B7 is not its enclosing box: only the narrow tongues enter the circular
    // receivers. Test the core and both actual tongue envelopes separately.
    const boxes:THREE.Box3[]=[];
    if(part.type==='mesh'&&part.geometry.type==='tabbed-stile'){
      const g=part.geometry,[w,h,d]=g.size;
      boxes.push(new THREE.Box3(new THREE.Vector3(-w/2,-h/2,-d/2),new THREE.Vector3(w/2,h/2,d/2)));
      for(const side of [-1,1]){
        const center=side*(h+g.tabHeight)/2;
        boxes.push(new THREE.Box3(new THREE.Vector3(-g.tabWidth/2,center-g.tabHeight/2,-g.tabDepth/2),new THREE.Vector3(g.tabWidth/2,center+g.tabHeight/2,g.tabDepth/2)));
      }
    }else boxes.push(panel.geometry.boundingBox!.clone());
    return boxes.map(b=>b.applyMatrix4(panel.matrixWorld).expandByScalar(-numericEpsilon));
  }
  function penetrates(panel:THREE.Mesh,blocker:THREE.Mesh,fromBoxes?:THREE.Box3[]){
    const moving=movingBounds(panel).map((b,i)=>fromBoxes?b.union(fromBoxes[i]):b);
    const blockerBox=blocker.geometry.boundingBox!.clone().applyMatrix4(blocker.matrixWorld);
    if(!moving.some(b=>b.intersectsBox(blockerBox)))return false;
    const solid=shape(blocker);
    return moving.some(b=>b.intersectsBox(solid.box)&&solid.triangles.some(t=>b.intersectsTriangle(t)));
  }
  try{
    engine.seek(completedRows);
    const solids=visibleSolids(),wood=solids.filter(m=>product.parts.find(p=>p.id===m.parent?.name)?.category==='cabinet');
    for(const row of rows)for(const side of [-1,1]){
      const id=`B8-${row.step}-${side}`,part=product.parts.find(p=>p.id===id)!,object=registry.require(id),panel=object.children[0] as THREE.Mesh;
      if(part.type!=='mesh'||part.geometry.type!=='box')throw new Error(`Missing ${id}`);
      const [width,height]=part.geometry.size;
      requireNear(object.position.x+side*width/2,side<0?cabinetFace.leftInnerX:cabinetFace.rightInnerX,`${id} outer contact`);
      requireNear(object.position.x-side*width/2,side*cabinetFace.centerWidth/2,`${id} center contact`);
      requireNear(object.position.y-height/2,row.bottom+cabinetFace.railHeight/2,`${id} lower contact`);
      requireNear(object.position.y+height/2,row.top-cabinetFace.railHeight/2,`${id} upper contact`);
      for(const point of part.connectionPoints??[])if(point.id!=='mount'){
        const axis=point.id.includes('edge')&&(point.id==='outer-edge'||point.id==='center-edge')?0:1;
        requireNear(Math.abs(point.position[axis]),part.geometry.size[axis]/2,`${id}.${point.id} remains on its surface`);
      }
      for(const blocker of solids)if(blocker!==panel&&penetrates(panel,blocker))errors.push(`${id} final geometry penetrates ${blocker.parent?.name}`);
    }
    // Check the REAL generated meshes from the straight front, including exact
    // seams and points on both sides of them. No backing/filler meshes are added.
    const raycaster=new THREE.Raycaster(),seams=[cabinetFace.leftInnerX,-cabinetFace.centerWidth/2,cabinetFace.centerWidth/2,cabinetFace.rightInnerX];
    function closed(x:number,y:number){
      closureRays++;raycaster.set(new THREE.Vector3(x,y,-100),new THREE.Vector3(0,0,1));
      if(!raycaster.intersectObjects(wood,false).length){
        const residual=actualRayBoundaryResidual(raycaster.ray,wood.flatMap(mesh=>shape(mesh).triangles));
        if(residual<=numericEpsilon){numericBoundaryRays++;maxActualBoundaryResidualCm=Math.max(maxActualBoundaryResidualCm,residual);}
        else errors.push(`Daylight at x=${x}, y=${y}; nearest actual boundary ${residual} cm`);
      }
    }
    for(const row of rows){
      const lo=row.bottom+3,hi=row.top-3;
      for(const fraction of [.25,.5,.75])for(const x of seams)for(const d of [-.01,0,.01])closed(x+d,lo+(hi-lo)*fraction);
      for(const y of [lo,hi])for(const x of [-b8CenterX,b8CenterX])for(const d of [-.01,0,.01])closed(x,y+d);
    }
    // Hardware axes are unchanged because the supporting rails/posts did not
    // move. Compare each current bore in its actual standing transform.
    for(const joint of rowJoints){
      const host=registry.require(joint.host),definition=product.parts.find(p=>p.id===joint.host)!;
      if(definition.type!=='mesh'||definition.geometryVariants?.receivers.type!=='bored-panel')throw new Error('Missing receiver geometry');
      const receiver=definition.geometryVariants.receivers;
      for(const dy of [-1.2,1.2]){
        const expected=new THREE.Vector3(joint.side*116.5,joint.y+dy,joint.z);
        const points=(receiver.faceBores??[]).filter(b=>b.axis==='y').flatMap(b=>[-1,1].map(s=>new THREE.Vector3(b.position[0],s*receiver.size[1]/2,b.position[2]).applyMatrix4(host.matrixWorld)));
        if(Math.min(...points.map(p=>p.distanceTo(expected)))>numericEpsilon)errors.push(`Receiver axis mismatch ${joint.id}/${dy}`);
      }
      const bolt=registry.require(`${joint.id}-bolt`),dowel=registry.require(`${joint.id}-dowel`),cam=registry.require(`${joint.id}-cam`);
      for(const object of [bolt,dowel])requireNear(Math.abs(new THREE.Vector3(0,1,0).applyQuaternion(object.quaternion).x),1,`${object.name} axis`);
      requireNear(bolt.position.y,joint.y-1.2,`${joint.id} bolt Y`);requireNear(bolt.position.z,joint.z,`${joint.id} bolt Z`);
      requireNear(dowel.position.y,joint.y+1.2,`${joint.id} dowel Y`);requireNear(dowel.position.z,joint.z,`${joint.id} dowel Z`);
      requireNear(cam.position.x,joint.side*113.3,`${joint.id} cam cross-bore X`);requireNear(cam.position.y,bolt.position.y,`${joint.id} cam cross-bore Y`);
      hardwareJointsChecked++;
    }
    // Sample the actual GSAP insertions, not just simplified nominal waypoints.
    // Only numerical epsilon is used, not the engine's normal collision margin.
    for(const row of rows)for(const id of [`B8-${row.step}--1`,`B8-${row.step}-1`,`B7-${row.step}`]){
      const shotId=id.startsWith('B7')?`S${row.step}-B7-seat`:`S${row.step}-${id}-seat`,shot=shotTimes.get(shotId)!;
      const action=plan.steps[row.step-1].shots.find(s=>s.id===shotId)!.actions[0];
      for(let sample=0;sample<=60;sample++){
        engine.seek(shot.start+(action.duration??shot.duration)*sample/60);pathSamples++;
        const object=registry.require(id);object.updateWorldMatrix(true,true);const panel=object.children[0] as THREE.Mesh;
        for(const blocker of visibleSolids())if(blocker!==panel&&penetrates(panel,blocker))errors.push(`${id} path sample ${sample}/60 penetrates ${blocker.parent?.name}`);
      }
      // Each existing installPart phase is a straight translation with a
      // monotonic easing and no rotation. Its swept box encloses the entire
      // continuous motion, closing the gaps between the sampled poses above.
      let previous:THREE.Box3[]|undefined;
      for(const fraction of [0,.42,.76,1]){
        engine.seek(shot.start+(action.duration??shot.duration)*fraction);
        const object=registry.require(id);object.updateWorldMatrix(true,true);const panel=object.children[0] as THREE.Mesh;
        if(previous){
          sweptSegments++;
          for(const blocker of visibleSolids())if(blocker!==panel&&penetrates(panel,blocker,previous))errors.push(`${id} swept phase ending ${fraction} penetrates ${blocker.parent?.name}`);
        }
        previous=movingBounds(panel);
      }
    }
    // The two bright rectangles in the completed Step 10 front render must
    // resolve to the actual #25 metal return flanges, not background holes.
    engine.seek(cursor-.3);
    const completedSolids=visibleSolids(),front=new THREE.PerspectiveCamera(35,1280/720,.1,2000);
    front.position.set(0,117,-455);front.lookAt(0,117,cabinetFace.faceZ);front.updateMatrixWorld();
    for(const [x,y]of [[361,125],[919,125]]){
      raycaster.setFromCamera(new THREE.Vector2(x/1280*2-1,1-y/720*2),front);
      const hit=raycaster.intersectObjects(completedSolids,false)[0]?.object.parent?.name??'BACKGROUND';
      upperCornerSurfaceHits.push(hit);
      if(!hit.endsWith('H25-bend'))errors.push(`Bright upper corner resolves to ${hit}, not a #25 flange`);
    }
    return result();
  }finally{engine.dispose();for(const geometry of geometries)geometry.dispose();material.dispose();}
}
