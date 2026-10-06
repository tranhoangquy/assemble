/** Diagnostic browser entry only. It does not register or promote the draft
 * product. Every pose comes from the actual compiled DirectorPlan timeline. */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { Lighting } from '@/components/viewer/Lighting';
import { Ground } from '@/components/viewer/Ground';
import { MaterialFactory } from '@/engine/materials/MaterialFactory';
import { fitInstructionalBox } from '@/engine/camera/InstructionalFraming';
import type { CameraPreset } from '@/types/video';
import type { Vector3Tuple } from '@/types/product';
import { fullProduct, sideIds } from '../product/parts-step21-31';
import { fullPlan, fullVideo } from '../director/steps21-31';
import { createFullRuntime } from './full-validation';

interface Diagnostic { name: string; label: string; time: number; camera: CameraPreset; }
interface DiagnosticRenderer {
  ready: boolean;
  checkpoints: Array<{ name: string; label: string; time: number }>;
  render(name: string): Promise<Record<string, unknown>>;
}
declare global { interface Window { __MECHANISM_AUDIT_RENDERER__?: DiagnosticRenderer; } }

const runtime = createFullRuntime();
const materials = new Map<string, THREE.MeshStandardMaterial>();
for (const part of fullProduct.parts) {
  if (part.type !== 'mesh') continue;
  const definition = fullProduct.materials[part.material];
  if (!materials.has(part.material)) materials.set(part.material, MaterialFactory.create(definition));
  const object = runtime.registry.require(part.id);
  const variants = object.userData.geometryVariants as Record<string, THREE.BufferGeometry>;
  for (const geometry of Object.values(variants)) {
    if (definition.finish !== 'oak-review') continue;
    // Exact approved PartRenderer grain projection; no material redesign.
    const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal');
    const uv = new Float32Array(position.count * 2), axis = definition.grainAxis ?? 'x';
    for (let i = 0; i < position.count; i++) {
      const long = axis === 'x' ? position.getX(i) : axis === 'y' ? position.getY(i) : position.getZ(i);
      const transverse = axis === 'x' ? (Math.abs(normal.getY(i)) > 0.5 ? position.getZ(i) : position.getY(i))
        : axis === 'z' ? (Math.abs(normal.getY(i)) > 0.5 ? position.getX(i) : position.getY(i)) : position.getX(i);
      uv[i * 2] = long / 90; uv[i * 2 + 1] = transverse / 24;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }
  const mesh = object.children[0] as THREE.Mesh;
  mesh.material = materials.get(part.material)!;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}
runtime.registry.captureBaseline();

function shotTime(id: string, progress = 1) {
  const timing = runtime.shots.get(id);
  const shot = fullPlan.steps.flatMap(step => step.shots).find(candidate => candidate.id === id);
  if (!timing || !shot) throw new Error(`Missing diagnostic shot ${id}`);
  const pose = shot.actions.find(action => action.type === 'pivotPose');
  const duration = pose?.duration ?? timing.duration;
  const ease = gsap.parseEase(pose?.ease ?? 'power2.inOut');
  let lo = 0, hi = 1;
  for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (ease(mid) < progress) lo = mid; else hi = mid; }
  return timing.start + duration * (progress === 0 ? 0 : progress === 1 ? 1 : (lo + hi) / 2);
}

