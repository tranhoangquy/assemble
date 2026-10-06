/** Offline artifact generation only; never import this into the browser. */
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fullPlan, fullVideo} from './steps21-31';
import {fullProduct} from '../product/parts-step21-31';
import {applyFrontStaging} from './front-staging';
import {auditCameraDistance} from './camera-distance-audit';

const destination=join(process.cwd(),'output/wf311613-standalone-murphy-bed/reviews/director-polish-01');
mkdirSync(destination,{recursive:true});
const plan=applyFrontStaging(fullPlan);
const result=auditCameraDistance(plan,fullVideo,fullProduct,fullPlan);
writeFileSync(join(destination,'camera-distance-audit.json'),JSON.stringify(result,null,2));
const csvField=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`;
writeFileSync(join(destination,'camera-distance-audit.csv'),[
  ['step','shot','scale','start','end','changed','oldCameraDistanceCm','newCameraDistanceCm','oldUsefulCoverage','newUsefulCoverage','subjectIds','reason'].map(csvField).join(','),
  ...result.shots.map(shot=>[shot.step,shot.shot,shot.scale,shot.start,shot.end,shot.changed,
    shot.before.cameraDistance,shot.after.cameraDistance,shot.before.dominantCoverage,shot.after.dominantCoverage,shot.subjectIds.join(' | '),shot.reason].map(csvField).join(',')),
].join('\n'));
// Serialised product-owned directing data avoids another mesh compilation and
// validation pass at browser module evaluation. The offline audit owns it.
writeFileSync(join(process.cwd(),'src/products/wf311613-standalone-murphy-bed/director/polish-camera-overrides.json'),JSON.stringify({
  cameraPresets:result.cameraPresets,shotCameras:result.shotCameras,
  source:'Generated offline from camera-distance-audit.ts; no geometry/actions/timing data.',
},null,2));
console.log(JSON.stringify({shots:result.shots.length,steps:result.steps,changed:result.shots.filter(shot=>shot.changed).length,
  distanceChanges:result.shots.filter(shot=>shot.changed&&shot.scale==='WORKING_MEDIUM').map(shot=>({step:shot.step,shot:shot.shot,oldDistance:shot.before.cameraDistance,newDistance:shot.after.cameraDistance})),
  output:join(destination,'camera-distance-audit.json')},null,2));
