import { describe, expect, it } from "vitest";

import { computeCPM } from "@/lib/graph/cpm";
import type { Dependency, Task } from "@/lib/types";

function task(id: string, estimatedDays: number): Task {
  return {
    id,
    projectId: "project",
    label: id,
    description: "",
    estimatedDays,
    variancePercent: 10,
    position: { x: 0, y: 0 },
    status: "not-started",
    isFrozen: false,
    frozenDelayDays: 0
  };
}

function dependency(
  fromTaskId: string,
  toTaskId: string,
  type: Dependency["type"] = "finish-to-start",
  lagDays = 0
): Dependency {
  return {
    id: `${fromTaskId}-${toTaskId}`,
    projectId: "project",
    fromTaskId,
    toTaskId,
    type,
    lagDays
  };
}

describe("computeCPM", () => {
  it("computes a simple linear chain", () => {
    const results = computeCPM(
      [task("a", 3), task("b", 2), task("c", 4)],
      [dependency("a", "b"), dependency("b", "c")]
    );

    expect(results).toEqual([
      expect.objectContaining({
        taskId: "a",
        earliestStart: 0,
        earliestFinish: 3,
        latestStart: 0,
        latestFinish: 3,
        float: 0,
        isCritical: true
      }),
      expect.objectContaining({
        taskId: "b",
        earliestStart: 3,
        earliestFinish: 5,
        latestStart: 3,
        latestFinish: 5,
        float: 0,
        isCritical: true
      }),
      expect.objectContaining({
        taskId: "c",
        earliestStart: 5,
        earliestFinish: 9,
        latestStart: 5,
        latestFinish: 9,
        float: 0,
        isCritical: true
      })
    ]);
  });

  it("computes float in a parallel diamond", () => {
    const results = computeCPM(
      [task("a", 3), task("b", 4), task("c", 2), task("d", 1)],
      [
        dependency("a", "b"),
        dependency("a", "c"),
        dependency("b", "d"),
        dependency("c", "d")
      ]
    );

    const byId = new Map(results.map((result) => [result.taskId, result]));
    expect(byId.get("b")?.float).toBe(0);
    expect(byId.get("c")?.float).toBe(2);
  });

  it("supports start-to-start dependencies", () => {
    const results = computeCPM(
      [task("a", 4), task("b", 2)],
      [dependency("a", "b", "start-to-start", 1)]
    );

    const b = results.find((result) => result.taskId === "b");
    expect(b?.earliestStart).toBe(1);
    expect(b?.earliestFinish).toBe(3);
  });

  it("supports finish-to-finish dependencies", () => {
    const results = computeCPM(
      [task("a", 5), task("b", 2)],
      [dependency("a", "b", "finish-to-finish", 0)]
    );

    const b = results.find((result) => result.taskId === "b");
    expect(b?.earliestStart).toBe(3);
    expect(b?.earliestFinish).toBe(5);
  });

  it("applies what-if overrides to durations", () => {
    const results = computeCPM(
      [task("a", 3), task("b", 2)],
      [dependency("a", "b")],
      { a: 2 }
    );

    const a = results.find((result) => result.taskId === "a");
    const b = results.find((result) => result.taskId === "b");

    expect(a?.earliestFinish).toBe(5);
    expect(b?.earliestStart).toBe(5);
  });
});
