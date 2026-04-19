export type TaskStatus = "not-started" | "in-progress" | "complete" | "blocked";
export type DependencyType =
  | "finish-to-start"
  | "start-to-start"
  | "finish-to-finish";

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  color: string;
  defaultVariancePercent: number;
}

export interface Task {
  id: string;
  projectId: string;
  label: string;
  description: string;
  estimatedDays: number;
  variancePercent: number;
  position: { x: number; y: number };
  status: TaskStatus;
  isFrozen: boolean;
  frozenDelayDays: number;
  color?: string;
}

export interface Dependency {
  id: string;
  projectId: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  lagDays: number;
}

export interface CPMResult {
  taskId: string;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  float: number;
  isCritical: boolean;
}

export interface BottleneckAnalysis {
  taskId: string;
  downstreamImpact: number;
  criticalityScore: number;
}

export interface SimulationHistogramBin {
  bin: number;
  count: number;
}

export interface SimulationResult {
  projectId: string;
  runAt: number;
  iterations: number;
  durations: number[];
  p50: number;
  p75: number;
  p90: number;
  mean: number;
  stdDev: number;
  histogram: SimulationHistogramBin[];
}

export interface WhatIfScenario {
  frozenTasks: Record<string, number>;
  cpmResult: CPMResult[];
  simulationResult: SimulationResult;
}

export interface ProjectBundle {
  project: Project;
  tasks: Task[];
  dependencies: Dependency[];
  simulation?: SimulationResult;
}

export interface ProjectSummary {
  project: Project;
  taskCount: number;
  criticalPathLength: number;
  p50?: number;
  updatedAt: number;
  isolatedTaskIds: string[];
}

export interface WorkerProgressMessage {
  type: "progress";
  percent: number;
}

export interface WorkerCompleteMessage<T> {
  type: "complete";
  result: T;
}

export interface WorkerErrorMessage {
  type: "error";
  message: string;
}

export type SimulationWorkerMessage =
  | WorkerProgressMessage
  | WorkerCompleteMessage<SimulationResult>
  | WorkerErrorMessage;

export type CPMWorkerMessage = WorkerCompleteMessage<CPMResult[]> | WorkerErrorMessage;

export interface ImportValidationIssue {
  path: string;
  message: string;
}

export interface RiskScoreSummary {
  score: number;
  factors: string[];
}

export type RightPanelView =
  | "risk"
  | "stats"
  | "task"
  | "simulation"
  | "what-if"
  | "timeline";

export interface TimelineZoomOption {
  id: "day" | "week" | "month";
  label: string;
  pixelsPerDay: number;
}
