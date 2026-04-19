import type { Dependency, Project, ProjectBundle, Task } from "@/lib/types";

function createTask(
  projectId: string,
  label: string,
  description: string,
  estimatedDays: number,
  variancePercent: number,
  x: number,
  y: number,
  status: Task["status"] = "not-started"
): Task {
  return {
    id: crypto.randomUUID(),
    projectId,
    label,
    description,
    estimatedDays,
    variancePercent,
    position: { x, y },
    status,
    isFrozen: false,
    frozenDelayDays: 0
  };
}

function dependency(
  projectId: string,
  fromTaskId: string,
  toTaskId: string,
  type: Dependency["type"] = "finish-to-start",
  lagDays = 0
): Dependency {
  return {
    id: crypto.randomUUID(),
    projectId,
    fromTaskId,
    toTaskId,
    type,
    lagDays
  };
}

export function createSampleProjectBundle(): ProjectBundle {
  const projectId = crypto.randomUUID();
  const project: Project = {
    id: projectId,
    name: "Web App Launch v2.0",
    description:
      "A realistic launch plan spanning research, engineering, QA, marketing, and release readiness.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    color: "#60A5FA",
    defaultVariancePercent: 18
  };

  const tasks = [
    createTask(projectId, "Product Requirements", "Finalize scope and measurable launch goals.", 4, 12, 40, 60),
    createTask(projectId, "Design System Audit", "Align tokens, layouts, and brand updates.", 3, 10, 280, 40),
    createTask(projectId, "Architecture Review", "Validate technical plan, risks, and dependencies.", 5, 15, 280, 160),
    createTask(projectId, "Backend Contract", "Lock API contracts and data payloads.", 4, 20, 520, 40),
    createTask(projectId, "Frontend Build", "Implement key launch pages and interactive flows.", 8, 25, 520, 180),
    createTask(projectId, "Analytics Instrumentation", "Track activation, onboarding, and campaign funnels.", 3, 18, 760, 40),
    createTask(projectId, "QA Test Plan", "Author regression, smoke, and exploratory test plans.", 4, 12, 760, 180),
    createTask(projectId, "Performance Pass", "Tune loading, bundle size, and render hotspots.", 5, 22, 1000, 40),
    createTask(projectId, "Legal & Compliance Review", "Review messaging, privacy, and launch terms.", 6, 8, 1000, 180),
    createTask(projectId, "Launch Content", "Prepare release notes, docs, and support playbooks.", 4, 14, 1240, 60),
    createTask(projectId, "Go/No-Go Meeting", "Review final quality gates with stakeholders.", 2, 6, 1480, 120),
    createTask(projectId, "Launch Day", "Release and monitor the production rollout.", 1, 5, 1720, 120, "in-progress")
  ];

  const byLabel = new Map(tasks.map((task) => [task.label, task.id]));

  const dependencies = [
    dependency(projectId, byLabel.get("Product Requirements")!, byLabel.get("Design System Audit")!),
    dependency(projectId, byLabel.get("Product Requirements")!, byLabel.get("Architecture Review")!),
    dependency(projectId, byLabel.get("Architecture Review")!, byLabel.get("Backend Contract")!),
    dependency(projectId, byLabel.get("Architecture Review")!, byLabel.get("Frontend Build")!),
    dependency(projectId, byLabel.get("Design System Audit")!, byLabel.get("Frontend Build")!, "finish-to-start", 1),
    dependency(projectId, byLabel.get("Backend Contract")!, byLabel.get("Analytics Instrumentation")!),
    dependency(projectId, byLabel.get("Frontend Build")!, byLabel.get("QA Test Plan")!),
    dependency(projectId, byLabel.get("Frontend Build")!, byLabel.get("Performance Pass")!, "start-to-start", 2),
    dependency(projectId, byLabel.get("QA Test Plan")!, byLabel.get("Legal & Compliance Review")!),
    dependency(projectId, byLabel.get("Performance Pass")!, byLabel.get("Go/No-Go Meeting")!),
    dependency(projectId, byLabel.get("Legal & Compliance Review")!, byLabel.get("Go/No-Go Meeting")!),
    dependency(projectId, byLabel.get("Analytics Instrumentation")!, byLabel.get("Launch Content")!, "finish-to-start", 1),
    dependency(projectId, byLabel.get("Launch Content")!, byLabel.get("Go/No-Go Meeting")!),
    dependency(projectId, byLabel.get("Go/No-Go Meeting")!, byLabel.get("Launch Day")!)
  ];

  return {
    project,
    tasks,
    dependencies
  };
}
