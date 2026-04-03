import { Instagram, MessageCircle, Heart, Eye, AlertCircle, Settings, BarChart3 } from "lucide-react";
import Link from "next/link";
import { getIgMedia, getIgConversations } from "@/server/actions/instagram";
import { IgInboxTabs } from "@/components/marketing/instagram/inbox-tabs";

export default async function InstagramPage() {
  let media: Awaited<ReturnType<typeof getIgMedia>> = [];
  let conversations: Awaited<ReturnType<typeof getIgConversations>> = [];
  let error: string | null = null;

  try {
    [media, conversations] = await Promise.all([
      getIgMedia(6),
      getIgConversations(10),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al conectar con Instagram";
  }

  const hasData = media.length > 0;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Instagram className="h-6 w-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-foreground">Instagram</h1>
        </div>
        <Link
          href="/marketing/instagram/metrics"
          className="flex items-center gap-1.5 rounded-lg bg-pink-500/10 px-3 py-2 text-xs font-medium text-pink-400 hover:bg-pink-500/20 transition-colors"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Ver Metricas
        </Link>
      </div>

      {/* Alert banner */}
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

      {/* Quick stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            Posts recientes
          </div>
          <p className={`mt-1 text-xl font-bold ${hasData ? "text-foreground" : "text-muted-foreground/30"}`}>
            {media.length}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            Likes totales
          </div>
          <p className={`mt-1 text-xl font-bold ${hasData ? "text-foreground" : "text-muted-foreground/30"}`}>
            {media.reduce((sum, m) => sum + (m.like_count || 0), 0)}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            Conversaciones
          </div>
          <p className={`mt-1 text-xl font-bold ${hasData ? "text-foreground" : "text-muted-foreground/30"}`}>
            {conversations.length}
          </p>
        </div>
      </div>

      {/* Tabs or placeholder */}
      {hasData ? (
        <IgInboxTabs media={media} conversations={conversations} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 card-shadow opacity-30">
              <div className="flex gap-3">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
