import { gsap } from 'gsap';
import * as THREE from 'three';
import type { AnimationAction } from '@/types/assembly';
import type { PartDefinition } from '@/types/product';
import type { CameraEngine } from '@/engine/camera/CameraEngine';
import type { ObjectRegistry, SceneStateSnapshot } from '@/engine/product/ObjectRegistry';
import { ActionExecutor } from './ActionExecutor';
import {MechanismSolver} from './MechanismSolver';

export class AnimationEngine {
  readonly timeline = gsap.timeline({ paused: true });
  private executor: ActionExecutor;
  private mechanisms:MechanismSolver;
  private visibilityEvents:Array<{at:number;ids:string[];visible:boolean}>=[];
  private canonicalZero?: SceneStateSnapshot;
  private angularEvents:Array<{at:number;action:AnimationAction&{target:string}}>=[];
  private cameraEvents:Array<{at:number;action:Extract<AnimationAction,{type:'camera'}>}>=[];

  constructor(private registry: ObjectRegistry,private parts: Map<string, PartDefinition>,private camera?: CameraEngine) {
    this.mechanisms=new MechanismSolver(registry);
    this.executor = new ActionExecutor(registry, parts, camera, (action, at) => this.mechanisms.observeMove(action, at));
  }

  addActions(actions: AnimationAction[], offset = 0): void {
    this.canonicalZero = undefined;
    for (const action of actions) {
      const at=offset+(action.at??0);
      if(action.type==='camera')this.cameraEvents.push({at,action});
      if('target'in action&&['rotate','pivotPose','testPivot','testMechanism','screw','installScrew','installBolt','installNut','installDowel'].includes(action.type))this.angularEvents.push({at,action});
      if(action.type==='move')this.mechanisms.observeMove(action,at);
      if(action.type==='pivotPose'||action.type==='telescopicLink'){
        this.mechanisms.add(action,at);this.timeline.to({},{duration:action.duration??0},at);continue;
      }
      if(action.type==='visibility')this.visibilityEvents.push({at,ids:action.targets==='all'?[...this.parts].filter(([,p])=>p.type==='mesh').map(([id])=>id):action.targets,visible:action.visible});
      else if(action.type==='ghost')this.visibilityEvents.push({at,ids:[`__ghost:${action.target}`],visible:action.visible});
      else if(action.type==='show'||action.type==='hide')this.visibilityEvents.push({at,ids:[action.target],visible:action.type==='show'});
      else if(['installPart','alignPart','insertPart','installBracket','installHinge','installScrew','installBolt','installNut','installDowel','installWasher'].includes(action.type)&&'target'in action)this.visibilityEvents.push({at,ids:[action.target],visible:true});
      this.executor.add(this.timeline, action, offset);
    }
    this.visibilityEvents.sort((a,b)=>a.at-b.at); // Stable order for events at the same timestamp.
    this.angularEvents.sort((a,b)=>a.at-b.at);
    this.cameraEvents.sort((a,b)=>a.at-b.at);
  }

  play(): void { if (!this.canonicalZero) this.seek(this.timeline.time()); this.timeline.play(); }
  pause(): void { this.timeline.pause(); }
  resume(): void { if (!this.canonicalZero) this.seek(this.timeline.time()); this.timeline.resume(); }
  restart(): void { this.seek(0); this.timeline.play(); }
  /** GSAP zero-duration setters can restore a stale visibility capture when
   * seeking backwards across another setter. Resolve discrete state by time,
   * while leaving GSAP's physical transforms and timings unchanged. */
  syncVisibility():void {
    for(const [id,o]of this.registry.entries()){const b=this.registry.baseline(id);if(b)o.visible=b.visible;}
    const time=this.timeline.time();
    for(const e of this.visibilityEvents){if(e.at>time+1e-8)break;for(const id of e.ids){const o=this.registry.get(id);if(o)o.visible=e.visible;}}
    // GSAP rounds direct numeric tween values to six decimal places. A
    // rounded PI/2 tilts long, exactly mating boards enough to open seams.
    // Preserve the exact declared terminal orientation; active rotations,
    // hardware spin and later articulated constraints retain ownership.
    const angular=new Map<string,typeof this.angularEvents[number]>();
    for(const e of this.angularEvents){if(e.at>time+1e-8)break;angular.set(e.action.target,e);}
    for(const {at,action}of angular.values()){
      if(action.type!=='rotate'||time<at+(action.duration??0)-1e-8)continue;
      const object=this.registry.require(action.target),factor=action.unit==='rad'?1:Math.PI/180;
      if(Array.isArray(action.to))object.rotation.set(action.to[0]*factor,action.to[1]*factor,action.to[2]*factor);
      else if(action.axis){
        if(action.space==='world'){
          const baseline=this.registry.baseline(action.target)!;
          const axis=new THREE.Vector3(action.axis==='x'?1:0,action.axis==='y'?1:0,action.axis==='z'?1:0);
          object.quaternion.copy(new THREE.Quaternion().setFromEuler(baseline.rotation)).premultiply(new THREE.Quaternion().setFromAxisAngle(axis,action.to*factor));
        }else object.rotation[action.axis]=action.to*factor;
      }
    }
    this.mechanisms.sync(time);
    // Camera position, target and lens are independent GSAP tracks. A backward
    // seek may run the target callback before the final position track rewinds,
    // leaving lookAt based on a stale sensor position. Reconcile orientation
    // once ALL tracks have reached the requested time. Presets/timing stay intact.
    if(this.camera){
      let active:typeof this.cameraEvents[number]|undefined;
      for(const event of this.cameraEvents){if(event.at>time+1e-8)break;active=event;}
      if(active)this.camera.setViewAccess(this.camera.preset(active.action.to));
      this.camera.camera.lookAt(this.camera.controls.target);
      this.camera.controls.update();
      this.camera.camera.updateProjectionMatrix();
      this.camera.camera.updateMatrixWorld(true);
    }
  }
  seek(time: number, suppressEvents = false): void {
    const at = Math.max(0, time);
    if (!this.canonicalZero) {
      // time(0) is a no-op on a new paused timeline. Evaluate its exact first
      // frame once, before future tween startAt values have been captured.
      // Never approximate the first frame with an epsilon-time seek.
      this.timeline.render(0, false, true).pause();
      this.syncVisibility();
      this.canonicalZero = this.registry.captureState();
    }
    this.timeline.time(at, suppressEvents).pause();
    this.syncVisibility();
    // Repeated zero renders can rewind initialized future fromTo tweens after
    // the t0 staging setters and leave stale transforms behind. Restore the
    // complete evaluated t0 checkpoint, not just visibility or mechanisms.
    if (at === 0) this.registry.restoreState(this.canonicalZero);
  }
  duration(): number { return this.timeline.duration(); }
  dispose(): void { this.timeline.kill(); this.canonicalZero = undefined; }
}
