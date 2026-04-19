import { describe, expect, it } from "vitest";

import { UnionFind } from "@/lib/graph/cycle-detection";

describe("UnionFind", () => {
  it("creates singleton sets and unions by connectivity", () => {
    const uf = new UnionFind();
    uf.makeSet("a");
    uf.makeSet("b");
    uf.union("a", "b");

    expect(uf.connected("a", "b")).toBe(true);
  });

  it("compresses paths on repeated find", () => {
    const uf = new UnionFind();
    uf.union("a", "b");
    uf.union("b", "c");
    uf.union("c", "d");

    uf.find("d");

    const internal = uf as unknown as { parents: Map<string, string> };
    expect(internal.parents.get("d")).toBe(uf.find("a"));
  });

  it("returns false when adding an edge across components", () => {
    const uf = new UnionFind();

    expect(
      uf.wouldCreateCycle("a", "b", [
        ["c", "d"],
        ["d", "e"]
      ])
    ).toBe(false);
  });

  it("detects a directed back-edge cycle", () => {
    const uf = new UnionFind();

    expect(
      uf.wouldCreateCycle("c", "a", [
        ["a", "b"],
        ["b", "c"]
      ])
    ).toBe(true);
  });

  it("treats a self-loop as a cycle", () => {
    const uf = new UnionFind();

    expect(uf.wouldCreateCycle("a", "a", [])).toBe(true);
  });
});
