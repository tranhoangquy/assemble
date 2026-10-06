import type { PartDefinition, Vector3Tuple } from '@/types/product';
import {step01V2Product as step01PacedProduct} from './parts-step01';
// Reflect the work-surface X axis, rather than reusing the first side's handedness.
// The second independent work area remains clear of the completed first assembly.
const offset=0;
export const names:Record<string,string>={A1:'A2',A3:'A4',A5:'A6',A7:'A7-R',A8:'A8-R',A9:'A9-R'};
export const mapped=(id:string)=>names[id]??`R-${id}`;
export const point=(p:Vector3Tuple):Vector3Tuple=>[offset-p[0],p[1],p[2]];
export const direction=(p:Vector3Tuple):Vector3Tuple=>[-p[0],p[1],p[2]];

export const mirroredSideParts:PartDefinition[]=step01PacedProduct.parts.map(p=>{
  const clone=structuredClone(p);
  clone.id=mapped(p.id);clone.position=point(p.position);
  clone.name=p.name.replace(/A1|A3|A5|A7|A8|A9/g,id=>names[id].replace('-R',''));
  if(clone.connectionPoints)clone.connectionPoints=clone.connectionPoints.map(c=>({...c,position:direction(c.position),normal:direction(c.normal)}));
  if(clone.type==='mesh'&&clone.geometry.type==='bored-panel'){
    clone.geometry.holes=clone.geometry.holes.map(h=>({...h,x:-h.x}));
    clone.geometry.edgeBores=clone.geometry.edgeBores?.map(h=>({...h,x:-h.x}));
  }
  return clone;
});
export const step02PacedProduct={...step01PacedProduct,name:'WF311613 Standalone Murphy Bed — paced Steps 1–2 checkpoint',parts:[...step01PacedProduct.parts,...mirroredSideParts]};
