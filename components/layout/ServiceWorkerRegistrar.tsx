"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const clearChronographCaches = async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith("chronograph-cache"))
          .map((key) => caches.delete(key))
      );
    };

    if (process.env.NODE_ENV !== "production") {
      void (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();

        if (registrations.length === 0) {
          return;
        }

        await Promise.all(registrations.map((registration) => registration.unregister()));
        await clearChronographCaches();

        if (
          navigator.serviceWorker.controller &&
          !window.sessionStorage.getItem("chronograph-sw-reset")
        ) {
          window.sessionStorage.setItem("chronograph-sw-reset", "1");
          window.location.reload();
        }
      })();

      return;
    }

    void (async () => {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await registration.update();
    })();
  }, []);

  return null;
}
