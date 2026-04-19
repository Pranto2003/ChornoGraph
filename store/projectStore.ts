import { create } from "zustand";

import type {
  CPMResult,
  Dependency,
  Project,
  ProjectBundle,
  RightPanelView,
  Task
} from "@/lib/types";

type SidebarTab = "tasks" | "timeline" | "stats";

interface ProjectStoreState {
  project: Project | null;
  tasks: Task[];
  dependencies: Dependency[];
  cpmResults: CPMResult[];
  loading: boolean;
  error: string | null;
  selectedTaskId: string | null;
  selectedEdgeId: string | null;
  rightPanelView: RightPanelView;
  sidebarTab: SidebarTab;
  focusTaskId: string | null;
  setWorkspace: (bundle: ProjectBundle) => void;
  resetWorkspace: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProject: (project: Project) => void;
  setTasks: (tasks: Task[]) => void;
  setDependencies: (dependencies: Dependency[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  upsertDependency: (dependency: Dependency) => void;
  removeDependency: (dependencyId: string) => void;
  updateTaskPosition: (taskId: string, x: number, y: number) => void;
  setCPMResults: (results: CPMResult[]) => void;
  selectTask: (taskId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  setRightPanelView: (view: RightPanelView) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setFocusTask: (taskId: string | null) => void;
}

const defaultState = {
  project: null,
  tasks: [],
  dependencies: [],
  cpmResults: [],
  loading: false,
  error: null,
  selectedTaskId: null,
  selectedEdgeId: null,
  rightPanelView: "risk" as RightPanelView,
  sidebarTab: "tasks" as SidebarTab,
  focusTaskId: null
};

export const useProjectStore = create<ProjectStoreState>((set) => ({
  ...defaultState,
  setWorkspace: (bundle) =>
    set({
      project: bundle.project,
      tasks: bundle.tasks,
      dependencies: bundle.dependencies,
      selectedTaskId: null,
      selectedEdgeId: null,
      rightPanelView: "risk",
      error: null
    }),
  resetWorkspace: () => set(defaultState),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setProject: (project) => set({ project }),
  setTasks: (tasks) => set({ tasks }),
  setDependencies: (dependencies) => set({ dependencies }),
  upsertTask: (task) =>
    set((state) => ({
      tasks: state.tasks.some((existing) => existing.id === task.id)
        ? state.tasks.map((existing) => (existing.id === task.id ? task : existing))
        : [...state.tasks, task]
    })),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
      dependencies: state.dependencies.filter(
        (dependency) =>
          dependency.fromTaskId !== taskId && dependency.toTaskId !== taskId
      ),
      selectedTaskId:
        state.selectedTaskId === taskId ? null : state.selectedTaskId
    })),
  upsertDependency: (dependency) =>
    set((state) => ({
      dependencies: state.dependencies.some((existing) => existing.id === dependency.id)
        ? state.dependencies.map((existing) =>
            existing.id === dependency.id ? dependency : existing
          )
        : [...state.dependencies, dependency]
    })),
  removeDependency: (dependencyId) =>
    set((state) => ({
      dependencies: state.dependencies.filter(
        (dependency) => dependency.id !== dependencyId
      ),
      selectedEdgeId:
        state.selectedEdgeId === dependencyId ? null : state.selectedEdgeId
    })),
  updateTaskPosition: (taskId, x, y) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, position: { x, y } } : task
      )
    })),
  setCPMResults: (results) => set({ cpmResults: results }),
  selectTask: (taskId) =>
    set({
      selectedTaskId: taskId,
      selectedEdgeId: null,
      rightPanelView: taskId ? "task" : "risk"
    }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedTaskId: null }),
  setRightPanelView: (view) => set({ rightPanelView: view }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setFocusTask: (taskId) => set({ focusTaskId: taskId })
}));
