"use client";

import { useShallow } from "zustand/react/shallow";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDAG } from "@/hooks/useDAG";
import { computeProjectDuration } from "@/lib/graph/cpm";
import { formatDurationDays } from "@/lib/utils/date";
import { useProjectStore } from "@/store/projectStore";
import { useSimulationStore } from "@/store/simulationStore";

export function StatsPanel() {
  const { isolatedTaskIds } = useDAG();
  const { tasks, dependencies, cpmResults } = useProjectStore(
    useShallow((state) => ({
      tasks: state.tasks,
      dependencies: state.dependencies,
      cpmResults: state.cpmResults
    }))
  );
  const simulation = useSimulationStore((state) => state.baselineResult);

  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const criticalCount = cpmResults.filter((result) => result.isCritical).length;
  const duration = computeProjectDuration(cpmResults);
  const averageFloat =
    cpmResults.length > 0
      ? cpmResults.reduce((sum, result) => sum + result.float, 0) / cpmResults.length
      : 0;

  return (
    <div className="surface-panel space-y-4 p-6">
      <div>
        <h2 className="heading-primary text-xl font-semibold">Project Health</h2>
        <p className="text-secondary text-sm">
          Deterministic schedule health and graph structure metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Tasks", tasks.length.toString()],
          ["Dependencies", dependencies.length.toString()],
          ["Critical Tasks", criticalCount.toString()],
          ["Blocked Tasks", blockedCount.toString()],
          ["Project Duration", formatDurationDays(duration)],
          ["Average Float", formatDurationDays(averageFloat)]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-secondary text-sm">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="heading-primary font-mono text-2xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {simulation ? (
        <div className="rounded-2xl border border-blue-300/40 bg-blue-500/10 p-4 text-sm text-blue-700 dark:border-blue-400/20 dark:text-blue-100">
          Latest baseline forecast: P50 {formatDurationDays(simulation.p50)}, P90{" "}
          {formatDurationDays(simulation.p90)}.
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="heading-primary text-sm font-medium">Warnings</p>
        <div className="flex flex-wrap gap-2">
          {isolatedTaskIds.length > 0 ? (
            isolatedTaskIds.map((taskId) => {
              const task = tasks.find((item) => item.id === taskId);
              return task ? (
                <Badge key={taskId} variant="red">
                  Isolated: {task.label}
                </Badge>
              ) : null;
            })
          ) : (
            <Badge variant="green">No structural warnings</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
