"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  ExternalLink,
  ShoppingBag,
  Globe,
  Store,
  Newspaper,
} from "lucide-react";
import { updatePropertyLinks } from "@/server/actions/properties";

// ---------------------------------------------------------------------------
// Portal definitions
// ---------------------------------------------------------------------------

interface Portal {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  publishUrl: string;
  description: string;
  tip: string;
}

const PORTALS: Portal[] = [
  {
    id: "mercadolibre",
    name: "MercadoLibre",
    icon: <ShoppingBag className="h-4 w-4" />,
    color: "text-yellow-500",
    publishUrl: "https://inmuebles.mercadolibre.com.ve/publicar",
    description: "El marketplace mas grande de Venezuela",
    tip: "Usa la categoria correcta (Apartamento, Casa, etc.) y sube al menos 5 fotos para mejor visibilidad.",
  },
  {
    id: "wasi",
    name: "Wasi",
    icon: <Store className="h-4 w-4" />,
    color: "text-orange-500",
    publishUrl: "https://wasi.co/login",
    description: "CRM y portal para agentes inmobiliarios",
    tip: "Wasi distribuye tu propiedad a portales asociados (Inmuebles24, Properati, etc.) automaticamente.",
  },
  {
    id: "tuinmueble",
    name: "TuInmueble",
    icon: <Globe className="h-4 w-4" />,
    color: "text-blue-500",
    publishUrl: "https://tuinmueble.com.ve/publicar",
    description: "Portal inmobiliario popular en Venezuela",
    tip: "Incluye la ubicacion exacta y el precio en USD para mejor posicionamiento.",
  },
  {
    id: "corotos",
    name: "Corotos",
    icon: <Newspaper className="h-4 w-4" />,
    color: "text-green-500",
    publishUrl: "https://www.corotos.com.ve/publicar",
    description: "Clasificados gratuitos de Venezuela",
    tip: "Publica gratis. Usa un titulo descriptivo con tipo, zona y precio.",
  },
  {
    id: "fb-marketplace",
    name: "Facebook Marketplace",
    icon: <Store className="h-4 w-4" />,
    color: "text-blue-600",
    publishUrl: "https://www.facebook.com/marketplace/create/rental",
    description: "Llega a compradores locales en Facebook",
    tip: "Selecciona 'Propiedades en venta/alquiler'. Las publicaciones con fotos de calidad reciben 3x mas contactos.",
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PublishSection(props: PublishSectionProps) {
  const [copied, setCopied] = useState(false);
  const [expandedPortal, setExpandedPortal] = useState<string | null>(null);
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
    sell: "VENTA",
    lease: "ALQUILER",
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

  /** Copy text to clipboard, then open the portal in a new tab. */
  function handlePortalClick(portal: Portal) {
    navigator.clipboard.writeText(listingText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open(portal.publishUrl, "_blank", "noopener,noreferrer");
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
            Texto listo para copiar y pegar en cualquier portal
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
          Publicar rapidamente (copia el texto y abre el portal)
        </span>
        <div className="space-y-2">
          {PORTALS.map((portal) => (
            <div key={portal.id} className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <button
                  onClick={() => handlePortalClick(portal)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 ${portal.color}`}>
                    {portal.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {portal.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {portal.description}
                    </p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
                <button
                  onClick={() =>
                    setExpandedPortal(
                      expandedPortal === portal.id ? null : portal.id,
                    )
                  }
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted shrink-0"
                >
                  {expandedPortal === portal.id ? "Ocultar" : "Tip"}
                </button>
              </div>
              {expandedPortal === portal.id && (
                <div className="px-3 pb-3 pt-0">
                  <p className="text-[10px] text-muted-foreground bg-muted rounded-lg p-2.5 leading-relaxed">
                    {portal.tip}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Link inputs */}
      <div>
        <span className="text-xs text-muted-foreground block mb-2">
          Pega los links de tu publicacion (aparecen en la pagina publica)
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
                  ? "https://inmuebles.mercadolibre.com.ve/..."
                  : i === 1
                    ? "https://tuinmueble.com/..."
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
