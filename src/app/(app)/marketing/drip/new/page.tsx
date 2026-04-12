"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Zap, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { createDripSequence } from "@/server/actions/drip-campaigns";

interface Step {
  delayDays: number;
  subject: string;
  body: string;
}

export default function NewSequencePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { delayDays: 0, subject: "", body: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStep() {
    setSteps((prev) => [
      ...prev,
      { delayDays: prev.length > 0 ? 3 : 0, subject: "", body: "" },
    ]);
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStep(index: number, field: keyof Step, value: string | number) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await createDripSequence(name, steps);
      router.push("/marketing/drip");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/marketing/drip"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nueva Secuencia</h1>
          <p className="text-xs text-muted-foreground">
            Define los emails que se enviaran automaticamente
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 mb-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Sequence name */}
      <div className="mb-6">
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Nombre de la secuencia
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Bienvenida nuevos leads"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="rounded-xl border border-border p-4 relative"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {i + 1}
              </div>
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                Paso {i + 1}
              </span>
              {steps.length > 1 && (
                <button
                  onClick={() => removeStep(i)}
                  className="ml-auto p-1 rounded text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Delay */}
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Enviar</span>
              <input
                type="number"
                min={0}
                value={step.delayDays}
                onChange={(e) =>
                  updateStep(i, "delayDays", parseInt(e.target.value) || 0)
                }
                className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-primary/20"
              />
              <span className="text-xs text-muted-foreground">
                dia{step.delayDays !== 1 ? "s" : ""} despues{" "}
                {i === 0 ? "de inscribir" : "del paso anterior"}
              </span>
            </div>

            {/* Subject */}
            <input
              type="text"
              value={step.subject}
              onChange={(e) => updateStep(i, "subject", e.target.value)}
              placeholder="Asunto del email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-2 outline-none focus:ring-1 focus:ring-primary/20"
            />

            {/* Body */}
            <textarea
              value={step.body}
              onChange={(e) => updateStep(i, "body", e.target.value)}
              placeholder="Contenido del email (texto plano, se convierte a HTML)"
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
        ))}
      </div>

      {/* Add step */}
      <button
        onClick={addStep}
        className="flex items-center gap-2 w-full justify-center rounded-xl border border-dashed border-border py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors mb-6"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar paso
      </button>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim() || steps.some((s) => !s.subject.trim() || !s.body.trim())}
        className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        <Zap className="h-4 w-4" />
        {saving ? "Guardando..." : "Crear Secuencia"}
      </button>
    </div>
  );
}
