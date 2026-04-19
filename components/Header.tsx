"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Monitor, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light" as const, label: "Light theme", icon: SunMedium },
  { value: "dark" as const, label: "Dark theme", icon: Moon },
  { value: "system" as const, label: "System theme", icon: Monitor }
];

const navigationItems = [
  { href: "/", label: "Dashboard" },
  { href: "/how-it-works", label: "How It Works" }
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-[color:var(--header-bg)] backdrop-blur-md transition-all duration-150 ease-out",
        scrolled ? "border-transparent" : "border-[color:var(--header-border)]"
      )}
    >
      <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="whitespace-nowrap text-[15px] font-medium tracking-[-0.01em] text-[color:var(--text-primary)] transition-all duration-150 ease-out hover:opacity-80"
            >
              ChronoGraph
            </Link>
            <div className="hidden rounded-full border border-[color:var(--header-border)] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[color:var(--text-secondary)] sm:block">
              v2.0
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium tracking-[-0.01em] transition-all duration-150 ease-out hover:-translate-y-px",
                    isActive
                      ? "border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] text-[color:var(--accent-plain)]"
                      : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-[color:var(--header-border)] px-2.5 py-1 text-[11px] font-medium tracking-[-0.01em] text-[color:var(--text-secondary)] sm:flex">
            Ctrl K
          </div>

          <div className="flex items-center rounded-full border border-[color:var(--header-border)] bg-[color:var(--surface-elevated)] p-0.5">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = mounted && (theme ?? "system") === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150 ease-out active:scale-[0.97]",
                    isActive
                      ? "border border-[color:var(--header-border)] bg-[color:var(--surface)] text-[color:var(--text-primary)]"
                      : "text-[color:var(--text-secondary)] hover:-translate-y-px hover:text-[color:var(--text-primary)]"
                  )}
                  aria-label={option.label}
                  aria-pressed={isActive}
                  onClick={() => setTheme(option.value)}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
