import * as T from 'three';
import {createModel as acceptedModel,placements as acceptedPlacements} from '../part-first-sequence-v1/model';
export const proposal={oldLeg:18,leg:22,width:18,thickness:2,holeRadius:3,oldHoleOffset:8,holeOffset:10,
 evidence:'Local manual PDFp5, S04 inset: two perpendicular K mounting faces with one B each; drawing is not a dimensional specification.',
 confidence:'PROPOSED UNMEASURED VISIBLE K PROPORTIONS. No measured OEM K dimension or hidden receiver claim. B geometry unchanged.'};
export const placements=acceptedPlacements.map(p=>({...p,position:[...p.position] as [number,number,number]}));
for(let i=0;i<2;i++){
 const sign=i?-1:1,k=placements.find(p=>p.id===`hardware-K-${i+1}`)!;
 // Existing2-unit plate thickness and original mating wood planes are retained.
 // The22-unit leg is a disclosed proportion proposal, not a hidden-hole relocation.
 k.position[0]=sign*-169;
 const horizontal=placements.find(p=>p.id===`hardware-B-${i*2+1}`)!,vertical=placements.find(p=>p.id===`hardware-B-${i*2+2}`)!;
 horizontal.position=[sign*-169,903,220];vertical.position=[sign*-178,894,220];
}
function plate(w:number,h:number,depth:number,radius:number){
 const s=new T.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();
 const hole=new T.Path();hole.absarc(0,0,radius,0,Math.PI*2,true);s.holes.push(hole);
 const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:24});g.translate(0,0,-depth/2);return g;
}
export function createModel(){
 const m=acceptedModel();
 for(let i=1;i<=2;i++){
  const k=m.r.registry.require(`hardware-K-${i}`),a=k.children[0] as T.Mesh,b=k.children[1] as T.Mesh;
  a.geometry=plate(proposal.width,proposal.leg,proposal.thickness,proposal.holeRadius);
  b.geometry=plate(proposal.width,proposal.leg,proposal.thickness,proposal.holeRadius);b.position.set(0,10,-10);
 }
 for(const p of placements.filter(p=>/^hardware-[BK]-/.test(p.id)))m.r.registry.require(p.id).position.set(...p.position);
 m.rig.updateMatrixWorld(true);return m;
}
