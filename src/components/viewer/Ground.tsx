'use client';

import { ContactShadows } from '@react-three/drei';

export function Ground({ debug }: { debug: boolean }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial color="#d7d2c8" roughness={0.96} />
      </mesh>
      <ContactShadows position={[0, 0.2, 0]} opacity={0.28} scale={650} blur={2.6} far={330} />
      {debug && <gridHelper args={[800, 40, '#c86d43', '#aaa69d']} position={[0, 0.1, 0]} />}
    </>
  );
}
