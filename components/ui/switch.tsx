"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = ({
  className,
  ...props
}: SwitchPrimitive.SwitchProps) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-slate-200/80 bg-slate-200/80 transition-colors data-[state=checked]:bg-blue-500/50 dark:border-white/10 dark:bg-white/10",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[1.3rem] dark:bg-white" />
  </SwitchPrimitive.Root>
);

export { Switch };
