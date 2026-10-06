import * as THREE from 'three';
import type {FaceBore,GeometryDefinition,MeshPartDefinition,PartDefinition,ProductDefinition,Vector3Tuple} from '@/types/product';
import {steps01To10Product as prefix} from './parts-step04-10';

export const bed={width:232,length:204,z:260,workLift:30,base:6,railThickness:3,railWidth:7.6,
  railX:[-112.2,-56.1,0,56.1,112.2],endZ:98.2,openEnd:94.4,
  panelWidth:49.7,panelLength:91.8,panelY:6.8,panelDepth:1.2,
  carrierX:112.7,carrierEndZ:97.9,carrierInnerX:111.2,carrierInnerZ:96.4,
  carrierHeight:12,carrierY:15,slatY:9.9,slatLength:222.4,slatZ:[-84,-42,0,42,84],
  carrierPark:[300,0,0] as Vector3Tuple} as const;
export const estimatedBedGeometry={source:'mechanically_inferred' as const,confidence:'medium' as const,
  note:'PDF pages 17–21 establish parts, quantities, grooves, topology and layer order. Unprinted timber dimensions, integral tongues, hole coordinates and work-area offsets are proportional mechanical reconstruction, not manufacturer precision.'};
export const parts11To20:PartDefinition[]=structuredClone(prefix.parts);
export const addedParts:MeshPartDefinition[]=[];
export const introductionStep=new Map<string,number>();
const mount=[{id:'mount',position:[0,0,0] as Vector3Tuple,normal:[0,1,0] as Vector3Tuple,kind:'mount' as const}];
export function part(id:string,step:number,geometry:GeometryDefinition,position:Vector3Tuple,material='oak-z',rotation:Vector3Tuple=[0,0,0],hardwareNumber?:number){
  const p:MeshPartDefinition={id,name:hardwareNumber?`#${hardwareNumber} — PDF Step ${step}`:`${id.split('-')[0]} — PDF Step ${step}`,type:'mesh',visible:false,geometry,position,rotation,material,category:hardwareNumber?'hardware':'bed',evidence:estimatedBedGeometry,connectionPoints:mount,subassembly:step<=15?'bed-face':'bed-carrier'};
  parts11To20.push(p);addedParts.push(p);introductionStep.set(id,step);return p;
}
export const pos=(id:string)=>parts11To20.find(p=>p.id===id)!.position;
export function world(local:Vector3Tuple):Vector3Tuple{return[local[0],local[1]+bed.workLift,bed.z+local[2]];}
const railIds=['C2-left','C4-left','C5','C4-right','C2-right'];
export const faceRailIds=railIds;
export const faceGridWood=['C1-start',...railIds,...Array.from({length:4},(_,i)=>`C3-${i}`),...Array.from({length:4},(_,i)=>[`C6-${i}-first`,`C6-${i}-second`]).flat(),...Array.from({length:3},(_,i)=>`C7-${i}`),'C1-close'];
export const carrierWood=['C8-left','C8-right','C9','D1'];
export const newWoodIds=[...faceGridWood,...carrierWood,...Array.from({length:5},(_,i)=>`D2-${i}`)];
export const faceJoints=railIds.flatMap((rail,i)=>[
  {id:`S${i===1?11:i===2||i===3?12:14}-${rail}`,step:i===1?11:i===2||i===3?12:14,rail,x:bed.railX[i],end:-1},
  {id:`S15-${rail}`,step:15,rail,x:bed.railX[i],end:1},
]);
export const carrierCorners=[-1,1].flatMap(side=>[-1,1].map(end=>({id:`S16-${side}-${end}`,side,end,host:end<0?'C9':'D1',rail:side<0?'C8-left':'C8-right'})));
export const matingJoints=[-1,1].flatMap(side=>[-55,55].map(z=>({id:`S17-side-${side}-${z}`,host:side<0?'C2-left':'C2-right',carrier:side<0?'C8-left':'C8-right',bolt:world([side*(bed.carrierInnerX+.8),9,z]),dowel:world([side*bed.carrierX,9,z<0?-32:32]),cam:world([side*(bed.carrierInnerX+.65),11.6,z]),normal:[-side,0,0] as Vector3Tuple})))
  .concat([-1,1].flatMap(end=>[-80,80].map(x=>({id:`S17-end-${end}-${x}`,host:end<0?'C1-start':'C1-close',carrier:end<0?'C9':'D1',bolt:world([x,9,end*97.2]),dowel:world([x<0?-60:60,9,end*97.9]),cam:world([x,11.6,end*97.05]),normal:[0,0,-end] as Vector3Tuple}))));
