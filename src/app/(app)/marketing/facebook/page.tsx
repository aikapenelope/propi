import { Facebook, ThumbsUp, MessageCircle } from "lucide-react";
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

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Facebook className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-foreground">Facebook</h1>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

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
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Insights
          </Link>
        </div>
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay posts recientes
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border border-border p-4"
            >
              <div className="flex items-start gap-3">
                {post.full_picture && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
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
      )}
    </div>
  );
}
