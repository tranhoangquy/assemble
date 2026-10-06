import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import type {GeometryDefinition,MeshPartDefinition,PartDefinition} from '@/types/product';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {fullProduct,hardware31,mechanism} from '../product/parts-step21-31';
import {steps01To20Product,faceGridWood,carrierWood} from '../product/parts-step11-20';
import {fullPlan} from '../director/steps21-31';
import {correctFootCorners,legReconstruction} from '../product/foot-corner-reconstruction';
import {materialCells} from '../validation/full-validation';

const mesh=(parts:PartDefinition[],id:string):MeshPartDefinition=>{
  const p=parts.find(p=>p.id===id);
  if(!p||p.type!=='mesh')throw new Error(`Expected physical mesh ${id}`);
  return p;
};
const part=(id:string)=>mesh(fullProduct.parts,id);
const cells=(p:MeshPartDefinition)=>materialCells(p.geometry).map(b=>b.clone().translate(new THREE.Vector3(...p.position)));
const bounds=(parts:PartDefinition[],ids:string[])=>{
  const box=new THREE.Box3();
  for(const id of ids)for(const b of cells(mesh(parts,id)))box.union(b);
  return box;
};
const extent=(g:GeometryDefinition)=>materialCells(g).reduce((box,b)=>box.union(b),new THREE.Box3());

