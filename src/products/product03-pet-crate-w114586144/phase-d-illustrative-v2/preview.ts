/** Offline focused proof through the existing generic diagnostic renderer. */
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {createRuntime} from './runtime';
import {steps,duration,assemblyDuration,placements} from './timeline';
const fps=8;
const p=createRuntime();RectAreaLightUniformsLib.init();
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.localClippingEnabled=true;renderer.setSize(1280,720);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
document.body.style.cssText='margin:0;background:#e9e6df';document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(p.rig);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=1;
scene.add(new T.HemisphereLight('#fffaf2','#b7b4ad',1.25));
for(const [pos,intensity,color] of [[[-1100,1700,900],6,'#fff9ef'],[[1200,1100,700],5,'#e2ecff'],[[200,1500,-1100],7,'#fff9ef']] as const){const l=new T.RectAreaLight(color,intensity,1100,1300);l.position.set(pos[0],pos[1],pos[2]);l.lookAt(-100,700,0);scene.add(l);}
const sun=new T.DirectionalLight('#fff7e8',1.8);sun.position.set(-900,1800,-1100);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-1700,right:1700,top:1700,bottom:-1700,near:1,far:7000});sun.shadow.normalBias=.2;scene.add(sun);
const floor=new T.Mesh(new T.PlaneGeometry(30000,30000),new T.MeshStandardMaterial({color:'#e9e6df',roughness:.94}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const camera=new T.PerspectiveCamera(30,1280/720,.1,30000);camera.setViewOffset(1280,720,0,20,1280,720);
function label(css:string){const el=document.createElement('div');el.style.cssText=css;document.body.append(el);return el;}
const heading=label('position:fixed;left:26px;top:19px;font:600 12px Arial;letter-spacing:1.6px;background:#f4f1e9ed;padding:8px;color:#292c2f');heading.textContent='PRODUCT 03 / CRAFTED FRAME';
const badge=label('position:fixed;right:25px;top:19px;font:600 11px Arial;background:#fff5e7ee;color:#805534;padding:8px');badge.textContent='ILLUSTRATIVE · UNMEASURED GEOMETRY';
const title=label('position:fixed;left:28px;bottom:39px;font:600 22px Arial;color:#292c2f;padding:8px 0;max-width:1020px');
const sub=label('position:fixed;left:28px;bottom:20px;font:13px Arial;color:#61594f;padding:5px 0;max-width:1030px');
const foot=label('position:fixed;right:26px;top:61px;font:600 12px Arial;color:#865834;background:#fff6e6ed;padding:7px 10px;max-width:240px');
const lowerPlate=label('position:fixed;left:0;right:0;bottom:0;height:96px;background:linear-gradient(transparent,#eeeae2 35%);z-index:1');
for(const el of [heading,badge,title,sub,foot])el.style.zIndex='2';
const progress=label('position:fixed;left:28px;right:28px;bottom:7px;height:3px;background:#d9d1c5');const progressFill=document.createElement('div');progressFill.style.cssText='height:3px;background:#94704d';progress.append(progressFill);
const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('width','1280');overlay.setAttribute('height','720');overlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:3';document.body.append(overlay);
function marker(pos:T.Vector3,text:string){const q=pos.project(camera),x=(q.x*.5+.5)*1280,y=(-q.y*.5+.5)*720;const c=document.createElementNS(overlay.namespaceURI,'circle');for(const [key,value]of Object.entries({cx:x,cy:y,r:6,fill:'none',stroke:'#b56b32','stroke-width':2}))c.setAttribute(key,String(value));overlay.append(c);const l=document.createElementNS(overlay.namespaceURI,'text');for(const [key,value]of Object.entries({x:x+15,y:y-10,fill:'#714c2f','font-size':13,'font-family':'Arial',stroke:'#f4f1e9','stroke-width':3,'paint-order':'stroke'}))l.setAttribute(key,String(value));l.textContent=text;overlay.append(l);}
function fit(box:T.Box3,dir:T.Vector3,fill=.75){const center=box.getCenter(new T.Vector3()),d=dir.clone().normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),d).normalize(),up=new T.Vector3().crossVectors(d,right).normalize(),tan=Math.tan(camera.fov*Math.PI/360);let dist=0;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const a=new T.Vector3(x,y,z).sub(center);dist=Math.max(dist,Math.abs(a.dot(up))/(tan*fill)+a.dot(d),Math.abs(a.dot(right))/(tan*camera.aspect*.82)+a.dot(d));}return{center,distance:dist,direction:d};}

