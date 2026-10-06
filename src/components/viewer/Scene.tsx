'use client';

import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import type { ProductDefinition } from '@/types/product';
import { ProductRenderer } from '@/components/product/ProductRenderer';
import { CameraController } from './CameraController';
import { Ground } from './Ground';
import { Lighting } from './Lighting';
import type { DebugSettings } from '@/types/debug';
import type { AssemblyValidationResult } from '@/engine/assembly/AssemblyValidator';
import { AssemblyDebugVisualizer } from '@/components/debug/AssemblyDebugVisualizer';
import type { PresentationTimeSync, VideoPresentationDefinition } from '@/types/presentation';
import { BedroomEnvironment } from '@/presentation/environment/BedroomEnvironment';
import {FinishedBedroom} from '@/presentation/finished-bedroom/FinishedBedroom';
import {useCallback,useLayoutEffect,useRef} from 'react';

interface SceneProps {
  product: ProductDefinition;
  background: string;
  presentation?: VideoPresentationDefinition;
  time?: number;
  registry: ObjectRegistry;
  selectedId: string | null;
  debug: DebugSettings;
  validation: AssemblyValidationResult;
  renderMode: boolean;
  onSelect: (id: string) => void;
  onProductReady: () => void;
  onCameraReady: (camera: THREE.PerspectiveCamera, controls: OrbitControlsImpl) => void;
  onPresentationSyncReady?: (sync: PresentationTimeSync | null) => void;
}

export function Scene(props: SceneProps) {
  const roomSync=useRef<PresentationTimeSync|null>(null),finishedSync=useRef<PresentationTimeSync|null>(null);
  const {onPresentationSyncReady}=props;
  const sync=useCallback((time:number)=>{roomSync.current?.(time);finishedSync.current?.(time);},[]);
  const setRoomSync=useCallback((value:PresentationTimeSync|null)=>{roomSync.current=value;},[]);
  const setFinishedSync=useCallback((value:PresentationTimeSync|null)=>{finishedSync.current=value;},[]);
  useLayoutEffect(()=>{onPresentationSyncReady?.(sync);return()=>onPresentationSyncReady?.(null);},[sync,onPresentationSyncReady]);
  const bedroom = props.presentation?.environment;
  const fog = props.presentation?.fog ?? (bedroom ? { near: 1400, far: 2300 } : { near: 600, far: 1050 });
  return (
    <>
      <color attach="background" args={[props.background]} />
      {fog !== false && <fog attach="fog" args={[fog.color ?? props.background, fog.near, fog.far]} />}
      <Lighting review={props.product.rendering?.lighting === 'instructional-review'} />
      {bedroom ? <BedroomEnvironment config={bedroom} time={props.time ?? 0} debug={props.debug.grid} onSyncReady={setRoomSync} /> : <Ground debug={props.debug.grid} />}
      {props.presentation?.finishedBedroom&&<FinishedBedroom config={props.presentation.finishedBedroom} time={props.time??0} onSyncReady={setFinishedSync}/>}
      <ProductRenderer
        product={props.product}
        registry={props.registry}
        selectedId={props.selectedId}
        debug={props.debug.pivots}
        onSelect={props.onSelect}
        onReady={props.onProductReady}
      />
      {!props.renderMode && <AssemblyDebugVisualizer product={props.product} validation={props.validation} selectedId={props.selectedId} settings={props.debug} />}
      <CameraController onReady={props.onCameraReady} enabled={!props.renderMode} instructional={props.product.rendering?.cameraControls === 'instructional'} />
    </>
  );
}
