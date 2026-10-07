'use client';

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraControllerProps {
  onReady: (camera: THREE.PerspectiveCamera, controls: OrbitControlsImpl) => void;
  enabled?: boolean;
  instructional?: boolean;
  maxDistance?: number;
}

export function CameraController({ onReady, enabled = true, instructional = false, maxDistance = 850 }: CameraControllerProps) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const setControls = useCallback((controls: OrbitControlsImpl | null) => {
    if (controls) onReady(camera, controls);
  }, [camera, onReady]);

  return (
    <OrbitControls
      ref={setControls}
      enabled={enabled}
      makeDefault
      enableDamping={enabled && !instructional}
      dampingFactor={0.07}
      minDistance={instructional ? 2 : 180}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI * 0.49}
      minPolarAngle={0.15}
      panSpeed={0.45}
    />
  );
}
