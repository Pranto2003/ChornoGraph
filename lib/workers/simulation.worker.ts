import { runMonteCarloSimulation } from "@/lib/simulation/monte-carlo";
import type { Dependency, Task } from "@/lib/types";

export interface SimulationWorkerRequest {
  tasks: Task[];
  dependencies: Dependency[];
  iterations: number;
  whatIfOverrides?: Record<string, number>;
}

export function runSimulationWorker(payload: SimulationWorkerRequest) {
  return runMonteCarloSimulation(
    payload.tasks,
    payload.dependencies,
    payload.iterations,
    payload.whatIfOverrides
  );
}
