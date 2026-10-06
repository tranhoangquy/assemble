import * as THREE from 'three';
import type { ConnectedInstallAction } from './InstallationPathResolver';
import type { InstallationPath, PathCollision } from './InstallationPath';
import { ProductTransformIndex } from './ProductTransformIndex';
import type { ProductDefinition } from '@/types/product';
import type { Vector3Tuple } from '@/types/product';

export class InstallationCollisionChecker {
  private readonly transforms: ProductTransformIndex;

  constructor(product: ProductDefinition, rotations?: Map<string,Vector3Tuple>) {
    this.transforms = new ProductTransformIndex(product,rotations);
  }

  check(path: InstallationPath, action: ConnectedInstallAction, installed: Set<string>, placements = new Map<string, Vector3Tuple>()): PathCollision[] {
    const result: PathCollision[] = [];
    // Secured children belong to the moving rigid assembly. Testing their
    // old/final world bounds against the parent's travelling bounds invents
    // a collision with its own contents. Unrelated mates are NOT excluded.
    const ignored = new Set([path.part, path.targetPart, ...this.transforms.descendants(path.part), ...this.transforms.ancestors(path.part), ...this.transforms.ancestors(path.targetPart)]);
    const allowedContacts = new Set(action.installation?.allowedContacts ?? []);
    const expectedSeen = new Set<string>();
    const tolerance = action.installation?.collisionTolerance ?? 0.35;
    const sampleCount = Math.max(3, action.installation?.sampleCount ?? 8);
    const movingParts=[path.part,...[...this.transforms.descendants(path.part)].filter(id=>installed.has(id))];
    const rootPosition=this.transforms.worldPosition(path.part);

    for (let segmentIndex = 0; segmentIndex < path.waypoints.length - 1; segmentIndex += 1) {
      const from = path.waypoints[segmentIndex];
      const to = path.waypoints[segmentIndex + 1];
      for (let sample = 0; sample <= sampleCount; sample += 1) {
        if (segmentIndex === path.waypoints.length - 2 && sample === sampleCount) continue;
        const position = from.position.clone().lerp(to.position, sample / sampleCount);
        for(const movingPart of movingParts){
          // Installation translation transports each secured child's own
          // physical bounds, rather than using one enclosing parent box.
          const childPosition=movingPart===path.part?position:this.transforms.worldPosition(movingPart).add(position.clone().sub(rootPosition));
          const moving = this.transforms.boxAtPosition(movingPart, childPosition);
          if (!moving) continue;
          const shrunken = moving.clone().expandByScalar(-tolerance);
          for (const blocker of installed) {
            if (ignored.has(blocker)) continue;
            const placed = placements.get(blocker);
            const blocking = placed ? this.transforms.boxAtPosition(blocker, new THREE.Vector3(...placed)) : this.transforms.boxAtFinal(blocker);
            if (!blocking || !shrunken.intersectsBox(blocking)) continue;
            const expected = allowedContacts.has(blocker);
            if (expected && expectedSeen.has(blocker)) continue;
            result.push({
              operationId: path.operationId,
              movingPart,
              blockedBy: blocker,
              segment: `${from.stage} -> ${to.stage}`,
              sample,
              movingBox: moving.clone(),
              blockingBox: blocking.clone(),
              expected,
            });
            if (expected) {
              expectedSeen.add(blocker);
              continue;
            }
            return result;
          }
        }
      }
    }
    return result;
  }

  checkRotation(target: string, axis: 'x' | 'y' | 'z', from: number, to: number, installed: Set<string>, sampleCount = 18): PathCollision[] {
    const result: PathCollision[] = [];
    const movingIds = this.transforms.descendants(target);
    movingIds.add(target);
    const blockers = [...installed].filter((id) => !movingIds.has(id) && !this.transforms.ancestors(target).has(id));
    const expectedPivotContacts = new Set(blockers.filter((id) => {
      const part = this.transforms.parts.get(id);
      return part?.connectionPoints?.some((point) => point.kind === 'pivot' || point.kind === 'bracket')
        || (part?.category === 'hardware' && (id.includes('pivot') || id.includes('bracket') || id.includes('washer')));
    }));
    for (let sample = 1; sample < sampleCount; sample += 1) {
      const angle = from + (to - from) * sample / sampleCount;
      for (const movingPart of movingIds) {
        if (!installed.has(movingPart)) continue;
        const movingBox = this.transforms.rotatedBoxAround(movingPart, target, axis, angle);
        if (!movingBox) continue;
        const shrunken = movingBox.clone().expandByScalar(-0.5);
        for (const blocker of blockers) {
          const blockingBox = this.transforms.boxAtFinal(blocker);
          if (!blockingBox || !shrunken.intersectsBox(blockingBox)) continue;
          if (expectedPivotContacts.has(blocker)) continue;
          result.push({
            operationId: `rotate:${target}`,
            movingPart,
            blockedBy: blocker,
            segment: `ROTATION ${axis.toUpperCase()} ${THREE.MathUtils.radToDeg(angle).toFixed(1)}°`,
            sample,
            movingBox,
            blockingBox,
            expected: false,
          });
          return result;
        }
      }
    }
    return result;
  }
}
