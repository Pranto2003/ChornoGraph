/**
 * ALGORITHM: Union-Find (Disjoint Set Union) with directed-cycle prefilter
 * TIME COMPLEXITY: O(E * α(V)) to build disjoint sets plus O(V + E) only when
 * the candidate edge connects nodes that are already weakly connected
 * SPACE COMPLEXITY: O(V + E) for the parent/rank maps and adjacency fallback
 *
 * WHY UNION-FIND OVER RUNNING DFS FOR EVERY EDGE:
 * Plain DFS on every connect gesture would re-walk large portions of the graph
 * even when the two nodes live in different weakly connected components and
 * clearly cannot form a cycle. Union-Find cheaply rules out those cases first.
 * Because ChronoGraph models directed graphs, the DSU check is paired with a
 * focused reachability pass only when necessary to preserve correctness.
 *
 * IN CHRONOGRAPH:
 * This module sits directly on the graph editor hot path. As users drag new
 * dependency edges, ChronoGraph needs near-instant validation. DSU keeps that
 * operation fast while the directional reachability check prevents invalid
 * circular schedules from ever entering the project state.
 */

export type DirectedEdge = [string, string];

export class UnionFind {
  private parents = new Map<string, string>();
  private ranks = new Map<string, number>();

  makeSet(value: string): void {
    if (!this.parents.has(value)) {
      this.parents.set(value, value);
      this.ranks.set(value, 0);
    }
  }

  find(value: string): string {
    if (!this.parents.has(value)) {
      this.makeSet(value);
    }

    const parent = this.parents.get(value) as string;

    if (parent !== value) {
      const root = this.find(parent);
      this.parents.set(value, root);
      return root;
    }

    return parent;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);

    if (rootA === rootB) {
      return;
    }

    const rankA = this.ranks.get(rootA) ?? 0;
    const rankB = this.ranks.get(rootB) ?? 0;

    if (rankA < rankB) {
      this.parents.set(rootA, rootB);
      return;
    }

    if (rankA > rankB) {
      this.parents.set(rootB, rootA);
      return;
    }

    this.parents.set(rootB, rootA);
    this.ranks.set(rootA, rankA + 1);
  }

  connected(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
  }

  wouldCreateCycle(from: string, to: string, edges: DirectedEdge[]): boolean {
    if (from === to) {
      return true;
    }

    this.parents.clear();
    this.ranks.clear();

    for (const [edgeFrom, edgeTo] of edges) {
      this.makeSet(edgeFrom);
      this.makeSet(edgeTo);
      this.union(edgeFrom, edgeTo);
    }

    this.makeSet(from);
    this.makeSet(to);

    if (!this.connected(from, to)) {
      return false;
    }

    const adjacency = new Map<string, string[]>();

    for (const [edgeFrom, edgeTo] of edges) {
      if (!adjacency.has(edgeFrom)) {
        adjacency.set(edgeFrom, []);
      }

      adjacency.get(edgeFrom)?.push(edgeTo);
    }

    const queue = [to];
    const visited = new Set<string>([to]);
    let cursor = 0;

    while (cursor < queue.length) {
      const current = queue[cursor];
      cursor += 1;

      if (current === from) {
        return true;
      }

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return false;
  }
}
