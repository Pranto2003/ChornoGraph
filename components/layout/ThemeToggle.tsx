"use client";

import { Monitor, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    {
      value: "system" as const,
      label: "System theme",
      icon: Monitor
    },
    {
      value: "dark" as const,
      label: "Dark theme",
      icon: Moon
    },
    {
      value: "light" as const,
      label: "Light theme",
      icon: SunMedium
    }
  ];

  if (!mounted) {
    return (
      <div className="flex items-center rounded-2xl border border-slate-200/80 bg-white/88 p-1 shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/6 dark:shadow-glass">
        <Button size="icon" variant="ghost" aria-label="Theme loading" disabled>
          <Monitor className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center rounded-2xl border border-slate-200/80 bg-white/88 p-1 shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/6 dark:shadow-glass"
      role="group"
      aria-label={`Theme mode selector. Active mode: ${theme ?? resolvedTheme ?? "system"}`}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <Button
            key={option.value}
            size="icon"
            variant={isActive ? "primary" : "ghost"}
            className={cn(
              "h-8 w-8 rounded-xl",
              !isActive && "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
            aria-label={option.label}
            aria-pressed={isActive}
            title={
              option.value === "system"
                ? `System theme (${resolvedTheme ?? "unknown"} active)`
                : option.label
            }
            onClick={() => setTheme(option.value)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
