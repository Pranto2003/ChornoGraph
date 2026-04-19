"use client";

import { motion } from "framer-motion";
import { Activity, CalendarRange, ListChecks } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: "tasks" | "timeline" | "stats";
  onTabChange: (tab: "tasks" | "timeline" | "stats") => void;
  children: React.ReactNode;
  className?: string;
}

export function Sidebar({
  activeTab,
  onTabChange,
  children,
  className
}: SidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
      className={cn(
        "surface-panel-strong p-4",
        className
      )}
    >
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">
            <ListChecks className="mr-2 h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <CalendarRange className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Activity className="mr-2 h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">{children}</div>
    </motion.aside>
  );
}
