import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {AssemblyValidator} from '@/engine/assembly/AssemblyValidator';
import {fullProduct} from '../product/parts-step21-31';
import {fullPlan} from '../director/steps21-31';
import {polishPlan,polishRuntime} from '../director/polish-pass01';
import {polish02Plan,polish02Assembly,polish02Video,polish02Runtime,polish02Showcase} from '../director/polish-pass02';
import {groundedPlacement,groundedCompletedPivot} from '../director/grounded-workspace';
import {presentationNameRows,pdfPartNames,hardwareNames} from '../presentation/labels';
import {createFullRuntime,validateFullHardwareFits,validateFullMechanics,validateFullSeekReset} from './full-validation';
import {validateFoldingLegFunction} from './folding-leg-validation';
import {validateBearingReceiverPaths,evaluateAttachedPistonSweep} from './pivot-search';
import {validateB8Face} from './b8-validation';
import {validateSteps11To20Paths} from './steps11-20-validation';
import {validateStep28ActualPaths} from './step28-access-validation';
import {validateFrontStaging} from './front-staging-validation';

const hash=(data:unknown)=>createHash('sha256').update(JSON.stringify(data)).digest('hex');
const directory='output/wf311613-standalone-murphy-bed/reviews/director-polish-02';
/** Video-only showcase is replayed using the same engine for the SAME gate
 * suite. This audit copy does not register an extra PDF step or a product. */
