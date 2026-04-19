"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileDown, FolderOpen, ListChecks, Sparkles } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskAdvisorPanel } from "@/components/panels/RiskAdvisorPanel";
import { TaskDetailPanel } from "@/components/panels/TaskDetailPanel";
import { SimulationPanel } from "@/components/panels/SimulationPanel";
import { StatsPanel } from "@/components/panels/StatsPanel";
import { TimelinePanel } from "@/components/panels/TimelinePanel";
import { WhatIfPanel } from "@/components/panels/WhatIfPanel";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useRiskAdvisor } from "@/hooks/useRiskAdvisor";
import { downloadProjectBundle } from "@/lib/utils/export";
import { formatDurationDays } from "@/lib/utils/date";
import { useProjectStore } from "@/store/projectStore";
import { useSimulationStore } from "@/store/simulationStore";

function RightPanel() {
  const view = useProjectStore((state) => state.rightPanelView);

  switch (view) {
    case "risk":
      return <RiskAdvisorPanel />;
    case "task":
      return <TaskDetailPanel />;
    case "simulation":
      return <SimulationPanel />;
    case "what-if":
      return <WhatIfPanel />;
    case "timeline":
      return <TimelinePanel />;
    case "stats":
    default:
      return <StatsPanel />;
  }
}

