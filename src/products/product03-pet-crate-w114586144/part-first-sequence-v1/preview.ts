import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createProof,groups,plan,duration,fps,type Group} from './proof';
import {createProof as oldProof} from '../p0-connections-v1/proof';
const after=createProof(),before=oldProof(true),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1280,720);renderer.localClippingEnabled=false;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
document.body.style.cssText='margin:0';document.body.append(renderer.domElement);const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(after.rig,before.rig);
scene.environment=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.add(new T.HemisphereLight('#fffaf2','#9ca5ad',1.8));
for(const pos of [[-1200,1700,-1000],[1200,900,1100],[0,-1000,1000]]){const l=new T.DirectionalLight('#fffaf4',2.6);l.position.set(pos[0],pos[1],pos[2]);scene.add(l);}
function label(css:string,text:string){const e=document.createElement('div');e.style.cssText=css;e.textContent=text;document.body.append(e);return e;}
label('position:fixed;left:24px;top:18px;font:600 13px Arial;color:#292c2f;background:#f4f1e9ef;padding:9px','PRODUCT03 / PART → CONTACT → SCREW → TOOL');
label('position:fixed;right:24px;top:18px;font:600 11px Arial;color:#805534;background:#fff3e6ef;padding:9px','ILLUSTRATIVE / EXACT RECEIVING GEOMETRY UNVERIFIED');
const heading=label('position:fixed;left:24px;bottom:66px;font:600 20px Arial;background:#eeeae2ed;padding:7px;color:#292c2f','');
const sub=label('position:fixed;left:24px;bottom:36px;font:13px Arial;background:#eeeae2ed;padding:6px;color:#61594f','');
label('position:fixed;left:24px;bottom:10px;font:12px Arial;background:#eeeae2ed;color:#805534;padding:3px','Full shafts · no clipping · no invented hidden receivers · no torque, tool/hand-access or physical-fit certification');
const stillTimes=[['place',1.5],['contact',3],['screw',4.5],['tool',5.75],['seated',8.25],['end',10]] as const;
const checkpoints=[...groups.flatMap(g=>Array.from({length:duration(g)*fps},(_,i)=>({name:`${g}-frame-${String(i).padStart(6,'0')}.png`,label:g,time:i/fps}))),
 ...groups.flatMap(g=>[{name:`${g}-before.png`,label:'Actual old40s source during part motion',time:2},...stillTimes.filter(([,t])=>t<=duration(g)).map(([s,t])=>({name:`${g}-${s}.png`,label:s,time:t}))])];
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name:string){
 const c=checkpoints.find(c=>c.name===name);if(!c)throw Error(name);const g=name.slice(0,3) as Group,old=name.includes('-before');after.rig.visible=!old;before.rig.visible=old;
 const state=old?before.evaluate(g,c.time):after.evaluate(g,c.time);if(old)after.evaluate(g,c.time);const camera=after.camera(g);
 renderer.render(scene,camera);heading.textContent=`${old?'BEFORE / NEW SCREW VISIBLE TOO EARLY':g+' / '+('stage' in state?state.stage:'')}`;
 sub.textContent=old?'Historical40s source reconstructed; earlier geometry preserved':`${plan[g].source} · previous parts retained · ${g==='S15'?'no tool added':'D uses hex key L; full insertion is symbolic'}`;
 return{name,time:c.time,state,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray()},networkRequests:performance.getEntriesByType('resource').filter(r=>/^https?:/.test(r.name)).map(r=>r.name)};
}};
