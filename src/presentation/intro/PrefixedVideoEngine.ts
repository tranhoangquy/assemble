import {gsap} from 'gsap';
import * as THREE from 'three';
import type {AssemblyDefinition} from '@/types/assembly';
import type {VideoDefinition} from '@/types/video';
import type {ProductTree} from '@/engine/product/ProductEngine';
import type {ObjectRegistry,SceneStateSnapshot} from '@/engine/product/ObjectRegistry';
import type {CameraEngine} from '@/engine/camera/CameraEngine';
import {VideoEngine,type VideoEngineCallbacks} from '@/engine/video/VideoEngine';
import {SceneEngine} from '@/engine/video/SceneEngine';
import {introPhase} from './definition';

/** Opt-in presentation wrapper; the original engine evaluates the original
 * assembly on its original local clock. No installation action is rewritten. */
export class PrefixedVideoEngine extends VideoEngine {
  override readonly scenes:SceneEngine;
  override readonly totalDuration:number;
  private clock:gsap.core.Timeline;
  private assembled:SceneStateSnapshot;
  private prior?:SceneStateSnapshot;
  private priorCamera?:{position:THREE.Vector3;target:THREE.Vector3;fov:number};
  constructor(private registry:ObjectRegistry,tree:ProductTree,assembly:AssemblyDefinition,
    private video:VideoDefinition,private camera:CameraEngine,private callbacks:VideoEngineCallbacks={}){
    const base={...video,intro:undefined,scenes:video.scenes.filter(s=>s.phase!=='intro')};
    super(registry,tree,assembly,base,camera);
    this.scenes=new SceneEngine(video,assembly);this.totalDuration=this.scenes.totalDuration;
    // Evaluate forward exactly once, then restore canonical Step 1 before
    // storing any presentation displacement. Real mesh variants/links retained.
    super.seek(0);super.seek(video.intro!.assembledTime);
    this.assembled=registry.captureState();super.seek(0);
    this.clock=gsap.timeline({paused:true}).to({},{duration:this.totalDuration});
    this.clock.eventCallback('onUpdate',()=>{this.evaluate(this.time);callbacks.onTime?.(this.time);});
    this.clock.eventCallback('onComplete',callbacks.onComplete??null);
  }
  override get time(){return this.clock?.time()??0;}
  override get playing(){return this.clock.isActive()&&!this.clock.paused();}
  private leaveIntro(){
    if(!this.prior)return;
    this.registry.restoreState(this.prior);this.prior=undefined;
    const c=this.priorCamera!;
    this.camera.camera.position.copy(c.position);this.camera.controls.target.copy(c.target);
    this.camera.camera.fov=c.fov;this.camera.camera.updateProjectionMatrix();this.camera.controls.update();
    this.priorCamera=undefined;
  }
  private evaluate(time:number){
    const intro=this.video.intro!;
    if(time>=intro.duration||introPhase(intro,time).transition){
      this.leaveIntro();super.seek(Math.max(0,time-intro.duration));return;
    }
    if(!this.prior){
      this.prior=this.registry.captureState();
      this.priorCamera={position:this.camera.camera.position.clone(),target:this.camera.controls.target.clone(),fov:this.camera.camera.fov};
    }
    this.registry.restoreState(this.assembled);
    const state=introPhase(intro,time);
    if(!state.hero){
      for(const id of intro.hiddenTargets)this.registry.require(id).visible=false;
      // World-axis translations are converted to the existing parent space;
      // no reparenting, part scaling, decorative spin or mechanism solving.
      for(const group of intro.groups)for(const id of group.targets){
        const object=this.registry.require(id),delta=new THREE.Vector3(...group.worldOffset).multiplyScalar(state.separation);
        object.parent?.updateWorldMatrix(true,false);
        if(object.parent){const inv=object.parent.matrixWorld.clone().invert();delta.applyMatrix4(inv).sub(new THREE.Vector3().applyMatrix4(inv));}
        object.position.add(delta);
      }
    }
    this.camera.apply(state.hero?intro.heroCamera:intro.explodedCamera);
  }
  override seek(time:number){const at=Math.max(0,Math.min(time,this.totalDuration));this.clock.time(at,true).pause();this.evaluate(at);this.callbacks.onTime?.(at);}
  override renderFrame(time:number){this.seek(time);}
  override reset(){this.seek(0);}
  override play(){this.clock.play();}
  override pause(){this.clock.pause();}
  override toggle(){if(this.playing)this.pause();else this.play();}
  override restart(){this.seek(0);this.play();}
  override dispose(){this.leaveIntro();this.clock.kill();super.dispose();}
}

/** Existing room props/lighting receive their unchanged ORIGINAL clock. */
export function presentationTime(video:VideoDefinition,time:number){
  if(video.editorial){
    let start=0;
    for(const [index,scene] of video.scenes.entries()){
      if(time<start+scene.duration||index===video.scenes.length-1){
        const segment=video.editorial.segments.find(s=>s.sceneId===scene.id)!;
        const u=Math.max(0,Math.min(1,(time-start)/scene.duration));
        return presentationTime(video.editorial.source,segment.sourceIn+(segment.sourceOut-segment.sourceIn)*u);
      }
      start+=scene.duration;
    }
  }
  const intro=video.intro;if(!intro)return time;
  if(time>=intro.duration)return time-intro.duration;
  const state=introPhase(intro,time);
  return state.transition?0:state.hero?intro.assembledTime:intro.explodedEnvironmentTime;
}
