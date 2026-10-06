import * as THREE from 'three';
import { gsap } from 'gsap';
import type { AnimationAction, ConnectionReference, MoveAction } from '@/types/assembly';
import type { PartDefinition } from '@/types/product';
import type { CameraEngine } from '@/engine/camera/CameraEngine';
import type { ObjectRegistry } from '@/engine/product/ObjectRegistry';

const DEG = Math.PI / 180;

export class ActionExecutor {
  constructor(
    private registry: ObjectRegistry,
    private parts: Map<string, PartDefinition>,
    private camera?: CameraEngine,
    /** Optional exact path observation for roots later owned by constraints. */
    private observeResolvedMove?: (action: MoveAction, at: number) => void,
  ) {}

  add(timeline: gsap.core.Timeline, action: AnimationAction, sceneOffset: number): void {
    const at = sceneOffset + (action.at ?? 0);
    const duration = action.duration ?? 0;
    const ease = action.ease ?? 'power2.inOut';

    if (action.type === 'wait') return;
    if (action.type === 'camera') {
      if (!this.camera) return;
      const from = action.from ? this.camera.preset(action.from) : undefined;
      const to = this.camera.preset(action.to);
      const updateCamera = () => {
        if (!this.camera) return;
        this.camera.setViewAccess(to);
        this.camera.camera.lookAt(this.camera.controls.target);
        this.camera.controls.update();
      };
      if (from) {
        timeline.fromTo(this.camera.camera.position, { x: from.position[0], y: from.position[1], z: from.position[2] }, { x: to.position[0], y: to.position[1], z: to.position[2], duration, ease, immediateRender: false }, at);
        timeline.fromTo(this.camera.controls.target, { x: from.target[0], y: from.target[1], z: from.target[2] }, { x: to.target[0], y: to.target[1], z: to.target[2], duration, ease, immediateRender: false, onUpdate: updateCamera }, at);
        timeline.fromTo(this.camera.camera, { fov: from.fov ?? 35 }, { fov: to.fov ?? 35, duration, ease, onUpdate: () => this.camera?.camera.updateProjectionMatrix(), immediateRender: false }, at);
      } else {
        timeline.to(this.camera.camera.position, { x: to.position[0], y: to.position[1], z: to.position[2], duration, ease }, at);
        timeline.to(this.camera.controls.target, { x: to.target[0], y: to.target[1], z: to.target[2], duration, ease, onUpdate: updateCamera }, at);
        timeline.to(this.camera.camera, { fov: to.fov ?? 35, duration, ease, onUpdate: () => this.camera?.camera.updateProjectionMatrix() }, at);
      }
      return;
    }
    if (action.type === 'explode') {
      for (const [id, part] of this.parts) {
        if (!part.explodeOffset) continue;
        const object = this.registry.get(id);
        const baseline = this.registry.baseline(id);
        if (!object || !baseline) continue;
        timeline.to(object.position, {
          x: baseline.position.x + part.explodeOffset[0] * action.amount,
          y: baseline.position.y + part.explodeOffset[1] * action.amount,
          z: baseline.position.z + part.explodeOffset[2] * action.amount,
          duration,
          ease,
        }, at);
      }
      return;
    }
    if (action.type === 'ghost') {
      const ghost = this.registry.get(`__ghost:${action.target}`);
      if (!ghost) {
        console.warn(`[AnimationEngine] Ghost target unavailable for "${action.target}"`);
        return;
      }
      timeline.set(ghost, { visible: action.visible }, at);
      return;
    }
    if (action.type === 'visibility') {
      const ids = action.targets === 'all'
        ? [...this.parts].filter(([, part]) => part.type === 'mesh').map(([id]) => id)
        : action.targets;
      for (const id of ids) {
        const target = this.registry.get(id);
        if (target) timeline.set(target, { visible: action.visible }, at);
      }
      return;
    }
    if (action.type === 'focus' || action.type === 'clearFocus') {
      for (const [id, part] of this.parts) {
        if (part.type !== 'mesh') continue;
        const partObject = this.registry.get(id);
        if (!partObject) continue;
        for (const material of this.materials(partObject)) {
          timeline.to(material, {
            opacity: 1,
            emissiveIntensity: 0,
            duration: duration || 0.35,
            ease: 'power2.inOut',
          }, at);
        }
      }
      return;
    }

    if (action.type === 'testPivot' || action.type === 'testMechanism') {
      const object = this.registry.get(action.target);
      if (!object) return;
      const factor = action.unit === 'rad' ? 1 : DEG;
      const baseline = this.registry.baseline(action.target);
      const from = (action.from ?? ((baseline?.rotation[action.axis] ?? 0) / factor)) * factor;
      const to = action.to * factor;
      const back = (action.returnTo ?? action.from ?? from / factor) * factor;
      const half = duration / 2;
      timeline.fromTo(object.rotation, { [action.axis]: from }, { [action.axis]: to, duration: half, ease, immediateRender: false }, at);
      timeline.to(object.rotation, { [action.axis]: back, duration: half, ease }, at + half);
      return;
    }

    if (action.type === 'installPart' || action.type === 'alignPart' || action.type === 'insertPart' || action.type === 'installBracket' || action.type === 'installHinge') {
      const object = this.registry.get(action.target);
      const baseline = this.registry.baseline(action.target);
      if (!object || !baseline) return;
      const destination = this.connectionDestination(action.target, action.connection, action.targetPoint) ?? baseline.position.clone();
      if(action.installation?.seatedOffset)destination.add(new THREE.Vector3(...action.installation.seatedOffset));
      const direction = action.installation?.approachDirection
        ? new THREE.Vector3(...action.installation.approachDirection).normalize()
        : this.connectionDirection(action.target, action.connection);
      const distance = action.installation?.approachDistance ?? action.approachDistance ?? 18;
      const offset = action.installation?.stagingOffset
        ? new THREE.Vector3(...action.installation.stagingOffset)
        : action.fromOffset ? new THREE.Vector3(...action.fromOffset) : direction.clone().multiplyScalar(distance * 2.5);
      const start = destination.clone().add(offset);
      const preInstall = action.installation?.preInstallOffset
        ? destination.clone().add(new THREE.Vector3(...action.installation.preInstallOffset))
        : start.clone().lerp(destination.clone().add(direction.clone().multiplyScalar(distance)), 0.55);
      const aligned = destination.clone().add(direction.clone().multiplyScalar(distance));
      this.observeResolvedMove?.({ type: 'move', target: action.target,
        from: start.toArray(), to: preInstall.toArray(), duration: duration * 0.42, ease }, at);
      this.observeResolvedMove?.({ type: 'move', target: action.target,
        from: preInstall.toArray(), to: aligned.toArray(), duration: duration * 0.34, ease: 'power2.inOut' }, at + duration * 0.42);
      this.observeResolvedMove?.({ type: 'move', target: action.target,
        from: aligned.toArray(), to: destination.toArray(), duration: duration * 0.24, ease: 'power2.in' }, at + duration * 0.76);
      timeline.set(object, { visible: true }, at);
      timeline.fromTo(object.position, { x: start.x, y: start.y, z: start.z }, {
        x: preInstall.x, y: preInstall.y, z: preInstall.z, duration: duration * 0.42, ease, immediateRender: false,
      }, at);
      timeline.to(object.position, { x: aligned.x, y: aligned.y, z: aligned.z, duration: duration * 0.34, ease: 'power2.inOut' }, at + duration * 0.42);
      timeline.to(object.position, { x: destination.x, y: destination.y, z: destination.z, duration: duration * 0.24, ease: 'power2.in' }, at + duration * 0.76);
      return;
    }

    if (action.type === 'installScrew' || action.type === 'installBolt' || action.type === 'installNut' || action.type === 'installDowel' || action.type === 'installWasher') {
      const object = this.registry.get(action.target);
      const baseline = this.registry.baseline(action.target);
      if (!object || !baseline) return;
      const destination = this.connectionDestination(action.target, action.connection, action.targetPoint) ?? baseline.position.clone();
      if(action.installation?.seatedOffset)destination.add(new THREE.Vector3(...action.installation.seatedOffset));
      const direction = action.installation?.approachDirection
        ? new THREE.Vector3(...action.installation.approachDirection).normalize()
        : this.connectionDirection(action.target, action.connection);
      const distance = action.installation?.approachDistance ?? action.distance ?? (action.type === 'installWasher' ? 12 : 24);
      const start = destination.clone().add(action.installation?.stagingOffset ? new THREE.Vector3(...action.installation.stagingOffset) : direction.clone().multiplyScalar(distance));
      const preInstall = action.installation?.preInstallOffset ? destination.clone().add(new THREE.Vector3(...action.installation.preInstallOffset)) : undefined;
      timeline.set(object, { visible: true }, at);
      if (action.installation?.mechanicalPhases) {
        const weights = action.installation.motionTiming ?? { approach: 0.35, contact: 0.10, feed: 0.50, seat: 0.05 };
        const total = weights.approach + weights.contact + weights.feed + weights.seat;
        if (!Number.isFinite(total) || total <= 0 || Object.values(weights).some(value => value < 0)) throw new Error('Invalid hardware phase weights');
        const approach = weights.approach / total;
        const feedStart = (weights.approach + weights.contact) / total;
        const feed = weights.feed / total;
        const contact = destination.clone().add(direction.clone().multiplyScalar(action.installation.contactDistance??(action.type === 'installBolt' ? 1.8 : 0.7)));
        timeline.fromTo(object.position, { x: start.x, y: start.y, z: start.z }, { x: contact.x, y: contact.y, z: contact.z, duration: duration * approach, ease: 'power2.inOut', immediateRender: false }, at);
        // Deliberate alignment/contact hold, then screw-feed; no spinning in free space.
        timeline.to(object.position, { x: destination.x, y: destination.y, z: destination.z, duration: duration * feed, ease: 'none' }, at + duration * feedStart);
        if (action.type !== 'installWasher') {
          const axis = action.spinAxis ?? 'y';
          const baseQuaternion = new THREE.Quaternion().setFromEuler(baseline.rotation);
          const spindle = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
          const spin = { angle: 0 };
          timeline.fromTo(spin, { angle: 0 }, { angle: (action.turns ?? 0) * Math.PI * 2, duration: duration * feed, ease: 'none', immediateRender: false,
            onUpdate: () => object.quaternion.copy(baseQuaternion).premultiply(new THREE.Quaternion().setFromAxisAngle(spindle, spin.angle)),
          }, at + duration * feedStart);
        }
        return;
      }
      if (preInstall) {
        timeline.fromTo(object.position, { x: start.x, y: start.y, z: start.z }, { x: preInstall.x, y: preInstall.y, z: preInstall.z, duration: duration * 0.58, ease, immediateRender: false }, at);
        timeline.to(object.position, { x: destination.x, y: destination.y, z: destination.z, duration: duration * 0.42, ease: 'power1.in' }, at + duration * 0.58);
      } else {
        timeline.fromTo(object.position, { x: start.x, y: start.y, z: start.z }, {
          x: destination.x, y: destination.y, z: destination.z, duration, ease: action.type === 'installWasher' ? ease : 'power1.inOut', immediateRender: false,
        }, at);
      }
      if (action.type !== 'installWasher') {
        const spinAxis = action.spinAxis ?? 'y';
        const turns = action.turns ?? (action.type === 'installDowel' ? 0.5 : 4);
        timeline.fromTo(object.rotation, { [spinAxis]: baseline.rotation[spinAxis] }, {
          [spinAxis]: baseline.rotation[spinAxis] + turns * Math.PI * 2, duration, ease: 'none', immediateRender: false,
        }, at);
      }
      return;
    }

    const object = this.registry.get(action.target);
    if (!object) {
      console.warn(`[AnimationEngine] Unknown target "${action.target}"`);
      return;
    }
    const baseline = this.registry.baseline(action.target);

    switch (action.type) {
      case 'geometryVariant':{
        const variants=object.userData.geometryVariants as Record<string,THREE.BufferGeometry>|undefined;
        const mesh=object.children.find(c=>c instanceof THREE.Mesh) as THREE.Mesh|undefined;
        if(!variants?.[action.variant]||!mesh)throw new Error(`Missing geometry variant ${action.target}.${action.variant}`);
        timeline.set(mesh,{geometry:variants[action.variant]},at);break;
      }
      case 'move':
        if (action.from) timeline.fromTo(object.position, { x: action.from[0], y: action.from[1], z: action.from[2] }, { x: action.to[0], y: action.to[1], z: action.to[2], duration, ease, immediateRender: false }, at);
        else timeline.to(object.position, { x: action.to[0], y: action.to[1], z: action.to[2], duration, ease }, at);
        break;
      case 'scale':
        if (action.from) timeline.fromTo(object.scale, { x: action.from[0], y: action.from[1], z: action.from[2] }, { x: action.to[0], y: action.to[1], z: action.to[2], duration, ease, immediateRender: false }, at);
        else timeline.to(object.scale, { x: action.to[0], y: action.to[1], z: action.to[2], duration, ease }, at);
        break;
      case 'rotate': {
        const factor = action.unit === 'rad' ? 1 : DEG;
        if(action.space==='world'&&action.axis&&typeof action.to==='number'&&baseline){
          const spindle=new THREE.Vector3(action.axis==='x'?1:0,action.axis==='y'?1:0,action.axis==='z'?1:0);
          const base=new THREE.Quaternion().setFromEuler(baseline.rotation),spin={angle:0};
          timeline.fromTo(spin,{angle:(typeof action.from==='number'?action.from:0)*factor},{angle:action.to*factor,duration,ease,immediateRender:false,onUpdate:()=>object.quaternion.copy(base).premultiply(new THREE.Quaternion().setFromAxisAngle(spindle,spin.angle))},at);
          break;
        }
        if (action.axis) {
          const from = typeof action.from === 'number' ? action.from * factor : baseline?.rotation[action.axis] ?? 0;
          const to = typeof action.to === 'number' ? action.to * factor : 0;
          timeline.fromTo(object.rotation, { [action.axis]: from }, { [action.axis]: to, duration, ease, immediateRender: false }, at);
        } else if (Array.isArray(action.to)) {
          const to = action.to.map((value) => value * factor);
          const from = Array.isArray(action.from) ? action.from.map((value) => value * factor) : undefined;
          if (from) timeline.fromTo(object.rotation, { x: from[0], y: from[1], z: from[2] }, { x: to[0], y: to[1], z: to[2], duration, ease, immediateRender: false }, at);
          else timeline.to(object.rotation, { x: to[0], y: to[1], z: to[2], duration, ease }, at);
        }
        break;
      }
      case 'show':
        timeline.set(object, { visible: true }, at);
        break;
      case 'hide':
        timeline.set(object, { visible: false }, at);
        break;
      case 'highlight': {
        const materials = this.materials(object);
        for (const material of materials) {
          timeline.to(material, { emissiveIntensity: action.intensity ?? 0.65, duration: Math.min(0.35, duration || 0.35), ease: 'power2.out' }, at);
          timeline.to(material.emissive, { r: new THREE.Color(action.color ?? '#ff8b4c').r, g: new THREE.Color(action.color ?? '#ff8b4c').g, b: new THREE.Color(action.color ?? '#ff8b4c').b, duration: Math.min(0.35, duration || 0.35) }, at);
          if (duration > 0.4) timeline.to(material, { emissiveIntensity: 0, duration: 0.35 }, at + duration - 0.35);
        }
        break;
      }
      case 'unhighlight':
        for (const material of this.materials(object)) timeline.to(material, { emissiveIntensity: 0, duration: duration || 0.25 }, at);
        break;
      case 'screw': {
        const start = baseline?.position.clone() ?? object.position.clone();
        start[action.axis] += action.distance;
        const endRotation = (baseline?.rotation[action.axis] ?? object.rotation[action.axis]) + action.turns * Math.PI * 2;
        timeline.fromTo(object.position, { x: start.x, y: start.y, z: start.z }, { x: baseline?.position.x ?? object.position.x, y: baseline?.position.y ?? object.position.y, z: baseline?.position.z ?? object.position.z, duration, ease, immediateRender: false }, at);
        timeline.to(object.rotation, { [action.axis]: endRotation, duration, ease: 'none' }, at);
        break;
      }
    }
  }

