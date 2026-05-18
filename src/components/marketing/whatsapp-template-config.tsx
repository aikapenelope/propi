"use client";

import { useState } from "react";
import {
  getTemplate,
  saveTemplate,
  resetTemplate,
  DEFAULT_TEMPLATE,
} from "@/lib/whatsapp-template";

/**
 * WhatsApp appointment template editor for the settings page.
 * Template is stored in localStorage (client-side, no DB).
 */
export function WhatsAppTemplateConfig() {
  const [template, setTemplate] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_TEMPLATE;
    return getTemplate();
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    saveTemplate(template);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    resetTemplate();
    setTemplate(DEFAULT_TEMPLATE);
  }

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Variables disponibles:{" "}
        <code className="text-foreground">{"{nombre}"}</code>,{" "}
        <code className="text-foreground">{"{motivo}"}</code>,{" "}
        <code className="text-foreground">{"{fecha}"}</code>,{" "}
        <code className="text-foreground">{"{hora}"}</code>,{" "}
        <code className="text-foreground">{"{ubicacion}"}</code>
      </p>
      <textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleReset}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Restaurar
        </button>
        <button
          onClick={handleSave}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            saved
              ? "bg-green-500/10 text-green-500"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {saved ? "Guardado" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
