"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { publishFbPost } from "@/server/actions/facebook";

export function PublishFbForm() {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await publishFbPost(message, link || undefined);
      setResult(`Publicado. Post ID: ${res.id}`);
      setMessage("");
      setLink("");
    } catch (err) {
      setResult(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePublish} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground">
          Mensaje *
        </label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Escribe tu publicacion..."
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">
          Link (opcional)
        </label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://tu-sitio.com/propiedad"
          className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <Send className="h-4 w-4" />
        {loading ? "Publicando..." : "Publicar en Facebook"}
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
