"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

import { ServiceWorkerRegistrar } from "@/components/layout/ServiceWorkerRegistrar";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <Toaster
      closeButton
      theme={isLight ? "light" : "dark"}
      position="bottom-right"
      toastOptions={{
        className: isLight
          ? "border border-slate-200/80 bg-white/92 text-slate-900 backdrop-blur-xl"
          : "border border-white/10 bg-[#0d1322]/90 text-slate-100 backdrop-blur-xl"
      }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
    >
      <ServiceWorkerRegistrar />
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
