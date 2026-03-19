"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import {
  sendWhatsAppMessage,
  sendWhatsAppToSegment,
} from "@/server/actions/whatsapp";
import { getContacts, getTags } from "@/server/actions/contacts";

type Contact = { id: string; name: string; phone: string | null };
type Tag = { id: string; name: string; color: string | null };

export function WhatsAppSendForm() {
  const [mode, setMode] = useState<"individual" | "segment">("individual");
  const [contactList, setContactList] = useState<Contact[]>([]);
  const [tagList, setTagList] = useState<Tag[]>([]);
  const [contactId, setContactId] = useState("");
  const [tagId, setTagId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    getContacts().then((c) => setContactList(c));
    getTags().then((t) => setTagList(t));
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      if (mode === "individual") {
        if (!contactId) return;
        await sendWhatsAppMessage(contactId, body);
        setResult("Mensaje enviado.");
      } else {
        if (!tagId) return;
        const res = await sendWhatsAppToSegment(tagId, body);
        setResult(
          `Enviados: ${res.sent}/${res.total}. Fallidos: ${res.failed}.`,
        );
      }
      setBody("");
    } catch (err) {
      setResult(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSend} className="space-y-4 rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground">Enviar Mensaje</h3>

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("individual")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "individual"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => setMode("segment")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "segment"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Segmento (Tag)
        </button>
      </div>

      {/* Contact or Tag selector */}
      {mode === "individual" ? (
        <select
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Seleccionar contacto...</option>
          {contactList
            .filter((c) => c.phone)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
        </select>
      ) : (
        <select
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Seleccionar segmento...</option>
          {tagList.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      {/* Message body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={3}
        placeholder="Escribe tu mensaje..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <Send className="h-4 w-4" />
        {loading ? "Enviando..." : "Enviar por WhatsApp"}
      </button>

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
