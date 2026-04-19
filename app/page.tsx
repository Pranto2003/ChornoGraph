"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FolderPlus, Import, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { ImportDropZone } from "@/components/ImportDropZone";
import {
  ProjectCard,
  type ProjectCardMeta,
  type ProjectHealthStatus
} from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTasksForProject, saveDependency, saveProject, saveSimulation, saveTask } from "@/lib/storage/db";
import { listProjectSummaries, removeProject } from "@/lib/storage/projects";
import type { Project, ProjectBundle, ProjectSummary, Task } from "@/lib/types";
import { downloadProjectTemplate, getProjectTemplateJson, readImportFile } from "@/lib/utils/export";
import { createSampleProjectBundle } from "@/lib/utils/sample-data";
import { SearchTrie } from "@/lib/utils/trie";

interface DashboardMetaMap {
  [projectId: string]: ProjectCardMeta;
}

const initialProjectForm = {
  name: "",
  description: "",
  color: "#60A5FA",
  defaultVariancePercent: 15
};

async function persistBundle(bundle: ProjectBundle) {
  await saveProject(bundle.project);
  await Promise.all(bundle.tasks.map((task) => saveTask(task)));
  await Promise.all(bundle.dependencies.map((dependency) => saveDependency(dependency)));

  if (bundle.simulation) {
    await saveSimulation(bundle.simulation);
  }
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return "now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 5) {
    return `${weeks}w ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.floor(days / 365)}y ago`;
}

