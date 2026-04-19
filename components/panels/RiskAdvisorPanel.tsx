"use client";

import { animate, motion } from "framer-motion";
import { AlertTriangle, Gauge, GitBranchPlus, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDurationDays } from "@/lib/utils/date";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useProjectStore } from "@/store/projectStore";

function getRiskTone(score: number): {
  label: string;
  accent: string;
  glow: string;
} {
  if (score <= 30) {
    return {
      label: "Low Risk",
      accent: "from-emerald-400/30 via-emerald-300/20 to-teal-300/10",
      glow: "text-emerald-700 dark:text-emerald-200"
    };
  }

  if (score <= 70) {
    return {
      label: "Moderate Risk",
      accent: "from-yellow-400/30 via-amber-300/20 to-orange-300/10",
      glow: "text-amber-700 dark:text-yellow-100"
    };
  }

  return {
    label: "High Risk",
    accent: "from-red-500/35 via-orange-400/20 to-yellow-300/10",
    glow: "text-red-700 dark:text-red-100"
  };
}

function AnimatedScore({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValueRef = useRef(0);

  useEffect(() => {
    const controls = animate(currentValueRef.current, value, {
      duration: 0.65,
      ease: "easeOut",
      onUpdate: (latest) => {
        currentValueRef.current = latest;
        setDisplayValue(latest);
      }
    });

    return () => {
      controls.stop();
    };
  }, [value]);

  return <span>{Math.round(displayValue)}</span>;
}

export function RiskAdvisorPanel() {
  const { tasks } = useProjectStore(
    useShallow((state) => ({
      tasks: state.tasks
    }))
  );
  const { bottlenecks, nearCriticalTasks, riskScore, recommendations } =
    useIntelligenceStore(
      useShallow((state) => ({
        bottlenecks: state.bottlenecks,
        nearCriticalTasks: state.nearCriticalTasks,
        riskScore: state.riskScore,
        recommendations: state.recommendations
      }))
    );

  const tone = useMemo(() => getRiskTone(riskScore.score), [riskScore.score]);
  const topBottlenecks = bottlenecks.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 160, damping: 18 }}
      className="surface-panel space-y-5 p-6"
    >
      <div className="space-y-1">
        <h2 className="heading-primary text-xl font-semibold">Risk Advisor</h2>
        <p className="text-secondary text-sm">
          Deterministic project intelligence from graph structure, float, and
          simulation variability.
        </p>
      </div>

      <motion.div
        layout
        className={`overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br ${tone.accent} p-5 dark:border-white/10`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
              Project Risk Score
            </p>
            <p className={`mt-2 font-mono text-5xl font-semibold ${tone.glow}`}>
              <AnimatedScore value={riskScore.score} />
            </p>
          </div>
          <Badge variant={riskScore.score > 70 ? "red" : riskScore.score > 30 ? "amber" : "green"}>
            {tone.label}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {riskScore.factors.map((factor) => (
            <div
              key={factor}
              className="rounded-2xl border border-white/40 bg-white/70 p-3 text-xs leading-5 text-slate-700 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-200"
            >
              {factor}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranchPlus className="h-4 w-4 text-amber-300" />
              Top Bottlenecks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBottlenecks.length > 0 ? (
              topBottlenecks.map((bottleneck) => {
                const task = tasks.find((item) => item.id === bottleneck.taskId);

                return (
                  <div
                    key={bottleneck.taskId}
                    className="surface-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="heading-primary text-sm font-medium">
                          {task?.label ?? bottleneck.taskId}
                        </p>
                        <p className="text-secondary mt-1 text-xs">
                          Impacts {bottleneck.downstreamImpact} downstream tasks
                        </p>
                      </div>
                      <Badge variant="amber">
                        {bottleneck.criticalityScore.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">
                Add tasks and dependencies to surface bottlenecks.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4 text-yellow-300" />
              Near-Critical Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {nearCriticalTasks.length > 0 ? (
                nearCriticalTasks.map((result) => {
                  const task = tasks.find((item) => item.id === result.taskId);

                  return (
                    <Badge key={result.taskId} variant="default" className="normal-case tracking-normal">
                      {task?.label ?? result.taskId}: {formatDurationDays(result.float)}
                    </Badge>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  No near-critical tasks detected under the current threshold.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-blue-300" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map((recommendation) => (
                <div
                  key={recommendation}
                  className="surface-card flex gap-3 p-4"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{recommendation}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Recommendations will appear once the schedule has enough data to analyze.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
