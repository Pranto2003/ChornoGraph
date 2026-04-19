/**
 * ALGORITHM: Directed Acyclic Graph abstraction backed by adjacency maps
 * TIME COMPLEXITY: Node and edge mutations are O(1) average-case, while
 * traversal-oriented methods such as topological sort, reachability, and longest
 * path are O(V + E)
 * SPACE COMPLEXITY: O(V + E) for forward and reverse adjacency maps plus node
 * metadata
 *
 * WHY THIS ABSTRACTION OVER AD-HOC ARRAYS:
 * ChronoGraph repeatedly needs fast predecessor lookups, successor lookups, and
 * graph-wide traversals. Centralizing those concerns in a DAG class prevents
 * duplicated indexing logic and makes cycle validation, CPM traversal, and
 * what-if propagation deterministic and testable.
 *
 * IN CHRONOGRAPH:
 * The graph editor, CPM engine, and simulation system all speak through this
 * DAG layer. It is the authoritative in-memory representation of task
 * dependencies, enabling scheduling algorithms to operate on a stable, generic
 * structure instead of UI-specific React Flow state.
 */

import { UnionFind, type DirectedEdge } from "@/lib/graph/cycle-detection";
import { kahnsTopologicalSort } from "@/lib/graph/topological-sort";

export class DAG<T> {
  private adjacencyList = new Map<string, Set<string>>();
  private reverseAdjacencyList = new Map<string, Set<string>>();
  private nodes = new Map<string, T>();
  private edgeMetadata = new Map<string, unknown>();

  addNode(id: string, data: T): void {
    this.nodes.set(id, data);

    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, new Set<string>());
    }

    if (!this.reverseAdjacencyList.has(id)) {
      this.reverseAdjacencyList.set(id, new Set<string>());
    }
  }

  removeNode(id: string): void {
    for (const predecessor of this.getPredecessors(id)) {
      this.removeEdge(predecessor, id);
    }

    for (const successor of this.getSuccessors(id)) {
      this.removeEdge(id, successor);
    }

    this.adjacencyList.delete(id);
    this.reverseAdjacencyList.delete(id);
    this.nodes.delete(id);
  }

  addEdge(from: string, to: string, metadata?: unknown): void {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error("Both nodes must exist before creating an edge.");
    }

    const existingEdges = this.getAllEdges();
    const unionFind = new UnionFind();

    if (unionFind.wouldCreateCycle(from, to, existingEdges)) {
      throw new Error("Adding this dependency would create a cycle.");
    }

    this.adjacencyList.get(from)?.add(to);
    this.reverseAdjacencyList.get(to)?.add(from);

    if (metadata !== undefined) {
      this.edgeMetadata.set(`${from}->${to}`, metadata);
    }
  }

  removeEdge(from: string, to: string): void {
    this.adjacencyList.get(from)?.delete(to);
    this.reverseAdjacencyList.get(to)?.delete(from);
    this.edgeMetadata.delete(`${from}->${to}`);
  }

  getSuccessors(id: string): string[] {
    return Array.from(this.adjacencyList.get(id) ?? []);
  }

  getPredecessors(id: string): string[] {
    return Array.from(this.reverseAdjacencyList.get(id) ?? []);
  }

  getNode(id: string): T | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): Map<string, T> {
    return new Map(this.nodes);
  }

  getAllEdges(): DirectedEdge[] {
    const edges: DirectedEdge[] = [];

    for (const [from, neighbors] of this.adjacencyList.entries()) {
      for (const to of neighbors) {
        edges.push([from, to]);
      }
    }

    return edges;
  }

  getEdgeMetadata<M>(from: string, to: string): M | undefined {
    return this.edgeMetadata.get(`${from}->${to}`) as M | undefined;
  }

  hasCycle(): boolean {
    const unionFind = new UnionFind();
    const edges = this.getAllEdges();

    for (const [from, to] of edges) {
      const priorEdges = edges.filter(
        ([edgeFrom, edgeTo]) => !(edgeFrom === from && edgeTo === to)
      );

      if (unionFind.wouldCreateCycle(from, to, priorEdges)) {
        return true;
      }
    }

    return false;
  }

  getTopologicalOrder(): string[] {
    const { order, hasCycle } = kahnsTopologicalSort(
      Array.from(this.nodes.keys()),
      this.getAllEdges()
    );

    if (hasCycle) {
      throw new Error("Topological order is undefined for cyclic graphs.");
    }

    return order;
  }

  getReachableFrom(id: string): Set<string> {
    const visited = new Set<string>();
    const queue = [id];
    let cursor = 0;

    while (cursor < queue.length) {
      const current = queue[cursor];
      cursor += 1;

      for (const neighbor of this.adjacencyList.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return visited;
  }

  getLongestPath(): string[] {
    const order = this.getTopologicalOrder();
    const distance = new Map<string, number>();
    const predecessor = new Map<string, string | null>();

    for (const node of order) {
      distance.set(node, 0);
      predecessor.set(node, null);
    }

    for (const node of order) {
      const baseDistance = distance.get(node) ?? 0;

      for (const successor of this.getSuccessors(node)) {
        const candidateDistance = baseDistance + 1;

        if (candidateDistance > (distance.get(successor) ?? 0)) {
          distance.set(successor, candidateDistance);
          predecessor.set(successor, node);
        }
      }
    }

    let terminal: string | null = null;
    let maxDistance = -1;

    for (const [node, value] of distance.entries()) {
      if (value > maxDistance) {
        maxDistance = value;
        terminal = node;
      }
    }

    if (!terminal) {
      return [];
    }

    const path: string[] = [];
    let cursor: string | null = terminal;

    while (cursor) {
      path.unshift(cursor);
      cursor = predecessor.get(cursor) ?? null;
    }

    return path;
  }
}
