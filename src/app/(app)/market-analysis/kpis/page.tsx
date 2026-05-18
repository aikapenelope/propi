"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Building2,
  Users,
  DollarSign,
  Activity,
  Layers,
} from "lucide-react";
import {
  getCityOverview,
  getPricePerM2ByNeighborhood,
  getPriceTrendByMonth,
  getInventoryByType,
  getPriceDistribution,
  getWeeklyNewListings,
  getTopSellers,
  getConditionBreakdown,
} from "@/server/actions/market-kpis";

const CITIES = [
  { id: "Caracas", label: "Caracas" },
  { id: "Valencia", label: "Valencia" },
  { id: "Maracaibo", label: "Maracaibo" },
];

type CityData = {
  overview: Awaited<ReturnType<typeof getCityOverview>>;
  priceByHood: Awaited<ReturnType<typeof getPricePerM2ByNeighborhood>>;
  priceTrend: Awaited<ReturnType<typeof getPriceTrendByMonth>>;
  byType: Awaited<ReturnType<typeof getInventoryByType>>;
  priceDistro: Awaited<ReturnType<typeof getPriceDistribution>>;
  weeklyNew: Awaited<ReturnType<typeof getWeeklyNewListings>>;
  topSellers: Awaited<ReturnType<typeof getTopSellers>>;
  condition: Awaited<ReturnType<typeof getConditionBreakdown>>;
};

function fmt(n: number | null | undefined): string {
  if (n == null) return "--";
  return new Intl.NumberFormat("es").format(Math.round(n));
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "--";
  return "$" + new Intl.NumberFormat("es").format(Math.round(n));
}

