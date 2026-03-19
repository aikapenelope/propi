import { BarChart3, Eye, Users, Heart } from "lucide-react";
import { getIgMedia, getIgMediaInsights } from "@/server/actions/instagram";

export default async function InstagramMetricsPage() {
  let media: Awaited<ReturnType<typeof getIgMedia>> = [];
  let error: string | null = null;

  try {
    media = await getIgMedia(12);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al cargar metricas";
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          Metricas de Instagram
        </h1>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  // Fetch insights for each post (in parallel, max 6 to avoid rate limits)
  const mediaWithInsights = await Promise.all(
    media.slice(0, 6).map(async (post) => {
      try {
        const insights = await getIgMediaInsights(post.id);
        return { ...post, insights };
      } catch {
        return { ...post, insights: [] };
      }
    }),
  );

  const totalLikes = media.reduce((s, m) => s + (m.like_count || 0), 0);
  const totalComments = media.reduce(
    (s, m) => s + (m.comments_count || 0),
    0,
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-pink-500" />
        <h1 className="text-2xl font-bold text-foreground">
          Metricas de Instagram
        </h1>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            Posts analizados
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">
            {media.length}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            Total likes
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">
            {totalLikes}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Total comentarios
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">
            {totalComments}
          </p>
        </div>
      </div>

      {/* Per-post insights */}
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Detalle por Post
      </h2>
      <div className="space-y-3">
        {mediaWithInsights.map((post) => {
          const impressions =
            post.insights.find((i) => i.name === "impressions")?.values[0]
              ?.value || 0;
          const reach =
            post.insights.find((i) => i.name === "reach")?.values[0]?.value ||
            0;
          const engagement =
            post.insights.find((i) => i.name === "engagement")?.values[0]
              ?.value || 0;

          return (
            <div
              key={post.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              {post.media_url && (
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.media_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground line-clamp-1">
                  {post.caption || "(sin caption)"}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{post.like_count || 0} likes</span>
                  <span>{post.comments_count || 0} comentarios</span>
                  <span>{impressions} impresiones</span>
                  <span>{reach} alcance</span>
                  <span>{engagement} engagement</span>
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(post.timestamp).toLocaleDateString("es")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
