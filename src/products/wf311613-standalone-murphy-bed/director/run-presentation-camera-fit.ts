/** Offline generated directing data; never import this runner in the viewer. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {polishPlan,polishVideo} from './polish-pass01';
import {fitPolishPresentationCameras} from './presentation-camera-fit';

const result=fitPolishPresentationCameras(polishPlan,polishVideo);
writeFileSync(join(process.cwd(),'src/products/wf311613-standalone-murphy-bed/director/polish-presentation-cameras.json'),JSON.stringify({
  cameraPresets:result.cameraPresets,shotCameras:result.shotCameras,source:result.source,
},null,2));
const directory=join(process.cwd(),'output/wf311613-standalone-murphy-bed/reviews/director-polish-01');mkdirSync(directory,{recursive:true});
writeFileSync(join(directory,'presentation-camera-fit.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({cameras:Object.keys(result.cameraPresets).length,shots:Object.keys(result.shotCameras).length,
  audit:result.audit.map(row=>({camera:row.camera,oldDistance:row.beforeDistance,newDistance:row.afterDistance,coverage:row.afterCoverage,frame:row.afterFrame,shots:row.shots}))},null,2));
