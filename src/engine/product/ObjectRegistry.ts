import * as THREE from 'three';

interface ObjectSnapshot {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  visible: boolean;
  materials: Array<{ material: THREE.MeshStandardMaterial; emissive: THREE.Color; intensity: number }>;
  geometries:Array<{mesh:THREE.Mesh;geometry:THREE.BufferGeometry}>;
}

/** An evaluated scene checkpoint, separate from the installation baselines.
 * Capture descendants too: linkage children and render meshes may not have
 * their own registry ID, but are still part of canonical scene state. */
export interface SceneStateSnapshot {
  objects: Map<THREE.Object3D, {
    parent: THREE.Object3D | null;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    visible: boolean;
    geometry?: THREE.BufferGeometry;
  }>;
  materials: Map<THREE.MeshStandardMaterial, {
    emissive: THREE.Color;
    intensity: number;
    opacity: number;
  }>;
}

export class ObjectRegistry {
  private objects = new Map<string, THREE.Object3D>();
  private snapshots = new Map<string, ObjectSnapshot>();

  register(id: string, object: THREE.Object3D): void {
    const existing = this.objects.get(id);
    if (existing && existing !== object) throw new Error(`Duplicate runtime object id: ${id}`);
    this.objects.set(id, object);
  }

  unregister(id: string, object?: THREE.Object3D): void {
    if (!object || this.objects.get(id) === object) {
      this.objects.delete(id);
      this.snapshots.delete(id);
    }
  }

  get(id: string): THREE.Object3D | undefined { return this.objects.get(id); }
  require(id: string): THREE.Object3D {
    const object = this.objects.get(id);
    if (!object) throw new Error(`Unknown animation target: ${id}`);
    return object;
  }
  entries(): IterableIterator<[string, THREE.Object3D]> { return this.objects.entries(); }
  get size(): number { return this.objects.size; }

  clear(): void {
    this.objects.clear();
    this.snapshots.clear();
  }

  captureBaseline(): void {
    this.snapshots.clear();
    for (const [id, object] of this.objects) {
      const materials: ObjectSnapshot['materials'] = [];
      const geometries:ObjectSnapshot['geometries']=[];
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        geometries.push({mesh:child,geometry:child.geometry});
        const list = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of list) {
          if (material instanceof THREE.MeshStandardMaterial) {
            materials.push({ material, emissive: material.emissive.clone(), intensity: material.emissiveIntensity });
          }
        }
      });
      this.snapshots.set(id, {
        position: object.position.clone(),
        rotation: object.rotation.clone(),
        scale: object.scale.clone(),
        visible: object.visible,
        materials,
        geometries,
      });
    }
  }

  baseline(id: string): ObjectSnapshot | undefined { return this.snapshots.get(id); }

  captureState(): SceneStateSnapshot {
    const state: SceneStateSnapshot = { objects: new Map(), materials: new Map() };
    for (const object of this.objects.values()) object.traverse(child => {
      if (state.objects.has(child)) return;
      state.objects.set(child, {
        parent: child.parent, position: child.position.clone(), rotation: child.rotation.clone(),
        scale: child.scale.clone(), visible: child.visible,
        geometry: child instanceof THREE.Mesh ? child.geometry : undefined,
      });
      if (!(child instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        if (material instanceof THREE.MeshStandardMaterial) state.materials.set(material, {
          emissive: material.emissive.clone(), intensity: material.emissiveIntensity, opacity: material.opacity,
        });
      }
    });
    return state;
  }

  restoreState(state: SceneStateSnapshot): void {
    // Restore hierarchy before local transforms. add(), rather than attach(),
    // is intentional: checkpoint transforms are already parent-local.
    for (const [object, snapshot] of state.objects) {
      if (object.parent !== snapshot.parent) {
        if (snapshot.parent) snapshot.parent.add(object);
        else object.removeFromParent();
      }
      object.position.copy(snapshot.position); object.rotation.copy(snapshot.rotation);
      object.scale.copy(snapshot.scale); object.visible = snapshot.visible;
      if (object instanceof THREE.Mesh && snapshot.geometry) object.geometry = snapshot.geometry;
    }
    for (const [material, snapshot] of state.materials) {
      material.emissive.copy(snapshot.emissive);
      material.emissiveIntensity = snapshot.intensity; material.opacity = snapshot.opacity;
    }
  }

  reset(): void {
    for (const [id, snapshot] of this.snapshots) {
      const object = this.objects.get(id);
      if (!object) continue;
      object.position.copy(snapshot.position);
      object.rotation.copy(snapshot.rotation);
      object.scale.copy(snapshot.scale);
      object.visible = snapshot.visible;
      for(const entry of snapshot.geometries)entry.mesh.geometry=entry.geometry;
      for (const entry of snapshot.materials) {
        entry.material.emissive.copy(entry.emissive);
        entry.material.emissiveIntensity = entry.intensity;
      }
    }
  }
}
