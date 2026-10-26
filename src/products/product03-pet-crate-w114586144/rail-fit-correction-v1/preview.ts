import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createProof,duration,fps} from './runtime';
const before=createProof(false),after=createProof(true);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.localClippingEnabled=false;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
document.body.style.cssText='margin:0';document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(before.rig,after.rig);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.add(new T.HemisphereLight('#fffaf3','#8f959f',2));
for(const [pos,power]of [[[-800,1600,-1200],4],[[900,900,800],3],[[0,2000,0],2]] as const){const l=new T.DirectionalLight('#fffaf5',power);l.position.set(pos[0],pos[1],pos[2]);scene.add(l);}
const camera=new T.PerspectiveCamera(32,1280/720,.1,10000);
// One fixed camera for the entire continuous proof. It looks at the EXTERIOR of 4.
const localTarget=new T.Vector3(-350,64,-268);
const target=localTarget.clone().applyMatrix4(after.rig.matrixWorld);
camera.position.copy(target).add(new T.Vector3(-145,115,245));camera.lookAt(target);camera.updateMatrixWorld(true);
function text(css:string,value:string){const el=document.createElement('div');el.style.cssText=css;el.textContent=value;document.body.append(el);return el;}
text('position:fixed;left:24px;top:20px;font:600 13px Arial;letter-spacing:1px;color:#292c2f;background:#f4f1e9ef;padding:9px','PRODUCT 03 / RAIL 6 → FACTORY FRAME 4');
text('position:fixed;right:24px;top:20px;font:600 11px Arial;background:#fff3e4ef;color:#805534;padding:9px','UNMEASURED · C END ALLOCATION UNVERIFIED');
const title=text('position:fixed;left:24px;bottom:66px;font:600 23px Arial;color:#292c2f;background:#eeeae2ed;padding:8px','');
const note=text('position:fixed;left:24px;bottom:34px;font:14px Arial;color:#61594f;background:#eeeae2ed;padding:6px','');
text('position:fixed;left:24px;bottom:12px;font:12px Arial;color:#805534','Source-inverted pose · exterior-only proof · no receiving bore/thread or tool-access claim');
const checkpoints=[...Array.from({length:duration*fps},(_,i)=>({name:`frame-${String(i).padStart(6,'0')}.png`,label:'Continuous rail contact proof',time:i/fps})),
 {name:'before-contact.png',label:'Historical geometry; clipping disabled for honest comparison',time:12},
 {name:'after-staged.png',label:'Staged before insertion',time:1.5},
 {name:'after-rail-contact.png',label:'Rail seated; screw staged',time:5.8},
 {name:'after-screw-contact.png',label:'Exterior screw seating; internal engagement unknown',time:12},
 {name:'after-overview.png',label:'Factory bands and source-inverted orientation',time:12}];
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name:string){
 const c=checkpoints.find(c=>c.name===name);if(!c)throw Error(name);
 const old=name.startsWith('before'),p=old?before:after;before.rig.visible=old;after.rig.visible=!old;
 const state=p.evaluate(c.time);
 camera.position.copy(target).add(new T.Vector3(-145,115,245));camera.lookAt(target);
 if(name==='after-overview.png'){const center=new T.Vector3(0,530,0);camera.position.copy(center).add(new T.Vector3(-1300,650,1700));camera.lookAt(center);}
 camera.updateMatrixWorld(true);
 title.textContent=old?'BEFORE / rail and C screw miss frame 4':c.time<2?'ALIGN / both connecting parts identified':c.time<5?'APPROACH / continuous visual path':c.time<6.5?'CONTACT / rail end meets the visible factory band':c.time<9.5?'C SCREW / approach along the exterior normal':'HOLD / exterior contact retained';
 note.textContent=old?'Missing lower factory band; rail height and length also mismatch.': 'Full screw shaft retained · hidden engagement is unresolved · no shaft clipping';
 renderer.render(scene,camera);
 return{name,time:c.time,state,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray()},networkRequests:performance.getEntriesByType('resource').filter(r=>/^https?:/.test(r.name)).map(r=>r.name)};
}};
