import { DollarSign, BarChart3, TrendingUp, Hash } from "lucide-react";

interface KPIs {
  total: number;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  medianPrice: number | null;
  avgPriceM2: number | null;
}

export function KPIBar({ kpis }: { kpis: KPIs }) {
  if (kpis.total === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-3">
      <div className="rounded-xl border border-border bg-background p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
          <Hash className="h-3 w-3" /> Total
        </div>
        <div className="text-lg font-extrabold text-foreground">{kpis.total}</div>
      </div>
      {kpis.avgPriceM2 && (
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
            <DollarSign className="h-3 w-3" /> Precio/m2
          </div>
          <div className="text-lg font-extrabold text-foreground">
            ${kpis.avgPriceM2.toLocaleString()}
          </div>
        </div>
      )}
      {kpis.medianPrice && (
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
            <BarChart3 className="h-3 w-3" /> Mediana
          </div>
          <div className="text-lg font-extrabold text-foreground">
            ${kpis.medianPrice.toLocaleString()}
          </div>
        </div>
      )}
      {kpis.minPrice && kpis.maxPrice && (
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
            <TrendingUp className="h-3 w-3" /> Rango
          </div>
          <div className="text-sm font-bold text-foreground">
            ${kpis.minPrice.toLocaleString()} - ${kpis.maxPrice.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
