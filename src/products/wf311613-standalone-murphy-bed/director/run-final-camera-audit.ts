/** Final read-only measurements. This deliberately leaves the proposal JSON
 * unchanged and never manufactures a second round of camera overrides. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {polishPlan,polishVideo} from './polish-pass01';
import {fullPlan,fullVideo} from './steps21-31';
import {fullProduct} from '../product/parts-step21-31';
import {auditCameraDistance} from './camera-distance-audit';

const result=auditCameraDistance(polishPlan,polishVideo,fullProduct,fullPlan,
  {generateOverrides:false,cameraAlreadyRelocated:true,comparisonVideo:fullVideo});
const directory=join(process.cwd(),'output/wf311613-standalone-murphy-bed/reviews/director-polish-01');
mkdirSync(directory,{recursive:true});
writeFileSync(join(directory,'final-camera-audit.json'),JSON.stringify(result,null,2));
const undersized=result.shots.filter(shot=>shot.scale==='WORKING_MEDIUM'&&shot.after.dominantCoverage>0&&shot.after.dominantCoverage<.65);
const intersections=result.shots.filter(shot=>shot.sensorIntersections.length);
console.log(JSON.stringify({shots:result.shots.length,samples:result.steps.reduce((sum,step)=>sum+step.sampleCount,0),
  undersized:undersized.map(shot=>({step:shot.step,shot:shot.shot,coverage:shot.after.dominantCoverage})),
  sensorIntersections:intersections.map(shot=>({step:shot.step,shot:shot.shot,hits:shot.sensorIntersections})),
  artifact:join(directory,'final-camera-audit.json')},null,2));
