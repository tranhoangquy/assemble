import * as T from 'three';
import type {createRuntime} from '../s04-integration-v2/runtime';
type Runtime=ReturnType<typeof createRuntime>;
type View={position:[number,number,number];target:[number,number,number];fov:number};
const wide:View={position:[-1700,1500,2700],target:[200,480,220],fov:35};
const feet:View={position:[0,-100,650],target:[860,20,328],fov:35};
const rail:View={position:[-1444,300,450],target:[-594,80,0],fov:28};
const corner:View={position:[-1400,360,-750],target:[-594,150,-282],fov:28};
const make=(v:View)=>{const c=new T.PerspectiveCamera(v.fov,1280/720,.1,20000);c.position.set(...v.position);c.lookAt(new T.Vector3(...v.target));c.updateMatrixWorld(true);return c;};
const blend=(a:T.PerspectiveCamera,b:T.PerspectiveCamera,t:number,start:number,end:number)=>{
 const u=T.MathUtils.smootherstep(t,start,end),c=new T.PerspectiveCamera(T.MathUtils.lerp(a.fov,b.fov,u),a.aspect,.1,20000);
 c.position.copy(a.position).lerp(b.position,u);c.quaternion.copy(a.quaternion).slerp(b.quaternion,u);c.updateProjectionMatrix();c.updateMatrixWorld(true);return c;
};
/** Product-owned camera trial only. Frozen V2 is evaluated at the same absolute
 * timestamp; no geometry, visibility, material, tool or timeline mutation.
 * Static display-space targets are current model composition, not OEM geometry. */
export function p1Camera(r:Runtime,time:number){
 const original=r.camera(time,false);if(time<106.5||time>=125)return original;
 if(time<108)return blend(original,make(feet),time,106.5,108);
 if(time<110.9)return make(feet);
 if(time<112)return blend(make(feet),make(wide),time,110.9,112);
 if(time<117.5)return make(wide);
 if(time<118.75)return blend(make(wide),make(rail),time,117.5,118.75);
 if(time<122.4)return make(rail);
 if(time<123.4)return blend(make(rail),make(corner),time,122.4,123.4);
 if(time<124.5)return make(corner);
 // Exit buffer belongs to the camera trial, not an assembly/timing change.
 return blend(make(corner),original,time,124.5,125);
}
export const p1CameraContract={id:'PRODUCT03-P1-CAMERA-ONLY-PILOT-V1',source:'S04_INTEGRATION_V2',sourceTime:'identity',proof:[108,124],cameraOnlyEntryBuffer:[106.5,108],cameraOnlyExitBuffer:[124,125],graphics:'unchanged',timing:'unchanged',geometry:'unchanged',views:{wide,feet,rail,corner}};
