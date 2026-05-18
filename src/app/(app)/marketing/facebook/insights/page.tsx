import {
  Facebook,
  Eye,
  Users,
  ThumbsUp,
  TrendingUp,
  AlertCircle,
  Settings,
} from "lucide-react";
import Link from "next/link";
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

  // Filter deprecated metrics
  const validInsights = insights.filter(
    (m) => m.name !== "page_fans" && m.name !== "page_impressions",
  );

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
  };

  const hasData = validInsights.length > 0;

  // Placeholder KPIs when no data
  const placeholderKPIs = [
    { label: "Visitas a la Pagina", icon: Eye, color: "text-blue-400" },
    { label: "Usuarios Activos", icon: ThumbsUp, color: "text-purple-400" },
    { label: "Interacciones", icon: TrendingUp, color: "text-primary" },
    { label: "Nuevos Seguidores", icon: Users, color: "text-amber-400" },
  ];

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
            {hasData ? "Metricas de tu pagina" : "Dashboard de rendimiento"}
          </p>
        </div>
      </div>

      {/* Alert banner (subtle) */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-2.5 mb-6">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-400 flex-1">
            Conecta tu pagina de Facebook en{" "}
            <Link href="/marketing/settings" className="underline font-medium">
              Configuracion
            </Link>{" "}
            para ver datos reales.
          </p>
          <Link
            href="/marketing/settings"
            className="shrink-0 flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Settings className="h-3 w-3" />
            Conectar
          </Link>
        </div>
      )}

      {/* KPI Cards - always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {hasData
          ? validInsights.map((metric) => {
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
            })
          : placeholderKPIs.map((kpi) => (
              <div
                key={kpi.label}
                className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  {kpi.label}
                </div>
                <p className="text-2xl font-bold text-muted-foreground/30">0</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Periodo: --
                </p>
              </div>
            ))}
      </div>

      {/* Recent Posts - always visible */}
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Posts Recientes
      </h2>

      {posts.length > 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0 opacity-30"
            >
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
