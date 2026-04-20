"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertAgentProfile } from "@/server/actions/agent-profile";
import { ExternalLink, Save, Loader2, Eye } from "lucide-react";

interface AgentProfileFormProps {
  initialData?: {
    slug: string;
    displayName: string;
    bio: string | null;
    phone: string | null;
    email: string | null;
    photoUrl: string | null;
    agency: string | null;
    city: string | null;
    whatsapp: string | null;
    published: boolean;
  } | null;
}

export function AgentProfileForm({ initialData }: AgentProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [displayName, setDisplayName] = useState(
    initialData?.displayName ?? "",
  );
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl ?? "");
  const [agency, setAgency] = useState(initialData?.agency ?? "");
  const [city, setCity] = useState(initialData?.city ?? "");
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp ?? "");
  const [published, setPublished] = useState(initialData?.published ?? false);

  function handleSlugChange(value: string) {
    // Auto-format slug as user types
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-"),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await upsertAgentProfile({
          slug,
          displayName,
          bio: bio || undefined,
          phone: phone || undefined,
          email: email || undefined,
          photoUrl: photoUrl || undefined,
          agency: agency || undefined,
          city: city || undefined,
          whatsapp: whatsapp || undefined,
          published,
        });
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al guardar el perfil.",
        );
      }
    });
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  const portalUrl = slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/agente/${slug}`
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Portal URL preview */}
      {portalUrl && published && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <ExternalLink className="h-4 w-4 text-primary shrink-0" />
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline truncate"
          >
            {portalUrl}
          </a>
        </div>
      )}

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          URL del portal *
        </label>
        <div className="flex items-center gap-0">
          <span className="h-10 flex items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
            /agente/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="carlos-mendez"
            required
            minLength={3}
            maxLength={100}
            className="h-10 flex-1 rounded-r-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Solo letras, numeros y guiones. Minimo 3 caracteres.
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Nombre completo *
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Carlos Mendez"
          required
          className={inputClass}
        />
      </div>

      {/* Agency + City row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Agencia / Empresa
          </label>
          <input
            type="text"
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            placeholder="RE/MAX, Century 21, independiente..."
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Ciudad
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Caracas"
            className={inputClass}
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Bio / Descripcion
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Agente inmobiliario con 10 anos de experiencia en el este de Caracas..."
          rows={3}
          maxLength={500}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {bio.length}/500 caracteres
        </p>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Telefono publico
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+58 412 1234567"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            WhatsApp
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+584121234567"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Email publico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="carlos@ejemplo.com"
          className={inputClass}
        />
      </div>

      {/* Photo URL */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          URL de foto de perfil
        </label>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Usa tu foto de Clerk o pega un link directo a una imagen.
        </p>
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPublished(!published)}
          className={`relative h-6 w-11 rounded-full transition-colors ${published ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${published ? "translate-x-5" : ""}`}
          />
        </button>
        <div>
          <span className="text-sm font-medium text-foreground">
            Portal publico
          </span>
          <p className="text-xs text-muted-foreground">
            {published
              ? "Tu portal es visible para cualquiera con el link."
              : "Tu portal esta oculto. Activalo cuando estes listo."}
          </p>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-500 bg-green-500/10 rounded-lg p-3">
          Perfil guardado correctamente.
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar
        </button>

        {portalUrl && published && (
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Eye className="h-4 w-4" />
            Ver portal
          </a>
        )}
      </div>
    </form>
  );
}
