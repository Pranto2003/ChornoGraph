"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { DAY_IN_MS, formatDurationDays } from "@/lib/utils/date";
import type { TimelineZoomOption } from "@/lib/types";
import { useProjectStore } from "@/store/projectStore";

const zoomOptions: TimelineZoomOption[] = [
  { id: "day", label: "1 day", pixelsPerDay: 28 },
  { id: "week", label: "1 week", pixelsPerDay: 10 },
  { id: "month", label: "1 month", pixelsPerDay: 4 }
];

export function TimelinePanel() {
  const { resolvedTheme } = useTheme();
  const [zoom, setZoom] = useState<TimelineZoomOption>(zoomOptions[0]);
  const { project, tasks, cpmResults } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
      tasks: state.tasks,
      cpmResults: state.cpmResults
    }))
  );

  const rows = useMemo(
    () =>
      cpmResults.map((result) => {
        const task = tasks.find((item) => item.id === result.taskId);
        return task ? { task, result } : null;
      }).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [cpmResults, tasks]
  );

  const duration = Math.max(...cpmResults.map((result) => result.earliestFinish), 1);
  const width = Math.max(720, duration * zoom.pixelsPerDay + 220);
  const height = rows.length * 56 + 64;
  const isLight = resolvedTheme === "light";
  const todayOffset = project
    ? Math.max(0, Math.floor((Date.now() - project.createdAt) / DAY_IN_MS))
    : null;

  return (
    <div className="surface-panel space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-primary text-xl font-semibold">Timeline</h2>
          <p className="text-secondary text-sm">
            SVG Gantt generated directly from CPM earliest-start windows.
          </p>
        </div>
        <div className="flex gap-2">
          {zoomOptions.map((option) => (
            <Button
              key={option.id}
              variant={zoom.id === option.id ? "primary" : "ghost"}
              onClick={() => setZoom(option)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-white/10 dark:bg-[#0d1322]/70">
        <svg width={width} height={height} className="min-w-full">
          {Array.from({ length: Math.ceil(duration) + 1 }).map((_, index) => (
            <g key={index}>
              <line
                x1={180 + index * zoom.pixelsPerDay}
                y1={24}
                x2={180 + index * zoom.pixelsPerDay}
                y2={height - 16}
                stroke={isLight ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.1)"}
              />
              <text
                x={180 + index * zoom.pixelsPerDay}
                y={18}
                fill={isLight ? "#64748B" : "#94A3B8"}
                fontSize={10}
                textAnchor="middle"
              >
                {index}d
              </text>
            </g>
          ))}

          {todayOffset !== null ? (
            <line
              x1={180 + todayOffset * zoom.pixelsPerDay}
              y1={24}
              x2={180 + todayOffset * zoom.pixelsPerDay}
              y2={height - 16}
              stroke="#F87171"
              strokeDasharray="4 4"
            />
          ) : null}

          {rows.map(({ task, result }, index) => {
            const y = 40 + index * 56;
            const x = 180 + result.earliestStart * zoom.pixelsPerDay;
            const barWidth = Math.max(20, task.estimatedDays * zoom.pixelsPerDay);
            const slackWidth = Math.max(0, result.float * zoom.pixelsPerDay);

            return (
              <g key={task.id}>
                <text x={12} y={y + 18} fill={isLight ? "#334155" : "#E2E8F0"} fontSize={12}>
                  {task.label}
                </text>
                <motion.rect
                  initial={{ width: 0 }}
                  animate={{ width: barWidth }}
                  transition={{ duration: 0.28, delay: index * 0.03 }}
                  x={x}
                  y={y}
                  rx={12}
                  height={24}
                  fill={result.isCritical ? "#F59E0B" : "#60A5FA"}
                >
                  <title>
                    {task.label}: ES {formatDurationDays(result.earliestStart)}, EF{" "}
                    {formatDurationDays(result.earliestFinish)}, Float{" "}
                    {formatDurationDays(result.float)}
                  </title>
                </motion.rect>
                {slackWidth > 0 ? (
                  <rect
                    x={x + barWidth}
                    y={y}
                    rx={12}
                    height={24}
                    width={slackWidth}
                    fill={isLight ? "rgba(148,163,184,0.28)" : "rgba(148,163,184,0.2)"}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
