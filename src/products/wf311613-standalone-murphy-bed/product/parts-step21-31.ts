import {standingPose} from '../assembly/installationPaths';
import {correctProductFitAndHoles} from './fit-hole-correction';
import * as THREE from 'three';
import type {FaceBore,GeometryDefinition,MeshPartDefinition,PartDefinition,ProductDefinition,Vector3Tuple} from '@/types/product';
import {steps01To20Product as prefix,addedParts as bedParts} from './parts-step11-20';
import {correctReceiverReconstruction,reconstructedPivot} from './mechanism-reconstruction';
import {armGeometry,correctFootCorners,legReconstruction,uprightGeometry} from './foot-corner-reconstruction';

export const mechanism={sourcePivot:[0,reconstructedPivot.bedSourceY,reconstructedPivot.bedSourceZ] as Vector3Tuple,cabinetPivot:[0,reconstructedPivot.cabinetY,reconstructedPivot.cabinetZ] as Vector3Tuple,
  bearingX:115.95,bodyLength:33,freeLength:92,legPivot:[0,legReconstruction.pivotY,legReconstruction.pivotZ] as Vector3Tuple,legX:legReconstruction.x} as const;
export const estimates21To31={source:'mechanically_inferred' as const,confidence:'medium' as const,
  note:'PDF pages 22–30 define components, fastener dimensions, quantities and topology. E1 plate envelope/stud separation, spindle/bearing fit, E2 stroke, leg profiles/half-laps, pivot and wall-bracket coordinates are proportional mechanical reconstruction, NOT manufacturer-certified dimensions or load simulation.'};