function deriveProjectStatus(summary: ProjectSummary, tasks: Task[]): ProjectHealthStatus {
  const blockedTasks = tasks.filter((task) => task.status === "blocked").length;
  const completedTasks = tasks.filter((task) => task.status === "complete").length;
  const completionPercent =
    tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  const scheduleVariance =
    summary.p50 && summary.criticalPathLength > 0
      ? summary.p50 / summary.criticalPathLength
      : 1;

  if (summary.isolatedTaskIds.length > 0 || blockedTasks > 0) {
    return "CRITICAL";
  }

  if (completionPercent < 35 || scheduleVariance > 1.15) {
    return "AT_RISK";
  }

  return "ON_TRACK";
}

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [projectMeta, setProjectMeta] = useState<DashboardMetaMap>({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [search, setSearch] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const deferredSearch = useDeferredValue(search);
  const templatePreview = useMemo(() => getProjectTemplateJson(), []);

  const refreshProjects = async () => {
    setLoadingProjects(true);
    const nextSummaries = await listProjectSummaries();
    const metaEntries = await Promise.all(
      nextSummaries.map(async (summary) => {
        const tasks = await getTasksForProject(summary.project.id);
        const completedTasks = tasks.filter((task) => task.status === "complete").length;
        const completionPercent =
          tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        return [
          summary.project.id,
          {
            completionPercent,
            status: deriveProjectStatus(summary, tasks),
            updatedLabel: formatRelativeTime(summary.updatedAt)
          }
        ] as const;
      })
    );

    setSummaries(nextSummaries);
    setProjectMeta(Object.fromEntries(metaEntries));
    setLoadingProjects(false);
  };

  useEffect(() => {
    void refreshProjects();
  }, []);

  const filteredSummaries = useMemo(() => {
    if (!deferredSearch.trim()) {
      return summaries;
    }

    const trie = SearchTrie.fromTerms(summaries.map((summary) => summary.project.name));
    const matches = trie.search(deferredSearch.trim());
    return matches.map((index) => summaries[index]).filter(Boolean);
  }, [deferredSearch, summaries]);

  const createProject = async () => {
    const timestamp = Date.now();
    const project: Project = {
      id: crypto.randomUUID(),
      name: projectForm.name.trim(),
      description: projectForm.description.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
      color: projectForm.color,
      defaultVariancePercent: projectForm.defaultVariancePercent
    };

    await saveProject(project);
    await refreshProjects();
    setNewProjectOpen(false);
    setProjectForm(initialProjectForm);
    router.push(`/project/${project.id}`);
  };

  const handleImport = async (file: File) => {
    try {
      const bundle = await readImportFile(file);
      await persistBundle(bundle);
      await refreshProjects();
      toast.success(
        `Imported ${bundle.tasks.length} tasks and ${bundle.dependencies.length} dependencies.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    }
  };

  const loadExampleProject = async () => {
    const bundle = createSampleProjectBundle();
    await persistBundle(bundle);
    await refreshProjects();
    router.push(`/project/${bundle.project.id}`);
  };

  const showEmptyState = !loadingProjects && summaries.length === 0;
  const showNoResults =
    !loadingProjects && summaries.length > 0 && filteredSummaries.length === 0;

  return (
    <main
      className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files.item(0);

        if (file) {
          void handleImport(file);
        }
      }}
    >
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="premium-panel"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <h1 className="ui-display text-[color:var(--text-primary)]">
                  Local-first schedule{" "}
                  <span className="text-accent dark:text-accent-dark">intelligence</span>
                </h1>
                <p className="ui-body mt-3">
                  Model project dependencies as a DAG, compute the critical path in
                  real time, and forecast delivery risk without leaving the browser.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="premium-button-primary inline-flex items-center gap-2"
                  onClick={() => setNewProjectOpen(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                  New Project
                </button>
                <button
                  type="button"
                  className="premium-button-ghost inline-flex items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Import className="h-4 w-4" />
                  Import Project
                </button>
              </div>
            </div>

            <div className="group flex h-10 items-center gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[color:var(--accent-plain)]">
              <Search className="h-4 w-4 text-[color:var(--text-secondary)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects with trie-backed instant filtering"
                className="h-full flex-1 bg-transparent text-[14px] text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-secondary)]"
              />
              <span className="rounded-full border border-[color:var(--border-soft)] px-2 py-1 font-mono text-[12px] text-[color:var(--text-secondary)]">
                Ctrl K
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04, ease: "easeOut" }}
        >
          <ImportDropZone
            dragging={dragging}
            onChooseFile={() => fileInputRef.current?.click()}
            onDownloadTemplate={() => downloadProjectTemplate()}
            onPreviewFormat={() => setShowTemplatePreview(true)}
          />
        </motion.div>
      </section>

      {loadingProjects ? (
        <section className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04, ease: "easeOut" }}
              className="premium-card h-[176px] animate-pulse"
            />
          ))}
        </section>
      ) : null}

      {showEmptyState ? (
        <EmptyState
          onCreate={() => setNewProjectOpen(true)}
          onExample={() => void loadExampleProject()}
        />
      ) : null}

      {!loadingProjects && filteredSummaries.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {filteredSummaries.map((summary, index) => (
            <ProjectCard
              key={summary.project.id}
              summary={summary}
              meta={
                projectMeta[summary.project.id] ?? {
                  completionPercent: 0,
                  status: "AT_RISK",
                  updatedLabel: "recently"
                }
              }
              index={index}
              onOpen={() => router.push(`/project/${summary.project.id}`)}
              onDelete={() => setDeleteTarget(summary)}
            />
          ))}
        </section>
      ) : null}

      {showNoResults ? (
        <div className="premium-panel flex min-h-[220px] items-center justify-center text-center">
          <div>
            <p className="ui-heading text-[color:var(--text-primary)]">No matching projects</p>
            <p className="ui-body mt-3">
              Try another search term or import a `.chronograph.json` file.
            </p>
          </div>
        </div>
      ) : null}

      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Start a new local-first schedule model. Data will persist in IndexedDB.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                value={projectForm.name}
                onChange={(event) =>
                  setProjectForm((state) => ({ ...state, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm((state) => ({
                    ...state,
                    description: event.target.value
                  }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-color">Accent Color</Label>
                <Input
                  id="project-color"
                  type="color"
                  className="h-11 px-2"
                  value={projectForm.color}
                  onChange={(event) =>
                    setProjectForm((state) => ({ ...state, color: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-variance">Default Variance %</Label>
                <Input
                  id="project-variance"
                  type="number"
                  min={0}
                  max={50}
                  value={projectForm.defaultVariancePercent}
                  onChange={(event) =>
                    setProjectForm((state) => ({
                      ...state,
                      defaultVariancePercent: Math.min(
                        50,
                        Math.max(0, Number(event.target.value))
                      )
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewProjectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!projectForm.name.trim()}
              onClick={() => void createProject()}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This removes the project, tasks, dependencies, and cached simulation
              result from IndexedDB.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) {
                  return;
                }

                await removeProject(deleteTarget.project.id);
                setDeleteTarget(null);
                await refreshProjects();
              }}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Expected `.chronograph.json` format</DialogTitle>
            <DialogDescription>
              Use this as the editable template for imports. Keep the top-level
              `project`, `tasks`, and `dependencies` keys, and remove `simulation`
              only if you do not want to import cached forecast data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="premium-card">
              <p className="ui-body">
                ChronoGraph validates the file, then reassigns project, task, and
                dependency IDs on import so edited templates never collide with
                existing local projects.
              </p>
            </div>
            <pre className="max-h-[440px] overflow-auto rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 font-mono text-[12px] leading-6 text-[color:var(--text-secondary)]">
              {templatePreview}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTemplatePreview(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => downloadProjectTemplate()}>
              Download Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.chronograph.json,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.item(0);

          if (file) {
            void handleImport(file);
          }

          event.target.value = "";
        }}
      />
    </main>
  );
}
