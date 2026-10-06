import * as THREE from 'three';
import type {FaceBore,Vector3Tuple} from '@/types/product';
import {subtractSolids} from './SolidSubtraction';

export type BoreFaceRegions=Partial<Record<'x'|'y'|'z',Record<'positive'|'negative',[number,number][][]>>>;

/**
 * Subtract the UNION of finite bore volumes from the actual closed solid.
 * Subsequent cutters also trim previous bore walls / blind floors. Rebuilding
 * disconnected disks independently cannot represent crossing or nested bores.
 * The input shell (including its grooves, half-laps and bevel) remains intact.
 */
export function applyFaceBores(input:THREE.BufferGeometry,size:Vector3Tuple,bores:FaceBore[],_preserveProfile=false,_regions?:BoreFaceRegions):THREE.BufferGeometry{
  // Retained signature for callers with older profile-region metadata. Solid
  // subtraction operates on the actual input profile, not those bounds.
  void _preserveProfile;void _regions;
  input.computeBoundingBox();
  const cutters:THREE.BufferGeometry[]=[];
  const unique=new Map<string,FaceBore>();
  for(const bore of bores)unique.set(JSON.stringify([bore.axis,bore.position.filter((_,i)=>i!==(bore.axis==='x'?0:bore.axis==='y'?1:2)),bore.radius,bore.face??'both',bore.depth]),bore);
  for(const bore of unique.values()){
    if(bore.radius<=0||!Number.isFinite(bore.radius))throw new Error('Bore radius must be positive');
    const axisIndex=bore.axis==='x'?0:bore.axis==='y'?1:2,thickness=size[axisIndex];
    const through=!bore.face||bore.face==='both',side=bore.face==='negative'?-1:1;
    const depth=through?thickness:Math.min(bore.depth??1.2,thickness);
    if(depth<=0)throw new Error('Bore depth must be positive');
    // This axial overrun is solely outside the solid. It avoids coincident
    // face-plane ambiguity, without enlarging radius or blind-floor depth.
    const overrun=.0001,min=input.boundingBox!.min.getComponent(axisIndex),max=input.boundingBox!.max.getComponent(axisIndex);
    const start=through?min-overrun:side>0?thickness/2-depth:min-overrun;
    const end=through?max+overrun:side>0?max+overrun:depth-thickness/2;
    const height=end-start,center=(start+end)/2;
    const cutter=new THREE.CylinderGeometry(bore.radius,bore.radius,height,32,1,false);
    if(bore.axis==='x')cutter.rotateZ(-Math.PI/2);
    if(bore.axis==='z')cutter.rotateX(Math.PI/2);
    cutter.translate(bore.axis==='x'?center:bore.position[0],bore.axis==='y'?center:bore.position[1],bore.axis==='z'?center:bore.position[2]);
    cutters.push(cutter);
  }
  const result=subtractSolids(input,cutters);
  input.dispose();cutters.forEach(cutter=>cutter.dispose());
  return result;
}
