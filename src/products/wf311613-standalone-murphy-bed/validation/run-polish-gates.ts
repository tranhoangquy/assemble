/** Runs the SAME mechanical gates on the NEW directing variant. No baseline
 * substitution, relaxed thresholds or new collision exemptions. */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {AssemblyValidator} from '@/engine/assembly/AssemblyValidator';
import {fullProduct} from '../product/parts-step21-31';
import {fullPlan} from '../director/steps21-31';
import {polishPlan,polishAssembly,polishStepDurations,polishRuntime} from '../director/polish-pass01';
import {validateFullHardwareFits,validateFullMechanics,validateFullSeekReset} from './full-validation';
import {validateFoldingLegFunction} from './folding-leg-validation';
import {validateBearingReceiverPaths,evaluateAttachedPistonSweep} from './pivot-search';
import {validateB8Face} from './b8-validation';
import {validateSteps11To20Paths} from './steps11-20-validation';
import {validateStep28ActualPaths} from './step28-access-validation';
import {validateFrontStaging} from './front-staging-validation';

async function main(){
  const hash=(data:unknown)=>createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const productHash=hash(fullProduct),materialsHash=hash(fullProduct.materials),baselinePlanHash=hash(fullPlan);
  const locks={valid:productHash==='4645bcf33682cbf377d84a2d0f8139674b6d80f5a5014a29505bf97287f82a45'
    &&materialsHash==='d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc'
    &&baselinePlanHash==='9836e1ca75e4910b46c9e9d51ffb4ba2f0a7c78667dcb4297cd3772afc65d7b0',
    productHash,materialsHash,baselinePlanHash};
  const report:Record<string,unknown>={product:fullProduct.id,plan:polishPlan.id,locks};
  let valid=locks.valid;
  const gates={assembly:()=>AssemblyValidator.validate(fullProduct,polishAssembly),
    structuralPaths:()=>validateSteps11To20Paths(fullProduct,polishPlan),
    frontStagingActualMeshes:()=>validateFrontStaging(polishPlan),
    mechanics:()=>validateFullMechanics(polishPlan),hardware:()=>validateFullHardwareFits(polishPlan),
    step28ActualPaths:()=>validateStep28ActualPaths(polishPlan),foldingLegs:()=>validateFoldingLegFunction(.25,polishPlan),
    receiverPaths:()=>validateBearingReceiverPaths(polishPlan),pistons:()=>evaluateAttachedPistonSweep(.25,polishPlan),
    wholeSceneReset:()=>validateFullSeekReset(polishPlan),b8:validateB8Face};
  for(const [name,run]of Object.entries(gates)){
    const result=run();report[name]=result;valid&&=result.valid;
    console.log(name,JSON.stringify({valid:result.valid,errors:result.errors}));
  }
  report.valid=valid;report.runtime=polishRuntime;report.stepDurations=polishStepDurations;
  const directory=path.resolve('output/wf311613-standalone-murphy-bed/reviews/director-polish-01');
  await mkdir(directory,{recursive:true});
  await writeFile(path.join(directory,'validation-results.json'),JSON.stringify(report,null,2));
  if(!valid)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
