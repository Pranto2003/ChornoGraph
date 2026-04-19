"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Handle, Position, type NodeProps } from "reactflow";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { getStatusColor, getTaskSurfaceColor } from "@/lib/utils/color";
import { formatDurationDays } from "@/lib/utils/date";
import type { Task } from "@/lib/types";
import type { TaskNodeData } from "@/lib/utils/layout";
import { useGraphStore } from "@/store/graphStore";
import { useProjectStore } from "@/store/projectStore";

function truncateLabel(label: string): string {
  return label.length > 24 ? `${label.slice(0, 21)}...` : label;
}

export function TaskNode({ data }: NodeProps<TaskNodeData>) {
  const { resolvedTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const task = useProjectStore((state) =>
    state.tasks.find((item) => item.id === data.taskId)
  ) as Task | undefined;
  const cpm = useProjectStore((state) =>
    state.cpmResults.find((item) => item.taskId === data.taskId)
  );
  const { showCriticalPath, whatIfMode, affectedTaskIds, whatIfOverrides } = useGraphStore(
    useShallow((state) => ({
      showCriticalPath: state.showCriticalPath,
      whatIfMode: state.whatIfMode,
      affectedTaskIds: state.affectedTaskIds,
      whatIfOverrides: state.whatIfOverrides
    }))
  );

  const selectTask = useProjectStore((state) => state.selectTask);
  const upsertTask = useProjectStore((state) => state.upsertTask);
  const setWhatIfDelay = useGraphStore((state) => state.setWhatIfDelay);

  if (!task || !cpm) {
    return null;
  }

  const isCritical = cpm.isCritical;
  const isDimmed = showCriticalPath && !isCritical;
  const isAffected = affectedTaskIds.includes(task.id);
  const currentDelay = whatIfOverrides[task.id] ?? task.frozenDelayDays;
  const isLight = resolvedTheme === "light";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={() => selectTask(task.id)}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-[264px] text-left outline-none"
            aria-label={`Open task details for ${task.label}`}
          >
            <Handle
              id={`${task.id}-target`}
              type="target"
              position={Position.Left}
              className={
                isLight
                  ? "!h-3 !w-3 !border !border-slate-400/70 !bg-white"
                  : "!h-3 !w-3 !border !border-white/50 !bg-slate-900"
              }
            />
            <motion.div
              animate={
                isCritical
                  ? { scale: [1, 1.02, 1] }
                  : { scale: 1, opacity: isDimmed ? 0.3 : 1 }
              }
              transition={
                isCritical
                  ? { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
                  : { duration: 0.25 }
              }
              className={
                isLight
                  ? "rounded-[26px] border border-slate-200/80 p-4 shadow-node transition-all duration-200 hover:border-slate-300"
                  : "rounded-[26px] border border-white/10 p-4 shadow-node transition-all duration-200 hover:border-white/20"
              }
              style={{
                background: getTaskSurfaceColor(cpm.float, task.color),
                boxShadow: isAffected
                  ? "0 0 0 2px rgba(248, 113, 113, 0.35), 0 14px 40px rgba(0,0,0,0.28)"
                  : undefined
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {truncateLabel(task.label)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span
                      className="inline-flex h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    />
                    <span>{formatDurationDays(task.estimatedDays)}</span>
                  </div>
                </div>
                {isCritical ? (
                  <Badge variant="amber">Critical</Badge>
                ) : (
                  <Badge variant="default">Float: {formatDurationDays(cpm.float)}</Badge>
                )}
              </div>

              <AnimatePresence initial={false}>
                {isHovered ? (
                  <motion.p
                    key="preview"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden text-xs leading-5 text-slate-600 dark:text-slate-300"
                  >
                    {task.description || "No description added yet."}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              {whatIfMode ? (
                <div className="mt-4 space-y-2 rounded-2xl border border-amber-300/40 bg-amber-400/14 p-3 dark:border-amber-400/20 dark:bg-amber-500/10">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-amber-800 dark:text-amber-100">
                    <span>Delay Injection</span>
                    <span>{currentDelay}d</span>
                  </div>
                  <Slider
                    value={[currentDelay]}
                    min={0}
                    max={30}
                    step={1}
                    aria-label={`Adjust what-if delay for ${task.label}`}
                    onValueChange={([value]) => {
                      const nextValue = value ?? 0;
                      setWhatIfDelay(task.id, nextValue);
                      upsertTask({
                        ...task,
                        isFrozen: nextValue > 0,
                        frozenDelayDays: nextValue
                      });
                    }}
                  />
                </div>
              ) : null}
            </motion.div>
            <Handle
              id={`${task.id}-source`}
              type="source"
              position={Position.Right}
              className={
                isLight
                  ? "!h-3 !w-3 !border !border-slate-400/70 !bg-white"
                  : "!h-3 !w-3 !border !border-white/50 !bg-slate-900"
              }
            />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>{task.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
