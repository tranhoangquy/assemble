import type { AnimationAction, AssemblyDefinition, AssemblyStep } from '@/types/assembly';
import * as THREE from 'three';
import type { ProductDefinition, Vector3Tuple } from '@/types/product';
import { DependencyGraph } from './DependencyGraph';
import { InstallationCollisionChecker } from '@/engine/installation/InstallationCollisionChecker';
import { InstallationPathResolver, type ConnectedInstallAction } from '@/engine/installation/InstallationPathResolver';
import type { InstallationPath, PathCollision } from '@/engine/installation/InstallationPath';

export type ValidationSeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  message: string;
  step?: string;
  operation?: string;
  part?: string;
  target?: string;
  blockedBy?: string;
  segment?: string;
  blockedOperations?: string[];
}

export interface ValidatedInstallation {
  step: string;
  operation: string;
  action: ConnectedInstallAction;
  path: InstallationPath;
  collisions: PathCollision[];
  dependsOn: string[];
}

export interface AssemblyValidationResult {
  valid: boolean;
  stepsChecked: number;
  operationsChecked: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  installations: ValidatedInstallation[];
}

const connectedTypes = new Set(['installPart', 'alignPart', 'insertPart', 'installBracket', 'installHinge', 'installScrew', 'installBolt', 'installNut', 'installDowel', 'installWasher']);
const hardwareTypes = new Set(['installScrew', 'installBolt', 'installNut', 'installDowel', 'installWasher']);

