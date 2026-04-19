"use client";

import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";

interface CriticalPathOverlayProps {
  visible: boolean;
  taskCount: number;
  duration: number;
}

export function CriticalPathOverlay({
  visible,
  taskCount,
  duration
}: CriticalPathOverlayProps) {
  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-none absolute left-6 top-24 z-20 flex flex-wrap items-center gap-3 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-50 backdrop-blur-xl"
        >
          <Badge variant="amber">Critical Path</Badge>
          <span>{taskCount} tasks</span>
          <span>{Math.round(duration * 10) / 10} days</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
