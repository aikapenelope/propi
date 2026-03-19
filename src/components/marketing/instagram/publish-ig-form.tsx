"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { publishIgPhoto } from "@/server/actions/instagram";

export function PublishIgForm() {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await publishIgPhoto(imageUrl, caption);
      setResult(`Publicado. Media ID: ${res.id}`);
      setImageUrl("");
      setCaption("");
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
          URL de la imagen *
        </label>
        <input
          type="url"
          required
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://tu-cdn.com/foto-propiedad.jpg"
          className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="Describe tu publicacion... #inmobiliaria #propiedades"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-50 transition-colors"
      >
        <Upload className="h-4 w-4" />
        {loading ? "Publicando..." : "Publicar en Instagram"}
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
