import * as T from 'three';
import {updatePadCallout} from '../human-3-image-correction-v1/pad-callout-r2';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {installFrameRenderer} from '@/engine/render/FrameRenderer';
import {createRuntime} from './runtime';
import {createFilmCamera} from '../final-camera-fix-v1/camera-r3';
import {longPackage,capturePackage} from './film-package';
import {steps} from '../human-3-image-correction-v1/runtime';
import {extendedTimeForLong278} from './clock-option-278-r2';
import {extendedClock} from './clock';
import {proofCamera} from './camera-r2';
declare const __P03_START__:number;declare const __P03_END__:number;
const start=__P03_START__,end=__P03_END__,pkg=start===0&&end===278?longPackage:capturePackage(start,end);
const r=createRuntime(),track=createFilmCamera(r.base),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.localClippingEnabled=false;
document.body.style.cssText='margin:0;background:#e9e6df;overflow:hidden';document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e9e6df');scene.add(r.rig);scene.environment=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.add(new T.HemisphereLight('#fffaf2','#9ca5ad',1.8));
for(const p of [[-1200,1700,-1000],[1200,900,1100],[0,-1000,1000]]){const l=new T.DirectionalLight('#fffaf4',2.6);l.position.set(...p as [number,number,number]);scene.add(l);}
const titles=['Build the upper module','Add the dividers','Align the top panel','Two brackets · two bolts each','Place the back panel','Complete the upper module','Prepare the five feet','Join the side frames','Connect the rear frame','F · nonliteral illustration','Connect the front frame','F · nonliteral illustration','Place and fasten four rails','Align the final frame','Place the floor · no fasteners','Four hinges · OEM E8 + 8 human illustrations','Pose only · retention unverified','I/J unresolved · pose only','N ×4 · installation remains on hold'];
function text(css:string){const d=document.createElement('div');d.style.cssText=css;document.body.append(d);return d;}
const header=text('position:fixed;left:28px;top:22px;font:600 12px Arial;letter-spacing:2px;color:#51483e;background:#f5f1e8e8;padding:6px 8px');header.textContent='WOOD & STEEL / ASSEMBLY STUDY';
const disclosure=text('position:fixed;right:28px;top:22px;font:12px Arial;color:#765d45;background:#f5f1e8e8;padding:6px 8px');disclosure.textContent='Illustrative · unmeasured geometry';
const panel=text('position:fixed;left:28px;bottom:26px;max-width:580px;background:#f5f1e8e8;padding:12px 17px;border-left:3px solid #947054;color:#292d2e');
const chapter=text('font:600 13px Arial;letter-spacing:1.4px;color:#80654c');panel.append(chapter);
const title=text('font:600 21px Arial;line-height:1.4');panel.append(title);
const action=text('font:14px Arial;line-height:1.6;color:#61574c');panel.append(action);
const progress=text('position:fixed;left:0;bottom:0;height:3px;background:#947054;');
let state:ReturnType<typeof r.evaluate>;let currentCamera:T.PerspectiveCamera;
let renderedTime=-1;
const gl=renderer.getContext(),events:string[]=[];renderer.domElement.addEventListener('webglcontextlost',()=>events.push('contextlost'));renderer.domElement.addEventListener('webglcontextrestored',()=>events.push('contextrestored'));
function render(t:number){
 const extended=extendedTimeForLong278(t),clock=extendedClock(extended),source=clock.source;currentCamera=source>=208.5&&source<228?proofCamera({sourceTime:source,clock}):track.camera(source);state=r.evaluate(extended);
 // Reserve native pixels for production captions by widening/lifting contextual
 // views. Macro extrinsics and active geometry remain unchanged; no crop/upscale.
 const safe=currentCamera.userData.wideWeight??0;
 currentCamera.fov+=17*safe;if(safe>0)currentCamera.setViewOffset(innerWidth,innerHeight,0,88*safe,innerWidth,innerHeight);currentCamera.updateProjectionMatrix();renderer.render(scene,currentCamera);progress.style.width=`${Math.min(100,t/278*100)}%`;
 const step=steps.find(s=>s.id===state.step)!,h=state.currentHardware;const a=state.currentIllustration;
 chapter.textContent=source>=268?'SOURCE STUDY / OPEN ISSUES REMAIN':source>=247&&source<262?'ALIGNMENT / FINAL RETENTION UNVERIFIED':`MANUAL STEP ${String(step.number).padStart(2,'0')} / 19`;
 title.textContent=source>=268?'Illustrative build · installation holds remain':source>=247&&source<262?'Align before final tightening':titles[step.number-1];
 if(source>=228)action.textContent=source>=262?`N pads staged separately ${state.pending.length}/4 · door operation on hold`:source>=247?'No torque, tool-access or final-retention certification':step.number===18?'I/J identity conflict unresolved · no fastening claim':'Exterior poses only · receiving and retention unverified';
 else if(a)action.textContent=`HUMAN ILLUSTRATION · ${a.id} · ${a.visualState}`;
 else if(state.clock.block)action.textContent='Two OEM E + two human illustrations retained · tool clear';
 else if(h?.kind==='threaded'){
  const tool=h.tool?r.r.registry.require(`hardware-${h.tool}-1`):null,toolClear=h.progress>=.97&&!tool?.visible;
  action.textContent=`${h.id.replace('hardware-','').replace(/-/g,' ')} · ${toolClear?'Tool withdrawn · exterior position shown':h.progress<.15?'Approach the visible target':h.progress<.4?'Align the fastener and tool':'Illustrative insertion · align before final tightening'}`;
 }else if(state.body)action.textContent=`Part ${state.body.id.split('-')[1]} · approach, align and retain`;
 else if(h?.kind==='foot')action.textContent=`${h.id.replace('hardware-','').replace(/-/g,' ')} · follows its host frame`;
 else action.textContent='Retain every placed component · physical fit unverified';
 if(step.number===10||step.number===12)action.textContent='F is a declared nonliteral illustration of the source association';
 if(step.number===13||step.number===14)action.textContent+=' · C end allocation OPEN';
 if(step.number===4)action.textContent+=' · K22/10 unmeasured';
 if(source>=208.5){disclosure.style.whiteSpace='pre-line';disclosure.textContent='DOOR-SIDE FASTENERS: HUMAN-APPROVED ILLUSTRATION\nOEM ATTACHMENT DETAILS: UNVERIFIED\nDOOR FUNCTION: HOLD';}
 else{disclosure.style.whiteSpace='normal';disclosure.textContent='Illustrative · unmeasured geometry';}
 if(step.number===16)action.textContent+=' · E8 OEM / +8 human illustrations';
 if(source>=227.1803&&source<228&&!a&&!state.clock.block)action.textContent='Four hinges / 16 illustrated screws · tool clear · FUNCTION HOLD';
 updatePadCallout(r.base,currentCamera,source);
 renderedTime=t;return state;
}
(window as unknown as {__P03_TELEMETRY__:()=>unknown}).__P03_TELEMETRY__=()=>({time:renderedTime,sourceTime:state.sourceTime,extendedTime:state.time,illustrations:state.illustrations,oemRegistry:[...r.r.registry.entries()].length,contextLost:gl.isContextLost(),glError:gl.getError(),drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],renderCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,events:[...events],camera:{position:currentCamera.position.toArray(),direction:currentCamera.getWorldDirection(new T.Vector3()).toArray(),fov:currentCamera.fov},state:{step:state.step,visible:state.visible.length,installed:state.installed.length},ready:!gl.isContextLost()});
installFrameRenderer({ready:true,duration:end-start,fps:30,getDuration:()=>end-start,getCreativeDefinition:()=>({product:pkg.product,assembly:pkg.assembly,video:pkg.video}),getSceneState:()=>state,getCameraState:()=>({position:currentCamera.position.toArray(),direction:currentCamera.getWorldDirection(new T.Vector3()).toArray(),target:[],fov:currentCamera.fov}),seek:async t=>{render(start+t);},setTime:async t=>{render(start+t);},renderFrame:async t=>{render(start+t);gl.finish();if(gl.isContextLost())throw Error('P03_WEBGL_CONTEXT_LOST');await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));}});
const checkpoints=steps.filter(s=>s.number<=15).flatMap(s=>[{name:`${s.id}-contact.png`,time:Math.min(s.end-.1,s.start+2.5),label:s.id},{name:`${s.id}-endpoint.png`,time:s.end-1/24,label:s.id}]);
window.__MECHANISM_AUDIT_RENDERER__={ready:true,checkpoints,async render(name){const c=checkpoints.find(c=>c.name===name);if(!c)throw Error(name);const s=render(c.time);return{name,time:c.time,state:s,camera:{position:currentCamera.position.toArray(),quaternion:currentCamera.quaternion.toArray()},networkRequests:performance.getEntriesByType('resource').filter(e=>/^https?:/.test(e.name)).map(e=>e.name)};}};
render(start);
