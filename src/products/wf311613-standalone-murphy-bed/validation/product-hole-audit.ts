import * as THREE from 'three';
import type {GeometryDefinition,Vector3Tuple,MeshPartDefinition} from '@/types/product';
import {createFullRuntime} from './full-validation';
import {fullProduct} from '../product/parts-step21-31';
import {polish02Plan} from '../director/polish-pass02';
export type HoleCategory='REQUIRED_CONNECTION'|'REQUIRED_HARDWARE'|'REQUIRED_PIVOT'|'REQUIRED_BEARING'|'REQUIRED_PISTON'|'REQUIRED_LEG'|'REQUIRED_WALL_ANCHOR'|'REQUIRED_CAM_DOWEL'|'ASSEMBLY_ACCESS'|'STRUCTURALLY_JUSTIFIED_UNUSED'|'UNJUSTIFIED';
export interface HoleAuditRow {id:string;variant:string;feature:string;local:Vector3Tuple;axis:string;radius:number;face:string;depth?:number;world:number[];match?:{id:string;parallel:number;distance:number};category:HoleCategory;reason:string;}
export function auditProductHoles(){
const r=createFullRuntime(false,polish02Plan);r.engine.seek(r.duration-.001);r.root.updateMatrixWorld(true);
const hw=fullProduct.parts.filter((p):p is MeshPartDefinition=>p.category==='hardware'&&p.type==='mesh').map(p=>{const o=r.registry.require(p.id);return{id:p.id,pos:o.getWorldPosition(new THREE.Vector3()),axis:new THREE.Vector3(p.geometry.type==='profile-prism'?1:0,p.geometry.type==='profile-prism'?0:1,0).transformDirection(o.matrixWorld),p};});
const rows:HoleAuditRow[]=[];
function visit(g:GeometryDefinition,m:THREE.Matrix4,id:string,path:string){
 if(g.type==='compound'){g.pieces.forEach((p,i)=>{const t=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...(p.rotation??[0,0,0]).map(n=>n*Math.PI/180) as Vector3Tuple));t.setPosition(new THREE.Vector3(...(p.position??[0,0,0])));visit(p.geometry,m.clone().multiply(t),id,path+'.pieces.'+i);});return;}
 function add(pos:Vector3Tuple,axis:string,radius:number,feature:string,face?:string,depth?:number){
 const point=new THREE.Vector3(...pos).applyMatrix4(m),normal=new THREE.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0).transformDirection(m);
 const matches=hw.map(h=>({id:h.id,parallel:Math.abs(h.axis.dot(normal)),distance:point.clone().sub(h.pos).cross(normal).length()})).filter(h=>h.parallel>0.99999).sort((a,b)=>a.distance-b.distance);
 const hit=matches[0];
 const tongue=['E3','D5','D4-1','D4-2','B5'].includes(id)&&axis==='y'&&pos.every(v=>v===0);
 const unjustifiedOpposite=radius===.8&&(!face||face==='both')&&fullProduct.parts.some(p=>p.id===id&&p.type==='mesh'&&p.material.startsWith('oak'));
 const category:HoleCategory=unjustifiedOpposite?'UNJUSTIFIED':tongue?'REQUIRED_CONNECTION':hit&&hit.distance<1e-4?(id.includes('H19')?'REQUIRED_BEARING':id.startsWith('E2')?'REQUIRED_PISTON':hit.id.startsWith('S29')?'REQUIRED_PIVOT':id.startsWith('D7')&&feature.startsWith('holes')?'REQUIRED_LEG':(id.includes('H15')||hit.id.includes('H15'))?'REQUIRED_WALL_ANCHOR':radius===.8||radius===.42?'REQUIRED_CAM_DOWEL':'REQUIRED_HARDWARE'):'UNJUSTIFIED';
 rows.push({id,variant:path,feature,local:pos,axis,radius,face:face??'both',depth,world:point.toArray(),match:hit,category,reason:tongue?'PDF Steps 3–6: integral E4/B7 end tongue receiver':category==='UNJUSTIFIED'?unjustifiedOpposite?'Cam well has an unoccupied opposite opening':'No joint axis matches this feature':`Coaxial hardware ${hit.id}; PDF assembly operation retained`});}
 if(g.type==='bored-panel'){g.holes.forEach((h,i)=>add(g.boreAxis==='z'?[h.x,-h.z,0]:[h.x,0,h.z],g.boreAxis==='z'?'z':'y',h.radius,'holes.'+i));(g.edgeBores??[]).forEach((h,i)=>add([h.x,0,0],'z',h.radius,'edgeBores.'+i));}
 if(g.type==='profile-prism')(g.holes??[]).forEach((h,i)=>add(g.axis==='x'?[0,h.x,h.y]:g.axis==='y'?[h.x,0,-h.y]:[h.x,h.y,0],g.axis??'z',h.radius,'holes.'+i));
 if(g.type==='bored-panel'||g.type==='profile-prism')(g.faceBores??[]).forEach((h,i)=>add(h.position,h.axis,h.radius,'faceBores.'+i,h.face,h.depth));
 if(g.type==='horizontal-cam'||g.type==='socket-bolt')rows.push({id,variant:path,feature:g.type==='horizontal-cam'?'driver-slot':'hex-socket',local:[0,0,0],axis:'y',radius:g.radius,face:'positive',world:new THREE.Vector3().applyMatrix4(m).toArray(),category:'ASSEMBLY_ACCESS',reason:'Required cam/bolt driver access; not an empty timber opening'});
}
for(const p of fullProduct.parts)if(p.type==='mesh'){const m=r.registry.require(p.id).matrixWorld;visit(p.geometry,m,p.id,'baseline');for(const [name,g]of Object.entries(p.geometryVariants??{}))visit(g,m,p.id,name);}
const errors=rows.filter(r=>r.category==='UNJUSTIFIED').map(r=>`${r.id}.${r.variant}.${r.feature}: ${r.reason}`);r.dispose();return {valid:errors.length===0,errors,rows,counts:Object.fromEntries([...new Set(rows.map(r=>r.category))].map(c=>[c,rows.filter(r=>r.category===c).length]))};
}