describe('Authorized local PDF-correct folding-leg reconstruction',()=>{
  it('keeps footward uprights and headward rounded arms genuinely handed',()=>{
    for(const side of [-1,1]){
      const d3=part(`D3-${side}`),d6=part(`D6-${side}`),d7=part(`D7-${side}`);
      expect(d3.position[0]).toBeCloseTo(side*legReconstruction.x);
      expect(d3.position[2]).toBeLessThan(mechanism.legPivot[2]);
      expect(d6.position[2]).toBe(d3.position[2]);
      expect(d7.position[2]).toBe(d3.position[2]);
      expect(d7.position[1]).toBe(legReconstruction.upperY);
      expect(d6.position[1]).toBe(legReconstruction.lowerY);
      expect(d3.parent).toBe(`leg-${side}`);
      expect(d6.parent).toBe(d3.parent);expect(d7.parent).toBe(d3.parent);
      if(d3.geometry.type!=='compound'||d7.geometry.type!=='compound'||d6.geometry.type!=='compound')throw new Error('Expected physical half-lap solids');
      for(const end of d3.geometry.pieces.slice(1))expect(end.position?.[0]).toBe(-side*.5);
      expect(d7.geometry.pieces.map(p=>p.position?.[0])).toEqual([side*.5,-side*.5]);
      const upper=extent(d7.geometry),lower=extent(d6.geometry);
      expect(upper.getSize(new THREE.Vector3()).x).toBeCloseTo(2);
      expect(lower.getSize(new THREE.Vector3()).x).toBeCloseTo(2);
      expect(upper.max.z).toBeCloseTo(legReconstruction.upperReach+2);
      expect(lower.max.z).toBeCloseTo(legReconstruction.lowerReach+2);
      expect(upper.max.z).toBeGreaterThan(lower.max.z);
      // The actual pivot aperture lies at the rounded HEADWARD end, not
      // at a mirrored/footward coordinate retained from the rejected WIP.
      for(const piece of d7.geometry.pieces){
        if(piece.geometry.type!=='profile-prism')throw new Error('Expected routed pivot arm');
        expect(piece.geometry.holes).toContainEqual({x:0,y:legReconstruction.upperReach,radius:.38});
      }
    }
    expect(legReconstruction.storedAngle).toBe(-90);
  });

  it('preserves the PDF washer/canopy/bolt stack and seats the real bolt head in its recess',()=>{
    for(const side of [-1,1]){
      const carrier=part(side<0?'C8-left':'C8-right'),arm=part(`D7-${side}`);
      const washer=part(`S29-${side}-H10`),canopy=part(`S29-${side}-H9`),bolt=part(`S29-${side}-H2`);
      if(carrier.geometry.type!=='bored-panel'||washer.geometry.type!=='profile-prism'||canopy.geometry.type!=='compound'||bolt.geometry.type!=='socket-bolt'||arm.geometry.type!=='compound')throw new Error('Unexpected PDF pivot hardware');
      const inner=Math.abs(carrier.position[0])-carrier.geometry.size[0]/2;
      const outer=Math.abs(carrier.position[0])+carrier.geometry.size[0]/2;
      const armInner=Math.abs(arm.position[0])-legReconstruction.depth/2;
      expect(washer.geometry.depth).toBe(.2);
      expect(washer.material).toBe('white-plastic');
      expect(Math.abs(washer.position[0])-washer.geometry.depth/2).toBeCloseTo(outer);
      expect(Math.abs(washer.position[0])+washer.geometry.depth/2).toBeCloseTo(armInner);
      expect(hardware31.get(washer.id)?.number).toBe(10);
      expect(hardware31.get(canopy.id)?.number).toBe(9);
      expect(hardware31.get(bolt.id)?.number).toBe(2);
      expect(hardware31.get(canopy.id)?.normal).toEqual([-side,0,0]);
      expect(hardware31.get(bolt.id)?.normal).toEqual([side,0,0]);
      expect(bolt.geometry.height).toBe(4);
      for(const h of [washer,canopy,bolt])expect(h.position.slice(1)).toEqual([mechanism.legPivot[1],mechanism.legPivot[2]]);
      const barrel=canopy.geometry.pieces[0].geometry,flange=canopy.geometry.pieces[1];
      if(barrel.type!=='profile-prism'||flange.geometry.type!=='profile-prism')throw new Error('Expected real canopy barrel/flange');
      const canopyEnd=Math.abs(canopy.position[0])+barrel.depth/2;
      const shaftEnd=Math.abs(bolt.position[0])-bolt.geometry.height/2;
      expect(canopyEnd-shaftEnd).toBeGreaterThan(.8);
      const flangeSeat=Math.abs(canopy.position[0])+side*(flange.position?.[0]??0)+flange.geometry.depth/2;
      expect(flangeSeat).toBeCloseTo(inner,6);
      // Read the ACTUAL generated head underside including its bevel,
      // rather than treating the shaft endpoint as the seating surface.
      const generated=GeometryFactory.create(bolt.geometry);
      try{
        const positions=generated.getAttribute('position');let headUnderside=Infinity;
        for(let i=0;i<positions.count;i++)if(Math.hypot(positions.getX(i),positions.getZ(i))>bolt.geometry.radius*1.25)headUnderside=Math.min(headUnderside,positions.getY(i));
        const outerHalf=arm.geometry.pieces.find(p=>p.position?.[0]===side*.5);
        if(!outerHalf||outerHalf.geometry.type!=='profile-prism')throw new Error('Missing outboard head recess');
        const recess=outerHalf.geometry.faceBores?.find(b=>b.radius===.70);
        expect(recess?.depth).toBe(.8);
        expect(recess?.face).toBe(side>0?'positive':'negative');
        const floor=Math.abs(arm.position[0])+legReconstruction.depth/2-(recess?.depth??0);
        const gap=Math.abs(bolt.position[0])+headUnderside-floor;
        expect(gap).toBeGreaterThanOrEqual(-1e-5);
        expect(gap).toBeLessThan(.05);
      }finally{generated.dispose();}
    }
  });

  it('changes only the authorized local foot-corner material, preserving all nonlocal profile samples',()=>{
    // These explicit limits prevent a later edit from silently redefining
    // the allowed region as an arbitrary large collision-mask pocket.
    expect(legReconstruction.footRailEndX).toBe(114);
    expect(legReconstruction.cornerInsideX).toBe(114.25);
    expect(legReconstruction.cornerEndZ).toBe(174.25);
    let sampleCount=0,removedCount=0;
    for(const id of ['C1-start','C2-left','C2-right']){
      const old=mesh(steps01To20Product.parts,id),now=part(id),before=cells(old),after=cells(now);
      const box=before.reduce((b,c)=>b.union(c),new THREE.Box3());
      for(let x=box.min.x+.13;x<box.max.x;x+=.43)for(let y=box.min.y+.11;y<box.max.y;y+=.41)for(let z=box.min.z+.17;z<box.max.z;z+=.83){
        const point=new THREE.Vector3(x,y,z),was=before.some(b=>b.containsPoint(point)),is=after.some(b=>b.containsPoint(point));
        const insideX=id==='C1-start'?legReconstruction.footRailEndX:legReconstruction.cornerInsideX;
        const localCorner=Math.abs(x)>insideX&&z<legReconstruction.cornerEndZ;
        expect(is&&!was).toBe(false);
        if(!localCorner)expect(is).toBe(was);
        if(was&&!is){expect(localCorner).toBe(true);removedCount++;}
        sampleCount++;
      }
      expect(now.connectionPoints).toEqual(old.connectionPoints);
      expect(now.position).toEqual(old.position);
      if(id.startsWith('C2-')){
        if(now.geometry.type!=='compound'||old.geometry.type!=='compound')throw new Error('Expected original integral tongues');
        expect(now.geometry.pieces.slice(2)).toEqual(old.geometry.pieces.slice(1));
        const originalBody=old.geometry.pieces[0].geometry,rear=now.geometry.pieces[1].geometry;
        if(originalBody.type!=='profile-prism'||rear.type!=='profile-prism')throw new Error('Expected original routed nonlocal body');
        expect(rear.points).toEqual(originalBody.points);
        for(const segment of now.geometry.pieces.slice(0,2)){
          if(segment.geometry.type!=='profile-prism')throw new Error('Expected a local profile segment');
          expect(segment.geometry.faceBores).toHaveLength(originalBody.faceBores?.length??0);
          for(const [i,bore]of (originalBody.faceBores??[]).entries()){
            const preserved=segment.geometry.faceBores![i];
            expect(preserved.axis).toBe(bore.axis);expect(preserved.radius).toBe(bore.radius);
            expect(preserved.depth).toBe(bore.depth);expect(preserved.face).toBe(bore.face);
            for(let axis=0;axis<3;axis++)expect(preserved.position[axis]+(segment.position?.[axis]??0)).toBeCloseTo(bore.position[axis],8);
          }
        }
      }
      expect(now.evidence?.source).toBe('mechanically_inferred');
      expect(now.evidence?.note).toMatch(/estimated|Estimated/);
    }
    expect(sampleCount).toBeGreaterThan(50000);
    expect(removedCount).toBeGreaterThan(0);
  });

  it('keeps all Step 28 physical fasteners and canopy inserts seated on the handed half-laps',()=>{
    const legNumbers=[...hardware31.entries()].filter(([id])=>id.startsWith('S28-')).map(([,h])=>h.number);
    for(const number of [1,7,9])expect(legNumbers.filter(n=>n===number)).toHaveLength(8);
    for(const side of [-1,1])for(const label of ['D6','D7'])for(const i of [0,1]){
      const arm=part(`${label}-${side}`),insert=part(`S28-${side}-${label}-H9-${i}`),bolt=part(`S28-${side}-${label}-H1-${i}`);
      expect(insert.parent).toBe(arm.id);
      expect(insert.position[0]).toBeCloseTo(side*.25);
      expect(insert.position[1]).toBeCloseTo(i===0?-.85:.85);
      expect(insert.position[2]).toBeCloseTo(1.4);
      if(insert.geometry.type!=='compound'||bolt.geometry.type!=='socket-bolt')throw new Error('Missing physical lap hardware');
      const flange=insert.geometry.pieces[1];
      if(flange.geometry.type!=='profile-prism')throw new Error('Missing physical canopy flange');
      const seatedInnerFlange=Math.abs(arm.position[0])+side*insert.position[0]+side*(flange.position?.[0]??0)-flange.geometry.depth/2;
      expect(seatedInnerFlange).toBeCloseTo(legReconstruction.x+legReconstruction.depth/2,6);
      const generated=GeometryFactory.create(bolt.geometry);
      try{
        const positions=generated.getAttribute('position');let underside=Infinity,headEnd=-Infinity;
        for(let k=0;k<positions.count;k++)if(Math.hypot(positions.getX(k),positions.getZ(k))>bolt.geometry.radius*1.25){underside=Math.min(underside,positions.getY(k));headEnd=Math.max(headEnd,positions.getY(k));}
        const inboardLapFace=legReconstruction.x-legReconstruction.depth/2;
        expect(Math.abs(bolt.position[0])-underside).toBeCloseTo(inboardLapFace,6);
        // The C1-only extra end relief is justified by these REAL socket
        // heads, not by removing a wider C2 collision-mask band.
        expect(Math.abs(bolt.position[0])-headEnd-legReconstruction.footRailEndX).toBeGreaterThan(.1);
      }finally{generated.dispose();}
    }
  });

  it('keeps original prefix data immutable and retains the 232 by 204 bed face and all carrier dimensions',()=>{
    const originalFoot=mesh(steps01To20Product.parts,'C1-start');
    if(originalFoot.geometry.type!=='profile-prism')throw new Error('Expected original foot rail');
    expect(originalFoot.geometry.depth).toBe(232);
    for(const id of ['C2-left','C2-right']){
      const original=mesh(steps01To20Product.parts,id);
      if(original.geometry.type!=='compound'||original.geometry.pieces[0].geometry.type!=='profile-prism')throw new Error('Expected original C2 rail');
      expect(original.geometry.pieces).toHaveLength(3);
      expect(original.geometry.pieces[0].geometry.depth).toBe(188.8);
    }
    const snapshot=JSON.stringify(steps01To20Product.parts),clone=structuredClone(steps01To20Product.parts);
    correctFootCorners(clone);
    expect(JSON.stringify(steps01To20Product.parts)).toBe(snapshot);
    expect(clone.filter((p,i)=>JSON.stringify(p)!==JSON.stringify(steps01To20Product.parts[i])).map(p=>p.id).sort()).toEqual(['C1-start','C2-left','C2-right']);
    const size=bounds(fullProduct.parts,faceGridWood).getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(232);expect(size.z).toBeCloseTo(204);
    for(const id of carrierWood){
      const old=mesh(steps01To20Product.parts,id),now=part(id);
      expect(now.position).toEqual(old.position);expect(now.geometry).toEqual(old.geometry);
    }
  });

  it('documents the supported 3-degree staging angle as estimated, never as a printed PDF dimension',()=>{
    expect(legReconstruction.supportedBedAngle).toBe(3);
    const shots=fullPlan.steps.flatMap(s=>s.shots);
    const work=shots.find(s=>s.id==='S28-supported-work-pose'),lift=shots.find(s=>s.id==='S29-support-lift');
    expect(work?.note).toMatch(/estimated.*not a PDF measurement/i);
    expect(lift?.note).toMatch(/reconstructed, not manufacturer-specified/i);
    expect(lift?.actions).toContainEqual(expect.objectContaining({type:'pivotPose',target:'bed-motion-root',localPivot:mechanism.sourcePivot,from:{pivot:mechanism.cabinetPivot,angle:0},to:{pivot:mechanism.cabinetPivot,angle:3}}));
  });
});
