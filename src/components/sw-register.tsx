"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * Only runs in production (SW is a static file in /public).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for updates every 60 minutes
          setInterval(() => reg.update(), 60 * 60 * 1000);
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
