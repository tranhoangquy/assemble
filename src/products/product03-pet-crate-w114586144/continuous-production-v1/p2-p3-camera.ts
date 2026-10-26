import * as T from 'three';
import type {createRuntime} from './option-n-runtime';
import {hardware} from './option-n-runtime';
import {placements} from '../s04-integration-v2/timeline';
type Runtime=ReturnType<typeof createRuntime>;
const make=(position:T.Vector3,target:T.Vector3,fov=35)=>{const c=new T.PerspectiveCamera(fov,1280/720,.1,20000);c.position.copy(position);c.lookAt(target);c.updateMatrixWorld(true);return c;};
const wide=()=>make(new T.Vector3(-1700,1400,2700),new T.Vector3(100,480,150));
const frontWide=()=>make(new T.Vector3(-600,950,1950),new T.Vector3(0,480,150));
const blend=(a:T.PerspectiveCamera,b:T.PerspectiveCamera,t:number,start:number,end:number)=>{const u=T.MathUtils.smootherstep(t,start,end),c=new T.PerspectiveCamera(T.MathUtils.lerp(a.fov,b.fov,u),1280/720,.1,20000);c.position.copy(a.position).lerp(b.position,u);c.quaternion.copy(a.quaternion).slerp(b.quaternion,u);c.updateProjectionMatrix();c.updateMatrixWorld(true);return c;};
function macro(r:Runtime,id:string,side=60,height=35,distance=330,fov=28){const p=placements.find(p=>p.id===id)!,n=new T.Vector3(...p.outward!).transformDirection(r.rig.matrixWorld),lateral=new T.Vector3().crossVectors(n,new T.Vector3(0,1,0)).normalize(),target=new T.Vector3(...p.position).applyMatrix4(r.rig.matrixWorld).addScaledVector(n,20);return make(target.clone().addScaledVector(n,distance).addScaledVector(lateral,side).add(new T.Vector3(0,height,0)),target,fov);}
function leaf(side:-1|1,upper:boolean){const target=new T.Vector3(side*581,upper?623:177,316.5);return make(target.clone().add(new T.Vector3(side*100,55,400)),target,28);}
/** Camera-only comparison over accepted Option N. No pose/timing/geometry edits. */
export function p2p3Camera(r:Runtime,time:number){
 const original=r.camera(time,false),w=wide();
 if(time<184||time>=229)return original;
 if(time<185)return blend(original,w,time,184,185);
 if(time<186.75)return w;
 if(time<187.5)return blend(w,macro(r,'hardware-C-12'),time,186.75,187.5);
 if(time<188.25)return macro(r,'hardware-C-12');
 if(time<189.25)return blend(macro(r,'hardware-C-12'),w,time,188.25,189.25);
 if(time<192.25)return w;
 if(time<193.5)return blend(w,macro(r,'hardware-C-13',-400,35,240,26),time,192.25,193.5);
 const c13end=hardware.find(h=>h.id==='hardware-C-13')!.end;
 if(time<c13end)return macro(r,'hardware-C-13',-400,35,240,26);
 if(time<c13end+1.25)return blend(macro(r,'hardware-C-13',-400,35,240,26),w,time,c13end,c13end+1.25);
 if(time<207.15)return w;
 if(time<208.5)return blend(w,frontWide(),time,207.15,208.5);
 if(time<210.5)return frontWide(); // includes upright return, floor, and first-door contact
 if(time<211.25)return blend(frontWide(),leaf(-1,false),time,210.5,211.25);
 if(time<214.8251)return leaf(-1,false);
 if(time<215.3251)return blend(leaf(-1,false),leaf(-1,true),time,214.8251,215.3251);
 if(time<217.6952)return leaf(-1,true);
 if(time<218.1952)return blend(leaf(-1,true),frontWide(),time,217.6952,218.1952);
 if(time<220.1952)return frontWide();
 if(time<220.9452)return blend(frontWide(),leaf(1,false),time,220.1952,220.9452);
 if(time<224.5203)return leaf(1,false);
 if(time<225.0203)return blend(leaf(1,false),leaf(1,true),time,224.5203,225.0203);
 if(time<227.3904)return leaf(1,true);
 if(time<227.8904)return blend(leaf(1,true),frontWide(),time,227.3904,227.8904);
 if(time<228)return frontWide();
 return blend(frontWide(),original,time,228,229);
}
export const cameraContract={id:'PRODUCT03-P2-P3-CAMERA-ONLY-CORRECTION-V1',timing:'Accepted OptionN unchanged',geometry:'unchanged',graphics:'unchanged',proofs:[[185,208.5],[208.5,228]],entryBuffer:[184,185],exitBuffer:[228,229],repeats:'C14–18 remain in contextual wide; no new claim of individual macro review',leafCameras:'One fixed camera per E1/2 E3/4 E5/6 E7/8; door transitions through wide'};
