/** Read-only audit: never automatically refit export cameras. */
import {writeFileSync} from 'node:fs';
import {polish02Plan,polish02Video} from './polish-pass02';
import {polishPlan,polishVideo} from './polish-pass01';
import {fullProduct} from '../product/parts-step21-31';
import {auditCameraDistance} from './camera-distance-audit';
const result=auditCameraDistance(polish02Plan,polish02Video,fullProduct,polishPlan,{generateOverrides:false,cameraAlreadyRelocated:true,comparisonVideo:polishVideo});
writeFileSync('output/wf311613-standalone-murphy-bed/reviews/director-polish-02/final-camera-audit.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({shots:result.shots.length,sensorIntersections:result.shots.filter(s=>s.sensorIntersections.length).map(s=>({shot:s.shot,hits:s.sensorIntersections})),undersized:result.shots.filter(s=>s.scale==='WORKING_MEDIUM'&&s.after.dominantCoverage>0&&s.after.dominantCoverage<.65).map(s=>({shot:s.shot,coverage:s.after.dominantCoverage}))}));