export const parts31:PartDefinition[]=structuredClone(prefix.parts);
correctReceiverReconstruction(parts31);
correctFootCorners(parts31);
export const bedMembers=bedParts.map(p=>p.id);
parts31.push({id:'bed-motion-root',name:'Complete rigid bed assembly (transform only)',type:'group',position:[0,0,0],visible:true,connectionPoints:[{id:'mount',position:[0,0,0],normal:[0,1,0]}]});
for(const p of parts31)if(bedMembers.includes(p.id))p.parent='bed-motion-root';
export const added21To31:PartDefinition[]=[];
const mount=[{id:'mount',position:[0,0,0] as Vector3Tuple,normal:[1,0,0] as Vector3Tuple}];
function add(p:PartDefinition){parts31.push(p);added21To31.push(p);return p;}
function mesh(id:string,name:string,g:GeometryDefinition,position:Vector3Tuple,material='zinc',parent?:string,rotation:Vector3Tuple=[0,0,0],category:PartDefinition['category']='hardware'){
  return add({id,name,type:'mesh',geometry:g,position,rotation,material,parent,visible:false,category,evidence:estimates21To31,connectionPoints:mount}) as MeshPartDefinition;
}
const circle=(radius:number):[number,number][]=>Array.from({length:64},(_,i)=>[Math.cos(i*Math.PI/32)*radius,Math.sin(i*Math.PI/32)*radius]);
export const ring=(outer:number,inner:number,depth:number):GeometryDefinition=>({type:'profile-prism',axis:'x',depth,points:circle(outer),holes:[{x:0,y:0,radius:inner}]});
const axisRotation=(normal:Vector3Tuple):Vector3Tuple=>{const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...normal));const e=new THREE.Euler().setFromQuaternion(q);return[e.x,e.y,e.z].map(x=>x*180/Math.PI) as Vector3Tuple;};
export const hardware31=new Map<string,{number:number;host:string;normal:Vector3Tuple;length:number;kind:'installScrew'|'installBolt'|'installNut'|'installDowel'|'installWasher';mates:string[]}>();
function hw(id:string,n:number,host:string,p:Vector3Tuple,normal:Vector3Tuple,length:number,kind:'installScrew'|'installBolt'|'installNut'|'installDowel'|'installWasher',parent?:string,mates:string[]=[]){
  let g:GeometryDefinition;
  if(kind==='installDowel')g={type:'fluted-dowel',radius:.4,height:length};
  else if(kind==='installNut')g=n===9?{type:'compound',size:[length+.15,1.3,1.3],pieces:[
    {geometry:ring(.55,.37,length)},
    {geometry:ring(.65,.37,.15),position:[normal[0]*(length/2+.075),0,0]},
  ]}:{type:'profile-prism',axis:'x',depth:length,points:Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3)*.62,Math.sin(i*Math.PI/3)*.62]),holes:[{x:0,y:0,radius:.35}]};
  else if(kind==='installWasher')g=ring(1,.37,.2);
  else if(kind==='installScrew')g={type:'screw',radius:.2,length,headRadius:.4,headHeight:.15,threaded:true};
  else g={type:'socket-bolt',radius:n===18?(2.54/6):.3175,height:length};
  // Ring/profile axes are X; fastener/dowel factory axes are Y.
  const rot=kind==='installNut'||kind==='installWasher'?axisRotation(normal).map((v,i)=>v+(i===2?-90:0)) as Vector3Tuple:axisRotation(normal);
  const part=mesh(id,`PDF #${n}${n===10?' WHITE PLASTIC washer':n===18?' 1/3 inch ×40 mm retaining bolt':''}`,g,p,n===10?'white-plastic':kind==='installDowel'?'dowel':'zinc',parent,rot);
  // Profiles already have an X bore: use identity for X normals. Axial spin is invariant under sign.
  if(kind==='installNut'||kind==='installWasher')part.rotation=Math.abs(normal[0])===1?[0,0,0]:[0,90,0];
  part.evidence=n===17?{source:'mechanically_inferred',confidence:'medium',note:'PDF #17 nut identity/count retained. Nut thickness, inner modeled thread clearance and visual hex envelope are estimated.'}:
    {source:'dimension_label',confidence:'high',note:`PDF #${n}, specified length/thickness ${length*10} mm; visual head/thread clearances estimated.${n===10?' Nominal PDF bore Ø6 mm; the rendered bore is relieved to 7.4 mm for the illustrative threaded bolt envelope, not a manufacturer tolerance.':''}`};
  hardware31.set(id,{number:n,host,normal,length,kind,mates});return part;
}
export const sideIds=(side:number)=>({e1:`E1-${side}`,bearing:`S${side<0?23:24}-H19`,piston:`E2-${side}`,bedNut:`S${side<0?23:24}-H17`,cabNut:`S${side<0?26:27}-H17`,cab:side<0?'D8':'D9',leg:`leg-${side}`});
// The last pair stays clear of the installed longitudinal Step 16 dowels.
// Generated-mesh proof: >=5 mm clearance over approach/feed/rotation.
export const e1Holes=[-11,-6,1,9].flatMap(z=>[-2.6,2.6].map(y=>[y,z] as [number,number]));
export const bedAnchor=(side:number):Vector3Tuple=>[side*115.1,45,354];
export const cabAnchor=(side:number):Vector3Tuple=>[side*115.4,110,9.5];
export const legAnchor=(side:number):Vector3Tuple=>[side*mechanism.legX,45,mechanism.legPivot[2]];
export function worldBedPoint(p:Vector3Tuple,angle:number,pivot:Vector3Tuple=mechanism.cabinetPivot):Vector3Tuple{
  return new THREE.Vector3(...p).sub(new THREE.Vector3(...mechanism.sourcePivot)).applyAxisAngle(new THREE.Vector3(1,0,0),angle*Math.PI/180).add(new THREE.Vector3(...pivot)).toArray() as Vector3Tuple;
}
for(const side of [-1,1]){
  const s=sideIds(side),step=side<0?21:22,host=side<0?'C8-left':'C8-right';
  const plate:GeometryDefinition={type:'profile-prism',axis:'x',depth:.3,points:[[-4,-13],[4,-13],[4,13],[-4,13]],holes:e1Holes.map(([y,z])=>({x:y,y:z,radius:.23}))};
  mesh(s.e1,'E1 — one integral mechanism plate with bearing spindle and piston stud',{type:'compound',size:[2.4,8,26],pieces:[
    {geometry:plate},
    {geometry:ring(.65,.50,1.75),position:[side*1.025,0,-5]},
    {geometry:{type:'screw',radius:.30,length:1.6,headRadius:.30,headHeight:.04,threaded:true},position:[side*.95,0,9],rotation:[0,0,-side*90]},
  ]},[side*114.35,45,345],'zinc','bed-motion-root');
  for(const [i,[y,z]]of e1Holes.entries())hw(`S${step}-H21-${i}`,21,s.e1,[side*113.65,45+y,345+z],[side,0,0],2,'installScrew','bed-motion-root',[host]);
  const p=parts31.find(p=>p.id===host) as MeshPartDefinition,base=structuredClone(p.geometry);
  if(base.type!=='bored-panel')throw new Error('Carrier receiver missing');
  base.faceBores=[...(base.faceBores??[]),...e1Holes.map(([y,z])=>({axis:'x' as const,position:[0,y,85+z] as Vector3Tuple,radius:.16,face:side>0?'positive' as const:'negative' as const,depth:1.6})),{axis:'x',position:[0,0,mechanism.legPivot[2]-260],radius:.36}];
  p.geometryVariants={...p.geometryVariants,mechanismReceivers:base};
  mesh(s.bearing,'#19 radial bearing — inner race, outer race, sealed center',{type:'compound',size:[.75,4,4],pieces:[
    {geometry:ring(2,1.55,.75)},{geometry:ring(1.02,.66,.75)},
    {geometry:ring(1.55,1.02,.62)},
  ]},[side*mechanism.bearingX,45,mechanism.sourcePivot[2]],'zinc','bed-motion-root');
  add({id:s.piston,name:'E2 — PDF 750 N gas piston (one physical component)',type:'group',position:bedAnchor(side),visible:false,evidence:estimates21To31,connectionPoints:mount});
  const body=mesh(`${s.piston}-body`,'E2 cylinder housing',{type:'cylinder',radius:.72,height:31},[0,17.5,0],'mechanism-dark',s.piston);
  const rod=mesh(`${s.piston}-rod`,'E2 telescoping rod',{type:'cylinder',radius:.28,height:1},[0,(mechanism.freeLength+mechanism.bodyLength)/2,0],'zinc',s.piston);
  const neck=mesh(`${s.piston}-neck`,'E2 integral bed-eye neck',{type:'cylinder',radius:.28,height:1.3},[0,1.35,0],'zinc',s.piston);
  const eyeA=mesh(`${s.piston}-eyeA`,'E2 bed-side eye',ring(.7,.35,.55),[0,0,0],'zinc',s.piston);
  const eyeB=mesh(`${s.piston}-eyeB`,'E2 cabinet-side eye',ring(.7,.35,.55),[0,mechanism.freeLength,0],'zinc',s.piston);
  body.visible=rod.visible=neck.visible=eyeA.visible=eyeB.visible=true;rod.scale=[1,mechanism.freeLength-mechanism.bodyLength,1];
  hw(s.bedNut,17,s.e1,[side*115.72,45,354],[side,0,0],.55,'installNut','bed-motion-root',[s.piston]);
  hw(`S25-H18-${side}`,18,s.cab,[side*116.65,mechanism.cabinetPivot[1],mechanism.cabinetPivot[2]],[side,0,0],4,'installBolt',undefined,[s.bearing,side<0?'A9':'A9-R']);
  hw(s.cabNut,17,s.cab,[side*114.85,110,9.5],[-side,0,0],.55,'installNut',undefined,[s.piston]);
  // Genuine later-step integration additions only: invisible until Step 25.
  const d=parts31.find(p=>p.id===s.cab) as MeshPartDefinition;
  d.geometryVariants={...d.geometryVariants,mechanismStud:{type:'compound',size:[2.4,80.5,24],pieces:[{geometry:structuredClone(d.geometry)},
    {geometry:{type:'screw',radius:.3,length:2.0,headRadius:.3,headHeight:.04,threaded:true},position:[-side*1.1,30,9.5],rotation:[0,0,side*90]}]}};
  // At the corrected height the retainer passes through the REAL lower A9
  // infill, not an out-of-bounds hole declared on the A5/A6 upper panel.
  const a=parts31.find(p=>p.id===(side<0?'A9':'A9-R')) as MeshPartDefinition;
  if(a.geometry.type!=='box')throw new Error('Expected unchanged A9 lower infill');
  // The extrusion bevel would otherwise grow this locked infill envelope.
  // Preserve its dimensions exactly while adding the actual through-aperture.
  const g:GeometryDefinition={type:'bored-panel',size:[...a.geometry.size],bevel:0,holes:[],faceBores:[{axis:'y',position:[side<0?mechanism.cabinetPivot[1]-27.5:27.5-mechanism.cabinetPivot[1],0,side<0?-mechanism.cabinetPivot[2]:mechanism.cabinetPivot[2]],radius:.50}]};
  a.geometryVariants={...a.geometryVariants,pivotReceiver:g};
}

