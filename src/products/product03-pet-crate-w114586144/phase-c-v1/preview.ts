/** Offline focused proof through the existing generic diagnostic renderer. */
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {createProof,duration,fps} from './proof';
const p=createProof();RectAreaLightUniformsLib.init();
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
document.body.style.cssText='margin:0;background:#e9e6df';document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(p.r.root,p.r.hardwareRoot);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=1;
scene.add(new T.HemisphereLight('#fffaf2','#b7b4ad',1.25));
for(const [pos,intensity,color] of [[[-1100,1700,900],6,'#fff9ef'],[[1200,1100,700],5,'#e2ecff'],[[200,1500,-1100],7,'#fff9ef']] as const){const l=new T.RectAreaLight(color,intensity,1100,1300);l.position.set(pos[0],pos[1],pos[2]);l.lookAt(-100,700,0);scene.add(l);}
const sun=new T.DirectionalLight('#fff7e8',1.8);sun.position.set(-900,1800,-1100);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-1700,right:1700,top:1700,bottom:-1700,near:1,far:7000});sun.shadow.normalBias=.2;scene.add(sun);
const floor=new T.Mesh(new T.PlaneGeometry(30000,30000),new T.MeshStandardMaterial({color:'#e9e6df',roughness:.94}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const camera=new T.PerspectiveCamera(30,1280/720,.1,30000);
function label(css:string){const el=document.createElement('div');el.style.cssText=css;document.body.append(el);return el;}
const heading=label('position:fixed;left:26px;top:19px;font:600 12px Arial;letter-spacing:1.6px;background:#f4f1e9ed;padding:8px;color:#292c2f');heading.textContent='PRODUCT 03 / LIMITED PHASE C';
const badge=label('position:fixed;right:25px;top:19px;font:600 11px Arial;background:#fff5e7ee;color:#805534;padding:8px');badge.textContent='PROVISIONAL DISPLAY GEOMETRY / NO FIT CERTIFICATION';
const title=label('position:fixed;left:26px;bottom:70px;font:500 21px Arial;background:#f4f1e9ed;color:#292c2f;padding:9px;max-width:1180px');
const sub=label('position:fixed;left:26px;bottom:42px;font:13px Arial;background:#f4f1e9ed;color:#554f47;padding:7px;max-width:1180px');
const foot=label('position:fixed;left:26px;bottom:10px;font:12px Arial;background:#f4f1e9ed;color:#554f47;padding:7px');
const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('width','1280');overlay.setAttribute('height','720');overlay.style.cssText='position:fixed;inset:0;pointer-events:none';document.body.append(overlay);
function marker(pos:T.Vector3,text:string){const q=pos.project(camera),x=(q.x*.5+.5)*1280,y=(-q.y*.5+.5)*720;const c=document.createElementNS(overlay.namespaceURI,'circle');for(const [key,value]of Object.entries({cx:x,cy:y,r:6,fill:'none',stroke:'#b56b32','stroke-width':2}))c.setAttribute(key,String(value));overlay.append(c);const l=document.createElementNS(overlay.namespaceURI,'text');for(const [key,value]of Object.entries({x:x+15,y:y-10,fill:'#714c2f','font-size':13,'font-family':'Arial',stroke:'#f4f1e9','stroke-width':3,'paint-order':'stroke'}))l.setAttribute(key,String(value));l.textContent=text;overlay.append(l);}
function fit(box:T.Box3,dir:T.Vector3,fill=.75){const center=box.getCenter(new T.Vector3()),d=dir.clone().normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),d).normalize(),up=new T.Vector3().crossVectors(d,right).normalize(),tan=Math.tan(camera.fov*Math.PI/360);let dist=0;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const a=new T.Vector3(x,y,z).sub(center);dist=Math.max(dist,Math.abs(a.dot(up))/(tan*fill)+a.dot(d),Math.abs(a.dot(right))/(tan*camera.aspect*.82)+a.dot(d));}return{center,distance:dist,direction:d};}
const checkpoints=[...Array.from({length:duration*fps},(_,i)=>({name:`frame-${String(i).padStart(6,'0')}.png`,label:'S1 limited external contact proof',time:i/fps})),...[[0,'orientation'],[5,'contact'],[10,'first-D-approach'],[16,'unverified-stop']].map(([time,name])=>({name:`S1-${name}.png`,label:'S1 source-visible review',time:Number(time)})),...['baseline','candidate'].flatMap(mode=>Array.from({length:4},(_,i)=>({name:`hinge-${mode}-${i}.png`,label:'Static hinge contact investigation',time:0})))];
function render(name:string){
 const check=checkpoints.find(x=>x.name===name);if(!check)throw Error(name);overlay.replaceChildren();
 const match=name.match(/^hinge-(baseline|candidate)-(\d)/);let state:ReturnType<typeof p.joint>|ReturnType<typeof p.hinge>;let shot;
 if(match){
  const candidate=match[1]==='candidate',idx=Number(match[2]);state=p.hinge(candidate);floor.visible=false;
  const info=state.interfaces[idx],axis=new T.Vector3(...info.axis as [number,number,number]);const box=new T.Box3(axis.clone().add(new T.Vector3(-38,-36,-32)),axis.clone().add(new T.Vector3(38,36,32)));shot=fit(box,new T.Vector3(info.door==='7'?-.5:.5,.3,2));
  title.textContent=`${candidate?'PROPOSAL':'BASELINE'} / door ${info.door} ${info.level} hinge`;
  sub.textContent=candidate?'External faces meet in this display proposal. Door depth and leaf offset remain unmeasured.':'Measured model embedding remains visible; this baseline is not a working installed hinge.';
  foot.textContent=`Display-unit signed gaps: stationary ${info.stationaryLeafSignedGap.toFixed(2)} / moving ${info.movingLeafSignedGap.toFixed(2)}. Motion, E insertion, hidden receivers and hand/tool fit NOT VERIFIED.`;
 }else{
  const t=check.time;state=p.joint(t);floor.visible=true;floor.position.y=745;
  const wide=fit(new T.Box3(new T.Vector3(-725,744,-305),new T.Vector3(560,906,285)),new T.Vector3(-1,.9,-1.3),.65);
  const close=fit(new T.Box3(new T.Vector3(-714,757,-305),new T.Vector3(-540,915,-230)),new T.Vector3(-1,.34,-.8),.72);
  const blend=T.MathUtils.smootherstep(t,6,8);shot={center:wide.center.clone().lerp(close.center,blend),distance:T.MathUtils.lerp(wide.distance,close.distance,blend),direction:wide.direction.clone().lerp(close.direction,blend).normalize()};
  title.textContent=t<2?'S1 / panel 10 to panel 12 — identify mating faces':t<5?'S1 / align and approach while externally supported':t<8?'S1 / panel faces meet — held, NOT secured':t<13?'S1 / D aligned to the source-indicated external face':'STOP / concealed receiver and engagement remain unverified';
  sub.textContent=t<8?'Manual PDF p4 / printed3. Showing one end only; complete S1 specifies D ×4.':'Vít D / no spin, concealed insertion, tool operation or completed fastening is represented.';
  foot.textContent='No measured OEM dimensions. External holding/support procedure NOT validated. Bronze rings are diagram target annotations, not drilled geometry.';
 }
 camera.position.copy(shot.center).addScaledVector(shot.direction,shot.distance);camera.lookAt(shot.center);camera.updateMatrixWorld(true);renderer.render(scene,camera);
 if(!match&&check.time>=8){marker(new T.Vector3(-576,865,-270),'SOURCE TARGET / D1');marker(new T.Vector3(-576,785,-270),'SOURCE TARGET / D2');}
 return{name,time:check.time,state,camera:{position:camera.position.toArray(),target:shot.center.toArray(),fov:camera.fov},inventory:{parts:p.r.tree.byId.size,registered:p.r.registry.size},fit:'NOT_CERTIFIED',videoScope:'LIMITED_LOCAL_APPROACH_PROOF_ONLY',networkRequests:performance.getEntriesByType('resource').filter(x=>/^https?:/.test(x.name)).map(x=>x.name)};
}
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name){return render(name);}};
render('S1-orientation.png');