function fit(min: Vector3Tuple, max: Vector3Tuple, direction: Vector3Tuple): CameraPreset {
  return fitInstructionalBox(min, max, direction, 0.82, 35);
}
const whole = fit([-127, 0, -196], [127, 236, 27], [.7, .6, -1.8]);
const finalOpen = shotTime('final-open');
const finalClosed = runtime.shots.get('final-closed')!.start + .3;
const finalMid = shotTime('final-close', .5);
function legCamera(time: number): CameraPreset {
  runtime.engine.seek(time);
  runtime.root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(runtime.registry.require(sideIds(1).leg)).expandByScalar(5);
  return fit(box.min.toArray() as Vector3Tuple, box.max.toArray() as Vector3Tuple, [1.7, .4, -1.0]);
}
const stored = runtime.shots.get('final-fold-legs')!.start + 1.3;
const deployed = runtime.shots.get('final-result')!.start + .2;
function directed(id:string,progress=.8):Diagnostic{
  const shot=fullPlan.steps.flatMap(s=>s.shots).find(s=>s.id===id)!;
  const timing=runtime.shots.get(id)!;
  return{name:`${id}.png`,label:shot.note??id,time:timing.start+timing.duration*progress,camera:fullVideo.cameraPresets[shot.camera!]};
}
function wholeLegs(progress:number):Diagnostic{
  const time=shotTime('final-deploy-legs',progress);
  return{name:`leg-${progress}.png`,label:`Leg ${progress*100}% deployed — connected supported pose`,time,camera:legCamera(time)};
}
const diagnostics: Diagnostic[] = [
  {name:'01-C1-C2-foot-corner.png',label:'Local C1/C2 rebate and real socket-head clearance; estimated geometry',time:deployed,
    camera:fit([107,23,-193],[119,49,-168],[1.6,.9,-1.3])},
  {...directed('S29-1-bolt',.98),name:'02-leg-pivot-macro.png'},
  {name:'03-leg-stored.png',label:'Leg fully stored below the supported bed face',time:stored,camera:legCamera(stored)},
  {...wholeLegs(.25),name:'04-leg-25-percent-deployed.png'},
  {...wholeLegs(.5),name:'05-leg-50-percent-deployed.png'},
  {...wholeLegs(.75),name:'06-leg-75-percent-deployed.png'},
  {name:'07-leg-fully-deployed.png',label:'Leg fully deployed; foot meets the floor',time:deployed,camera:legCamera(deployed)},
  {name:'08-open-both-legs-deployed.png',label:'Usable open state after wall anchoring',time:deployed,camera:whole},
  {name:'09-open-both-legs-stored.png',label:'Both legs stored; bed remains supported 3 degrees above floor',time:finalOpen,camera:whole},
  {name:'10-bed-50-percent-closed.png',label:'Bed closing with both legs stored and both pistons attached',time:finalMid,camera:whole},
  {name:'11-fully-closed.png',label:'Fully closed with legs stored; no geometry changes between states',time:finalClosed,camera:whole},
  {...directed('S10-target'),name:'12-D8-instructional-view.png'},
  {...directed('S9-target'),name:'13-D9-instructional-view.png'},
  {...directed('S21-first-screw',.65),name:'14-E1-first-screw.png'},
  {...directed('S25--1-connection'),name:'15-bearing-cradle-connection.png'},
  {...directed('S25--1-retainer',.65),name:'16-pivot-outside-retainer.png'},
  {...directed('S28--1-intro'),name:'17-separate-leg-introduction.png'},
  {...directed('S28--1-D7-dowels',.55),name:'18-first-leg-dowel.png'},
  {...directed('S28--1-D7-join',.55),name:'19-leg-half-lap-alignment.png'},
  {...directed('S28--1-D7-bolts',.65),name:'20-leg-opposite-bolts.png'},
];
runtime.engine.seek(0);

let context: { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; invalidate: () => void } | undefined;
const element = document.createElement('div');
element.style.cssText = 'position:fixed;inset:0;width:1280px;height:720px;background:#e9e5dc';
document.body.style.margin = '0';
document.body.append(element);
const label = document.createElement('div');
label.style.cssText = 'position:fixed;left:18px;top:15px;padding:7px 10px;background:rgba(250,248,241,.9);font:13px Arial,sans-serif;color:#252521;z-index:10';
document.body.append(label);

createRoot(element).render(
  <Canvas shadows="percentage" frameloop="demand" dpr={1}
    camera={{ position: whole.position, fov: 35, near: 1, far: 1800 }}
    gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
    onCreated={({ gl, scene, camera, invalidate }) => {
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.05;
      context = { gl, scene, camera: camera as THREE.PerspectiveCamera, invalidate };
    }}>
    <color attach="background" args={[fullVideo.background]} />
    <fog attach="fog" args={[fullVideo.background, 600, 1050]} />
    <Lighting review={fullProduct.rendering?.lighting === 'instructional-review'} />
    <Ground debug={false} />
    <primitive object={runtime.root} />
  </Canvas>,
);

window.__MECHANISM_AUDIT_RENDERER__ = {
  ready: false,
  checkpoints: diagnostics.map(({ name, label, time }) => ({ name, label, time })),
  async render(name) {
    const check = diagnostics.find(candidate => candidate.name === name);
    if (!check || !context) throw new Error(`Diagnostic unavailable: ${name}`);
    runtime.engine.seek(check.time);
    runtime.root.updateMatrixWorld(true);
    const { gl, scene, camera } = context;
    camera.position.set(...check.camera.position);
    camera.fov = check.camera.fov ?? 35;
    camera.updateProjectionMatrix();
    camera.lookAt(new THREE.Vector3(...check.camera.target));
    camera.updateMatrixWorld(true);
    label.textContent = `MECHANISM DIAGNOSTIC · NOT DIRECTOR APPROVAL · ${check.label}`;
    context.invalidate();
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    gl.render(scene, camera);
    const endpoints = [-1, 1].map(side => {
      const s = sideIds(side);
      const eyeA = runtime.registry.require(s.piston).getWorldPosition(new THREE.Vector3());
      const eyeB = runtime.registry.require(`${s.piston}-eyeB`).getWorldPosition(new THREE.Vector3());
      return { side, eyeA: eyeA.toArray(), eyeB: eyeB.toArray(), length: eyeA.distanceTo(eyeB) };
    });
    return { name, time: check.time, camera: check.camera, endpoints,
      bedPosition: runtime.registry.require('bed-motion-root').position.toArray(),
      bedQuaternion: runtime.registry.require('bed-motion-root').quaternion.toArray() };
  },
};
setTimeout(() => {
  if (!context) throw new Error('Diagnostic WebGL context unavailable.');
  window.__MECHANISM_AUDIT_RENDERER__!.ready = true;
}, 1600);
