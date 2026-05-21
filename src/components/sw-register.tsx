"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * Only runs in production (SW is a static file in /public).
 *
 * The update-check interval is stored and cleaned up in the effect's return
 * function so it is cancelled if the component ever unmounts.  In practice
 * this component lives in the root layout and is never unmounted, but
 * correctly cleaning up effects is required by React's rules and prevents
 * interval accumulation if hot-reload forces a remount during development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Poll for SW updates every hour.  Storing the interval ID allows
        // it to be cancelled in the cleanup function below.
        intervalId = setInterval(() => reg.update(), 60 * 60 * 1000);
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });

    return () => {
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, []);

  return null;
}
