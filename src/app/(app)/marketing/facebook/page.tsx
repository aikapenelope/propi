import { Facebook, ThumbsUp, MessageCircle, AlertCircle, Settings, BarChart3 } from "lucide-react";
import { getFbPosts } from "@/server/actions/facebook";
import { FbReplyForm } from "@/components/marketing/facebook/fb-reply-form";
import Link from "next/link";

export default async function FacebookPage() {
  let posts: Awaited<ReturnType<typeof getFbPosts>> = [];
  let error: string | null = null;

  try {
    posts = await getFbPosts(10);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al conectar con Facebook";
  }

  const hasData = posts.length > 0;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Facebook className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-foreground">Facebook</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/marketing/facebook/publish"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Publicar
          </Link>
          <Link
            href="/marketing/facebook/insights"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Insights
          </Link>
        </div>
      </div>

      {/* Alert banner */}
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

      {/* Posts list or placeholder */}
      {hasData ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow"
            >
              <div className="flex items-start gap-3">
                {post.full_picture && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.full_picture}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground line-clamp-2">
                    {post.message || "(sin texto)"}
                  </p>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {post.likes?.summary.total_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments?.summary.total_count || 0}
                    </span>
                    <span>
                      {new Date(post.created_time).toLocaleDateString("es")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent comments */}
              {post.comments?.data && post.comments.data.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {post.comments.data.slice(0, 3).map((comment) => (
                    <div key={comment.id} className="text-sm">
                      <span className="font-medium text-foreground">
                        {comment.from?.name || "Usuario"}:
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {comment.message}
                      </span>
                    </div>
                  ))}
                  <FbReplyForm postId={post.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow opacity-30">
              <div className="flex gap-3">
                <div className="w-16 h-16 shrink-0 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="flex gap-3">
                    <div className="h-3 w-12 rounded bg-muted" />
                    <div className="h-3 w-12 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
