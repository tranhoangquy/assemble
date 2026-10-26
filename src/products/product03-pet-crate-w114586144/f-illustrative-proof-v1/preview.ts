import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createProof,duration,fps,type Group} from './proof';
const before=createProof(false),after=createProof(true),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1280,720);renderer.localClippingEnabled=false;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
document.body.style.cssText='margin:0';document.body.append(renderer.domElement);const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(before.rig,after.rig);
scene.environment=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.add(new T.HemisphereLight('#fffaf2','#9ca5ad',1.5));
for(const pos of [[-1200,1700,-1000],[1200,900,1100],[0,-1000,1000]]){const l=new T.DirectionalLight('#fffaf4',2.2);l.position.set(pos[0],pos[1],pos[2]);scene.add(l);}
const camera=new T.PerspectiveCamera(32,1280/720,.1,10000);
function label(css:string,text:string){const e=document.createElement('div');e.style.cssText=css;e.textContent=text;document.body.append(e);return e;}
label('position:fixed;left:24px;top:18px;font:600 13px Arial;color:#292c2f;background:#f4f1e9ef;padding:9px','PRODUCT 03 / HUMAN B — LOCAL F PROOF');
label('position:fixed;right:24px;top:18px;font:600 11px Arial;color:#805534;background:#fff3e6ef;padding:9px','NONLITERAL F / NOT OEM-CONFIRMED');
const heading=label('position:fixed;left:24px;bottom:64px;font:600 22px Arial;background:#eeeae2ed;padding:8px;color:#292c2f','');
const sub=label('position:fixed;left:24px;bottom:32px;font:14px Arial;background:#eeeae2ed;padding:6px;color:#61594f','');
label('position:fixed;left:24px;bottom:10px;font:12px Arial;color:#805534','Unmeasured visible reconstruction · no hidden bore/thread · full shafts, no clipping · no torque/physical certification');
const groups:Group[]=['S10','S12'];
const checkpoints=[...groups.flatMap(g=>Array.from({length:duration*fps},(_,i)=>({name:`${g}-frame-${String(i).padStart(6,'0')}.png`,label:g,time:i/fps}))),
 ...groups.flatMap(g=>[{name:`${g}-before.png`,label:'Before unresolved F',time:12},{name:`${g}-staged.png`,label:'Full screw staged',time:0},{name:`${g}-engaged.png`,label:'Driver aligned',time:2},{name:`${g}-inserting.png`,label:'Continuous approach',time:4.5},{name:`${g}-seated.png`,label:'Exterior seating and driver',time:7},{name:`${g}-after.png`,label:'Driver withdrawn and contact retained',time:12},{name:`${g}-context.png`,label:'Current assembly context',time:12}])];
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name:string){
 const c=checkpoints.find(c=>c.name===name);if(!c)throw Error(name);const group=name.slice(0,3)as Group,rear=group==='S10',old=name.includes('-before'),p=old?before:after;before.rig.visible=old;after.rig.visible=!old;
 const state=p.evaluate(group,c.time),center=new T.Vector3(-450,744,rear?-295:295).applyMatrix4(p.rig.matrixWorld).add(new T.Vector3(0,0,rear?40:-40));
 // Fixed three-quarter view: shows mating stock and exterior head without looking through the driver.
 camera.position.copy(center).add(new T.Vector3(-250,110,rear?205:-205));camera.lookAt(center);
 if(name.includes('-context')){const c=new T.Vector3(0,440,0);camera.position.copy(c).add(new T.Vector3(-1250,700,rear?1650:-1650));camera.lookAt(c);}
 camera.updateMatrixWorld(true);renderer.render(scene,camera);
 heading.textContent=`${old?'BEFORE / F ACCESS HOLD':group+' / '+state.stage}`;
 sub.textContent=old?'Previous lower-face interpretation; no invalid insertion path animated':`${rear?'Rear4 → reconstructed13':'Front3 → reconstructed15'} · F ×4 / one exemplar · all prior parts retained`;
 return{name,time:c.time,state,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray()},networkRequests:performance.getEntriesByType('resource').filter(r=>/^https?:/.test(r.name)).map(r=>r.name)};
}};
