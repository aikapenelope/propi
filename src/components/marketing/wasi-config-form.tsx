"use client";

import { useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { upsertSocialAccount } from "@/server/actions/social-accounts";

interface WasiConfigFormProps {
  existing?: {
    idCompany: string;
    wasiToken: string;
  };
}

export function WasiConfigForm({ existing }: WasiConfigFormProps) {
  const [idCompany, setIdCompany] = useState(existing?.idCompany || "");
  const [wasiToken, setWasiToken] = useState(existing?.wasiToken || "");
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!idCompany.trim() || !wasiToken.trim()) return;

    setIsLoading(true);
    setError(null);
    setSaved(false);

    try {
      await upsertSocialAccount({
        platform: "wasi",
        platformAccountId: idCompany.trim(),
        accessToken: wasiToken.trim(),
        accountName: `Wasi ${idCompany.trim()}`,
        metadata: { wasiToken: wasiToken.trim() },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          ID Company
        </label>
        <input
          type="text"
          value={idCompany}
          onChange={(e) => setIdCompany(e.target.value)}
          placeholder="Tu id_company de Wasi"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Wasi Token
        </label>
        <input
          type="password"
          value={wasiToken}
          onChange={(e) => setWasiToken(e.target.value)}
          placeholder="Tu wasi_token"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isLoading || !idCompany.trim() || !wasiToken.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Guardado" : "Guardar"}
        </button>
        {error && (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Obtiene tus credenciales en el dashboard de Wasi: api.wasi.co
      </p>
    </form>
  );
}