export const brackets=[...[-65,-25,25,65].map((z,i)=>({id:`S18-H20-${i}`,step:18,position:world([-bed.carrierInnerX,9,z]),rotation:[0,0,0] as Vector3Tuple,host:'C8-left',support:'C2-left'})),...[-56.1,56.1].map((x,i)=>({id:`S18-H20-${i+4}`,step:18,position:world([x,9,96.4]),rotation:[0,90,0] as Vector3Tuple,host:'D1',support:'C1-close'})),
  ...[-65,-25,25,65].map((z,i)=>({id:`S19-H20-${i}`,step:19,position:world([bed.carrierInnerX,9,z]),rotation:[0,180,0] as Vector3Tuple,host:'C8-right',support:'C2-right'})),...[-56.1,56.1].map((x,i)=>({id:`S19-H20-${i+4}`,step:19,position:world([x,9,-96.4]),rotation:[0,-90,0] as Vector3Tuple,host:'C9',support:'C1-start'}))];
export function transformed(local:Vector3Tuple,origin:Vector3Tuple,rotation:Vector3Tuple):Vector3Tuple{return new THREE.Vector3(...local).applyEuler(new THREE.Euler(...rotation.map(a=>a*Math.PI/180) as Vector3Tuple)).add(new THREE.Vector3(...origin)).toArray() as Vector3Tuple;}
const axisRotation=(normal:Vector3Tuple):Vector3Tuple=>{const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...normal));const e=new THREE.Euler().setFromQuaternion(q);return[e.x,e.y,e.z].map(x=>x*180/Math.PI) as Vector3Tuple;};
export const hardwareSpecs=new Map<string,{number:number;host:string;normal:Vector3Tuple;kind:'installBolt'|'installDowel'|'installNut'|'installScrew';length:number;mates:string[]}>();
function hardware(id:string,step:number,n:number,host:string,p:Vector3Tuple,normal:Vector3Tuple,length:number,mates:string[]=[],kind:'installBolt'|'installDowel'|'installNut'|'installScrew'='installBolt'){
  const geometry:GeometryDefinition=kind==='installDowel'?{type:'fluted-dowel',radius:.4,height:3}:kind==='installNut'?{type:'horizontal-cam',radius:.75,height:1.3}:kind==='installScrew'?{type:'screw',radius:n===12?.3175:.2,length,headRadius:n===12?.6:.38,headHeight:.16,threaded:true}:{type:'socket-bolt',radius:.3175,height:length};
  const h=part(id,step,geometry,p,kind==='installDowel'?'dowel':'zinc',axisRotation(normal),n);
  h.evidence={source:'dimension_label',confidence:'high',note:`PDF hardware #${n}; specified length ${length*10} mm. Head/thread/bore clearances are estimated.`};
  hardwareSpecs.set(id,{number:n,host,normal,kind,length,mates});return h;
}
function routed(width:number,length:number,axis:'x'|'z',bores:FaceBore[]=[],oneSide?:number):GeometryDefinition{
  // Side channels are actual solid profiles. C6 slides axially into these
  // channels, below the exposed rail face, and rests on the channel floor.
  const a=width/2,b=a-.7,lo=-1.3,hi=0;
  const points:[number,number][]=[[-a,-1.5],[a,-1.5],...(oneSide===-1?[[a,1.5] as [number,number]]:[[a,lo],[b,lo],[b,hi],[a,hi],[a,1.5]] as [number,number][]),[-a,1.5],...(oneSide===1?[]:[[-a,hi],[-b,hi],[-b,lo],[-a,lo]] as [number,number][])];
  return {type:'profile-prism',points:axis==='x'?points.map(([x,y])=>[y,x]):points,depth:length,axis,size:axis==='x'?[length,3,width]:[width,3,length],faceBores:bores,preserveEndProfile:true};
}
function pilotOn(id:string,p:Vector3Tuple,axis:'x'|'y'|'z',radius:number,face:'positive'|'negative'|'both'='both',depth?:number):FaceBore{
  const base=pos(id);return{axis,position:p.map((v,i)=>v-base[i]) as Vector3Tuple,radius,face,depth};
}
// First register the timber poses, then reconstruct receiver profiles from the
// same hardware coordinates. No separate black disks or fake hole meshes.
for(const [i,id]of railIds.entries())part(id,i===1?11:i===2||i===3?12:14,{type:'box',size:[7.6,3,188.8]},world([bed.railX[i],7.5,0]));
for(const end of [-1,1])part(end<0?'C1-start':'C1-close',end<0?11:15,{type:'box',size:[232,3,7.6]},world([0,7.5,end*98.2]),'oak-x');
for(const [i,x]of [-84.15,-28.05,28.05,84.15].entries()){
  part(`C3-${i}`,i===1||i===2?12:14,{type:'box',size:[48.5,3,7.6]},world([x,7.5,0]),'oak-x');
  for(const half of ['first','second'])part(`C6-${i}-${half}`,half==='second'?15:i===1||i===2?12:14,{type:'box',size:[49.7,1.2,91.8],bevel:.025},world([x,6.8,half==='first'?-49.1:49.1]),'oak-z');
}
for(const [i,z]of [-62.8,0,62.8].entries()){
  const points:[number,number][]=[[-3.2,-1.5],[-1.2,-1.5],[-1.2,-.7],[1.2,-.7],[1.2,-1.5],[3.2,-1.5],[3.2,1.5],[-3.2,1.5]];
  const bores:FaceBore[]=[-15,15].map(d=>({axis:'y',position:[0,0,d],radius:.35,face:'positive',depth:1.2}));
  part(`C7-${i}`,13,{type:'profile-prism',points,depth:60,axis:'z',size:[6.4,3,60],faceBores:bores},world([0,4.5,z]));
  for(const [j,d]of [-15,15].entries())hardware(`S13-H12-${i}-${j}`,13,12,'C5',world([0,7.16,z+d]),[0,1,0],4,[`C7-${i}`],'installScrew');
}
for(const j of faceJoints){
  hardware(`${j.id}-cam`,j.step,8,j.rail,world([j.x,8.45,j.end*90.2]),[0,1,0],1.3,[],'installNut');
  hardware(`${j.id}-bolt`,j.step,22,j.end<0?'C1-start':'C1-close',world([j.x,8.2,j.end*96]),[0,0,j.end],12,[j.rail,`${j.id}-cam`]);
}
// Support slats are on the exposed mattress-facing (+Y) side.
for(const [i,z]of bed.slatZ.entries()){
  const xs=[-110,-56.1,0,56.1,110],bores:FaceBore[]=xs.map(x=>({axis:'y',position:[x,0,0],radius:.22}));
  part(`D2-${i}`,20,{type:'bored-panel',size:[bed.slatLength,1.8,4],bevel:0,holes:[],faceBores:bores},world([0,9.9,z]),'oak-x');
  for(const [j,x]of xs.entries())hardware(`S20-H16-${i}-${j}`,20,16,`D2-${i}`,world([x,9.46,z]),[0,1,0],3,[railIds[j]],'installScrew');
}
// Four carrier timbers remain separate from the face grid until Step 17.
for(const side of [-1,1])part(side<0?'C8-left':'C8-right',16,{type:'bored-panel',size:[3,12,192.8],bevel:0,holes:[]},world([side*bed.carrierX,15,0]));
for(const end of [-1,1])part(end<0?'C9':'D1',16,{type:'bored-panel',size:[2*(bed.carrierX+1.5),12,3],bevel:0,holes:[]},world([0,15,end*97.9]),'oak-x');
for(const j of carrierCorners){
  for(const [i,y]of [12,18].entries())hardware(`${j.id}-dowel-${i}`,16,6,j.rail,world([j.side*bed.carrierX,y,j.end*96.4]),[0,0,j.end],3,[j.host],'installDowel');
  hardware(`${j.id}-cam`,16,8,j.rail,world([j.side*(bed.carrierInnerX+.65),15,j.end*93.4]),[-j.side,0,0],1.3,[],'installNut');
  hardware(`${j.id}-bolt`,16,3,j.host,world([j.side*(bed.carrierInnerX+.8),15,j.end*96.4]),[0,0,j.end],6,[j.rail,`${j.id}-cam`]);
}
for(const j of matingJoints){
  hardware(`${j.id}-dowel`,17,6,j.host,j.dowel,[0,1,0],3,[j.carrier],'installDowel');
  hardware(`${j.id}-cam`,17,8,j.carrier,j.cam,j.normal,1.3,[],'installNut');
  hardware(`${j.id}-bolt`,17,3,j.host,j.bolt,[0,-1,0],6,[j.carrier,`${j.id}-cam`]);
}
export const carrierMembers=[...carrierWood,...addedParts.filter(p=>introductionStep.get(p.id)===16&&p.category==='hardware').map(p=>p.id)];
const bracketGeometry:GeometryDefinition={type:'compound',size:[1.7,3.16,4],pieces:[
  {geometry:{type:'profile-prism',points:[[-1.5,-2],[1.5,-2],[1.5,2],[-1.5,2]],holes:[{x:.34,y:-1.1,radius:.24},{x:.34,y:1.1,radius:.24}],axis:'x',depth:.16},position:[.08,1.66,0]},
  {geometry:{type:'profile-prism',points:[[-.85,-2],[.85,-2],[.85,2],[-.85,2]],holes:[{x:0,y:-1.1,radius:.24},{x:0,y:1.1,radius:.24}],axis:'y',depth:.16},position:[.85,.08,0]},
]};
for(const b of brackets){
  part(b.id,b.step,bracketGeometry,b.position,'zinc',b.rotation,20);
  for(const [i,z]of [-1.1,1.1].entries()){
    const normal=new THREE.Vector3(1,0,0).applyEuler(new THREE.Euler(...b.rotation.map(x=>x*Math.PI/180) as Vector3Tuple)).toArray() as Vector3Tuple;
    hardware(`${b.id}-H14-v${i}`,b.step,14,b.id,transformed([-.43,2,z],b.position,b.rotation),normal,1.5,[b.host],'installScrew');
    hardware(`${b.id}-H14-h${i}`,b.step,14,b.id,transformed([.85,-.43,z],b.position,b.rotation),[0,1,0],1.5,[b.support],'installScrew');
  }
}
// Integral C3 tongues and rail-end tongues stay part of their physical timber.
for(const p of addedParts.filter(p=>railIds.includes(p.id)||p.id.startsWith('C1-')||p.id.startsWith('C3-'))){
  const horizontal=p.id.startsWith('C1-')||p.id.startsWith('C3-'),size=horizontal?(p.id.startsWith('C1-')?232:48.5):188.8;
  const bores:FaceBore[]=[];
  for(const j of faceJoints){
    if(j.rail===p.id){bores.push(pilotOn(p.id,world([j.x,8.45,j.end*90.2]),'y',.8,'positive',1.3),pilotOn(p.id,world([j.x,8.2,0]),'z',.36));}
    if(p.id===(j.end<0?'C1-start':'C1-close'))bores.push(pilotOn(p.id,world([j.x,8.2,j.end*98.2]),'z',.36));
  }
  for(const [id,h]of hardwareSpecs){
    if(h.kind==='installScrew'&&(h.host===p.id||h.mates.includes(p.id))&&h.normal[1]===1)bores.push(pilotOn(p.id,pos(id),'y',h.number===12?.35:.22,h.number===12?'both':'positive',3));
  }
  for(const j of matingJoints)if(j.host===p.id){bores.push(pilotOn(p.id,j.bolt,'y',.36),pilotOn(p.id,j.dowel,'y',.42));}
  const direction=p.id==='C1-start'?1:p.id==='C1-close'?-1:undefined;
  const body=routed(7.6,size,horizontal?'x':'z',bores,direction);
  const tongues=railIds.includes(p.id)?[-1,1].map(end=>({geometry:{type:'box',size:[2,1.2,.6]} as GeometryDefinition,position:[0,-.7,end*94.7] as Vector3Tuple})):p.id.startsWith('C3-')?[-1,1].map(side=>({geometry:{type:'box',size:[.6,1.2,2]} as GeometryDefinition,position:[side*24.55,-.7,0] as Vector3Tuple})):[];
  p.geometry=tongues.length?{type:'compound',size:horizontal?[49.7,3,7.6]:[7.6,3,190],pieces:[{geometry:body},...tongues]}:body;
}
for(const p of addedParts.filter(p=>carrierWood.includes(p.id))){
  if(p.geometry.type!=='bored-panel')throw new Error('Missing carrier timber');
  const bores:FaceBore[]=[];
  for(const j of carrierCorners){
    if(j.rail===p.id){bores.push(pilotOn(p.id,pos(`${j.id}-cam`),'x',.8,j.side<0?'positive':'negative',1.4),pilotOn(p.id,pos(`${j.id}-bolt`),'z',.36));for(const i of [0,1])bores.push(pilotOn(p.id,pos(`${j.id}-dowel-${i}`),'z',.42));}
    if(j.host===p.id){bores.push(pilotOn(p.id,pos(`${j.id}-bolt`),'z',.36));for(const i of [0,1])bores.push(pilotOn(p.id,pos(`${j.id}-dowel-${i}`),'z',.42));}
  }
  for(const j of matingJoints)if(j.carrier===p.id){const axis=j.normal[0]?'x':'z',side=(j.normal[0]||j.normal[2])>0?'positive':'negative';bores.push(pilotOn(p.id,j.cam,axis,.8,side,1.4),pilotOn(p.id,j.bolt,'y',.36,'negative',3.5),pilotOn(p.id,j.dowel,'y',.42,'negative',1.5));}
  for(const b of brackets.filter(b=>b.host===p.id))for(const i of [0,1]){const h=hardwareSpecs.get(`${b.id}-H14-v${i}`)!,axis=Math.abs(h.normal[0])>.5?'x':'z';bores.push(pilotOn(p.id,pos(`${b.id}-H14-v${i}`),axis,.22,(axis==='x'?h.normal[0]:h.normal[2])>0?'positive':'negative',1.3));}
  p.geometry.faceBores=bores;
}
export const steps01To20Product:ProductDefinition={...prefix,id:'wf311613-steps01-20-paced-product',name:'WF311613 Standalone Murphy Bed — PDF Steps 1–20',parts:parts11To20,sourceNote:`${prefix.sourceNote} ${estimatedBedGeometry.note}`};
