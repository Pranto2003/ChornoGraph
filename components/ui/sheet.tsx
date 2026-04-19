"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetContent = ({
  className,
  children,
  side = "right",
  ...props
}: DialogPrimitive.DialogContentProps & { side?: "right" | "left" }) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-sm dark:bg-slate-950/70" />
    <DialogPrimitive.Content
      className={cn(
        "fixed top-0 z-50 h-full w-[min(92vw,420px)] border-slate-200/80 bg-white/96 p-6 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d1322]/98",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full border border-slate-200/80 p-2 text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export { Sheet, SheetClose, SheetContent, SheetTrigger };
