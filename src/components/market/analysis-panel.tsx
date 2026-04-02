import {
  DollarSign,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/groq";

const positionConfig = {
  above_market: { label: "Por encima", icon: ArrowUp, color: "text-amber-600", bg: "bg-amber-50" },
  competitive: { label: "Competitivo", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  below_market: { label: "Por debajo", icon: ArrowDown, color: "text-blue-600", bg: "bg-blue-50" },
};

const confidenceConfig = {
  high: { label: "Alta", color: "text-green-600" },
  medium: { label: "Media", color: "text-amber-600" },
  low: { label: "Baja", color: "text-red-500" },
};

export function AnalysisPanel({ analysis }: { analysis: AnalysisResult }) {
  const pos = positionConfig[analysis.user_position] || positionConfig.competitive;
  const conf = confidenceConfig[analysis.confidence] || confidenceConfig.medium;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-3.5 w-3.5" />
            Precio/m2
          </div>
          <div className="text-xl font-extrabold text-foreground">
            {analysis.avg_price_m2
              ? `$${Math.round(analysis.avg_price_m2).toLocaleString()}`
              : "N/A"}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <BarChart3 className="h-3.5 w-3.5" />
            Mediana
          </div>
          <div className="text-xl font-extrabold text-foreground">
            ${analysis.price_range?.median
              ? Math.round(analysis.price_range.median).toLocaleString()
              : "N/A"}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Analizadas
          </div>
          <div className="text-xl font-extrabold text-foreground">
            {analysis.total_analyzed}
          </div>
        </div>

        <div className={`rounded-2xl p-4 ${pos.bg}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <pos.icon className={`h-3.5 w-3.5 ${pos.color}`} />
            Posicion
          </div>
          <div className={`text-xl font-extrabold ${pos.color}`}>
            {pos.label}
          </div>
        </div>
      </div>

      {/* Suggested price */}
      {analysis.suggested_price && (
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
          <div className="text-xs font-semibold text-primary mb-1">
            Precio sugerido
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            ${Math.round(analysis.suggested_price).toLocaleString()}
            {analysis.suggested_price_range && (
              <span className="text-sm font-medium text-muted-foreground ml-2">
                (${Math.round(analysis.suggested_price_range.low).toLocaleString()} - ${Math.round(analysis.suggested_price_range.high).toLocaleString()})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {analysis.summary && (
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-sm text-foreground leading-relaxed">
            {analysis.summary}
          </p>
        </div>
      )}

      {/* Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Insights
          </div>
          <ul className="space-y-1.5">
            {analysis.insights.map((insight, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">-</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence */}
      <div className="text-xs text-muted-foreground">
        Confianza del analisis: <span className={`font-semibold ${conf.color}`}>{conf.label}</span>
        {" "}({analysis.total_analyzed} propiedades analizadas)
      </div>
    </div>
  );
}
