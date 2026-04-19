/**
 * ALGORITHM: Critical Path Method (forward pass + backward pass on a DAG)
 * TIME COMPLEXITY: O(V + E) after the graph is topologically ordered
 * SPACE COMPLEXITY: O(V + E) for the graph, task maps, and schedule maps
 *
 * WHY CPM OVER SIMPLE LONGEST-PATH HEURISTICS:
 * ChronoGraph needs more than the single longest chain. It must compute earliest
 * and latest windows, slack, and criticality for every task while supporting
 * lag offsets and multiple dependency semantics. CPM provides the deterministic
 * project-scheduling model that exposes all of those values in one pass.
 *
 * IN CHRONOGRAPH:
 * This engine powers the live "what is my critical path?" answer. Every graph
 * change triggers a recomputation so the UI can highlight critical tasks, show
 * float badges, render the SVG timeline, and quantify downstream impact before
 * the user commits to a schedule decision.
 */

import { DAG } from "@/lib/graph/dag";
import type { CPMResult, Dependency, DependencyType, Task } from "@/lib/types";

type ScheduleMap = Map<
  string,
  {
    earliestStart: number;
    earliestFinish: number;
    latestStart: number;
    latestFinish: number;
    duration: number;
  }
>;

function resolveDuration(task: Task, whatIfOverrides?: Record<string, number>): number {
  const overrideDelay = whatIfOverrides?.[task.id] ?? 0;

  return Math.max(0.1, task.estimatedDays + overrideDelay);
}

function forwardConstraint(
  dependency: Dependency,
  predecessor: ScheduleMap extends Map<infer _, infer V> ? V : never,
  currentDuration: number
): number {
  switch (dependency.type) {
    case "start-to-start":
      return predecessor.earliestStart + dependency.lagDays;
    case "finish-to-finish":
      return predecessor.earliestFinish + dependency.lagDays - currentDuration;
    case "finish-to-start":
    default:
      return predecessor.earliestFinish + dependency.lagDays;
  }
}

function backwardConstraint(
  dependencyType: DependencyType,
  successor: ScheduleMap extends Map<infer _, infer V> ? V : never,
  currentDuration: number,
  lagDays: number
): { latestStart: number; latestFinish: number } {
  switch (dependencyType) {
    case "start-to-start": {
      const latestStart = successor.latestStart - lagDays;
      return {
        latestStart,
        latestFinish: latestStart + currentDuration
      };
    }
    case "finish-to-finish": {
      const latestFinish = successor.latestFinish - lagDays;
      return {
        latestFinish,
        latestStart: latestFinish - currentDuration
      };
    }
    case "finish-to-start":
    default: {
      const latestFinish = successor.latestStart - lagDays;
      return {
        latestFinish,
        latestStart: latestFinish - currentDuration
      };
    }
  }
}

export function computeProjectDuration(cpmResults: CPMResult[]): number {
  return cpmResults.reduce(
    (maxDuration, current) => Math.max(maxDuration, current.earliestFinish),
    0
  );
}

export function buildScheduleGraph(tasks: Task[], dependencies: Dependency[]): DAG<Task> {
  const dag = new DAG<Task>();

  for (const task of tasks) {
    dag.addNode(task.id, task);
  }

  for (const dependency of dependencies) {
    dag.addEdge(dependency.fromTaskId, dependency.toTaskId, dependency);
  }

  return dag;
}

export function computeCPM(
  tasks: Task[],
  dependencies: Dependency[],
  whatIfOverrides?: Record<string, number>
): CPMResult[] {
  if (tasks.length === 0) {
    return [];
  }

  const dag = buildScheduleGraph(tasks, dependencies);
  const order = dag.getTopologicalOrder();
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const schedule: ScheduleMap = new Map();

  for (const taskId of order) {
    const task = taskById.get(taskId);

    if (!task) {
      continue;
    }

    const duration = resolveDuration(task, whatIfOverrides);
    let earliestStart = 0;

    for (const predecessorId of dag.getPredecessors(taskId)) {
      const predecessorSchedule = schedule.get(predecessorId);
      const dependency = dag.getEdgeMetadata<Dependency>(predecessorId, taskId);

      if (!predecessorSchedule || !dependency) {
        continue;
      }

      earliestStart = Math.max(
        earliestStart,
        forwardConstraint(dependency, predecessorSchedule, duration)
      );
    }

    earliestStart = Math.max(0, earliestStart);
    schedule.set(taskId, {
      earliestStart,
      earliestFinish: earliestStart + duration,
      latestStart: 0,
      latestFinish: 0,
      duration
    });
  }

  const projectDuration = order.reduce((maxDuration, taskId) => {
    return Math.max(maxDuration, schedule.get(taskId)?.earliestFinish ?? 0);
  }, 0);

  for (let index = order.length - 1; index >= 0; index -= 1) {
    const taskId = order[index];
    const record = schedule.get(taskId);

    if (!record) {
      continue;
    }

    const successors = dag.getSuccessors(taskId);

    if (successors.length === 0) {
      record.latestFinish = projectDuration;
      record.latestStart = projectDuration - record.duration;
      schedule.set(taskId, record);
      continue;
    }

    let candidateLatestStart = Number.POSITIVE_INFINITY;
    let candidateLatestFinish = Number.POSITIVE_INFINITY;

    for (const successorId of successors) {
      const successorSchedule = schedule.get(successorId);
      const dependency = dag.getEdgeMetadata<Dependency>(taskId, successorId);

      if (!successorSchedule || !dependency) {
        continue;
      }

      const constrained = backwardConstraint(
        dependency.type,
        successorSchedule,
        record.duration,
        dependency.lagDays
      );

      candidateLatestStart = Math.min(
        candidateLatestStart,
        constrained.latestStart
      );
      candidateLatestFinish = Math.min(
        candidateLatestFinish,
        constrained.latestFinish
      );
    }

    if (!Number.isFinite(candidateLatestFinish)) {
      candidateLatestFinish = projectDuration;
      candidateLatestStart = projectDuration - record.duration;
    }

    record.latestStart = candidateLatestStart;
    record.latestFinish = candidateLatestFinish;
    schedule.set(taskId, record);
  }

  return order.map((taskId) => {
    const record = schedule.get(taskId);

    if (!record) {
      throw new Error(`Missing schedule data for task ${taskId}.`);
    }

    const float = Math.max(
      0,
      Math.round((record.latestStart - record.earliestStart) * 1000) / 1000
    );

    return {
      taskId,
      earliestStart: record.earliestStart,
      earliestFinish: record.earliestFinish,
      latestStart: record.latestStart,
      latestFinish: record.latestFinish,
      float,
      isCritical: float === 0
    };
  });
}
