/** Product-local presentation audit. This never modifies geometry, installation
 * actions or timing. Run offline and apply only the returned camera dictionary.
 * Actual generated mesh bounds are sampled from the compiled deterministic plan.
 */
import * as THREE from 'three';
import { AnimationEngine } from '@/engine/animation/AnimationEngine';
import { DirectorPlanCompiler } from '@/engine/director/DirectorPlanCompiler';
import { GeometryFactory } from '@/engine/geometry/GeometryFactory';
import { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import type { DirectorPlan, DirectorShot, DirectorStep } from '@/types/director';
import type { ProductDefinition, Vector3Tuple } from '@/types/product';
import type { CameraPreset, VideoDefinition } from '@/types/video';
import { carrierWood, faceGridWood, newWoodIds } from '../product/parts-step11-20';

type Scale = 'CONTEXT_WIDE' | 'WORKING_MEDIUM' | 'CONNECTION_CLOSE_UP';
interface Framing {
  width: number; usefulHeight: number; dominantCoverage: number;
  minX: number; maxX: number; minY: number; maxY: number;
  cameraDistance: number; subjectDepth: number; beyondOldFogStart: boolean;
}
export interface CameraAuditShot {
  step: number; shot: string; camera: string; scale: Scale; start: number; end: number;
  subjectIds: string[]; sampleTimes: number[]; before: Framing; after: Framing;
  changed: boolean; replacement?: string; reason: string;
  sensorIntersections: Array<{time:number;part:string}>;
}
export interface CameraDistanceAudit {
  shots: CameraAuditShot[];
  steps: Array<{step: number; shots: number; changed: number; sampleCount: number}>;
  cameraPresets: Record<string, CameraPreset>;
  shotCameras: Record<string, string>;
  unchangedActionsAndDurations: true;
  sampling: string;
}

function createRuntime(product: ProductDefinition, plan: DirectorPlan) {
  const registry = new ObjectRegistry(), root = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
  const geometries = new Set<THREE.BufferGeometry>();
  for (const part of product.parts) {
    const object = new THREE.Group(); object.name = part.id;
    object.position.set(...part.position);
    object.rotation.set(...(part.rotation ?? [0, 0, 0]).map(v => v * Math.PI / 180) as Vector3Tuple);
    object.scale.set(...(part.scale ?? [1, 1, 1])); object.visible = part.visible ?? true;
    if (part.type === 'mesh') {
      const variants = Object.fromEntries(Object.entries({baseline: part.geometry, ...part.geometryVariants}).map(([key, definition]) => {
        const geometry = GeometryFactory.create(definition); geometry.computeBoundingBox(); geometries.add(geometry);
        return [key, geometry];
      }));
      object.userData.geometryVariants = variants;
      object.add(new THREE.Mesh(variants.baseline, material));
    }
    registry.register(part.id, object);
  }
  for (const part of product.parts) (part.parent ? registry.require(part.parent) : root).add(registry.require(part.id));
  registry.captureBaseline();
  const engine = new AnimationEngine(registry, new Map(product.parts.map(part => [part.id, part])));
  let cursor = 0;
  for (const step of plan.steps) {engine.addActions(DirectorPlanCompiler.actions(step), cursor); cursor += step.shots.reduce((sum, shot) => sum + shot.duration, 0);}
  return {registry, root, engine, dispose() {engine.dispose(); for (const geometry of geometries) geometry.dispose(); material.dispose();}};
}
function visible(object: THREE.Object3D) {
  for (let current: THREE.Object3D | null = object; current; current = current.parent) if (!current.visible) return false;
  return true;
}
function corners(box: THREE.Box3, matrix?: THREE.Matrix4) {
  const points: THREE.Vector3[] = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const point = new THREE.Vector3(x, y, z); if (matrix) point.applyMatrix4(matrix); points.push(point);
  }
  return points;
}
export function actualVisibleMeshPoints(ids: string[], registry: ObjectRegistry, includeHidden = false) {
  const result: THREE.Vector3[] = [], seen = new Set<THREE.Object3D>();
  for (const id of ids) {
    const object = registry.get(id); if (!object) continue;
    object.traverse(child => {
      if (!(child instanceof THREE.Mesh) || seen.has(child) || (!includeHidden && !visible(child))) return;
      seen.add(child); if(!child.geometry.boundingBox)child.geometry.computeBoundingBox();
      result.push(...corners(child.geometry.boundingBox!, child.matrixWorld));
    });
  }
  return result;
}
const pointsFor=actualVisibleMeshPoints;
function sensorIntersections(registry:ObjectRegistry,position:Vector3Tuple):string[]{
  const sensor=new THREE.Vector3(...position),result:string[]=[];
  const directions=[new THREE.Vector3(1,.371,.619),new THREE.Vector3(.293,1,.557),new THREE.Vector3(.419,.233,1)].map(direction=>direction.normalize());
  for(const [id,object]of registry.entries()){
    for(const child of object.children){
      if(!(child instanceof THREE.Mesh)||!visible(child))continue;
      const local=sensor.clone().applyMatrix4(child.matrixWorld.clone().invert());
      if(!child.geometry.boundingBox)child.geometry.computeBoundingBox();if(!child.geometry.boundingBox!.containsPoint(local))continue;
      const probe=new THREE.Mesh(child.geometry,child.material);probe.updateMatrixWorld(true);
      let votes=0;
      for(const direction of directions){
        const ray=new THREE.Raycaster(local,direction),hits=ray.intersectObject(probe,false).sort((a,b)=>a.distance-b.distance);
        if(hits[0]?.distance<.01)continue;
        let winding=0;
        for(let i=0;i<hits.length;){
          const distance=hits[i].distance;let entering=false,leaving=false;
          do{const normal=hits[i].face?.normal;if(normal){const sign=normal.dot(direction);entering ||= sign< -1e-8;leaving ||= sign>1e-8;}i++;}while(i<hits.length&&Math.abs(hits[i].distance-distance)<1e-6);
          if(entering!==leaving)winding+=entering?-1:1;
        }
        if(winding!==0)votes++;
      }
      if(votes>=2)result.push(id);
    }
  }
  return [...new Set(result)];
}
export function measureCameraFraming(points: THREE.Vector3[], preset: CameraPreset): Framing {
  const camera = new THREE.PerspectiveCamera(preset.fov ?? 35, 16 / 9, .1, 5000);
  camera.position.set(...preset.position); camera.lookAt(new THREE.Vector3(...preset.target)); camera.updateMatrixWorld(true);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, sumDepth = 0;
  for (const point of points) {
    const projected = point.clone().project(camera); minX = Math.min(minX, projected.x); maxX = Math.max(maxX, projected.x);
    minY = Math.min(minY, projected.y); maxY = Math.max(maxY, projected.y); sumDepth += point.distanceTo(camera.position);
  }
  const width = points.length ? (maxX - minX) / 2 : 0, usefulHeight = points.length ? (maxY - minY) / 1.50 : 0;
  const subjectDepth = points.length ? sumDepth / points.length : 0;
  return {width, usefulHeight, dominantCoverage: Math.max(width, usefulHeight), minX:points.length?minX:0,maxX:points.length?maxX:0,minY:points.length?minY:0,maxY:points.length?maxY:0,
    cameraDistance: camera.position.distanceTo(new THREE.Vector3(...preset.target)), subjectDepth, beyondOldFogStart: subjectDepth > 600};
}
const framing=measureCameraFraming;
function classify(step: DirectorStep, shot: DirectorShot, preset: CameraPreset): Scale {
  const id = shot.camera ?? '';
  const distance=new THREE.Vector3(...preset.position).distanceTo(new THREE.Vector3(...preset.target));
  // Existing small-joint views sometimes have purely numeric camera IDs. Scale
  // comes from the actual lens/distance too, not naming alone. Do not turn a
  // 50-cm underside bolt view into a 5-metre whole-bed composition.
  if(distance<225||id.includes('-piston')||/S20-D2-\d-edge/.test(id))return 'CONNECTION_CLOSE_UP';
  if (shot.type === 'CONNECTION_MACRO' || /macro|pivot|joint|screw|bolt|cam|dowel|receiver|anchor|bracket|plate|mechanism|insert-face|opposite|layer|C7-\d-edge/.test(id)) return 'CONNECTION_CLOSE_UP';
  if (step.step === 25 || id==='S8-wide' || /cabinet-and-face|two-assemblies|open-context|raised-context|open-result/.test(id)) return 'CONTEXT_WIDE';
  if(shot.type==='ESTABLISHING'&&id.includes('mating-wide'))return 'CONTEXT_WIDE';
  if (shot.actions.some(action => action.type === 'pivotPose')) return 'CONTEXT_WIDE';
  return 'WORKING_MEDIUM';
}
function subjectIds(step: DirectorStep, shot: DirectorShot, product: ProductDefinition, registry: ObjectRegistry, scale: Scale) {
  const definitions = new Map(product.parts.map(part => [part.id, part]));
  const moving = shot.actions.flatMap(action => 'target' in action && definitions.has(action.target) && action.type !== 'hide' ? [action.target] : []);
  if (scale === 'CONNECTION_CLOSE_UP') {
    // Macros deliberately retain local receiver context. Their precise approved
    // framing is not replaced by a fit of an entire long receiving timber.
    return [...new Set([...moving, ...(shot.hardware ?? []), ...(shot.targets ?? []), ...(shot.movingParts ?? [])])];
  }
  let scope: string[];
  if(step.step===11&&shot.id==='S11-context')scope=product.parts.filter(part=>part.type==='mesh'&&part.category!=='hardware'&&part.id!=='installation-wall').map(part=>part.id);
  else if(step.step===8&&shot.camera==='S8-wide')scope=product.parts.filter(part=>part.type==='mesh'&&part.category!=='hardware'&&part.id!=='installation-wall').map(part=>part.id);
  else if (step.step >= 11 && step.step <= 15) scope = faceGridWood;
  else if (step.step === 16) scope = shot.camera?.includes('two-assemblies') ? [...faceGridWood, ...carrierWood] : carrierWood;
  else if (step.step >= 17 && step.step <= 24) scope = newWoodIds;
  else if (step.step >= 25) scope = product.parts.filter(part => part.type === 'mesh' && part.category !== 'hardware' && part.id !== 'installation-wall').map(part => part.id);
  else scope = step.parts;
  const shown = scope.filter(id => {const object = registry.get(id); return object && visible(object);});
  // Include the actual staged incoming part (not every future hidden component).
  const solidMoving = moving.filter(id => {const part = definitions.get(id); return part?.category !== 'hardware';});
  return [...new Set([...shown, ...solidMoving, ...(shot.movingParts ?? []), ...(shot.targets ?? [])])];
}
export function fitWorking(points: THREE.Vector3[], base: CameraPreset, fov = 50, coverage = .76): CameraPreset {
  const bounds = new THREE.Box3().setFromPoints(points), target = bounds.getCenter(new THREE.Vector3());
  const direction = new THREE.Vector3(...base.position).sub(new THREE.Vector3(...base.target)).normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize(), up = direction.clone().cross(right).normalize();
  const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  let distance = 0;
  // Useful frame reserves lower caption space. Default medium has only nearby
  // subject bounds, never the unused cabinet or the whole historical travel box.
  for (const point of points) {
    const offset = point.clone().sub(target);
    distance = Math.max(distance, offset.dot(direction) + Math.abs(offset.dot(up)) / (tan * coverage * .75),
      offset.dot(direction) + Math.abs(offset.dot(right)) / (tan * (16 / 9) * coverage));
  }
  const candidate=(d:number):CameraPreset=>{
    const shifted=target.clone().addScaledVector(right,-d*tan*(16/9)*.09).addScaledVector(up,-d*tan*.20);
    return {position: shifted.clone().addScaledVector(direction,d).toArray() as Vector3Tuple,
      target:shifted.toArray() as Vector3Tuple,fov,...(base.allowUnderside?{allowUnderside:true}:{})};
  };
  // An enclosing world box is intentionally conservative. Zoom according to
  // sampled actual local mesh corners, stopping BEFORE clipping or the caption.
  // This is a coverage guide, not a hard crop of long assemblies.
  let lo=distance*.35,hi=distance;
  for(let i=0;i<30;i++){
    const d=(lo+hi)/2,m=framing(points,candidate(d));
    const fits=m.dominantCoverage<=.78&&m.minX>=-.94&&m.maxX<=.94&&m.minY>=-.50&&m.maxY<=.93;
    if(fits)hi=d;else lo=d;
  }
  return candidate(hi);
}

