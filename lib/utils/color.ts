import type { TaskStatus } from "@/lib/types";

export function getFloatColor(floatValue: number): string {
  if (floatValue <= 0) {
    return "#F59E0B";
  }

  if (floatValue <= 3) {
    return "#FCD34D";
  }

  return "#64748B";
}

export function getTaskSurfaceColor(floatValue: number, override?: string): string {
  if (override) {
    return override;
  }

  if (floatValue <= 0) {
    return "rgba(245, 158, 11, 0.16)";
  }

  if (floatValue <= 3) {
    return "rgba(252, 211, 77, 0.12)";
  }

  return "rgba(148, 163, 184, 0.12)";
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "in-progress":
      return "#60A5FA";
    case "complete":
      return "#34D399";
    case "blocked":
      return "#F87171";
    case "not-started":
    default:
      return "#94A3B8";
  }
}

export function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}
