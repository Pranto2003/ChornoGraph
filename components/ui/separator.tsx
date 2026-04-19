"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = ({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.SeparatorProps) => (
  <SeparatorPrimitive.Root
    orientation={orientation}
    className={cn(
      "shrink-0 bg-slate-200/80 dark:bg-white/8",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
    {...props}
  />
);

export { Separator };
