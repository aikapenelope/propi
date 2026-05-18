import { Facebook, ExternalLink, Info, Image, MessageCircle, BarChart3, ThumbsUp } from "lucide-react";
import { ENABLE_META_INBOX } from "@/lib/feature-flags";

// Dynamic import for API-connected version
async function FacebookAPIPage() {
  const { getFbPosts } = await import("@/server/actions/facebook");
  const { FbReplyForm } = await import("@/components/marketing/facebook/fb-reply-form");
  const Link = (await import("next/link")).default;

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

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 mb-6 text-sm text-red-400">
          {error}. Ve a Configuracion para conectar tu cuenta.
        </div>
      )}

      {hasData ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow">
              <p className="text-sm text-foreground line-clamp-2">{post.message || "(sin texto)"}</p>
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{post.likes?.summary.total_count || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.comments?.summary.total_count || 0}</span>
              </div>
              {post.comments?.data && post.comments.data.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <FbReplyForm postId={post.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No hay datos. Conecta tu pagina en Configuracion.</p>
      )}
    </div>
  );
}

// Assisted publishing version
function FacebookAssistedPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Facebook className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-foreground">Facebook</h1>
      </div>

      <div className="max-w-xl space-y-6">
        <div className="rounded-lg border border-border bg-accent p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Publica en Facebook desde aqui</p>
              <p className="text-muted-foreground">
                Usa estos accesos directos para publicar en tu pagina,
                responder comentarios y ver las metricas de tus publicaciones.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AssistedButton
            url="https://www.facebook.com/"
            icon={<Facebook className="h-5 w-5 text-blue-600" />}
            label="Abrir Facebook"
            description="Inicia sesion y gestiona tu pagina"
          />
          <AssistedButton
            url="https://business.facebook.com/latest/composer"
            icon={<Image className="h-5 w-5 text-blue-600" />}
            label="Crear Publicacion"
            description="Publica en tu pagina desde Business Suite"
          />
          <AssistedButton
            url="https://business.facebook.com/latest/inbox"
            icon={<MessageCircle className="h-5 w-5 text-blue-600" />}
            label="Bandeja de Entrada"
            description="Responde mensajes y comentarios"
          />
          <AssistedButton
            url="https://business.facebook.com/latest/insights"
            icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
            label="Ver Metricas"
            description="Alcance, interacciones y seguidores"
          />
        </div>

        <div className="rounded-lg border border-border p-4 text-sm">
          <p className="font-medium text-foreground mb-2">
            Tips para realtors en Facebook
          </p>
          <ul className="space-y-1.5 text-muted-foreground text-xs">
            <li className="flex items-start gap-2">
              <ThumbsUp className="h-3 w-3 mt-0.5 text-blue-400 shrink-0" />
              Publica propiedades con descripcion detallada y multiples fotos
            </li>
            <li className="flex items-start gap-2">
              <ThumbsUp className="h-3 w-3 mt-0.5 text-blue-400 shrink-0" />
              Usa Facebook Marketplace para llegar a compradores locales
            </li>
            <li className="flex items-start gap-2">
              <ThumbsUp className="h-3 w-3 mt-0.5 text-blue-400 shrink-0" />
              Responde comentarios rapido para mejorar el alcance organico
            </li>
            <li className="flex items-start gap-2">
              <ThumbsUp className="h-3 w-3 mt-0.5 text-blue-400 shrink-0" />
              Comparte la pagina publica de Propi (/p/id) en tus publicaciones
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function AssistedButton({ url, icon, label, description }: { url: string; icon: React.ReactNode; label: string; description: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors group"
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

export default async function FacebookPage() {
  if (ENABLE_META_INBOX) {
    return FacebookAPIPage();
  }
  return <FacebookAssistedPage />;
}
