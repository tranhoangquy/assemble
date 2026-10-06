/** Additional presentation-fit check only; existing engineering gates untouched. */
import {writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {duvetGeometry,mattressPiping} from '@/presentation/finished-bedroom/ResidentialBedroom';
import {polish02Plan} from '../director/polish-pass02';
import {polish02bVideo} from '../director/polish-pass02b';
import {createFullRuntime} from '../validation/full-validation';
async function main(){
  const config=polish02bVideo.presentation!.finishedBedroom!,[w,h,d]=config.mattress.size;
  const rt=createFullRuntime(true,polish02Plan),errors:string[]=[];
  const quilt=duvetGeometry(w-3,d*.74),piping=mattressPiping(w,d,h/2-2);
  quilt.computeBoundingBox();piping.computeBoundingBox();
  const q=quilt.boundingBox!.clone().translate(new THREE.Vector3(config.mattress.center[0],config.mattress.center[1]+h/2+.38,config.mattress.center[2]-d*.1));
  const m=new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...config.mattress.center),new THREE.Vector3(w+.12,h+.06,d+.12));
  const cover=new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(config.mattress.center[0],config.mattress.center[1]+h/2+.19,config.mattress.center[2]),new THREE.Vector3(w-.7,.35,d-.7));
  try{
    rt.engine.seek(rt.duration-.00001);rt.root.updateMatrixWorld(true);
    for(const id of ['C8-left','C8-right','C9','D1','C2-left','C2-right','D3--1','D3-1','D6--1','D6-1','D7--1','D7-1']){
      const part=rt.registry.get(id);if(!part)continue;const b=new THREE.Box3().setFromObject(part);
      for(const[name,prop]of [['mattress',m],['duvet',q],['fitted cover',cover]] as const)if(prop.intersectsBox(b))errors.push(`${name} penetrates ${id}`);
    }
    const tableClear=Math.abs(config.bedsideTable.center[0])-config.bedsideTable.size[0]/2;
    const plantClear=Math.abs(config.plant.center[0])-26;
    const curtainClear=config.decor!.window.center[0]-config.decor!.window.size[0]/2-11-27/2;
    const artClear=Math.abs(config.decor!.art.center[0])-config.decor!.art.size[0]/2;
    for(const[name,x]of [['table',tableClear],['plant',plantClear],['curtains',curtainClear],['art',artClear]] as const)if(x<125)errors.push(`${name} enters product span`);
    if(piping.boundingBox!.max.x>w/2+.06||piping.boundingBox!.max.z>d/2+.06)errors.push('Piping leaves approved horizontal fit envelope');
    const report={valid:!errors.length,errors,authority:'PRESENTATION ESTIMATE',mattress:config.mattress,
      duvetBounds:{min:q.min.toArray(),max:q.max.toArray()},pipingBounds:{min:piping.boundingBox!.min.toArray(),max:piping.boundingBox!.max.toArray()},
      roomXClearances:{table:tableClear,plant:plantClear,curtains:curtainClear,art:artClear}};
    await writeFile('output/wf311613-standalone-murphy-bed/reviews/director-polish-02b/presentation-fit.json',JSON.stringify(report,null,2));console.log(report);if(!report.valid)process.exitCode=1;
  }finally{quilt.dispose();piping.dispose();rt.dispose();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
