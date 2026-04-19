"use client";

import { Download, Eye, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

interface ImportDropZoneProps {
  dragging: boolean;
  onChooseFile: () => void;
  onDownloadTemplate: () => void;
  onPreviewFormat: () => void;
}

export function ImportDropZone({
  dragging,
  onChooseFile,
  onDownloadTemplate,
  onPreviewFormat
}: ImportDropZoneProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-[1.5px] p-6 transition-all duration-150 ease-out",
        dragging
          ? "border-solid border-[color:var(--accent-plain)] bg-[color:var(--accent-soft)]"
          : "border-dashed border-[color:var(--accent-border)] bg-[color:var(--surface)]"
      )}
    >
      <div className="flex h-full flex-col gap-6">
        <div>
          <span className="inline-flex items-center rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.07em] text-[color:var(--accent-plain)]">
            Offline Ready
          </span>
          <h2 className="mt-5 text-[18px] font-medium tracking-[-0.01em] text-[color:var(--text-primary)]">
            Drop a `.chronograph.json` file here
          </h2>
          <p className="mt-3 text-[13px] leading-[1.65] text-[color:var(--text-secondary)]">
            Import project metadata, tasks, dependencies, and the latest simulation
            result with schema validation and UUID reassignment.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="premium-button-ghost inline-flex items-center justify-center gap-2"
            onClick={onDownloadTemplate}
          >
            <Download className="h-4 w-4" />
            Download Template
          </button>
          <button
            type="button"
            className="premium-button-ghost inline-flex items-center justify-center gap-2"
            onClick={onPreviewFormat}
          >
            <Eye className="h-4 w-4" />
            Preview Format
          </button>
          <button
            type="button"
            className="premium-button-ghost inline-flex items-center justify-center gap-2"
            onClick={onChooseFile}
          >
            <Upload className="h-4 w-4" />
            Choose Import File
          </button>
        </div>
      </div>
    </div>
  );
}
