'use client';

import { productionProductLabel } from '@/products/registry';
import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useVideoEngine } from '@/components/animation/AnimationController';
import { Timeline } from '@/components/timeline/Timeline';
import { TimelineControls } from '@/components/timeline/TimelineControls';
import { ControlPanel, type ProductReviewState } from '@/components/ui/ControlPanel';
import { DebugPanel } from '@/components/ui/DebugPanel';
import { PartsPanel } from '@/components/ui/PartsPanel';
import { ScenePanel } from '@/components/ui/ScenePanel';
import { CameraEngine } from '@/engine/camera/CameraEngine';
import { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import { installFrameRenderer } from '@/engine/render/FrameRenderer';
import { captureSceneDiagnostics } from '@/engine/render/SceneDiagnostics';
import type { RenderProfile } from '@/engine/export/RenderProfiles';
import { SceneEngine } from '@/engine/video/SceneEngine';
import type { AssemblyDefinition } from '@/types/assembly';
import type { ProductDefinition } from '@/types/product';
import type { VideoDefinition, CameraPreset } from '@/types/video';
import type { ProductPackage } from '@/types/product-package';
import type { PresentationTimeSync } from '@/types/presentation';
import { Scene } from './Scene';
import { AssemblyValidator, type ValidationIssue } from '@/engine/assembly/AssemblyValidator';
import { defaultDebugSettings } from '@/types/debug';
import { ValidationPanel } from '@/components/ui/ValidationPanel';
import { AssemblyState } from '@/engine/assembly/AssemblyState';
import { DependencyGraph } from '@/engine/assembly/DependencyGraph';
import {presentationTime} from '@/presentation/intro/PrefixedVideoEngine';
import { AssemblyStateInspector } from '@/components/ui/AssemblyStateInspector';

interface ProductViewerProps {
  product: ProductDefinition;
  assembly: AssemblyDefinition;
  video: VideoDefinition;
  debugMode?: boolean;
  renderMode?: boolean;
  initialTime?: number;
  catalog?: readonly ProductPackage[];
  activeProductId?: string;
  loading?: boolean;
  onProductChange?: (id: string) => void;
  onExport?: () => void;
  renderProfile?: RenderProfile;
  renderFps?: number;
}

export function ProductViewer({ product, assembly, video, debugMode = false, renderMode = false, initialTime = 0, catalog, activeProductId, loading = false, onProductChange, onExport, renderProfile, renderFps }: ProductViewerProps) {
  const registry = useMemo(() => new ObjectRegistry(), []);
  const sceneEngine = useMemo(() => new SceneEngine(video, assembly), [video, assembly]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [debug, setDebug] = useState(defaultDebugSettings);
  const [productReadyVersion, setProductReadyVersion] = useState(0);
  const [cameraContext, setCameraContext] = useState<{ camera: THREE.PerspectiveCamera; controls: OrbitControlsImpl } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPause, setAutoPause] = useState(false);
  const previousSceneId = useRef<string | null>(null);
  const renderContext = useRef<{ gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera } | null>(null);
  const presentationSync = useRef<PresentationTimeSync | null>(null);
  const renderedTime = useRef(initialTime);
  const validation = useMemo(() => AssemblyValidator.validate(product, assembly), [product, assembly]);
  const assemblyOrder = useMemo(() => new DependencyGraph(assembly.steps.map((step) => ({ id: step.id, dependsOn: step.dependsOn ?? [] }))).analyze().order, [assembly]);

  const onProductReady = useCallback(() => setProductReadyVersion((value) => value + 1), []);
  const onPresentationSyncReady = useCallback((sync: PresentationTimeSync | null) => {
    presentationSync.current = sync;
  }, []);
  const onCameraReady = useCallback((camera: THREE.PerspectiveCamera, controls: OrbitControlsImpl) => {
    setCameraContext((current) => current?.camera === camera && current.controls === controls ? current : { camera, controls });
  }, []);

  const { engine, time } = useVideoEngine({ registry, product, assembly, video, cameraContext, productReadyVersion, initialTime });
  const activeScene = sceneEngine.at(time);
  const captionTime=time-(video.intro?.duration??0);
  const reviewCaption = captionTime<0?{hidden:true,title:'',note:''}:video.reviewCaptions?.find((caption) => captionTime >= caption.start && captionTime < caption.end);
  const sceneTime = Math.max(0, time - activeScene.start);
  const showPartIntro = Boolean(activeScene.partIntro && sceneTime <= (activeScene.partIntro.duration ?? 2.2));
  const showCompletion = activeScene.completionAt !== undefined && sceneTime >= activeScene.completionAt && sceneTime <= activeScene.completionAt + 1.1;
  const assemblySnapshot = useMemo(() => {
    const index = activeScene.assemblyStep ? assemblyOrder.indexOf(activeScene.assemblyStep) : -1;
    return index >= 0 ? AssemblyState.evaluate(product, assembly, index, sceneTime) : undefined;
  }, [activeScene.assemblyStep, assembly, assemblyOrder, product, sceneTime]);

  useEffect(() => {
    const previous = previousSceneId.current;
    previousSceneId.current = activeScene.id;
    if (!autoPause || !isPlaying || !previous || previous === activeScene.id || !activeScene.assemblyStep) return;
    engine?.pause();
    setIsPlaying(false);
  }, [activeScene.assemblyStep, activeScene.id, autoPause, engine, isPlaying]);

  useEffect(() => {
    if (!renderMode) return;
    (window as unknown as { __RENDER_DEBUG__: unknown }).__RENDER_DEBUG__ = {
      engineReady: Boolean(engine), cameraReady: Boolean(cameraContext), registrySize: registry.size, productReadyVersion,
    };
  }, [cameraContext, engine, productReadyVersion, registry, renderMode]);

  useEffect(() => {
    if (!renderMode || !engine) return;
    const renderAt = async (frameTime: number, inspectionCamera?:CameraPreset) => {
      flushSync(() => engine.renderFrame(frameTime));
      // R3F owns a separate React root. Apply presentation clocks to mounted
      // Three objects synchronously, without waiting for its next prop commit.
      presentationSync.current?.(presentationTime(video,frameTime));
      const context = renderContext.current;
      if (!context) throw new Error('WebGL render context is unavailable.');
      if (renderProfile) {
        const size = context.gl.getDrawingBufferSize(new THREE.Vector2());
        if (size.x !== renderProfile.width || size.y !== renderProfile.height || context.gl.domElement.width !== renderProfile.width || context.gl.domElement.height !== renderProfile.height) {
          throw new Error(`Native ${renderProfile.id} surface mismatch: ${size.x}×${size.y}; expected ${renderProfile.width}×${renderProfile.height}. No resolution fallback is allowed.`);
        }
      }
      if(inspectionCamera&&cameraContext){
        const {camera}=cameraContext;
        const original={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov};
        try{
          camera.position.set(...inspectionCamera.position);camera.fov=inspectionCamera.fov??35;camera.updateProjectionMatrix();
          // A true orthogonal inspection direction must not be tilted by the
          // interactive OrbitControls polar-angle clamp. Playback stays untouched.
          camera.lookAt(new THREE.Vector3(...inspectionCamera.target));camera.updateMatrixWorld(true);
          context.gl.render(context.scene,context.camera);
        }finally{
          camera.position.copy(original.position);camera.fov=original.fov;camera.updateProjectionMatrix();
          camera.quaternion.copy(original.quaternion);camera.updateMatrixWorld(true);
        }
      }else context.gl.render(context.scene, context.camera);
      renderedTime.current = frameTime;
      await Promise.resolve();
    };
    return installFrameRenderer({
      getCreativeDefinition: () => ({ product, assembly, video }),
      ready: true,
      getSceneState: () => {
        const context = renderContext.current;
        if (!context) throw new Error('WebGL render context is unavailable.');
        return captureSceneDiagnostics(context.scene, { time: renderedTime.current, duration: sceneEngine.totalDuration, registeredObjects: registry.entries(), renderer: context.gl });
      },
      getRenderSurface: () => {
        const context = renderContext.current;
        if (!context) throw new Error('WebGL render context is unavailable.');
        return { profileId: renderProfile?.id ?? null, width: context.gl.domElement.width, height: context.gl.domElement.height, drawingBuffer: context.gl.getDrawingBufferSize(new THREE.Vector2()).toArray(), deviceScaleFactor: window.devicePixelRatio };
      },
      getCameraState:()=>({position:cameraContext!.camera.position.toArray(),direction:cameraContext!.camera.getWorldDirection(new THREE.Vector3()).toArray(),target:cameraContext!.controls.target.toArray(),fov:cameraContext!.camera.fov}),
      duration: sceneEngine.totalDuration,
      fps: renderFps ?? video.fps,
      getDuration: () => sceneEngine.totalDuration,
      seek: renderAt,
      setTime: renderAt,
      renderFrame: renderAt,
    });
  }, [engine, renderMode, sceneEngine.totalDuration, product,assembly,video,cameraContext,registry,renderProfile,renderFps]);

  useEffect(() => () => registry.clear(), [registry]);

  useEffect(() => {
    if (renderContext.current) renderContext.current.gl.toneMappingExposure = video.presentation?.exposure ?? 1.05;
  }, [video]);

  const seekAndPlay = (sceneId: string) => {
    const scene = sceneEngine.scenes.find((item) => item.id === sceneId);
    if (!engine || !scene) return;
    if (!validation.valid) {
      inspectIssue(validation.errors[0]);
      return;
    }
    engine.seek(scene.start);
    engine.play();
    setIsPlaying(true);
  };

  const resetCamera = () => {
    if (!cameraContext) return;
    new CameraEngine(cameraContext.camera, cameraContext.controls, video.cameraPresets).apply(video.scenes[0]?.camera ?? 'hero');
  };

  const toggle = () => {
    if (!engine) return;
    if (!isPlaying && !validation.valid) {
      inspectIssue(validation.errors[0]);
      return;
    }
    if (isPlaying) engine.pause(); else engine.play();
    setIsPlaying(!isPlaying);
  };

  const navigateLogicalStep = (direction: -1 | 1) => {
    const logicalScenes = sceneEngine.scenes.filter((scene) => Boolean(scene.assemblyStep));
    if (logicalScenes.length === 0) return;
    const current = logicalScenes.findIndex((scene) => scene.id === activeScene.id);
    const insertion = current >= 0 ? current : logicalScenes.findIndex((scene) => scene.start > time);
    const base = insertion >= 0 ? insertion : logicalScenes.length - 1;
    const nextIndex = Math.min(logicalScenes.length - 1, Math.max(0, base + (current >= 0 ? direction : direction < 0 ? -1 : 0)));
    engine?.seek(logicalScenes[nextIndex].start);
    setIsPlaying(false);
  };

  const setReviewState = (state: ProductReviewState) => {
    const sceneId: Record<ProductReviewState, string> = {
      final: 'finished', closed: 'hero', open: 'open-side', exploded: 'exploded', assembly: 'base-uprights',
    };
    const scene = sceneEngine.scenes.find((candidate) => candidate.id === sceneId[state]);
    if (!scene || !engine) return;
    const offset = state === 'exploded' ? Math.min(3.2, scene.duration - 0.1) : 0;
    engine.seek(scene.start + offset);
    setIsPlaying(false);
  };

  const inspectIssue = (issue: ValidationIssue) => {
    if (issue.part) setSelectedId(issue.part);
    setDebug((current) => ({ ...current, bounds: true, installPaths: true, connections: true, collisions: true }));
    const scene = sceneEngine.scenes.find((item) => item.assemblyStep === issue.step);
    if (scene) engine?.seek(scene.start);
    if (issue.part && cameraContext) {
      const object = registry.get(issue.part);
      if (object) {
        const target = object.getWorldPosition(new THREE.Vector3());
        cameraContext.controls.target.copy(target);
        cameraContext.camera.position.copy(target).add(new THREE.Vector3(90, 65, 130));
        cameraContext.controls.update();
      }
    }
    setIsPlaying(false);
  };

  const canvas = (
    <div className="canvas-shell">
      <Canvas
        shadows="percentage"
        frameloop={renderMode ? 'never' : 'always'}
        dpr={renderMode ? 1 : [1, 2]}
        camera={{ position: [330, 235, 390], fov: 34, near: 1, far: 1800 }}
        gl={{ antialias: true, preserveDrawingBuffer: renderMode, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene, camera }) => {
          renderContext.current = { gl, scene, camera };
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = video.presentation?.exposure ?? 1.05;
        }}
      >
        <Scene
          product={product}
          background={video.presentation?.background ?? video.background}
          presentation={video.presentation}
          time={presentationTime(video,time)}
          registry={registry}
          selectedId={selectedId}
          debug={renderMode || !debugMode ? defaultDebugSettings : debug}
          validation={validation}
          renderMode={renderMode}
          onSelect={setSelectedId}
          onProductReady={onProductReady}
          onCameraReady={onCameraReady}
          onPresentationSyncReady={onPresentationSyncReady}
        />
      </Canvas>
      {!reviewCaption?.hidden && <div className={`video-overlay${video.reviewCaptions ? ' director-review-caption' : ''}`}>
        {activeScene.step && <span>{activeScene.step}</span>}
        <h2>{reviewCaption?.title ?? activeScene.title}</h2>
        {(reviewCaption?.note ?? activeScene.subtitle) && <p>{reviewCaption?.note ?? activeScene.subtitle}</p>}
        {showPartIntro && activeScene.partIntro && (
          <div className="part-intro">
            <i>PARTS REQUIRED</i>
            <strong>{activeScene.partIntro.count} × {activeScene.partIntro.label}</strong>
            {activeScene.partIntro.hardware && <small>{activeScene.partIntro.hardware}</small>}
          </div>
        )}
        {!showPartIntro && !showCompletion && activeScene.callouts && (
          <ul className="scene-callouts">
            {activeScene.callouts.map((callout) => <li key={callout}>{callout}</li>)}
          </ul>
        )}
        {showCompletion && <div className="step-complete"><b>✓</b> STEP COMPLETE</div>}
      </div>}
      {!engine && <div className="engine-loading"><i />Preparing preview…</div>}
    </div>
  );

  if (renderMode) return <main className="render-stage">{canvas}</main>;

  return (
    <main className="editor-app">
      <header className="app-header">
        <div className="brand-lockup"><i><b /><b /><b /></i><span>FURNITURE VIDEO ENGINE<small>Assembly video preview</small></span></div>
        <div className="project-meta">
          <span>PROJECT</span>
          {catalog && onProductChange ? (
            <label className="product-selector">
              <select aria-label="Select product" value={activeProductId} disabled={loading} onChange={(event) => onProductChange(event.target.value)}>
                {catalog.map((entry) => <option key={entry.id} value={entry.id}>{debugMode ? `${entry.label} · ${entry.product.parts.length} parts · ${entry.video.scenes.length} scenes` : productionProductLabel(entry.id)}</option>)}
              </select>
            </label>
          ) : <strong>{product.name}</strong>}
          <em>{loading ? 'LOADING…' : `${video.fps} FPS`}</em>
        </div>
        {debugMode && <DebugPanel settings={debug} onChange={setDebug} />}
      </header>

      <div className="editor-grid">
        <section className="viewport-panel">
          <div className="viewport-label"><span>INTERACTIVE PREVIEW</span><i>Orbit · Zoom · Select parts</i></div>
          {canvas}
        </section>
        <aside className="sidebar">
          <ScenePanel scenes={sceneEngine.scenes} activeId={activeScene.id} onSelect={(value) => { engine?.seek(value); setIsPlaying(false); }} />
          {debugMode && <>
          <PartsPanel product={product} presentationNames={video.presentationNames} selectedId={selectedId} onSelect={setSelectedId} validation={validation} assemblyState={selectedId ? assemblySnapshot?.hardware.get(selectedId) ?? assemblySnapshot?.parts.get(selectedId) : undefined} />
          <AssemblyStateInspector assembly={assembly} stepId={activeScene.assemblyStep} localTime={sceneTime} snapshot={assemblySnapshot} validation={validation} />
          <ValidationPanel validation={validation} onInspect={inspectIssue} />
          </>}
          <ControlPanel
            debugMode={debugMode}
            disabled={!engine || loading}
            quickActions={video.quickActions ?? []}
            onQuickAction={seekAndPlay}
            onReset={() => { engine?.reset(); setIsPlaying(false); }}
            onResetCamera={resetCamera}
            onExport={() => onExport?.()}
            onReviewState={setReviewState}
            autoPause={autoPause}
            onAutoPauseChange={setAutoPause}
          />
        </aside>
      </div>

      <footer className="transport-bar">
        <TimelineControls
          playing={isPlaying && time < sceneEngine.totalDuration}
          time={time}
          duration={sceneEngine.totalDuration}
          onToggle={toggle}
          onRestart={() => { engine?.restart(); setIsPlaying(true); }}
          onPrevious={() => navigateLogicalStep(-1)}
          onNext={() => navigateLogicalStep(1)}
        />
        <Timeline time={time} duration={sceneEngine.totalDuration} scenes={sceneEngine.scenes} onSeek={(value) => { engine?.seek(value); setIsPlaying(false); }} />
        <span className="scene-readout">{activeScene.step ?? `SCENE ${String(activeScene.index + 1).padStart(2, '0')}`} · {activeScene.title}</span>
      </footer>
    </main>
  );
}
