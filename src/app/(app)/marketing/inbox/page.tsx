import { MessageCircle, Instagram, Facebook } from "lucide-react";
import { getConversations } from "@/server/actions/messaging";

const platformIcons: Record<string, typeof MessageCircle> = {
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: MessageCircle,
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
};

export default async function InboxPage() {
  const allConversations = await getConversations();

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
        <span className="text-sm text-muted-foreground">
          {allConversations.length} conversacion
          {allConversations.length !== 1 ? "es" : ""}
        </span>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Conversaciones unificadas de Instagram, Facebook y WhatsApp. La UI de
        chat se conectara aqui.
      </p>

      {allConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No hay conversaciones
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Los mensajes entrantes apareceran aqui cuando configures el webhook
            de Meta.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allConversations.map((convo) => {
            const Icon = platformIcons[convo.platform] || MessageCircle;
            const lastMsg = convo.messages[0];
            return (
              <div
                key={convo.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">
                      {convo.participantName || convo.participantExternalId || "Desconocido"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {platformLabels[convo.platform]}
                    </span>
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-muted-foreground truncate">
                      {lastMsg.direction === "outbound" ? "Tu: " : ""}
                      {lastMsg.body || "[media]"}
                    </p>
                  )}
                </div>
                {convo.lastMessageAt && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(convo.lastMessageAt).toLocaleDateString("es")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
