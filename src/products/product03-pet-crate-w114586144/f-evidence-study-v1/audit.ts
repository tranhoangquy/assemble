/** Read-only queries of the accepted provisional model. No geometry mutation or animation. */
import * as T from 'three';
import {writeFileSync} from 'node:fs';
import {createModel} from '../p0-connections-v1/model';
const m=createModel(true),rows=[];
for(const variant of ['A_LOWER_FACE','B_OUTSIDE_FACE','B_INSIDE_FACE'])for(let i=1;i<=8;i++){
 const rear=i<=4,x=-450+((i-1)%4)*300,host=rear?'part-4-1':'part-3-1',backing=rear?'part-13-1':'part-15-1';
 const centerZ=rear?-286:286,sign=rear?-1:1;
 const head=variant==='A_LOWER_FACE'?new T.Vector3(x,735,centerZ):new T.Vector3(x,744,centerZ+(variant==='B_OUTSIDE_FACE'?sign:-sign)*9);
 const n=variant==='A_LOWER_FACE'?new T.Vector3(0,-1,0):new T.Vector3(0,0,variant==='B_OUTSIDE_FACE'?sign:-sign);
 const target=m.r.registry.require(host),wood=m.r.registry.require(backing);
 const seat=new T.Raycaster(head.clone().addScaledVector(n,2),n.clone().negate(),0,7).intersectObject(target,true)[0];
 const path=new T.Raycaster(head.clone().addScaledVector(n,60),n.clone().negate(),0,59.9).intersectObject(target,true)[0];
 const woodHit=new T.Raycaster(head.clone(),n.clone().negate(),0,25).intersectObject(wood,true)[0];
 const box=new T.Box3().setFromObject(wood);
 rows.push({variant,id:`F${i}`,stage:rear?'S10':'S12',host,backing,
  head:head.toArray(),outwardNormal:n.toArray(),sourceNormal:'UNCONFIRMED',
  externalSeatingGap:seat?seat.distance-2:null,
  straightApproach60:path?{status:'OBSTRUCTED_IN_THIS_MODEL',firstPoint:path.point.toArray(),distanceBeforeSeatedHead:60-path.distance,mesh:path.object.name||'Existing host submesh'}:{status:'CENTERLINE_CLEAR_ONLY'},
  proposedBackingWithinFull25Shaft:woodHit?{status:'MESH_HIT_NOT_RECEIVER_PROOF',distance:woodHit.distance}:{status:'NO_BACKING_ON_AXIS'},
  woodBounds:{min:box.min.toArray(),max:box.max.toArray()},woodLowerFaceToHeadY:box.min.y-head.y,
  disposition:variant==='A_LOWER_FACE'?'REJECT_CURRENT_STRAIGHT_PATH':'NOT_SELECTED: clear path cannot resolve missing backing/source axis',
  units:'Unmeasured display units; shaft25 follows visual hardware source label, not a certified product-scale fit'});
}
const report={review:'PRODUCT03-F-EVIDENCE-STUDY-V1-20261021',scope:'Read-only source/geometry interpretation study. No mesh, panel, obstacle, hole or hardware transform changed. No render/animation generated.',
 rows,summary:{testedAxes:rows.length,lowerFace:{count:8,seating:'0 nominal gap',obstructed:rows.filter(r=>r.variant==='A_LOWER_FACE'&&r.straightApproach60.status==='OBSTRUCTED_IN_THIS_MODEL').length},
 outsideLAP:{count:8,clearCenterlines:rows.filter(r=>r.variant==='B_OUTSIDE_FACE'&&r.straightApproach60.status==='CENTERLINE_CLEAR_ONLY').length,missingBacking:rows.filter(r=>r.variant==='B_OUTSIDE_FACE'&&r.proposedBackingWithinFull25Shaft.status==='NO_BACKING_ON_AXIS').length},
 insideLAP:{count:8,clearCenterlines:rows.filter(r=>r.variant==='B_INSIDE_FACE'&&r.straightApproach60.status==='CENTERLINE_CLEAR_ONLY').length,missingBacking:rows.filter(r=>r.variant==='B_INSIDE_FACE'&&r.proposedBackingWithinFull25Shaft.status==='NO_BACKING_ON_AXIS').length}},
 verdict:'INSUFFICIENT_SOURCE_TO_SELECT_AXIS; F remains UNRESOLVED. No axis may be selected merely because a model path is clear.',
 physicalLimits:'Centerline rays do not certify a full screw/driver/hand envelope, bore, thread, load or manufacturer installation.'};
writeFileSync(new URL('../../../../output/product03-pet-crate-w114586144/f-evidence-study-v1/NUMERICAL-ACCESS-MATRIX.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary,null,2));
