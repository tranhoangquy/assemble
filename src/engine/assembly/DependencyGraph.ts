export interface DependencyNode { id: string; dependsOn: string[]; }

export interface DependencyGraphResult {
  missing: Array<{ node: string; dependency: string }>;
  cycles: string[][];
  order: string[];
}

export class DependencyGraph {
  private readonly nodes = new Map<string, DependencyNode>();

  constructor(nodes: DependencyNode[]) {
    for (const node of nodes) this.nodes.set(node.id, node);
  }

  analyze(): DependencyGraphResult {
    const missing: DependencyGraphResult['missing'] = [];
    const cycles: string[][] = [];
    const order: string[] = [];
    const visiting: string[] = [];
    const visited = new Set<string>();

    const visit = (id: string): void => {
      if (visited.has(id)) return;
      const cycleAt = visiting.indexOf(id);
      if (cycleAt >= 0) {
        cycles.push([...visiting.slice(cycleAt), id]);
        return;
      }
      const node = this.nodes.get(id);
      if (!node) return;
      visiting.push(id);
      for (const dependency of node.dependsOn) {
        if (!this.nodes.has(dependency)) missing.push({ node: id, dependency });
        else visit(dependency);
      }
      visiting.pop();
      visited.add(id);
      order.push(id);
    };

    for (const id of this.nodes.keys()) visit(id);
    return { missing, cycles, order };
  }
}
