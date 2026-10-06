import type {FaceBore,GeometryDefinition,MeshPartDefinition,PartDefinition,ProductDefinition,Vector3Tuple} from '@/types/product';
import {step03CorrectedProduct,step03Motion} from './parts-step03';

export const estimatedGeometry={source:'mechanically_inferred' as const,confidence:'medium' as const,note:'PDF pages 11–16 determine topology, handedness and quantities. Row elevations, panel thicknesses, grooves, notch clearance, pilot centers and metal profiles are proportional reconstruction, not manufacturer dimensions.'};
export const parts:PartDefinition[]=structuredClone(step03CorrectedProduct.parts);
const mount=[{id:'mount',position:[0,0,0] as Vector3Tuple,normal:[0,0,1] as Vector3Tuple,kind:'mount' as const}];
function mesh(id:string,name:string,geometry:GeometryDefinition,position:Vector3Tuple,material='oak-x',rotation:Vector3Tuple=[0,0,0],category:PartDefinition['category']='cabinet'){
  const p:MeshPartDefinition={id,name,type:'mesh',geometry,position,rotation,material,category,visible:false,evidence:estimatedGeometry,connectionPoints:mount};parts.push(p);return p;
}
export const rows=[{step:4,bottom:55,top:110,rail:'D4-1',prior:'D5'},{step:5,bottom:110,top:165,rail:'D4-2',prior:'D4-1'},{step:6,bottom:165,top:222,rail:'B5',prior:'D4-2'}];
// One coherent face layout, derived from the approved cabinet-side inner faces.
// These are reconstructed assembled contact planes, NOT manufacturer tolerances.
// The existing .04 cm panel edge easing supplies a shallow furniture seam;
// there is no through-clearance channel exposing the background.
export const cabinetFace={
  leftInnerX:step03Motion.firstSideInnerX,rightInnerX:step03Motion.secondSideInnerX,
  centerX:0,centerWidth:5.3,railHeight:6,panelDepth:1.2,faceZ:18,edgeEasing:.04,
} as const;
export const cabinetInnerWidth=cabinetFace.rightInnerX-cabinetFace.leftInnerX;
export const b8PanelWidth=(cabinetInnerWidth-cabinetFace.centerWidth)/2;
export const b8CenterX=cabinetFace.centerWidth/2+b8PanelWidth/2;
// A small temporary inward/upward offset clears the existing post/rail edge
// easing during rear approach. It is a motion clearance, not a final seam.
export const b8Insertion={clearance:.12,rearTravel:16,preInstallZ:3} as const;
export const b8Staging=(side:number):Vector3Tuple=>[-side*b8Insertion.clearance,b8Insertion.clearance,b8Insertion.rearTravel];
export const b7Staging:Vector3Tuple=[0,5,-12];
export const rowJoints: {step:number;rail:string;side:number;y:number;z:number;id:string;host:string}[]=[];
for(const row of rows){
  const height=row.top-row.bottom-cabinetFace.railHeight;
  for(const side of [-1,1]){
    const panel=mesh(`B8-${row.step}-${side}`,`B8 — row ${row.step-3}, ${side<0?'PDF-left':'PDF-right'} panel`,{type:'box',size:[b8PanelWidth,height,cabinetFace.panelDepth],bevel:cabinetFace.edgeEasing},[side*b8CenterX,(row.bottom+row.top)/2,cabinetFace.faceZ]);
    panel.connectionPoints=[...mount,
      {id:'outer-edge',position:[side*b8PanelWidth/2,0,0],normal:[side,0,0],kind:'edge'},
      {id:'center-edge',position:[-side*b8PanelWidth/2,0,0],normal:[-side,0,0],kind:'edge'},
      {id:'lower-edge',position:[0,-height/2,0],normal:[0,-1,0],kind:'support'},
      {id:'upper-edge',position:[0,height/2,0],normal:[0,1,0],kind:'edge'},
    ];
    panel.evidence={...estimatedGeometry,note:'PDF pages 11–13: B8 fills the span from cabinet inner face to B7. Width/height derive from reconstructed contact planes; existing edge easing forms the seam, with no through-opening. Not a manufacturer tolerance.'};
  }
  mesh(`B7-${row.step}`,`B7 — row ${row.step-3} center connector`,{type:'tabbed-stile',size:[cabinetFace.centerWidth,height,3],tabWidth:2,tabHeight:0.6,tabDepth:1.2},[cabinetFace.centerX,(row.bottom+row.top)/2,cabinetFace.faceZ],'oak-y');
  for(const rail of [{id:row.rail,z:18},...(row.step===6?[{id:'B6',z:-18}]:[])]){
    const faceBores:FaceBore[]=[-1,1].flatMap(side=>[{axis:'x',position:[0,-1.2,0] as Vector3Tuple,radius:0.35,face:side<0?'negative':'positive',depth:6},{axis:'x',position:[0,1.2,0] as Vector3Tuple,radius:0.42,face:side<0?'negative':'positive',depth:1.6}]);
    if(rail.z>0){faceBores.push({axis:'y',position:[0,0,0],radius:1.25,face:'negative',depth:0.65});if(row.step<6)faceBores.push({axis:'y',position:[0,0,0],radius:1.25,face:'positive',depth:0.65});}
    if(row.step===6)for(const x of [-105,-60,rail.z>0?7:-7,60,105])faceBores.push({axis:'y',position:[x,0,rail.z>0?.9:-.9],radius:.22,face:'positive',depth:3.7});
    mesh(rail.id,`${rail.id.startsWith('D4')?'D4':rail.id} — spanning rail`,{type:'bored-panel',boreAxis:'z',size:[cabinetInnerWidth,cabinetFace.railHeight,3],holes:[-113.3,113.3].map(x=>({x,z:1.2,radius:.8})),faceBores},[cabinetFace.centerX,row.top,rail.z]);
    for(const side of [-1,1]){
      const id=`S${row.step}-${rail.id}-${side}`,host=side<0?(rail.z>0?'A1':'A3'):(rail.z>0?'A4':'A2');
      rowJoints.push({step:row.step,rail:rail.id,side,y:row.top,z:rail.z,id,host});
      mesh(`${id}-dowel`,'#6 Ø8 ×30 mm dowel',{type:'fluted-dowel',radius:.4,height:3},[side*116.5,row.top+1.2,rail.z],'dowel',[0,0,-side*90],'hardware');
      mesh(`${id}-cam`,'#8 horizontal cam',{type:'horizontal-cam',radius:.75,height:1.1},[side*113.3,row.top-1.2,rail.z+1],'zinc',[90,0,0],'hardware');
      mesh(`${id}-bolt`,'#4 1/4 inch ×70 mm bolt',{type:'socket-bolt',radius:.3175,height:7},[side*116,row.top-1.2,rail.z],'zinc',[0,0,-side*90],'hardware');
    }
  }
}
// Future receivers become visible only at the Step 4 cut. Baseline geometry of
// approved Steps 1–3 remains byte-for-byte identical; no duplicate wood objects.
for(const p of parts){
  if(p.type!=='mesh'||p.geometry.type!=='bored-panel'||!['A1','A2','A3','A4'].includes(p.id))continue;
  const right=['A2','A4'].includes(p.id),g=structuredClone(p.geometry);
  const topZ=(['A1','A4'].includes(p.id)?1:-1)*2.5*(right?1:-1);
  g.faceBores=[...(g.faceBores??[]),...rowJoints.filter(j=>j.host===p.id).flatMap(j=>[-1.2,1.2].map(d=>({axis:'y' as const,position:[right?112.5-j.y-d:j.y+d-112.5,0,0] as Vector3Tuple,radius:d<0?.35:.42}))),{axis:'x',position:[0,right?.65:-.65,topZ],radius:.42,face:right?'negative':'positive',depth:1.5}];
  p.geometryVariants={receivers:g};
}
const lowerRail=parts.find(p=>p.id==='D5')!;
if(lowerRail.type==='mesh'&&lowerRail.geometry.type==='bored-panel')lowerRail.geometryVariants={receivers:{...structuredClone(lowerRail.geometry),faceBores:[...(lowerRail.geometry.faceBores??[]),{axis:'y',position:[0,0,0],radius:1.25,face:'positive',depth:.65}]}};

