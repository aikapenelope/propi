"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import {
  createEmailCampaign,
  sendEmailCampaign,
} from "@/server/actions/email-campaigns";

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export function CampaignComposer({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [tagId, setTagId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !htmlBody.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      await createEmailCampaign({
        subject,
        htmlBody,
        tagId: tagId || undefined,
      });
      router.push("/marketing/email");
    } catch (err) {
      setResult(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSendNow(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !htmlBody.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const campaign = await createEmailCampaign({
        subject,
        htmlBody,
        tagId: tagId || undefined,
      });
      const res = await sendEmailCampaign(campaign.id);
      setResult(
        `Enviados: ${res.sentCount}/${res.total}. Fallidos: ${res.failedCount}.`,
      );
      setTimeout(() => router.push("/marketing/email"), 2000);
    } catch (err) {
      setResult(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <form className="space-y-4">
      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Asunto *
        </label>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Nuevas propiedades disponibles..."
          className={inputClass}
        />
      </div>

      {/* Segment */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Segmento (Tag)
        </label>
        <select
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          className={inputClass}
        >
          <option value="">Todos los contactos con email</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* HTML Body */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Contenido HTML *
        </label>
        <textarea
          required
          value={htmlBody}
          onChange={(e) => setHtmlBody(e.target.value)}
          rows={12}
          placeholder="<h1>Hola!</h1><p>Tenemos nuevas propiedades para ti...</p>"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={loading || !subject.trim() || !htmlBody.trim()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
        >
          Guardar Borrador
        </button>
        <button
          type="button"
          onClick={handleSendNow}
          disabled={loading || !subject.trim() || !htmlBody.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
          {loading ? "Enviando..." : "Enviar Ahora"}
        </button>
      </div>

      {result && (
        <p
          className={`text-sm ${result.startsWith("Error") ? "text-destructive" : "text-green-600"}`}
        >
          {result}
        </p>
      )}
    </form>
  );
}
