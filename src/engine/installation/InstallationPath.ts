import * as THREE from 'three';

export type InstallationStage = 'START' | 'STAGING' | 'PRE_INSTALL' | 'ALIGN' | 'FINAL';

export interface InstallationWaypoint {
  stage: InstallationStage;
  position: THREE.Vector3;
}

export interface InstallationPath {
  operationId: string;
  part: string;
  targetPart: string;
  connectionPoint: string;
  approachDirection: THREE.Vector3;
  waypoints: InstallationWaypoint[];
}

export interface PathCollision {
  operationId: string;
  movingPart: string;
  blockedBy: string;
  segment: string;
  sample: number;
  movingBox: THREE.Box3;
  blockingBox: THREE.Box3;
  expected: boolean;
}
