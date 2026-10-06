import type {RenderCheckpoint} from '@/types/product-package';
import {steps01To10Plan,cameras} from '../director/steps04-10';
import {cabinetFace} from '../product/parts-step04-10';

function timeAt(step:number,shotId:string,fraction=.8){
  let cursor=0;
  for(const s of steps01To10Plan.steps)for(const shot of s.shots){
    if(s.step===step&&shot.id===shotId)return cursor+shot.duration*fraction;
    cursor+=shot.duration;
  }
  throw new Error(`Missing B8 inspection checkpoint ${step}/${shotId}`);
}
const completedRows=timeAt(6,'S6-complete'),z=cabinetFace.faceZ,y=137.5;
/** Additional orthogonal inspection views, NOT replacements for instructional cameras. */
export const b8ReviewCheckpoints:RenderCheckpoint[]=[
  {name:'b8-01-full-front.png',time:timeAt(10,'S10-complete'),camera:{position:[0,117,-455],target:[0,117,z],fov:35}},
  {name:'b8-02-left-outer-seam.png',time:completedRows,camera:{position:[cabinetFace.leftInnerX,y,-2],target:[cabinetFace.leftInnerX,y,z],fov:35}},
  {name:'b8-03-right-outer-seam.png',time:completedRows,camera:{position:[cabinetFace.rightInnerX,y,-2],target:[cabinetFace.rightInnerX,y,z],fov:35}},
  {name:'b8-04-center-b7-seams.png',time:completedRows,camera:{position:[0,y,-5],target:[0,y,z],fov:35}},
  {name:'b8-05-step04-panel-insertion.png',time:timeAt(4,'S4-B8-4--1-seat',.5)},
  {name:'b8-06-step06-cabinet-complete.png',time:completedRows,camera:cameras['S10-result']},
];
