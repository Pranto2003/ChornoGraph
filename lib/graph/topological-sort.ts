/**
 * ALGORITHM: Kahn's Topological Sort (BFS-based)
 * TIME COMPLEXITY: O(V + E) where V = tasks and E = dependencies
 * SPACE COMPLEXITY: O(V + E) for the in-degree map, adjacency map, and queue
 *
 * WHY KAHN'S OVER DFS-BASED SORT:
 * Kahn's algorithm exposes cycle detection as part of the same pass that produces
 * ordering, which makes it ideal for interactive graph editing. It also gives
 * ChronoGraph a stable traversal order for the CPM forward and backward passes.
 *
 * IN CHRONOGRAPH:
 * Every deterministic schedule analysis begins with a topological order. CPM can
 * only compute earliest and latest dates correctly if every predecessor is
 * processed before its successors. Kahn's algorithm guarantees that ordering in
 * linear time and signals invalid cyclical graphs immediately.
 */

export function kahnsTopologicalSort(
  nodes: string[],
  edges: Array<[string, string]>
): { order: string[]; hasCycle: boolean } {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node, 0);
    adjacency.set(node, []);
  }

  for (const [from, to] of edges) {
    adjacency.get(from)?.push(to);
    inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
  }

  const queue = nodes.filter((node) => (inDegree.get(node) ?? 0) === 0);
  const order: string[] = [];
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    order.push(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      const nextInDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, nextInDegree);

      if (nextInDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return {
    order,
    hasCycle: order.length !== nodes.length
  };
}
