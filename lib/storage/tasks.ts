import {
  deleteDependency,
  deleteTask,
  getDepsForProject,
  getTasksForProject,
  saveDependency,
  saveTask
} from "@/lib/storage/db";
import type { Dependency, Task } from "@/lib/types";

export async function getProjectGraph(projectId: string): Promise<{
  tasks: Task[];
  dependencies: Dependency[];
}> {
  const [tasks, dependencies] = await Promise.all([
    getTasksForProject(projectId),
    getDepsForProject(projectId)
  ]);

  return { tasks, dependencies };
}

export async function upsertTask(task: Task): Promise<void> {
  await saveTask(task);
}

export async function upsertDependency(dependency: Dependency): Promise<void> {
  await saveDependency(dependency);
}

export async function saveTaskPositions(tasks: Task[]): Promise<void> {
  await Promise.all(tasks.map((task) => saveTask(task)));
}

export async function removeTaskAndDependencies(
  taskId: string,
  projectId: string
): Promise<void> {
  const dependencies = await getDepsForProject(projectId);
  const impactedDependencies = dependencies.filter(
    (dependency) =>
      dependency.fromTaskId === taskId || dependency.toTaskId === taskId
  );

  await Promise.all(impactedDependencies.map((dependency) => deleteDependency(dependency.id)));
  await deleteTask(taskId);
}

export async function removeDependency(dependencyId: string): Promise<void> {
  await deleteDependency(dependencyId);
}
