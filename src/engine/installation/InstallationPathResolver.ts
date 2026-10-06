import * as THREE from 'three';
import type { InstallFastenerAction, InstallPartAction, InstallWasherAction } from '@/types/assembly';
import type { ProductDefinition } from '@/types/product';
import type { InstallationPath, InstallationWaypoint } from './InstallationPath';
import { ProductTransformIndex } from './ProductTransformIndex';

export type ConnectedInstallAction = InstallPartAction | InstallFastenerAction | InstallWasherAction;

export class InstallationPathResolver {
  private readonly transforms: ProductTransformIndex;

  constructor(private readonly product: ProductDefinition) {
    this.transforms = new ProductTransformIndex(product);
  }

  resolve(action: ConnectedInstallAction, operationId: string): InstallationPath {
    const part = this.transforms.parts.get(action.target);
    const final = this.transforms.worldPosition(action.target);
    if(action.installation?.seatedOffset)final.add(new THREE.Vector3(...action.installation.seatedOffset));
    const normal = action.installation?.approachDirection
      ? new THREE.Vector3(...action.installation.approachDirection).normalize()
      : this.transforms.connectionNormalWorld(action.connection.part, action.connection.point) ?? new THREE.Vector3(0, 0, 1);
    const distance = action.installation?.approachDistance ?? ('distance' in action ? action.distance : undefined) ?? 18;
    if (action.installation?.mechanicalPhases) {
      return { operationId, part: action.target, targetPart: action.connection.part, connectionPoint: action.connection.point, approachDirection: normal, waypoints: [
        {stage:'START',position:final.clone().addScaledVector(normal,distance)},
        {stage:'ALIGN',position:final.clone().addScaledVector(normal,action.installation.contactDistance??(action.type==='installBolt'?1.8:0.7))},
        {stage:'FINAL',position:final},
      ] };
    }
    const offset = action.installation?.stagingOffset ?? ('fromOffset' in action ? action.fromOffset : undefined) ?? part?.explodeOffset ?? normal.clone().multiplyScalar(distance * 2.5).toArray();
    const staging = final.clone().add(new THREE.Vector3(...offset));
    const start = part?.explodeOffset ? final.clone().add(new THREE.Vector3(...part.explodeOffset)) : staging.clone();
    const preOffset = action.installation?.preInstallOffset;
    const preInstall = preOffset ? final.clone().add(new THREE.Vector3(...preOffset)) : staging.clone().lerp(final.clone().add(normal.clone().multiplyScalar(distance)), 0.55);
    const align = final.clone().add(normal.clone().multiplyScalar(distance));
    const raw: InstallationWaypoint[] = [
      { stage: 'START', position: start },
      { stage: 'STAGING', position: staging },
      { stage: 'PRE_INSTALL', position: preInstall },
      { stage: 'ALIGN', position: align },
      { stage: 'FINAL', position: final },
    ];
    const waypoints = raw.filter((waypoint, index) => index === 0 || waypoint.position.distanceTo(raw[index - 1].position) > 0.001);
    return {
      operationId,
      part: action.target,
      targetPart: action.connection.part,
      connectionPoint: action.connection.point,
      approachDirection: normal,
      waypoints,
    };
  }
}
