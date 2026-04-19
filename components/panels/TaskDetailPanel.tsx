"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDAG } from "@/hooks/useDAG";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { removeTaskAndDependencies } from "@/lib/storage/tasks";
import { formatDurationDays } from "@/lib/utils/date";
import type { Task } from "@/lib/types";
import { useGraphStore } from "@/store/graphStore";
import { useProjectStore } from "@/store/projectStore";

export function TaskDetailPanel() {
  const { dag } = useDAG();
  const { persistTask } = useIndexedDB();
  const { project, selectedTaskId, tasks, cpmResults, upsertTask, selectTask, setFocusTask } =
    useProjectStore(
      useShallow((state) => ({
        project: state.project,
        selectedTaskId: state.selectedTaskId,
        tasks: state.tasks,
        cpmResults: state.cpmResults,
        upsertTask: state.upsertTask,
        selectTask: state.selectTask,
        setFocusTask: state.setFocusTask
      }))
    );
  const setWhatIfDelay = useGraphStore((state) => state.setWhatIfDelay);
  const [draft, setDraft] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const task = tasks.find((item) => item.id === selectedTaskId) ?? null;
  const cpm = cpmResults.find((item) => item.taskId === selectedTaskId) ?? null;
  const predecessors = useMemo(
    () =>
      task
        ? dag.getPredecessors(task.id).map((taskId) => tasks.find((item) => item.id === taskId))
        : [],
    [dag, task, tasks]
  );
  const successors = useMemo(
    () =>
      task
        ? dag.getSuccessors(task.id).map((taskId) => tasks.find((item) => item.id === taskId))
        : [],
    [dag, task, tasks]
  );

  useEffect(() => {
    setDraft(task);
  }, [task]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const timer = window.setTimeout(() => {
      void persistTask(draft);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, persistTask]);

  if (!task || !draft || !cpm) {
    return (
      <div className="surface-panel p-6 text-sm text-slate-600 dark:text-slate-400">
        Select a task node to inspect and edit its schedule details.
      </div>
    );
  }

  const applyDraft = (nextTask: Task) => {
    setDraft(nextTask);
    upsertTask(nextTask);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 160, damping: 18 }}
      className="surface-panel space-y-5 p-6"
    >
      <div className="space-y-1">
        <h2 className="heading-primary text-xl font-semibold">{task.label}</h2>
        <p className="text-secondary text-sm">Edit task metadata and inspect live CPM values.</p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="task-label">Label</Label>
          <Input
            id="task-label"
            value={draft.label}
            onChange={(event) =>
              applyDraft({
                ...draft,
                label: event.target.value
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            value={draft.description}
            onChange={(event) =>
              applyDraft({
                ...draft,
                description: event.target.value
              })
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="task-duration">Estimated Days</Label>
            <Input
              id="task-duration"
              type="number"
              min={1}
              value={draft.estimatedDays}
              onChange={(event) =>
                applyDraft({
                  ...draft,
                  estimatedDays: Math.max(1, Number(event.target.value))
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-variance">Variance %</Label>
            <Input
              id="task-variance"
              type="number"
              min={0}
              max={100}
              value={draft.variancePercent}
              onChange={(event) =>
                applyDraft({
                  ...draft,
                  variancePercent: Math.min(100, Math.max(0, Number(event.target.value)))
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={draft.status}
              onValueChange={(value) =>
                applyDraft({
                  ...draft,
                  status: value as Task["status"]
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-color">Color Override</Label>
            <Input
              id="task-color"
              type="color"
              className="h-11 px-2"
              value={draft.color ?? "#64748b"}
              onChange={(event) =>
                applyDraft({
                  ...draft,
                  color: event.target.value
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="surface-card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="heading-primary text-sm font-medium">Freeze for What-If</p>
            <p className="text-secondary text-xs">Persist a delay preset for scenario analysis.</p>
          </div>
          <Switch
            checked={draft.isFrozen}
            onCheckedChange={(checked) => {
              const nextTask = {
                ...draft,
                isFrozen: checked,
                frozenDelayDays: checked ? Math.max(1, draft.frozenDelayDays || 1) : 0
              };
              applyDraft(nextTask);
              setWhatIfDelay(task.id, checked ? nextTask.frozenDelayDays : 0);
            }}
          />
        </div>
        <Input
          type="number"
          min={0}
          max={30}
          value={draft.frozenDelayDays}
          disabled={!draft.isFrozen}
          onChange={(event) => {
            const nextDelay = Math.min(30, Math.max(0, Number(event.target.value)));
            applyDraft({
              ...draft,
              frozenDelayDays: nextDelay,
              isFrozen: nextDelay > 0
            });
            setWhatIfDelay(task.id, nextDelay);
          }}
        />
      </div>

      <div className="surface-card grid gap-3 p-4 md:grid-cols-2">
        <div className="text-tertiary space-y-2 text-sm">
          <p>ES: {formatDurationDays(cpm.earliestStart)}</p>
          <p>EF: {formatDurationDays(cpm.earliestFinish)}</p>
          <p>LS: {formatDurationDays(cpm.latestStart)}</p>
        </div>
        <div className="text-tertiary space-y-2 text-sm">
          <p>LF: {formatDurationDays(cpm.latestFinish)}</p>
          <p>Float: {formatDurationDays(cpm.float)}</p>
          <p>Critical: {cpm.isCritical ? "Yes" : "No"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <p className="heading-primary text-sm font-medium">Predecessors</p>
          <div className="space-y-2">
            {predecessors.length > 0 ? (
              predecessors.map((item) =>
                item ? (
                  <button
                    key={item.id}
                    type="button"
                    className="surface-card w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-white dark:text-slate-200 dark:hover:bg-white/8"
                    onClick={() => {
                      setFocusTask(item.id);
                      selectTask(item.id);
                    }}
                  >
                    {item.label}
                  </button>
                ) : null
              )
            ) : (
              <p className="text-sm text-slate-500">No predecessors.</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="heading-primary text-sm font-medium">Successors</p>
          <div className="space-y-2">
            {successors.length > 0 ? (
              successors.map((item) =>
                item ? (
                  <button
                    key={item.id}
                    type="button"
                    className="surface-card w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-white dark:text-slate-200 dark:hover:bg-white/8"
                    onClick={() => {
                      setFocusTask(item.id);
                      selectTask(item.id);
                    }}
                  >
                    {item.label}
                  </button>
                ) : null
              )
            ) : (
              <p className="text-sm text-slate-500">No successors.</p>
            )}
          </div>
        </div>
      </div>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete Task
      </Button>

      <AnimatePresence>
        {confirmDelete ? (
          <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete task?</DialogTitle>
                <DialogDescription>
                  This removes the task and every dependency connected to it from{" "}
                  {project?.name}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!project) {
                      return;
                    }

                    await removeTaskAndDependencies(task.id, project.id);
                    useProjectStore.getState().removeTask(task.id);
                    setConfirmDelete(false);
                    selectTask(null);
                  }}
                >
                  Delete Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
