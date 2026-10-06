/** Offline-only framing refinement after actual still QA. No physical part,
 * connection, action, duration or baseline camera dictionary is modified. */
import * as THREE from 'three';
import type {DirectorPlan} from '@/types/director';
import type {Vector3Tuple} from '@/types/product';
import type {CameraPreset,VideoDefinition} from '@/types/video';
import {fullProduct} from '../product/parts-step21-31';
import {createFullRuntime} from '../validation/full-validation';
import {actualVisibleMeshPoints,fitWorking,measureCameraFraming} from './camera-distance-audit';

interface CameraFitAudit {
  shots:string[];camera:string;subjectIds:string[];
  samples:Array<{shot:string;time:number}>;
  beforeDistance:number;afterDistance:number;afterCoverage:number;
  afterFrame:{minX:number;maxX:number;minY:number;maxY:number};note:string;
}
export function fitPolishPresentationCameras(plan:DirectorPlan,video:VideoDefinition){
  const rt=createFullRuntime(true,plan),cameraPresets:Record<string,CameraPreset>={},shotCameras:Record<string,string>={},audit:CameraFitAudit[]=[];
  const allProduct=fullProduct.parts.filter(part=>part.type==='mesh'&&part.id!=='installation-wall').map(part=>part.id);
  const shotMap=new Map(plan.steps.flatMap(step=>step.shots.map(shot=>[shot.id,shot] as const)));
  function fit(id:string,shots:string[],direction:Vector3Tuple,subjects=allProduct,fov=55){
    const points:THREE.Vector3[]=[],samples:Array<{shot:string;time:number}>=[];
    for(const shot of shots){
      const timing=rt.shots.get(shot);if(!timing)throw new Error(`Missing presentation fit shot ${shot}`);
      for(const fraction of [.08,.5,.92]){
        const time=timing.start+timing.duration*fraction;rt.engine.seek(time);rt.root.updateMatrixWorld(true);
        points.push(...actualVisibleMeshPoints(subjects,rt.registry));samples.push({shot,time});
      }
    }
    if(!points.length)throw new Error(`No actual visible subject for presentation fit ${id}`);
    const prior=video.cameraPresets[shotMap.get(shots[0])!.camera!];
    const base={...prior,position:new THREE.Vector3(...prior.target).add(new THREE.Vector3(...direction)).toArray() as Vector3Tuple};
    const preset=fitWorking(points,base,fov,.78);cameraPresets[id]=preset;for(const shot of shots)shotCameras[shot]=id;
    const measured=measureCameraFraming(points,preset);
    audit.push({shots,camera:id,subjectIds:subjects,samples,
      beforeDistance:new THREE.Vector3(...prior.position).distanceTo(new THREE.Vector3(...prior.target)),
      afterDistance:measured.cameraDistance,afterCoverage:measured.dominantCoverage,
      afterFrame:{minX:measured.minX,maxX:measured.maxX,minY:measured.minY,maxY:measured.maxY},
      note:'Sampled actual visible generated mesh envelope; front-side cut, caption-safe. The wall is excluded from fit.'});
  }
  try{
    fit('polish01-actual-front-context',['S25-context'],[.58,.85,-1.8]);
    fit('polish01-actual-front-orient',['S25-route-4'],[.58,.65,-1.8]);
    fit('polish01-actual-front-align',['S25-route-5'],[.58,.50,-1.8]);
    fit('polish01-actual-front-connected',['S25-complete'],[.58,.50,-1.8]);
    fit('polish01-actual-raised-context',['S26-supported-raise','S27-small-test-out','S27-small-test-return','S27-complete','final-close','final-closed'],[.58,.42,-1.8]);
    fit('polish01-actual-final-open',['final-result'],[.58,.85,-1.8]);
    // Retain the useful link mounting angle. Fit only the moving/installed metal
    // plate + its pilot neighborhood, not the full tall timber receiver host.
    for(const [step,side,plate]of [[9,1,'D9'],[10,-1,'D8']] as const)
      fit(`polish01-actual-${plate}-link`,[`S${step}-introduce`,`S${step}-target`,`S${step}-seat-link`],[-side*1.8,.50,-1.1],[plate],45);
    // Existing anchor macros looked from behind an opaque installation wall.
    // Change ONLY the side of the view, keeping exact optics/working distance.
    for(const [step,side]of [[30,-1],[31,1]] as const)for(const index of [0,1]){
      const oldId=`S${step}-${index}-anchor`,prior=video.cameraPresets[oldId];
      if(!prior)throw new Error(`Missing accepted anchor camera ${oldId}`);
      const direction=new THREE.Vector3(side*1.8,.55,-.9).normalize();
      const distance=new THREE.Vector3(...prior.position).distanceTo(new THREE.Vector3(...prior.target));
      const id=`polish01-front-${oldId}`;
      cameraPresets[id]={...prior,position:new THREE.Vector3(...prior.target).addScaledVector(direction,distance).toArray() as Vector3Tuple};
      const shots=[`S${step}-${index}-target`,`S${step}-${index}-bracket`,`S${step}-${index}-cabinet-screws`,`S${step}-${index}-wall-screw`,`S${step}-${index}-secured`];
      for(const shot of shots)shotCameras[shot]=id;
      audit.push({shots,camera:id,subjectIds:[`S${step}-H15-${index}`],samples:[],beforeDistance:distance,afterDistance:distance,
        afterCoverage:0,afterFrame:{minX:0,maxX:0,minY:0,maxY:0},note:'Front side of opaque wall; exact accepted macro working distance and FOV retained, no part hidden.'});
    }
    return{cameraPresets,shotCameras,audit,source:'Generated offline from actual world meshes at 8%,50%,92%; camera-only visual QA correction. No product changes.'};
  }finally{rt.dispose();}
}
