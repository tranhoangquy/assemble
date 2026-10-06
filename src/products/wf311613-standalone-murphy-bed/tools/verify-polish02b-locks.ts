import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {polish02Plan,polish02Assembly,polish02Video} from '../director/polish-pass02';
import {polish02bVideo,polish02bRuntime,polish02bId} from '../director/polish-pass02b';
import {polishRuntime} from '../director/polish-pass01';
import {fullProduct} from '../product/parts-step21-31';
const dir='output/wf311613-standalone-murphy-bed/reviews/director-polish-02b';
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
async function main(){
  const sources:Record<string,string>=JSON.parse(await readFile(`${dir}/approved-source-locks.json`,'utf8'));
  const modified:string[]=[];
  for(const[p,sha]of Object.entries(sources))if(createHash('sha256').update(await readFile(p)).digest('hex')!==sha)modified.push(p);
  const old=polish02Video.presentation!,current=polish02bVideo.presentation!;
  const assemblyCameras=Object.fromEntries(Object.keys(polish02Video.cameraPresets).map(id=>[id,polish02bVideo.cameraPresets[id]]));
  const checks={approvedSourceFiles:modified.length===0,
    product:hash(fullProduct)==='4645bcf33682cbf377d84a2d0f8139674b6d80f5a5014a29505bf97287f82a45',
    materials:hash(fullProduct.materials)==='d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc',
    plan:hash(polish02Plan)==='bf43ecdb93c8a43dd50ea4a9e46306882902cbaf813e24438826f8585045e520',
    approvedVideo:hash(polish02Video)==='f68a4e76161af883c652191de4afd2a810bf315c68b2c31d1243f7464d496202',
    assemblyScenes:hash(polish02bVideo.scenes.slice(0,31))===hash(polish02Video.scenes.slice(0,31)),
    assemblyCameras:hash(assemblyCameras)===hash(polish02Video.cameraPresets),captions:polish02bVideo.reviewCaptions===polish02Video.reviewCaptions,
    assemblyEnvironment:old.environment===current.environment,assemblyExposure:old.exposure===current.exposure,
    mattressEnvelope:old.finishedBedroom!.mattress===current.finishedBedroom!.mattress,
    showcaseActions:polish02bVideo.scenes.slice(31).every((s,i)=>s.actions===polish02Video.scenes[i+31].actions&&s.duration===polish02Video.scenes[i+31].duration),
    propsAfterAssembly:current.finishedBedroom!.start===polishRuntime,assemblySteps:polish02Assembly.steps.length===31,
    silent:!polish02bVideo.audio?.music&&!polish02bVideo.audio?.voiceover};
  const report={candidate:polish02bId,valid:Object.values(checks).every(Boolean),checks,lockedSourceFiles:Object.keys(sources).length,modified,
    assemblyRuntime:polishRuntime,runtime:polish02bRuntime,planSha256:hash(polish02Plan),videoSha256:hash(polish02bVideo),
    mattress:current.finishedBedroom!.mattress,dimensionAuthority:'PRESENTATION ESTIMATE'};
  await writeFile(`${dir}/lock-verification.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
