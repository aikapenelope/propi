import Link from "next/link";
import { BarChart3, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AnalysisRecord {
  id: string;
  summary: string | null;
  confidence: string | null;
  totalAnalyzed: number | null;
  suggestedPrice: string | null;
  createdAt: Date | null;
}

export function AnalysisHistory({
  analyses,
  propertyId,
}: {
  analyses: AnalysisRecord[];
  propertyId: string;
}) {
  if (analyses.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
        Analisis anteriores
      </h3>
      <div className="space-y-2">
        {analyses.map((a) => (
          <Link
            key={a.id}
            href={`/properties/${propertyId}/analysis?id=${a.id}`}
            className="block rounded-xl border border-border bg-background p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {a.createdAt
                  ? formatDistanceToNow(a.createdAt, { addSuffix: true, locale: es })
                  : ""}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <BarChart3 className="h-3 w-3 text-primary" />
                {a.totalAnalyzed} props
              </div>
            </div>
            <p className="text-sm text-foreground line-clamp-2">
              {a.summary || "Analisis sin resumen"}
            </p>
            {a.suggestedPrice && (
              <p className="text-xs font-bold text-primary mt-1">
                Sugerido: ${Math.round(parseFloat(a.suggestedPrice)).toLocaleString()}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
