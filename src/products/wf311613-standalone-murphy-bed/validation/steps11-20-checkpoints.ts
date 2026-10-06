import type {RenderCheckpoint} from '@/types/product-package';
import {steps01To20Plan as plan} from '../director/steps11-20';
const chosen=new Map<string,string>([
  ['S11-context','review-11-cabinet-and-new-face'],['S11-C4-seat','review-11-right-angle'],
  ['S12-layer-target','review-12-support-layer'],['S12-C6-1-first-seat','review-12-panel-path'],['S12-complete','review-12-two-panels'],
  ['S13-C7-0-seat','review-13-underside-C7'],['S13-C7-0-screws','review-13-screw'],
  ['S14-C6-0-first-seat','review-14-panel-path'],['S15-C6-0-second-seat','review-15-panel-path'],['S15-complete','review-15-eight-panels'],
  ['S16-square','review-16-carrier-square'],['S16-complete','review-16-two-assemblies'],
  ['S17-above','review-17-staged-above'],['S17-lower','review-17-controlled-lowering'],['S17-seat','review-17-dowel-capture'],
  ['S17-side--1--55-bolt-up','review-17-underside-bolt'],['S17-complete','review-17-mated'],
  ['S18-H20-0-seat','review-18-first-bracket'],['S18-H20-0-screws','review-18-four-screws'],
  ['S19-complete','review-19-twelve-brackets'],['S20-D2-0-seat','review-20-slat-layer'],['S20-D2-0-first-screw','review-20-first-screw'],['S20-complete','review-20-five-slats'],
]);
let cursor=0;
export const steps11To20Checkpoints:RenderCheckpoint[]=plan.steps.flatMap(step=>step.shots.flatMap(shot=>{
  const start=cursor;cursor+=shot.duration;const name=chosen.get(shot.id);
  return name?[{name:`${name}.png`,time:start+shot.duration*(shot.type==='STEP_COMPLETE'?.8:.5)}]:[];
}));
