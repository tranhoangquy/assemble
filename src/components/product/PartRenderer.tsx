'use client';

import { Edges } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GeometryFactory } from '@/engine/geometry/GeometryFactory';
import { MaterialFactory } from '@/engine/materials/MaterialFactory';
import type { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import type { PartDefinition, ProductDefinition } from '@/types/product';

interface PartRendererProps {
  part: PartDefinition;
  children: React.ReactNode;
  product: ProductDefinition;
  registry: ObjectRegistry;
  selectedId: string | null;
  debug: boolean;
  onSelect: (id: string) => void;
}

const radians = (values: [number, number, number] = [0, 0, 0]): [number, number, number] => values.map((value) => THREE.MathUtils.degToRad(value)) as [number, number, number];

export function PartRenderer({ part, children, product, registry, selectedId, debug, onSelect }: PartRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const geometries = useMemo(() => {
    if (part.type !== 'mesh') return {} as Record<string,THREE.BufferGeometry>;
    return Object.fromEntries(Object.entries({baseline:part.geometry,...part.geometryVariants}).map(([key,definition])=>{
    const g = GeometryFactory.create(definition);
    const m = product.materials[part.material];
    if (m.finish === 'oak-review') {
      const p = g.getAttribute('position'), n = g.getAttribute('normal');
      const uv = new Float32Array(p.count * 2);
      const axis = m.grainAxis ?? 'x';
      for (let i = 0; i < p.count; i++) {
        const long = axis === 'x' ? p.getX(i) : axis === 'y' ? p.getY(i) : p.getZ(i);
        const transverse = axis === 'x' ? (Math.abs(n.getY(i)) > 0.5 ? p.getZ(i) : p.getY(i)) : axis === 'z' ? (Math.abs(n.getY(i)) > 0.5 ? p.getX(i) : p.getY(i)) : p.getX(i);
        uv[i*2] = long / 90; uv[i*2+1] = transverse / 24;
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    }
    return [key,g];
    }));
  }, [part, product.materials]);
  const geometry=geometries.baseline;
  const material = useMemo(() => part.type === 'mesh' ? MaterialFactory.create(product.materials[part.material]) : null, [part, product.materials]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.userData.geometryVariants=geometries;
    registry.register(part.id, group);
    return () => registry.unregister(part.id, group);
  }, [part.id, registry, geometries]);

  useEffect(() => () => {
    for(const g of Object.values(geometries))g.dispose();
    material?.map?.dispose();
    material?.bumpMap?.dispose();
    material?.roughnessMap?.dispose();
    material?.dispose();
  }, [geometries, material]);

  return (
    <group
      ref={groupRef}
      name={part.id}
      position={part.position}
      rotation={radians(part.rotation)}
      scale={part.scale ?? [1, 1, 1]}
      visible={part.visible ?? true}
    >
      {part.type === 'mesh' && geometry && material && (
        <mesh
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
          onClick={(event) => { event.stopPropagation(); onSelect(part.id); }}
        >
          {selectedId === part.id && <Edges threshold={15} color="#ff7a3d" lineWidth={2.5} />}
        </mesh>
      )}
      {debug && part.type === 'group' && (
        <group>
          <mesh>
            <sphereGeometry args={[3.2, 18, 12]} />
            <meshBasicMaterial color="#ff5b35" depthTest={false} />
          </mesh>
          <axesHelper args={[22]} />
        </group>
      )}
      {children}
    </group>
  );
}