export const capOffset:Vector3Tuple=[0,-225,85];
export const capWood=['B1-front','B1-rear','B2-left','B2-right','B3','B4-left','B4-right'];
export const capScrewIds:string[]=[];
export const capMembers=[...capWood,...Array.from({length:6},(_,i)=>`S7-H13-${i}`)];
for(const side of [-1,1]){
  // Routed inner channel, with flat outside face for the edge-driven #13 screws.
  const profile:[number,number][]=[[-1.5,-2.3],[-.68,-2.3],[-.68,-1.1],[.68,-1.1],[.68,-2.3],[1.5,-2.3],[1.5,2.3],[-1.5,2.3]];
  const points=side>0?profile:profile.map(([a,b])=>[a,-b] as [number,number]);
  const bores:FaceBore[]=[-105,-60,side*7,60,105].map(x=>({axis:'y',position:[x,0,-side*.8],radius:.34}));
  for(const x of [-118.65,118.65])bores.push({axis:'y',position:[x,0,side*.8],radius:.42,face:'negative',depth:1.5});
  for(const x of [-116.5,0,116.5])bores.push({axis:'z',position:[x,0,0],radius:.34,face:side>0?'positive':'negative',depth:2.3});
  mesh(side>0?'B1-front':'B1-rear','B1 — grooved top-cap long rail',{type:'profile-prism',points,depth:239.2,axis:'x',size:[239.2,3,4.6],faceBores:bores},[0,226.55,side*19.7]);
}
for(const [id,x]of [['B2-left',-116.5],['B3',0],['B2-right',116.5]] as const){
  mesh(id,`${id==='B3'?'B3':'B2'} — top-cap cross connector`,{type:'bored-panel',size:[id==='B3'?5.6:5.4,3,34.8],holes:[],edgeBores:[{x:0,radius:.24}]},[x,226.55,0],'oak-z');
}
for(const side of [-1,1])mesh(side<0?'B4-left':'B4-right','B4 — thin top-cap infill panel',{type:'box',size:[110.8,1.2,36.4],bevel:.035},[side*58.3,226.55,0]);
export function screw(id:string,n:number,length:number,position:Vector3Tuple,rotation:Vector3Tuple,diameter=.4){
  const p=mesh(id,`#${n} ${diameter===.4?'M4':'1/4 inch'} ×${length*10} mm wood screw`,{type:'screw',radius:diameter/2,length,headRadius:diameter*.95,headHeight:.16,threaded:true},position,'zinc',rotation,'hardware');
  p.evidence={source:'dimension_label',confidence:'high',note:`PDF #${n}: ${length*10} mm length; head, thread pitch and pilot clearance estimated.`};return p;
}
let counter=0;
for(const zSide of [-1,1])for(const x of [-116.5,0,116.5]){
  const id=`S7-H13-${counter++}`;capScrewIds.push(id);screw(id,13,7,[x,226.55,zSide*18.5],[zSide*90,0,0],.635);
}
export const topDowels=[-1,1].flatMap(side=>[-18,18].map(z=>({id:`S8-dowel-${side}-${z}`,side,z,host:side<0?(z>0?'A1':'A3'):(z>0?'A4':'A2')})));
for(const d of topDowels)mesh(d.id,'#6 Ø8 ×30 mm top dowel',{type:'fluted-dowel',radius:.4,height:3},[d.side*118.65,225.05,d.z>0?20.5:-20.5],'dowel',[0,0,0],'hardware');
export const topScrews=[-1,1].flatMap(side=>[-105,-60,side*7,60,105].map((x,i)=>({id:`S8-H12-${side}-${i}`,x,z:side*18.9,host:side>0?'B1-front':'B1-rear'})));
for(const s of topScrews)screw(s.id,12,4,[s.x,226.05,s.z],[0,0,0],.635);