// Both separate legs are assembled at their eventual OPEN pose plus a work-area offset.
export const legPark:Vector3Tuple=[180,0,-255];
export const legTimber:string[]=[];
export const legHardware:string[]=[];
for(const side of [-1,1]){
  const s=sideIds(side),x=side*mechanism.legX;
  add({id:s.leg,name:'Complete folding-leg subassembly (transform only)',type:'group',parent:'bed-motion-root',position:[0,0,0],visible:true,connectionPoints:mount});
  const {upperY,lowerY,joinZ,upperReach,lowerReach}=legReconstruction,centerY=(upperY+lowerY)/2;
  // PDF p27: D3 is FOOTWARD of the pivot; both rounded D6/D7 arms point
  // HEADWARD. Opposite X half-laps make the two legs genuinely handed.
  const d3=mesh(`D3-${side}`,'D3 stepped leg upright',uprightGeometry(side),[x,centerY,joinZ],'oak-y',s.leg,[0,0,0],'bed');legTimber.push(d3.id);
  for(const [label,y]of [['D7',upperY],['D6',lowerY]] as const){
    const bars=mesh(`${label}-${side}`,`${label} rounded ${label==='D7'?'pivot arm':'foot'}`,armGeometry(side,label==='D7'?upperReach:lowerReach,label==='D7'),[x,y,joinZ],'oak-z',s.leg,[0,0,0],'bed');legTimber.push(bars.id);
    for(const [i,dy]of [-.85,.85].entries()){
      const joint=[x,y+dy,joinZ] as Vector3Tuple;
      hw(`S28-${side}-${label}-H7-${i}`,7,bars.id,joint,[side,0,0],2,'installDowel',s.leg,[d3.id]);
      hw(`S28-${side}-${label}-H9-${i}`,9,bars.id,[x+side*.25,y+dy,joinZ+1.4],[side,0,0],1.5,'installNut',s.leg,[d3.id]);
      hw(`S28-${side}-${label}-H1-${i}`,1,d3.id,[x-side*.025,y+dy,joinZ+1.4],[-side,0,0],2,'installBolt',s.leg,[bars.id,`S28-${side}-${label}-H9-${i}`]);
      legHardware.push(`S28-${side}-${label}-H7-${i}`,`S28-${side}-${label}-H9-${i}`,`S28-${side}-${label}-H1-${i}`);
    }
  }
  // All receiving holes share their axes with the animated physical hardware.
  for(const id of [`D3-${side}`,`D6-${side}`,`D7-${side}`]){
    const p=parts31.find(p=>p.id===id) as MeshPartDefinition;
    const holes:FaceBore[]=[];
    for(const [hid,h]of hardware31)if(h.host===id||h.mates.includes(id)){const hp=parts31.find(q=>q.id===hid)!;holes.push({axis:'x',position:hp.position.map((v,i)=>v-p.position[i]) as Vector3Tuple,radius:h.number===7?.42:h.number===9?.57:.38});}
    const geometry=p.geometry as Extract<GeometryDefinition,{type:'compound'}>;
    for(const piece of geometry.pieces){const local=holes.map(h=>({...h,position:h.position.map((v,i)=>v-(piece.position?.[i]??0)) as Vector3Tuple}));
      // The #2 head recess exists only in the OUTER half, not as a second
      // blind counterbore cut into the inner half of the compound arm.
      if(id===`D7-${side}`&&piece.position?.[0]===side*.5)local.push({axis:'x',position:[0,0,upperReach],radius:.70,face:side>0?'positive':'negative',depth:.8});
      if(piece.geometry.type==='box')piece.geometry={type:'bored-panel',size:piece.geometry.size,bevel:0,holes:[],faceBores:local};
      else if(piece.geometry.type==='profile-prism')piece.geometry.faceBores=local;
    }
  }
  // Installed canopies are physical children of their arms. This preserves
  // their exact seated pose throughout ALL three phases of the arm path;
  // independent linear hardware moves would drift through the lap joint.
  for(const label of ['D6','D7'])for(const i of [0,1]){
    const insert=parts31.find(p=>p.id===`S28-${side}-${label}-H9-${i}`)!;
    const arm=parts31.find(p=>p.id===`${label}-${side}`)!;
    insert.parent=arm.id;insert.position=insert.position.map((v,j)=>v-arm.position[j]) as Vector3Tuple;
  }
  hw(`S29-${side}-H10`,10,side<0?'C8-left':'C8-right',[side*114.3,45,mechanism.legPivot[2]],[side,0,0],.2,'installWasher','bed-motion-root',[`D7-${side}`]);
  hw(`S29-${side}-H9`,9,side<0?'C8-left':'C8-right',[side*111.95,45,mechanism.legPivot[2]],[-side,0,0],1.5,'installNut','bed-motion-root');
  // Socket-head bevel extends 0.025 cm below its nominal underside. Place
  // that REAL underside flush at the 115.6-cm counterbore floor.
  hw(`S29-${side}-H2`,2,`D7-${side}`,[side*113.625,45,mechanism.legPivot[2]],[side,0,0],4,'installBolt','bed-motion-root',[side<0?'C8-left':'C8-right',`S29-${side}-H9`,`S29-${side}-H10`]);
  const carrier=parts31.find(p=>p.id===(side<0?'C8-left':'C8-right')) as MeshPartDefinition;
  const receiver=carrier.geometryVariants!.mechanismReceivers;
  if(receiver.type==='bored-panel')receiver.faceBores!.push({axis:'x',position:[0,0,mechanism.legPivot[2]-260],radius:.57,face:side<0?'positive':'negative',depth:1.55});
}

