"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import {
  Shield,
  Clock,
  Building2,
  TrendingUp,
  LogOut,
  MessageCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Plan metadata helpers
// ---------------------------------------------------------------------------

interface PlanMetadata {
  plan?: string;
  trialEndsAt?: string;
  paidUntil?: string;
  active?: boolean;
}

function getPlanStatus(metadata: PlanMetadata) {
  const { plan, trialEndsAt, paidUntil, active } = metadata;

  if (active === false) return "inactive";
  if (!plan) return "no-plan";

  if (plan === "trial" && trialEndsAt) {
    const expiresAt = new Date(trialEndsAt);
    if (expiresAt < new Date()) return "trial-expired";
    return "trial-active";
  }

  if (plan === "pro") {
    if (paidUntil && new Date(paidUntil) < new Date()) return "paid-expired";
    return "paid";
  }

  return "no-plan";
}

// ---------------------------------------------------------------------------
// Subscribe page
// ---------------------------------------------------------------------------

/**
 * Blocking page shown when a user's trial or paid plan has expired.
 * The middleware redirects here when isBlocked() returns true.
 *
 * The user can:
 * - Contact via WhatsApp to pay and get their account activated
 * - Sign out to use a different account
 */
export default function SubscribePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const metadata = (user?.publicMetadata ?? {}) as PlanMetadata;
  const status = getPlanStatus(metadata);

  const isTrialExpired = status === "trial-expired";
  const isPaidExpired = status === "paid-expired";
  const isInactive = status === "inactive";

  const title = isTrialExpired
    ? "Tu prueba gratuita ha expirado"
    : isPaidExpired
      ? "Tu suscripcion ha vencido"
      : isInactive
        ? "Tu cuenta esta desactivada"
        : "Activa tu cuenta";

  const subtitle = isTrialExpired
    ? "Tu periodo de prueba de 7 dias ha finalizado. Contactanos por WhatsApp para activar tu cuenta."
    : isPaidExpired
      ? "Tu periodo de acceso ha vencido. Contactanos para renovarlo."
      : isInactive
        ? "Tu cuenta ha sido desactivada por el administrador. Contactanos si crees que es un error."
        : "Para acceder a Propi necesitas una suscripcion activa.";

  const whatsappMessage = isTrialExpired
    ? "Hola, mi prueba gratuita de Propi CRM ha expirado. Quiero activar mi cuenta."
    : isPaidExpired
      ? "Hola, mi suscripcion de Propi CRM ha vencido. Quiero renovarla."
      : "Hola, quiero informacion sobre los planes de Propi CRM.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "#E3E1DC" }}>
      {/* Card */}
      <div className="w-full max-w-lg rounded-[2rem] border border-black/[0.06] bg-white p-10 text-center shadow-xl">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg" style={{ background: "#0A2B1D" }}>
          <Shield className="h-8 w-8 text-white" />
        </div>

        <h1 className="mb-2 text-2xl font-bold" style={{ color: "#0A2B1D" }}>
          {title}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          {subtitle}
        </p>

        {/* Features */}
        <div className="mb-8 space-y-4 text-left">
          {[
            {
              icon: Building2,
              label: "CRM Inmobiliario Completo",
              desc: "Contactos, propiedades, pipeline, calendario, documentos y mas.",
            },
            {
              icon: TrendingUp,
              label: "Inteligencia de Mercado",
              desc: "Datos de MercadoLibre, tasacion automatica, KPIs por zona.",
            },
            {
              icon: Clock,
              label: "Productividad",
              desc: "Tareas, notificaciones, reportes PDF, matching automatico.",
            },
          ].map((feature) => (
            <div key={feature.label} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#0A2B1D10" }}>
                <feature.icon className="h-5 w-5" style={{ color: "#0A2B1D" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0A2B1D" }}>
                  {feature.label}
                </p>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA — WhatsApp */}
        <a
          href={`https://wa.me/584242840000?text=${encodeURIComponent(whatsappMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-semibold text-white shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all hover:brightness-110"
        >
          <MessageCircle className="h-5 w-5" />
          Contactar por WhatsApp
        </a>

        <p className="mt-4 text-xs text-gray-400">
          Escribenos para activar tu cuenta o conocer nuestros planes.
        </p>

        {/* Sign out link */}
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="mt-6 inline-flex items-center gap-2 text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          <LogOut className="h-3 w-3" />
          Cerrar sesion
        </button>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Propi by Aika Labs. Todos los derechos reservados.
      </p>
    </div>
  );
}
