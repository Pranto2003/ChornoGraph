"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { buildScheduleGraph } from "@/lib/graph/cpm";
import { DAG } from "@/lib/graph/dag";
import type { Task } from "@/lib/types";
import { useProjectStore } from "@/store/projectStore";

export function useDAG(): {
  dag: DAG<Task>;
  isolatedTaskIds: string[];
} {
  const { tasks, dependencies } = useProjectStore(
    useShallow((state) => ({
      tasks: state.tasks,
      dependencies: state.dependencies
    }))
  );

  return useMemo(() => {
    const dag = buildScheduleGraph(tasks, dependencies);
    const reachableFromStarts = new Set<string>();
    const endNodes = new Set(tasks.map((task) => task.id));

    for (const task of tasks) {
      if (dag.getPredecessors(task.id).length === 0) {
        reachableFromStarts.add(task.id);
        dag.getReachableFrom(task.id).forEach((reachableTaskId) => {
          reachableFromStarts.add(reachableTaskId);
        });
      }
    }

    for (const dependency of dependencies) {
      endNodes.delete(dependency.fromTaskId);
    }

    const isolatedTaskIds = tasks
      .filter((task) => {
        const hasIncoming = dag.getPredecessors(task.id).length > 0;
        const hasOutgoing = dag.getSuccessors(task.id).length > 0;
        return !hasIncoming && !hasOutgoing && tasks.length > 1;
      })
      .map((task) => task.id);

    return {
      dag,
      isolatedTaskIds
    };
  }, [dependencies, tasks]);
}
