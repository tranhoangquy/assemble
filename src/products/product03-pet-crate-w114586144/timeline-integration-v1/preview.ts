import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createRuntime} from './runtime';
import {steps} from './timeline';
const runtime=createRuntime('guarded'),candidate=createRuntime('candidate'),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1280,720);renderer.localClippingEnabled=false;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
document.body.style.cssText='margin:0';document.body.append(renderer.domElement);const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(runtime.rig,candidate.rig);
scene.environment=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.add(new T.HemisphereLight('#fffaf2','#9ca5ad',1.8));
for(const pos of [[-1200,1700,-1000],[1200,900,1100],[0,-1000,1000]]){const l=new T.DirectionalLight('#fffaf4',2.6);l.position.set(pos[0],pos[1],pos[2]);scene.add(l);}
function label(css:string,text:string){const e=document.createElement('div');e.style.cssText=css;e.textContent=text;document.body.append(e);return e;}
label('position:fixed;left:24px;top:18px;font:600 13px Arial;color:#292c2f;background:#f4f1e9ef;padding:9px','PRODUCT03 / COMPACT264 TECHNICAL INTEGRATION REVIEW');
const badge=label('position:fixed;right:24px;top:18px;font:600 11px Arial;color:#805534;background:#fff3e6ef;padding:9px','');
const heading=label('position:fixed;left:24px;bottom:80px;font:600 20px Arial;background:#eeeae2ed;padding:7px;color:#292c2f','');
const sub=label('position:fixed;left:24px;bottom:43px;font:13px Arial;background:#eeeae2ed;padding:6px;color:#61594f','');
label('position:fixed;left:24px;bottom:12px;font:12px Arial;background:#eeeae2ed;padding:4px;color:#805534','NOT A COMPLETE FILM · unmeasured illustrative targets · full shafts/no clipping · receiving, access and physical fit unverified');
const windows=[{id:'S01-proof',start:0,duration:10},{id:'S04-hold-proof',start:41,duration:10}];
const checkpoints=[...steps.flatMap(s=>[{name:`${s.id}-start.png`,label:s.id,time:s.start},{name:`${s.id}-endpoint.png`,label:s.id,time:s.end-1/24}]),
 ...windows.flatMap(w=>Array.from({length:w.duration*24},(_,i)=>({name:`${w.id}-frame-${String(i).padStart(6,'0')}.png`,label:w.id,time:w.start+i/24}))),
 {name:'S04-head-clash-left.png',label:'Unvalidated candidate B1/B2',time:54.6},{name:'S04-head-clash-right.png',label:'Unvalidated candidate B3/B4',time:54.6},
 {name:'S14-outside-centering.png',label:'Outside centering route',time:176.5},{name:'S14-contact.png',label:'Retained contact',time:178.4}];
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name:string){
 const c=checkpoints.find(c=>c.name===name);if(!c)throw Error(name);const clash=name.includes('head-clash'),r=clash?candidate:runtime;
 const state=r.evaluate(c.time);runtime.rig.visible=!clash;candidate.rig.visible=clash;let cam=r.camera(c.time,!name.includes('-frame-'));
 if(clash){const target=new T.Vector3(name.includes('left')?-175.5:175.5,900.5,220),camera=new T.PerspectiveCamera(35,1280/720,.1,10000);camera.position.copy(target).add(new T.Vector3(name.includes('left')?70:-70,-65,75));camera.lookAt(target);camera.updateMatrixWorld(true);cam=camera;}
 // camera() evaluates the same time; restore one chosen root visibility after reset.
 runtime.rig.visible=!clash;candidate.rig.visible=clash;renderer.render(scene,cam);
 badge.textContent=clash?'VERIFIED SOLID HEAD OVERLAP / NOT APPROVED':state.conditional?'CONDITIONAL DIAGNOSTIC / S04 HOLD':'PART → CONTACT → SCREW → TOOL';
 heading.textContent=clash?`${c.label} / VERIFIED DEFECT`:name.includes('endpoint')?`${state.step} / ENDPOINT — ${state.holds.length?'HOLDS REMAIN':'INITIAL SEATING ONLY'}`:`${state.step} / ${state.stage}`;
 sub.textContent=clash?'Witness inside both actual head solids; no hardware resizing or hole relocation performed':`${state.installed.length} structural installed / ${state.prepared.length} prepared · ${state.hardwareSeated.length} initial seats / ${state.posedHeld.length} posed-only / ${state.pending.length} held-staged · ${state.holds.map(h=>`S${h.step} ${h.scope}`).join('; ')}`;
 return{name,time:c.time,state,camera:{position:cam.position.toArray(),quaternion:cam.quaternion.toArray()},networkRequests:performance.getEntriesByType('resource').filter(r=>/^https?:/.test(r.name)).map(r=>r.name)};
}};
