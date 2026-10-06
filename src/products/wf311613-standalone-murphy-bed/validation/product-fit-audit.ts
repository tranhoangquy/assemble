import * as THREE from 'three';
import {createFullRuntime} from './full-validation';
import {polish02Plan,polish02Showcase} from '../director/polish-pass02';

/** Actual generated solids at the regression frame and both mechanism endpoints.
 * Float32 comparison only; no changed collision/installation tolerances. */
export function auditProductFit(){
 const plan=structuredClone(polish02Plan);
 plan.steps[30].shots.push(...polish02Showcase.map(s=>({id:s.id,type:'VERIFY_CONNECTION' as const,duration:s.duration,camera:s.camera,actions:s.actions})));
 const rt=createFullRuntime(true,plan),errors:string[]=[],contacts:{state:string;a:string;b:string;gap:number}[]=[];
 const states=[['regression-467',462],['assembled',498.25],['closed',504.5],['open',511.8]] as const;
 try {for(const [state,time]of states){rt.engine.seek(time);rt.root.updateMatrixWorld(true);
 const bounds=(id:string)=>new THREE.Box3().setFromObject(rt.registry.require(id));
 for(const [a,b]of [['A5','B2-left'],['A6','B2-right'],['A8','A9'],['A9','A7'],['A8-R','A9-R'],['A9-R','A7-R'],['A7','A5'],['A7-R','A6']]){
  const gap=bounds(b).min.y-bounds(a).max.y;contacts.push({state,a,b,gap});if(Math.abs(gap)>1e-4)errors.push(`${state}: ${a}/${b} gap ${gap} cm`);
 }
 // Actual wall anchoring contacts and minimum threaded penetration.
 const wall=bounds('installation-wall');
 if(state!=='regression-467')for(const side of [-1,1])for(const i of [0,1]){
  const id=`S${side<0?30:31}-H15-${i}`,bracket=rt.registry.require(id),post=bounds(side<0?'A1':'A4');
  const center=bracket.getWorldPosition(new THREE.Vector3());
  const timberGap=Math.abs(center.x)-.1-(side<0?-post.min.x:post.max.x),wallGap=wall.min.z-(center.z+3.1);
  if(Math.abs(timberGap)>1e-4||Math.abs(wallGap)>1e-4)errors.push(`${state}: ${id} floating mount ${timberGap}/${wallGap}`);
  for(const k of [0,1]){
   const screw=rt.registry.require(`${id}-H14-${k}`).getWorldPosition(new THREE.Vector3());
   const embed=(side<0?-post.min.x:post.max.x)-(Math.abs(screw.x)-.75);
   if(embed<1||screw.y<post.min.y||screw.y>post.max.y||screw.z<post.min.z||screw.z>post.max.z)errors.push(`${state}: ${id} has no adequate post engagement`);
  }
 }
 // Side-board edge contact, cabinet posts and the spanning rails.
 for(const [panel,left,right]of [['A5','A1','A3'],['A6','A4','A2'],['A9','A1','A3'],['A9-R','A4','A2']]){
  const p=bounds(panel),f=bounds(left),r=bounds(right);
  for(const gap of [f.min.z-p.max.z,p.min.z-r.max.z])if(Math.abs(gap)>1e-4)errors.push(`${state}: ${panel} side seam ${gap}`);
 }
 // The C6 infills remain captured by their ORIGINAL routed frame. Check
 // relative matrices in both endpoints, not world AABBs after folding.
 const root=rt.registry.require('bed-motion-root'),inverse=root.matrixWorld.clone().invert();
 for(let i=0;i<4;i++)for(const half of ['first','second']){
  const id=`C6-${i}-${half}`,o=rt.registry.require(id),local=new THREE.Vector3().setFromMatrixPosition(inverse.clone().multiply(o.matrixWorld));
  const expected=[[-84.15,-28.05,28.05,84.15][i],36.8,260+(half==='first'?-49.1:49.1)];
  if(local.distanceTo(new THREE.Vector3(expected[0],expected[1],expected[2]))>1e-4)errors.push(`${state}: ${id} drifts from its routed frame`);
 }
 }
 return {valid:errors.length===0,errors,contacts,states:states.map(([state,time])=>({state,globalTime:time+5})),numericTolerance:1e-4};
 }finally{rt.dispose();}
}
