import type { EvidenceConfidence, EvidenceSource, Vector3Tuple } from './product';

interface TimedActionBase {
  at?: number;
  duration?: number;
  ease?: string;
  source?: EvidenceSource;
  confidence?: EvidenceConfidence;
}
export interface ConnectionReference { part: string; point: string; }
export type AssemblyPartState = 'UNASSEMBLED' | 'STAGED' | 'ALIGNING' | 'INSTALLED' | 'SECURED';
export type HardwareState = 'HIDDEN' | 'STAGED' | 'ALIGNING' | 'INSERTING' | 'TIGHTENING' | 'SECURED';
export interface InstallationDefinition {
  /** A connection assembled in a supported staging position before its whole frame moves. */
  seatedOffset?: Vector3Tuple;
  allowStagedTarget?: boolean;
  stagingOffset?: Vector3Tuple;
  preInstallOffset?: Vector3Tuple;
  approachDirection?: Vector3Tuple;
  approachDistance?: number;
  sampleCount?: number;
  collisionTolerance?: number;
  allowedContacts?: string[];
  estimated?: boolean;
  mechanicalPhases?: boolean;
  /** Physical distance from seated center to first contact (overrides legacy recipe). */
  contactDistance?:number;
  /** Normalized phase weights. Omitted preserves the original renderer timing. */
  motionTiming?: { approach: number; contact: number; feed: number; seat: number };
}
interface ConnectedActionBase extends TimedActionBase {
  id?: string;
  target: string;
  connection: ConnectionReference;
  targetPoint?: string;
  dependsOn?: string[];
  installation?: InstallationDefinition;
  secures?: string[];
}
export interface MoveAction extends TimedActionBase { type: 'move'; target: string; from?: Vector3Tuple; to: Vector3Tuple; }
export interface RotateAction extends TimedActionBase { type: 'rotate'; target: string; axis?: 'x' | 'y' | 'z'; space?:'world'; from?: number | Vector3Tuple; to: number | Vector3Tuple; unit?: 'deg' | 'rad'; }
export interface ScaleAction extends TimedActionBase { type: 'scale'; target: string; from?: Vector3Tuple; to: Vector3Tuple; }
export interface ShowAction extends TimedActionBase { type: 'show'; target: string; }
export interface HideAction extends TimedActionBase { type: 'hide'; target: string; }
export interface GeometryVariantAction extends TimedActionBase {type:'geometryVariant';target:string;variant:string;}
/** Rigid motion around a defined local pivot; angles are degrees. */
export interface PivotPoseAction extends TimedActionBase {
  type:'pivotPose';target:string;axis:'x'|'y'|'z'|Vector3Tuple;localPivot:Vector3Tuple;
  from:{pivot:Vector3Tuple;angle:number};to:{pivot:Vector3Tuple;angle:number};
}
export interface LinkAnchor {part:string;point:Vector3Tuple;}
/** A telescopic linkage whose free end remains in world space until connected. */
export interface TelescopicLinkAction extends TimedActionBase {
  type:'telescopicLink';target:string;rod:string;end:string;bodyLength:number;
  anchorA:LinkAnchor;anchorB?:LinkAnchor;freeOffset:Vector3Tuple;
}
export interface HighlightAction extends TimedActionBase { type: 'highlight'; target: string; color?: string; intensity?: number; }
export interface UnhighlightAction extends TimedActionBase { type: 'unhighlight'; target: string; }
export interface ScrewAction extends TimedActionBase { type: 'screw'; target: string; axis: 'x' | 'y' | 'z'; distance: number; turns: number; }
export interface WaitAction extends TimedActionBase { type: 'wait'; duration: number; }
export interface CameraAction extends TimedActionBase { type: 'camera'; from?: string; to: string; }
export interface ExplodeAction extends TimedActionBase { type: 'explode'; amount: number; }
export interface GhostAction extends TimedActionBase { type: 'ghost'; target: string; visible: boolean; }
export interface FocusAction extends TimedActionBase { type: 'focus'; targets: string[]; related?: string[]; dimOpacity?: number; }
export interface ClearFocusAction extends TimedActionBase { type: 'clearFocus'; }
export interface VisibilityAction extends TimedActionBase { type: 'visibility'; targets: string[] | 'all'; visible: boolean; }
export interface InstallPartAction extends ConnectedActionBase {
  type: 'installPart' | 'alignPart' | 'insertPart' | 'installBracket' | 'installHinge';
  fromOffset?: Vector3Tuple;
  approachDistance?: number;
}
export interface InstallFastenerAction extends ConnectedActionBase {
  type: 'installScrew' | 'installBolt' | 'installNut' | 'installDowel';
  distance?: number;
  turns?: number;
  spinAxis?: 'x' | 'y' | 'z';
}
export interface InstallWasherAction extends ConnectedActionBase {
  type: 'installWasher';
  distance?: number;
}
export interface TestPivotAction extends TimedActionBase {
  type: 'testPivot' | 'testMechanism';
  target: string;
  axis: 'x' | 'y' | 'z';
  from?: number;
  to: number;
  returnTo?: number;
  unit?: 'deg' | 'rad';
}

export type AnimationAction = PivotPoseAction | TelescopicLinkAction | GeometryVariantAction | MoveAction | RotateAction | ScaleAction | ShowAction | HideAction | HighlightAction | UnhighlightAction | ScrewAction | WaitAction | CameraAction | ExplodeAction | GhostAction | FocusAction | ClearFocusAction | VisibilityAction | InstallPartAction | InstallFastenerAction | InstallWasherAction | TestPivotAction;

export interface AssemblyStep {
  id: string;
  name: string;
  description?: string;
  dependsOn?: string[];
  accessBarrierFor?: string[];
  orderSource?: 'reference' | 'estimated';
  source?: EvidenceSource;
  confidence?: EvidenceConfidence;
  actions: AnimationAction[];
}
export interface AssemblyDefinition {
  id: string;
  sourceNote?: string;
  steps: AssemblyStep[];
}
