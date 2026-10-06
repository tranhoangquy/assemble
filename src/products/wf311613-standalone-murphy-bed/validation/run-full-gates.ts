import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {AssemblyValidator} from '@/engine/assembly/AssemblyValidator';
import {fullProduct} from '../product/parts-step21-31';
import {fullPlan,fullAssembly} from '../director/steps21-31';
import {validateFullHardwareFits,validateFullMechanics,validateFullSeekReset} from './full-validation';
import {validateFoldingLegFunction} from './folding-leg-validation';
import {validateBearingReceiverPaths,evaluateAttachedPistonSweep} from './pivot-search';
import {validateB8Face} from './b8-validation';
import {validateSteps11To20Paths} from './steps11-20-validation';
import {validateStep28ActualPaths} from './step28-access-validation';

async function main(){
  const report:Record<string,unknown>={product:fullProduct.id,plan:fullPlan.id};
  let valid=true;
  const gates={assembly:()=>AssemblyValidator.validate(fullProduct,fullAssembly),
    structuralPaths:()=>validateSteps11To20Paths(fullProduct,fullPlan),
    mechanics:validateFullMechanics,hardware:validateFullHardwareFits,
    step28ActualPaths:validateStep28ActualPaths,foldingLegs:()=>validateFoldingLegFunction(.25),
    receiverPaths:validateBearingReceiverPaths,pistons:()=>evaluateAttachedPistonSweep(.25),
    wholeSceneReset:validateFullSeekReset,b8:validateB8Face};
  for(const [name,run]of Object.entries(gates)){
    const result=run();report[name]=result;valid&&=result.valid;
    console.log(name,JSON.stringify(result,(key,value)=>key==='info'?undefined:value));
  }
  report.valid=valid;
  report.runtime=fullPlan.steps.reduce((sum,s)=>sum+s.shots.reduce((n,shot)=>n+shot.duration,0),0);
  report.stepDurations=fullPlan.steps.map(s=>({step:s.step,seconds:s.shots.reduce((n,shot)=>n+shot.duration,0)}));
  const directory=path.resolve('output/wf311613-standalone-murphy-bed/reviews/full-assembly/foot-corner-qa');
  await mkdir(directory,{recursive:true});
  await writeFile(path.join(directory,'validation-results.json'),JSON.stringify(report,null,2));
  if(!valid)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
