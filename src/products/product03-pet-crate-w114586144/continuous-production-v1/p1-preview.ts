import {p1Camera} from './p1-camera';
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createRuntime} from '../s04-integration-v2/runtime';
const r=createRuntime(),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1280,720);renderer.localClippingEnabled=false;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
document.body.style.cssText='margin:0';document.body.append(renderer.domElement);const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(r.rig);scene.environment=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.add(new T.HemisphereLight('#fffaf2','#9ca5ad',1.8));
for(const pos of [[-1200,1700,-1000],[1200,900,1100],[0,-1000,1000]]){const light=new T.DirectionalLight('#fffaf4',2.6);light.position.set(pos[0],pos[1],pos[2]);scene.add(light);}
function label(css:string,text=''){const e=document.createElement('div');e.style.cssText=css;e.textContent=text;document.body.append(e);return e;}
label('position:fixed;left:24px;top:18px;padding:9px;background:#f4f1e9ef;color:#292c2f;font:600 13px Arial','PRODUCT03 / INTEGRATION V2 — ACTUAL 3D EVALUATOR / 278s BUDGET');
const badge=label('position:fixed;right:24px;top:18px;padding:9px;background:#fff3e6ef;color:#805534;font:600 11px Arial');
const stage=label('position:fixed;left:24px;bottom:83px;padding:8px;background:#f4f1e9ef;color:#292c2f;font:600 18px Arial');
const count=label('position:fixed;left:24px;bottom:47px;padding:7px;background:#f4f1e9ef;color:#61594f;font:13px Arial');
label('position:fixed;left:24px;bottom:14px;padding:5px;background:#f4f1e9ef;color:#805534;font:12px Arial','TARGETED REVIEW ONLY · K22/10 UNMEASURED · full shafts/no clipping · receivers, retention, support and physical access NOT CERTIFIED');
const checkpoints=Array.from({length:384},(_,i)=>({name:`P1-frame-${String(i).padStart(6,'0')}.png`,label:'P1',time:108+i/24}));
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name:string){
 const c=checkpoints.find(c=>c.name===name);if(!c)throw Error(name);const s=r.evaluate(c.time);let camera=p1Camera(r,c.time);
 if(name.startsWith('K-')){const sign=c.label==='left'?-1:1,target=new T.Vector3(sign*175,894,220).applyMatrix4(r.rig.matrixWorld),offset=new T.Vector3(-sign*100,-100,155).transformDirection(r.rig.matrixWorld).multiplyScalar(Math.hypot(100,100,155));const m=new T.PerspectiveCamera(40,1280/720,.1,10000);m.position.copy(target).add(offset);m.up.set(0,1,0).transformDirection(r.rig.matrixWorld);m.lookAt(target);m.updateMatrixWorld(true);camera=m;}
 renderer.render(scene,camera);badge.textContent=s.holds.length?'REMAINING SOURCE / PHYSICAL HOLDS':'ILLUSTRATIVE INTEGRATION / NO PHYSICAL CERTIFICATION';
 stage.textContent=`${s.step} / ${s.s04?s.s04.side.toUpperCase()+' / ':''}${s.stage}`;
 count.textContent=`t=${s.time.toFixed(4)}s · ${s.installed.length} structural / ${s.prepared.length} prepared · ${s.hardwareSeated.length} initial seats / ${s.posedHeld.length} pose-only / ${s.pending.length} held · B1–B4 retained after S04`;
 return{name,time:c.time,state:s,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray()},networkRequests:performance.getEntriesByType('resource').filter(e=>/^https?:/.test(e.name)).map(e=>e.name)};
}};
