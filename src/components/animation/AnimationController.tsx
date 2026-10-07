'use client';

import { useEffect, useMemo, useState } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CameraEngine } from '@/engine/camera/CameraEngine';
import type { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import { ProductEngine } from '@/engine/product/ProductEngine';
import { VideoEngine } from '@/engine/video/VideoEngine';
import {EditorialVideoEngine} from '@/engine/video/EditorialVideoEngine';
import {PrefixedVideoEngine} from '@/presentation/intro/PrefixedVideoEngine';
import type { AssemblyDefinition } from '@/types/assembly';
import type { ProductDefinition } from '@/types/product';
import type { VideoDefinition } from '@/types/video';

interface UseVideoEngineOptions {
  registry: ObjectRegistry;
  product: ProductDefinition;
  assembly: AssemblyDefinition;
  video: VideoDefinition;
  cameraContext: { camera: THREE.PerspectiveCamera; controls: OrbitControlsImpl } | null;
  productReadyVersion: number;
  initialTime?: number;
}

export function useVideoEngine(options: UseVideoEngineOptions) {
  const [engine, setEngine] = useState<VideoEngine | null>(null);
  const [time, setTime] = useState(0);
  const tree = useMemo(() => ProductEngine.build(options.product), [options.product]);

  useEffect(() => {
    if (!options.cameraContext || options.productReadyVersion === 0 || options.registry.size < options.product.parts.length) return;
    options.registry.captureBaseline();
    const cameraEngine = new CameraEngine(options.cameraContext.camera, options.cameraContext.controls, options.video.cameraPresets);
    const firstCamera = options.video.scenes[0]?.camera;
    if (firstCamera) cameraEngine.apply(firstCamera);
    const Engine=options.video.editorial?EditorialVideoEngine:options.video.intro?PrefixedVideoEngine:VideoEngine;
    const nextEngine = new Engine(options.registry, tree, options.assembly, options.video, cameraEngine, { onTime: setTime });
    nextEngine.seek(options.initialTime ?? 0);
    let active = true;
    queueMicrotask(() => { if (active) setEngine(nextEngine); });
    return () => {
      active = false;
      nextEngine.dispose();
      options.registry.reset();
      queueMicrotask(() => setEngine((current) => current === nextEngine ? null : current));
    };
  }, [options.assembly, options.cameraContext, options.initialTime, options.product.parts.length, options.productReadyVersion, options.registry, options.video, tree]);

  return { engine, time, setTime };
}
