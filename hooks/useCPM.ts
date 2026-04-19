"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { computeCPM } from "@/lib/graph/cpm";
import type { CPMWorkerMessage } from "@/lib/types";
import { buildFlowEdges, buildFlowNodes } from "@/lib/utils/layout";
import { useGraphStore } from "@/store/graphStore";
import { useProjectStore } from "@/store/projectStore";

export function useCPM(whatIfOverrides?: Record<string, number>): void {
  const { tasks, dependencies, setCPMResults } = useProjectStore(
    useShallow((state) => ({
      tasks: state.tasks,
      dependencies: state.dependencies,
      setCPMResults: state.setCPMResults
    }))
  );
  const setGraph = useGraphStore((state) => state.setGraph);

  useEffect(() => {
    setGraph(buildFlowNodes(tasks), buildFlowEdges(dependencies));
  }, [dependencies, setGraph, tasks]);

  useEffect(() => {
    if (tasks.length === 0) {
      setCPMResults([]);
      return;
    }

    if (typeof Worker === "undefined") {
      setCPMResults(computeCPM(tasks, dependencies, whatIfOverrides));
      return;
    }

    const worker = new Worker("/workers/cpm.worker.js");

    worker.onmessage = (event: MessageEvent<CPMWorkerMessage>) => {
      const data = event.data;

      if (data.type === "complete") {
        setCPMResults(data.result);
      }

      if (data.type === "error") {
        console.error(data.message);
      }
    };

    worker.onerror = (error) => {
      console.error(error.message);
      setCPMResults(computeCPM(tasks, dependencies, whatIfOverrides));
    };

    worker.postMessage({
      tasks,
      dependencies,
      whatIfOverrides
    });

    return () => {
      worker.terminate();
    };
  }, [dependencies, setCPMResults, tasks, whatIfOverrides]);
}
