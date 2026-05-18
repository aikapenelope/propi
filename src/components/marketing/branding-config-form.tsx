"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, Check, Upload } from "lucide-react";
import { updateUserSettings } from "@/server/actions/user-settings";
import { useRouter } from "next/navigation";

interface BrandingConfigFormProps {
  existing: {
    companyName: string | null;
    companyLogoKey: string | null;
  };
}

export function BrandingConfigForm({ existing }: BrandingConfigFormProps) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(existing.companyName || "");
  const [logoKey, setLogoKey] = useState(existing.companyLogoKey || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateUserSettings({
        companyName: companyName.trim() || undefined,
        companyLogoKey: logoKey || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: only images, max 2MB
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;

    setUploading(true);
    try {
      // Get upload key from the server
      const keyBase = `logos/${Date.now()}-${file.name}`;

      // We need the userId prefix — get it from the existing upload pattern
      // For simplicity, upload via the existing /api/upload endpoint
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", keyBase);
      formData.append("bucket", "media");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogoKey(data.key);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Nombre de la empresa / inmobiliaria
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Ej: Inmobiliaria Rodriguez & Asociados"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Aparece en la portada de reportes y fichas PDF
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Logo de la empresa (opcional)
        </label>
        <div className="flex items-center gap-3">
          {logoKey && (
            <img
              src={`/api/images/${logoKey}`}
              alt="Logo"
              className="h-10 w-10 rounded-lg object-contain border border-border"
            />
          )}
          <label className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {logoKey ? "Cambiar logo" : "Subir logo"}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          PNG o JPG, max 2MB. Se muestra en reportes y fichas PDF.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saved ? "Guardado" : "Guardar"}
      </button>
    </div>
  );
}
