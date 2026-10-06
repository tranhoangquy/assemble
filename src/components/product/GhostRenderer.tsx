'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GeometryFactory } from '@/engine/geometry/GeometryFactory';
import type { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import type { MeshPartDefinition } from '@/types/product';

const radians = (values: [number, number, number] = [0, 0, 0]): [number, number, number] => values.map((value) => THREE.MathUtils.degToRad(value)) as [number, number, number];

export function GhostRenderer({ part, registry }: { part: MeshPartDefinition; registry: ObjectRegistry }) {
  const ref = useRef<THREE.Group>(null);
  const geometry = useMemo(() => GeometryFactory.create(part.geometry), [part.geometry]);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#f07a43',
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  useEffect(() => {
    const object = ref.current;
    if (!object) return;
    registry.register(`__ghost:${part.id}`, object);
    return () => registry.unregister(`__ghost:${part.id}`, object);
  }, [part.id, registry]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  return (
    <group ref={ref} position={part.position} rotation={radians(part.rotation)} scale={part.scale ?? [1, 1, 1]} visible={false}>
      <mesh geometry={geometry} material={material} renderOrder={5} />
    </group>
  );
}
