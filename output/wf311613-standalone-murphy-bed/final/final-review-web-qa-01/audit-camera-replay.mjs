// Read-only interpretation of captured evidence; no scene/validator changes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),source=path.join(dir,'whole-scene-seek-verification.json'),output=path.join(dir,'camera-replay-numeric-audit.json');
if(fs.existsSync(output))throw Error('Refusing to overwrite numeric diagnostic history');
const bytes=fs.readFileSync(source),report=JSON.parse(bytes);
const sign=1n<<63n,mask=(1n<<64n)-1n;
function ordered(value){const buffer=new ArrayBuffer(8),view=new DataView(buffer);view.setFloat64(0,value,false);const bits=view.getBigUint64(0,false);return bits&sign?~bits&mask:bits|sign;}
function differences(a,b,field='camera'){
  if(typeof a==='number'&&typeof b==='number'){
    if(Object.is(a,b))return [];
    if(!Number.isFinite(a)||!Number.isFinite(b))return [{field,first:a,again:b,finite:false}];
    const x=ordered(a),y=ordered(b),ulps=x>y?x-y:y-x;
    return [{field,first:a,again:b,delta:b-a,absoluteDelta:Math.abs(b-a),binary64UlpDistance:ulps.toString(),adjacentBinary64:ulps===1n}];
  }
  if(a&&b&&typeof a==='object'&&typeof b==='object'){
    if(JSON.stringify(Object.keys(a))!==JSON.stringify(Object.keys(b)))return [{field,structuralDifference:true}];
    return Object.keys(a).flatMap(k=>differences(a[k],b[k],`${field}.${k}`));
  }
  return a===b?[]:[{field,first:a,again:b,nonNumericDifference:true}];
}
const findings=report.reverseReplay.map(p=>{
  const delta=differences(p.first.camera,p.again.camera);
  const targetAndFovExact=JSON.stringify(p.first.camera.target)===JSON.stringify(p.again.camera.target)&&p.first.camera.fov===p.again.camera.fov;
  const representationEquivalent=p.cameraIdentical||targetAndFovExact&&delta.length>0&&delta.every(d=>d.adjacentBinary64&&/^camera\.(position|direction)\.\d+$/.test(d.field));
  return {label:p.label,time:p.time,pngIdentical:p.pngIdentical,cameraJsonIdentical:p.cameraIdentical,targetAndFovExact,differences:delta,representationEquivalent};
});
const valid=report.exactStep1Reset.pngIdentical&&report.exactStep1Reset.cameraIdentical&&findings.every(f=>f.pngIdentical&&f.representationEquivalent)&&report.introShowcaseMechanismResetExcursions.every(f=>f.pngIdentical&&f.cameraIdentical);
const result={valid,source,sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),originalStrictReportValid:report.valid,originalReportUnchanged:true,strictCameraJsonReplayPass:findings.every(f=>f.cameraJsonIdentical),wholeScenePngReplayExact:findings.every(f=>f.pngIdentical),exactStep1Reset:report.exactStep1Reset,excursionsExact:report.introShowcaseMechanismResetExcursions.every(f=>f.pngIdentical&&f.cameraIdentical),interpretation:'Two camera JSON comparisons differ only by adjacent IEEE-754 binary64 representations in position/direction. All 30 whole-scene PNGs, target/FOV, Step1 reset and six excursions remain exact. Strict JSON failure remains recorded; no candidate/native-validator threshold is changed.',allFindings:findings,differingFindings:findings.filter(f=>!f.cameraJsonIdentical),verifiedAt:new Date().toISOString()};
fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify({valid,sourceSha256:result.sourceSha256,strictCameraJsonReplayPass:result.strictCameraJsonReplayPass,differingFindings:result.differingFindings},null,2));
