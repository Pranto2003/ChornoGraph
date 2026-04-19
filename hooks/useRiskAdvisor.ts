"use client";

import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useDAG } from "@/hooks/useDAG";
import {
  computeProjectRiskScore,
  findBottlenecks,
  findNearCriticalTasks,
  generateRecommendations
} from "@/lib/intelligence/risk-advisor";
import { computeProjectDuration } from "@/lib/graph/cpm";
import type { SimulationResult } from "@/lib/types";
import { buildHistogramBins } from "@/lib/simulation/statistics";
import { useGraphStore } from "@/store/graphStore";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useProjectStore } from "@/store/projectStore";
import { useSimulationStore } from "@/store/simulationStore";

function buildFallbackSimulation(
  projectId: string,
  projectDuration: number
): SimulationResult {
  const durations = projectDuration > 0 ? [projectDuration] : [];

  return {
    projectId,
    runAt: Date.now(),
    iterations: 0,
    durations,
    p50: projectDuration,
    p75: projectDuration,
    p90: projectDuration,
    mean: projectDuration,
    stdDev: 0,
    histogram: durations.length > 0 ? buildHistogramBins(durations, 1) : []
  };
}

export function useRiskAdvisor(): void {
  const { dag } = useDAG();
  const { project, cpmResults } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
      cpmResults: state.cpmResults
    }))
  );
  const { whatIfMode, whatIfOverrides } = useGraphStore(
    useShallow((state) => ({
      whatIfMode: state.whatIfMode,
      whatIfOverrides: state.whatIfOverrides
    }))
  );
  const { baselineResult, comparisonResult, result } = useSimulationStore(
    useShallow((state) => ({
      baselineResult: state.baselineResult,
      comparisonResult: state.comparisonResult,
      result: state.result
    }))
  );
  const { setIntelligence, reset } = useIntelligenceStore(
    useShallow((state) => ({
      setIntelligence: state.setIntelligence,
      reset: state.reset
    }))
  );

  const activeSimulation = useMemo(() => {
    if (whatIfMode) {
      return comparisonResult ?? result ?? baselineResult ?? null;
    }

    return baselineResult ?? result ?? null;
  }, [baselineResult, comparisonResult, result, whatIfMode]);

  const intelligence = useMemo(() => {
    if (!project || cpmResults.length === 0) {
      return null;
    }

    const projectDuration = computeProjectDuration(cpmResults);
    const simulation =
      activeSimulation ?? buildFallbackSimulation(project.id, projectDuration);
    const bottlenecks = findBottlenecks(dag, cpmResults);
    const nearCriticalTasks = findNearCriticalTasks(cpmResults);
    const riskScore = computeProjectRiskScore(cpmResults, simulation);
    const recommendations = generateRecommendations(
      bottlenecks,
      nearCriticalTasks,
      riskScore
    );

    return {
      bottlenecks,
      nearCriticalTasks,
      riskScore,
      recommendations
    };
  }, [activeSimulation, cpmResults, dag, project, whatIfOverrides]);

  useEffect(() => {
    if (!intelligence) {
      reset();
      return;
    }

    setIntelligence(intelligence);
  }, [intelligence, reset, setIntelligence]);
}
