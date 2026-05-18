"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Global error boundary for all (app) routes.
 * Shows a friendly message instead of crashing the whole app.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">
        Algo salio mal
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Hubo un error al cargar esta pagina. Puedes intentar de nuevo o volver
        al inicio.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Intentar de nuevo
        </button>
        <a
          href="/dashboard"
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Ir al inicio
        </a>
      </div>
      {error.digest && (
        <p className="mt-4 text-[10px] text-muted-foreground font-mono">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
