import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { Dependency, Project, SimulationResult, Task } from "@/lib/types";

interface ChronoGraphDBSchema extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { createdAt: number };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { projectId: string };
  };
  dependencies: {
    key: string;
    value: Dependency;
    indexes: { projectId: string };
  };
  simulations: {
    key: string;
    value: SimulationResult;
  };
}

const DB_NAME = "chronograph-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChronoGraphDBSchema>> | null = null;

export function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

async function getDatabase(): Promise<IDBPDatabase<ChronoGraphDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ChronoGraphDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const projectsStore = database.createObjectStore("projects", {
          keyPath: "id"
        });
        projectsStore.createIndex("createdAt", "createdAt");

        const tasksStore = database.createObjectStore("tasks", { keyPath: "id" });
        tasksStore.createIndex("projectId", "projectId");

        const dependenciesStore = database.createObjectStore("dependencies", {
          keyPath: "id"
        });
        dependenciesStore.createIndex("projectId", "projectId");

        database.createObjectStore("simulations", { keyPath: "projectId" });
      }
    });
  }

  return dbPromise;
}

async function withQuotaHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error(
        "Browser storage is full. Export older projects and remove them before saving again."
      );
    }

    throw error;
  }
}

export async function getProject(id: string): Promise<Project | undefined> {
  return (await getDatabase()).get("projects", id);
}

export async function getAllProjects(): Promise<Project[]> {
  return (await getDatabase()).getAllFromIndex("projects", "createdAt");
}

export async function saveProject(project: Project): Promise<void> {
  await withQuotaHandling(async () => {
    await (await getDatabase()).put("projects", project);
  });
}

export async function deleteProject(id: string): Promise<void> {
  await (await getDatabase()).delete("projects", id);
}

export async function getTasksForProject(projectId: string): Promise<Task[]> {
  return (await getDatabase()).getAllFromIndex("tasks", "projectId", projectId);
}

export async function saveTask(task: Task): Promise<void> {
  await withQuotaHandling(async () => {
    await (await getDatabase()).put("tasks", task);
  });
}

export async function deleteTask(id: string): Promise<void> {
  await (await getDatabase()).delete("tasks", id);
}

export async function getDepsForProject(projectId: string): Promise<Dependency[]> {
  return (await getDatabase()).getAllFromIndex("dependencies", "projectId", projectId);
}

export async function saveDependency(dependency: Dependency): Promise<void> {
  await withQuotaHandling(async () => {
    await (await getDatabase()).put("dependencies", dependency);
  });
}

export async function deleteDependency(id: string): Promise<void> {
  await (await getDatabase()).delete("dependencies", id);
}

export async function getSimulation(projectId: string): Promise<SimulationResult | undefined> {
  return (await getDatabase()).get("simulations", projectId);
}

export async function saveSimulation(simulation: SimulationResult): Promise<void> {
  await withQuotaHandling(async () => {
    await (await getDatabase()).put("simulations", simulation);
  });
}

export async function deleteProjectCascade(projectId: string): Promise<void> {
  const database = await getDatabase();
  const transaction = database.transaction(
    ["projects", "tasks", "dependencies", "simulations"],
    "readwrite"
  );

  const tasksStore = transaction.objectStore("tasks");
  const dependenciesStore = transaction.objectStore("dependencies");

  const tasks = await tasksStore.index("projectId").getAllKeys(projectId);
  const dependencies = await dependenciesStore.index("projectId").getAllKeys(projectId);

  for (const taskId of tasks) {
    await tasksStore.delete(taskId);
  }

  for (const dependencyId of dependencies) {
    await dependenciesStore.delete(dependencyId);
  }

  await transaction.objectStore("simulations").delete(projectId);
  await transaction.objectStore("projects").delete(projectId);
  await transaction.done;
}
