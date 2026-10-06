import * as THREE from 'three';
import {newWoodIds} from '../product/parts-step11-20';
import {fullProduct,mechanism,sideIds,bedAnchor,cabAnchor,legAnchor,legTimber} from '../product/parts-step21-31';
import {createFullRuntime, materialCells} from './full-validation';
import {fullPlan} from '../director/steps21-31';
import type {DirectorPlan} from '@/types/director';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import type {GeometryDefinition,Vector3Tuple} from '@/types/product';
import {correctFootCorners,armGeometry,uprightGeometry} from '../product/foot-corner-reconstruction';
import {steps01To20Product} from '../product/parts-step11-20';

function trianglesIntoCells(source:THREE.Mesh,target:THREE.Mesh,targetCells:THREE.Box3[]){
  const relative=target.matrixWorld.clone().invert().multiply(source.matrixWorld);
  const positions=source.geometry.getAttribute('position'),indices=source.geometry.index;
  const triangle=new THREE.Triangle(),bounds=targetCells.map(b=>b.clone().expandByScalar(-.005));
  for(let i=0;i<(indices?.count??positions.count);i+=3){
    triangle.a.fromBufferAttribute(positions,indices?indices.getX(i):i).applyMatrix4(relative);
    triangle.b.fromBufferAttribute(positions,indices?indices.getX(i+1):i+1).applyMatrix4(relative);
    triangle.c.fromBufferAttribute(positions,indices?indices.getX(i+2):i+2).applyMatrix4(relative);
    if(bounds.some(b=>b.intersectsTriangle(triangle)))return true;
  }return false;
}
function bounds(mesh:THREE.Mesh){return mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);}
function meshCellsCollision(source:THREE.Mesh,target:THREE.Mesh,targetCells:THREE.Box3[]){return bounds(source).intersectsBox(bounds(target))&&trianglesIntoCells(source,target,targetCells);}

/** Independently evaluate a receiver-axis candidate, before accepting a
 * mechanism geometry change. Uses the actual generated timber meshes, rigid
 * Step 20 bed pose and the locked cabinet — no Step 25–31 path assumptions. */
