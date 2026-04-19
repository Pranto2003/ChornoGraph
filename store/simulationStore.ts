import { create } from "zustand";

import type { SimulationResult } from "@/lib/types";

type SimulationStatus = "idle" | "running" | "complete" | "error";

interface SimulationStoreState {
  status: SimulationStatus;
  progress: number;
  iterations: number;
  result: SimulationResult | null;
  baselineResult: SimulationResult | null;
  comparisonResult: SimulationResult | null;
  error: string | null;
  setIterations: (iterations: number) => void;
  start: () => void;
  setProgress: (progress: number) => void;
  complete: (result: SimulationResult, mode?: "baseline" | "comparison") => void;
  fail: (message: string) => void;
  hydrate: (result: SimulationResult | null) => void;
  resetComparison: () => void;
}

export const useSimulationStore = create<SimulationStoreState>((set) => ({
  status: "idle",
  progress: 0,
  iterations: 5000,
  result: null,
  baselineResult: null,
  comparisonResult: null,
  error: null,
  setIterations: (iterations) => set({ iterations }),
  start: () =>
    set({
      status: "running",
      progress: 0,
      error: null
    }),
  setProgress: (progress) => set({ progress }),
  complete: (result, mode = "baseline") =>
    set((state) => ({
      status: "complete",
      progress: 100,
      result,
      baselineResult: mode === "baseline" ? result : state.baselineResult,
      comparisonResult: mode === "comparison" ? result : state.comparisonResult,
      error: null
    })),
  fail: (message) =>
    set({
      status: "error",
      error: message
    }),
  hydrate: (result) =>
    set({
      result,
      baselineResult: result,
      comparisonResult: null,
      status: result ? "complete" : "idle",
      progress: result ? 100 : 0
    }),
  resetComparison: () => set({ comparisonResult: null })
}));