export default function MarketKPIsPage() {
  const [activeCity, setActiveCity] = useState("Caracas");
  const [data, setData] = useState<CityData | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback((city: string) => {
    startTransition(async () => {
      const [overview, priceByHood, priceTrend, byType, priceDistro, weeklyNew, topSellers, condition] =
        await Promise.all([
          getCityOverview(city),
          getPricePerM2ByNeighborhood(city),
          getPriceTrendByMonth(city),
          getInventoryByType(city),
          getPriceDistribution(city),
          getWeeklyNewListings(city),
          getTopSellers(city),
          getConditionBreakdown(city),
        ]);
      setData({ overview, priceByHood, priceTrend, byType, priceDistro, weeklyNew, topSellers, condition });
    });
  }, []);

  useEffect(() => {
    loadData(activeCity);
  }, [activeCity, loadData]);

  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Inteligencia de Mercado</h1>
          <p className="text-xs text-muted-foreground">Datos reales de MercadoLibre Venezuela</p>
        </div>
      </div>

      {/* City tabs */}
      <div className="flex gap-2 mb-6">
        {CITIES.map((city) => (
          <button
            key={city.id}
            onClick={() => setActiveCity(city.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCity === city.id
                ? "bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(0,255,85,0.15)]"
                : "bg-[var(--card-bg)] border border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {city.label}
          </button>
        ))}
      </div>

      {isPending || !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 h-28" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard icon={Building2} label="Propiedades" value={fmt(data.overview.total)} />
            <KpiCard icon={DollarSign} label="Precio Promedio" value={fmtUsd(data.overview.avgPrice)} color="text-primary" />
            <KpiCard icon={TrendingUp} label="Precio Mediana" value={fmtUsd(data.overview.medianPrice)} color="text-blue-400" />
            <KpiCard icon={MapPin} label="Precio/m2 Promedio" value={fmtUsd(data.overview.avgPriceM2)} color="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <KpiCard icon={DollarSign} label="Precio Minimo" value={fmtUsd(data.overview.minPrice)} color="text-green-400" />
            <KpiCard icon={DollarSign} label="Precio Maximo" value={fmtUsd(data.overview.maxPrice)} color="text-red-400" />
          </div>

          {/* Price per m2 by neighborhood */}
          <SectionTitle icon={MapPin} title="Precio/m2 por Barrio" subtitle="Top 10 barrios mas caros" />
          <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow mb-6">
            {data.priceByHood.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos de barrios</p>
            ) : (
              <div className="space-y-3">
                {data.priceByHood.map((h, i) => (
                  <div key={h.neighborhood} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{h.neighborhood}</span>
                        <span className="text-sm font-bold text-primary shrink-0">{fmtUsd(h.avgPriceM2)}/m2</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${Math.min(100, ((h.avgPriceM2 || 0) / (data.priceByHood[0]?.avgPriceM2 || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{h.count} props</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price trend */}
          <SectionTitle icon={TrendingUp} title="Tendencia de Precios" subtitle="Precio promedio por mes (12 meses)" />
          <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow mb-6">
            {data.priceTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos de tendencia</p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {data.priceTrend.map((m) => {
                  const maxPrice = Math.max(...data.priceTrend.map((t) => t.avgPrice || 0));
                  const height = maxPrice > 0 ? ((m.avgPrice || 0) / maxPrice) * 100 : 0;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[8px] text-muted-foreground">{fmtUsd(m.avgPrice)}</span>
                      <div className="w-full rounded-t bg-primary/40 hover:bg-primary/60 transition-colors" style={{ height: `${height}%` }} />
                      <span className="text-[8px] text-muted-foreground">{m.month?.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Inventory by type */}
            <div>
              <SectionTitle icon={Layers} title="Inventario por Tipo" subtitle="Distribucion de propiedades" />
              <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow">
                {data.byType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos</p>
                ) : (
                  <div className="space-y-3">
                    {data.byType.map((t) => (
                      <div key={t.type} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{t.type || "Otro"}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{fmtUsd(t.avgPrice)} avg</span>
                          <span className="text-sm font-bold text-foreground">{t.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Price distribution */}
            <div>
              <SectionTitle icon={BarChart3} title="Distribucion de Precios" subtitle="Propiedades por rango" />
              <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow">
                {data.priceDistro.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos</p>
                ) : (
                  <div className="space-y-3">
                    {data.priceDistro.map((b) => {
                      const maxCount = Math.max(...data.priceDistro.map((x) => x.count));
                      return (
                        <div key={b.bucket} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{b.bucket}</span>
                          <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                            <div
                              className="h-full rounded bg-blue-500/50"
                              style={{ width: `${(b.count / maxCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground w-8">{b.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Weekly new listings */}
            <div>
              <SectionTitle icon={Activity} title="Velocidad del Mercado" subtitle="Nuevas publicaciones por semana" />
              <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow">
                {data.weeklyNew.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos</p>
                ) : (
                  <div className="flex items-end gap-2 h-32">
                    {data.weeklyNew.map((w) => {
                      const maxCount = Math.max(...data.weeklyNew.map((x) => x.count));
                      const height = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
                      return (
                        <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] font-medium text-foreground">{w.count}</span>
                          <div className="w-full rounded-t bg-purple-500/40 hover:bg-purple-500/60 transition-colors" style={{ height: `${height}%` }} />
                          <span className="text-[8px] text-muted-foreground">S{w.week?.slice(-2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Condition breakdown */}
            <div>
              <SectionTitle icon={Building2} title="Condicion" subtitle="Nuevo vs Usado" />
              <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow">
                {data.condition.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos</p>
                ) : (
                  <div className="space-y-3">
                    {data.condition.map((c) => (
                      <div key={c.condition} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{c.condition || "Sin especificar"}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{fmtUsd(c.avgPrice)} avg</span>
                          <span className="text-sm font-bold text-foreground">{c.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top sellers */}
          <SectionTitle icon={Users} title="Top Vendedores" subtitle="Quienes publican mas (competencia)" />
          <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow">
            {data.topSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos de vendedores</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.topSellers.map((s, i) => (
                  <div key={s.seller} className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-sm text-foreground truncate flex-1">{s.seller}</span>
                    <span className="text-xs font-bold text-primary">{s.count} props</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({ icon: Icon, label, value, color }: { icon: typeof Building2; label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className={`h-3.5 w-3.5 ${color || ""}`} />
        {label}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Building2; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
