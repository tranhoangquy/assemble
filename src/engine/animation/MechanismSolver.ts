import * as THREE from 'three';
import { gsap } from 'gsap';
import type { LinkAnchor, PivotPoseAction, TelescopicLinkAction, MoveAction } from '@/types/assembly';
import type { ObjectRegistry } from '@/engine/product/ObjectRegistry';

type Timed<T> = { at: number; action: T };

/** Pure time evaluation: scrubbing backwards and direct frame renders use the
 * same endpoint constraints as playback. No product IDs or geometry assumptions. */
export class MechanismSolver {
  private poses: Array<Timed<PivotPoseAction>> = [];
  private links: Array<Timed<TelescopicLinkAction>> = [];
  private moves: Array<Timed<MoveAction>> = [];

  constructor(private registry: ObjectRegistry) {}

  add(action: PivotPoseAction | TelescopicLinkAction, at: number) {
    if (action.type === 'pivotPose') this.poses.push({ at, action });
    else this.links.push({ at, action });
  }

  observeMove(action: MoveAction, at: number) { this.moves.push({ at, action }); }

  private progress(at: number, duration: number, time: number, ease = 'power2.inOut') {
    return gsap.parseEase(ease)(duration ? THREE.MathUtils.clamp((time - at) / duration, 0, 1) : 1);
  }

  private anchor(anchor: LinkAnchor) {
    const object = this.registry.require(anchor.part);
    object.updateWorldMatrix(true, false);
    return object.localToWorld(new THREE.Vector3(...anchor.point));
  }

  sync(time: number) {
    // The solver owns only these roots' position/orientation. Their ordinary
    // staging moves are replayed below; unrelated installed objects stay in GSAP.
    const ids = new Set([...this.poses, ...this.links].map(entry => entry.action.target));
    for (const id of ids) {
      const object = this.registry.require(id), baseline = this.registry.baseline(id);
      if (baseline) { object.position.copy(baseline.position); object.rotation.copy(baseline.rotation); }
    }

    // Reset only linkage-controlled scalar properties. In particular, seeking
    // before the first constraint must not retain a future piston extension.
    for (const { action } of this.links) {
      const rod = this.registry.require(action.rod), rodBaseline = this.registry.baseline(action.rod);
      const end = this.registry.require(action.end), endBaseline = this.registry.baseline(action.end);
      if (rodBaseline) { rod.position.y = rodBaseline.position.y; rod.scale.y = rodBaseline.scale.y; }
      if (endBaseline) end.position.y = endBaseline.position.y;
    }

    const operations = [...this.poses, ...this.moves.filter(entry => ids.has(entry.action.target))].sort((a, b) => a.at - b.at);
    for (const { at, action } of operations) {
      if (time < at) continue;
      const progress = this.progress(at, action.duration ?? 0, time, action.ease);
      const object = this.registry.require(action.target);
      if (action.type === 'move') {
        const start = action.from ? new THREE.Vector3(...action.from) : object.position.clone();
        object.position.copy(start.lerp(new THREE.Vector3(...action.to), progress));
      } else {
        const pivot = new THREE.Vector3(...action.from.pivot).lerp(new THREE.Vector3(...action.to.pivot), progress);
      const axis = Array.isArray(action.axis) ? new THREE.Vector3(...action.axis).normalize() : new THREE.Vector3(action.axis === 'x' ? 1 : 0, action.axis === 'y' ? 1 : 0, action.axis === 'z' ? 1 : 0);
        object.quaternion.setFromAxisAngle(axis, THREE.MathUtils.degToRad(THREE.MathUtils.lerp(action.from.angle, action.to.angle, progress)));
        object.position.copy(pivot.sub(new THREE.Vector3(...action.localPivot).multiply(object.scale).applyQuaternion(object.quaternion)));
      }
      object.updateWorldMatrix(true, true);
    }

    const active = new Map<string, Timed<TelescopicLinkAction>>();
    for (const entry of [...this.links].sort((a, b) => a.at - b.at)) {
      if (entry.at <= time) active.set(entry.action.target, entry);
    }
    for (const { at, action } of this.dependencyOrder(active)) {
      const start = this.anchor(action.anchorA);
      const free = start.clone().add(new THREE.Vector3(...action.freeOffset));
      const end = action.anchorB ? free.lerp(this.anchor(action.anchorB), this.progress(at, action.duration ?? 0, time, action.ease)) : free;
      const root = this.registry.require(action.target);
      root.parent?.updateWorldMatrix(true, false);
      const localStart = root.parent ? root.parent.worldToLocal(start.clone()) : start;
      const localEnd = root.parent ? root.parent.worldToLocal(end.clone()) : end;
      const delta = localEnd.sub(localStart);
      // Geometry lengths are expressed in root-local units, not world units.
      // Converting the endpoints first also handles rotated/scaled ancestors.
      const length = delta.length() / root.scale.y;
      if (!Number.isFinite(length) || root.scale.y <= 0 || length < action.bodyLength) {
        throw new Error(`Telescopic linkage ${action.target} over-compressed: ${length}`);
      }
      root.position.copy(localStart);
      root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
      const rod = this.registry.require(action.rod);
      rod.position.y = (length + action.bodyLength) / 2;
      rod.scale.y = length - action.bodyLength;
      this.registry.require(action.end).position.y = length;
      root.updateWorldMatrix(true, true);
    }
  }

  private dependencyOrder(active: Map<string, Timed<TelescopicLinkAction>>) {
    const result: Array<Timed<TelescopicLinkAction>> = [], done = new Set<string>(), visiting = new Set<string>();
    const visit = (id: string) => {
      if (done.has(id)) return;
      if (visiting.has(id)) throw new Error(`Circular telescopic linkage dependency: ${id}`);
      visiting.add(id);
      const entry = active.get(id)!;
      const root = this.registry.require(id);
      const dependencies = [root.parent, this.registry.require(entry.action.anchorA.part), entry.action.anchorB ? this.registry.require(entry.action.anchorB.part) : undefined];
      for (let object of dependencies) {
        while (object) {
          for (const otherId of active.keys()) {
            if (otherId !== id && this.registry.require(otherId) === object) visit(otherId);
          }
          object = object.parent;
        }
      }
      visiting.delete(id);
      done.add(id);
      result.push(entry);
    };
    for (const id of active.keys()) visit(id);
    return result;
  }
}
