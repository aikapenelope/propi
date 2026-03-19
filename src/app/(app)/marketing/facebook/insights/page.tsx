import { BarChart3, Eye, Users, ThumbsUp } from "lucide-react";
import { getFbPageInsights } from "@/server/actions/facebook";

export default async function FacebookInsightsPage() {
  let insights: Awaited<ReturnType<typeof getFbPageInsights>> = [];
  let error: string | null = null;

  try {
    insights = await getFbPageInsights();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al cargar insights";
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          Facebook Insights
        </h1>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  const metricLabels: Record<string, { label: string; icon: typeof Eye }> = {
    page_impressions: { label: "Impresiones", icon: Eye },
    page_engaged_users: { label: "Usuarios Activos", icon: ThumbsUp },
    page_fans: { label: "Seguidores", icon: Users },
    page_views_total: { label: "Visitas a la Pagina", icon: BarChart3 },
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-foreground">
          Facebook Insights
        </h1>
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay datos de insights disponibles. La pagina necesita al menos 100
          likes.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {insights.map((metric) => {
            const meta = metricLabels[metric.name];
            const latestValue = metric.values[metric.values.length - 1];
            const displayValue =
              typeof latestValue?.value === "number"
                ? latestValue.value
                : 0;
            const Icon = meta?.icon || Eye;

            return (
              <div
                key={metric.name}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {meta?.label || metric.name}
                </div>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {displayValue.toLocaleString("es")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Periodo: {metric.period}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
