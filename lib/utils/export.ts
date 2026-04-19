import type {
  Dependency,
  ImportValidationIssue,
  Project,
  ProjectBundle,
  SimulationResult,
  Task
} from "@/lib/types";

interface RawImportShape {
  project?: unknown;
  tasks?: unknown;
  dependencies?: unknown;
  simulation?: unknown;
}

function triggerJsonDownload(filename: string, content: string): void {
  const blob = new Blob([content], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateProject(value: unknown): ImportValidationIssue[] {
  const issues: ImportValidationIssue[] = [];

  if (!isObject(value)) {
    return [{ path: "project", message: "Project must be an object." }];
  }

  const requiredKeys = [
    "id",
    "name",
    "description",
    "createdAt",
    "updatedAt",
    "color",
    "defaultVariancePercent"
  ] as const;

  for (const key of requiredKeys) {
    if (!(key in value)) {
      issues.push({
        path: `project.${key}`,
        message: "Required field is missing."
      });
    }
  }

  return issues;
}

function validateTasks(value: unknown): ImportValidationIssue[] {
  if (!Array.isArray(value)) {
    return [{ path: "tasks", message: "Tasks must be an array." }];
  }

  return value.flatMap((task, index) => {
    if (!isObject(task)) {
      return [
        {
          path: `tasks[${index}]`,
          message: "Task entry must be an object."
        }
      ];
    }

    const requiredKeys = [
      "id",
      "projectId",
      "label",
      "description",
      "estimatedDays",
      "variancePercent",
      "position",
      "status",
      "isFrozen",
      "frozenDelayDays"
    ] as const;

    return requiredKeys
      .filter((key) => !(key in task))
      .map((key) => ({
        path: `tasks[${index}].${key}`,
        message: "Required field is missing."
      }));
  });
}

function validateDependencies(value: unknown): ImportValidationIssue[] {
  if (!Array.isArray(value)) {
    return [{ path: "dependencies", message: "Dependencies must be an array." }];
  }

  return value.flatMap((dependency, index) => {
    if (!isObject(dependency)) {
      return [
        {
          path: `dependencies[${index}]`,
          message: "Dependency entry must be an object."
        }
      ];
    }

    const requiredKeys = [
      "id",
      "projectId",
      "fromTaskId",
      "toTaskId",
      "type",
      "lagDays"
    ] as const;

    return requiredKeys
      .filter((key) => !(key in dependency))
      .map((key) => ({
        path: `dependencies[${index}].${key}`,
        message: "Required field is missing."
      }));
  });
}

function validateSimulation(value: unknown): ImportValidationIssue[] {
  if (value === undefined) {
    return [];
  }

  if (!isObject(value)) {
    return [{ path: "simulation", message: "Simulation must be an object." }];
  }

  const requiredKeys = [
    "projectId",
    "runAt",
    "iterations",
    "durations",
    "p50",
    "p75",
    "p90",
    "mean",
    "stdDev",
    "histogram"
  ] as const;

  return requiredKeys
    .filter((key) => !(key in value))
    .map((key) => ({
      path: `simulation.${key}`,
      message: "Required field is missing."
    }));
}

export function validateImportPayload(payload: unknown): ImportValidationIssue[] {
  if (!isObject(payload)) {
    return [{ path: "$", message: "Import file must contain a JSON object." }];
  }

  const rawPayload = payload as RawImportShape;

  return [
    ...validateProject(rawPayload.project),
    ...validateTasks(rawPayload.tasks),
    ...validateDependencies(rawPayload.dependencies),
    ...validateSimulation(rawPayload.simulation)
  ];
}

export function serializeProjectBundle(bundle: ProjectBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function downloadProjectBundle(bundle: ProjectBundle): void {
  triggerJsonDownload(
    `${bundle.project.name.replace(/\s+/g, "-").toLowerCase()}.chronograph.json`,
    serializeProjectBundle(bundle)
  );
}

export function createProjectTemplateBundle(): ProjectBundle {
  const projectId = "project-template";

  const project: Project = {
    id: projectId,
    name: "Editable Import Template",
    description:
      "Replace this metadata, edit tasks and dependencies, then import the file back into ChronoGraph.",
    createdAt: 1714550400000,
    updatedAt: 1714550400000,
    color: "#60A5FA",
    defaultVariancePercent: 15
  };

  const tasks: Task[] = [
    {
      id: "task-discovery",
      projectId,
      label: "Discovery",
      description: "Define scope, outcomes, and key stakeholders.",
      estimatedDays: 3,
      variancePercent: 10,
      position: { x: 80, y: 80 },
      status: "not-started",
      isFrozen: false,
      frozenDelayDays: 0
    },
    {
      id: "task-design",
      projectId,
      label: "Design",
      description: "Create the UX, flows, and design review assets.",
      estimatedDays: 4,
      variancePercent: 15,
      position: { x: 360, y: 80 },
      status: "not-started",
      isFrozen: false,
      frozenDelayDays: 0
    },
    {
      id: "task-build",
      projectId,
      label: "Build",
      description: "Implement the scope and connect the required dependencies.",
      estimatedDays: 6,
      variancePercent: 20,
      position: { x: 640, y: 80 },
      status: "not-started",
      isFrozen: false,
      frozenDelayDays: 0
    },
    {
      id: "task-launch",
      projectId,
      label: "Launch Prep",
      description: "Validate release readiness and launch materials.",
      estimatedDays: 2,
      variancePercent: 12,
      position: { x: 920, y: 80 },
      status: "not-started",
      isFrozen: false,
      frozenDelayDays: 0
    }
  ];

  const dependencies: Dependency[] = [
    {
      id: "dep-discovery-design",
      projectId,
      fromTaskId: "task-discovery",
      toTaskId: "task-design",
      type: "finish-to-start",
      lagDays: 0
    },
    {
      id: "dep-design-build",
      projectId,
      fromTaskId: "task-design",
      toTaskId: "task-build",
      type: "finish-to-start",
      lagDays: 0
    },
    {
      id: "dep-build-launch",
      projectId,
      fromTaskId: "task-build",
      toTaskId: "task-launch",
      type: "finish-to-start",
      lagDays: 1
    }
  ];

  const simulation: SimulationResult = {
    projectId,
    runAt: 1714550400000,
    iterations: 1000,
    durations: [14, 15, 15, 16, 17, 18],
    p50: 16,
    p75: 17,
    p90: 18,
    mean: 15.83,
    stdDev: 1.34,
    histogram: [
      { bin: 14, count: 1 },
      { bin: 15, count: 2 },
      { bin: 16, count: 1 },
      { bin: 17, count: 1 },
      { bin: 18, count: 1 }
    ]
  };

  return {
    project,
    tasks,
    dependencies,
    simulation
  };
}

export function getProjectTemplateJson(): string {
  return serializeProjectBundle(createProjectTemplateBundle());
}

export function downloadProjectTemplate(): void {
  triggerJsonDownload(
    "chronograph-template.chronograph.json",
    getProjectTemplateJson()
  );
}

function reassignProject(bundle: ProjectBundle): ProjectBundle {
  const newProjectId = crypto.randomUUID();
  const taskIdMap = new Map<string, string>();

  const project: Project = {
    ...bundle.project,
    id: newProjectId,
    name: `${bundle.project.name} (Imported)`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const tasks: Task[] = bundle.tasks.map((task) => {
    const newTaskId = crypto.randomUUID();
    taskIdMap.set(task.id, newTaskId);

    return {
      ...task,
      id: newTaskId,
      projectId: newProjectId
    };
  });

  const dependencies: Dependency[] = bundle.dependencies.map((dependency) => ({
    ...dependency,
    id: crypto.randomUUID(),
    projectId: newProjectId,
    fromTaskId: taskIdMap.get(dependency.fromTaskId) ?? dependency.fromTaskId,
    toTaskId: taskIdMap.get(dependency.toTaskId) ?? dependency.toTaskId
  }));

  const simulation: SimulationResult | undefined = bundle.simulation
    ? {
        ...bundle.simulation,
        projectId: newProjectId,
        runAt: Date.now()
      }
    : undefined;

  return {
    project,
    tasks,
    dependencies,
    simulation
  };
}

export function parseProjectBundle(json: string): ProjectBundle {
  const parsed = JSON.parse(json) as unknown;
  const issues = validateImportPayload(parsed);

  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
  }

  return parsed as ProjectBundle;
}

export async function readImportFile(file: File): Promise<ProjectBundle> {
  const content = await file.text();
  const parsed = parseProjectBundle(content);
  return reassignProject(parsed);
}
