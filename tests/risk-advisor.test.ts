import { describe, expect, it } from "vitest";

import { buildScheduleGraph } from "@/lib/graph/cpm";
import {
  computeProjectRiskScore,
  findBottlenecks,
  findNearCriticalTasks,
  generateRecommendations
} from "@/lib/intelligence/risk-advisor";
import type { CPMResult, Dependency, SimulationResult, Task } from "@/lib/types";

function task(id: string): Task {
  return {
    id,
    projectId: "project",
    label: id,
    description: "",
    estimatedDays: 3,
    variancePercent: 10,
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

const sampleSimulation: SimulationResult = {
  projectId: "project",
  runAt: Date.now(),
  iterations: 5000,
  durations: [10, 11, 12, 13, 14],
  p50: 12,
  p75: 13,
  p90: 14,
  mean: 12,
  stdDev: 2,
  histogram: [
    { bin: 10, count: 1 },
    { bin: 11, count: 1 },
    { bin: 12, count: 1 },
    { bin: 13, count: 1 },
    { bin: 14, count: 1 }
  ]
};

describe("risk-advisor", () => {
  it("finds bottlenecks by downstream impact and criticality", () => {
    const dag = buildScheduleGraph(
      [task("a"), task("b"), task("c"), task("d")],
      [dependency("a", "b"), dependency("a", "c"), dependency("c", "d")]
    );
    const cpm: CPMResult[] = [
      { taskId: "a", earliestStart: 0, earliestFinish: 1, latestStart: 0, latestFinish: 1, float: 0, isCritical: true },
      { taskId: "b", earliestStart: 1, earliestFinish: 2, latestStart: 3, latestFinish: 4, float: 2, isCritical: false },
      { taskId: "c", earliestStart: 1, earliestFinish: 2, latestStart: 1, latestFinish: 2, float: 0, isCritical: true },
      { taskId: "d", earliestStart: 2, earliestFinish: 3, latestStart: 2, latestFinish: 3, float: 0, isCritical: true }
    ];

    const bottlenecks = findBottlenecks(dag, cpm);

    expect(bottlenecks[0]?.taskId).toBe("a");
    expect(bottlenecks[0]?.downstreamImpact).toBe(3);
  });

  it("detects near-critical tasks within threshold", () => {
    const nearCritical = findNearCriticalTasks([
      { taskId: "a", earliestStart: 0, earliestFinish: 1, latestStart: 0, latestFinish: 1, float: 0, isCritical: true },
      { taskId: "b", earliestStart: 1, earliestFinish: 2, latestStart: 2, latestFinish: 3, float: 1, isCritical: false },
      { taskId: "c", earliestStart: 1, earliestFinish: 2, latestStart: 4, latestFinish: 5, float: 3, isCritical: false }
    ]);

    expect(nearCritical.map((result) => result.taskId)).toEqual(["b"]);
  });

  it("computes a bounded project risk score", () => {
    const risk = computeProjectRiskScore(
      [
        { taskId: "a", earliestStart: 0, earliestFinish: 1, latestStart: 0, latestFinish: 1, float: 0, isCritical: true },
        { taskId: "b", earliestStart: 1, earliestFinish: 2, latestStart: 1, latestFinish: 2, float: 0, isCritical: true },
        { taskId: "c", earliestStart: 2, earliestFinish: 3, latestStart: 3, latestFinish: 4, float: 1, isCritical: false }
      ],
      sampleSimulation
    );

    expect(risk.score).toBeGreaterThan(0);
    expect(risk.score).toBeLessThanOrEqual(100);
    expect(risk.factors).toHaveLength(3);
  });

  it("clamps extreme low-float risk scores", () => {
    const risk = computeProjectRiskScore(
      [
        { taskId: "a", earliestStart: 0, earliestFinish: 1, latestStart: 0, latestFinish: 1, float: 0, isCritical: true }
      ],
      {
        ...sampleSimulation,
        mean: 5,
        stdDev: 8
      }
    );

    expect(risk.score).toBe(100);
  });

  it("generates actionable recommendations", () => {
    const recommendations = generateRecommendations(
      [
        {
          taskId: "task-alpha",
          downstreamImpact: 5,
          criticalityScore: 3.5
        }
      ],
      [
        {
          taskId: "task-beta",
          earliestStart: 0,
          earliestFinish: 2,
          latestStart: 1,
          latestFinish: 3,
          float: 1,
          isCritical: false
        }
      ],
      {
        score: 82,
        factors: ["Simulation uncertainty is 35.0% of mean duration."]
      }
    );

    expect(recommendations.some((value) => value.includes("task-alpha"))).toBe(true);
    expect(recommendations.some((value) => value.includes("near-critical"))).toBe(true);
    expect(recommendations.some((value) => value.includes("High variance"))).toBe(true);
  });
});
