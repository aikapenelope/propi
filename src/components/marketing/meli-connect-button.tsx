"use client";

import { ShoppingBag } from "lucide-react";

export function MeliConnectButton({
  authBaseUrl,
  isConnected,
}: {
  authBaseUrl: string | null;
  isConnected: boolean;
}) {
  if (!authBaseUrl) {
    return (
      <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        Configura <code className="text-xs font-mono">ML_APP_ID</code> y{" "}
        <code className="text-xs font-mono">ML_SECRET_KEY</code> en las
        variables de entorno para habilitar la conexion con MercadoLibre.
      </div>
    );
  }

  function handleConnect() {
    const state = Math.random().toString(36).substring(2, 15);
    window.location.href = `${authBaseUrl}&state=${state}`;
  }

  return (
    <button
      onClick={handleConnect}
      className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 transition-colors"
    >
      <ShoppingBag className="h-4 w-4" />
      {isConnected ? "Reconectar MercadoLibre" : "Conectar MercadoLibre"}
    </button>
  );
}
