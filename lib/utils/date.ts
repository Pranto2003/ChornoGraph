import type { SimulationResult } from "@/lib/types";

export const DAY_IN_MS = 1000 * 60 * 60 * 24;

export function addDaysToTimestamp(timestamp: number, days: number): number {
  return timestamp + days * DAY_IN_MS;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatDurationDays(days: number): string {
  return `${Math.round(days * 10) / 10}d`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(timestamp);
}

export function formatRelativeDays(days: number): string {
  if (days === 0) {
    return "today";
  }

  return `${days > 0 ? "+" : ""}${days}d`;
}

export function describeSimulationDateWindow(
  simulation: SimulationResult,
  baseDate: number,
  percentile: keyof Pick<SimulationResult, "p50" | "p75" | "p90">
): string {
  const target = addDaysToTimestamp(baseDate, simulation[percentile]);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long"
  }).format(target);
}
