import * as T from 'three';import type {createRuntime} from '../continuous-production-v1/option-n-runtime';import type {evaluateEdit} from './edit';
type R=ReturnType<typeof createRuntime>;
const v=(a:number[])=>new T.Vector3(...a as [number,number,number]);
function make(position:number[],target:number[],fov=38){const c=new T.PerspectiveCamera(fov,1080/1920,.1,20000);c.position.copy(v(position));c.lookAt(v(target));c.userData.target=target;c.updateMatrixWorld(true);return c;}
export function createShortCamera(r:R){
 function fit(time:number,ids?:string[],direction=[-.7,.35,1],margin=1.12){r.evaluate(time);const box=new T.Box3();for(const[id,o]of r.r.registry.entries())if(id.startsWith('part-')&&o.visible&&(!ids||ids.includes(id)))box.union(new T.Box3().setFromObject(o));const center=box.getCenter(new T.Vector3()),dir=v(direction).normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),dir).normalize(),up=new T.Vector3().crossVectors(dir,right).normalize();let width=0,height=0,depth=0;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).sub(center);width=Math.max(width,Math.abs(p.dot(right))*2);height=Math.max(height,Math.abs(p.dot(up))*2);depth=Math.max(depth,Math.abs(p.dot(dir)));}const distance=Math.max(width/(2*Math.tan(T.MathUtils.degToRad(19))*(1080/1920)*.82),height/(2*Math.tan(T.MathUtils.degToRad(19))*.62))*margin+depth;return make(center.clone().addScaledVector(dir,distance).toArray(),center.toArray());}
 const upper=fit(4.25,undefined,[-.8,.4,1]),dividers=fit(22,undefined,[-.6,.5,1]),top=fit(33.5,undefined,[-.6,.8,1]);
 const hero=fit(272,undefined,[1,.2,.18],1),sides=fit(113.45,undefined,[-.7,.25,-1]),left=fit(115.5,['part-1-1','part-10-1'],[-1,.2,-.65]),right=fit(117.5,['part-2-1','part-10-2'],[1,.2,-.65]);
 const frame5=fit(190,undefined,[-.7,.35,1]),floor=fit(207.15,['part-14-1','part-1-1','part-2-1'],[.2,.3,1]),doors=fit(220.2,['part-1-1','part-2-1','part-7-1','part-8-1','part-14-1'],[.1,.15,1],1);
 const d1=make([-1576,1020,300],[-576,800,-60],24),kb=make([65,654,592],[-175,894,220],28),feet=make([0,-100,650],[860,20,328],35),hinge=make([-751,277,1266.5],[-581,177,316.5],24),upperPose=make([160,804,1220],[0,724,320],28),lowerPose=make([-200,204,1220],[0,74,320],28),pads=make([973,272,1000],[773,112,350],22);
 r.evaluate(0);
 function camera(edit:ReturnType<typeof evaluateEdit>){const id=edit.shot.id;let c:T.PerspectiveCamera;
  if(id==='preview'||id==='hero')c=hero;
  else if(id==='first-joint')c=edit.sourceTime<4.3?upper:d1;
  else if(id==='dividers')c=dividers;else if(id==='top')c=top;else if(id==='two-bolts')c=kb;else if(id==='feet')c=feet;
  else if(id==='sides')c=edit.sourceTime<113.5?sides:edit.sourceTime<115.5?left:right;
  else if(id==='frame5')c=frame5;else if(id==='floor')c=floor;else if(id==='door1'||id==='door2')c=doors;
  else if(id==='hinge-pair')c=hinge;else if(id==='upper-pose')c=upperPose;else if(id==='lower-pose')c=lowerPose;else c=pads;
  const result=c.clone();result.setViewOffset(1080,1920,35,160,1080,1920);result.updateProjectionMatrix();result.updateMatrixWorld(true);return result;
 }
 return{camera,contract:'Nativeportrait fitted contexts and fixed interface macros; deliberate instructional cuts; source unchanged; no moving parts for framing'};
}
