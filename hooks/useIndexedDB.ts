"use client";

import { useCallback } from "react";

import {
  getProjectBundle,
  upsertProject
} from "@/lib/storage/projects";
import {
  getProjectGraph,
  saveTaskPositions,
  upsertDependency,
  upsertTask
} from "@/lib/storage/tasks";
import { saveSimulation } from "@/lib/storage/db";
import type { Dependency, Project, SimulationResult, Task } from "@/lib/types";
import { useProjectStore } from "@/store/projectStore";
import { useSimulationStore } from "@/store/simulationStore";

export function useIndexedDB(): {
  loadProjectBundle: (projectId: string) => Promise<void>;
  persistProject: (project: Project) => Promise<void>;
  persistTask: (task: Task) => Promise<void>;
  persistDependency: (dependency: Dependency) => Promise<void>;
  persistPositions: (tasks: Task[]) => Promise<void>;
  refreshGraph: (projectId: string) => Promise<void>;
  persistSimulation: (simulation: SimulationResult) => Promise<void>;
} {
  const setWorkspace = useProjectStore((state) => state.setWorkspace);
  const setError = useProjectStore((state) => state.setError);
  const setLoading = useProjectStore((state) => state.setLoading);
  const hydrateSimulation = useSimulationStore((state) => state.hydrate);

  const loadProjectBundle = useCallback(
    async (projectId: string) => {
      setLoading(true);
      setError(null);

      try {
        const bundle = await getProjectBundle(projectId);

        if (!bundle) {
          setError("Project not found.");
          hydrateSimulation(null);
          return;
        }

        setWorkspace(bundle);
        hydrateSimulation(bundle.simulation ?? null);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load project.");
      } finally {
        setLoading(false);
      }
    },
    [hydrateSimulation, setError, setLoading, setWorkspace]
  );

  const refreshGraph = useCallback(async (projectId: string) => {
    const graph = await getProjectGraph(projectId);
    const project = useProjectStore.getState().project;

    if (project) {
      setWorkspace({
        project,
        tasks: graph.tasks,
        dependencies: graph.dependencies
      });
    }
  }, [setWorkspace]);

  return {
    loadProjectBundle,
    persistProject: upsertProject,
    persistTask: upsertTask,
    persistDependency: upsertDependency,
    persistPositions: saveTaskPositions,
    refreshGraph,
    persistSimulation: saveSimulation
  };
}
