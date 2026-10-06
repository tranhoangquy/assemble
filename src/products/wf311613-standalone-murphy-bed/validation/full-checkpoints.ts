import type {RenderCheckpoint} from '@/types/product-package';
import {fullPlan} from '../director/steps21-31';
/** Current deterministic review checkpoints, not a claim of director approval. */
const selected=new Set(['S9-target','S10-target','S21-first-screw','S25-context','S25-receivers','S25-route-0','S25-route-1','S25-route-2','S25-route-3','S25-route-4','S25-route-5','S25-route-6','S25--1-connection','S25--1-retainer','S26-supported-raise','S28--1-intro','S28--1-D7-dowels','S28--1-D7-join','S28--1-D7-bolts','S29-1-bolt','S29-supported-open','final-fold-legs','final-close','final-closed','final-open','final-deploy-legs','final-result']);
let cursor=0;
export const fullReviewCheckpoints:RenderCheckpoint[]=fullPlan.steps.flatMap(step=>step.shots.flatMap(shot=>{
  const start=cursor;cursor+=shot.duration;
  return selected.has(shot.id)?[{name:`review-${shot.id}.png`,time:start+shot.duration*.8}]:[];
}));