export const mechanismHoles:Vector3Tuple[]=[[0,110,10.8],[0,110,8.2],[0,107,10.8],[0,107,8.2],[0,84,9.5],[0,61,10.8],[0,61,8.2],[0,60,3],[0,60,-3],[0,59.5,-11]];
export const mechanisms=[{step:9,id:'D9',side:1,host:'A6',bracketHost:'A4',label:'PDF-right'},{step:10,id:'D8',side:-1,host:'A5',bracketHost:'A1',label:'PDF-left'}];
export const mechanismScrews: {id:string;host:string;side:number;position:Vector3Tuple}[]=[];
for(const m of mechanisms){
  const contour:[number,number][]=[[-22,-12],[32,-12],[32,-7],[-17,-7],[-17,7.1]];
  // Open curved cradle at the lower arm, visible from the interior camera.
  contour.push(...Array.from({length:17},(_,i)=>{const a=Math.PI-i/16*Math.PI;return [-17-2.1*Math.sin(a),9.2+2.1*Math.cos(a)] as [number,number];}),[-17,12],[-22,12]);
  mesh(m.id,`${m.id} — ${m.label} inner L-link / open bearing receiver`,{type:'profile-prism',axis:'x',depth:.3,points:contour.map(([a,b])=>[a,-b]),holes:mechanismHoles.map(p=>({x:p[1]-80,y:p[2],radius:.23}))},[m.side*116.35,80,0],'zinc',[0,0,0],'mechanism');
  for(const [i,p]of mechanismHoles.entries()){
    const position:Vector3Tuple=[m.side*117.2,p[1],p[2]],id=`S${m.step}-H21-${i}`;
    screw(id,21,2,position,[0,0,m.side*90]);mechanismScrews.push({id,host:m.id,side:m.side,position});
  }
  const faceId=`S${m.step}-H25`,wingId=`${faceId}-bend`;
  mesh(faceId,`#25 ${m.label} angle metal — drilled mounting face`,{type:'profile-prism',axis:'x',depth:.2,points:[[-3,-2],[3,-2],[3,2],[-3,2]],holes:[{x:-1.7,y:0,radius:.23},{x:1.7,y:0,radius:.23}]},[m.side*116.4,214,15.3],'zinc',[0,0,0],'hardware');
  // Two mesh surfaces describe ONE bent #25 physical bracket, not two components.
  mesh(wingId,'#25 return flange (same bent bracket)',{type:'box',size:[4,6,.2],bevel:.04},[m.side*114.5,214,17.3],'zinc',[0,0,0],'hardware');
  for(const [i,y]of [212.3,215.7].entries())screw(`S${m.step}-H14-${i}`,14,1.5,[m.side*116.95,y,15.3],[0,0,m.side*90]);
  const panel=parts.find(p=>p.id===m.host)!;
  if(panel.type==='mesh'&&panel.geometry.type==='bored-panel'){
    const geometry=structuredClone(panel.geometry);
    geometry.faceBores=[...(geometry.faceBores??[]),...geometry.holes.map(h=>({axis:'y' as const,position:[h.x,0,h.z] as Vector3Tuple,radius:h.radius})),...mechanismHoles.map(p=>({axis:'y' as const,position:[m.side<0?p[1]-138:138-p[1],0,m.side<0?-p[2]:p[2]] as Vector3Tuple,radius:.16,face:m.side<0?'positive' as const:'negative' as const,depth:1.8}))];
    panel.geometryVariants={receivers:geometry};
  }
  const post=parts.find(p=>p.id===m.bracketHost)!;
  if(post.type==='mesh'&&post.geometry.type==='bored-panel'){
    const base=post.geometryVariants!.receivers;
    if(base.type==='bored-panel')post.geometryVariants!.bracketReceivers={...structuredClone(base),faceBores:[...(base.faceBores??[]),...[212.3,215.7].map(y=>({axis:'y' as const,position:[m.side<0?y-112.5:112.5-y,0,m.side<0?2.7:-2.7] as Vector3Tuple,radius:.16}))]};
  }
}
// 284 mm is the distance printed between the lower rail reference and the
// second-lowest screw, NOT a made-up cabinet or panel size.
export const centerScrewY=[4,34.4,56,82.5,110,137.5,165,193.5,222];
mesh('E5','E5 — center stile on cabinet interior',{type:'bored-panel',boreAxis:'z',size:[3.2,222,1.2],holes:centerScrewY.map(y=>({x:0,z:113-y,radius:.22}))},[0,113,15.9],'oak-y');
for(const [i,y]of centerScrewY.entries())screw(`S10-H24-${i}`,24,2.5,[0,y,16.55],[-90,0,0]);
export const steps01To10Product:ProductDefinition={...step03CorrectedProduct,name:'WF311613 / WF311614 / WF311615 Standalone Murphy Bed — Steps 1–10 paced review',parts,sourceNote:estimatedGeometry.note};
