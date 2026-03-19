import { MessageCircle, Send, CheckCheck, AlertCircle } from "lucide-react";
import { getWhatsAppMessages } from "@/server/actions/whatsapp";
import { formatDate } from "@/lib/utils";
import { WhatsAppSendForm } from "@/components/marketing/whatsapp/wa-send-form";

const statusIcons: Record<string, typeof Send> = {
  queued: Send,
  sent: Send,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
};

const statusLabels: Record<string, string> = {
  queued: "En cola",
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leido",
  failed: "Fallido",
};

export default async function WhatsAppPage() {
  let messages: Awaited<ReturnType<typeof getWhatsAppMessages>> = [];
  let error: string | null = null;

  try {
    messages = await getWhatsAppMessages(50);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al cargar mensajes";
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-bold text-foreground">
          WhatsApp Marketing
        </h1>
      </div>

      {/* Send form */}
      <div className="mb-6 max-w-xl">
        <WhatsAppSendForm />
      </div>

      {/* Message history */}
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Historial de Mensajes
      </h2>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay mensajes enviados
        </p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const StatusIcon = statusIcons[msg.status] || Send;
            return (
              <div
                key={msg.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <StatusIcon
                  className={`h-4 w-4 shrink-0 ${
                    msg.status === "failed"
                      ? "text-destructive"
                      : msg.status === "read"
                        ? "text-blue-500"
                        : "text-green-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {msg.contact.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {msg.body || msg.template || "(template)"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`text-xs font-medium ${
                      msg.status === "failed"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {statusLabels[msg.status] || msg.status}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
