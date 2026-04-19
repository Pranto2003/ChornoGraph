import { computeCPM, computeProjectDuration } from "@/lib/graph/cpm";
import {
  deleteProjectCascade,
  getAllProjects,
  getDepsForProject,
  getProject,
  getSimulation,
  getTasksForProject,
  saveDependency,
  saveProject,
  saveSimulation,
  saveTask
} from "@/lib/storage/db";
import type { Project, ProjectBundle, ProjectSummary } from "@/lib/types";
import { createSampleProjectBundle } from "@/lib/utils/sample-data";

export async function getProjectBundle(projectId: string): Promise<ProjectBundle | null> {
  const project = await getProject(projectId);

  if (!project) {
    return null;
  }

  const [tasks, dependencies, simulation] = await Promise.all([
    getTasksForProject(projectId),
    getDepsForProject(projectId),
    getSimulation(projectId)
  ]);

  return {
    project,
    tasks,
    dependencies,
    simulation
  };
}

export async function listProjectSummaries(): Promise<ProjectSummary[]> {
  const projects = await getAllProjects();

  const summaries = await Promise.all(
    projects.map(async (project) => {
      const [tasks, dependencies, simulation] = await Promise.all([
        getTasksForProject(project.id),
        getDepsForProject(project.id),
        getSimulation(project.id)
      ]);
      const cpm = tasks.length > 0 ? computeCPM(tasks, dependencies) : [];
      const criticalPathLength = computeProjectDuration(cpm);
      const endNodes = new Set(tasks.map((task) => task.id));

      for (const dependency of dependencies) {
        endNodes.delete(dependency.fromTaskId);
      }

      const reachableToEnd = new Set<string>();

      for (const endNode of endNodes) {
        reachableToEnd.add(endNode);
      }

      const isolatedTaskIds = tasks
        .filter((task) => {
          const hasIncoming = dependencies.some((dep) => dep.toTaskId === task.id);
          const hasOutgoing = dependencies.some((dep) => dep.fromTaskId === task.id);
          return !hasIncoming && !hasOutgoing && tasks.length > 1;
        })
        .map((task) => task.id);

      return {
        project,
        taskCount: tasks.length,
        criticalPathLength,
        p50: simulation?.p50,
        updatedAt: project.updatedAt,
        isolatedTaskIds
      };
    })
  );

  return summaries.sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function upsertProject(project: Project): Promise<void> {
  await saveProject({
    ...project,
    updatedAt: Date.now()
  });
}

export async function removeProject(projectId: string): Promise<void> {
  await deleteProjectCascade(projectId);
}

export async function ensureSampleProject(): Promise<ProjectBundle> {
  const projects = await getAllProjects();

  if (projects.length > 0) {
    const existingBundle = await getProjectBundle(projects[0].id);

    if (!existingBundle) {
      return createSampleProjectBundle();
    }

    return existingBundle;
  }

  const sample = createSampleProjectBundle();
  await saveProject(sample.project);
  await Promise.all(sample.tasks.map((task) => saveTask(task)));
  await Promise.all(sample.dependencies.map((dependency) => saveDependency(dependency)));
  const simulation = simulationFromSample(sample.project.id);
  await saveSimulation(simulation);
  return {
    ...sample,
    simulation
  };
}

function simulationFromSample(projectId: string) {
  return {
    projectId,
    runAt: Date.now(),
    iterations: 2000,
    durations: [41, 42, 44, 45, 47, 49, 50, 52, 54, 56],
    p50: 47,
    p75: 52,
    p90: 56,
    mean: 48,
    stdDev: 4.8,
    histogram: [
      { bin: 40, count: 1 },
      { bin: 42, count: 2 },
      { bin: 44, count: 1 },
      { bin: 46, count: 1 },
      { bin: 48, count: 1 },
      { bin: 50, count: 2 },
      { bin: 52, count: 1 },
      { bin: 54, count: 1 }
    ]
  };
}