export function evaluatePivotCandidate(height:number, bedLocalZ:number, angularIncrement=.5){
  const rt=createFullRuntime();
  const definitions=new Map(fullProduct.parts.map(p=>[p.id,p]));
  const cells=new Map(fullProduct.parts.filter(p=>p.type==='mesh').map(p=>[p.id,materialCells(p.geometry)]));
  const cabinet=fullProduct.parts.filter(p=>p.type==='mesh'&&!p.parent&&p.category!=='hardware'&&p.id!=='installation-wall').map(p=>p.id);
  const errors=new Set<string>(),hits:Array<{angle:number;moving:string;fixed:string}>=[];
  let meshPairs=0,minFloorClearance=Infinity;
  const root=rt.registry.require('bed-motion-root'),localPivot=new THREE.Vector3(0,45,260+bedLocalZ),pivot=new THREE.Vector3(0,height,-9.2);
  try{
    rt.engine.seek(rt.ends.get(20)!-.00001);rt.root.updateMatrixWorld(true);
    for(let angle=0;angle<=90+1e-7;angle+=angularIncrement){
      root.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),angle*Math.PI/180);
      root.position.copy(pivot).sub(localPivot.clone().applyQuaternion(root.quaternion));rt.root.updateMatrixWorld(true);
      for(const moving of newWoodIds){
        const o=rt.registry.require(moving),mesh=o.children[0] as THREE.Mesh;
        const bbox=mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
        minFloorClearance=Math.min(minFloorClearance,bbox.min.y);
        if(bbox.min.y<-.005)errors.add(`Floor: ${moving}`);
        for(const fixed of cabinet){
          const f=rt.registry.require(fixed);if(!f.visible)continue;
          const fm=f.children[0] as THREE.Mesh;
          if(!bbox.intersectsBox(fm.geometry.boundingBox!.clone().applyMatrix4(fm.matrixWorld)))continue;
          meshPairs++;
          // Bidirectional tests also catch one solid entirely inside another.
          if(trianglesIntoCells(fm,mesh,cells.get(moving)!)||trianglesIntoCells(mesh,fm,cells.get(fixed)!)){
            errors.add(`${moving} crosses ${fixed}`);hits.push({angle,moving,fixed});
          }
        }
      }
    }
    // Actual generated endpoint bounds, useful for reviewing the tightest
    // top/rear fit independently of the articulation sample count.
    const bounds=(ids:string[])=>{const box=new THREE.Box3();for(const id of ids)box.union(new THREE.Box3().setFromObject(rt.registry.require(id)));return {min:box.min.toArray(),max:box.max.toArray()};};
    const closed=bounds(newWoodIds);
    const top=rt.registry.require('B6');const topBounds=new THREE.Box3().setFromObject(top);
    const topClearance=topBounds.min.y-closed.max[1];
    root.quaternion.identity();root.position.copy(pivot).sub(localPivot);rt.root.updateMatrixWorld(true);
    const open=bounds(newWoodIds),rear=new THREE.Box3().setFromObject(rt.registry.require('E5'));
    const rearClearance=rear.min.z-open.max[2];
    const cabWidthClearance=Math.min(...['A5','A6'].map(id=>{
      const b=new THREE.Box3().setFromObject(rt.registry.require(id));return id==='A5'?open.min[0]-b.max.x:b.min.x-open.max[0];
    }));
    return {height,bedLocalZ,valid:!errors.size,errors:[...errors],firstHits:hits.slice(0,20),hitCount:hits.length,meshPairs,angularIncrement,minFloorClearance,topClearance,rearClearance,cabWidthClearance,open,closed,estimated:true,method:'Actual generated meshes, bidirectional mesh-to-material-cell intersection; 0.05 mm contact tolerance. Timber cells conserve routed profiles; bores are not used to waive structural intersections.',partCount:definitions.size};
  }finally{rt.dispose();}
}

/** Independent actual cylinder/rod articulation, no free-eye staging path or
 * existing link actions can mask a bad attached mechanism fit. */
export function evaluateAttachedPistonSweep(angularIncrement=.25,plan:DirectorPlan=fullPlan){
  const rt=createFullRuntime(true,plan),errors=new Set<string>();let cylinderChecks=0,minLength=Infinity,maxLength=0;
  const wood=fullProduct.parts.filter(p=>p.type==='mesh'&&p.category!=='hardware'&&p.id!=='installation-wall'&&!p.parent||newWoodIds.includes(p.id));
  const cells=new Map(wood.filter(p=>p.type==='mesh').map(p=>[p.id,materialCells(p.geometry)]));
  try{
    rt.engine.seek(rt.duration-.00001);const root=rt.registry.require('bed-motion-root');
    for(let angle=0;angle<=90+1e-7;angle+=angularIncrement){
      root.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),angle*Math.PI/180);
      root.position.copy(new THREE.Vector3(...mechanism.cabinetPivot)).sub(new THREE.Vector3(...mechanism.sourcePivot).applyQuaternion(root.quaternion));rt.root.updateMatrixWorld(true);
      for(const side of [-1,1]){
        const s=sideIds(side),a=new THREE.Vector3(...bedAnchor(side)).applyMatrix4(root.matrixWorld),b=new THREE.Vector3(...cabAnchor(side)),length=a.distanceTo(b);
        minLength=Math.min(minLength,length);maxLength=Math.max(maxLength,length);
        if(length<mechanism.bodyLength||length>mechanism.freeLength+.0001)errors.add(`Piston stroke: side ${side} at ${angle}° (${length})`);
        const piston=rt.registry.require(s.piston);piston.position.copy(a);piston.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
        const rod=rt.registry.require(`${s.piston}-rod`);rod.position.y=(length+mechanism.bodyLength)/2;rod.scale.y=length-mechanism.bodyLength;rt.registry.require(`${s.piston}-eyeB`).position.y=length;
        piston.updateWorldMatrix(true,true);
        if(piston.localToWorld(new THREE.Vector3()).distanceTo(a)>1e-4||rt.registry.require(`${s.piston}-eyeB`).getWorldPosition(new THREE.Vector3()).distanceTo(b)>1e-4)errors.add(`Piston endpoint: ${side} at ${angle}°`);
        for(const child of ['body','rod']){
          const moving=rt.registry.require(`${s.piston}-${child}`).children[0] as THREE.Mesh;
          for(const target of wood){const object=rt.registry.require(target.id);if(!object.visible)continue;const mesh=object.children[0];if(!(mesh instanceof THREE.Mesh))continue;
            if(meshCellsCollision(moving,mesh,cells.get(target.id)!))errors.add(`Piston ${child} side ${side} crosses ${target.id}`);cylinderChecks++;
          }
        }
      }
    }
    return {valid:!errors.size,errors:[...errors],angularIncrement,minLength,maxLength,bodyLength:mechanism.bodyLength,maximumLength:mechanism.freeLength,cylinderChecks};
  }finally{rt.dispose();}
}

