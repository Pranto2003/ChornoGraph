"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps
} from "reactflow";

import type { Dependency } from "@/lib/types";
import type { DependencyEdgeData } from "@/lib/utils/layout";
import { useGraphStore } from "@/store/graphStore";
import { useProjectStore } from "@/store/projectStore";

function dependencyLabel(dependency: Dependency): string {
  const shorthand =
    dependency.type === "finish-to-start"
      ? "FS"
      : dependency.type === "start-to-start"
        ? "SS"
        : "FF";

  return `${shorthand} ${dependency.lagDays >= 0 ? "+" : ""}${dependency.lagDays}d`;
}

export function EdgeWithLabel({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data
}: EdgeProps<DependencyEdgeData>) {
  const { resolvedTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const dependency = useProjectStore((state) =>
    state.dependencies.find((item) => item.id === data?.dependencyId)
  );
  const cpmResults = useProjectStore((state) => state.cpmResults);
  const showCriticalPath = useGraphStore((state) => state.showCriticalPath);
  const selectEdge = useProjectStore((state) => state.selectEdge);
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  });

  if (!dependency) {
    return null;
  }

  const cpmById = new Map(cpmResults.map((result) => [result.taskId, result]));
  const isCritical = Boolean(
    cpmById.get(dependency.fromTaskId)?.isCritical &&
      cpmById.get(dependency.toTaskId)?.isCritical
  );
  const isLight = resolvedTheme === "light";

  return (
    <>
      <motion.path
        d={path}
        fill="none"
        stroke={isCritical ? "#F59E0B" : isHovered ? "#CBD5E1" : "#64748B"}
        strokeWidth={isCritical ? 2.5 : 1.8}
        strokeOpacity={showCriticalPath && !isCritical ? 0.3 : 0.9}
        strokeDasharray={isCritical ? "8 8" : "0"}
        animate={isCritical ? { strokeDashoffset: [0, -32] } : { strokeDashoffset: 0 }}
        transition={isCritical ? { duration: 1.4, ease: "linear", repeat: Infinity } : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => selectEdge(id)}
        className="cursor-pointer transition"
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => selectEdge(id)}
          className={
            isLight
              ? "nodrag nopan absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/80 bg-white/94 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-700 shadow-glass"
              : "nodrag nopan absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#0d1322]/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-200 shadow-glass"
          }
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`
          }}
        >
          {dependencyLabel(dependency)}
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
