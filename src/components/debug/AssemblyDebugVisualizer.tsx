'use client';

import { Html, Line } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { AssemblyValidationResult } from '@/engine/assembly/AssemblyValidator';
import { ProductTransformIndex } from '@/engine/installation/ProductTransformIndex';
import type { ProductDefinition } from '@/types/product';
import type { DebugSettings } from '@/types/debug';

interface Props {
  product: ProductDefinition;
  validation: AssemblyValidationResult;
  selectedId: string | null;
  settings: DebugSettings;
}

function DebugBox({ box, color }: { box: THREE.Box3; color: string }) {
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  return (
    <mesh position={center}>
      <boxGeometry args={[size.x, size.y, size.z]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.8} depthTest={false} />
    </mesh>
  );
}

export function AssemblyDebugVisualizer({ product, validation, selectedId, settings }: Props) {
  const transforms = useMemo(() => new ProductTransformIndex(product), [product]);
  const active = validation.installations.filter((item) => !selectedId || item.action.target === selectedId || item.path.targetPart === selectedId);
  const selectedBox = selectedId ? transforms.boxAtFinal(selectedId) : undefined;

  return (
    <group name="assembly-debug-visuals" renderOrder={1000}>
      {settings.bounds && selectedBox && <DebugBox box={selectedBox} color="#ff7a3d" />}
      {settings.installPaths && active.map((installation) => (
        <group key={installation.operation}>
          <Line
            points={installation.path.waypoints.map((waypoint) => waypoint.position)}
            color={installation.collisions.some((collision) => !collision.expected) ? '#ef3d2f' : '#1aa66a'}
            lineWidth={2.5}
            depthTest={false}
          />
          {installation.path.waypoints.map((waypoint) => (
            <group key={waypoint.stage} position={waypoint.position}>
              <mesh><sphereGeometry args={[2.1, 12, 8]} /><meshBasicMaterial color={waypoint.stage === 'FINAL' ? '#ff7a3d' : '#1aa66a'} depthTest={false} /></mesh>
              <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}><span className="debug-world-label">{waypoint.stage}</span></Html>
            </group>
          ))}
        </group>
      ))}
      {settings.connections && active.map((installation) => {
        const position = transforms.connectionWorld(installation.path.targetPart, installation.path.connectionPoint);
        if (!position) return null;
        return <mesh key={installation.operation} position={position}><sphereGeometry args={[3.2, 14, 10]} /><meshBasicMaterial color="#28a9ff" wireframe depthTest={false} /></mesh>;
      })}
      {settings.collisions && active.flatMap((installation) => installation.collisions.flatMap((collision, index) => [
        <DebugBox key={`${installation.operation}-moving-${index}`} box={collision.movingBox} color={collision.expected ? '#1aa66a' : '#ffcc00'} />,
        <DebugBox key={`${installation.operation}-blocking-${index}`} box={collision.blockingBox} color={collision.expected ? '#28a9ff' : '#ef3d2f'} />,
      ]))}
    </group>
  );
}