function clipSegment(a:THREE.Vector3,b:THREE.Vector3,box:THREE.Box3):THREE.Vector3[]{
  let lo=0,hi=1;const direction=b.clone().sub(a);
  for(const axis of ['x','y','z'] as const){
    if(Math.abs(direction[axis])<1e-9){if(a[axis]<box.min[axis]||a[axis]>box.max[axis])return[];continue;}
    const t1=(box.min[axis]-a[axis])/direction[axis],t2=(box.max[axis]-a[axis])/direction[axis];lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return[];
  }return[a.clone().addScaledVector(direction,lo),a.clone().addScaledVector(direction,hi)];
}
function corners(box:THREE.Box3){return Array.from({length:8},(_,i)=>new THREE.Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z));}
const edges=Array.from({length:8},(_,i)=>[1,2,4].filter(k=>!(i&k)).map(k=>[i,i|k])).flat();
function intersectionPocket(moving:THREE.Box3,fixed:THREE.Box3,relative:THREE.Matrix4){
  const a=corners(moving).map(p=>p.applyMatrix4(relative)),b=corners(fixed),inverse=relative.clone().invert(),points:THREE.Vector3[]=[];
  for(const [i,j]of edges){points.push(...clipSegment(a[i],a[j],fixed));points.push(...clipSegment(b[i].clone().applyMatrix4(inverse),b[j].clone().applyMatrix4(inverse),moving).map(p=>p.applyMatrix4(relative)));}
  return points.length?new THREE.Box3().setFromPoints(points):undefined;
}

function clippedTrianglePoints(triangle:THREE.Triangle,box:THREE.Box3){
  let polygon=[triangle.a.clone(),triangle.b.clone(),triangle.c.clone()];
  for(const axis of ['x','y','z'] as const)for(const side of [-1,1]){
    const edge=side<0?box.min[axis]:box.max[axis],inside=(p:THREE.Vector3)=>side<0?p[axis]>=edge-1e-9:p[axis]<=edge+1e-9,next:THREE.Vector3[]=[];
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length],ia=inside(a),ib=inside(b);
      if(ia)next.push(a);
      if(ia!==ib)next.push(a.clone().lerp(b,(edge-a[axis])/(b[axis]-a[axis])));
    }polygon=next;if(!polygon.length)return[];
  }return polygon;
}
function actualTrianglePocket(source:THREE.Mesh,target:THREE.Mesh,targetCells:THREE.Box3[]){
  const relative=target.matrixWorld.clone().invert().multiply(source.matrixWorld),p=source.geometry.getAttribute('position'),index=source.geometry.index,box=new THREE.Box3();
  for(let i=0;i<(index?.count??p.count);i+=3){
    const v=(k:number)=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(relative),triangle=new THREE.Triangle(v(0),v(1),v(2));
    for(const cell of targetCells)for(const point of clippedTrianglePoints(triangle,cell))box.expandByPoint(point);
  }return box;
}

