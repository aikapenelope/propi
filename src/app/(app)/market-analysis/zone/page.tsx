import { Suspense } from "react";
import { MapPin, Building2, DollarSign, TrendingUp, Bed, Bath, Car, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getZoneListings, getZoneKPIs } from "@/server/actions/zone-search";

export const dynamic = "force-dynamic";

/**
 * Zone results page - shows ALL deduplicated properties for a search.
 * Accessed from Propi Magic chat via "Ver todas las propiedades de esta zona".
 *
 * URL: /market-analysis/zone?neighborhood=Altamira&propertyType=Apartamento&...
 */
export default async function ZoneResultsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;

  const query = {
    propertyType: sp.propertyType || undefined,
    operation: sp.operation || undefined,
    city: sp.city || undefined,
    neighborhood: sp.neighborhood || undefined,
    areaMin: sp.areaMin ? parseInt(sp.areaMin) : undefined,
    areaMax: sp.areaMax ? parseInt(sp.areaMax) : undefined,
    priceMin: sp.priceMin ? parseInt(sp.priceMin) : undefined,
    priceMax: sp.priceMax ? parseInt(sp.priceMax) : undefined,
    bedrooms: sp.bedrooms ? parseInt(sp.bedrooms) : undefined,
  };

  const zoneName = query.neighborhood || query.city || "Venezuela";
  const typeLabel = query.propertyType || "Propiedades";

  const [listings, kpis] = await Promise.all([
    getZoneListings(query),
    getZoneKPIs(query),
  ]);

  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/market-analysis"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {typeLabel} en {zoneName}
          </h1>
          <p className="text-xs text-muted-foreground">
            {listings.length} propiedades (duplicados eliminados) - Datos de MercadoLibre
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Building2} label="Total" value={String(kpis.total)} />
        <KpiCard icon={DollarSign} label="Precio Promedio" value={kpis.avgPrice ? `$${kpis.avgPrice.toLocaleString()}` : "--"} color="text-primary" />
        <KpiCard icon={TrendingUp} label="Mediana" value={kpis.medianPrice ? `$${kpis.medianPrice.toLocaleString()}` : "--"} color="text-blue-400" />
        <KpiCard icon={MapPin} label="Precio/m2" value={kpis.avgPriceM2 ? `$${kpis.avgPriceM2.toLocaleString()}` : "--"} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={DollarSign} label="Minimo" value={kpis.minPrice ? `$${kpis.minPrice.toLocaleString()}` : "--"} color="text-green-400" />
        <KpiCard icon={DollarSign} label="Maximo" value={kpis.maxPrice ? `$${kpis.maxPrice.toLocaleString()}` : "--"} color="text-red-400" />
        <KpiCard icon={Building2} label="Area Promedio" value={kpis.avgArea ? `${kpis.avgArea} m2` : "--"} />
        <KpiCard icon={Building2} label="Deduplicadas" value={`${kpis.total - listings.length} removidas`} color="text-muted-foreground" />
      </div>

      {/* Listings grid */}
      {listings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No se encontraron propiedades con estos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <a
              key={l.id}
              href={l.permalink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[var(--card-bg)] border border-border rounded-2xl overflow-hidden card-shadow hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            >
              {/* Thumbnail */}
              <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                {l.thumbnail ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={l.thumbnail}
                    alt={l.title || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {l.property_type || "Inmueble"}
                </span>
                <ExternalLink className="absolute top-2 right-2 h-4 w-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-lg font-bold text-primary mb-1">
                  {l.price ? `$${parseFloat(l.price).toLocaleString()}` : "Consultar"}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{l.currency}</span>
                </p>
                <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                  {l.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  {l.bedrooms != null && (
                    <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{l.bedrooms}</span>
                  )}
                  {l.bathrooms != null && (
                    <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{l.bathrooms}</span>
                  )}
                  {l.area_m2 && (
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{l.area_m2}m2</span>
                  )}
                  {l.parking != null && (
                    <span className="flex items-center gap-1"><Car className="h-3 w-3" />{l.parking}</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {[l.neighborhood, l.city].filter(Boolean).join(", ")}
                </p>
                {l.published_at && (
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {new Date(l.published_at).toLocaleDateString("es")}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: typeof Building2; label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className={`h-3.5 w-3.5 ${color || ""}`} />
        {label}
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
