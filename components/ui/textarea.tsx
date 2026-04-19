"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[120px] w-full rounded-xl border border-slate-200/80 bg-white/88 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 transition focus:border-blue-400/50 focus:shadow-[0_0_0_4px_rgba(96,165,250,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-100",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
