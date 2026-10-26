/** Static prototype review only. Uses existing generic still renderer, no video timeline. */
import * as T from 'three';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createPrototype,hardwarePrototype,hardwareCounts,finishes,type Finish} from './model';
const r=createPrototype();
RectAreaLightUniformsLib.init();
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1280,720);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;
document.body.style.cssText='margin:0;background:#e9e6df';document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(r.root,r.hardwareRoot);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.7;
scene.add(new T.HemisphereLight('#fffaf2','#b7b4ad',1.45));
for(const [p,power,w,h]of [[[-1100,1600,1300],5.5,1300,1600],[[1300,1100,800],3,1000,1400],[[200,1400,-1100],5,1100,900]] as const){const l=new T.RectAreaLight('#fff9ef',power,w,h);l.position.set(p[0],p[1],p[2]);l.lookAt(0,500,0);scene.add(l);}
const sun=new T.DirectionalLight('#fff7e8',2.2);sun.position.set(-900,1800,1100);sun.target.position.set(0,420,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-1700,right:1700,top:1700,bottom:-1700,near:1,far:7000});sun.shadow.normalBias=.2;sun.shadow.bias=-.00008;sun.shadow.radius=8;sun.shadow.blurSamples=12;scene.add(sun,sun.target);
const ground=new T.Mesh(new T.PlaneGeometry(30000,30000),new T.MeshStandardMaterial({color:'#e9e6df',roughness:.94}));ground.rotation.x=-Math.PI/2;ground.position.y=-4;ground.receiveShadow=true;scene.add(ground);
const camera=new T.PerspectiveCamera(32,1280/720,.1,30000);
const header=document.createElement('div');header.style.cssText='position:fixed;left:27px;top:16px;color:#292c2f;font:600 13px Arial;letter-spacing:2px;background:#f4f1e9ed;padding:7px';header.textContent='PRODUCT 03 / CRAFTED FRAME';document.body.append(header);
const badge=document.createElement('div');badge.style.cssText='position:fixed;right:30px;top:20px;color:#725135;font:600 11px Arial;letter-spacing:1px;background:#fff9e9dd;padding:9px 12px;border-radius:3px';badge.textContent='VISUAL_APPROXIMATION / PHASE B';document.body.append(badge);
const title=document.createElement('div');title.style.cssText='position:fixed;left:27px;bottom:36px;font:500 19px Arial;color:#292c2f;background:#f4f1e9ed;padding:7px';document.body.append(title);
const footer=document.createElement('div');footer.style.cssText='position:fixed;left:27px;bottom:13px;font:11px Arial;color:#615d55;background:#f4f1e9ed;padding:7px';footer.textContent='Proportional study only. No measured OEM dimensions, hidden threads or mechanical-fit certification. No assembly animation.';document.body.append(footer);
const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('width','1280');overlay.setAttribute('height','720');overlay.style.cssText='position:fixed;inset:0;pointer-events:none';document.body.append(overlay);
const exhibits=new T.Group();scene.add(exhibits);
const shots=[
 {name:'01-crafted-overall.png',label:'01 / Crafted Frame — smoked brown, charcoal, muted steel',mode:'overall',variant:'crafted'},
 {name:'02-quiet-oak-overall.png',label:'02 / Quiet Oak — lighter wood, warm graphite',mode:'overall',variant:'linen'},
 {name:'03-front-identity.png',label:'03 / Two doors, three open cubbies — no invented drawers',mode:'front',variant:'crafted'},
 {name:'04-rear-identity.png',label:'04 / Rear frame 4 and upper module — visible-shape study',mode:'rear',variant:'crafted'},
 {name:'05-exploded-20-components.png',label:'05 / 20 numbered components — display offsets, NOT installation paths',mode:'exploded',variant:'crafted'},
 {name:'06-upper-module.png',label:'06 / Upper module — 9, 10×2, 11×2, 12, 13 and 15',mode:'module',variant:'crafted'},
 {name:'07-wood-crafted.png',label:'07 / Procedural wood — proposed finish and grain, not OEM species',mode:'wood',variant:'crafted'},
 {name:'08-metal-lattice.png',label:'08 / Tube, diagonal mesh and X brace — material separation',mode:'metal',variant:'crafted'},
 {name:'09-screw-C-D.png',label:'09 / C and D — external drive / shaft study; thread geometry omitted',mode:'screws',variant:'crafted'},
 {name:'10-hinge-detail.png',label:'10 / Depicted hinge — contact, bore and access NOT VERIFIED',mode:'hinge',variant:'crafted'},
 {name:'11-I-J-unconfirmed.png',label:'11 / J upper / I lower — WORKING HYPOTHESIS, not OEM-confirmed',mode:'tabs',variant:'crafted'},
 {name:'12-hardware-tools.png',label:'12 / A–O samples — quantities from manual; L/M/O are tools',mode:'hardware',variant:'crafted'},
 {name:'13-parts-inventory.png',label:'13 / All 20 supplied component instances — IDs remain separate',mode:'inventory',variant:'crafted'},
 {name:'14-floor-supports.png',label:'14 / Four rails 6 and rail 5 — C4+C6 end assignment UNRESOLVED',mode:'supports',variant:'crafted'},
 {name:'15-wood-quiet-oak.png',label:'15 / Quiet Oak — alternative finish under identical light',mode:'wood',variant:'linen'},
 {name:'16-tools-L-M-O.png',label:'16 / L, M and O — separate illustrative tools; no power tools',mode:'tools',variant:'crafted'},
];
function textAt(point:T.Vector3,text:string){const p=point.clone().project(camera);const el=document.createElementNS(overlay.namespaceURI,'text');el.setAttribute('x',String((p.x*.5+.5)*1280));el.setAttribute('y',String((-p.y*.5+.5)*720));el.setAttribute('font-family','Arial');el.setAttribute('font-size','13');el.setAttribute('text-anchor','middle');el.setAttribute('fill','#3b352e');el.setAttribute('stroke','#faf8f1');el.setAttribute('stroke-width','3');el.setAttribute('paint-order','stroke');el.textContent=text;overlay.append(el);}
function fit(box:T.Box3,direction:T.Vector3){const center=box.getCenter(new T.Vector3()),d=direction.clone().normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),d).normalize(),up=new T.Vector3().crossVectors(d,right).normalize();let dist=0;const tangent=Math.tan(camera.fov*Math.PI/360);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const a=new T.Vector3(x,y,z).sub(center);dist=Math.max(dist,Math.abs(a.dot(up))/(tangent*.72)+a.dot(d),Math.abs(a.dot(right))/(tangent*camera.aspect*.8)+a.dot(d));}camera.position.copy(center).addScaledVector(d,dist);camera.lookAt(center);camera.updateMatrixWorld(true);return{position:camera.position.toArray(),target:center.toArray(),fov:camera.fov};}
function render(name:string){
 const shot=shots.find(s=>s.name===name);if(!shot)throw Error(name);r.reset();r.setFinish(shot.variant as Finish);exhibits.clear();overlay.replaceChildren();r.root.visible=true;r.hardwareRoot.visible=true;ground.visible=true;
 for(const [id,g]of r.registry.entries())g.visible=id.startsWith('part-');
 let selected=[...r.registry.entries()].filter(([id])=>id.startsWith('part-')).map(([id])=>id),dir=new T.Vector3(-1.1,.65,1.8),bounds:T.Box3|undefined;
 const labels:{p:T.Vector3;t:string}[]=[];
 const samples=(codes:string[],positions:T.Vector3[],size:number)=>{r.root.visible=false;r.hardwareRoot.visible=false;ground.visible=false;for(const [i,code]of codes.entries()){const g=hardwarePrototype(code,r.steel,r.dark);const b=new T.Box3().setFromObject(g),extent=b.getSize(new T.Vector3()),scale=size/Math.max(extent.x,extent.y,extent.z);const center=b.getCenter(new T.Vector3());g.position.sub(center);const wrap=new T.Group();wrap.add(g);wrap.scale.setScalar(scale);wrap.rotation.y=-.24;wrap.rotation.x=.18;wrap.position.copy(positions[i]);exhibits.add(wrap);labels.push({p:positions[i].clone().add(new T.Vector3(0,-size*.75,0)),t:`${code} ×${hardwareCounts[code]}${'LMO'.includes(code)?' / TOOL':''}`});}selected=codes.map(c=>'sample-'+c);};
 if(shot.mode==='front')dir.set(0,.16,2);
 if(shot.mode==='rear')dir.set(1,.55,-1.8);
 if(['overall','front','rear'].includes(shot.mode)){
  const loc=[[-585,3,-286],[-585,3,286],[585,3,-286],[585,3,286],[0,3,286]];
  for(let i=1;i<=5;i++){const h=r.registry.require(`hardware-A-${i}`);h.visible=true;h.position.set(...loc[i-1] as [number,number,number]);selected.push(h.name);}
 }
 if(shot.mode==='exploded'){r.explode();for(const id of selected){const o=r.registry.require(id),b=new T.Box3().setFromObject(o);labels.push({p:b.getCenter(new T.Vector3()),t:`${o.userData.code}`});}dir.set(-1.25,.9,1.9);}
 if(shot.mode==='module'){selected=selected.filter(id=>Number(r.registry.require(id).userData.code)>=9&&id!=='part-14-1');dir.set(-1.2,.6,1.8);}
 if(shot.mode==='wood'){selected=['part-9-1'];bounds=new T.Box3(new T.Vector3(-240,900,-140),new T.Vector3(240,927,150));dir.set(-.6,1.1,1.2);ground.visible=false;}
 if(shot.mode==='metal'){selected=['part-1-1'];bounds=new T.Box3(new T.Vector3(-610,260,25),new T.Vector3(-560,550,280));dir.set(-1.4,.35,1);ground.visible=false;}
 if(shot.mode==='hinge'){selected=['part-1-1','part-7-1'];bounds=new T.Box3(new T.Vector3(-615,555,263),new T.Vector3(-500,690,331));dir.set(-.65,.3,1.7);ground.visible=false;}
 if(shot.mode==='supports'){selected=['part-1-1','part-2-1','part-3-1','part-4-1','part-5-1',...Array.from({length:4},(_,i)=>`part-6-${i+1}`)];dir.set(-1.1,1.4,2);}
 if(shot.mode==='inventory'){
  let j=0;for(const id of selected){const g=r.registry.require(id),code=g.userData.code as string;g.position.set(0,0,0);if(['1','2','6','10','11'].includes(code))g.rotation.y=Math.PI/2;if(['9','14','15'].includes(code))g.rotation.x=Math.PI/2;g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g),sz=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3()),scale=165/Math.max(sz.x,sz.y,sz.z);g.scale.setScalar(scale);g.position.copy(center.multiplyScalar(-scale)).add(new T.Vector3((j%5-2)*235,(1.5-Math.floor(j/5))*245+500,0));labels.push({p:new T.Vector3((j%5-2)*235,(1.5-Math.floor(j/5))*245+385,0),t:`${g.userData.code} / ${id.split('-').at(-1)}`});j++;}dir.set(0,.03,2);ground.visible=false;
 }
 if(shot.mode==='screws'){samples(['C','D'],[new T.Vector3(-110,40,0),new T.Vector3(110,40,0)],200);dir.set(.18,.55,2);}
 if(shot.mode==='tabs'){samples(['J','I'],[new T.Vector3(-110,40,0),new T.Vector3(110,40,0)],140);dir.set(.12,.2,2);labels.push({p:new T.Vector3(-110,155,0),t:'S17 / UPPER'}, {p:new T.Vector3(110,155,0),t:'S18 / LOWER ?'});}
 if(shot.mode==='tools'){samples(['L','M','O'],[new T.Vector3(-235,0,0),new T.Vector3(0,0,0),new T.Vector3(235,0,0)],220);dir.set(.12,.15,2);}
 if(shot.mode==='hardware'){const codes=Object.keys(hardwareCounts);samples(codes,codes.map((_,i)=>new T.Vector3((i%5-2)*180,(1-Math.floor(i/5))*220+30,0)),110);dir.set(0,.08,2);}
 if(r.root.visible)for(const [id,g]of r.registry.entries())if(id.startsWith('part-'))g.visible=selected.includes(id);
 r.root.updateMatrixWorld(true);r.hardwareRoot.updateMatrixWorld(true);exhibits.updateMatrixWorld(true);
 if(!bounds){bounds=new T.Box3();if(exhibits.children.length)bounds.setFromObject(exhibits);else for(const id of selected)bounds.union(new T.Box3().setFromObject(r.registry.require(id)));if(shot.mode==='inventory'||shot.mode==='hardware')bounds.expandByScalar(45);}
 const cameraState=fit(bounds,dir);title.textContent=shot.label;header.textContent=`PRODUCT 03 / ${finishes[shot.variant as Finish].label.split(' / ')[0].toUpperCase()}`;
 renderer.render(scene,camera);labels.forEach(l=>textAt(l.p,l.t));
 return{name,mode:shot.mode,variant:shot.variant,selected,camera:cameraState,status:'VISUAL_APPROXIMATION',physicalFit:'NOT_VALIDATED',installationPath:'NOT_VALIDATED',networkResourceRequests:performance.getEntriesByType('resource').filter(x=>/^https?:/.test(x.name)).map(x=>x.name),registeredPartInstances:r.tree.byId.size,registeredHardwareUnits:r.registry.size-r.tree.byId.size,nativeResolution:[1280,720],rendererCalls:renderer.info.render.calls};
}
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints:shots.map(s=>({name:s.name,label:s.label,time:0})),async render(name){return render(name);}};
render(shots[0].name);