const audit=structuredClone(polish02Plan);
audit.steps[30].shots.push(...polish02Showcase.map(s=>({id:s.id,type:'VERIFY_CONNECTION' as const,duration:s.duration,camera:s.camera,actions:s.actions})));
function floorGate(){
  const rt=createFullRuntime(true,polish02Plan),errors=new Set<string>();let samples=0,minY=Infinity;
  const bedRoot=rt.registry.require('bed-motion-root');
  const visible=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(!p.visible)return false;return true;};
  const isBed=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(p===bedRoot)return true;return false;};
  try{
    for(const step of polish02Plan.steps.slice(10,24))for(const shot of step.shots){
      const t=rt.shots.get(shot.id)!;
      for(let i=0;i<=24;i++){
        rt.engine.seek(t.start+t.duration*i/24);rt.root.updateMatrixWorld(true);samples++;
        for(const [id,o]of rt.registry.entries()){
          const mesh=o.children[0];if(!(mesh instanceof THREE.Mesh)||!visible(mesh)||!isBed(mesh))continue;
          let low=mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld).min.y;
          if(low<-.005){low=Infinity;const p=mesh.geometry.getAttribute('position');const v=new THREE.Vector3();for(let j=0;j<p.count;j++)low=Math.min(low,v.fromBufferAttribute(p,j).applyMatrix4(mesh.matrixWorld).y);}
          minY=Math.min(minY,low);if(low<-.005)errors.add(`${shot.id}: ${id} enters floor by ${(-low).toFixed(4)}`);
        }
      }
    }
    return {valid:!errors.size,errors:[...errors],samples,minY,tolerance:.005};
  }finally{rt.dispose();}
}
function propsFitGate(){
  const rt=createFullRuntime(true,audit),errors:string[]=[],config=polish02Video.presentation!.finishedBedroom!;
  const [x,y,z]=config.mattress.center,[w,h,d]=config.mattress.size;
  // Includes the piping beyond the softened main mattress envelope.
  const mattress=new THREE.Box3(new THREE.Vector3(x-w/2-.06,y-h/2,z-d/2-.06),new THREE.Vector3(x+w/2+.06,y+h/2,z+d/2+.06));
  const duvet=new THREE.Box3(new THREE.Vector3(x-(w-3)/2,y+h/2,z-d*.10-d*.74/2),new THREE.Vector3(x+(w-3)/2,y+h/2+3.2,z-d*.10+d*.74/2));
  const boxes=[['mattress',mattress],['duvet',duvet]] as const;
  const clearances:Record<string,number>={};
  try{
    rt.engine.seek(rt.duration-.00001);rt.root.updateMatrixWorld(true);
    for(const name of ['C8-left','C8-right','C9','D1','C2-left','C2-right','D3--1','D3-1','D6--1','D6-1','D7--1','D7-1']){
      const o=rt.registry.get(name);if(!o)continue;const bounds=new THREE.Box3().setFromObject(o);
      for(const [id,b]of boxes)if(b.clone().expandByScalar(-.001).intersectsBox(bounds))errors.push(`${id} penetrates ${name}`);
      clearances[name]=Math.sqrt(mattress.distanceToPoint(bounds.getCenter(new THREE.Vector3()))**2);
    }
    let maxSupportGap=0;
    for(let i=0;i<5;i++){const slat=new THREE.Box3().setFromObject(rt.registry.require(`D2-${i}`));maxSupportGap=Math.max(maxSupportGap,Math.abs(mattress.min.y-slat.max.y));}
    if(maxSupportGap>.001)errors.push('Mattress does not rest on support slats');
    // Room furnishings are outside the entire bed/cabinet moving envelope.
    const tableMinX=Math.abs(config.bedsideTable.center[0])-config.bedsideTable.size[0]/2;
    const plantMinX=Math.abs(config.plant.center[0])-26;
    if(tableMinX<125||plantMinX<125)errors.push('Room furnishing enters product silhouette envelope');
    return {valid:!errors.length,errors,authority:'PRESENTATION ESTIMATE',mattress:config.mattress,maxSupportGap,sideClearance:111.2-w/2-.06,endClearance:96.4-d/2-.06,tableMinX,plantMinX,clearances};
  }finally{rt.dispose();}
}
async function main(){
  const report:Record<string,unknown>={candidate:polish02Plan.id,runtime:polish02Runtime,assemblyRuntime:polishRuntime};let valid=true;
  const gates={locks:()=>({valid:hash(fullProduct)==='29ef4258730c3e3691c84223d98e240d9a25854d079402377f97489ace5f9fb5'&&hash(fullProduct.materials)==='d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc'&&hash(fullPlan)==='8f6e7f76addeebfa9fc2a95b15298e348e8e1f3ba314956736ee118f094d7bc7'&&polish02Plan.steps.every((s,i)=>s.shots.every((shot,j)=>shot.id===polishPlan.steps[i].shots[j].id&&shot.duration===polishPlan.steps[i].shots[j].duration)),errors:[],productHash:hash(fullProduct),materialHash:hash(fullProduct.materials)}),
    assembly:()=>AssemblyValidator.validate(fullProduct,polish02Assembly),structuralPaths:()=>validateSteps11To20Paths(fullProduct,polish02Plan),
    groundedFloor:floorGate,
    frontStaging:()=>validateFrontStaging(polish02Plan,90,{placement:groundedPlacement,pivot:groundedCompletedPivot}),
    mechanics:()=>validateFullMechanics(audit),hardware:()=>validateFullHardwareFits(audit),
    step28:()=>validateStep28ActualPaths(audit),foldingLegs:()=>validateFoldingLegFunction(.25,audit),
    receiverPaths:()=>validateBearingReceiverPaths(audit),pistons:()=>evaluateAttachedPistonSweep(.25,audit),
    seekReset:()=>validateFullSeekReset(audit),b8:validateB8Face,presentationFit:propsFitGate,
    captions:()=>{const errors=polish02Video.reviewCaptions!.filter(c=>/\b[A-E]\d+\b|receiver|collision|rigidity|reconstruct|validator|deterministic|mesh|Option/.test(c.title+' '+c.note)).map(c=>c.title);return{valid:!errors.length,errors,decisions:polish02Video.reviewCaptions!.length,omitted:polish02Video.reviewCaptions!.filter(c=>c.hidden).length};},
  };
  await mkdir(directory,{recursive:true});
  for(const[name,run]of Object.entries(gates)){const result=run();report[name]=result;valid&&=result.valid;console.log(name,JSON.stringify({valid:result.valid,errors:result.errors}));await writeFile(`${directory}/validation-results.json`,JSON.stringify({...report,valid,complete:false},null,2));}
  await writeFile(`${directory}/validation-results.json`,JSON.stringify({...report,valid,complete:true,planSha256:hash(polish02Plan),videoSha256:hash(polish02Video)},null,2));
  await writeFile(`${directory}/presentation-names.json`,JSON.stringify({pdfPartNames,hardwareNames,instances:presentationNameRows},null,2));
  if(!valid)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
