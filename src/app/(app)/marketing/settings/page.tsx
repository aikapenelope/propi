import { Instagram, Facebook, MessageCircle, Mail, ShoppingBag, Wallet, ChevronRight } from "lucide-react";
import { getAllSocialAccounts } from "@/server/actions/social-accounts";
import { formatDate } from "@/lib/utils";
import { SocialAccountForm } from "@/components/marketing/social-account-form";
import { WasiConfigForm } from "@/components/marketing/wasi-config-form";

export const dynamic = "force-dynamic";

export default async function MarketingSettingsPage(props: {
  searchParams: Promise<{ ml_success?: string; ml_error?: string }>;
}) {
  const accounts = await getAllSocialAccounts();
  const igAccount = accounts.find((a) => a.platform === "instagram");
  const fbAccount = accounts.find((a) => a.platform === "facebook");
  const waAccount = accounts.find((a) => a.platform === "whatsapp");
  const wasiAccount = accounts.find((a) => a.platform === "wasi");

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
        {/* Invite a friend */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent("Prueba Propi, el CRM inmobiliario que funciona en tu telefono. Contactos, propiedades, inbox unificado de WhatsApp/Instagram/Facebook, y analisis de mercado con IA. https://propi.aikalabs.cc")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl p-5 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "rgba(37, 211, 102, 0.1)" }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(37, 211, 102, 0.2)" }}
          >
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#25D366]">
              Invita a un amigo
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Comparte Propi por WhatsApp
            </p>
          </div>
        </a>

        {/* Plans, Payments & Support */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent("Hola, quiero informacion sobre los planes de Propi CRM")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl p-5 transition-all hover:opacity-90 active:scale-[0.98] border"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
            borderColor: "rgba(99,102,241,0.2)",
          }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Planes, Pagos y Soporte
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Actualiza tu plan o contacta soporte
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </a>

        {/* MercadoLibre (info only - no OAuth) */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <ShoppingBag className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">MercadoLibre</h2>
              <p className="text-xs text-muted-foreground">
                Analisis de mercado via Propi Magic
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="text-xs">
              MercadoLibre se usa para inteligencia de mercado (Propi Magic).
              Para publicar propiedades, hazlo directamente en{" "}
              <a
                href="https://www.mercadolibre.com.ve/publicar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mercadolibre.com.ve
              </a>{" "}
              y pega el link en la propiedad.
            </p>
          </div>
        </div>

        {/* Wasi */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Wasi</h2>
              <p className="text-xs text-muted-foreground">
                {wasiAccount
                  ? `Conectado: ${wasiAccount.platformAccountId}`
                  : "No conectado"}
              </p>
            </div>
          </div>
          <WasiConfigForm
            existing={
              wasiAccount
                ? {
                    idCompany: wasiAccount.platformAccountId,
                    wasiToken:
                      (wasiAccount.metadata as Record<string, string> | null)
                        ?.wasiToken || wasiAccount.accessToken,
                  }
                : undefined
            }
          />
        </div>

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

        {/* WhatsApp (Meta Cloud API) */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <MessageCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">WhatsApp</h2>
              <p className="text-xs text-muted-foreground">
                {waAccount
                  ? `Conectado: ${waAccount.accountName || waAccount.platformAccountId}`
                  : "No conectado"}
              </p>
            </div>
            {waAccount?.tokenExpiresAt && (
              <span className="ml-auto text-xs text-muted-foreground">
                Token expira: {formatDate(waAccount.tokenExpiresAt)}
              </span>
            )}
          </div>
          <SocialAccountForm
            platform="whatsapp"
            existing={
              waAccount
                ? {
                    platformAccountId: waAccount.platformAccountId,
                    accountName: waAccount.accountName,
                    accessToken: waAccount.accessToken,
                    tokenExpiresAt: waAccount.tokenExpiresAt?.toISOString(),
                  }
                : undefined
            }
          />
          <p className="mt-3 text-xs text-muted-foreground">
            El Platform Account ID es tu WhatsApp Business Phone Number ID.
            Usa el mismo access token de Meta que para Instagram/Facebook.
          </p>
        </div>

        {/* Email (Resend) */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Mail className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Email (Resend)</h2>
              <p className="text-xs text-muted-foreground">
                {process.env.RESEND_API_KEY ? "Configurado" : "No configurado"}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="mb-2">
              Configura Resend en las variables de entorno (1 sola key):
            </p>
            <code className="block rounded bg-background p-2 text-xs font-mono">
              RESEND_API_KEY=re_...
            </code>
            <p className="mt-2 text-xs">
              Gratis: 3,000 emails/mes. Obten tu key en{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                resend.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
