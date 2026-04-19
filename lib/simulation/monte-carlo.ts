/**
 * ALGORITHM: Monte Carlo schedule simulation with Box-Muller Gaussian sampling
 * TIME COMPLEXITY: O(i * (V + E)) where i = iterations and each iteration runs
 * a full CPM analysis over the task graph
 * SPACE COMPLEXITY: O(i + V) for recorded durations and per-iteration sampled
 * task copies
 *
 * WHY MONTE CARLO OVER SINGLE-POINT ESTIMATION:
 * Deterministic CPM tells users the most optimistic schedule given point
 * estimates, but real projects vary. Monte Carlo repeatedly samples plausible
 * task durations and quantifies the resulting delivery distribution, which is
 * the industry-standard way to answer risk-sensitive questions like P90 dates.
 *
 * IN CHRONOGRAPH:
 * This module transforms a project's dependency graph into a probabilistic
 * forecast. The resulting histogram, percentile estimates, and standard
 * deviation help users understand timeline confidence instead of relying on a
 * single fragile completion date.
 */

import { computeCPM, computeProjectDuration } from "@/lib/graph/cpm";
import {
  buildHistogramBins,
  calculateMean,
  calculatePercentile,
  calculateStdDev
} from "@/lib/simulation/statistics";
import type { Dependency, SimulationResult, Task } from "@/lib/types";

export function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.max(Number.MIN_VALUE, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

function sampleTaskDuration(task: Task, whatIfOverrides?: Record<string, number>): number {
  const override = whatIfOverrides?.[task.id];

  if (task.isFrozen || override !== undefined) {
    return Math.max(0.1, task.estimatedDays + (override ?? task.frozenDelayDays));
  }

  const mean = task.estimatedDays;
  const stdDev = mean * (task.variancePercent / 100);
  const sample = gaussianRandom(mean, stdDev);
  return Math.min(mean * 3, Math.max(mean * 0.1, sample));
}

export function runMonteCarloSimulation(
  tasks: Task[],
  dependencies: Dependency[],
  iterations = 5000,
  whatIfOverrides?: Record<string, number>
): SimulationResult {
  if (tasks.length === 0) {
    return {
      projectId: "",
      runAt: Date.now(),
      iterations,
      durations: [],
      p50: 0,
      p75: 0,
      p90: 0,
      mean: 0,
      stdDev: 0,
      histogram: []
    };
  }

  const durations: number[] = [];

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const sampledTasks = tasks.map((task) => ({
      ...task,
      estimatedDays: sampleTaskDuration(task, whatIfOverrides)
    }));
    const cpmResults = computeCPM(sampledTasks, dependencies);
    durations.push(computeProjectDuration(cpmResults));
  }

  durations.sort((left, right) => left - right);
  const mean = calculateMean(durations);
  const stdDev = calculateStdDev(durations, mean);

  return {
    projectId: tasks[0]?.projectId ?? "",
    runAt: Date.now(),
    iterations,
    durations,
    p50: calculatePercentile(durations, 0.5),
    p75: calculatePercentile(durations, 0.75),
    p90: calculatePercentile(durations, 0.9),
    mean,
    stdDev,
    histogram: buildHistogramBins(durations)
  };
}
