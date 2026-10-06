import type {PartDefinition,ProductDefinition,Vector3Tuple,FaceBore} from '@/types/product';
import {step02PacedProduct} from './parts-step02';
export const step03Motion={frameStageX:14,secondSideOutboardX:36,firstSideInnerX:-116.5,secondSideInnerX:116.5} as const;
const estimate={source:'mechanically_inferred' as const,confidence:'medium' as const,note:'PDF page 10 controls parts, quantities and topology. Unprinted beam sizes, centers, receiver clearances and tab/slot envelopes are proportional estimates, not manufacturing dimensions.'};
export const frameRails=[{id:'E3',y:3,z:18},{id:'B9',y:3,z:-18},{id:'D5',y:55,z:18}];
export const parts:PartDefinition[]=structuredClone(step02PacedProduct.parts);
const mount=[{id:'mount',position:[0,0,0] as Vector3Tuple,normal:[0,0,1] as Vector3Tuple,kind:'mount' as const}];
export const joints=frameRails.flatMap(rail=>[-1,1].map(side=>({rail,side,id:`S3-${rail.id}-${side}`,host:side<0?(rail.z>0?'A1':'A3'):(rail.z>0?'A4':'A2')})));

// Existing side members gain only the PDF Step 3 receiver bores needed for axial mating.
// Do not mutate the approved standalone Step 1/2 packages or their material objects.
for(const part of parts){
  if(part.type!=='mesh'||part.geometry.type!=='bored-panel')continue;
  const row=joints.filter(j=>j.host===part.id);
  if(!row.length)continue;
  const right=part.id==='A2'||part.id==='A4';
  part.geometry.faceBores=row.flatMap(j=>[-1.2,1.2].map(offset=>({axis:'y' as const,position:[right?112.5-j.rail.y-offset:j.rail.y+offset-112.5,0,0] as Vector3Tuple,radius:offset<0?0.35:0.42})));
}
for(const rail of frameRails){
  const faceBores:FaceBore[]=[-1,1].flatMap(side=>[{axis:'x' as const,position:[0,-1.2,0] as Vector3Tuple,radius:0.35,face:side<0?'negative' as const:'positive' as const,depth:6},{axis:'x' as const,position:[0,1.2,0] as Vector3Tuple,radius:0.42,face:side<0?'negative' as const:'positive' as const,depth:1.6}]);
  if(rail.id!=='B9')faceBores.push({axis:'y',position:[0,0,0],radius:1.3,face:rail.id==='E3'?'positive':'negative',depth:1.1});
  parts.push({id:rail.id,name:`${rail.id} — PDF Step 3 spanning rail`,type:'mesh',geometry:{type:'bored-panel',boreAxis:'z',size:[233,6,3],holes:[-113.3,113.3].map(x=>({x,z:1.2,radius:0.8})),faceBores},position:[0,rail.y,rail.z],material:'oak-x',category:'cabinet',visible:false,evidence:estimate,connectionPoints:mount});
}
parts.push({id:'E4',name:'E4 — lower center connector with end tongues',type:'mesh',geometry:{type:'tabbed-stile',size:[5,46,3],tabWidth:2,tabHeight:1,tabDepth:1.2},position:[0,29,18],material:'oak-y',category:'cabinet',visible:false,evidence:estimate,connectionPoints:mount});
for(const j of joints){
  const {side,rail,id}=j;
  parts.push({id:`${id}-dowel`,name:'#6 Ø8 ×30 mm wood dowel',type:'mesh',geometry:{type:'fluted-dowel',radius:0.4,height:3},position:[side*116.5,rail.y+1.2,rail.z],rotation:[0,0,-side*90],material:'dowel',category:'hardware',visible:false,evidence:{source:'dimension_label',confidence:'high',note:'PDF #6 Ø8 ×30 mm.'}});
  parts.push({id:`${id}-cam`,name:'#8 horizontal-hole cam',type:'mesh',geometry:{type:'horizontal-cam',radius:0.75,height:1.1},position:[side*113.3,rail.y-1.2,rail.z+1],rotation:[90,0,0],material:'zinc',category:'hardware',visible:false,evidence:estimate});
  parts.push({id:`${id}-bolt`,name:'#4 1/4 inch ×70 mm bolt',type:'mesh',geometry:{type:'socket-bolt',radius:0.3175,height:7},position:[side*116,rail.y-1.2,rail.z],rotation:[0,0,-side*90],material:'zinc',category:'hardware',visible:false,evidence:{source:'dimension_label',confidence:'high',note:'PDF #4 1/4 inch ×70 mm; head and thread envelope estimated.'}});
}

export const step03CorrectedProduct:ProductDefinition={...step02PacedProduct,name:'WF311613 Standalone Murphy Bed — corrected Steps 1–3 checkpoint',parts,materials:{...step02PacedProduct.materials,'oak-y':{...step02PacedProduct.materials['oak-x'],grainAxis:'y'}}};
