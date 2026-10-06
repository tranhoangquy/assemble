import type {GeometryDefinition,MeshPartDefinition,PartDefinition,Vector3Tuple} from '@/types/product';

/** PDF p27 defines handed topology, not these numerical dimensions.
 * All values are estimated scene geometry. The supported 3-degree bed lift
 * avoids the heel sweeping below the floor; it is not a printed PDF angle. */
export const legReconstruction={x:115.4,pivotY:45,pivotZ:172,joinZ:154.8,
  upperY:45,lowerY:10.5,upperReach:17.2,lowerReach:5,depth:2,
  storedAngle:-90,supportedBedAngle:3,cornerInsideX:114.25,cornerEndZ:174.25,
  footRailEndX:114.0} as const;

export function uprightGeometry(side:number):GeometryDefinition{
  const span=legReconstruction.upperY-legReconstruction.lowerY;
  return{type:'compound',size:[2,span+4,6],pieces:[
    {geometry:{type:'box',size:[2,span-8,6]}},
    ...[-1,1].map(k=>({geometry:{type:'box',size:[1,6,6]} as GeometryDefinition,
      position:[-side*.5,k*(span/2-1),0] as Vector3Tuple})),
  ]};
}

export function armGeometry(side:number,reach:number,pivot=false):GeometryDefinition{
  const arc=Array.from({length:33},(_,i)=>[2*Math.cos(i*Math.PI/32),reach+2*Math.sin(i*Math.PI/32)] as [number,number]);
  const points:[number,number][]=[[-2,-3],[2,-3],[2,reach],...arc];
  const outboard:[number,number][]=[[-2,3],[2,3],[2,reach],...arc];
  const holes=pivot?[{x:0,y:reach,radius:.38}]:[];
  return{type:'compound',size:[2,4,reach+5],pieces:[
    {geometry:{type:'profile-prism',axis:'x',depth:1,size:[1,4,reach+5],points,holes},position:[side*.5,0,0]},
    {geometry:{type:'profile-prism',axis:'x',depth:1,size:[1,4,reach+5],points:outboard,holes},position:[-side*.5,0,0]},
  ]};
}

function clipX(points:[number,number][],edge:number,side:number):[number,number][]{
  const result:[number,number][]=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],inside=(p:[number,number])=>side*p[0]<=side*edge+1e-9;
    const ia=inside(a),ib=inside(b);if(ia)result.push([...a]);
    if(ia!==ib){const t=(edge-a[0])/(b[0]-a[0]);result.push([edge,a[1]+(b[1]-a[1])*t]);}
  }return result;
}

/** Intentional local rebated foot-corner clearance. Preserve the original
 * routed channels, central tongues, holes and all nonlocal wood. Only each
 * outer C2 1.75-cm corner band is relieved. C1's end is shortened by 2 cm
 * for the real #1 socket-head sweep; no 33-cm diagnostic box is used.
 * The real bed's overall 232 x 204 outer extents stay unchanged. */
export function correctFootCorners(parts:PartDefinition[],insideX:number=legReconstruction.cornerInsideX,endZ:number=legReconstruction.cornerEndZ,railEndX:number=legReconstruction.footRailEndX){
  const end=parts.find(p=>p.id==='C1-start') as MeshPartDefinition;
  if(end.geometry.type!=='profile-prism')throw new Error('Expected routed C1 foot rail');
  const g=structuredClone(end.geometry);g.depth=2*railEndX;g.size=[2*railEndX,3,7.6];end.geometry=g;
  end.evidence={source:'mechanically_inferred',confidence:'medium',note:'PDF-correct folding leg: local outer foot-corner end relief only. Nominal main face envelope and original central receiver axes retained; estimated scene reconstruction, not structural certification.'};
  for(const side of [-1,1]){
    const p=parts.find(p=>p.id===(side<0?'C2-left':'C2-right')) as MeshPartDefinition;
    if(p.geometry.type!=='compound'||p.geometry.pieces[0].geometry.type!=='profile-prism')throw new Error('Expected C2 routed rail with integral tongues');
    const original=structuredClone(p.geometry),body=original.pieces[0].geometry as Extract<GeometryDefinition,{type:'profile-prism'}>;
    const localEnd=endZ-p.position[2],start=-body.depth/2,back=body.depth/2,footLength=localEnd-start;
    const edge=side*(insideX-Math.abs(p.position[0]));
    const foot=structuredClone(body);foot.depth=footLength;foot.points=clipX(foot.points,edge,side);
    const footCenter=(start+localEnd)/2;foot.faceBores=foot.faceBores?.map(b=>({...b,position:[b.position[0],b.position[1],b.position[2]-footCenter]}));
    // Preserve the exact clipped cross-section rather than allowing bore
    // generation to recreate a enclosing rectangular face at the relief.
    foot.preserveEndProfile=true;foot.size=[7.6,3,footLength];
    const rear=structuredClone(body);rear.depth=back-localEnd;const rearCenter=(back+localEnd)/2;
    rear.size=[7.6,3,rear.depth];rear.faceBores=rear.faceBores?.map(b=>({...b,position:[b.position[0],b.position[1],b.position[2]-rearCenter]}));
    p.geometry={...original,pieces:[{geometry:foot,position:[0,0,footCenter]},{geometry:rear,position:[0,0,rearCenter]},...original.pieces.slice(1)]};
    p.evidence={source:'mechanically_inferred',confidence:'medium',note:'Local outboard foot-corner clearance for PDF-correct D7 sweep; original inside channel, integral center tongue and nonlocal C2 profile/receiver axes retained. Estimated scene geometry, not a machining specification.'};
  }
}
