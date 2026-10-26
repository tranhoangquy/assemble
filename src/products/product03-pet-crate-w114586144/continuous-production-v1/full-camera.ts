import * as T from 'three';
import type {createRuntime} from './option-n-runtime';
import {steps,hardware} from './option-n-runtime';
import {fromV2,toV2} from './option-n-clock';
import {p1Camera} from './p1-camera';
import {p2p3Camera} from './p2-p3-camera';
type Runtime=ReturnType<typeof createRuntime>;
const mix=(a:T.PerspectiveCamera,b:T.PerspectiveCamera,t:number,start:number,end:number)=>{const u=T.MathUtils.smootherstep(t,start,end),c=new T.PerspectiveCamera(T.MathUtils.lerp(a.fov,b.fov,u),1280/720,.1,20000);c.position.copy(a.position).lerp(b.position,u);c.quaternion.copy(a.quaternion).slerp(b.quaternion,u);c.updateProjectionMatrix();c.updateMatrixWorld(true);return c;};
/** Authored step camera track. Camera snapshots are prepared once from source;
 * evaluation remains absolute and restores canonical source after preparation. */
export function createFilmCamera(r:Runtime){
 const contexts=steps.map(s=>r.camera(Math.min(s.end-.01,s.start+(s.number===7?1:.5)),true).clone());
 const firsts=steps.map(s=>hardware.find(h=>h.step===s.number&&h.kind==='threaded'));
 const macros=firsts.map(h=>h?r.camera(h.start+(h.end-h.start)*.5,false).clone():null);
 // Orient each untouched step context toward its first connection, so zooms
 // do not require a near180-degree reversal. Accepted proof regions stay intact.
 for(let i=0;i<contexts.length;i++){if([3,6,7,15].includes(i)||!macros[i])continue;const c=contexts[i],direction=c.getWorldDirection(new T.Vector3()),target=c.position.clone().addScaledVector(direction,Math.max(1800,c.position.length()*.65));r.evaluate(steps[i].start+.5);const box=new T.Box3();for(const[id,o]of r.r.registry.entries())if(id.startsWith('part-')&&o.visible)box.union(new T.Box3().setFromObject(o));if(!box.isEmpty())target.copy(box.getCenter(new T.Vector3()));const distance=Math.max(c.position.distanceTo(target),1800);c.position.copy(target).addScaledVector(macros[i]!.getWorldDirection(new T.Vector3()),-distance);c.lookAt(target);c.updateMatrixWorld(true);}
 const p1End=fromV2(125),p1EndView=r.source.camera(125,false).clone(),p2Entry=r.camera(184,false).clone(),finalWide=r.camera(229,true).clone();
 const s04Left=r.camera(42,false).clone(),s04Right=r.camera(56,false).clone();
 const view=(position:[number,number,number],target:[number,number,number],fov=28)=>{const c=new T.PerspectiveCamera(fov,1280/720,.1,20000);c.position.set(...position);c.lookAt(new T.Vector3(...target));c.updateMatrixWorld(true);return c;};
 const upperPose=view([180,840,760],[0,724,320]),lowerPose=view([-180,200,760],[0,74,320]),heldPads=view([1000,270,850],[773,112,350],30);
 r.evaluate(0);
 function regular(t:number){
  const index=Math.max(0,steps.findIndex(s=>t>=s.start&&t<s.end));
  if(t>=229){
   if(t<230.25)return mix(finalWide,upperPose,t,229,230.25);
   if(t<238)return upperPose.clone();
   if(t<240)return mix(upperPose,lowerPose,t,238,240);
   if(t<247)return lowerPose.clone();
   if(t<249)return mix(lowerPose,finalWide,t,247,249);
   if(t<262)return finalWide.clone();
   if(t<263)return mix(finalWide,heldPads,t,262,263);
   if(t<266.5)return heldPads.clone();
   if(t<268)return mix(heldPads,finalWide,t,266.5,268);
   return finalWide.clone();
  }
  const s=steps[index],context=contexts[index],first=firsts[index],macro=macros[index];
  if(t<s.start+2.5&&index>0)return mix(contexts[index-1],context,t,s.start,s.start+2.5);
  if(!first||!macro)return context.clone();
  const enter=Math.max(first.start-.15,s.start+2.5),arrive=enter+.95;
  if(t<enter)return context.clone();
  if(t<arrive)return mix(context,macro,t,enter,arrive);
  if(t<first.end)return macro.clone();
  if(t<first.end+1)return mix(macro,context,t,first.end,first.end+1);
  return context.clone();
 }
 function camera(time:number){
  const t=Math.max(0,Math.min(278,time)),source=toV2(t);
  if(source>=106.5&&source<125)return p1Camera(r.source,source);
  if(t>=p1End&&t<p1End+1.5)return mix(p1EndView,contexts[7],t,p1End,p1End+1.5);
  if(t>=183&&t<184)return mix(regular(183),p2Entry,t,183,184);
  if(t>=184&&t<229)return p2p3Camera(r,t);
  if(t>=41&&t<69){
   if(t<42.5)return mix(contexts[2],s04Left,t,41,42.5);
   if(t<53.5)return s04Left.clone();
   if(t<54.75)return mix(s04Left,contexts[3],t,53.5,54.75);
   if(t<55)return contexts[3].clone();
   if(t<56.25)return mix(contexts[3],s04Right,t,55,56.25);
   if(t<68)return s04Right.clone();
   return mix(s04Right,contexts[3],t,68,69);
  }
  return regular(t);
 }
 return{camera,contexts,contract:{duration:278,P1:'Accepted P1 camera at mapped source time; extra1.5-second postbuffer to S08 context',P2P3:'Accepted camera unchanged over accepted N; prebuffer183–184',otherSteps:'Fixed step context; teach first threaded connection in macro, repetitions in context; controlled step transitions',S04:'Same accepted geometry/poses; new wide bridges for side change',finish:'Canonical static source with mandatory POSE-ONLY/HOLD labels; no new function'}};
}
