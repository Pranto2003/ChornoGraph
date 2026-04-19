"use client";

import { motion } from "framer-motion";
import { Download, FlaskConical, Menu, PanelLeft, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showMenuButton?: boolean;
  onOpenSidebar?: () => void;
  onOpenPanel?: () => void;
  onRunSimulation?: () => void;
  onToggleWhatIf?: () => void;
  onExport?: () => void;
}

export function TopBar({
  title,
  subtitle,
  showMenuButton,
  onOpenSidebar,
  onOpenPanel,
  onRunSimulation,
  onToggleWhatIf,
  onExport
}: TopBarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="surface-panel flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between"
    >
      <div className="flex items-start gap-3">
        {showMenuButton ? (
          <Button
            size="icon"
            variant="ghost"
            className="xl:hidden"
            onClick={onOpenSidebar}
            aria-label="Open navigation panel"
          >
            <Menu className="h-4 w-4" />
          </Button>
        ) : null}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="heading-primary text-2xl font-semibold tracking-tight">{title}</h1>
            <Badge variant="blue">ChronoGraph</Badge>
          </div>
          {subtitle ? <p className="text-secondary max-w-3xl text-sm">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onOpenPanel ? (
          <Button variant="ghost" className="xl:hidden" onClick={onOpenPanel}>
            <PanelLeft className="h-4 w-4" />
            Panels
          </Button>
        ) : null}
        {onRunSimulation ? (
          <Button variant="primary" onClick={onRunSimulation}>
            <Sparkles className="h-4 w-4" />
            Run Simulation
          </Button>
        ) : null}
        {onToggleWhatIf ? (
          <Button variant="amber" onClick={onToggleWhatIf}>
            <FlaskConical className="h-4 w-4" />
            What-If
          </Button>
        ) : null}
        {onExport ? (
          <Button variant="ghost" onClick={onExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        ) : null}
        <ThemeToggle />
      </div>
    </motion.header>
  );
}
