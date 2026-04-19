import { computeCPM } from "@/lib/graph/cpm";
import type { Dependency, Task } from "@/lib/types";

export interface CPMWorkerRequest {
  tasks: Task[];
  dependencies: Dependency[];
  whatIfOverrides?: Record<string, number>;
}

export function runCPMWorker(payload: CPMWorkerRequest) {
  return computeCPM(payload.tasks, payload.dependencies, payload.whatIfOverrides);
}
