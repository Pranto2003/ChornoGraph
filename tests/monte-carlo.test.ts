import { afterEach, describe, expect, it, vi } from "vitest";

import {
  gaussianRandom,
  runMonteCarloSimulation
} from "@/lib/simulation/monte-carlo";
import type { Dependency, Task } from "@/lib/types";

function task(id: string, estimatedDays: number, variancePercent = 20): Task {
  return {
    id,
    projectId: "project",
    label: id,
    description: "",
    estimatedDays,
    variancePercent,
    position: { x: 0, y: 0 },
    status: "not-started",
    isFrozen: false,
    frozenDelayDays: 0
  };
}

function dependency(fromTaskId: string, toTaskId: string): Dependency {
  return {
    id: `${fromTaskId}-${toTaskId}`,
    projectId: "project",
    fromTaskId,
    toTaskId,
    type: "finish-to-start",
    lagDays: 0
  };
}

describe("runMonteCarloSimulation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("orders percentiles correctly", () => {
    const result = runMonteCarloSimulation(
      [task("a", 4), task("b", 3)],
      [dependency("a", "b")],
      300
    );

    expect(result.p50).toBeLessThanOrEqual(result.p75);
    expect(result.p75).toBeLessThanOrEqual(result.p90);
  });

  it("returns histogram bins", () => {
    const result = runMonteCarloSimulation(
      [task("a", 4), task("b", 3)],
      [dependency("a", "b")],
      200
    );

    expect(result.histogram).toHaveLength(20);
    expect(result.histogram.reduce((sum, bin) => sum + bin.count, 0)).toBe(200);
  });

  it("uses deterministic frozen overrides when provided", () => {
    const frozenTask = {
      ...task("a", 4),
      isFrozen: true,
      frozenDelayDays: 3
    };
    const result = runMonteCarloSimulation([frozenTask], [], 25, { a: 3 });

    expect(new Set(result.durations)).toEqual(new Set([7]));
  });

  it("gaussianRandom follows the box-muller transform", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.25);

    const sample = gaussianRandom(10, 2);
    expect(sample).toBeCloseTo(10, 5);
  });

  it("approximates the expected mean over many gaussian samples", () => {
    const samples = Array.from({ length: 5000 }, () => gaussianRandom(10, 1.5));
    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;

    expect(mean).toBeGreaterThan(9.8);
    expect(mean).toBeLessThan(10.2);
  });
});
