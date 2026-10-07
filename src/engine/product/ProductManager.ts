import type { ProductPackage } from '@/types/product-package';
import { selectVideoId } from '@/engine/video/PresentationSelection';
import { ProductEngine } from './ProductEngine';
import { SceneEngine } from '@/engine/video/SceneEngine';
import { AssemblyValidator, type AssemblyValidationResult } from '@/engine/assembly/AssemblyValidator';

export class ProductManager {
  private readonly products = new Map<string, ProductPackage>();
  private readonly validations = new Map<string, AssemblyValidationResult>();

  constructor(catalog: readonly ProductPackage[]) {
    for (const entry of catalog) {
      if (this.products.has(entry.id)) throw new Error(`Duplicate product catalog id: ${entry.id}`);
      ProductEngine.build(entry.product);
      new SceneEngine(entry.video, entry.assembly);
      this.validateTargets(entry);
      if(entry.shortPresentation) { const short=selectVideoId(entry,entry.shortPresentation.video.id); new SceneEngine(short.video,short.assembly); this.validateTargets(short); }
      this.validations.set(entry.id, AssemblyValidator.validate(entry.product, entry.assembly));
      this.products.set(entry.id, entry);
    }
  }

  list(): readonly ProductPackage[] { return [...this.products.values()]; }
  has(id: string): boolean { return this.products.has(id); }
  load(id: string, videoId?: string): ProductPackage {
    const entry = this.products.get(id);
    if (!entry) throw new Error(`Unknown product: ${id}`);
    return selectVideoId(entry, videoId);
  }
  validation(id: string): AssemblyValidationResult {
    const validation = this.validations.get(id);
    if (!validation) throw new Error(`Unknown product: ${id}`);
    return validation;
  }

  private validateTargets(entry: ProductPackage): void {
    const partIds = new Set(entry.product.parts.map((part) => part.id));
    const points = new Map(entry.product.parts.map((part) => [part.id, new Set((part.connectionPoints ?? []).map((point) => point.id))]));
    const sceneIds = new Set(entry.video.scenes.map((scene) => scene.id));
    for (const quickAction of entry.video.quickActions ?? []) {
      if (!sceneIds.has(quickAction.sceneId)) throw new Error(`Quick action "${quickAction.id}" references unknown scene "${quickAction.sceneId}"`);
    }
    const actions = [
      ...entry.assembly.steps.flatMap((step) => step.actions),
      ...entry.video.scenes.flatMap((scene) => scene.actions),
    ];
    for (const action of actions) {
      if ('target' in action && !partIds.has(action.target)) throw new Error(`Action references unknown target: ${action.target}`);
      if (action.type === 'focus') {
        for (const id of [...action.targets, ...(action.related ?? [])]) {
          if (!partIds.has(id)) throw new Error(`Focus action references unknown target: ${id}`);
        }
      }
      if (action.type === 'visibility') {
        if (action.targets !== 'all') {
          for (const id of action.targets) if (!partIds.has(id)) throw new Error(`Visibility action references unknown target: ${id}`);
        }
      }
      if ('connection' in action) {
        if (!partIds.has(action.connection.part)) throw new Error(`Action references unknown connection part: ${action.connection.part}`);
        if (!points.get(action.connection.part)?.has(action.connection.point)) {
          throw new Error(`Action references unknown connection point: ${action.connection.part}.${action.connection.point}`);
        }
        if (action.targetPoint && !points.get(action.target)?.has(action.targetPoint)) {
          throw new Error(`Action references unknown target connection point: ${action.target}.${action.targetPoint}`);
        }
      }
    }
  }
}
