"use client";

import {
  DollarSign,
  TrendingUp,
  Building2,
  Bed,
  Bath,
  Car,
  Ruler,
  ExternalLink,
  MapPin,
  ArrowDown,
  ArrowUp,
  Minus,
} from "lucide-react";
import type { ValuationResult } from "@/server/actions/valuation";

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function PositionIndicator({ position }: { position: number }) {
  // Position: 0 = cheapest in market, 100 = most expensive
  let label: string;
  let color: string;
  let Icon: typeof ArrowDown;

  if (position <= 25) {
    label = "Por debajo del mercado";
    color = "text-green-500 bg-green-500/10";
    Icon = ArrowDown;
  } else if (position <= 75) {
    label = "Dentro del rango de mercado";
    color = "text-blue-500 bg-blue-500/10";
    Icon = Minus;
  } else {
    label = "Por encima del mercado";
    color = "text-orange-500 bg-orange-500/10";
    Icon = ArrowUp;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {label} (percentil {position})
    </div>
  );
}

export function ValuationResults({ result }: { result: ValuationResult }) {
  const { comparables, stats, pricePosition, suggestedRange } = result;

  return (
    <div className="mt-8 space-y-6">
      {/* Header with suggested range */}
      {suggestedRange && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            Rango de precio sugerido
          </h3>
          <p className="text-2xl font-bold text-foreground">
            {fmt(suggestedRange.min)} — {fmt(suggestedRange.max)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Basado en el rango intercuartil (P25-P75) de {stats.total} propiedades similares
          </p>
          {pricePosition !== null && (
            <div className="mt-3">
              <PositionIndicator position={pricePosition} />
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Building2}
          label="Propiedades encontradas"
          value={String(stats.total)}
        />
        <KpiCard
          icon={DollarSign}
          label="Precio promedio"
          value={fmt(stats.avgPrice)}
          color="text-primary"
        />
        <KpiCard
          icon={TrendingUp}
          label="Mediana"
          value={fmt(stats.medianPrice)}
          color="text-blue-400"
        />
        <KpiCard
          icon={MapPin}
          label="Precio/m2"
          value={stats.avgPricePerM2 ? fmt(stats.avgPricePerM2) : "--"}
          color="text-purple-400"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={DollarSign}
          label="Minimo"
          value={fmt(stats.minPrice)}
          color="text-green-400"
        />
        <KpiCard
          icon={DollarSign}
          label="Maximo"
          value={fmt(stats.maxPrice)}
          color="text-red-400"
        />
        <KpiCard
          icon={Ruler}
          label="Area promedio"
          value={stats.avgArea ? `${stats.avgArea} m2` : "--"}
        />
        <KpiCard
          icon={Building2}
          label="Deduplicadas"
          value={`${stats.total - comparables.length} removidas`}
          color="text-muted-foreground"
        />
      </div>

      {/* Comparables list */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">
          Top {comparables.length} comparables
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {comparables.map((comp) => (
            <a
              key={comp.id}
              href={comp.permalink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-3 rounded-xl border border-border bg-[var(--card-bg)] hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                {comp.thumbnail ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={comp.thumbnail}
                    alt={comp.title || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-primary">
                    {fmt(comp.price)}
                    {comp.pricePerM2 && (
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">
                        ({fmt(comp.pricePerM2)}/m2)
                      </span>
                    )}
                  </p>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <p className="text-xs text-foreground line-clamp-1 mt-0.5">
                  {comp.title || "Propiedad"}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                  {comp.areaM2 && (
                    <span className="flex items-center gap-0.5">
                      <Ruler className="h-3 w-3" />
                      {comp.areaM2}m2
                    </span>
                  )}
                  {comp.bedrooms != null && (
                    <span className="flex items-center gap-0.5">
                      <Bed className="h-3 w-3" />
                      {comp.bedrooms}
                    </span>
                  )}
                  {comp.bathrooms != null && (
                    <span className="flex items-center gap-0.5">
                      <Bath className="h-3 w-3" />
                      {comp.bathrooms}
                    </span>
                  )}
                  {comp.parking != null && (
                    <span className="flex items-center gap-0.5">
                      <Car className="h-3 w-3" />
                      {comp.parking}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">
                  {[comp.neighborhood, comp.city].filter(Boolean).join(", ")}
                  {comp.condition && ` · ${comp.condition}`}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center">
        Datos de MercadoLibre Venezuela · Ultimos 12 meses · {stats.total} propiedades analizadas
      </p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-xl p-3 card-shadow">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
        <Icon className={`h-3 w-3 ${color || ""}`} />
        {label}
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
