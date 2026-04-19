import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
  {
    variants: {
      variant: {
        default: "border-slate-200/80 bg-white/80 text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200",
        amber: "border-amber-300/50 bg-amber-400/16 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/16 dark:text-amber-100",
        blue: "border-blue-300/50 bg-blue-500/14 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/16 dark:text-blue-100",
        red: "border-red-300/50 bg-red-500/14 text-red-700 dark:border-red-400/30 dark:bg-red-500/16 dark:text-red-100",
        green: "border-emerald-300/50 bg-emerald-500/14 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/16 dark:text-emerald-100"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
