import { ExternalLink, Info } from "lucide-react";
import { TikTokLaunchButton } from "@/components/marketing/tiktok-launch-button";

export default function TikTokPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.98a8.18 8.18 0 0 0 4.76 1.52V7.05a4.84 4.84 0 0 1-1-.36z" />
        </svg>
        <h1 className="text-2xl font-bold text-foreground">TikTok</h1>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Info card */}
        <div className="rounded-lg border border-border bg-accent p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Acceso rapido a TikTok</p>
              <p className="text-muted-foreground">
                La API de TikTok requiere aprobacion especial como developer y
                un proceso de revision que puede tomar semanas. Por ahora, este
                boton te lleva directamente a TikTok para que puedas publicar y
                gestionar tu contenido desde ahi.
              </p>
              <p className="mt-2 text-muted-foreground">
                Cuando tengas acceso a la Content Posting API, podremos
                integrar publicacion directa desde Propi.
              </p>
            </div>
          </div>
        </div>

        {/* Launch buttons */}
        <div className="grid gap-3 sm:grid-cols-2">
          <TikTokLaunchButton
            url="https://www.tiktok.com/login"
            label="Abrir TikTok (Login)"
            description="Inicia sesion en TikTok en una ventana nueva"
          />
          <TikTokLaunchButton
            url="https://www.tiktok.com/creator#/upload"
            label="Subir Video"
            description="Ir directamente a subir contenido"
          />
          <TikTokLaunchButton
            url="https://www.tiktok.com/analytics"
            label="Ver Analiticas"
            description="Revisa las metricas de tu cuenta"
          />
          <TikTokLaunchButton
            url="https://www.tiktok.com/inbox"
            label="Bandeja de Entrada"
            description="Revisa mensajes y notificaciones"
          />
        </div>

        {/* Developer info */}
        <div className="rounded-lg border border-border p-4 text-sm">
          <p className="font-medium text-foreground mb-2">
            Para developers: Solicitar acceso a la API
          </p>
          <p className="text-muted-foreground mb-3">
            Si quieres integrar publicacion directa, necesitas registrar una
            app en TikTok for Developers y solicitar acceso a la Content
            Posting API.
          </p>
          <a
            href="https://developers.tiktok.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            TikTok for Developers
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
