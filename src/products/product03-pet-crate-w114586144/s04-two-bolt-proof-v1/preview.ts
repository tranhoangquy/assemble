import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createProof,groups,duration} from './proof';
const p=createProof(),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.localClippingEnabled=false;
document.body.style.cssText='margin:0';document.body.append(renderer.domElement);const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(p.rig);scene.environment=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.add(new T.HemisphereLight('#fffaf2','#9ca5ad',1.8));
for(const pos of [[-1200,1700,-1000],[1200,900,1100],[0,-1000,1000]]){const light=new T.DirectionalLight('#fffaf4',2.6);light.position.set(pos[0],pos[1],pos[2]);scene.add(light);}
function label(css:string){const e=document.createElement('div');e.style.cssText=css;document.body.append(e);return e;}
const title=label('position:fixed;left:24px;top:18px;padding:9px;background:#f4f1e9ef;color:#292c2f;font:600 13px Arial');title.textContent='PRODUCT03 / S04 — TWO BOLTS PER K / FOCUSED VISUAL PROPOSAL';
const stage=label('position:fixed;left:24px;bottom:84px;padding:8px;background:#f4f1e9ef;color:#292c2f;font:600 18px Arial');
const count=label('position:fixed;left:24px;bottom:47px;padding:7px;background:#f4f1e9ef;color:#61594f;font:13px Arial');
const disclaimer=label('position:fixed;left:24px;bottom:14px;padding:5px;background:#f4f1e9ef;color:#805534;font:12px Arial');disclaimer.textContent='K proportions UNMEASURED · B geometry unchanged · initial symbolic seating only · hidden receiving/retention, support and hand access NOT VERIFIED';
const checkpoints=groups.flatMap(side=>[...Array.from({length:duration*24},(_,i)=>({name:`${side}-frame-${String(i).padStart(6,'0')}.png`,label:side,side,time:i/24})),...[0,2.2,4.2,6.7,7.4,9.2,11.7,13.9].map((time,i)=>({name:`${side}-stage-${i}.png`,label:side,side,time}))]);
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name:string){const c=checkpoints.find(c=>c.name===name);if(!c)throw Error(name);const s=p.evaluate(c.side,c.time),camera=p.camera(c.side);renderer.render(scene,camera);stage.textContent=`${c.side.toUpperCase()} K / ${s.stage}`;count.textContent=`Manual S04: K×2 / B×4 · ${s.seated.length}/4 B retained in this forward sequence · ${s.active?.id??'CONTACT / RETAINED HOLD'} · each K receives BOTH bolts`;
return{name,time:c.time,state:s,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray()},networkRequests:performance.getEntriesByType('resource').filter(r=>/^https?:/.test(r.name)).map(r=>r.name)};}};
