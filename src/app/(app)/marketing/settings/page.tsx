import { Instagram, Facebook, MessageCircle, Mail } from "lucide-react";
import { getAllSocialAccounts } from "@/server/actions/social-accounts";
import { formatDate } from "@/lib/utils";
import { SocialAccountForm } from "@/components/marketing/social-account-form";

export default async function MarketingSettingsPage() {
  const accounts = await getAllSocialAccounts();
  const igAccount = accounts.find((a) => a.platform === "instagram");
  const fbAccount = accounts.find((a) => a.platform === "facebook");

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        Configuracion de Marketing
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Conecta tus cuentas de redes sociales y configura los canales de
        marketing.
      </p>

      <div className="grid gap-6 max-w-2xl">
        {/* Instagram */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
              <Instagram className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Instagram</h2>
              <p className="text-xs text-muted-foreground">
                {igAccount
                  ? `Conectado: ${igAccount.accountName || igAccount.platformAccountId}`
                  : "No conectado"}
              </p>
            </div>
            {igAccount?.tokenExpiresAt && (
              <span className="ml-auto text-xs text-muted-foreground">
                Token expira: {formatDate(igAccount.tokenExpiresAt)}
              </span>
            )}
          </div>
          <SocialAccountForm
            platform="instagram"
            existing={
              igAccount
                ? {
                    platformAccountId: igAccount.platformAccountId,
                    accountName: igAccount.accountName,
                    accessToken: igAccount.accessToken,
                    tokenExpiresAt: igAccount.tokenExpiresAt?.toISOString(),
                  }
                : undefined
            }
          />
        </div>

        {/* Facebook */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10">
              <Facebook className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Facebook</h2>
              <p className="text-xs text-muted-foreground">
                {fbAccount
                  ? `Conectado: ${fbAccount.accountName || fbAccount.platformAccountId}`
                  : "No conectado"}
              </p>
            </div>
            {fbAccount?.tokenExpiresAt && (
              <span className="ml-auto text-xs text-muted-foreground">
                Token expira: {formatDate(fbAccount.tokenExpiresAt)}
              </span>
            )}
          </div>
          <SocialAccountForm
            platform="facebook"
            existing={
              fbAccount
                ? {
                    platformAccountId: fbAccount.platformAccountId,
                    accountName: fbAccount.accountName,
                    accessToken: fbAccount.accessToken,
                    tokenExpiresAt: fbAccount.tokenExpiresAt?.toISOString(),
                  }
                : undefined
            }
          />
        </div>

        {/* WhatsApp (Twilio) */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <MessageCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                WhatsApp (Twilio)
              </h2>
              <p className="text-xs text-muted-foreground">
                Configurado via variables de entorno
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="mb-2">
              Las credenciales de Twilio se configuran en las variables de
              entorno del servidor:
            </p>
            <code className="block rounded bg-background p-2 text-xs font-mono">
              TWILIO_ACCOUNT_SID=ACxxxxxxxx
              <br />
              TWILIO_AUTH_TOKEN=xxxxxxxx
              <br />
              TWILIO_WHATSAPP_NUMBER=+14155238886
            </code>
          </div>
        </div>

        {/* Email (SMTP) */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Mail className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Email (SMTP)</h2>
              <p className="text-xs text-muted-foreground">
                Configurado via variables de entorno
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="mb-2">
              Configura tu servidor SMTP en las variables de entorno:
            </p>
            <code className="block rounded bg-background p-2 text-xs font-mono">
              SMTP_HOST=smtp.gmail.com
              <br />
              SMTP_PORT=587
              <br />
              SMTP_USER=tu@email.com
              <br />
              SMTP_PASS=app-password
              <br />
              SMTP_FROM=&quot;Propi&quot; &lt;tu@email.com&gt;
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
