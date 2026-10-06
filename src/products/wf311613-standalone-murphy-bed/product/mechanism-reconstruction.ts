import type {MeshPartDefinition,PartDefinition,Vector3Tuple} from '@/types/product';
import {mechanismHoles} from './parts-step04-10';

/** Estimated reconstruction, constrained by the LOCKED cabinet and bed solids.
 * The 0.25-degree actual-mesh sweep is implemented in validation/pivot-search.
 * These values are neither printed dimensions nor manufacturer tolerances. */
export const reconstructedPivot={cabinetY:36.5,cabinetZ:-9.2,bedSourceY:45,bedSourceZ:340,
  previousCabinetY:63,previousBedSourceZ:318,cradleRadius:2.1} as const;
// Keep the original mounting web and all ten fasteners on the full-thickness
// A5/A6 panel. Only the bearing cradle extends below that mounting web.
export const correctedReceiverHoles:Vector3Tuple[]=mechanismHoles.map(p=>[...p]);

/** Applied only to the new full product; historical checkpoint packages remain intact. */
export function correctReceiverReconstruction(parts:PartDefinition[]){
  for(const side of [-1,1]){
    const id=side<0?'D8':'D9',step=side<0?10:9;
    const plate=parts.find(p=>p.id===id) as MeshPartDefinition;
    const cy=reconstructedPivot.cabinetY-80;
    // Retain the PDF L-profile, ten mounting holes, handedness and upper stud.
    const points:[number,number][]=[[cy-5,-12],[32,-12],[32,-7],[-17,-7],[-17,12],[-22,12],[-22,-7],[cy,-7],[cy,7.1]];
    points.push(...Array.from({length:33},(_,i)=>{const a=Math.PI-i*Math.PI/32;return[cy-2.1*Math.sin(a),9.2+2.1*Math.cos(a)] as [number,number];}),[cy,12],[cy-5,12]);
    plate.geometry={type:'profile-prism',axis:'x',depth:.3,points:points.map(([y,z])=>[y,-z]),holes:correctedReceiverHoles.map(p=>({x:p[1]-80,y:p[2],radius:.23}))};
    plate.evidence={source:'mechanically_inferred',confidence:'medium',note:'PDF D8/D9 handed component, original ten-hole mounting web and open cradle retained. Estimated integral lower receiver extension locates the cradle below the mounting web; not manufacturer geometry.'};
    for(let i=0;i<correctedReceiverHoles.length;i++){
      const screw=parts.find(p=>p.id===`S${step}-H21-${i}`)!;
      screw.position=[side*117.2,correctedReceiverHoles[i][1],correctedReceiverHoles[i][2]];
    }
  }
}
