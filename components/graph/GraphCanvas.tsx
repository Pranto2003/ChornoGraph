"use client";

import "reactflow/dist/style.css";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  Connection,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow
} from "reactflow";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Compass,
  LayoutTemplate,
  Link2,
  Play,
  Plus,
  Sparkles
} from "lucide-react";
import { useTheme } from "next-themes";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

import { CriticalPathOverlay } from "@/components/graph/CriticalPathOverlay";
import { EdgeWithLabel } from "@/components/graph/EdgeWithLabel";
import { TaskNode } from "@/components/graph/TaskNode";
import { Button } from "@/components/ui/button";
import { useCPM } from "@/hooks/useCPM";
import { useDAG } from "@/hooks/useDAG";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { useSimulation } from "@/hooks/useSimulation";
import { computeCPM, computeProjectDuration } from "@/lib/graph/cpm";
import { UnionFind } from "@/lib/graph/cycle-detection";
import { layoutTasksWithDagre } from "@/lib/utils/layout";
import type { Dependency, Task } from "@/lib/types";
import { useGraphStore } from "@/store/graphStore";
import { useProjectStore } from "@/store/projectStore";

const nodeTypes = { task: TaskNode };
const edgeTypes = { labeled: EdgeWithLabel };

function GraphSurface() {
  const { resolvedTheme } = useTheme();
  const reactFlow = useReactFlow();
  const isolatedWarningRef = useRef<string>("");
  const { isolatedTaskIds } = useDAG();
  const { persistDependency, persistPositions, persistTask } = useIndexedDB();
  const { runSimulation } = useSimulation();
  const {
    project,
    tasks,
    dependencies,
    cpmResults,
    focusTaskId,
    setTasks,
    upsertTask,
    upsertDependency,
    updateTaskPosition,
    selectTask,
    selectEdge,
    setRightPanelView
  } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
      tasks: state.tasks,
      dependencies: state.dependencies,
      cpmResults: state.cpmResults,
      focusTaskId: state.focusTaskId,
      setTasks: state.setTasks,
      upsertTask: state.upsertTask,
      upsertDependency: state.upsertDependency,
      updateTaskPosition: state.updateTaskPosition,
      selectTask: state.selectTask,
      selectEdge: state.selectEdge,
      setRightPanelView: state.setRightPanelView
    }))
  );
  const {
    nodes,
    edges,
    showCriticalPath,
    whatIfMode,
    affectedTaskIds,
    whatIfOverrides,
    setShowCriticalPath,
    setWhatIfMode,
    setAffectedTaskIds,
    hydrateWhatIf,
    resetWhatIf
  } = useGraphStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      showCriticalPath: state.showCriticalPath,
      whatIfMode: state.whatIfMode,
      affectedTaskIds: state.affectedTaskIds,
      whatIfOverrides: state.whatIfOverrides,
      setShowCriticalPath: state.setShowCriticalPath,
      setWhatIfMode: state.setWhatIfMode,
      setAffectedTaskIds: state.setAffectedTaskIds,
      hydrateWhatIf: state.hydrateWhatIf,
      resetWhatIf: state.resetWhatIf
    }))
  );

  useCPM(whatIfMode ? whatIfOverrides : undefined);

  const baselineCPM = useMemo(() => computeCPM(tasks, dependencies), [dependencies, tasks]);
  const criticalDuration = computeProjectDuration(cpmResults);
  const criticalTaskCount = cpmResults.filter((result) => result.isCritical).length;
  const isLight = resolvedTheme === "light";
  const graphSurfaceStyle = useMemo(
    () => ({
      background: isLight
        ? "radial-gradient(circle at top left, rgba(96, 165, 250, 0.16), transparent 34%), radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.12), transparent 32%), rgba(255, 255, 255, 0.86)"
        : "radial-gradient(circle at top left, rgba(96,165,250,0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(245,158,11,0.08), transparent 32%), rgba(8,10,18,0.88)"
    }),
    [isLight]
  );

  useEffect(() => {
    if (!focusTaskId) {
      return;
    }

    const node = nodes.find((item) => item.id === focusTaskId);

    if (node) {
      void reactFlow.setCenter(node.position.x + 132, node.position.y + 60, {
        duration: 250,
        zoom: 1.05
      });
    }
  }, [focusTaskId, nodes, reactFlow]);

  useEffect(() => {
    if (isolatedTaskIds.length === 0) {
      isolatedWarningRef.current = "";
      return;
    }

    const isolatedKey = isolatedTaskIds.join(",");

    if (isolatedWarningRef.current === isolatedKey) {
      return;
    }

    isolatedWarningRef.current = isolatedKey;
    const labels = isolatedTaskIds
      .map((taskId) => tasks.find((task) => task.id === taskId)?.label)
      .filter((label): label is string => Boolean(label));

    if (labels.length > 0) {
      toast.warning(`Task "${labels[0]}" is isolated - it won't appear on critical path.`);
    }
  }, [isolatedTaskIds, tasks]);

  useEffect(() => {
    if (!whatIfMode || Object.keys(whatIfOverrides).length === 0) {
      if (affectedTaskIds.length > 0) {
        setAffectedTaskIds([]);
      }

      return;
    }

    const nextCPM = computeCPM(tasks, dependencies, whatIfOverrides);
    const baselineById = new Map(baselineCPM.map((result) => [result.taskId, result]));
    const affected = nextCPM
      .filter((result) => {
        const previous = baselineById.get(result.taskId);
        return (
          previous &&
          (previous.earliestStart !== result.earliestStart ||
            previous.earliestFinish !== result.earliestFinish ||
            previous.float !== result.float)
        );
      })
      .map((result) => result.taskId);

    setAffectedTaskIds(affected);
  }, [
    affectedTaskIds.length,
    baselineCPM,
    dependencies,
    setAffectedTaskIds,
    tasks,
    whatIfMode,
    whatIfOverrides
  ]);

  const addTask = useCallback(() => {
    if (!project) {
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      projectId: project.id,
      label: `Task ${tasks.length + 1}`,
      description: "Describe the work required to complete this task.",
      estimatedDays: 3,
      variancePercent: project.defaultVariancePercent,
      position: {
        x: 80 + (tasks.length % 4) * 300,
        y: 80 + Math.floor(tasks.length / 4) * 170
      },
      status: "not-started",
      isFrozen: false,
      frozenDelayDays: 0
    };

    upsertTask(newTask);
    void persistTask(newTask);
    selectTask(newTask.id);
  }, [persistTask, project, selectTask, tasks.length, upsertTask]);

  const handleConnect = (connection: Connection) => {
    if (!project || !connection.source || !connection.target) {
      return;
    }

    const unionFind = new UnionFind();
    const wouldCreateCycle = unionFind.wouldCreateCycle(
      connection.source,
      connection.target,
      dependencies.map((dependency) => [dependency.fromTaskId, dependency.toTaskId])
    );

    if (wouldCreateCycle) {
      toast.error("This dependency creates a cycle. Connection rejected.");
      return;
    }

    const newDependency: Dependency = {
      id: crypto.randomUUID(),
      projectId: project.id,
      fromTaskId: connection.source,
      toTaskId: connection.target,
      type: "finish-to-start",
      lagDays: 0
    };

    upsertDependency(newDependency);
    void persistDependency(newDependency);
  };

  const handleAutoLayout = async () => {
    const nextTasks = layoutTasksWithDagre(tasks, dependencies);
    setTasks(nextTasks);
    await persistPositions(nextTasks);
    void reactFlow.fitView({ duration: 200, padding: 0.2 });
  };

  const handleToggleWhatIf = useCallback(() => {
    if (!whatIfMode) {
      hydrateWhatIf(
        Object.fromEntries(
          tasks
            .filter((task) => task.isFrozen && task.frozenDelayDays > 0)
            .map((task) => [task.id, task.frozenDelayDays])
        )
      );
      setWhatIfMode(true);
      setRightPanelView("what-if");
      return;
    }

    resetWhatIf();
    setTasks(
      tasks.map((task) => ({
        ...task,
        isFrozen: false,
        frozenDelayDays: 0
      }))
    );
    setRightPanelView("stats");
  }, [
    hydrateWhatIf,
    resetWhatIf,
    setRightPanelView,
    setTasks,
    setWhatIfMode,
    tasks,
    whatIfMode
  ]);

  useEffect(() => {
    const handleZoomFit = () => {
      void reactFlow.fitView({ duration: 200, padding: 0.2 });
    };
    const handleAddTask = () => {
      addTask();
    };
    const handleRunSimulation = () => {
      setRightPanelView("simulation");
      runSimulation("baseline", whatIfMode ? whatIfOverrides : undefined);
    };
    const handleToggleWhatIfEvent = () => {
      handleToggleWhatIf();
    };

    window.addEventListener("chronograph:zoom-fit", handleZoomFit as EventListener);
    window.addEventListener("chronograph:add-task", handleAddTask as EventListener);
    window.addEventListener(
      "chronograph:run-simulation",
      handleRunSimulation as EventListener
    );
    window.addEventListener(
      "chronograph:toggle-whatif",
      handleToggleWhatIfEvent as EventListener
    );

    return () => {
      window.removeEventListener("chronograph:zoom-fit", handleZoomFit as EventListener);
      window.removeEventListener("chronograph:add-task", handleAddTask as EventListener);
      window.removeEventListener(
        "chronograph:run-simulation",
        handleRunSimulation as EventListener
      );
      window.removeEventListener(
        "chronograph:toggle-whatif",
        handleToggleWhatIfEvent as EventListener
      );
    };
  }, [
    addTask,
    handleToggleWhatIf,
    reactFlow,
    runSimulation,
    setRightPanelView,
    whatIfMode,
    whatIfOverrides
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: 0.08 }}
      className="relative h-[72vh] overflow-hidden rounded-[34px] border border-white/10 shadow-glass"
      style={graphSurfaceStyle}
    >
      <CriticalPathOverlay
        visible={showCriticalPath && criticalTaskCount > 0}
        taskCount={criticalTaskCount}
        duration={criticalDuration}
      />

      {whatIfMode ? (
        <div className="absolute right-6 top-24 z-20 rounded-full border border-red-300/40 bg-red-500/10 px-4 py-2 text-sm text-red-700 backdrop-blur-xl dark:border-red-400/20 dark:text-red-100">
          What-If Mode Active
        </div>
      ) : null}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.8}
        snapToGrid
        snapGrid={[16, 16]}
        onlyRenderVisibleElements
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#94A3B8"
          }
        }}
        onConnect={handleConnect}
        onPaneClick={() => {
          selectTask(null);
          selectEdge(null);
        }}
        onNodeClick={(_, node) => selectTask(node.id)}
        onEdgeClick={(_, edge) => selectEdge(edge.id)}
        onNodeDragStop={(_, node) => {
          updateTaskPosition(node.id, node.position.x, node.position.y);
          const task = tasks.find((item) => item.id === node.id);

          if (task) {
            void persistTask({
              ...task,
              position: node.position
            });
          }
        }}
      >
        <Background
          color={isLight ? "rgba(71,85,105,0.18)" : "rgba(148,163,184,0.14)"}
          gap={24}
          size={1.2}
        />
        <Controls
          className={
            isLight
              ? "[&>button]:!border-slate-200/80 [&>button]:!bg-white/92 [&>button]:!text-slate-700"
              : "[&>button]:!border-white/10 [&>button]:!bg-[#0d1322]/90 [&>button]:!text-slate-200"
          }
          showInteractive={false}
        />
        <Panel position="top-left" className="!m-6">
          <div
            className={
              isLight
                ? "flex flex-wrap gap-2 rounded-3xl border border-slate-200/80 bg-white/88 p-3 shadow-glass backdrop-blur-2xl"
                : "flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-[#0d1322]/88 p-3 shadow-glass backdrop-blur-2xl"
            }
          >
            <Button onClick={addTask} aria-label="Add task">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
            <Button
              variant="ghost"
              aria-label="Add dependency"
              onClick={() =>
                toast.message(
                  "Drag from a task's right handle to another task's left handle to create a dependency."
                )
              }
            >
              <Link2 className="h-4 w-4" />
              Add Dependency
            </Button>
            <Button variant="ghost" onClick={handleAutoLayout} aria-label="Auto layout graph">
              <LayoutTemplate className="h-4 w-4" />
              Auto-Layout
            </Button>
            <Button
              variant="ghost"
              onClick={() => void reactFlow.fitView({ duration: 200, padding: 0.2 })}
              aria-label="Fit graph to viewport"
            >
              <Compass className="h-4 w-4" />
              Zoom Fit
            </Button>
            <Button
              variant={showCriticalPath ? "amber" : "ghost"}
              onClick={() => setShowCriticalPath(!showCriticalPath)}
              aria-label="Toggle critical path display"
            >
              <Sparkles className="h-4 w-4" />
              Toggle Critical Path
            </Button>
            <Button
              variant={whatIfMode ? "destructive" : "ghost"}
              onClick={handleToggleWhatIf}
              aria-label="Toggle what-if mode"
            >
              <AlertTriangle className="h-4 w-4" />
              Toggle What-If
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setRightPanelView("simulation");
                runSimulation("baseline", whatIfMode ? whatIfOverrides : undefined);
              }}
              aria-label="Run Monte Carlo simulation"
            >
              <Play className="h-4 w-4" />
              Run Simulation
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </motion.div>
  );
}

export function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphSurface />
    </ReactFlowProvider>
  );
}
