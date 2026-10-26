import * as T from 'three';
import type {createRuntime} from '../continuous-production-v1/option-n-runtime';
import {steps,hardware} from '../continuous-production-v1/option-n-runtime';
import {fromV2,toV2} from '../continuous-production-v1/option-n-clock';
import {p1Camera} from '../continuous-production-v1/p1-camera';
import {p2p3Camera} from '../continuous-production-v1/p2-p3-camera';
type Runtime=ReturnType<typeof createRuntime>;
function focus(c:T.PerspectiveCamera){if(c.userData.focus)return new T.Vector3(...c.userData.focus);const n=c.getWorldDirection(new T.Vector3()),center=new T.Vector3(0,450,150);return c.position.clone().addScaledVector(n,Math.max(200,center.sub(c.position).dot(n)));}
/** Camera orbit in display space, with one coherent look-at focus. No product
 * trajectory or source state is modified. Radius stays exterior to both views. */
const mix=(a:T.PerspectiveCamera,b:T.PerspectiveCamera,t:number,start:number,end:number)=>{
 const u=T.MathUtils.smootherstep(t,start,end),ta=focus(a),tb=focus(b),target=ta.clone().lerp(tb,u),sa=new T.Spherical().setFromVector3(a.position.clone().sub(ta)),sb=new T.Spherical().setFromVector3(b.position.clone().sub(tb));
 let delta=sb.theta-sa.theta;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
 const v=new T.Spherical(T.MathUtils.lerp(sa.radius,sb.radius,u),T.MathUtils.lerp(sa.phi,sb.phi,u),sa.theta+delta*u),c=new T.PerspectiveCamera(T.MathUtils.lerp(a.fov,b.fov,u),1280/720,.1,20000);
 c.position.copy(target).add(new T.Vector3().setFromSpherical(v));c.lookAt(target);c.userData.focus=target.toArray();c.userData.wideWeight=T.MathUtils.lerp(a.userData.wideWeight??0,b.userData.wideWeight??0,u);c.updateProjectionMatrix();c.updateMatrixWorld(true);return c;
};
/** Authored step camera track. Camera snapshots are prepared once from source;
 * evaluation remains absolute and restores canonical source after preparation. */
export function createFilmCamera(r:Runtime){
 const contexts=steps.map(s=>{const c=r.camera(s.end-.01,true).clone();c.userData.focus=focus(c).toArray();c.userData.wideWeight=1;return c;});
 // Stable post-inversion context: never sample a transitional 112.5s pose.
 const stable=new T.PerspectiveCamera(35,1280/720,.1,20000);stable.position.set(-1700,1500,2700);stable.lookAt(new T.Vector3(200,480,220));stable.userData.focus=[200,480,220];stable.userData.wideWeight=1;stable.updateMatrixWorld(true);contexts[7]=stable;
 const firsts=steps.map(s=>hardware.find(h=>h.step===s.number&&h.kind==='threaded'));
 const macros=firsts.map(h=>h?r.camera(h.start+(h.end-h.start)*.5,false).clone():null);
 const p1End=fromV2(124.5),p1EndView=p1Camera(r.source,124.49).clone(),p2Entry=r.camera(184,false).clone(),finalWide=r.camera(229,true).clone();
 const s04Left=r.camera(42,false).clone(),s04Right=r.camera(56,false).clone();
 const view=(position:[number,number,number],target:[number,number,number],fov=28)=>{const c=new T.PerspectiveCamera(fov,1280/720,.1,20000);c.position.set(...position);c.lookAt(new T.Vector3(...target));c.userData.focus=target;c.userData.wideWeight=0;c.updateMatrixWorld(true);return c;};
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
  if(source>=106.5&&source<124.5)return p1Camera(r.source,source);
  if(t>=p1End&&t<p1End+2.5)return mix(p1EndView,contexts[7],t,p1End,p1End+2.5);
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
 return{camera,contexts,contract:{duration:278,P1:'Accepted P1 camera at mapped source time; new2.5-second coherent exit to stable S08 context',P2P3:'Accepted camera unchanged over accepted N; prebuffer183–184',otherSteps:'Fixed step context; teach first threaded connection in macro, repetitions in context; controlled step transitions',S04:'Same accepted geometry/poses; new wide bridges for side change',finish:'Canonical static source with mandatory POSE-ONLY/HOLD labels; no new function'}};
}
