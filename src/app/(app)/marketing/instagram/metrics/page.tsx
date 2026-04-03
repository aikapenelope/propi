import {
  Instagram,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  AlertCircle,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { getIgMedia, getIgMediaInsights } from "@/server/actions/instagram";

export const dynamic = "force-dynamic";

export default async function InstagramMetricsPage() {
  let media: Awaited<ReturnType<typeof getIgMedia>> = [];
  let error: string | null = null;

  try {
    media = await getIgMedia(12);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al cargar metricas";
  }

  // Fetch insights for top 6 posts (only if we have data)
  const mediaWithInsights =
    media.length > 0
      ? await Promise.all(
          media.slice(0, 6).map(async (post) => {
            try {
              const insights = await getIgMediaInsights(post.id);
              return { ...post, insights };
            } catch {
              return { ...post, insights: [] };
            }
          }),
        )
      : [];

  const totalLikes = media.reduce((s, m) => s + (m.like_count || 0), 0);
  const totalComments = media.reduce((s, m) => s + (m.comments_count || 0), 0);
  const avgEngagement =
    media.length > 0
      ? ((totalLikes + totalComments) / media.length).toFixed(1)
      : "0";

  const hasData = media.length > 0;

  return (
    <div className="max-w-[1200px] mx-auto px-3 md:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
          <Instagram className="h-5 w-5 text-pink-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Metricas de Instagram
          </h1>
          <p className="text-xs text-muted-foreground">
            {hasData ? `Ultimos ${media.length} posts` : "Dashboard de rendimiento"}
          </p>
        </div>
      </div>

      {/* Alert banner (subtle) */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-2.5 mb-6">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-400 flex-1">
            Conecta tu cuenta de Instagram en{" "}
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
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Eye className="h-3.5 w-3.5" /> Posts
          </div>
          <p className={`text-2xl font-bold ${hasData ? "text-foreground" : "text-muted-foreground/30"}`}>
            {hasData ? media.length : "0"}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Heart className="h-3.5 w-3.5 text-pink-500" /> Likes
          </div>
          <p className={`text-2xl font-bold ${hasData ? "text-foreground" : "text-muted-foreground/30"}`}>
            {hasData ? totalLikes.toLocaleString() : "0"}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <MessageCircle className="h-3.5 w-3.5" /> Comentarios
          </div>
          <p className={`text-2xl font-bold ${hasData ? "text-foreground" : "text-muted-foreground/30"}`}>
            {hasData ? totalComments.toLocaleString() : "0"}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Avg Engagement
          </div>
          <p className={`text-2xl font-bold ${hasData ? "text-foreground" : "text-muted-foreground/30"}`}>
            {avgEngagement}
          </p>
        </div>
      </div>

      {/* Posts grid - always visible */}
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Detalle por Post
      </h2>

      {hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mediaWithInsights.map((post) => {
            const impressions =
              post.insights.find((i) => i.name === "impressions")?.values[0]
                ?.value || 0;
            const reach =
              post.insights.find((i) => i.name === "reach")?.values[0]?.value ||
              0;

            return (
              <div
                key={post.id}
                className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow flex gap-3 min-w-0"
              >
                {post.media_url && (
                  <div className="w-16 h-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.media_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground line-clamp-1 font-medium">
                    {post.caption || "(sin caption)"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-pink-500" />
                      {post.like_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {impressions}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      {reach}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(post.timestamp).toLocaleDateString("es")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow flex gap-3 min-w-0 opacity-30"
            >
              <div className="w-16 h-16 shrink-0 rounded-xl bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="flex gap-3">
                  <div className="h-3 w-12 rounded bg-muted" />
                  <div className="h-3 w-12 rounded bg-muted" />
                  <div className="h-3 w-12 rounded bg-muted" />
                </div>
                <div className="h-2 w-16 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
