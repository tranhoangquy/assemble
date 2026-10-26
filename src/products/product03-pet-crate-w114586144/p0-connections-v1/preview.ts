import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createProof,groups,fps,clipDuration,type Group} from './proof';
import {placements} from './model';
const before=createProof(false),after=createProof(true),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1280,720);renderer.localClippingEnabled=false;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
document.body.style.cssText='margin:0;background:#e9e6df';document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(before.rig,after.rig);
scene.environment=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;
scene.add(new T.HemisphereLight('#fffaf2','#9ca5ad',1.8));
for(const pos of [[-1200,1700,-1000],[1200,900,1100],[0,-1000,1000]]){const l=new T.DirectionalLight('#fffaf4',3);l.position.set(pos[0],pos[1],pos[2]);scene.add(l);}
const camera=new T.PerspectiveCamera(35,1280/720,.1,20000);
function label(css:string,text:string){const el=document.createElement('div');el.style.cssText=css;el.textContent=text;document.body.append(el);return el;}
label('position:fixed;left:24px;top:18px;font:600 13px Arial;color:#292c2f;background:#f4f1e9ef;padding:9px','PRODUCT 03 / P0 CONNECTION CORRECTION PROPOSALS');
label('position:fixed;right:24px;top:18px;font:600 11px Arial;color:#805534;background:#fff3e6ef;padding:9px','UNMEASURED / RECEIVERS AND ENGAGEMENT UNVERIFIED');
const heading=label('position:fixed;left:24px;bottom:60px;font:600 22px Arial;background:#eeeae2ed;padding:8px;color:#292c2f','');
const sub=label('position:fixed;left:24px;bottom:28px;font:14px Arial;background:#eeeae2ed;padding:6px;color:#61594f','');
label('position:fixed;left:24px;bottom:9px;font:12px Arial;color:#805534','Full shafts retained · no clipping · exterior visual study only, no certified installation');
const views:Record<Group,{target:[number,number,number];offset:[number,number,number];title:string}>={
 S02:{target:[189,838,-60],offset:[240,290,-380],title:'S02 / divider 11 meets connector 12'},
 S05:{target:[-500,895,-286],offset:[-260,160,-350],title:'S05 / rear closure 13 meets top 9 and sides 10'},
 S06:{target:[-525,780,20],offset:[-300,-230,230],title:'S06 / floor 15 meets retained module'},
 S08:{target:[585,800,-286],offset:[300,170,350],title:'S08 / square pipe → existing wood module'},
 S15:{target:[0,150,0],offset:[-1100,800,1550],title:'S15 / floor 14 rests on all four rails 6'},
};
const checkpoints=[...groups.flatMap(group=>Array.from({length:fps*clipDuration},(_,i)=>({name:`${group}-frame-${String(i).padStart(6,'0')}.png`,label:group,time:i/fps}))),
 ...groups.flatMap(group=>[{name:`${group}-before.png`,label:'Old geometry',time:8},{name:`${group}-after.png`,label:'Corrected proposal',time:8},{name:`${group}-staged.png`,label:'Staged',time:0}]),
 ...['S10','S12'].flatMap(group=>[{name:`${group}-before.png`,label:'Old F placement',time:0},{name:`${group}-after.png`,label:'Proposed exterior seating; approach blocked',time:0}])];
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name:string){
 const shot=checkpoints.find(c=>c.name===name);if(!shot)throw Error(name);const old=name.includes('-before'),p=old?before:after;before.rig.visible=old;after.rig.visible=!old;const group=name.slice(0,3);
 let state:unknown;
 if(group==='S10'||group==='S12'){
  p.reset();const n=Number(group.slice(1));for(const [id,o]of p.r.registry.entries()){const row=placements.find(p=>p.id===id);o.visible=!!row&&row.step<=n;}
  for(const o of p.r.root.children)if(o.name.startsWith('presentation-stationary-hinge-'))o.visible=false;
  p.r.registry.require('part-5-1').visible=false;p.r.registry.require('hardware-A-5').visible=false;
  p.rig.rotation.x=Math.PI;p.rig.position.y=984;p.rig.updateMatrixWorld(true);
  const center=new T.Vector3(-450,735,n===10?-286:286).applyMatrix4(p.rig.matrixWorld);camera.position.copy(center).add(new T.Vector3(-80,110,n===10?160:-160));camera.lookAt(center);
  heading.textContent=`${old?'BEFORE':'PROPOSED'} / ${group} F exterior face and direction`;
  sub.textContent='ACCESS HOLD / insertion path NOT animated: lower bar/mesh obstructs a straight approach';
  state={group,access:'BLOCKED_OR_UNVERIFIED — no fabricated insertion path',clippingPlanes:0};
 }else{
  const g=group as Group;state=p.evaluate(g,shot.time);const v=views[g],center=new T.Vector3(...v.target).applyMatrix4(p.rig.matrixWorld);
  camera.position.copy(center).add(new T.Vector3(...v.offset));camera.lookAt(center);
  heading.textContent=`${old?'BEFORE':'PROPOSAL'} / ${v.title}`;
  sub.textContent=shot.time<1?'Both parts visible before motion · support procedure unverified':shot.time<4?'Continuous approach · earlier installed parts retained':shot.time<5?'Contact hold before fastener approach':g==='S15'?'Retained floor support · no fastener added':shot.time<7?'Full screw approaches exterior face · hidden engagement illustrative':'Contact hold · no geometry reset';
 }
 camera.updateMatrixWorld(true);renderer.render(scene,camera);return{name,time:shot.time,state,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray()},networkRequests:performance.getEntriesByType('resource').filter(r=>/^https?:/.test(r.name)).map(r=>r.name)};
}};