/** Diagnose credible 1–2 cm timber legs, without thinning them to evade the
 * locked face rails. Pocket envelopes are exact OBB-cell intersections for D3
 * against routed C2 timber, expressed in C2 local coordinates. */
export function evaluateLegSweep(angularIncrement=.5){
  const rt=createFullRuntime(),errors=new Set<string>(),hits:Array<{angle:number;moving:string;fixed:string}>=[];
  const cells=new Map(fullProduct.parts.filter(p=>p.type==='mesh').map(p=>[p.id,materialCells(p.geometry)]));
  const cab=fullProduct.parts.filter(p=>p.type==='mesh'&&!p.parent&&p.category!=='hardware'&&p.id!=='installation-wall').map(p=>p.id),pockets=new Map<string,THREE.Box3>(),unions=new Map<string,THREE.Box3>();
  let samples=0;
  try{
    rt.engine.seek(rt.duration-.00001);const root=rt.registry.require('bed-motion-root');root.quaternion.identity();root.position.copy(new THREE.Vector3(...mechanism.cabinetPivot)).sub(new THREE.Vector3(...mechanism.sourcePivot));
    for(let angle=0;angle>=-90-1e-7;angle-=angularIncrement){
      for(const side of [-1,1]){const leg=rt.registry.require(sideIds(side).leg),pivot=new THREE.Vector3(...legAnchor(side));leg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),angle*Math.PI/180);leg.position.copy(pivot).sub(pivot.clone().applyQuaternion(leg.quaternion));}rt.root.updateMatrixWorld(true);samples++;
      for(const moving of legTimber){const mesh=rt.registry.require(moving).children[0] as THREE.Mesh;
        for(const fixed of [...newWoodIds,...cab]){const object=rt.registry.require(fixed);if(!object.visible)continue;const fm=object.children[0] as THREE.Mesh;
          if(!bounds(mesh).intersectsBox(bounds(fm)))continue;
          if(trianglesIntoCells(fm,mesh,cells.get(moving)!)||trianglesIntoCells(mesh,fm,cells.get(fixed)!)){
            errors.add(`${moving} crosses ${fixed}`);hits.push({angle,moving,fixed});
            if((moving.startsWith('D3-')||moving.startsWith('D6-'))&&fixed.startsWith('C2-')){
              const relative=fm.matrixWorld.clone().invert().multiply(mesh.matrixWorld),key=`${moving}/${fixed}`,box=pockets.get(key)??new THREE.Box3();
              // D3 is an exact union of orthogonal manufactured cells; D6
              // has rounded polygon boundaries, so clip its actual mesh.
              if(moving.startsWith('D3-'))for(const a of cells.get(moving)!)for(const b of cells.get(fixed)!){const intersection=intersectionPocket(a,b,relative);if(intersection)box.union(intersection);}
              else box.union(actualTrianglePocket(mesh,fm,cells.get(fixed)!));
              pockets.set(key,box);const union=unions.get(fixed)??new THREE.Box3();union.union(box);unions.set(fixed,union);
            }
          }
        }
      }
    }
    const pocket=(pair:string,b:THREE.Box3)=>({pair,partLocalMin:b.min.toArray(),partLocalMax:b.max.toArray(),extent:b.getSize(new THREE.Vector3()).toArray()});
    return {valid:!errors.size,errors:[...errors],firstHits:hits.slice(0,24),hitCount:hits.length,samples,angularIncrement,pockets:[...pockets].map(([pair,b])=>pocket(pair,b)),unionPockets:[...unions].map(([fixed,b])=>{
      const object=rt.registry.require(fixed),world=b.clone().applyMatrix4(object.matrixWorld);return{...pocket(fixed,b),openWorldMin:world.min.toArray(),openWorldMax:world.max.toArray()};
    }),note:'Diagnostic sampled intersection envelopes, NOT proposed machining dimensions. D3 uses exact OBB material cells; D6 uses generated mesh surface clipped to actual routed C2 material cells. Additional clearance and engineering review would be required before any relief. No rail relief, mesh omission or collision waiver is applied.'};
  }finally{rt.dispose();}
}

