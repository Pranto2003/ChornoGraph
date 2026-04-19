import { create } from "zustand";

import type {
  BottleneckAnalysis,
  CPMResult,
  RiskScoreSummary
} from "@/lib/types";

interface IntelligenceStoreState {
  bottlenecks: BottleneckAnalysis[];
  nearCriticalTasks: CPMResult[];
  riskScore: RiskScoreSummary;
  recommendations: string[];
  setIntelligence: (payload: {
    bottlenecks: BottleneckAnalysis[];
    nearCriticalTasks: CPMResult[];
    riskScore: RiskScoreSummary;
    recommendations: string[];
  }) => void;
  reset: () => void;
}

const defaultRiskScore: RiskScoreSummary = {
  score: 0,
  factors: []
};

export const useIntelligenceStore = create<IntelligenceStoreState>((set) => ({
  bottlenecks: [],
  nearCriticalTasks: [],
  riskScore: defaultRiskScore,
  recommendations: [],
  setIntelligence: (payload) =>
    set({
      bottlenecks: payload.bottlenecks,
      nearCriticalTasks: payload.nearCriticalTasks,
      riskScore: payload.riskScore,
      recommendations: payload.recommendations
    }),
  reset: () =>
    set({
      bottlenecks: [],
      nearCriticalTasks: [],
      riskScore: defaultRiskScore,
      recommendations: []
    })
}));
