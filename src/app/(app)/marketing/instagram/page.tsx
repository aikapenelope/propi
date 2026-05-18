import { Instagram, ExternalLink, Info, Image, MessageCircle, BarChart3, Heart } from "lucide-react";
import { ENABLE_META_INBOX } from "@/lib/feature-flags";

// Dynamic import for API-connected version (only when Meta inbox enabled)
async function InstagramAPIPage() {
  const { getIgMedia, getIgConversations } = await import("@/server/actions/instagram");
  const { IgInboxTabs } = await import("@/components/marketing/instagram/inbox-tabs");

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

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Instagram className="h-6 w-6 text-pink-500" />
        <h1 className="text-2xl font-bold text-foreground">Instagram</h1>
      </div>
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 mb-6 text-sm text-red-400">
          {error}. Ve a Configuracion para conectar tu cuenta.
        </div>
      )}
      <IgInboxTabs media={media} conversations={conversations} />
    </div>
  );
}

// Assisted publishing version (no API needed)
function InstagramAssistedPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Instagram className="h-6 w-6 text-pink-500" />
        <h1 className="text-2xl font-bold text-foreground">Instagram</h1>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Info card */}
        <div className="rounded-lg border border-border bg-accent p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-pink-500 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Publica en Instagram desde aqui</p>
              <p className="text-muted-foreground">
                Usa estos accesos directos para publicar contenido, responder
                mensajes y ver tus metricas en Instagram. Abre la app o el
                sitio web directamente.
              </p>
            </div>
          </div>
        </div>

        {/* Launch buttons */}
        <div className="grid gap-3 sm:grid-cols-2">
          <AssistedButton
            url="https://www.instagram.com/accounts/login/"
            icon={<Instagram className="h-5 w-5 text-pink-500" />}
            label="Abrir Instagram"
            description="Inicia sesion y gestiona tu cuenta"
          />
          <AssistedButton
            url="https://www.instagram.com/create/style/"
            icon={<Image className="h-5 w-5 text-pink-500" />}
            label="Crear Publicacion"
            description="Sube fotos o reels desde el navegador"
          />
          <AssistedButton
            url="https://www.instagram.com/direct/inbox/"
            icon={<MessageCircle className="h-5 w-5 text-pink-500" />}
            label="Mensajes Directos"
            description="Responde DMs de clientes"
          />
          <AssistedButton
            url="https://www.instagram.com/accounts/insights/"
            icon={<BarChart3 className="h-5 w-5 text-pink-500" />}
            label="Ver Metricas"
            description="Alcance, impresiones y engagement"
          />
        </div>

        {/* Tips */}
        <div className="rounded-lg border border-border p-4 text-sm">
          <p className="font-medium text-foreground mb-2">
            Tips para realtors en Instagram
          </p>
          <ul className="space-y-1.5 text-muted-foreground text-xs">
            <li className="flex items-start gap-2">
              <Heart className="h-3 w-3 mt-0.5 text-pink-400 shrink-0" />
              Publica fotos de propiedades con buena iluminacion y angulos amplios
            </li>
            <li className="flex items-start gap-2">
              <Heart className="h-3 w-3 mt-0.5 text-pink-400 shrink-0" />
              Usa Reels para tours virtuales de 30-60 segundos
            </li>
            <li className="flex items-start gap-2">
              <Heart className="h-3 w-3 mt-0.5 text-pink-400 shrink-0" />
              Responde DMs rapido: los clientes esperan respuesta en menos de 1 hora
            </li>
            <li className="flex items-start gap-2">
              <Heart className="h-3 w-3 mt-0.5 text-pink-400 shrink-0" />
              Usa la pagina publica de Propi (/p/id) como link en tu bio
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

export default async function InstagramPage() {
  if (ENABLE_META_INBOX) {
    return InstagramAPIPage();
  }
  return <InstagramAssistedPage />;
}
