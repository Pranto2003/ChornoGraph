import { create } from "zustand";
import type { Edge, Node } from "reactflow";

import type { DependencyEdgeData, TaskNodeData } from "@/lib/utils/layout";

interface GraphStoreState {
  nodes: Node<TaskNodeData>[];
  edges: Edge<DependencyEdgeData>[];
  showCriticalPath: boolean;
  whatIfMode: boolean;
  affectedTaskIds: string[];
  whatIfOverrides: Record<string, number>;
  setGraph: (
    nodes: Node<TaskNodeData>[],
    edges: Edge<DependencyEdgeData>[]
  ) => void;
  setShowCriticalPath: (value: boolean) => void;
  setWhatIfMode: (value: boolean) => void;
  setAffectedTaskIds: (taskIds: string[]) => void;
  setWhatIfDelay: (taskId: string, days: number) => void;
  hydrateWhatIf: (overrides: Record<string, number>) => void;
  resetWhatIf: () => void;
}

export const useGraphStore = create<GraphStoreState>((set) => ({
  nodes: [],
  edges: [],
  showCriticalPath: true,
  whatIfMode: false,
  affectedTaskIds: [],
  whatIfOverrides: {},
  setGraph: (nodes, edges) => set({ nodes, edges }),
  setShowCriticalPath: (value) => set({ showCriticalPath: value }),
  setWhatIfMode: (value) =>
    set((state) => ({
      whatIfMode: value,
      whatIfOverrides: value ? state.whatIfOverrides : {},
      affectedTaskIds: value ? state.affectedTaskIds : []
    })),
  setAffectedTaskIds: (taskIds) => set({ affectedTaskIds: taskIds }),
  hydrateWhatIf: (overrides) => set({ whatIfOverrides: overrides }),
  setWhatIfDelay: (taskId, days) =>
    set((state) => {
      const nextOverrides = { ...state.whatIfOverrides };

      if (days <= 0) {
        delete nextOverrides[taskId];
      } else {
        nextOverrides[taskId] = days;
      }

      return {
        whatIfOverrides: nextOverrides
      };
    }),
  resetWhatIf: () => set({ whatIfOverrides: {}, affectedTaskIds: [], whatIfMode: false })
}));
