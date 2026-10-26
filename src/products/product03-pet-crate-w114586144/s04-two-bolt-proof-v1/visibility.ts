import * as T from 'three';
import {writeFileSync} from 'node:fs';
import {createProof,groups,timing} from './proof';
const p=createProof(),rows=[];
for(const side of groups){const level=side==='left'?1:2;for(const[index,event]of [timing.first,timing.second].entries()){
 const id=`hardware-B-${level*2-1+index}`;
 for(const stage of ['bolt-introduction','key-introduction','key-withdrawal']as const){
  const u=stage==='bolt-introduction'?0:stage==='key-introduction'?.35:.99-1e-8,time=event.start+u*(event.end-event.start),state=p.evaluate(side,time),actor=p.r.registry.require(stage==='bolt-introduction'?id:'hardware-L-1'),camera=p.camera(side),bounds=new T.Box3();
  actor.traverse(o=>{if(o instanceof T.Mesh){const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++)bounds.expandByPoint(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).project(camera));}});
  rows.push({side,stage,time,id:actor.name,visible:actor.visible,ndcMin:bounds.min.toArray(),ndcMax:bounds.max.toArray(),outside:bounds.max.x< -1||bounds.min.x>1||bounds.max.y< -1||bounds.min.y>1||bounds.max.z< -1||bounds.min.z>1,clippingPlanes:state.clippingPlanes});
 }
}}
writeFileSync(new URL('../../../../output/product03-pet-crate-w114586144/s04-two-bolt-proof-v1/VISIBILITY-BOUNDARIES.json',import.meta.url),JSON.stringify({method:'All actual mesh vertices projected through fixed shot camera at show/hide boundaries. Outside one complete clipping half-space establishes offscreen visibility transition.',rows},null,2));console.log(JSON.stringify(rows,null,2));
