/**
 * ALGORITHM: Descriptive statistics and fixed-width histogram binning
 * TIME COMPLEXITY: O(n + b) where n = number of samples and b = histogram bins
 * SPACE COMPLEXITY: O(b) for the histogram plus O(1) additional aggregates
 *
 * WHY THESE PRIMITIVES OVER CHART-LIB HELPERS:
 * ChronoGraph needs deterministic percentile extraction, summary metrics, and
 * reusable histogram bins that can be consumed by both the worker and the UI.
 * Keeping the math local and typed avoids duplicated logic across rendering
 * layers and makes the simulation engine straightforward to test.
 *
 * IN CHRONOGRAPH:
 * Monte Carlo runs generate thousands of project-duration samples. This module
 * turns those raw runs into the P50/P75/P90 forecast values and the histogram
 * shape that the dashboard and simulation panel present to the user.
 */

import type { SimulationHistogramBin } from "@/lib/types";

export function calculateMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateStdDev(values: number[], mean = calculateMean(values)): number {
  if (values.length === 0) {
    return 0;
  }

  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.floor(sortedValues.length * percentile)
  );

  return sortedValues[index];
}

export function buildHistogramBins(
  values: number[],
  binCount = 20
): SimulationHistogramBin[] {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const width = range / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    bin: Math.round((min + width * index) * 10) / 10,
    count: 0
  }));

  for (const value of values) {
    const rawIndex = Math.floor((value - min) / width);
    const boundedIndex = Math.min(binCount - 1, Math.max(0, rawIndex));
    bins[boundedIndex].count += 1;
  }

  return bins;
}
