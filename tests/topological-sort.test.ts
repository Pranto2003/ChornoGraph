import { describe, expect, it } from "vitest";

import { kahnsTopologicalSort } from "@/lib/graph/topological-sort";

describe("kahnsTopologicalSort", () => {
  it("sorts a linear chain", () => {
    const result = kahnsTopologicalSort(["a", "b", "c"], [
      ["a", "b"],
      ["b", "c"]
    ]);

    expect(result.hasCycle).toBe(false);
    expect(result.order).toEqual(["a", "b", "c"]);
  });

  it("sorts a diamond graph while preserving constraints", () => {
    const result = kahnsTopologicalSort(["a", "b", "c", "d"], [
      ["a", "b"],
      ["a", "c"],
      ["b", "d"],
      ["c", "d"]
    ]);

    expect(result.hasCycle).toBe(false);
    expect(result.order[0]).toBe("a");
    expect(result.order[result.order.length - 1]).toBe("d");
  });

  it("supports disconnected nodes", () => {
    const result = kahnsTopologicalSort(["a", "b", "c"], [["a", "b"]]);

    expect(result.hasCycle).toBe(false);
    expect(result.order).toHaveLength(3);
    expect(result.order).toContain("c");
  });

  it("detects cycles", () => {
    const result = kahnsTopologicalSort(["a", "b", "c"], [
      ["a", "b"],
      ["b", "c"],
      ["c", "a"]
    ]);

    expect(result.hasCycle).toBe(true);
    expect(result.order.length).toBeLessThan(3);
  });

  it("handles an empty graph", () => {
    const result = kahnsTopologicalSort([], []);

    expect(result).toEqual({
      order: [],
      hasCycle: false
    });
  });
});
