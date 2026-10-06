'use client';

import { ContactShadows } from '@react-three/drei';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BedroomEnvironmentDefinition, PresentationTimeSync } from '@/types/presentation';
import { resolveBedroomEnvironment, syncBedroomPresentation } from './bedroom-config';

/** Deterministic, restrained flooring; no downloaded decorative asset. */
function flooringTexture() {
  const size = 512;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 64319;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const rowTones = Array.from({ length: 14 }, () => random() * 7 - 3.5);
  for (let y = 0; y < size; y++) {
    const board = Math.floor(y / 38);
    const seam = y % 38 === 0;
    for (let x = 0; x < size; x++) {
      // The texture is deliberately low contrast: the product's oak is the subject.
      const grain = Math.sin(y * .85 + Math.sin(x * .025) * .8) * 1.5;
      const stagger = board % 2 ? 170 : 0;
      const endSeam = (x + stagger) % 256 === 0;
      const tone = 222 + rowTones[board] + grain + (random() - .5) * 2 - (seam || endSeam ? 7 : 0);
      const index = (y * size + x) * 4;
      pixels[index] = pixels[index + 1] = pixels[index + 2] = tone;
      pixels[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Room meshes are outside ProductRenderer/ObjectRegistry and never alter mechanics. */
export function BedroomEnvironment({ config, time, debug = false, onSyncReady }: {
  config: BedroomEnvironmentDefinition;
  time: number;
  debug?: boolean;
  onSyncReady?: (sync: PresentationTimeSync | null) => void;
}) {
  const room = resolveBedroomEnvironment(config);
  const wall = useRef<THREE.Group>(null);
  const supports = useRef(new Map<string, THREE.Group>());
  const sync = useCallback((frameTime: number) => {
    syncBedroomPresentation(config, { wall: wall.current, supports: supports.current }, frameTime);
  }, [config]);
  useLayoutEffect(() => {
    onSyncReady?.(sync);
    return () => onSyncReady?.(null);
  }, [onSyncReady, sync]);
  useLayoutEffect(() => sync(time), [sync, time]);
  const floor = useMemo(() => {
    const texture = flooringTexture();
    texture.repeat.set(room.width / 240, room.depth / 240);
    return texture;
  }, [room.width, room.depth]);
  useEffect(() => () => floor.dispose(), [floor]);
  const window = room.window === false ? undefined : room.window ?? { position: [-490, 190] as [number, number] };
  const windowSize = window?.size ?? [130, 165];
  return <group name="presentation-bedroom">
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, room.floorY - .025, room.floorCenterZ]} receiveShadow>
      <planeGeometry args={[room.width, room.depth]} />
      <meshStandardMaterial color={room.floorColor} map={floor} roughness={.91} metalness={0} />
    </mesh>
    <group name="environment-wall-context" ref={wall}>
    {/* A single-sided inward wall cannot obscure an instructional view from behind. */}
    <mesh position={[0, room.floorY + room.height / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
      <planeGeometry args={[room.width, room.height]} />
      <meshStandardMaterial color={room.wallColor} roughness={1} />
    </mesh>
    {/* No protruding trim behind the mechanism: the cabinet region stays clear. */}
    {[-1, 1].map(side => <mesh key={side} position={[side * (room.width / 4 + 100), room.floorY + 4, -.12]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[room.width / 2 - 200, 8]} />
      <meshStandardMaterial color="#ddd8ce" roughness={1} />
    </mesh>)}
    {window && <group name="environment-window-suggestion" position={[window.position[0], room.floorY + window.position[1], -.2]}>
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[windowSize[0] + 7, windowSize[1] + 7]} />
        <meshStandardMaterial color="#d4cfc4" roughness={1} />
      </mesh>
      <mesh position={[0, 0, -.03]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={windowSize} />
        <meshStandardMaterial color="#adb8b4" emissive="#d9ddd6" emissiveIntensity={.08} roughness={.82} />
      </mesh>
      <mesh position={[0, 0, -.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.2, windowSize[1]]} />
        <meshStandardMaterial color="#d4cfc4" roughness={1} />
      </mesh>
      <mesh position={[0, 0, -.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[windowSize[0], 2.2]} />
        <meshStandardMaterial color="#d4cfc4" roughness={1} />
      </mesh>
      {[-1, 1].map(side => <mesh key={side} position={[side * (windowSize[0] / 2 + 15), -5, -.1]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[24, windowSize[1] + 27]} />
        <meshStandardMaterial color="#bcb2a1" roughness={1} />
      </mesh>)}
    </group>}
    </group>
    {room.rug && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[room.rug.position[0], room.floorY - .008, room.rug.position[1]]} receiveShadow>
      <planeGeometry args={room.rug.size} />
      <meshStandardMaterial color={room.rug.color ?? '#c5bbab'} roughness={1} />
    </mesh>}
    {/* Support-state metadata remains available to authoring/validation, but
        helper geometry is NEVER mounted in viewer or exported presentation. */}
    <ContactShadows position={[0, room.floorY + .02, 0]} opacity={.23} scale={900} blur={2.6} far={330} />
    {debug && <gridHelper args={[800, 40, '#aa826b', '#9b9388']} position={[0, room.floorY + .01, 0]} />}
  </group>;
}
