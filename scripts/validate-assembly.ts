import { defaultProductId, getProductPackage } from '../src/products/registry';
import { AssemblyValidator } from '../src/engine/assembly/AssemblyValidator';
const entry=getProductPackage(process.env.PROJECT_ID ?? process.env.PRODUCT_ID ?? defaultProductId);
const result=AssemblyValidator.validate(entry.product,entry.assembly);
console.log(JSON.stringify({project:entry.id,valid:result.valid,stepsChecked:result.stepsChecked,operationsChecked:result.operationsChecked,errors:result.errors,warnings:result.warnings},null,2));
if(result.errors.length)process.exitCode=1;
