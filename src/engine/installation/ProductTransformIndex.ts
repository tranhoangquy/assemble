import * as THREE from 'three';
import type { PartDefinition, ProductDefinition, Vector3Tuple } from '@/types/product';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';

const DEG = Math.PI / 180;

export class ProductTransformIndex {
  readonly parts: Map<string, PartDefinition>;
  private readonly matrices = new Map<string, THREE.Matrix4>();
  private readonly compoundBounds=new WeakMap<object,THREE.Box3>();

  constructor(private readonly product: ProductDefinition, private readonly rotations?: Map<string,Vector3Tuple>) {
    this.parts = new Map(product.parts.map((part) => [part.id, part]));
  }

  worldMatrix(id: string): THREE.Matrix4 {
    const cached = this.matrices.get(id);
    if (cached && !this.rotations) return cached.clone();
    const part = this.parts.get(id);
    if (!part) return new THREE.Matrix4();
    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(...part.position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(this.rotations?.get(id) ?? part.rotation ?? [0, 0, 0]).map((value) => value * DEG) as [number, number, number])),
      new THREE.Vector3(...(part.scale ?? [1, 1, 1])),
    );
    const world = part.parent ? this.worldMatrix(part.parent).multiply(local) : local;
    this.matrices.set(id, world.clone());
    return world;
  }

  worldPosition(id: string): THREE.Vector3 {
    return new THREE.Vector3().setFromMatrixPosition(this.worldMatrix(id));
  }

  connectionWorld(partId: string, pointId: string): THREE.Vector3 | undefined {
    const part = this.parts.get(partId);
    const point = part?.connectionPoints?.find((candidate) => candidate.id === pointId);
    return point ? new THREE.Vector3(...point.position).applyMatrix4(this.worldMatrix(partId)) : undefined;
  }

  connectionNormalWorld(partId: string, pointId: string): THREE.Vector3 | undefined {
    const part = this.parts.get(partId);
    const point = part?.connectionPoints?.find((candidate) => candidate.id === pointId);
    if (!point) return undefined;
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(this.worldMatrix(partId));
    return new THREE.Vector3(...point.normal).normalize().applyQuaternion(quaternion).normalize();
  }

  boxAtFinal(id: string): THREE.Box3 | undefined {
    const part = this.parts.get(id);
    if (!part || part.type !== 'mesh') return undefined;
    return this.localBox(part).applyMatrix4(this.worldMatrix(id));
  }

  boxAtPosition(id: string, position: THREE.Vector3): THREE.Box3 | undefined {
    const part = this.parts.get(id);
    if (!part || part.type !== 'mesh') return undefined;
    const matrix = this.worldMatrix(id);
    matrix.setPosition(position);
    return this.localBox(part).applyMatrix4(matrix);
  }

  ancestors(id: string): Set<string> {
    const result = new Set<string>();
    let current = this.parts.get(id)?.parent;
    while (current) {
      result.add(current);
      current = this.parts.get(current)?.parent;
    }
    return result;
  }

  descendants(id: string): Set<string> {
    const result = new Set<string>();
    const visit = (parent: string) => {
      for (const part of this.product.parts) {
        if (part.parent !== parent) continue;
        result.add(part.id);
        visit(part.id);
      }
    };
    visit(id);
    return result;
  }

  rotatedSubtreeBox(id: string, axis: 'x' | 'y' | 'z', angle: number, included?: Set<string>): THREE.Box3 | undefined {
    const pivot = this.worldPosition(id);
    const localAxis = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
    const rootRotation = new THREE.Quaternion().setFromRotationMatrix(this.worldMatrix(id));
    const rotation = new THREE.Quaternion().setFromAxisAngle(localAxis.applyQuaternion(rootRotation).normalize(), angle);
    const result = new THREE.Box3();
    let found = false;
    for (const descendant of this.descendants(id)) {
      if (included && !included.has(descendant)) continue;
      const box = this.boxAtFinal(descendant);
      if (!box) continue;
      const corners = [
        [box.min.x, box.min.y, box.min.z], [box.min.x, box.min.y, box.max.z],
        [box.min.x, box.max.y, box.min.z], [box.min.x, box.max.y, box.max.z],
        [box.max.x, box.min.y, box.min.z], [box.max.x, box.min.y, box.max.z],
        [box.max.x, box.max.y, box.min.z], [box.max.x, box.max.y, box.max.z],
      ];
      for (const corner of corners) result.expandByPoint(new THREE.Vector3(...corner as [number, number, number]).sub(pivot).applyQuaternion(rotation).add(pivot));
      found = true;
    }
    return found ? result : undefined;
  }

  rotatedBoxAround(partId: string, pivotId: string, axis: 'x' | 'y' | 'z', angle: number): THREE.Box3 | undefined {
    const box = this.boxAtFinal(partId);
    if (!box) return undefined;
    const pivot = this.worldPosition(pivotId);
    const localAxis = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
    const rootRotation = new THREE.Quaternion().setFromRotationMatrix(this.worldMatrix(pivotId));
    const rotation = new THREE.Quaternion().setFromAxisAngle(localAxis.applyQuaternion(rootRotation).normalize(), angle);
    const result = new THREE.Box3();
    for (const [x, y, z] of [
      [box.min.x, box.min.y, box.min.z], [box.min.x, box.min.y, box.max.z],
      [box.min.x, box.max.y, box.min.z], [box.min.x, box.max.y, box.max.z],
      [box.max.x, box.min.y, box.min.z], [box.max.x, box.min.y, box.max.z],
      [box.max.x, box.max.y, box.min.z], [box.max.x, box.max.y, box.max.z],
    ]) result.expandByPoint(new THREE.Vector3(x, y, z).sub(pivot).applyQuaternion(rotation).add(pivot));
    return result;
  }

  private localBox(part: Extract<PartDefinition, { type: 'mesh' }>): THREE.Box3 {
    const geometry = part.geometry;
    if(geometry.type==='compound'){
      let bounds=this.compoundBounds.get(geometry);
      if(!bounds){const g=GeometryFactory.create(geometry);g.computeBoundingBox();bounds=g.boundingBox!.clone();g.dispose();this.compoundBounds.set(geometry,bounds);}
      return bounds.clone();
    }
    if(geometry.type==='profile-prism'){
      const points=geometry.points.map(([a,b])=>geometry.axis==='x'?new THREE.Vector3(0,a,b):geometry.axis==='y'?new THREE.Vector3(a,0,-b):new THREE.Vector3(a,b,0));
      const box=new THREE.Box3().setFromPoints(points),axis=geometry.axis??'z';
      box.min[axis]=-geometry.depth/2;box.max[axis]=geometry.depth/2;return box;
    }
    let size: THREE.Vector3;
    if (geometry.type === 'box' || geometry.type === 'bored-panel') size = new THREE.Vector3(...geometry.size);
    else if(geometry.type==='tabbed-stile')size=new THREE.Vector3(geometry.size[0],geometry.size[1]+2*geometry.tabHeight,geometry.size[2]);
    else if (geometry.type === 'socket-bolt' || geometry.type === 'horizontal-cam' || geometry.type === 'fluted-dowel') size = new THREE.Vector3(geometry.radius * (geometry.type === 'socket-bolt' ? 4.1 : 2), geometry.height + 0.3, geometry.radius * (geometry.type === 'socket-bolt' ? 4.1 : 2));
    else if (geometry.type === 'cylinder') size = new THREE.Vector3(geometry.radius * 2, geometry.height, geometry.radius * 2);
    else if (geometry.type === 'sphere') size = new THREE.Vector3(geometry.radius * 2, geometry.radius * 2, geometry.radius * 2);
    else if (geometry.type === 'screw') size = new THREE.Vector3(geometry.headRadius * 2, geometry.length, geometry.headRadius * 2);
    else if (geometry.type === 'washer') size = new THREE.Vector3(geometry.outerRadius * 2, geometry.thickness, geometry.outerRadius * 2);
    else if (geometry.type === 'nut') size = new THREE.Vector3(geometry.outerRadius * 2, geometry.thickness, geometry.outerRadius * 2);
    else size = new THREE.Vector3(1, 1, 1);
    return new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), size);
  }
}
