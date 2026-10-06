/** Presentation only. Nothing here is registered as a product part or a mate. */
export interface BedroomSupportDefinition {
  id: string;
  /** X/Z contact point. The support stays fixed in the room. */
  position: [number, number];
  /** World-space top of the padded contact surface, in scene units. */
  topY: number;
  start: number;
  end: number;
  padSize?: [number, number];
}

export interface BedroomEnvironmentDefinition {
  preset: 'bedroom';
  floorY?: number;
  width?: number;
  depth?: number;
  floorCenterZ?: number;
  height?: number;
  farWallZ?: number;
  wallColor?: string;
  floorColor?: string;
  /** A presentation backing wall may appear after the final-wall cut. */
  installationWall?: { z: number; start: number };
  /** A low-priority window silhouette, never a bright photographic image. */
  window?: { position: [number, number]; size?: [number, number] } | false;
  supports?: BedroomSupportDefinition[];
  rug?: { position: [number, number]; size: [number, number]; color?: string };
}

export interface VideoPresentationDefinition {
  environment?: BedroomEnvironmentDefinition;
  background?: string;
  exposure?: number;
  fog?: false | { color?: string; near: number; far: number };
  finishedBedroom?: FinishedBedroomDefinition;
}

/** Independent estimated context, never PDF/product/AssemblyGraph members. */
export interface FinishedBedroomDefinition {
  /** Opt-in post-assembly rendering only; approved assembly environment is untouched. */
  style?: 'residential';
  decor?: {wallZ:number;window:{center:[number,number];size:[number,number]};art:{center:[number,number];size:[number,number]}};
  start: number;
  mattressStart: number;
  beddingStart: number;
  mattress: {center:[number,number,number];size:[number,number,number];radius:number};
  rug: {center:[number,number];size:[number,number]};
  bedsideTable: {center:[number,number];size:[number,number,number]};
  plant: {center:[number,number];height:number};
}

/** Synchronous presentation clock used by deterministic frame capture. */
export type PresentationTimeSync = (time: number) => void;
