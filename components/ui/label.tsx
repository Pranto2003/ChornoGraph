"use client";

import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

const Label = ({
  className,
  ...props
}: LabelPrimitive.LabelProps) => (
  <LabelPrimitive.Root
    className={cn("text-sm font-medium text-slate-700 dark:text-slate-300", className)}
    {...props}
  />
);

export { Label };
