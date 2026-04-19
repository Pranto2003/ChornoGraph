/**
 * ALGORITHM: Reachability-based delay propagation with CPM diffing
 * TIME COMPLEXITY: O(V + E) for the BFS reachability pass plus O(V + E) for the
 * CPM recomputation
 * SPACE COMPLEXITY: O(V + E) for the reachable set, reconstructed dependencies,
 * and CPM result maps
 *
 * WHY BFS + CPM RERUN OVER LOCAL HEURISTICS:
 * Delay effects in project graphs are directional, but whether they become
 * schedule-impacting depends on the full network of float and downstream
 * constraints. BFS isolates the potentially affected region quickly, and a full
 * CPM rerun guarantees mathematically correct project-wide impact values.
 *
 * IN CHRONOGRAPH:
 * This is the engine behind the what-if slider interaction. Users can inject a
 * slip into any task and see, nearly instantly, which successors actually move,
 * whether the critical path changes, and how much the overall finish date shifts.
 */

import { computeCPM, computeProjectDuration } from "@/lib/graph/cpm";
import { DAG } from "@/lib/graph/dag";
import type { CPMResult, Dependency, Task } from "@/lib/types";

function reconstructDependencies(dag: DAG<Task>): Dependency[] {
  return dag.getAllEdges().flatMap(([from, to]) => {
    const dependency = dag.getEdgeMetadata<Dependency>(from, to);
    return dependency ? [dependency] : [];
  });
}

export function propagateDelay(
  taskId: string,
  extraDelayDays: number,
  dag: DAG<Task>,
  currentCPMResult: CPMResult[]
): {
  affectedTasks: string[];
  newCriticalPath: string[];
  totalDelayAdded: number;
} {
  const tasks = Array.from(dag.getAllNodes().values());
  const dependencies = reconstructDependencies(dag);
  const reachable = dag.getReachableFrom(taskId);
  const nextResult = computeCPM(tasks, dependencies, { [taskId]: extraDelayDays });
  const currentById = new Map(currentCPMResult.map((result) => [result.taskId, result]));
  const nextById = new Map(nextResult.map((result) => [result.taskId, result]));
  const affectedTasks = Array.from(reachable).filter((reachableTaskId) => {
    const previous = currentById.get(reachableTaskId);
    const next = nextById.get(reachableTaskId);

    if (!previous || !next) {
      return false;
    }

    return (
      previous.earliestStart !== next.earliestStart ||
      previous.earliestFinish !== next.earliestFinish ||
      previous.float !== next.float
    );
  });

  if (nextById.get(taskId)) {
    affectedTasks.unshift(taskId);
  }

  const newCriticalPath = nextResult
    .filter((result) => result.isCritical)
    .map((result) => result.taskId);

  return {
    affectedTasks: Array.from(new Set(affectedTasks)),
    newCriticalPath,
    totalDelayAdded:
      computeProjectDuration(nextResult) - computeProjectDuration(currentCPMResult)
  };
}
