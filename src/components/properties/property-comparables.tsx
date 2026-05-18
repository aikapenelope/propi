import { getComparables } from "@/server/actions/comparables";
import { TrendingUp, ExternalLink } from "lucide-react";

/**
 * Market comparables section for property detail page.
 * Shows 3-5 similar properties from MercadoLibre with price stats.
 * Server component — fetches data directly.
 */
export async function PropertyComparables({ propertyId }: { propertyId: string }) {
  const result = await getComparables(propertyId);

  if (!result || result.comparables.length === 0) return null;

  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-border p-5 bg-[var(--card-bg)] card-shadow">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        Comparables de Mercado
      </h2>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-lg font-bold text-foreground">{fmt(result.stats.avgPrice)}</p>
          <p className="text-[10px] text-muted-foreground">Precio promedio</p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-lg font-bold text-foreground">{fmt(result.stats.minPrice)}</p>
          <p className="text-[10px] text-muted-foreground">Minimo</p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-lg font-bold text-foreground">{fmt(result.stats.maxPrice)}</p>
          <p className="text-[10px] text-muted-foreground">Maximo</p>
        </div>
        {result.stats.avgPricePerM2 && (
          <div className="rounded-xl bg-muted p-3 text-center">
            <p className="text-lg font-bold text-foreground">{fmt(result.stats.avgPricePerM2)}</p>
            <p className="text-[10px] text-muted-foreground">$/m2 promedio</p>
          </div>
        )}
      </div>

      {/* Comparable listings */}
      <div className="space-y-2">
        {result.comparables.map((comp) => (
          <div
            key={comp.id}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-border/50"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {comp.title || "Propiedad"}
              </p>
              <p className="text-xs text-muted-foreground">
                {[comp.neighborhood, comp.city].filter(Boolean).join(", ")}
                {comp.areaM2 ? ` · ${comp.areaM2}m2` : ""}
                {comp.bedrooms ? ` · ${comp.bedrooms} hab` : ""}
              </p>
            </div>
            <div className="text-right ml-3 shrink-0 flex items-center gap-2">
              <div>
                <p className="text-sm font-bold text-foreground">{fmt(comp.price)}</p>
                {comp.pricePerM2 && (
                  <p className="text-[10px] text-muted-foreground">{fmt(comp.pricePerM2)}/m2</p>
                )}
              </div>
              {comp.permalink && (
                <a
                  href={comp.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Basado en {result.stats.count} propiedades similares en MercadoLibre · Datos actualizados diariamente
      </p>
    </div>
  );
}