function TaskList() {
  const { tasks, cpmResults, selectTask } = useProjectStore(
    useShallow((state) => ({
      tasks: state.tasks,
      cpmResults: state.cpmResults,
      selectTask: state.selectTask
    }))
  );

  return (
    <div className="space-y-3">
      {cpmResults.map((result) => {
        const task = tasks.find((item) => item.id === result.taskId);

        return task ? (
          <button
            key={task.id}
            type="button"
            className="surface-card w-full px-4 py-3 text-left transition hover:bg-white dark:hover:bg-white/8"
            onClick={() => selectTask(task.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="heading-primary text-sm font-medium">{task.label}</p>
                <p className="text-secondary mt-1 text-xs">{task.status}</p>
              </div>
              <div className="text-tertiary text-right text-xs">
                <p>{formatDurationDays(task.estimatedDays)}</p>
                <p>{result.isCritical ? "Critical" : `Float ${result.float}d`}</p>
              </div>
            </div>
          </button>
        ) : null;
      })}
    </div>
  );
}

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "";
  const { loadProjectBundle } = useIndexedDB();
  const simulation = useSimulationStore((state) => state.baselineResult);
  const {
    project,
    loading,
    error,
    sidebarTab,
    rightPanelView,
    setSidebarTab,
    setRightPanelView,
    tasks,
    dependencies,
    cpmResults
  } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
      loading: state.loading,
      error: state.error,
      sidebarTab: state.sidebarTab,
      rightPanelView: state.rightPanelView,
      setSidebarTab: state.setSidebarTab,
      setRightPanelView: state.setRightPanelView,
      tasks: state.tasks,
      dependencies: state.dependencies,
      cpmResults: state.cpmResults
    }))
  );
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  useRiskAdvisor();

  useEffect(() => {
    if (projectId) {
      void loadProjectBundle(projectId);
    }
  }, [loadProjectBundle, projectId]);

  useKeyboard({
    onAddTask: () => window.dispatchEvent(new Event("chronograph:add-task")),
    onRunSimulation: () => window.dispatchEvent(new Event("chronograph:run-simulation")),
    onToggleWhatIf: () => window.dispatchEvent(new Event("chronograph:toggle-whatif")),
    onZoomFit: () => window.dispatchEvent(new Event("chronograph:zoom-fit"))
  });

  const exportBundle = useMemo(
    () =>
      project
        ? {
            project,
            tasks,
            dependencies,
            simulation: simulation ?? undefined
          }
        : null,
    [dependencies, project, simulation, tasks]
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="surface-panel p-10 text-sm text-slate-600 dark:text-slate-400">
          Loading project workspace...
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <TopBar
          title="ChronoGraph"
          subtitle={error ?? "Project workspace not found."}
        />
        <div className="surface-panel p-8 text-sm text-slate-600 dark:text-slate-400">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-300">
            <FolderOpen className="h-4 w-4" />
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const leftPanelContent =
    sidebarTab === "tasks" ? (
      <TaskList />
    ) : sidebarTab === "timeline" ? (
      <TimelinePanel />
    ) : (
      <StatsPanel />
    );

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <TopBar
        title={project.name}
        subtitle={project.description}
        showMenuButton
        onOpenSidebar={() => setLeftOpen(true)}
        onOpenPanel={() => setRightOpen(true)}
        onRunSimulation={() => window.dispatchEvent(new Event("chronograph:run-simulation"))}
        onToggleWhatIf={() => window.dispatchEvent(new Event("chronograph:toggle-whatif"))}
        onExport={() => exportBundle && downloadProjectBundle(exportBundle)}
      />

      <div className="text-tertiary flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="blue">{tasks.length} tasks</Badge>
        <Badge variant="default">{dependencies.length} dependencies</Badge>
        <Badge variant="amber">{cpmResults.filter((item) => item.isCritical).length} critical</Badge>
        {simulation ? <Badge variant="green">P90 {formatDurationDays(simulation.p90)}</Badge> : null}
        <Button
          size="sm"
          variant={rightPanelView === "risk" ? "primary" : "ghost"}
          onClick={() => setRightPanelView("risk")}
        >
          <Sparkles className="h-4 w-4" />
          Risk Advisor
        </Button>
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <FolderOpen className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <div className="hidden xl:grid xl:grid-cols-[320px_minmax(0,1fr)_380px] xl:gap-4">
        <Sidebar activeTab={sidebarTab} onTabChange={setSidebarTab}>
          {leftPanelContent}
        </Sidebar>
        <GraphCanvas />
        <RightPanel />
      </div>

      <div className="hidden gap-4 md:block xl:hidden">
        <GraphCanvas />
        <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
          <SheetContent side="left" className="overflow-y-auto">
            <Sidebar activeTab={sidebarTab} onTabChange={setSidebarTab}>
              {leftPanelContent}
            </Sidebar>
          </SheetContent>
        </Sheet>
        <Sheet open={rightOpen} onOpenChange={setRightOpen}>
          <SheetContent side="right" className="overflow-y-auto">
            <RightPanel />
          </SheetContent>
        </Sheet>
      </div>

      <div className="md:hidden">
        <Tabs defaultValue="graph">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          <TabsContent value="graph">
            <GraphCanvas />
          </TabsContent>
          <TabsContent value="tasks">
            <Sidebar activeTab={sidebarTab} onTabChange={setSidebarTab}>
              {leftPanelContent}
            </Sidebar>
          </TabsContent>
          <TabsContent value="results">
            <RightPanel />
          </TabsContent>
        </Tabs>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.12 }}
        className="surface-card p-4 text-xs text-slate-600 dark:text-slate-400"
      >
        Shortcuts: <kbd className="rounded bg-slate-100 px-2 py-1 text-slate-700 dark:bg-white/6 dark:text-slate-200">Ctrl/Cmd + N</kbd> add
        task, <kbd className="rounded bg-slate-100 px-2 py-1 text-slate-700 dark:bg-white/6 dark:text-slate-200">Ctrl/Cmd + Enter</kbd> run
        simulation, <kbd className="rounded bg-slate-100 px-2 py-1 text-slate-700 dark:bg-white/6 dark:text-slate-200">Shift + W</kbd> toggle
        what-if, <kbd className="rounded bg-slate-100 px-2 py-1 text-slate-700 dark:bg-white/6 dark:text-slate-200">0</kbd> zoom fit.
      </motion.div>
    </main>
  );
}
