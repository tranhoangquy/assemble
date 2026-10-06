import type {GeometryDefinition,PartDefinition} from '@/types/product';

/** PDF p9: A5/A6 close the side frame at the cap; A9 sits between A8/A7.
 * Keep every part origin and animation endpoint frozen. Adjust the solid in
 * that coordinate system, so all existing fastener axes stay put. */
export function correctProductFitAndHoles(parts:PartDefinition[]) {
  for(const p of parts) {
    if(p.type!=='mesh')continue;
    const side=['A2','A4','A6'].includes(p.id)?1:-1;
    const correct=(source:GeometryDefinition):GeometryDefinition=>{
      const g=structuredClone(source);
      if(['A5','A6'].includes(p.id)&&g.type==='bored-panel'){
        // Cam wells open on the assembly face only. A through cut on the
        // opposite finished face had no connection or tool-access purpose.
        const cams=g.holes.map(h=>({axis:'y' as const,position:[h.x,0,h.z] as [number,number,number],radius:h.radius,face:'positive' as const,depth:1.3}));
        g.faceBores=(g.faceBores??[]).filter(b=>!g.holes.some(h=>b.axis==='y'&&b.position[0]===h.x&&b.position[2]===h.z&&b.radius===h.radius));
        g.holes=[];g.faceBores.push(...cams);
        // Extend ONLY the capward end from y=220.5 to y=225.05 (B2 underside).
        // Recenter cutters in the shifted solid; their product axes do not move.
        const shift=-side*2.275;
        g.size[0]=169.55;
        for(const b of g.faceBores)b.position[0]-=shift;
        for(const b of g.edgeBores??[])b.x-=shift;
        return {type:'compound',size:[169.55,3,28],pieces:[{geometry:g,position:[shift,0,0]}]};
      }
      // Apply the same mechanical rule to EVERY other timber cam well,
      // including A7/A8 and all cabinet spanning rails. The occupied mouth
      // and its axis stay; only the unexplained opposite opening is removed.
      if(g.type==='bored-panel'&&p.material.startsWith('oak')&&g.holes.some(h=>h.radius===.8)){
        const camHoles=g.holes.filter(h=>h.radius===.8),axis:'z'|'y'=g.boreAxis==='z'?'z':'y';
        g.holes=g.holes.filter(h=>h.radius!==.8);
        g.faceBores=[...(g.faceBores??[]),...camHoles.map(h=>({axis,position:(axis==='z'?[h.x,-h.z,0]:[h.x,0,h.z]) as [number,number,number],radius:h.radius,face:'positive' as const,depth:1.3}))];
      }
      if(['A1','A2','A3','A4'].includes(p.id)&&g.type==='bored-panel'){
        // #6 dowels enter from the inner joint face; the previous through
        // openings on the exterior were accidental procedural geometry.
        const dowels=g.holes.filter(h=>h.radius===.42);
        g.holes=g.holes.filter(h=>h.radius!==.42);
        g.faceBores=[...(g.faceBores??[]),...dowels.map(h=>({axis:'z' as const,position:[h.x,0,0] as [number,number,number],radius:h.radius,face:(['A1','A2'].includes(p.id)?'positive':'negative') as 'positive'|'negative',depth:1.5}))];
        for(const b of g.faceBores)if(b.axis==='y'&&b.radius===.42&&!b.face){b.face=side<0?'positive':'negative';b.depth=1.5;}
      }
      // A9's actual lower edge overlapped A8 by 5 mm while its upper edge
      // missed A7 by 5 mm. Translate the timber, keeping the pivot bore fixed.
      if(['A9','A9-R'].includes(p.id)&&(g.type==='box'||g.type==='bored-panel')){
        const shift=p.id==='A9'?.5:-.5;
        if(g.type==='bored-panel')for(const b of g.faceBores??[])b.position[0]-=shift;
        return {type:'compound',size:[43,1.2,28],pieces:[{geometry:g,position:[shift,0,0]}]};
      }
      return g;
    };
    p.geometry=correct(p.geometry);
    if(p.geometryVariants)p.geometryVariants=Object.fromEntries(Object.entries(p.geometryVariants).map(([id,g])=>[id,correct(g)]));
  }
}
