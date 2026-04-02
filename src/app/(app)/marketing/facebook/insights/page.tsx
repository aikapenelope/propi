import {
  Facebook,
  Eye,
  Users,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { getFbPageInsights, getFbPosts } from "@/server/actions/facebook";

export const dynamic = "force-dynamic";

export default async function FacebookInsightsPage() {
  let insights: Awaited<ReturnType<typeof getFbPageInsights>> = [];
  let posts: Awaited<ReturnType<typeof getFbPosts>> = [];
  let error: string | null = null;

  try {
    [insights, posts] = await Promise.all([
      getFbPageInsights(),
      getFbPosts(6),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al cargar insights";
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-3 md:px-8 py-4 md:py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <Facebook className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Facebook Insights
          </h1>
        </div>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  // Map metrics to display (page_fans deprecated Nov 2025, use page_views_total instead)
  const metricConfig: Record<
    string,
    { label: string; icon: typeof Eye; color: string }
  > = {
    page_views_total: {
      label: "Visitas a la Pagina",
      icon: Eye,
      color: "text-blue-400",
    },
    page_engaged_users: {
      label: "Usuarios Activos",
      icon: ThumbsUp,
      color: "text-purple-400",
    },
    page_post_engagements: {
      label: "Interacciones",
      icon: TrendingUp,
      color: "text-primary",
    },
    page_daily_follows: {
      label: "Nuevos Seguidores",
      icon: Users,
      color: "text-amber-400",
    },
    // Deprecated metrics - skip if returned
    page_fans: {
      label: "Seguidores (deprecado)",
      icon: Users,
      color: "text-muted-foreground",
    },
    page_impressions: {
      label: "Impresiones (deprecado)",
      icon: Eye,
      color: "text-muted-foreground",
    },
  };

  // Filter out deprecated metrics
  const validInsights = insights.filter(
    (m) => m.name !== "page_fans" && m.name !== "page_impressions",
  );

  return (
    <div className="max-w-[1200px] mx-auto px-3 md:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
          <Facebook className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Facebook Insights
          </h1>
          <p className="text-xs text-muted-foreground">
            Metricas de tu pagina de Facebook
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      {validInsights.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-6 card-shadow text-center">
          <p className="text-sm text-muted-foreground">
            No hay datos de insights disponibles. La pagina necesita al menos
            100 likes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {validInsights.map((metric) => {
            const config = metricConfig[metric.name];
            const latestValue = metric.values[metric.values.length - 1];
            const displayValue =
              typeof latestValue?.value === "number" ? latestValue.value : 0;
            const Icon = config?.icon || Eye;

            return (
              <div
                key={metric.name}
                className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Icon className={`h-3.5 w-3.5 ${config?.color || ""}`} />
                  {config?.label || metric.name}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {displayValue.toLocaleString("es")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Periodo: {metric.period}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Posts */}
      {posts.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Posts Recientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0"
              >
                <p className="text-sm text-foreground line-clamp-2 font-medium mb-2">
                  {post.message || "(sin texto)"}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {post.created_time && (
                    <span>
                      {new Date(post.created_time).toLocaleDateString("es")}
                    </span>
                  )}
                  {post.permalink_url && (
                    <a
                      href={post.permalink_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Ver en Facebook
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
