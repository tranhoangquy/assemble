import type { ProductPackage, RenderCheckpoint } from '@/types/product-package';
import type { DirectorPlan } from '@/types/director';
import { product } from './product/product';
import { assembly } from './assembly/assembly';
import { directorPlan, reviewVideo } from './director/directorPlan';
import {step01V2Product,step01V2Assembly,step01V2Video,step01V2Plan} from './director/step01-v2';
import {step01PacedProduct,step01PacedAssembly,step01PacedVideo,step01PacedPlan} from './director/step01-paced';
import {step02PacedProduct,step02PacedAssembly,step02PacedVideo,step02PacedPlan} from './director/step02-paced';
import {step03CorrectedProduct,step03CorrectedAssembly,step03CorrectedVideo,step03CorrectedPlan} from './director/step03-corrected';
import {wf311613Product,wf311613Assembly,wf311613Video} from './legacy/package';
import {steps01To10Product} from './product/parts-step04-10';
import {steps01To10Plan,steps01To10Assembly,steps01To10Video} from './director/steps04-10';
import {b8ReviewCheckpoints} from './validation/b8-checkpoints';
import {steps01To20Product} from './product/parts-step11-20';
import {steps01To20Plan,steps01To20Assembly,steps01To20Video} from './director/steps11-20';
import {steps11To20Checkpoints} from './validation/steps11-20-checkpoints';
import {fullProduct} from './product/parts-step21-31';
import {fullPlan,fullAssembly,fullVideo} from './director/steps21-31';
import {fullReviewCheckpoints} from './validation/full-checkpoints';
import {polishPlan,polishAssembly,polishVideo,polishCheckpoints} from './director/polish-pass01';
import {polish02Plan,polish02Assembly,polish02Video,polish02Checkpoints} from './director/polish-pass02';
import {polish02bId,polish02bVideo,polish02bCheckpoints} from './director/polish-pass02b';
import {microId,microVideo,microCheckpoints} from './director/final-micro-pass';

export const productKey = 'wf311613-standalone-murphy-bed';
function checkpoints(plan: DirectorPlan): RenderCheckpoint[] {
  const selected = new Set(['dowel-macro','bolt-macro','result','R-bolt-macro','R-result','S3-seat-first-side','S3-close-second-side','S3-E3--1-bolt-start','S3-square-before-tightening','S3-complete']);
  const motionChecks=new Set(['S4-B8-4--1-seat','S4-B7-seat','S4-D4-1-seat','S4-D4-1--1-start','B2-left-align','B3-align','B1-rear-close','S7-H13-0-install','S8-cap-lift','S8-cap-above','S8-lower-align','S8-H12--1-0-install','S9-seat-link','S9-H21-0-install','S9-H21-9-install','S9-H14-0-install','S10-E5-seat','S10-H24-8-install','S10-H14-0-install']);
  let cursor = 0;
  return plan.steps.flatMap(step => step.shots.flatMap(shot => {
    const start=cursor,time = cursor + shot.duration * 0.8; cursor += shot.duration;
    const stills=selected.has(shot.id)||step.step>3&&(shot.type==='STEP_COMPLETE'||['S8-cap-above','S8-cap-seat','S9-seat-link','S9-H21-0-install','S10-H24-8-install','S7-H13-0-install'].includes(shot.id)) ? [{name:`step-${step.step}-${shot.id}.png`,time}] : [];
    if(step.step>3&&motionChecks.has(shot.id))for(const fraction of [.15,.5,.9])stills.push({name:`step-${step.step}-${shot.id}-${fraction}.png`,time:start+shot.duration*fraction});
    return stills;
  }));
}
const entry = (id:string,label:string,filename:string,reviewDirectory:string,product:ProductPackage['product'],assembly:ProductPackage['assembly'],video:ProductPackage['video'],plan?:DirectorPlan):ProductPackage => ({id,productKey,label,filename,reviewDirectory,product,assembly,video,directorPlan:plan,checkpoints:plan?checkpoints(plan):[]});
export const packages: readonly ProductPackage[] = [
  {...entry(polish02bId,'Standalone Murphy Bed · Director polish 02B · QA only','wf311613-director-polish-02b-review.mp4','director-polish-02b',fullProduct,polish02Assembly,polish02bVideo,polish02Plan),checkpoints:polish02bCheckpoints},
  {...entry(microId,'Standalone Murphy Bed · Final micro-pass · QA only','wf311613-final-micro-pass-review.mp4','final-micro-pass',fullProduct,polish02Assembly,microVideo,polish02Plan),checkpoints:microCheckpoints},
  {...entry(polish02Plan.id,'Standalone Murphy Bed · Director polish 02 · QA only','wf311613-director-polish-02-review.mp4','director-polish-02',fullProduct,polish02Assembly,polish02Video,polish02Plan),checkpoints:polish02Checkpoints},
  {...entry(polishPlan.id,'WF311613 · Director polish 01 · bedroom QA (not reviewed)','wf311613-director-polish-01-review.mp4','director-polish-01',fullProduct,polishAssembly,polishVideo,polishPlan),checkpoints:polishCheckpoints},
  {...entry(fullPlan.id,'WF311613 · Complete PDF Steps 1–31 director review','wf311613-full-assembly-review.mp4','full-assembly',fullProduct,fullAssembly,fullVideo,fullPlan),checkpoints:fullReviewCheckpoints},
  {...entry(steps01To20Plan.id,'WF311613 · Steps 1–20 paced director review','wf311613-steps-01-20-paced-review.mp4','steps-01-20',steps01To20Product,steps01To20Assembly,steps01To20Video,steps01To20Plan),checkpoints:[...steps11To20Checkpoints,...b8ReviewCheckpoints]},
  {...entry(steps01To10Plan.id,'WF311613 · Steps 1–10 paced director review','wf311613-steps-01-10-paced-review.mp4','steps-01-10',steps01To10Product,steps01To10Assembly,steps01To10Video,steps01To10Plan),checkpoints:[...checkpoints(steps01To10Plan),...b8ReviewCheckpoints]},
  entry(directorPlan.id,'WF311613 · Steps 1–3 faster hardware + assembly V2','wf311613-steps-01-03-action-speed-review-v2.mp4','steps-01-03',product,assembly,reviewVideo,directorPlan),
  entry('wf311613-steps01-03-corrected','WF311613 · corrected Step 3 axial mating','wf311613-steps01-03-corrected-checkpoint.mp4','step-03',step03CorrectedProduct,step03CorrectedAssembly,step03CorrectedVideo,step03CorrectedPlan),
  entry('wf311613-steps01-02-paced','WF311613 · paced Steps 1–2 work checkpoint','wf311613-steps01-02-paced-checkpoint.mp4','steps-01-02',step02PacedProduct,step02PacedAssembly,step02PacedVideo,step02PacedPlan),
  entry('wf311613-step01-pacing','WF311613 · Step 1 approved visual / faster pacing','wf311613-step-01-pacing-review.mp4','step-01',step01PacedProduct,step01PacedAssembly,step01PacedVideo,step01PacedPlan),
  entry('wf311613-step01-v2','WF311613 Standalone Murphy Bed · Step 1 V2 ONLY','wf311613-step-01-director-v2.mp4','step-01',step01V2Product,step01V2Assembly,step01V2Video,step01V2Plan),
  entry('wf311613-murphy-bed','WF311613 · Legacy Steps 1–10 (not current approval)','wf311613-steps-01-10-director-review.mp4','steps-01-10/legacy',wf311613Product,wf311613Assembly,wf311613Video),
];
