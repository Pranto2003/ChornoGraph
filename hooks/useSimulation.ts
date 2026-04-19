"use client";

import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { runMonteCarloSimulation } from "@/lib/simulation/monte-carlo";
import {
  buildHistogramBins,
  calculateMean,
  calculatePercentile,
  calculateStdDev
} from "@/lib/simulation/statistics";
import { saveSimulation } from "@/lib/storage/db";
import type {
  SimulationResult,
  SimulationWorkerMessage
} from "@/lib/types";
import { useProjectStore } from "@/store/projectStore";
import { useSimulationStore } from "@/store/simulationStore";

function finalizeDurations(
  projectId: string,
  durations: number[],
  iterations: number
): SimulationResult {
  const sorted = [...durations].sort((left, right) => left - right);
  const mean = calculateMean(sorted);
  const stdDev = calculateStdDev(sorted, mean);

  return {
    projectId,
    runAt: Date.now(),
    iterations,
    durations: sorted,
    p50: calculatePercentile(sorted, 0.5),
    p75: calculatePercentile(sorted, 0.75),
    p90: calculatePercentile(sorted, 0.9),
    mean,
    stdDev,
    histogram: buildHistogramBins(sorted)
  };
}

export function useSimulation(): {
  runSimulation: (mode?: "baseline" | "comparison", overrides?: Record<string, number>) => void;
  cancelSimulation: () => void;
} {
  const workerRef = useRef<Worker | null>(null);
  const idleRef = useRef<number | null>(null);
  const { tasks, dependencies, project } = useProjectStore(
    useShallow((state) => ({
      tasks: state.tasks,
      dependencies: state.dependencies,
      project: state.project
    }))
  );
  const {
    iterations,
    start,
    setProgress,
    complete,
    fail
  } = useSimulationStore(
    useShallow((state) => ({
      iterations: state.iterations,
      start: state.start,
      setProgress: state.setProgress,
      complete: state.complete,
      fail: state.fail
    }))
  );

  const cancelSimulation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    if (idleRef.current !== null && typeof window !== "undefined") {
      window.cancelIdleCallback?.(idleRef.current);
      idleRef.current = null;
    }
  }, []);

  useEffect(() => cancelSimulation, [cancelSimulation]);

  const runSimulation = useCallback(
    (mode: "baseline" | "comparison" = "baseline", overrides?: Record<string, number>) => {
      if (!project) {
        fail("Project context is missing.");
        return;
      }

      if (tasks.length === 0) {
        fail("Add at least one task before running a simulation.");
        return;
      }

      cancelSimulation();
      start();

      if (typeof Worker !== "undefined") {
        workerRef.current = new Worker("/workers/simulation.worker.js");

        workerRef.current.onmessage = async (
          event: MessageEvent<SimulationWorkerMessage>
        ) => {
          const data = event.data;

          if (data.type === "progress") {
            setProgress(data.percent);
            return;
          }

          if (data.type === "complete") {
            complete(data.result, mode);

            if (mode === "baseline") {
              await saveSimulation(data.result);
            }
          }

          if (data.type === "error") {
            fail(data.message);
          }
        };

        workerRef.current.onerror = () => {
          fail("Simulation worker failed. You can retry or fall back to local chunks.");
        };

        workerRef.current.postMessage({
          tasks,
          dependencies,
          iterations,
          whatIfOverrides: overrides
        });
        return;
      }

      const durations: number[] = [];
      let completedIterations = 0;

      const scheduleChunk = () => {
        const remaining = iterations - completedIterations;
        const chunkSize = Math.min(500, remaining);
        const partial = runMonteCarloSimulation(
          tasks,
          dependencies,
          chunkSize,
          overrides
        );
        durations.push(...partial.durations);
        completedIterations += chunkSize;
        setProgress(Math.round((completedIterations / iterations) * 100));

        if (completedIterations >= iterations) {
          const result = finalizeDurations(project.id, durations, iterations);
          complete(result, mode);

          if (mode === "baseline") {
            void saveSimulation(result);
          }

          return;
        }

        idleRef.current =
          window.requestIdleCallback?.(scheduleChunk) ??
          window.setTimeout(scheduleChunk, 16);
      };

      scheduleChunk();
    },
    [
      cancelSimulation,
      complete,
      dependencies,
      fail,
      iterations,
      project,
      setProgress,
      start,
      tasks
    ]
  );

  return {
    runSimulation,
    cancelSimulation
  };
}
