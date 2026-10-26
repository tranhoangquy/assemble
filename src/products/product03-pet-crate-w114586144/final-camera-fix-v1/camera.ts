import * as T from 'three';
import {createFilmCamera as prior} from '../continuous-production-v2-r2/full-camera';
import type {createRuntime} from '../human-3-image-correction-v1/runtime';
type Runtime=ReturnType<typeof createRuntime>;
export const window={start:197.25,arrive:198.35,operationStart:198.42228571428572,operationEnd:199.83657142857143,end:200.65};
function blend(a:T.PerspectiveCamera,b:T.PerspectiveCamera,u:number){
 const x=T.MathUtils.smootherstep(u,0,1),c=a.clone();c.position.lerpVectors(a.position,b.position,x);c.quaternion.copy(a.quaternion).slerp(b.quaternion,x);c.fov=T.MathUtils.lerp(a.fov,b.fov,x);c.userData.wideWeight=T.MathUtils.lerp(a.userData.wideWeight??0,b.userData.wideWeight??0,x);c.updateProjectionMatrix();c.updateMatrixWorld(true);return c;
}
/** Camera-only human C16 correction. No source pose/clock/visibility mutations. */
export function createFilmCamera(r:Runtime){const baseline=prior(r);
 const close=new T.PerspectiveCamera(38,1280/720,.1,20000);close.position.set(540,1090,-1250);close.lookAt(new T.Vector3(350,922,-420));close.userData.wideWeight=0;close.updateMatrixWorld(true);
 function camera(t:number){const old=baseline.camera(t);if(t<window.start||t>=window.end)return old;if(t<window.arrive)return blend(old,close,(t-window.start)/(window.arrive-window.start));if(t<window.operationEnd)return close.clone();return blend(close,old,(t-window.operationEnd)/(window.end-window.operationEnd));}
 return {...baseline,camera,contract:{...baseline.contract,revision:'FINAL-CAMERA-FIX-V1',scope:window,actorEdits:false}};
}
