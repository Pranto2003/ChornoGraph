"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = ({
  className,
  ...props
}: TabsPrimitive.TabsListProps) => (
  <TabsPrimitive.List
    className={cn(
      "inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-1 dark:border-white/10 dark:bg-white/6",
      className
    )}
    {...props}
  />
);

const TabsTrigger = ({
  className,
  ...props
}: TabsPrimitive.TabsTriggerProps) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm text-slate-600 transition data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 dark:text-slate-400 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white",
      className
    )}
    {...props}
  />
);

const TabsContent = ({
  className,
  ...props
}: TabsPrimitive.TabsContentProps) => (
  <TabsPrimitive.Content className={cn("mt-4 outline-none", className)} {...props} />
);

export { Tabs, TabsContent, TabsList, TabsTrigger };
