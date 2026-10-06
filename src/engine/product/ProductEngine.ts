import type { PartDefinition, ProductDefinition } from '@/types/product';

export interface ProductTree {
  roots: PartDefinition[];
  children: Map<string, PartDefinition[]>;
  byId: Map<string, PartDefinition>;
}

export class ProductEngine {
  static build(definition: ProductDefinition): ProductTree {
    const byId = new Map<string, PartDefinition>();
    const children = new Map<string, PartDefinition[]>();
    const roots: PartDefinition[] = [];

    for (const part of definition.parts) {
      if (byId.has(part.id)) throw new Error(`Duplicate part id: ${part.id}`);
      if (part.type === 'mesh' && !definition.materials[part.material]) {
        throw new Error(`Part "${part.id}" references unknown material "${part.material}"`);
      }
      byId.set(part.id, part);
      const pointIds = new Set<string>();
      for (const point of part.connectionPoints ?? []) {
        if (pointIds.has(point.id)) throw new Error(`Part "${part.id}" has duplicate connection point "${point.id}"`);
        if (point.normal.every((value) => value === 0)) throw new Error(`Connection point "${part.id}.${point.id}" has a zero normal`);
        pointIds.add(point.id);
      }
    }

    for (const group of definition.evidenceGroups ?? []) {
      for (const id of group.parts) if (!byId.has(id)) throw new Error(`Evidence group references unknown part "${id}"`);
    }
    for (const dimension of definition.calibration?.dimensions ?? []) {
      const converted = dimension.inches * 2.54;
      if (Math.abs(converted - dimension.centimeters) > 0.01) {
        throw new Error(`Dimension calibration mismatch for "${dimension.label}": ${dimension.inches} in is ${converted.toFixed(3)} cm`);
      }
    }

    for (const part of definition.parts) {
      if (!part.parent) {
        roots.push(part);
        continue;
      }
      if (!byId.has(part.parent)) throw new Error(`Part "${part.id}" references unknown parent "${part.parent}"`);
      const siblings = children.get(part.parent) ?? [];
      siblings.push(part);
      children.set(part.parent, siblings);
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string): void => {
      if (visiting.has(id)) throw new Error(`Circular product hierarchy at "${id}"`);
      if (visited.has(id)) return;
      visiting.add(id);
      for (const child of children.get(id) ?? []) visit(child.id);
      visiting.delete(id);
      visited.add(id);
    };
    for (const root of roots) visit(root.id);
    if (visited.size !== definition.parts.length) throw new Error('Product hierarchy contains an unreachable cycle');

    for (const part of definition.parts) {
      for (const point of part.connectionPoints ?? []) {
        if (!point.mate) continue;
        const mate = byId.get(point.mate.part);
        if (!mate) throw new Error(`Connection point "${part.id}.${point.id}" references unknown part "${point.mate.part}"`);
        if (!(mate.connectionPoints ?? []).some((candidate) => candidate.id === point.mate?.point)) {
          throw new Error(`Connection point "${part.id}.${point.id}" references unknown point "${point.mate.part}.${point.mate.point}"`);
        }
      }
    }

    return { roots, children, byId };
  }
}