/** Audit all shots, even deliberately preserved macros/context shots. The
 * returned overrides are per-shot so shrinking one work envelope never changes
 * a different operation that happened to share the accepted camera preset.
 */
export function auditCameraDistance(plan: DirectorPlan, video: VideoDefinition, product: ProductDefinition, comparisonPlan?: DirectorPlan,
  options:{generateOverrides?:boolean;cameraAlreadyRelocated?:boolean;comparisonVideo?:VideoDefinition}={}): CameraDistanceAudit {
  const generateOverrides=options.generateOverrides??true;
  const runtime = createRuntime(product, plan), shots: CameraAuditShot[] = [], cameraPresets: Record<string, CameraPreset> = {}, shotCameras: Record<string, string> = {};
  const comparison=comparisonPlan?createRuntime(product,comparisonPlan):undefined;
  const comparisonShots=new Map<string,{start:number;shot:DirectorShot;step:DirectorStep}>();
  let comparisonCursor=0;
  for(const step of comparisonPlan?.steps??[])for(const shot of step.shots){comparisonShots.set(shot.id,{start:comparisonCursor,shot,step});comparisonCursor+=shot.duration;}
  let cursor = 0;
  try {
    for (const step of plan.steps) for (const shot of step.shots) {
      const start = cursor, end = cursor + shot.duration; cursor = end;
      if (!shot.camera || !video.cameraPresets[shot.camera]) throw new Error(`Missing audit camera: ${shot.id}`);
      const original = video.cameraPresets[shot.camera];
      const oldShot=comparisonShots.get(shot.id);
      const comparisonPreset=options.comparisonVideo?.cameraPresets[oldShot?.shot.camera??'']??original;
      // Re-labeling a camera for a per-shot override does not change the shot's
      // instructional scale. Audit against the original semantic camera role.
      const scale = classify(step,!generateOverrides&&oldShot?oldShot.shot:shot,!generateOverrides?comparisonPreset:original);
      const points: THREE.Vector3[] = [], ids = new Set<string>(), sampleTimes = [.08, .50, .92].map(fraction => start + shot.duration * fraction);
      let workMatrix = new THREE.Matrix4();
      for (const time of sampleTimes) {
        runtime.engine.seek(time); runtime.root.updateMatrixWorld(true);
        const subject = subjectIds(step, shot, product, runtime.registry, scale); subject.forEach(id => ids.add(id));
        points.push(...pointsFor(subject, runtime.registry));
        if (step.step >= 11 && step.step <= 24) workMatrix = runtime.registry.require('bed-motion-root').matrixWorld.clone();
      }
      // All pre-mating bed-work cameras move with the presentation-only work area.
      // Connection angle, FOV and working distance remain identical for macros.
      const relocated: CameraPreset = !options.cameraAlreadyRelocated&&step.step >= 11 && step.step <= 24 ? {...original,
        position: new THREE.Vector3(...original.position).applyMatrix4(workMatrix).toArray() as Vector3Tuple,
        target: new THREE.Vector3(...original.target).applyMatrix4(workMatrix).toArray() as Vector3Tuple} : original;
      const oldPoints:THREE.Vector3[]=[];
      if(comparison&&oldShot)for(const fraction of [.08,.50,.92]){
        comparison.engine.seek(oldShot.start+oldShot.shot.duration*fraction);comparison.root.updateMatrixWorld(true);
        oldPoints.push(...pointsFor(subjectIds(oldShot.step,oldShot.shot,product,comparison.registry,scale),comparison.registry));
      }
      const before = framing(oldPoints.length?oldPoints:points, comparisonPreset), relocatedFraming = framing(points, relocated);
      let afterPreset = relocated;
      let reason = scale === 'CONNECTION_CLOSE_UP' ? 'Preserve useful approved connection close-up; no macro-wide room redesign.' : scale === 'CONTEXT_WIDE' ? 'Deliberate context/orientation view; preserve spatial relationship.' : 'Working-medium framing already readable.';
      if (generateOverrides&&scale === 'WORKING_MEDIUM' && points.length && step.step >= 11 && step.step <= 24) {
        // Priority bed construction: replace far nominal layout boxes with actual
        // current active subassembly + staged incoming-part envelope.
        const direction=new THREE.Vector3(...relocated.position).sub(new THREE.Vector3(...relocated.target));
        // The work zone is now in FRONT. A +Z broad working view can put the
        // sensor behind B8/the room wall. Use the clean opposite-front cut with
        // the same elevation and left/right angle, not a physical part bypass.
        if(workMatrix.elements[14]<0)direction.z=-Math.abs(direction.z);
        const frontBase={...relocated,position:new THREE.Vector3(...relocated.target).add(direction).toArray() as Vector3Tuple};
        afterPreset = fitWorking(points, frontBase);
        reason = 'Working medium fitted to sampled actual active mesh envelope; 50° lens reduces empty/fog distance. Front-side cut retains elevation and handed angle while avoiding the rear cabinet/wall.';
      }
      if(generateOverrides&&scale==='CONTEXT_WIDE'&&points.length&&step.step>=11&&step.step<=24&&shot.id!=='S11-context'){
        const direction=new THREE.Vector3(...relocated.position).sub(new THREE.Vector3(...relocated.target));
        if(workMatrix.elements[14]<0)direction.z=-Math.abs(direction.z);
        afterPreset=fitWorking(points,{...relocated,position:new THREE.Vector3(...relocated.target).add(direction).toArray() as Vector3Tuple},55,.78);
        reason='Deliberate two-subassembly context, now composed from FRONT at 55° rather than fitting the obsolete rear work area.';
      }
      if (generateOverrides&&step.step === 11 && shot.id === 'S11-context') {
        // The accepted shot used an enormous cabinet-to-rear-work-area box. New
        // context explains a separate front work area using cabinet + first rails.
        runtime.engine.seek(end - .00001); runtime.root.updateMatrixWorld(true);
        const cabinet = product.parts.filter(part => part.type === 'mesh' && part.category !== 'hardware' && !part.parent && part.id !== 'installation-wall' && visible(runtime.registry.require(part.id))).map(part => part.id);
        const context = pointsFor([...cabinet, ...step.parts], runtime.registry, true);
        const direction=new THREE.Vector3(...relocated.position).sub(new THREE.Vector3(...relocated.target));direction.z=-Math.abs(direction.z);
        afterPreset = fitWorking(context, {...relocated,position:new THREE.Vector3(...relocated.target).add(direction).toArray() as Vector3Tuple},55,.78);
        reason = 'Front work-area context: both separate first rails and completed rear cabinet, not the obsolete rear staging envelope.';
      }
      if(!generateOverrides){afterPreset=original;reason='Final selected camera audited at actual deterministic poses; no new camera or motion change generated.';}
      const sensorHits:Array<{time:number;part:string}>=[];
      if(!generateOverrides)for(const time of sampleTimes){
        runtime.engine.seek(time);runtime.root.updateMatrixWorld(true);
        for(const part of sensorIntersections(runtime.registry,afterPreset.position))sensorHits.push({time,part});
      }
      const changed = JSON.stringify(afterPreset) !== JSON.stringify(generateOverrides?original:comparisonPreset), replacement = changed ? generateOverrides?`polish01-${shot.id}`:shot.camera : undefined;
      if (replacement&&generateOverrides) {cameraPresets[replacement] = afterPreset; shotCameras[shot.id] = replacement;}
      shots.push({step: step.step, shot: shot.id, camera: shot.camera, scale, start, end, subjectIds: [...ids], sampleTimes,
        before, after: framing(points, afterPreset), changed, replacement,sensorIntersections:sensorHits, reason: changed && reason.startsWith('Preserve') ? `${reason} Presentation work-area transform only.` : reason});
      // Keep relocation report distinct from direct distance changes.
      if (changed && scale === 'CONTEXT_WIDE' && relocatedFraming.dominantCoverage === 0) shots[shots.length - 1].reason += ' Empty establishing subject; staging first appears in next shot.';
    }
    return {shots, steps: plan.steps.map(step => {const rows = shots.filter(row => row.step === step.step); return {step: step.step, shots: rows.length, changed: rows.filter(row => row.changed).length, sampleCount: rows.length * 3};}),
      cameraPresets, shotCameras, unchangedActionsAndDurations: true,
      sampling: 'Every shot sampled at 8%, 50%, 92%; actual generated geometry/variants, compiled deterministic actions, ancestor visibility and world matrices. Bounds are instructional coverage guides, not proof of occlusion; still QA is required. Connection close-ups are retained, not forced into 65–85% whole-timber framing.'};
  } finally {runtime.dispose();comparison?.dispose();}
}
