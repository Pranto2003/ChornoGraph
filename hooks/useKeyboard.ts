"use client";

import { useEffect } from "react";

interface KeyboardHandlers {
  onAddTask?: () => void;
  onRunSimulation?: () => void;
  onToggleWhatIf?: () => void;
  onZoomFit?: () => void;
}

export function useKeyboard(handlers: KeyboardHandlers): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        handlers.onAddTask?.();
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        handlers.onRunSimulation?.();
      }

      if (event.shiftKey && event.key.toLowerCase() === "w") {
        event.preventDefault();
        handlers.onToggleWhatIf?.();
      }

      if (event.key === "0") {
        handlers.onZoomFit?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlers]);
}