  private connectionDirection(targetId: string, reference: ConnectionReference): THREE.Vector3 {
    const hostPart = this.parts.get(reference.part);
    const point = hostPart?.connectionPoints?.find((candidate) => candidate.id === reference.point);
    const host = this.registry.get(reference.part);
    const target = this.registry.get(targetId);
    if (!point || !host || !target) return new THREE.Vector3(0, 0, 1);
    host.updateWorldMatrix(true, false);
    target.parent?.updateWorldMatrix(true, false);
    const direction = new THREE.Vector3(...point.normal).normalize();
    direction.applyQuaternion(host.getWorldQuaternion(new THREE.Quaternion()));
    if (target.parent) {
      const inverseParent = target.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
      direction.applyQuaternion(inverseParent);
    }
    return direction.normalize();
  }

  private connectionDestination(targetId: string, reference: ConnectionReference, targetPointId?: string): THREE.Vector3 | undefined {
    const baseline = this.registry.baseline(targetId);
    if (!targetPointId) return baseline?.position.clone();
    const hostPart = this.parts.get(reference.part);
    const targetPart = this.parts.get(targetId);
    const hostPoint = hostPart?.connectionPoints?.find((candidate) => candidate.id === reference.point);
    const targetPoint = targetPart?.connectionPoints?.find((candidate) => candidate.id === targetPointId);
    const host = this.registry.get(reference.part);
    const target = this.registry.get(targetId);
    if (!hostPoint || !targetPoint || !host || !target) return baseline?.position.clone();
    host.updateWorldMatrix(true, false);
    target.updateWorldMatrix(true, false);
    const hostWorld = host.localToWorld(new THREE.Vector3(...hostPoint.position));
    const targetOffset = new THREE.Vector3(...targetPoint.position)
      .multiply(target.scale)
      .applyQuaternion(target.getWorldQuaternion(new THREE.Quaternion()));
    const targetWorldOrigin = hostWorld.sub(targetOffset);
    if (!target.parent) return targetWorldOrigin;
    target.parent.updateWorldMatrix(true, false);
    return target.parent.worldToLocal(targetWorldOrigin);
  }

  private materials(object: THREE.Object3D): THREE.MeshStandardMaterial[] {
    const result: THREE.MeshStandardMaterial[] = [];
    for (const child of object.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) if (material instanceof THREE.MeshStandardMaterial) result.push(material);
    }
    return result;
  }
}