const checkpoints=[...Array.from({length:duration*fps},(_,i)=>({name:`frame-${String(i).padStart(6,'0')}.png`,label:'Illustrative assembly blocking',time:i/fps})),...steps.map(s=>({name:`${s.id}-endpoint.png`,label:s.title,time:s.end-.001})),{name:'first-joint-macro.png',label:'First essential connection',time:9},{name:'bracket-macro.png',label:'K and B',time:steps[3].start+5},{name:'hinge-macro.png',label:'External hinge hypothesis',time:steps[15].start+8},{name:'final-open.png',label:'Illustrative open pose',time:assemblyDuration+2},{name:'final-closed.png',label:'Illustrative closed pose',time:duration}];
function render(name:string){
 const shot=checkpoints.find(x=>x.name===name);if(!shot)throw Error(name);const state=p.evaluate(shot.time),t=shot.time,step=steps[state.stepIndex-1];overlay.replaceChildren();
 floor.position.y=t<steps[5].start?745:t<steps[6].start?727:0;
 floor.visible=state.stepIndex!==4;
 let dir=new T.Vector3(-1.05,.62,1.8),bounds=new T.Box3();
 for(const id of state.visible)if(!id.startsWith('hardware-L-'))bounds.union(new T.Box3().setFromObject(p.r.registry.require(id)));
 let wide=fit(bounds,dir,.77),view=wide;
 if([1,2,3,7].includes(state.stepIndex))dir.set(-1.05,.62,-1.7);
 if(state.stepIndex===9||state.stepIndex===10)dir.set(-1,.55,1.8);
 if(state.stepIndex===11||state.stepIndex===12)dir.set(-1,.55,-1.8);
 if(state.stepIndex===4)dir.set(.7,-.65,1.3);
 if(state.stepIndex>=16)dir.set(-.8,.45,2);
 if(state.stepIndex>=8&&state.stepIndex<14){bounds.makeEmpty();for(const id of state.visible)if(!id.startsWith('hardware-')&&!state.stagedSubassemblies.includes(id))bounds.union(new T.Box3().setFromObject(p.r.registry.require(id)));}
 wide=fit(bounds,dir,.77);view=wide;
 const mediumRegions:Record<number,[number,number,number,number,number,number]>={8:[-660,680,-335,660,1000,335],10:[-640,640,-340,640,805,-200],11:[-640,630,220,640,800,340],12:[-640,630,220,640,800,340],13:[-640,-20,-340,640,260,340],14:[-640,-20,-340,640,260,420],15:[-640,-20,-340,640,360,400],16:[-630,70,220,630,730,400]};
 const region=mediumRegions[state.stepIndex];if(region){const local=state.localTime;let q=easeCam(local,.7,1.4)*(1-easeCam(local,step.duration-.85,step.duration-.2));if(state.stepIndex===15)q=easeCam(local,3,3.8)*(1-easeCam(local,step.duration-.85,step.duration-.2));const mediumBox=new T.Box3(new T.Vector3(region[0],region[1],region[2]),new T.Vector3(region[3],region[4],region[5])).applyMatrix4(p.rig.matrixWorld);const target=fit(mediumBox,dir,.8);view={center:wide.center.clone().lerp(target.center,q),distance:T.MathUtils.lerp(wide.distance,target.distance,q),direction:dir.clone().normalize()};}
 if(state.stepIndex===1&&t>=5&&t<11.5){
  const box=new T.Box3(new T.Vector3(-715,760,-312),new T.Vector3(-535,910,-218));const close=fit(box,new T.Vector3(-1,.32,-.8),.7);const q=easeCam(t,5,6)*(1-easeCam(t,10.5,11.5));view={center:wide.center.clone().lerp(close.center,q),distance:T.MathUtils.lerp(wide.distance,close.distance,q),direction:wide.direction.clone().lerp(close.direction,q).normalize()};
 }
 const macroTargets:Record<number,{point:[number,number,number];dir:[number,number,number];from:number;to:number;size:number}>={
 2:{point:[189,825,-279],dir:[-.4,.35,-1.5],from:3.5,to:6.7,size:105},
 3:{point:[-567,923,-230],dir:[-.7,1.3,-.7],from:3,to:6,size:100},
 4:{point:[-175,899,220],dir:[1,-.7,1.1],from:1,to:4,size:90},
 7:{point:[-685,16,-286],dir:[-1,.35,-1.5],from:3.5,to:5,size:75},
 8:{point:[-594,752,-220],dir:[-1,.3,1.5],from:3,to:5,size:90},
 9:{point:[-594,116,-286],dir:[-1,.35,1.5],from:2.5,to:4.5,size:80},
 10:{point:[-450,717,-286],dir:[-.5,-.4,1.2],from:.4,to:3.7,size:105},
 12:{point:[-450,721,286],dir:[-.5,-.4,-1.2],from:.5,to:2.7,size:85},
 16:{point:[-574,177,298.3],dir:[-.35,.3,2],from:4.9,to:8.4,size:75},
 17:{point:[-16,724,302],dir:[-.35,.4,2],from:.6,to:3.4,size:80},
 18:{point:[-16,74,302],dir:[-.35,.4,2],from:.5,to:3.1,size:75}
 };
 const macro=macroTargets[state.stepIndex];
 if(macro&&!name.includes('macro')){const q=easeCam(state.localTime,macro.from,macro.from+.45)*(1-easeCam(state.localTime,macro.to-.45,macro.to));const c=new T.Vector3(...macro.point).applyMatrix4(p.rig.matrixWorld),box=new T.Box3(c.clone().addScalar(-macro.size/2),c.clone().addScalar(macro.size/2));const target=fit(box,new T.Vector3(...macro.dir),.7);view={center:view.center.clone().lerp(target.center,q),distance:T.MathUtils.lerp(view.distance,target.distance,q),direction:view.direction.clone().lerp(target.direction,q).normalize()};if(q>.05)floor.visible=false;}
 if(name==='bracket-macro.png'){view=fit(new T.Box3(new T.Vector3(-225,860,160),new T.Vector3(-120,925,260)),new T.Vector3(1,-.7,1.1),.7);floor.visible=false;}
 if(name==='hinge-macro.png'){view=fit(new T.Box3(new T.Vector3(-610,590,260),new T.Vector3(-530,660,330)),new T.Vector3(-.3,.25,2),.7);floor.visible=false;}
 if(t>=assemblyDuration)view.distance*=.84;
 camera.position.copy(view.center).addScaledVector(view.direction,view.distance);camera.lookAt(view.center);camera.updateMatrixWorld(true);renderer.render(scene,camera);
 const shortTitles=['Join 10 to 12 · align first, then engage D','Add both dividers 11 · retain the first connection','Place top 9 · align all four D','K + B · show the corner connection','Position 13 · D ×7, backing details omitted','Place board 15 · D ×10','Prepare A feet · keep 5 staged for S14','Join side frames to the retained module','Rear frame 4 · first C connection','F ×4 · source tightening checkpoint','Front rail 3 · preserve tab direction','F ×4 · source tightening checkpoint','Four rails 6 · support their free ends','Join prepared 5 · C allocation hypothesis','Return upright · place floor 14 without screws','Doors 7 / 8 · external hinge and E illustration','Upper stack H / J / G · identity hypothesis','Lower stack H / I / G · source conflict retained','N pads · illustrative inside-door placement'];
 title.textContent=t>=assemblyDuration?'Final alignment review / illustrative door demonstration':`${step.id} / ${shortTitles[state.stepIndex-1]}`;
 const ids=placements.filter(x=>x.step===state.stepIndex&&x.id.startsWith('part-')).map(x=>x.id.split('-')[1]);const components=[...new Set(ids)];const hw=Object.entries(step.hardware).map(([k,v])=>`${k} ×${v}`).join(' · ');
 sub.textContent=t>=assemblyDuration?'Illustrative release, open and close · no OEM movement limit claimed':`${components.length?'Parts '+components.join(' / ')+' · ':''}${hw} · Align before final tightening`;
 foot.textContent=state.stepIndex===13||state.stepIndex===14?'C END POSITIONS · HYPOTHESIS':state.stepIndex===17||state.stepIndex===18?'J UPPER / I LOWER · HYPOTHESIS':t>=assemblyDuration||state.stepIndex===19?'35° POSE / TAB RELEASE · ILLUSTRATIVE':'HIDDEN CONNECTION DETAILS OMITTED';
 progressFill.style.width=`${Math.min(100,t/duration*100)}%`;
 if(state.stepIndex>=7&&state.stepIndex<14){const note=document.createElementNS(overlay.namespaceURI,'text');note.setAttribute('x','1070');note.setAttribute('y','111');note.setAttribute('fill','#71543b');note.setAttribute('font-size','12');note.setAttribute('font-family','Arial');note.textContent='5 + A · READY FOR S14';overlay.append(note);}
 // A compact orientation map supplies location context without covering the working connection.
 if((state.stepIndex===1&&t>=5&&t<11.5)||(macro&&state.localTime>=macro.from&&state.localTime<=macro.to)){
 const mapLabel=document.createElementNS(overlay.namespaceURI,'text');mapLabel.setAttribute('x','1162');mapLabel.setAttribute('y','133');mapLabel.setAttribute('fill','#8c806f');mapLabel.setAttribute('font-size','10');mapLabel.setAttribute('font-family','Arial');mapLabel.textContent='LOCATION';overlay.append(mapLabel);
 const map=document.createElementNS(overlay.namespaceURI,'rect');map.setAttribute('x','1162');map.setAttribute('y','141');map.setAttribute('width','78');map.setAttribute('height','98');map.setAttribute('fill','#f4f1e9aa');map.setAttribute('stroke','#a49886');overlay.append(map);
 const level=state.stepIndex<=6?0:state.stepIndex>=17?(state.stepIndex===17?22:75):state.stepIndex===15?75:45;
 const focus=document.createElementNS(overlay.namespaceURI,'rect');focus.setAttribute('x','1166');focus.setAttribute('y',String(145+level));focus.setAttribute('width','70');focus.setAttribute('height','15');focus.setAttribute('fill','#b28a5877');overlay.append(focus);
 }
 if(state.invertedPresentation>.001&&state.invertedPresentation<.999)sub.textContent='Presentation reorientation · retained assembly moves together';
 return{name,time:t,state,camera:{position:camera.position.toArray(),target:view.center.toArray()},networkRequests:performance.getEntriesByType('resource').filter(x=>/^https?:/.test(x.name)).map(x=>x.name)};
}
function easeCam(t:number,a:number,b:number){return T.MathUtils.smootherstep(t,a,b);}
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name){return render(name);}};
render('S01-endpoint.png');