export const wallBrackets:string[]=[];
for(const side of [-1,1])for(const [i,y]of [208,32].entries()){
  const step=side<0?30:31,id=`S${step}-H15-${i}`,x=side*119.6,z=17.6;
  const plate:GeometryDefinition={type:'compound',size:[4.8,6,6.2],pieces:[
    {geometry:{type:'profile-prism',axis:'x',depth:.2,points:[[-3,-3],[3,-3],[3,3],[-3,3]],holes:[{x:-1.5,y:-1.5,radius:.22},{x:1.5,y:-1.5,radius:.22}]},position:[0,0,0]},
    {geometry:{type:'profile-prism',axis:'z',depth:.2,points:[[0,-3],[side*4.8,-3],[side*4.8,3],[0,3]],holes:[{x:side*2.4,y:0,radius:.22}]},position:[0,0,3]},
  ]};
  mesh(id,'#15 bent wall angle — cabinet and wall faces',plate,[x,y,z]);wallBrackets.push(id);
  for(const [k,dy]of [-1.5,1.5].entries())hw(`${id}-H14-${k}`,14,id,[x-side*.5,y+dy,z-1.5],[side,0,0],1.5,'installScrew',undefined,[side<0?'A1':'A4']);
  hw(`${id}-H23`,23,id,[x+side*2.4,y,z+4.75],[0,0,-1],4,'installScrew');
}
// PDF Steps 30/31: both heights mount onto the full-thickness rear posts,
// not the thin A9 infill. Pilots use the same #14 screw axis as the bracket.
for(const side of [-1,1]){
 const post=parts31.find(p=>p.id===(side<0?'A1':'A4')) as MeshPartDefinition;
 const pose=standingPose(post,side>0);
 const inverse=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...pose.rotation.map(v=>v*Math.PI/180) as Vector3Tuple));
 inverse.setPosition(new THREE.Vector3(...pose.position));inverse.invert();
 const pilots:FaceBore[]=[...hardware31].filter(([,h])=>h.number===14&&h.mates.includes(post.id)).map(([id,h])=>{
  const fastener=parts31.find(p=>p.id===id)!,point=new THREE.Vector3(...fastener.position).applyMatrix4(inverse);
  const normal=new THREE.Vector3(...h.normal).transformDirection(inverse);
  return {axis:'y',position:[point.x,0,point.z],radius:.16,face:normal.y>0?'positive':'negative',depth:1.3};
 });
 const append=(g:GeometryDefinition)=>{if(g.type!=='bored-panel')throw Error('Wall anchor needs a real post');g.faceBores=[...(g.faceBores??[]),...structuredClone(pilots)];};
 append(post.geometry);for(const g of Object.values(post.geometryVariants??{}))append(g);
}
// Context only, deliberately no engineered substrate, studs or invented anchors.
mesh('installation-wall','Neutral installation wall (context, not a product component)',{type:'box',size:[360,290,1]},[0,140,21.2],'wall-context',undefined,[0,0,0],'cabinet');
correctProductFitAndHoles(parts31);
export const fullProduct:ProductDefinition={...prefix,id:'wf311613-full-assembly-product',name:'WF311613 Standalone Murphy Bed — Option 1 · PDF Steps 1–31',parts:parts31,
  sourceNote:`${prefix.sourceNote} ${estimates21To31.note}`,materials:{...prefix.materials,
    'mechanism-dark':{type:'standard',color:'#262c32',roughness:.30,metalness:.8,surface:'metal'},
    'white-plastic':{type:'standard',color:'#f7f6ef',roughness:.48,metalness:0,surface:'plastic'},
    'wall-context':{type:'standard',color:'#e9e6de',roughness:1,metalness:0},
  }};
export const pos31=(id:string)=>parts31.find(p=>p.id===id)!.position;
