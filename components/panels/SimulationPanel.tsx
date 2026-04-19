"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Activity, RefreshCcw, TriangleAlert } from "lucide-react";
import { useTheme } from "next-themes";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { describeSimulationDateWindow, formatDurationDays } from "@/lib/utils/date";
import { useSimulation } from "@/hooks/useSimulation";
import { useGraphStore } from "@/store/graphStore";
import { useProjectStore } from "@/store/projectStore";
import { useSimulationStore } from "@/store/simulationStore";

const iterationOptions = [1000, 5000, 10000];

export function SimulationPanel() {
  const { resolvedTheme } = useTheme();
  const { project } = useProjectStore(
    useShallow((state) => ({
      project: state.project
    }))
  );
  const { whatIfOverrides } = useGraphStore(
    useShallow((state) => ({
      whatIfOverrides: state.whatIfOverrides
    }))
  );
  const {
    status,
    progress,
    iterations,
    result,
    baselineResult,
    comparisonResult,
    error,
    setIterations
  } = useSimulationStore(
    useShallow((state) => ({
      status: state.status,
      progress: state.progress,
      iterations: state.iterations,
      result: state.result,
      baselineResult: state.baselineResult,
      comparisonResult: state.comparisonResult,
      error: state.error,
      setIterations: state.setIterations
    }))
  );
  const { runSimulation } = useSimulation();
  const isLight = resolvedTheme === "light";

  const chartData = baselineResult?.histogram.map((bin, index) => ({
    bin: bin.bin,
    baseline: bin.count,
    comparison: comparisonResult?.histogram[index]?.count ?? 0
  }));

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 160, damping: 18 }}
      className="surface-panel space-y-5 p-6"
    >
      <div className="space-y-1">
        <h2 className="heading-primary text-xl font-semibold">Monte Carlo Simulation</h2>
        <p className="text-secondary text-sm">
          Stress-test the schedule with Gaussian task-duration sampling.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {iterationOptions.map((option) => (
          <Button
            key={option}
            variant={iterations === option ? "primary" : "ghost"}
            onClick={() => setIterations(option)}
          >
            {option.toLocaleString()}
          </Button>
        ))}
      </div>

      {status === "running" ? (
        <div className="surface-card space-y-3 p-4">
          <div className="text-tertiary flex items-center justify-between text-sm">
            <span>Simulation progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      ) : null}

      {error ? (
        <div className="space-y-4 rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-red-700 dark:border-red-400/20 dark:text-red-100">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TriangleAlert className="h-4 w-4" />
            Worker failure
          </div>
          <p className="text-sm text-red-700/90 dark:text-red-100/90">{error}</p>
          <Button
            variant="destructive"
            onClick={() => runSimulation("baseline", Object.keys(whatIfOverrides).length > 0 ? whatIfOverrides : undefined)}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "P50", value: result.p50, accent: "text-blue-600 dark:text-blue-300" },
              { label: "P75", value: result.p75, accent: "text-violet-600 dark:text-violet-300" },
              { label: "P90", value: result.p90, accent: "text-red-600 dark:text-red-300" }
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <CardTitle className="text-secondary text-sm">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`font-mono text-2xl ${item.accent}`}>
                    {formatDurationDays(item.value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="surface-card rounded-[24px] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="heading-primary text-sm font-medium">Distribution</p>
                <p className="text-secondary text-xs">
                  Mean {formatDurationDays(result.mean)} ± {formatDurationDays(result.stdDev)}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  runSimulation(
                    "baseline",
                    Object.keys(whatIfOverrides).length > 0 ? whatIfOverrides : undefined
                  )
                }
              >
                <RefreshCcw className="h-4 w-4" />
                Rerun
              </Button>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData ?? result.histogram} barCategoryGap={4}>
                  <CartesianGrid
                    stroke={isLight ? "rgba(148,163,184,0.22)" : "rgba(148,163,184,0.14)"}
                    vertical={false}
                  />
                  <XAxis dataKey="bin" stroke={isLight ? "#64748B" : "#94A3B8"} />
                  <YAxis stroke={isLight ? "#64748B" : "#94A3B8"} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: isLight
                        ? "1px solid rgba(148,163,184,0.28)"
                        : "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: isLight
                        ? "rgba(255,255,255,0.96)"
                        : "rgba(13,19,34,0.95)",
                      color: isLight ? "#0F172A" : "#E2E8F0"
                    }}
                  />
                  <Legend />
                  <ReferenceLine x={result.p50} stroke="#60A5FA" strokeDasharray="4 4" />
                  <ReferenceLine x={result.p75} stroke="#A78BFA" strokeDasharray="4 4" />
                  <ReferenceLine x={result.p90} stroke="#F87171" strokeDasharray="4 4" />
                  {chartData ? (
                    <>
                      <Bar dataKey="baseline" fill="#60A5FA" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="comparison" fill="#F87171" fillOpacity={0.55} radius={[8, 8, 0, 0]} />
                    </>
                  ) : (
                    <Bar dataKey="count" fill="#60A5FA" radius={[8, 8, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card p-4 text-sm">
            <div className="heading-primary mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Forecast interpretation
            </div>
            <p className="text-tertiary">
              There is a 90% chance this project completes within{" "}
              {describeSimulationDateWindow(result, Date.now(), "p90")} based on the
              current dependency graph.
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/60 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/2 dark:text-slate-400">
          Select an iteration count and run the simulation to generate P50, P75, and
          P90 delivery forecasts.
        </div>
      )}
    </motion.div>
  );
}