export class AssemblyValidator {
  static validate(product: ProductDefinition, assembly: AssemblyDefinition): AssemblyValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];
    const installations: ValidatedInstallation[] = [];
    const partIds = new Set<string>();
    const duplicateParts = new Set<string>();
    for (const part of product.parts) {
      if (partIds.has(part.id)) duplicateParts.add(part.id);
      partIds.add(part.id);
    }
    for (const id of duplicateParts) errors.push(this.issue('DUPLICATE_ID', 'CRITICAL', `Duplicate part id: ${id}`, { part: id }));

    const stepGraph = new DependencyGraph(assembly.steps.map((step) => ({ id: step.id, dependsOn: step.dependsOn ?? [] }))).analyze();
    for (const missing of stepGraph.missing) errors.push(this.issue('MISSING_DEPENDENCY', 'CRITICAL', `${missing.node} depends on missing step ${missing.dependency}`, { step: missing.node }));
    for (const cycle of stepGraph.cycles) errors.push(this.issue('CIRCULAR_DEPENDENCY', 'CRITICAL', `Circular dependency: ${cycle.join(' -> ')}`, { step: cycle[0] }));

    for (const step of assembly.steps) {
      if (step.orderSource === 'estimated') warnings.push(this.issue('ESTIMATED_INSTALLATION_ORDER', 'WARNING', `${step.name} uses an estimated order`, { step: step.id }));
    }

    const operationIds = new Set<string>();
    assembly.steps.forEach((step) => step.actions.forEach((action, index) => {
      if (this.isConnected(action)) operationIds.add(this.operationId(step, action, index));
    }));
    const actionGraphNodes: Array<{ id: string; dependsOn: string[] }> = [];
    assembly.steps.forEach((step) => step.actions.forEach((action, index) => {
      if (!this.isConnected(action)) return;
      actionGraphNodes.push({ id: this.operationId(step, action, index), dependsOn: action.dependsOn ?? [] });
    }));
    const actionGraph = new DependencyGraph(actionGraphNodes).analyze();
    for (const missing of actionGraph.missing) errors.push(this.issue('MISSING_DEPENDENCY', 'CRITICAL', `${missing.node} depends on missing operation ${missing.dependency}`, { operation: missing.node }));
    for (const cycle of actionGraph.cycles) errors.push(this.issue('CIRCULAR_DEPENDENCY', 'CRITICAL', `Circular operation dependency: ${cycle.join(' -> ')}`, { operation: cycle[0] }));

    const resolver = new InstallationPathResolver(product);
    const rotations = new Map<string,Vector3Tuple>();
    const collisionChecker = new InstallationCollisionChecker(product,rotations);
    const installed = new Set(product.parts.filter((part) => part.type === 'group').map((part) => part.id));
    const installedBy = new Map<string, string>();
    const placements = new Map<string, Vector3Tuple>();
    let operationsChecked = 0;

    const stepsById = new Map(assembly.steps.map((step) => [step.id, step]));
    const validationOrder = stepGraph.order.map((id) => stepsById.get(id)).filter((step): step is AssemblyStep => Boolean(step));
    validationOrder.forEach((step) => {
      for (const blockedPart of step.accessBarrierFor ?? []) {
        if (!installed.has(blockedPart)) {
          const blockedOperations = assembly.steps.flatMap((candidate) => candidate.actions.map((action, index) => ({ candidate, action, index })))
            .filter(({ action }) => 'target' in action && action.target === blockedPart)
            .map(({ candidate, action, index }) => this.isConnected(action) ? this.operationId(candidate, action, index) : candidate.id);
          errors.push(this.issue('PREMATURE_CLOSURE', 'CRITICAL', `${step.name} closes access before ${blockedPart} is installed`, { step: step.id, part: blockedPart, blockedOperations }));
        }
      }
      const ordered = step.actions.map((action, index) => ({ action, index })).sort((a, b) => (a.action.at ?? 0) - (b.action.at ?? 0) || a.index - b.index);
      for (const { action, index } of ordered) {
        if ('target' in action && !partIds.has(action.target)) {
          errors.push(this.issue('MISSING_PART', 'CRITICAL', `Unknown moving part ${action.target}`, { step: step.id, part: action.target }));
          continue;
        }
        if (!this.isConnected(action)) {
          if(action.type==='geometryVariant'){
            const part=product.parts.find(p=>p.id===action.target);
            if(part?.type!=='mesh'||!part.geometryVariants?.[action.variant])errors.push(this.issue('MISSING_GEOMETRY_VARIANT','ERROR',`Unknown geometry variant ${action.target}.${action.variant}`,{step:step.id,part:action.target}));
          }
          if (action.type === 'move' && partIds.has(action.target)) {
            placements.set(action.target, action.to);
            const definition = product.parts.find(p=>p.id===action.target)!;
            if (action.to.every((v,i)=>Math.abs(v-definition.position[i])<0.001)) installed.add(action.target);
            // Moving a secured subassembly to a new work area does not uninstall it.
            // Freshly staged loose parts are not added until they reach their connection.
          }
          if (action.type === 'rotate') {
            const definition = product.parts.find(p=>p.id===action.target)!;
            const current = [...(rotations.get(action.target) ?? definition.rotation ?? [0,0,0])] as Vector3Tuple;
            const degrees = action.unit === 'rad' ? 180/Math.PI : 1;
            if(action.space==='world'&&action.axis&&typeof action.to==='number'){
              const base=new THREE.Quaternion().setFromEuler(new THREE.Euler(...(definition.rotation??[0,0,0]).map(v=>v*Math.PI/180) as Vector3Tuple));
              const axis=new THREE.Vector3(action.axis==='x'?1:0,action.axis==='y'?1:0,action.axis==='z'?1:0);
              const euler=new THREE.Euler().setFromQuaternion(base.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,action.to*degrees*Math.PI/180)));
              rotations.set(action.target,[euler.x,euler.y,euler.z].map(v=>v*180/Math.PI) as Vector3Tuple);
            }else if (Array.isArray(action.to)) rotations.set(action.target,action.to.map(v=>v*degrees) as Vector3Tuple);
            else {current[action.axis==='x'?0:action.axis==='y'?1:2]=action.to*degrees;rotations.set(action.target,current);}
          }
          if (action.type === 'testPivot' || action.type === 'testMechanism') {
            operationsChecked += 1;
            const factor = action.unit === 'rad' ? 1 : Math.PI / 180;
            const rotationCollisions = collisionChecker.checkRotation(action.target, action.axis, (action.from ?? 0) * factor, action.to * factor, installed);
            for (const collision of rotationCollisions) warnings.push(this.issue('INVALID_COLLISION', 'WARNING', `${collision.movingPart} rotation intersects ${collision.blockedBy} at ${collision.segment}`, {
              step: step.id, operation: `rotate:${action.target}`, part: collision.movingPart, blockedBy: collision.blockedBy, segment: collision.segment,
            }));
          }
          continue;
        }
        operationsChecked += 1;
        const operation = this.operationId(step, action, index);
        const targetPart = product.parts.find((part) => part.id === action.connection.part);
        if (!targetPart) {
          errors.push(this.issue('MISSING_TARGET', 'CRITICAL', `Connection target ${action.connection.part} is missing`, { step: step.id, operation, part: action.target, target: action.connection.part }));
          continue;
        }
        if (!(targetPart.connectionPoints ?? []).some((point) => point.id === action.connection.point)) {
          errors.push(this.issue('MISSING_CONNECTION', 'CRITICAL', `Connection point ${action.connection.part}.${action.connection.point} is missing`, { step: step.id, operation, part: action.target, target: action.connection.part }));
          continue;
        }
        if (installedBy.has(action.target)) {
          errors.push(this.issue('DUPLICATE_INSTALLATION', 'ERROR', `${action.target} is installed more than once`, { step: step.id, operation, part: action.target }));
        }
        if (targetPart.type === 'mesh' && !installed.has(targetPart.id) && !(action.installation?.allowStagedTarget && placements.has(targetPart.id))) {
          const code = hardwareTypes.has(action.type) ? 'HARDWARE_BEFORE_PART' : 'TARGET_NOT_INSTALLED';
          errors.push(this.issue(code, 'ERROR', `${action.target} targets ${targetPart.id} before it is installed`, { step: step.id, operation, part: action.target, target: targetPart.id }));
        }
        for (const dependency of action.dependsOn ?? []) {
          if (!operationIds.has(dependency)) continue;
          const dependencyTarget = installations.find((candidate) => candidate.operation === dependency)?.action.target;
          if (dependencyTarget && !installed.has(dependencyTarget)) errors.push(this.issue('INSTALL_BEFORE_DEPENDENCY', 'ERROR', `${operation} runs before ${dependency}`, { step: step.id, operation, part: action.target }));
        }
        const path = resolver.resolve(action, operation);
        const collisions = collisionChecker.check(path, action, new Set([...installed,...placements.keys()]), placements);
        for (const collision of collisions) {
          if (collision.expected) {
            info.push(this.issue('EXPECTED_CONTACT', 'INFO', `${action.target} contacts ${collision.blockedBy} as allowed`, {
              step: step.id, operation, part: action.target, blockedBy: collision.blockedBy, segment: collision.segment,
            }));
            continue;
          }
          const explicit = Boolean(action.installation);
          const severity: ValidationSeverity = explicit ? 'ERROR' : 'WARNING';
          const code = hardwareTypes.has(action.type) ? 'TOOL_ACCESS_BLOCKED' : 'INSTALL_PATH_BLOCKED';
          const issue = this.issue(code, severity, `${action.target} is blocked by ${collision.blockedBy} on ${collision.segment}`, {
            step: step.id, operation, part: action.target, blockedBy: collision.blockedBy, segment: collision.segment,
          });
          (severity === 'ERROR' ? errors : warnings).push(issue);
          if (explicit) console.warn('[ASSEMBLY COLLISION]', { movingPart: action.target, blockedBy: collision.blockedBy, segment: collision.segment, step: step.id });
        }
        installations.push({ step: step.id, operation, action, path, collisions, dependsOn: [...(step.dependsOn ?? []), ...(action.dependsOn ?? [])] });
        installed.add(action.target);
        if(action.installation?.seatedOffset){
          const definition=product.parts.find(p=>p.id===action.target)!;
          placements.set(action.target,definition.position.map((v,i)=>v+action.installation!.seatedOffset![i]) as Vector3Tuple);
        }else placements.delete(action.target);
        installedBy.set(action.target, operation);
        for (const secured of action.secures ?? []) installed.add(secured);
      }
    });

    for (const installation of installations) {
      if (!hardwareTypes.has(installation.action.type) && !(installation.action.secures?.length)) {
        info.push(this.issue('PART_HAS_NO_HARDWARE', 'INFO', `${installation.action.target} has no explicit securing hardware`, { step: installation.step, operation: installation.operation, part: installation.action.target }));
      }
    }
    const hidesFutureParts = validationOrder[0]?.actions.some((action) => action.type === 'visibility' && action.targets === 'all' && action.visible === false);
    if (!hidesFutureParts) {
      for (const installation of installations) {
        const part = product.parts.find((candidate) => candidate.id === installation.action.target);
        if (part && part.visible !== false) warnings.push(this.issue('FUTURE_PART_OCCUPIES_FINAL_POSITION', 'WARNING', `${part.id} is visible at its final transform before its installation state is established`, {
          step: installation.step, operation: installation.operation, part: part.id,
        }));
      }
    }
    return { valid: errors.length === 0, stepsChecked: assembly.steps.length, operationsChecked, errors, warnings, info, installations };
  }

  private static isConnected(action: AnimationAction): action is ConnectedInstallAction {
    return connectedTypes.has(action.type) && 'connection' in action;
  }

  private static operationId(step: AssemblyStep, action: ConnectedInstallAction, index: number): string {
    return action.id ?? `${step.id}:${action.target}:${index}`;
  }

  private static issue(code: string, severity: ValidationSeverity, message: string, details: Partial<ValidationIssue>): ValidationIssue {
    return { code, severity, message, ...details };
  }
}
