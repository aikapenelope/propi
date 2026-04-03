"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  ExternalLink,
  ShoppingBag,
  Globe,
  Loader2,
  Zap,
} from "lucide-react";
import { updatePropertyLinks } from "@/server/actions/properties";
import { publishPropertyToWasi } from "@/server/actions/wasi-publish";

interface PublishSectionProps {
  propertyId: string;
  title: string;
  description: string | null;
  type: string;
  operation: string;
  price: string | null;
  currency: string | null;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  city: string | null;
  state: string | null;
  address: string | null;
  externalLinks: string[];
  hasWasiToken: boolean;
  wasiId?: string;
}

export function PublishSection(props: PublishSectionProps) {
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<string[]>([
    props.externalLinks[0] || "",
    props.externalLinks[1] || "",
    props.externalLinks[2] || "",
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  // Build the listing text for copy-paste
  const priceFormatted = props.price
    ? new Intl.NumberFormat("es", {
        style: "currency",
        currency: props.currency || "USD",
        minimumFractionDigits: 0,
      }).format(parseFloat(props.price))
    : null;

  const opLabel: Record<string, string> = {
    sale: "VENTA",
    rent: "ALQUILER",
    sale_rent: "VENTA / ALQUILER",
  };

  const typeLabel: Record<string, string> = {
    apartment: "Apartamento",
    house: "Casa",
    office: "Oficina",
    commercial: "Local Comercial",
    land: "Terreno",
    warehouse: "Galpon",
    other: "Inmueble",
  };

  const listingText = [
    `${typeLabel[props.type] || props.type} en ${opLabel[props.operation] || props.operation}`,
    "",
    props.title,
    "",
    priceFormatted ? `Precio: ${priceFormatted}` : null,
    props.area ? `Area: ${props.area} m2` : null,
    props.bedrooms ? `Habitaciones: ${props.bedrooms}` : null,
    props.bathrooms ? `Banos: ${props.bathrooms}` : null,
    props.parkingSpaces ? `Estacionamientos: ${props.parkingSpaces}` : null,
    "",
    [props.address, props.city, props.state].filter(Boolean).join(", ") || null,
    "",
    props.description || null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  function handleCopy() {
    navigator.clipboard.writeText(listingText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSaveLinks() {
    setSaving(true);
    try {
      await updatePropertyLinks(
        props.propertyId,
        links.filter(Boolean),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border p-5 md:col-span-2 bg-[var(--card-bg)] card-shadow">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
        Publicar en Portales
      </h2>

      {/* Pre-generated text */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            Texto listo para copiar y pegar
          </span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copiar texto
              </>
            )}
          </button>
        </div>
        <pre className="rounded-xl bg-muted p-4 text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
          {listingText}
        </pre>
      </div>

      {/* Portal buttons */}
      <div className="mb-5">
        <span className="text-xs text-muted-foreground block mb-2">
          Publicar en portales
        </span>
        <div className="flex flex-wrap gap-2">
          {/* Wasi: auto-publish if token configured */}
          {props.hasWasiToken ? (
            props.wasiId ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs font-medium text-green-400">
                <Check className="h-3.5 w-3.5" />
                Wasi #{props.wasiId}
              </span>
            ) : (
              <WasiPublishButton propertyId={props.propertyId} />
            )
          ) : (
            <a
              href="https://wasi.co/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-orange-500" />
              Wasi (manual)
              <ExternalLink className="h-3 w-3 opacity-40" />
            </a>
          )}
          <a
            href="https://www.mercadolibre.com.ve/publicar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-yellow-500" />
            MercadoLibre
            <ExternalLink className="h-3 w-3 opacity-40" />
          </a>
        </div>
      </div>

      {/* Link inputs */}
      <div>
        <span className="text-xs text-muted-foreground block mb-2">
          Pega los links de tu publicacion
        </span>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="url"
              value={links[i]}
              onChange={(e) => {
                const newLinks = [...links];
                newLinks[i] = e.target.value;
                setLinks(newLinks);
              }}
              placeholder={
                i === 0
                  ? "https://wasi.co/..."
                  : i === 1
                    ? "https://mercadolibre.com.ve/..."
                    : "https://..."
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ))}
        </div>
        <button
          onClick={handleSaveLinks}
          disabled={saving}
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saved ? (
            <>
              <Check className="h-3 w-3" />
              Guardado
            </>
          ) : (
            saving ? "Guardando..." : "Guardar links"
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wasi auto-publish button (only shown when token is configured)
// ---------------------------------------------------------------------------

function WasiPublishButton({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handlePublish() {
    setLoading(true);
    setError(null);
    try {
      await publishPropertyToWasi(propertyId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handlePublish}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Zap className="h-3.5 w-3.5" />
        )}
        {loading ? "Publicando..." : "Publicar en Wasi"}
      </button>
      {error && (
        <span className="text-[10px] text-red-400">{error}</span>
      )}
    </div>
  );
}
