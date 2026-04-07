import { Instagram, Facebook, MessageCircle, Mail, ShoppingBag, Wallet, ChevronRight } from "lucide-react";
import { getAllSocialAccounts } from "@/server/actions/social-accounts";
import { formatDate } from "@/lib/utils";
import { SocialAccountForm } from "@/components/marketing/social-account-form";
import { WasiConfigForm } from "@/components/marketing/wasi-config-form";
import { TokenExpiryWarning } from "@/components/marketing/token-expiry-warning";
import { SetupGuide } from "@/components/marketing/setup-guide";

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
              <span className="ml-auto flex items-center gap-2">
                <TokenExpiryWarning expiresAt={igAccount.tokenExpiresAt} />
                <span className="text-xs text-muted-foreground">
                  Token expira: {formatDate(igAccount.tokenExpiresAt)}
                </span>
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
          <SetupGuide
            title="Como obtener tu token de Instagram"
            steps={[
              {
                text: "Tu cuenta de Instagram debe ser Profesional (Business o Creator). Si es personal, conviertela desde Instagram > Configuracion > Cuenta > Cambiar a cuenta profesional.",
              },
              {
                text: "Tu cuenta de Instagram debe estar conectada a una Pagina de Facebook. Ve a Instagram > Configuracion > Cuenta > Cuentas vinculadas > Facebook.",
              },
              {
                text: "Abre el Explorador de la Graph API de Meta. Inicia sesion con tu cuenta de Facebook.",
                link: { url: "https://developers.facebook.com/tools/explorer/", label: "Abrir Graph API Explorer" },
              },
              {
                text: "En la parte superior, selecciona tu aplicacion de Meta (o 'Meta App'). Si no tienes una, crea una en developers.facebook.com/apps.",
                link: { url: "https://developers.facebook.com/apps/", label: "Crear App" },
              },
              {
                text: "Haz click en 'Generate Access Token'. Selecciona los permisos: instagram_basic, instagram_manage_messages, pages_show_list, pages_manage_metadata.",
              },
              {
                text: "Copia el token generado. Este es un token de corta duracion (1 hora).",
              },
              {
                text: "Para extenderlo a 60 dias, abre el Depurador de Tokens, pega tu token, y haz click en 'Extend Access Token'.",
                link: { url: "https://developers.facebook.com/tools/debug/accesstoken/", label: "Abrir Depurador de Tokens" },
              },
              {
                text: "Para obtener tu Instagram Business Account ID, en el Graph API Explorer haz la consulta: me/accounts?fields=instagram_business_account. Copia el id que aparece.",
              },
              {
                text: "Pega el Instagram Business Account ID en 'Platform Account ID' y el token extendido en 'Access Token' arriba. El token expira en 60 dias, Propi te avisara cuando falten 7 dias.",
              },
            ]}
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
              <span className="ml-auto flex items-center gap-2">
                <TokenExpiryWarning expiresAt={fbAccount.tokenExpiresAt} />
                <span className="text-xs text-muted-foreground">
                  Token expira: {formatDate(fbAccount.tokenExpiresAt)}
                </span>
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
          <SetupGuide
            title="Como obtener tu token de Facebook"
            steps={[
              {
                text: "Necesitas una Pagina de Facebook (no un perfil personal). Si no tienes una, creala desde facebook.com/pages/create.",
                link: { url: "https://www.facebook.com/pages/create", label: "Crear Pagina" },
              },
              {
                text: "Abre el Explorador de la Graph API de Meta e inicia sesion.",
                link: { url: "https://developers.facebook.com/tools/explorer/", label: "Abrir Graph API Explorer" },
              },
              {
                text: "Selecciona tu aplicacion de Meta en la parte superior.",
              },
              {
                text: "Haz click en 'Generate Access Token'. Selecciona los permisos: pages_messaging, pages_manage_metadata, pages_show_list, pages_read_engagement.",
              },
              {
                text: "Ahora necesitas un Page Access Token. En el Graph API Explorer, haz la consulta: me/accounts. Busca tu pagina en la lista y copia el 'access_token' y el 'id' de esa pagina.",
              },
              {
                text: "El Page Access Token derivado de un token de larga duracion no expira. Para extender tu User Token primero, usa el Depurador de Tokens.",
                link: { url: "https://developers.facebook.com/tools/debug/accesstoken/", label: "Abrir Depurador de Tokens" },
              },
              {
                text: "Pega el Page ID en 'Platform Account ID' y el Page Access Token en 'Access Token' arriba.",
              },
            ]}
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
              <span className="ml-auto flex items-center gap-2">
                <TokenExpiryWarning expiresAt={waAccount.tokenExpiresAt} />
                <span className="text-xs text-muted-foreground">
                  Token expira: {formatDate(waAccount.tokenExpiresAt)}
                </span>
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
          </p>
          <SetupGuide
            title="Como obtener tu token de WhatsApp"
            steps={[
              {
                text: "Necesitas una cuenta de Meta Business Suite. Si no tienes una, creala en business.facebook.com.",
                link: { url: "https://business.facebook.com/", label: "Abrir Meta Business Suite" },
              },
              {
                text: "Ve al panel de WhatsApp en Meta for Developers. Si no tienes el producto WhatsApp agregado a tu app, agregalo desde el Dashboard de tu app.",
                link: { url: "https://developers.facebook.com/apps/", label: "Abrir Apps" },
              },
              {
                text: "En tu app > WhatsApp > API Setup, veras tu Phone Number ID y un token temporal. Copia el Phone Number ID.",
                link: { url: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/", label: "Ver guia oficial" },
              },
              {
                text: "El token temporal dura 24 horas. Para un token permanente, crea un System User en Meta Business Suite > Settings > Business Settings > Users > System Users.",
                link: { url: "https://business.facebook.com/settings/system-users/", label: "Abrir System Users" },
              },
              {
                text: "Crea un System User con rol Admin. Luego haz click en 'Generate New Token', selecciona tu app, y marca los permisos: whatsapp_business_messaging, whatsapp_business_management.",
              },
              {
                text: "Este token de System User no expira. Copialo.",
              },
              {
                text: "Pega el Phone Number ID en 'Platform Account ID' y el System User Token en 'Access Token' arriba.",
              },
              {
                text: "IMPORTANTE: No puedes usar tu numero personal de WhatsApp. Al registrar un numero en la Cloud API, se desconecta de la app de WhatsApp y ya no podras usarla con ese numero. Necesitas un numero dedicado para Propi.",
              },
              {
                text: "Opciones de numero: (1) Compra un chip nuevo y usa ese numero. (2) Usa un numero de linea fija (la API acepta fijos, verifica por llamada de voz). (3) Usa un numero virtual. El numero que elijas sera el que tus clientes vean cuando les escribas.",
              },
            ]}
          />
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
