import { describe, expect, it } from "vitest";

import { DAG } from "@/lib/graph/dag";

describe("DAG", () => {
  it("adds and retrieves nodes", () => {
    const dag = new DAG<{ label: string }>();
    dag.addNode("a", { label: "A" });
    dag.addNode("b", { label: "B" });

    expect(dag.getAllNodes().size).toBe(2);
    expect(dag.getNode("a")).toEqual({ label: "A" });
  });

  it("tracks successors and predecessors", () => {
    const dag = new DAG<number>();
    dag.addNode("a", 1);
    dag.addNode("b", 2);
    dag.addNode("c", 3);
    dag.addEdge("a", "b");
    dag.addEdge("b", "c");

    expect(dag.getSuccessors("a")).toEqual(["b"]);
    expect(dag.getPredecessors("c")).toEqual(["b"]);
  });

  it("rejects edges that create a cycle", () => {
    const dag = new DAG<number>();
    dag.addNode("a", 1);
    dag.addNode("b", 2);
    dag.addNode("c", 3);
    dag.addEdge("a", "b");
    dag.addEdge("b", "c");

    expect(() => dag.addEdge("c", "a")).toThrow(/cycle/i);
  });

  it("returns reachable descendants with bfs semantics", () => {
    const dag = new DAG<number>();
    for (const id of ["a", "b", "c", "d", "e"]) {
      dag.addNode(id, 1);
    }
    dag.addEdge("a", "b");
    dag.addEdge("a", "c");
    dag.addEdge("c", "d");

    expect(Array.from(dag.getReachableFrom("a")).sort()).toEqual(["b", "c", "d"]);
    expect(Array.from(dag.getReachableFrom("e"))).toEqual([]);
  });

  it("computes topological order and longest path", () => {
    const dag = new DAG<number>();
    for (const id of ["a", "b", "c", "d", "e"]) {
      dag.addNode(id, 1);
    }
    dag.addEdge("a", "b");
    dag.addEdge("a", "c");
    dag.addEdge("b", "d");
    dag.addEdge("c", "e");
    dag.addEdge("d", "e");

    const order = dag.getTopologicalOrder();
    expect(order.indexOf("a")).toBeLessThan(order.indexOf("b"));
    expect(order.indexOf("b")).toBeLessThan(order.indexOf("d"));
    expect(dag.getLongestPath()).toEqual(["a", "b", "d", "e"]);
  });
});
