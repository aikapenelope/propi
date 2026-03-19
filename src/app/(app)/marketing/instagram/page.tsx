import { Instagram, MessageCircle, Heart, Eye } from "lucide-react";
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

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Instagram className="h-6 w-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-foreground">Instagram</h1>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Instagram className="h-6 w-6 text-pink-500" />
        <h1 className="text-2xl font-bold text-foreground">Instagram</h1>
      </div>

      {/* Quick stats from recent media */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            Posts recientes
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">
            {media.length}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            Likes totales
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">
            {media.reduce((sum, m) => sum + (m.like_count || 0), 0)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            Conversaciones
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">
            {conversations.length}
          </p>
        </div>
      </div>

      {/* Tabs: DMs and Comments */}
      <IgInboxTabs media={media} conversations={conversations} />
    </div>
  );
}
