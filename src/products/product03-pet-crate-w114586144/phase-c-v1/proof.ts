/** Limited local Phase C: source-visible contact/approach, not hidden fastening. */
import * as T from 'three';
import {createPrototype} from '../prototype-v2/model';
export const duration=16;
export const fps=12;
export const source={pdfPage:4,printedPage:3,step:'S1',parts:['10','12'],hardware:'D ×4 in full S1; two on the shown end'};
const ease=(a:number,b:number,t:number)=>T.MathUtils.smootherstep(t,a,b);
export function createProof(){
 const r=createPrototype();r.setFinish('crafted');
 const baseline=r.registry.captureState();
 const reset=()=>{r.registry.restoreState(baseline);r.setFinish('crafted');r.root.visible=r.hardwareRoot.visible=true;for(const [,o] of r.registry.entries())o.visible=false;};
 function joint(time:number){
  const t=T.MathUtils.clamp(time,0,duration);reset();
  const side=r.registry.require('part-10-1'),back=r.registry.require('part-12-1');side.visible=back.visible=true;
  side.position.x=-657+90*ease(2,5,t);
  const axis=new T.Vector3(-1,0,0);
  const screwStates=[];
  for(let i=0;i<2;i++){
   const o=r.registry.require(`hardware-D-${i+1}`),a=9+i*2,p=ease(a,a+2,t);
   o.visible=t>=8;o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis);o.position.set(-695+73*p,i===0?865:785,-270);
   // D length44: final tipX=-578, exterior faceX=-576, 2-display-unit stand-off.
   screwStates.push({id:o.name,visible:o.visible,head:o.position.toArray(),tip:[o.position.x+44,o.position.y,o.position.z],mouth:[-576,o.position.y,-270],outwardAxis:axis.toArray(),tipGapDisplay:-576-(o.position.x+44),state:t<a?'STAGED':t<a+2?'EXTERNAL_APPROACH':'STOP_BEFORE_UNVERIFIED_RECEIVER'});
  }
  r.root.updateMatrixWorld(true);r.hardwareRoot.updateMatrixWorld(true);
  return{t,source,visiblePartIds:['part-10-1','part-12-1'],panelState:t<5?'ALIGNING_WITH_SUPPORT_REQUIRED':'CONTACT_ALIGNED_NOT_SECURED',panelContactGapDisplay:Math.max(0,-558-(side.position.x+9)),screws:screwStates,scope:'NOT A COMPLETE S1; no tightening, tool operation or hidden receiver travel',support:'Flat review surface and required external holding; hand/support method not validated'};
 }
 function hinge(candidate:boolean){
  reset();for(const id of ['part-1-1','part-2-1','part-7-1','part-8-1'])r.registry.require(id).visible=true;
  const result=[];
  for(const [code,sign] of [['7',-1],['8',1]] as const){
   const door=r.registry.require(`part-${code}-1`);if(candidate)door.position.z=286;
   const groups=door.children.filter(o=>o instanceof T.Group&&o.children.length===5);
   if(groups.length!==2)throw Error('Expected two source-integrated hinge groups');
   for(const h of groups){
    if(candidate){h.position.x=sign*285;h.position.z=12.3;for(const leaf of h.children.slice(0,2))leaf.position.z=-2.55;}
    const axis=new T.Vector3();h.getWorldPosition(axis);
    const leafCenter=new T.Vector3();h.children[0].getWorldPosition(leafCenter);
    const stationaryFaceZ=295,movingFaceZ=door.position.z+9;
    result.push({door:code,level:h.position.y>0?'upper':'lower',axis:axis.toArray(),leafRearZ:leafCenter.z-.75,stationaryFaceZ,movingFaceZ,stationaryLeafSignedGap:leafCenter.z-.75-stationaryFaceZ,movingLeafSignedGap:leafCenter.z-.75-movingFaceZ,barrelRearZ:axis.z-3.3,barrelVsMovingFaceSignedGap:axis.z-3.3-movingFaceZ});
   }
  }
  r.root.updateMatrixWorld(true);
  return{candidate,scope:'STATIC EXTERNAL-CONTACT HYPOTHESIS; no hinge motion, receiver, factory detail or fit certification',changes:candidate?{doorDepthShiftDisplay:-16,hingeLocalXShiftMagnitudeDisplay:5,barrelLocalZ:12.3,leafRelativeZ:-2.55}:null,interfaces:result};
 }
 function stateDigest(){return [...r.registry.entries()].map(([id,o])=>({id,p:o.position.toArray(),q:o.quaternion.toArray(),v:o.visible,children:o.children.map(c=>({p:c.position.toArray(),q:c.quaternion.toArray()}))}));}
 return{r,joint,hinge,stateDigest};
}
