/**
 * ALGORITHM: Deterministic risk heuristics driven by BFS reachability,
 * CPM slack analysis, and simulation variability ratios
 * TIME COMPLEXITY: O(V * (V + E)) for bottleneck discovery in the worst case,
 * plus O(V) for near-critical and risk-score scans
 * SPACE COMPLEXITY: O(V) for score maps and memoized downstream-impact caches
 *
 * WHY THIS HEURISTIC ENGINE OVER OPAQUE AI SCORING:
 * ChronoGraph is designed to stay local-first, deterministic, and explainable.
 * These heuristics let users trace every recommendation back to measurable graph
 * structure and schedule statistics instead of relying on probabilistic black-box
 * outputs.
 *
 * IN CHRONOGRAPH:
 * This module elevates the app from "show me the plan" to "tell me where the
 * plan is fragile". It highlights structurally important nodes, near-critical
 * slack exhaustion, and schedule uncertainty so the UI can recommend concrete
 * actions before a project slips.
 */

import type {
  BottleneckAnalysis,
  CPMResult,
  RiskScoreSummary,
  SimulationResult,
  Task
} from "@/lib/types";
import { DAG } from "@/lib/graph/dag";

const downstreamImpactCache = new WeakMap<DAG<Task>, Map<string, number>>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getDownstreamImpact(dag: DAG<Task>, taskId: string): number {
  const cached = downstreamImpactCache.get(dag);

  if (cached?.has(taskId)) {
    return cached.get(taskId) ?? 0;
  }

  const downstreamImpact = dag.getReachableFrom(taskId).size;
  const nextCache = cached ?? new Map<string, number>();
  nextCache.set(taskId, downstreamImpact);
  downstreamImpactCache.set(dag, nextCache);

  return downstreamImpact;
}

export function findBottlenecks(
  dag: DAG<Task>,
  cpm: CPMResult[]
): BottleneckAnalysis[] {
  const cpmById = new Map(cpm.map((result) => [result.taskId, result]));

  return Array.from(dag.getAllNodes().keys())
    .map((taskId) => {
      const cpmResult = cpmById.get(taskId);
      const downstreamImpact = getDownstreamImpact(dag, taskId);
      const float = cpmResult?.float ?? Number.MAX_SAFE_INTEGER;
      const criticalityScore =
        (cpmResult?.isCritical ? 1 : 0) +
        1 / (float + 1) +
        Math.log(downstreamImpact + 1);

      return {
        taskId,
        downstreamImpact,
        criticalityScore
      };
    })
    .sort((left, right) => {
      if (right.criticalityScore !== left.criticalityScore) {
        return right.criticalityScore - left.criticalityScore;
      }

      if (right.downstreamImpact !== left.downstreamImpact) {
        return right.downstreamImpact - left.downstreamImpact;
      }

      return left.taskId.localeCompare(right.taskId);
    });
}

export function findNearCriticalTasks(
  cpm: CPMResult[],
  threshold = 2
): CPMResult[] {
  return cpm
    .filter((result) => result.float > 0 && result.float <= threshold)
    .sort((left, right) => left.float - right.float);
}

export function computeProjectRiskScore(
  cpm: CPMResult[],
  simulation: SimulationResult
): RiskScoreSummary {
  if (cpm.length === 0) {
    return {
      score: 0,
      factors: ["Add tasks and dependencies to start generating deterministic risk analysis."]
    };
  }

  const totalTasks = cpm.length;
  const criticalTasks = cpm.filter((result) => result.isCritical).length;
  const averageFloat =
    cpm.reduce((sum, result) => sum + result.float, 0) / totalTasks;
  const criticalComponent = (criticalTasks / totalTasks) * 40;
  const floatComponent =
    averageFloat <= 0 ? 30 : (1 / averageFloat) * 30;
  const uncertaintyRatio =
    simulation.mean > 0 ? simulation.stdDev / simulation.mean : 0;
  const uncertaintyComponent = uncertaintyRatio * 30;
  const score = clamp(
    criticalComponent + floatComponent + uncertaintyComponent,
    0,
    100
  );
  const factors = [
    `${criticalTasks} of ${totalTasks} tasks are on the critical path, which raises delivery sensitivity.`,
    `Average float is ${averageFloat.toFixed(2)} days, so slack is ${averageFloat <= 2 ? "tight" : "moderate"}.`,
    simulation.iterations > 1
      ? `Simulation uncertainty is ${(uncertaintyRatio * 100).toFixed(1)}% of mean duration.`
      : "Simulation has not been run yet, so uncertainty is using a deterministic fallback."
  ];

  return {
    score,
    factors
  };
}

export function generateRecommendations(
  bottlenecks: BottleneckAnalysis[],
  nearCriticalTasks: CPMResult[],
  riskScore: RiskScoreSummary
): string[] {
  const recommendations: string[] = [];
  const topBottlenecks = bottlenecks.slice(0, 2);
  const uncertaintyFactor = riskScore.factors.find((factor) =>
    factor.startsWith("Simulation uncertainty is")
  );
  const uncertaintyMatch = uncertaintyFactor?.match(/([\d.]+)%/);
  const uncertaintyPercent = uncertaintyMatch
    ? Number.parseFloat(uncertaintyMatch[1])
    : 0;

  for (const bottleneck of topBottlenecks) {
    recommendations.push(
      `Task ${bottleneck.taskId} is a bottleneck affecting ${bottleneck.downstreamImpact} downstream tasks. Consider prioritizing it or splitting its scope.`
    );
  }

  if (nearCriticalTasks.length > 0) {
    recommendations.push(
      `You have ${nearCriticalTasks.length} near-critical tasks with very low float. Minor delays may impact delivery.`
    );
  }

  if (uncertaintyPercent >= 20) {
    recommendations.push(
      "High variance detected. Consider reducing uncertainty in task estimates or breaking ambiguous work into smaller tasks."
    );
  }

  if (riskScore.score >= 70) {
    recommendations.push(
      "Overall project risk is high. Reduce dependency fan-out on critical work and review schedule contingencies now."
    );
  } else if (riskScore.score <= 30) {
    recommendations.push(
      "Overall project risk is currently low. Preserve that buffer by protecting task float and keeping bottlenecks visible."
    );
  }

  return recommendations.slice(0, 5);
}
