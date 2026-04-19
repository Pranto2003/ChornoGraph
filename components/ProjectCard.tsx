"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

import type { ProjectSummary } from "@/lib/types";

export type ProjectHealthStatus = "ON_TRACK" | "AT_RISK" | "CRITICAL";

export interface ProjectCardMeta {
  completionPercent: number;
  status: ProjectHealthStatus;
  updatedLabel: string;
}

interface ProjectCardProps {
  summary: ProjectSummary;
  meta: ProjectCardMeta;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
}

const statusStyles: Record<
  ProjectHealthStatus,
  string
> = {
  ON_TRACK:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  AT_RISK:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300",
  CRITICAL:
    "border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300"
};

function DotSeparator() {
  return <span className="opacity-30">·</span>;
}

export function ProjectCard({
  summary,
  meta,
  index,
  onOpen,
  onDelete
}: ProjectCardProps) {
  const statusStyle = statusStyles[meta.status];

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      role="button"
      tabIndex={0}
      className="group relative overflow-hidden rounded-[14px] border border-[color:var(--border-soft)] bg-[color:var(--card-bg)] transition-all duration-150 ease-out hover:border-[color:var(--accent-border-strong)] hover:shadow-[var(--shadow-hover)]"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: summary.project.color }}
      />

      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-medium text-[color:var(--text-primary)]">
                {summary.project.name}
              </h3>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.07em] ${statusStyle}`}
              >
                {meta.status.replace("_", " ")}
              </span>
            </div>

            <p className="mt-3 line-clamp-2 text-[14px] leading-[1.65] text-[color:var(--text-secondary)]">
              {summary.project.description}
            </p>
          </div>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-[color:var(--text-muted)] opacity-0 transition-all duration-150 ease-out hover:-translate-y-px hover:border-[color:var(--border-soft)] hover:text-[color:var(--text-primary)] group-hover:opacity-100"
            aria-label={`Delete ${summary.project.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px] leading-none text-[color:var(--text-secondary)]">
          <span className="font-mono">{summary.taskCount} tasks</span>
          <DotSeparator />
          <span className="font-mono">
            {Math.round(summary.criticalPathLength)}d critical path
          </span>
          <DotSeparator />
          <span className="font-mono">Updated {meta.updatedLabel}</span>
        </div>

        <div className="mt-5 h-[3px] overflow-hidden rounded-full bg-[color:var(--border-soft)]">
          <div
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${Math.max(0, Math.min(100, meta.completionPercent))}%`,
              backgroundColor: summary.project.color
            }}
          />
        </div>
      </div>
    </motion.article>
  );
}
