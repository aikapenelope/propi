"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

/**
 * Custom PWA install prompt banner.
 * Intercepts the browser's beforeinstallprompt event and shows a branded
 * banner inside the app instead of the generic browser prompt.
 *
 * Only shows on mobile devices that haven't installed the PWA yet.
 * Dismisses permanently after the user closes it (stored in localStorage).
 */
export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem("pwa-install-dismissed")) return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deferredPrompt as any).prompt();
    setShow(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShow(false);
    setDeferredPrompt(null);
    localStorage.setItem("pwa-install-dismissed", "1");
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-2xl border border-border bg-background p-4 shadow-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0A2B1D] flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-[#E3E1DC]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Instala Propi</p>
          <p className="text-xs text-muted-foreground">
            Acceso rapido desde tu pantalla de inicio
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
