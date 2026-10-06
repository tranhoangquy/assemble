import fs from 'node:fs';
import {AssemblyValidator} from '/Users/quyth/development/three/POC/src/engine/assembly/AssemblyValidator';
import {fullProduct} from '/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/product/parts-step21-31';
import {polish02Plan,polish02Assembly,polish02Showcase} from '/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/director/polish-pass02';
import {validateFullMechanics,validateFullHardwareFits,validateFullSeekReset} from '/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/validation/full-validation';
import {validateSteps11To20Paths} from '/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/validation/steps11-20-validation';
import {validateStep28ActualPaths} from '/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/validation/step28-access-validation';
import {validateFoldingLegFunction} from '/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/validation/folding-leg-validation';
import {validateBearingReceiverPaths,evaluateAttachedPistonSweep} from '/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/validation/pivot-search';
import {validateB8Face} from '/Users/quyth/development/three/POC/src/products/wf311613-standalone-murphy-bed/validation/b8-validation';
const plan=structuredClone(polish02Plan);plan.steps[30].shots.push(...polish02Showcase.map(s=>({id:s.id,type:'VERIFY_CONNECTION' as const,duration:s.duration,camera:s.camera,actions:s.actions})));
const gates:any={assembly:()=>AssemblyValidator.validate(fullProduct,polish02Assembly),hardware:()=>validateFullHardwareFits(plan),structuralPaths:()=>validateSteps11To20Paths(fullProduct,polish02Plan),mechanics:()=>validateFullMechanics(plan),step28:()=>validateStep28ActualPaths(plan),foldingLegs:()=>validateFoldingLegFunction(.25,plan),receiverPaths:()=>validateBearingReceiverPaths(plan),pistons:()=>evaluateAttachedPistonSweep(.25,plan),seekReset:()=>validateFullSeekReset(plan),b8:validateB8Face};
const report:any={};for(const [key,run]of Object.entries(gates)){console.log('START',key);const result=(run as Function)();report[key]=result;fs.writeFileSync('output/wf311613-standalone-murphy-bed/final/product-fit-hole-audit/mechanical-gates.json',JSON.stringify(report,null,2));console.log(key,JSON.stringify({valid:result.valid,errors:result.errors}));if(!result.valid){process.exitCode=1;break;}}