/** Keep the mounting web as a real obstacle. Correctly seated pivot contact
 * is not excluded: the bearing must physically fit the actual open cradle. */
export function validateBearingReceiverPaths(plan:DirectorPlan=fullPlan){
  const rt=createFullRuntime(true,plan),errors=new Set<string>(),hits:Array<{shot:string;side:number;progress:number;center:number[]}>=[];
  let sampledPoses=0;
  try{
    for(const step of plan.steps.slice(24))for(const shot of step.shots){
      if(!shot.actions.some(a=>a.type==='pivotPose'&&a.target==='bed-motion-root'))continue;
      const start=rt.shots.get(shot.id)!.start;
      for(let i=0;i<=90;i++){
        rt.engine.seek(start+shot.duration*i/90);rt.root.updateMatrixWorld(true);sampledPoses++;
        for(const side of [-1,1]){
          const s=sideIds(side),bearing=rt.registry.require(s.bearing).children[0] as THREE.Mesh,receiver=rt.registry.require(s.cab),target=receiver.children[0] as THREE.Mesh;
          const definition=fullProduct.parts.find(p=>p.id===s.cab)!;
          if(definition.type!=='mesh')throw new Error('Receiver geometry missing');
          const variants=receiver.userData.geometryVariants as Record<string,THREE.BufferGeometry>,variant=Object.entries(variants).find(([,g])=>g===target.geometry)?.[0],geometry=variant&&variant!=='baseline'?definition.geometryVariants![variant]:definition.geometry;
          if(meshCellsCollision(bearing,target,materialCells(geometry))){
            errors.add(`Bearing ${side} crosses D8/D9 metal at ${shot.id}`);
            if(!hits.some(h=>h.shot===shot.id&&h.side===side))hits.push({shot:shot.id,side,progress:i/90,center:rt.registry.require(s.bearing).getWorldPosition(new THREE.Vector3()).toArray()});
          }
        }
      }
    }
    return{valid:!errors.size,errors:[...errors],firstHits:hits,sampledPoses,method:'Actual bearing meshes against the actual receiver planar material profile; open cradle contact is checked, not waived.'};
  }finally{rt.dispose();}
}

/** Read-only feasibility trial. Generated candidate meshes exist only in this
 * disposable runtime; no product definition, bore or DirectorPlan is changed. */
