import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import type {OrbitControls} from 'three-stdlib';
import {CameraEngine} from '@/engine/camera/CameraEngine';
import {ProductEngine} from '@/engine/product/ProductEngine';
import {VideoEngine} from '@/engine/video/VideoEngine';
import {PrefixedVideoEngine,presentationTime} from '@/presentation/intro/PrefixedVideoEngine';
import {createFullRuntime,materialCells} from '../validation/full-validation';
import {fullProduct} from '../product/parts-step21-31';
import {polish02Plan,polish02Assembly,polish02bVideo} from '../director/polish-pass02b';
import {microVideo,microIntro,step26Camera} from '../director/final-micro-pass';
const dir='output/wf311613-standalone-murphy-bed/reviews/final-micro-pass';mkdirSync(dir,{recursive:true});
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const sha=(v:Buffer)=>createHash('sha256').update(v).digest('hex');
const approved=JSON.parse(readFileSync('output/wf311613-standalone-murphy-bed/reviews/director-polish-02b/approved-source-locks.json','utf8')) as Record<string,string>;
const deltas=Object.entries(approved).filter(([p,h])=>sha(readFileSync(p))!==h).map(([p])=>p);
// Explicitly authorized presentation-host adaptation, not a mechanical waiver.
const allowed=['src/components/viewer/ProductViewer.tsx'];
const unexpected=deltas.filter(p=>!allowed.includes(p));
const rt=createFullRuntime(true,polish02Plan);rt.engine.dispose();
const camera=new THREE.PerspectiveCamera(),target=new THREE.Vector3();
const controls={target,minPolarAngle:.15,maxPolarAngle:Math.PI-.15,update:()=>{camera.lookAt(target);camera.updateMatrixWorld(true);}} as OrbitControls;
const cam=new CameraEngine(camera,controls,microVideo.cameraPresets),tree=ProductEngine.build(fullProduct);
const capture=()=>{rt.root.updateMatrixWorld(true);return [...rt.registry.entries()].map(([id,o])=>{
  const rows:unknown[]=[];o.traverse(c=>rows.push({p:c.position.toArray(),q:c.quaternion.toArray(),s:c.scale.toArray(),v:c.visible,g:c instanceof THREE.Mesh?c.geometry.uuid:undefined}));return {id,rows};
});};
const original=new VideoEngine(rt.registry,tree,polish02Assembly,polish02bVideo,cam);original.seek(0);
const expected=JSON.stringify(capture()),baseCamera={p:camera.position.clone(),t:target.clone(),fov:camera.fov};
original.dispose();rt.registry.reset();const engine=new PrefixedVideoEngine(rt.registry,tree,polish02Assembly,microVideo,cam);
const errors:string[]=[],prefixStates=new Map<number,string>();let resets=0;
const visible=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(!p.visible)return false;return true;};
const defs=new Map(fullProduct.parts.map(p=>[p.id,p]));
const groupOf=new Map<string,string>();
for(const g of microIntro.groups)for(const id of g.targets)rt.registry.require(id).traverse(o=>{if(o instanceof THREE.Mesh)groupOf.set(o.parent!.name,g.id);});
const meshes:THREE.Mesh[]=[];rt.root.traverse(o=>{if(o instanceof THREE.Mesh&&groupOf.has(o.parent!.name))meshes.push(o);});
const bvhs=new WeakMap<THREE.BufferGeometry,MeshBVH>();
function overlaps(a:THREE.Mesh,b:THREE.Mesh){
  const ab=new THREE.Box3().setFromObject(a),bb=new THREE.Box3().setFromObject(b);
  if(!ab.expandByScalar(-.005).intersectsBox(bb.clone().expandByScalar(-.005)))return false;
  const definition=defs.get(a.parent!.name);if(!definition||definition.type!=='mesh')return false;
  const variant=Object.entries(a.parent!.userData.geometryVariants??{}).find(([,g])=>g===a.geometry)?.[0];
  const geometry=variant&&variant!=='baseline'?definition.geometryVariants?.[variant]??definition.geometry:definition.geometry;
  const cells=materialCells(geometry);if(!cells.length)return false;
  let bvh=bvhs.get(b.geometry);if(!bvh){bvh=new MeshBVH(b.geometry);bvhs.set(b.geometry,bvh);}
  const matrix=b.matrixWorld.clone().invert().multiply(a.matrixWorld);
  return cells.some(box=>bvh!.intersectsBox(box.clone().expandByScalar(-.005),matrix));
}
try{
  for(const t of [0,2.5,3.75,4.125]){engine.seek(t);prefixStates.set(t,JSON.stringify(capture()));}
  for(const t of [5,2.5,5,0,5,4.125,5,3.75,5]){
    engine.seek(t);
    if(t===5){resets++;if(JSON.stringify(capture())!==expected)errors.push('Step 1 registry differs');if(camera.position.distanceTo(baseCamera.p)>1e-10||target.distanceTo(baseCamera.t)>1e-10||camera.fov!==baseCamera.fov)errors.push('Step 1 camera differs');if(presentationTime(microVideo,t)!==0)errors.push('Presentation clock leaks');}
    else if(JSON.stringify(capture())!==prefixStates.get(t))errors.push(`Non-deterministic intro at ${t}`);
  }
  // Presentation-only paths; no assembly thresholds/rules changed. Existing
  // completed-state mates are recorded separately from any NEW intersection.
  engine.seek(microIntro.heroDuration);rt.root.updateMatrixWorld(true);
  const pairs:Array<[THREE.Mesh,THREE.Mesh,string]>=[],initialContacts:string[]=[];
  for(let i=0;i<meshes.length;i++)for(let j=i+1;j<meshes.length;j++){
    const a=meshes[i],b=meshes[j];if(!visible(a)||!visible(b)||groupOf.get(a.parent!.name)===groupOf.get(b.parent!.name))continue;
    const id=`${a.parent!.name}/${b.parent!.name}`;
    if(overlaps(a,b)||overlaps(b,a))initialContacts.push(id);else pairs.push([a,b,id]);
  }
  let pairChecks=0;const pathErrors=new Set<string>();
  for(let i=0;i<=60;i++){
    engine.seek(microIntro.heroDuration+microIntro.separationDuration*i/60);rt.root.updateMatrixWorld(true);
    for(const[a,b,id]of pairs){pairChecks++;if(overlaps(a,b)||overlaps(b,a))pathErrors.add(`New cross-group penetration ${id} at sample ${i}`);}
  }
  errors.push(...pathErrors);
  const ray=new THREE.Raycaster(),cameraChecks:unknown[]=[];
  for(const [shot,p]of [['S26-target',.7],['S26-eye-align',.2],['S26-eye-align',.5],['S26-eye-align',.9],['S26-verify',.8]] as const){
    const s=rt.shots.get(shot)!;engine.seek(5+s.start+s.duration*p);rt.root.updateMatrixWorld(true);
    const all:THREE.Mesh[]=[];rt.root.traverse(o=>{if(o instanceof THREE.Mesh&&visible(o))all.push(o);});
    const eye=rt.registry.require('E2--1-eyeB').getWorldPosition(new THREE.Vector3()),origin=new THREE.Vector3(...step26Camera.position);
    ray.set(origin,eye.clone().sub(origin).normalize());const hit=ray.intersectObjects(all,false)[0];
    const view=new THREE.PerspectiveCamera(step26Camera.fov,1280/720,1,1800);view.position.copy(origin);view.lookAt(new THREE.Vector3(...step26Camera.target));view.updateMatrixWorld(true);
    const ndc=eye.clone().project(view),mount=new THREE.Vector3(-115.4,110,9.5).project(view);
    const polar=new THREE.Spherical().setFromVector3(origin.clone().sub(new THREE.Vector3(...step26Camera.target))).phi;
    cameraChecks.push({shot,p,first:hit?.object.parent?.name,eye:eye.toArray(),eyeNDC:ndc.toArray(),mountNDC:mount.toArray(),polarAngle:polar});
    if(!hit||!hit.object.parent!.name.startsWith('E2--1'))errors.push(`${shot} eye occluded by ${hit?.object.parent?.name}`);
    if(Math.abs(ndc.x)>.9||Math.abs(ndc.y)>.9||Math.abs(mount.x)>.9||Math.abs(mount.y)>.9)errors.push(`${shot} connection leaves safe framing`);
    if(polar<.15||polar>Math.PI-.15)errors.push(`${shot} preset depends on polar clamping`);
  }
  const report={valid:!errors.length&&!unexpected.length,errors,unexpectedSourceDeltas:unexpected,authorizedPresentationHostDeltas:deltas,
    mechanicalSourceLocksUnchanged:unexpected.length===0,productHash:hash(fullProduct),materialHash:hash(fullProduct.materials),
    approvedPlanHash:hash(polish02Plan),assemblyHash:hash(polish02Assembly),approved02bVideoHash:hash(polish02bVideo),microVideoHash:hash(microVideo),
    intro:microIntro,step1Reset:{valid:!errors.some(e=>/Step 1|Presentation|deterministic/.test(e)),comparisons:resets,objects:rt.registry.size},
    explodedPaths:{samples:61,pairChecks,initialCompletedStateContacts:initialContacts,newPenetrations:[...pathErrors]},cameraChecks,
    assemblyActionsUnchanged:microVideo.scenes.slice(4).every((s,i)=>s===polish02bVideo.scenes[i]),
    presentationConfigUnchanged:microVideo.presentation===polish02bVideo.presentation,expectedRuntime:524.0536938888888};
  writeFileSync(`${dir}/micro-validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({valid:report.valid,errors,unexpected,pairChecks,cameraChecks},null,2));if(!report.valid)process.exitCode=1;
}finally{engine.dispose();rt.dispose();}
