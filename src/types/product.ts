export type Vector3Tuple = [number, number, number];
export type EvidenceSource = 'dimension_label' | 'image_visible' | 'multi_view_inferred' | 'mechanically_inferred';
export type EvidenceConfidence = 'high' | 'medium' | 'low';

export interface EvidenceDefinition {
  source: EvidenceSource;
  confidence: EvidenceConfidence;
  note?: string;
}

export interface DimensionCalibration extends EvidenceDefinition {
  label: string;
  inches: number;
  centimeters: number;
}

export interface EvidenceGroup extends EvidenceDefinition {
  parts: string[];
}

export interface StandardMaterialDefinition {
  type: 'standard';
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  surface?: 'wood' | 'painted-wood' | 'metal' | 'plastic';
  grainScale?: number;
  finish?: 'oak-review';
  grainAxis?: 'x' | 'y' | 'z';
}

export type MaterialDefinition = StandardMaterialDefinition;

export interface BoxGeometryDefinition { type: 'box'; size: Vector3Tuple; bevel?: number; }
export interface FaceBore { axis:'x'|'y'|'z'; position:Vector3Tuple; radius:number; face?:'positive'|'negative'|'both'; depth?:number; }
export interface BoredPanelGeometryDefinition { type: 'bored-panel'; size: Vector3Tuple; boreAxis?: 'y' | 'z'; bevel?:number; holes: { x: number; z: number; radius: number }[]; edgeBores?: { x: number; radius: number }[]; faceBores?:FaceBore[]; }
export interface TabbedStileGeometryDefinition {type:'tabbed-stile';size:Vector3Tuple;tabWidth:number;tabHeight:number;tabDepth:number;}
export interface ReviewHardwareGeometryDefinition { type: 'socket-bolt' | 'horizontal-cam' | 'fluted-dowel'; radius: number; height: number; }
export interface CylinderGeometryDefinition { type: 'cylinder'; radius: number; height: number; segments?: number; }
export interface SphereGeometryDefinition { type: 'sphere'; radius: number; segments?: number; }
export interface ScrewGeometryDefinition { type: 'screw'; radius: number; length: number; headRadius: number; headHeight: number; segments?: number; threaded?:boolean; }
export interface WasherGeometryDefinition { type: 'washer'; innerRadius: number; outerRadius: number; thickness: number; segments?: number; }
export interface NutGeometryDefinition { type: 'nut'; innerRadius: number; outerRadius: number; thickness: number; }
export interface ModelGeometryDefinition { type: 'model'; src: string; }
/** Data-defined planar profiles, such as routed channels and mechanism plates. */
export interface ProfileGeometryDefinition { type:'profile-prism'; points:[number,number][]; holes?:{x:number;y:number;radius:number}[]; depth:number; axis?:'x'|'y'|'z'; faceBores?:FaceBore[]; size?:Vector3Tuple; preserveEndProfile?:boolean; }
/** One physical part composed of routed solids / integral tongues / bent faces. */
export interface CompoundGeometryDefinition {type:'compound';size:Vector3Tuple;pieces:{geometry:GeometryDefinition;position?:Vector3Tuple;rotation?:Vector3Tuple}[];}

export type GeometryDefinition = BoxGeometryDefinition | BoredPanelGeometryDefinition | TabbedStileGeometryDefinition | ReviewHardwareGeometryDefinition | CylinderGeometryDefinition | SphereGeometryDefinition | ScrewGeometryDefinition | WasherGeometryDefinition | NutGeometryDefinition | ModelGeometryDefinition | ProfileGeometryDefinition | CompoundGeometryDefinition;

export type ConnectionKind = 'hole' | 'mount' | 'slot' | 'edge' | 'pivot' | 'dowel' | 'hinge' | 'bracket' | 'support';

export interface ConnectionPointDefinition {
  id: string;
  position: Vector3Tuple;
  normal: Vector3Tuple;
  kind?: ConnectionKind;
  mate?: { part: string; point: string };
}

interface PartBase {
  id: string;
  name: string;
  parent?: string;
  position: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  visible?: boolean;
  explodeOffset?: Vector3Tuple;
  category?: 'cabinet' | 'bed' | 'desk' | 'mechanism' | 'hardware';
  connectionPoints?: ConnectionPointDefinition[];
  evidence?: EvidenceDefinition;
  subassembly?: string;
  movingGroup?: string;
}

export interface GroupPartDefinition extends PartBase { type: 'group'; }
export interface MeshPartDefinition extends PartBase { type: 'mesh'; geometry: GeometryDefinition; geometryVariants?:Record<string,GeometryDefinition>; material: string; }
export type PartDefinition = GroupPartDefinition | MeshPartDefinition;

export interface ProductDefinition {
  rendering?: { lighting: 'default' | 'instructional-review'; cameraControls: 'default' | 'instructional' };
  id: string;
  name: string;
  unit: 'cm' | 'mm' | 'm' | 'in';
  sourceNote?: string;
  calibration?: {
    conversion: '1 in = 2.54 cm';
    dimensions: DimensionCalibration[];
  };
  evidenceGroups?: EvidenceGroup[];
  materials: Record<string, MaterialDefinition>;
  parts: PartDefinition[];
}