export function evaluateLegRefitCandidate(pivotZ=172,joinZ=155,upperReach=17,lowerReach=5,angularIncrement=.5,foldSign=-1,options:{relief?:boolean;bedTilt?:number;legX?:number;insideX?:number;endZ?:number}={}){
  const rt=createFullRuntime(),generated:THREE.BufferGeometry[]=[],errors=new Set<string>(),hits:Array<{phase:string;angle:number;moving:string;fixed:string}>=[];
  const cells=new Map(fullProduct.parts.filter(p=>p.type==='mesh').map(p=>[p.id,materialCells(p.geometry)]));
  const cabinet=fullProduct.parts.filter(p=>p.type==='mesh'&&!p.parent&&p.category!=='hardware'&&p.id!=='installation-wall').map(p=>p.id);
  let legPoses=0,bedPoses=0,minFloorClearance=Infinity;
  const setGeometry=(id:string,g:GeometryDefinition,position:Vector3Tuple)=>{const o=rt.registry.require(id),mesh=o.children[0] as THREE.Mesh,geometry=GeometryFactory.create(g);geometry.computeBoundingBox();generated.push(geometry);mesh.geometry=geometry;o.position.set(...position);cells.set(id,materialCells(g));};
  const check=(phase:string,angle:number,targets:string[])=>{rt.root.updateMatrixWorld(true);for(const id of legTimber){const mesh=rt.registry.require(id).children[0] as THREE.Mesh;
    minFloorClearance=Math.min(minFloorClearance,bounds(mesh).min.y);
    if(bounds(mesh).min.y<-.005)errors.add(`${phase}: ${id} crosses floor`);
    for(const target of targets){const o=rt.registry.require(target);if(!o.visible)continue;const fixed=o.children[0] as THREE.Mesh;if(!bounds(mesh).intersectsBox(bounds(fixed)))continue;
      if(trianglesIntoCells(mesh,fixed,cells.get(target)!)||trianglesIntoCells(fixed,mesh,cells.get(id)!)){errors.add(`${phase}: ${id} crosses ${target}`);hits.push({phase,angle,moving:id,fixed:target});}
    }
  }};
  try{
    rt.engine.seek(rt.duration-.00001);
    if(options.relief){
      // Always start a disposable trial from the unchanged source profiles,
      // never apply the local correction twice to an already relieved rail.
      const corrected=structuredClone(steps01To20Product.parts);correctFootCorners(corrected,options.insideX,options.endZ);
      for(const id of ['C1-start','C2-left','C2-right']){const p=corrected.find(p=>p.id===id)!;if(p.type==='mesh')setGeometry(id,p.geometry,p.position);}
    }
    for(const side of [-1,1]){
      const x=side*(options.legX??mechanism.legX),upperY=45,lowerY=10.5,centerY=(upperY+lowerY)/2;
      setGeometry(`D3-${side}`,uprightGeometry(side),[x,centerY,joinZ]);
      for(const [label,y,reach]of [['D7',upperY,upperReach],['D6',lowerY,lowerReach]] as const){
        setGeometry(`${label}-${side}`,armGeometry(side,reach,label==='D7'),[x,y,joinZ]);
      }
    }
    const root=rt.registry.require('bed-motion-root'),pivot=new THREE.Vector3(...mechanism.cabinetPivot),localPivot=new THREE.Vector3(...mechanism.sourcePivot);
    root.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),(options.bedTilt??0)*Math.PI/180);root.position.copy(pivot).sub(localPivot.clone().applyQuaternion(root.quaternion));
    for(let progress=0;progress<=90+1e-7;progress+=angularIncrement){const angle=progress*foldSign;for(const side of [-1,1]){const leg=rt.registry.require(sideIds(side).leg),p=new THREE.Vector3(side*(options.legX??mechanism.legX),45,pivotZ);leg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),angle*Math.PI/180);leg.position.copy(p).sub(p.clone().applyQuaternion(leg.quaternion));}check('legFold',angle,[...newWoodIds,...cabinet]);legPoses++;}
    for(let angle=0;angle<=90+1e-7;angle+=angularIncrement){root.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),angle*Math.PI/180);root.position.copy(pivot).sub(localPivot.clone().applyQuaternion(root.quaternion));check('bedClose',angle,cabinet);bedPoses++;}
    const firstHitByPair=[...new Map(hits.toReversed().map(h=>[`${h.phase}/${h.moving}/${h.fixed}`,h])).values()];
    return{pivotZ,joinZ,upperReach,lowerReach,depth:2,foldSign,...options,valid:!errors.size,errors:[...errors],firstHitByPair,hitCount:hits.length,legPoses,bedPoses,angularIncrement,minFloorClearance,note:'Disposable actual-mesh timber feasibility. Correct footward upright / headward arms. Explicit local C1/C2 relief candidate only when enabled; hardware and installation paths are NOT validated by this candidate trial.'};
  }finally{for(const g of generated)g.dispose();rt.dispose();}
}
