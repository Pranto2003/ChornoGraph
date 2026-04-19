"use client";

import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDAG } from "@/hooks/useDAG";
import { useSimulation } from "@/hooks/useSimulation";
import { computeCPM, computeProjectDuration } from "@/lib/graph/cpm";
import { propagateDelay } from "@/lib/graph/what-if";
import { formatDurationDays } from "@/lib/utils/date";
import { useGraphStore } from "@/store/graphStore";
import { useProjectStore } from "@/store/projectStore";

export function WhatIfPanel() {
  const { dag } = useDAG();
  const { runSimulation } = useSimulation();
  const { tasks, dependencies, selectedTaskId, setRightPanelView } = useProjectStore(
    useShallow((state) => ({
      tasks: state.tasks,
      dependencies: state.dependencies,
      selectedTaskId: state.selectedTaskId,
      setRightPanelView: state.setRightPanelView
    }))
  );
  const { whatIfOverrides, affectedTaskIds } = useGraphStore(
    useShallow((state) => ({
      whatIfOverrides: state.whatIfOverrides,
      affectedTaskIds: state.affectedTaskIds
    }))
  );

  const overrideEntries = Object.entries(whatIfOverrides);
  const baselineCPM = computeCPM(tasks, dependencies);
  const activeEntry =
    overrideEntries.find(([taskId]) => taskId === selectedTaskId) ?? overrideEntries[0];
  const summary =
    activeEntry && activeEntry[1] > 0
      ? propagateDelay(activeEntry[0], activeEntry[1], dag, baselineCPM)
      : null;
  const shiftedProjectDuration =
    Object.keys(whatIfOverrides).length > 0
      ? computeProjectDuration(computeCPM(tasks, dependencies, whatIfOverrides))
      : computeProjectDuration(baselineCPM);
  const baselineDuration = computeProjectDuration(baselineCPM);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 160, damping: 18 }}
      className="surface-panel space-y-5 p-6"
    >
      <div className="space-y-1">
        <h2 className="heading-primary text-xl font-semibold">What-If Scenario</h2>
        <p className="text-secondary text-sm">
          Inject temporary delay, inspect downstream impact, then compare the
          probabilistic forecast against baseline.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {overrideEntries.length > 0 ? (
          overrideEntries.map(([taskId, delay]) => {
            const task = tasks.find((item) => item.id === taskId);
            return task ? (
              <Badge key={taskId} variant="red">
                {task.label}: {delay}d
              </Badge>
            ) : null;
          })
        ) : (
          <p className="text-sm text-slate-500">
            Move a task slider in the graph or freeze a task in the detail panel.
          </p>
        )}
      </div>

      <div className="surface-card grid gap-4 p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Affected Tasks</p>
          <p className="heading-primary mt-2 text-2xl font-semibold">{affectedTaskIds.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Finish Shift</p>
          <p className="mt-2 text-2xl font-semibold text-red-300">
            {formatDurationDays(shiftedProjectDuration - baselineDuration)}
          </p>
        </div>
      </div>

      {summary ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
          Injecting {activeEntry?.[1]}d delay on{" "}
          {tasks.find((task) => task.id === activeEntry?.[0])?.label} shifts the project
          end by {summary.totalDelayAdded}d and touches {summary.affectedTasks.length} tasks.
        </div>
      ) : null}

      <div className="surface-card space-y-3 p-4">
        <p className="heading-primary text-sm font-medium">New critical path</p>
        <div className="flex flex-wrap gap-2">
          {summary?.newCriticalPath.length ? (
            summary.newCriticalPath.map((taskId) => {
              const task = tasks.find((item) => item.id === taskId);
              return task ? (
                <Badge key={taskId} variant="amber">
                  {task.label}
                </Badge>
              ) : null;
            })
          ) : (
            <p className="text-sm text-slate-500">No injected delay yet.</p>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full"
        disabled={overrideEntries.length === 0}
        onClick={() => {
          setRightPanelView("simulation");
          runSimulation("comparison", whatIfOverrides);
        }}
      >
        Run What-If Simulation
      </Button>
    </motion.div>
  );
}
