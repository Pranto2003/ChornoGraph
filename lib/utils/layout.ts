import dagre from "dagre";
import type { Edge, Node } from "reactflow";

import type { CPMResult, Dependency, Task } from "@/lib/types";

export interface TaskNodeData {
  taskId: string;
}

export interface DependencyEdgeData {
  dependencyId: string;
}

const NODE_WIDTH = 264;
const NODE_HEIGHT = 120;

export function buildFlowNodes(tasks: Task[]): Node<TaskNodeData>[] {
  return tasks.map((task) => ({
    id: task.id,
    type: "task",
    position: task.position,
    data: {
      taskId: task.id
    }
  }));
}

export function buildFlowEdges(dependencies: Dependency[]): Edge<DependencyEdgeData>[] {
  return dependencies.map((dependency) => ({
    id: dependency.id,
    type: "labeled",
    source: dependency.fromTaskId,
    target: dependency.toTaskId,
    data: {
      dependencyId: dependency.id
    },
    selectable: true
  }));
}

export function layoutTasksWithDagre(
  tasks: Task[],
  dependencies: Dependency[],
  direction: "LR" | "TB" = "LR"
): Task[] {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: direction,
    ranksep: 80,
    nodesep: 42,
    marginx: 24,
    marginy: 24
  });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const task of tasks) {
    graph.setNode(task.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const dependency of dependencies) {
    graph.setEdge(dependency.fromTaskId, dependency.toTaskId);
  }

  dagre.layout(graph);

  return tasks.map((task) => {
    const position = graph.node(task.id);

    if (!position) {
      return task;
    }

    return {
      ...task,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2
      }
    };
  });
}

export function getCriticalEdgeIds(
  dependencies: Dependency[],
  cpmResults: CPMResult[]
): Set<string> {
  const cpmById = new Map(cpmResults.map((result) => [result.taskId, result]));

  return new Set(
    dependencies
      .filter((dependency) => {
        const from = cpmById.get(dependency.fromTaskId);
        const to = cpmById.get(dependency.toTaskId);

        return Boolean(from?.isCritical && to?.isCritical);
      })
      .map((dependency) => dependency.id)
  );
}
