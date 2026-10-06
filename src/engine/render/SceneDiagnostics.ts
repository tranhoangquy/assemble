import * as THREE from 'three';

/** Read-only, resolution-independent evidence of the scene actually rendered.
 * Runtime UUIDs, framebuffer dimensions and camera projection matrices are
 * intentionally excluded. No modeled/reconstructed assembly state is used. */
export interface SceneDiagnosticOptions {
  time: number;
  duration: number;
  registeredObjects?: Iterable<[string, THREE.Object3D]>;
  renderer?: THREE.WebGLRenderer;
}

const fingerprints = new WeakMap<THREE.BufferGeometry, { version: string; arrays: ArrayBufferView[]; value: unknown }>();
function byteFingerprint(array: ArrayBufferView): string {
  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  let result = 2166136261;
  for (const byte of bytes) result = Math.imul(result ^ byte, 16777619) >>> 0;
  return result.toString(16).padStart(8, '0');
}

function geometryState(geometry: THREE.BufferGeometry) {
  const entries = Object.entries(geometry.attributes).sort(([a], [b]) => a.localeCompare(b));
  const version = entries.map(([name, attribute]) => `${name}:${attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data.version : attribute.version}`).join('|') + `:${geometry.index?.version}`;
  const arrays = [...entries.map(([, attribute]) => attribute.array), ...(geometry.index ? [geometry.index.array] : [])];
  const previous = fingerprints.get(geometry);
  if (previous?.version === version && previous.arrays.length === arrays.length && arrays.every((array, index) => array === previous.arrays[index])) return previous.value;
  const value = {
    type: geometry.type,
    attributes: entries.map(([name, attribute]) => ({
      name, count: attribute.count, itemSize: attribute.itemSize, normalized: attribute.normalized,
      arrayType: attribute.array.constructor.name, bytes: byteFingerprint(attribute.array),
    })),
    index: geometry.index ? { count: geometry.index.count, bytes: byteFingerprint(geometry.index.array) } : null,
    groups: geometry.groups.map(group => ({ ...group })),
    drawRange: { start: geometry.drawRange.start, count: Number.isFinite(geometry.drawRange.count) ? geometry.drawRange.count : 'Infinity' },
  };
  fingerprints.set(geometry, { version, arrays, value });
  return value;
}

function textureState(texture: THREE.Texture) {
  const image = texture.image as { width?: number; height?: number; currentSrc?: string; src?: string } | null;
  return { name: texture.name, mapping: texture.mapping, colorSpace: texture.colorSpace,
    wrap: [texture.wrapS, texture.wrapT], repeat: texture.repeat.toArray(), offset: texture.offset.toArray(),
    rotation: texture.rotation, center: texture.center.toArray(), flipY: texture.flipY,
    source: image?.currentSrc ?? image?.src ?? null, imageSize: [image?.width ?? null, image?.height ?? null] };
}

function materialState(material: THREE.Material) {
  const data = material as unknown as Record<string, unknown>;
  const values: Record<string, unknown> = {};
  // Physical appearance, not GPU compilation/cache state.
  for (const key of ['color', 'emissive', 'emissiveIntensity', 'roughness', 'metalness', 'opacity', 'transparent',
    'visible', 'side', 'depthTest', 'depthWrite', 'alphaTest', 'wireframe', 'flatShading',
    'normalScale', 'bumpScale', 'displacementScale', 'displacementBias', 'envMapIntensity',
    'clearcoat', 'clearcoatRoughness', 'transmission', 'thickness', 'ior',
    'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'alphaMap', 'emissiveMap', 'aoMap', 'lightMap', 'envMap']) {
    const value = data[key];
    if (value === undefined) continue;
    values[key] = value instanceof THREE.Color ? value.toArray()
      : value instanceof THREE.Vector2 ? value.toArray()
        : value instanceof THREE.Texture ? textureState(value) : value;
  }
  return { name: material.name, type: material.type, ...values };
}

export function captureSceneDiagnostics(scene: THREE.Scene, options: SceneDiagnosticOptions) {
  const registered = new Map<THREE.Object3D, string[]>();
  for (const [id, object] of options.registeredObjects ?? []) registered.set(object, [...(registered.get(object) ?? []), id].sort());
  const objects: unknown[] = [];
  function visit(object: THREE.Object3D, path: string, parentVisible: boolean) {
    // Camera pose is independently audited by getCameraState. Its aspect and
    // projection are raster-dependent, not assembly simulation state.
    if (object instanceof THREE.Camera) return;
    const visible = parentVisible && object.visible;
    const base = {
      path, name: object.name, type: object.type, ids: registered.get(object) ?? [],
      position: object.position.toArray(), quaternion: object.quaternion.toArray(), scale: object.scale.toArray(),
      matrixWorld: object.matrixWorld.toArray(), visible: object.visible, effectiveVisible: visible,
      castShadow: object.castShadow, receiveShadow: object.receiveShadow, renderOrder: object.renderOrder,
      layers: object.layers.mask,
    };
    const mesh = object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points
      ? { geometry: geometryState(object.geometry), materials: (Array.isArray(object.material) ? object.material : [object.material]).map(materialState) } : {};
    const light = object instanceof THREE.Light ? {
      light: { color: object.color.toArray(), intensity: object.intensity,
        ...(object instanceof THREE.DirectionalLight || object instanceof THREE.SpotLight ? { target: { position: object.target.position.toArray(), quaternion: object.target.quaternion.toArray(), matrixWorld: object.target.matrixWorld.toArray() } } : {}),
        ...(object instanceof THREE.PointLight ? { distance: object.distance, decay: object.decay } : {}),
        ...(object instanceof THREE.SpotLight ? { angle: object.angle, penumbra: object.penumbra, distance: object.distance, decay: object.decay } : {}),
        ...(object instanceof THREE.HemisphereLight ? { groundColor: object.groundColor.toArray() } : {}),
      },
    } : {};
    objects.push({ ...base, ...mesh, ...light });
    object.children.forEach((child, index) => visit(child, `${path}/${index}`, visible));
  }
  visit(scene, 'scene', true);
  return {
    schema: 1, time: options.time, duration: options.duration,
    background: scene.background instanceof THREE.Color ? scene.background.toArray() : scene.background instanceof THREE.Texture ? textureState(scene.background) : null,
    environment: scene.environment ? textureState(scene.environment) : null,
    environmentIntensity: scene.environmentIntensity,
    environmentRotation: scene.environmentRotation.toArray(),
    fog: scene.fog instanceof THREE.Fog ? { color: scene.fog.color.toArray(), near: scene.fog.near, far: scene.fog.far }
      : scene.fog instanceof THREE.FogExp2 ? { color: scene.fog.color.toArray(), density: scene.fog.density } : null,
    lighting: options.renderer ? { exposure: options.renderer.toneMappingExposure, toneMapping: options.renderer.toneMapping, outputColorSpace: options.renderer.outputColorSpace } : null,
    objects,
  };
}
