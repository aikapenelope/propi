"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  MapPin,
  Ruler,
  Bed,
  Bath,
  DollarSign,
  Search,
  Loader2,
} from "lucide-react";
import { getValuation } from "@/server/actions/valuation";
import type { ValuationResult } from "@/server/actions/valuation";
import { ValuationResults } from "./valuation-results";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "office", label: "Oficina" },
  { value: "commercial", label: "Local Comercial" },
  { value: "land", label: "Terreno" },
  { value: "warehouse", label: "Galpon" },
];

const OPERATIONS = [
  { value: "sale", label: "Venta" },
  { value: "rent", label: "Alquiler" },
];

const CITIES = [
  "Caracas",
  "Valencia",
  "Maracaibo",
  "Barquisimeto",
  "Maracay",
  "Puerto La Cruz",
  "Ciudad Guayana",
  "Merida",
  "San Cristobal",
  "Porlamar",
];

export function ValuationForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const propertyType = fd.get("propertyType") as string;
    const operation = fd.get("operation") as string;
    const city = fd.get("city") as string;
    const neighborhood = (fd.get("neighborhood") as string) || undefined;
    const areaM2 = fd.get("areaM2") ? Number(fd.get("areaM2")) : undefined;
    const bedrooms = fd.get("bedrooms") ? Number(fd.get("bedrooms")) : undefined;
    const bathrooms = fd.get("bathrooms") ? Number(fd.get("bathrooms")) : undefined;
    const askingPrice = fd.get("askingPrice") ? Number(fd.get("askingPrice")) : undefined;

    if (!propertyType || !operation || !city) {
      setError("Tipo, operacion y ciudad son obligatorios.");
      return;
    }

    setError(null);
    setNoResults(false);
    setResult(null);

    startTransition(async () => {
      try {
        const data = await getValuation({
          propertyType,
          operation,
          city,
          neighborhood,
          areaM2,
          bedrooms,
          bathrooms,
          askingPrice,
        });

        if (!data) {
          setNoResults(true);
        } else {
          setResult(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al buscar comparables.");
      }
    });
  }

  return (
    <div>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Type + Operation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Tipo de propiedad *
            </label>
            <select
              name="propertyType"
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Operacion *
            </label>
            <select
              name="operation"
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {OPERATIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: City + Neighborhood */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Ciudad *
            </label>
            <select
              name="city"
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Zona / Urbanizacion
            </label>
            <input
              name="neighborhood"
              type="text"
              placeholder="Ej: Altamira, El Rosal..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Row 3: Area + Bedrooms + Bathrooms */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Ruler className="h-3.5 w-3.5" />
              Area (m2)
            </label>
            <input
              name="areaM2"
              type="number"
              min="0"
              placeholder="120"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Bed className="h-3.5 w-3.5" />
              Habitaciones
            </label>
            <input
              name="bedrooms"
              type="number"
              min="0"
              max="10"
              placeholder="3"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Bath className="h-3.5 w-3.5" />
              Banos
            </label>
            <input
              name="bathrooms"
              type="number"
              min="0"
              max="10"
              placeholder="2"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Row 4: Asking price */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Precio del cliente (USD) — opcional, para posicionar en el mercado
          </label>
          <input
            name="askingPrice"
            type="number"
            min="0"
            placeholder="150000"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {isPending ? "Buscando comparables..." : "Buscar Comparables"}
        </button>
      </form>

      {/* Results */}
      {noResults && (
        <div className="mt-8 text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No se encontraron propiedades similares</p>
          <p className="text-xs mt-1">
            Intenta con una zona mas amplia o menos filtros.
          </p>
        </div>
      )}

      {result && <ValuationResults result={result} />}
    </div>
  );
}
