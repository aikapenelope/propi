"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Check, AlertCircle } from "lucide-react";
import { publishPropertyToWasi } from "@/server/actions/wasi-publish";

interface PublishWasiButtonProps {
  propertyId: string;
  wasiId?: string;
}

export function PublishWasiButton({
  propertyId,
  wasiId,
}: PublishWasiButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(wasiId || null);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await publishPropertyToWasi(propertyId);
      setResult(String(res.wasiPropertyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setIsLoading(false);
    }
  }

  if (result) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs font-medium text-green-400">
        <Check className="h-3.5 w-3.5" />
        Wasi #{result}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handlePublish}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ExternalLink className="h-3.5 w-3.5" />
        )}
        {isLoading ? "Publicando..." : "Publicar en Wasi"}
      </button>
      {error && (
        <span className="flex items-center gap-1 text-[10px] text-red-400">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
    </div>
  );
}
