"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200/80 text-sm font-medium text-slate-900 transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] dark:border-white/10 dark:text-white",
  {
    variants: {
      variant: {
        default:
          "bg-white/85 shadow-glass hover:border-slate-300 hover:bg-white dark:bg-white/8 dark:hover:border-white/20 dark:hover:bg-white/12",
        primary:
          "border-blue-300/50 bg-blue-500/14 text-blue-700 hover:bg-blue-500/22 dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-50 dark:hover:bg-blue-500/30",
        amber:
          "border-amber-300/50 bg-amber-400/16 text-amber-800 hover:bg-amber-400/24 dark:border-amber-400/30 dark:bg-amber-500/16 dark:text-amber-50 dark:hover:bg-amber-500/24",
        ghost:
          "border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white/80 dark:text-slate-200 dark:hover:border-white/10 dark:hover:bg-white/6",
        destructive:
          "border-red-300/50 bg-red-500/14 text-red-700 hover:bg-red-500/22 dark:border-red-400/30 dark:bg-red-500/20 dark:text-red-50 dark:hover:bg-red-500/30"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
