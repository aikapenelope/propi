import Link from "next/link";
import {
  CheckCircle2,
  DollarSign,
  Instagram,
  Facebook,
  MessageCircle,
  Mail,
} from "lucide-react";
import { getDashboardStats } from "@/server/actions/dashboard";
import { getUpcomingAppointments } from "@/server/actions/appointments";
import { getAllSocialAccounts } from "@/server/actions/social-accounts";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CommissionCalculator } from "@/components/dashboard/commission-calculator";

export default async function DashboardPage() {
  const [stats, upcoming, socialAccounts] = await Promise.all([
    getDashboardStats(),
    getUpcomingAppointments(5),
    getAllSocialAccounts().catch(() => []),
  ]);

  const igConnected = socialAccounts.some((a) => a.platform === "instagram");
  const fbConnected = socialAccounts.some((a) => a.platform === "facebook");
  const waConnected = socialAccounts.some((a) => a.platform === "whatsapp");

  const activeProperties =
    stats.propertiesByStatus.find((s) => s.status === "active")?.count ?? 0;
  const soldProperties =
    stats.propertiesByStatus.find((s) => s.status === "sold")?.count ?? 0;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#E4E7E1",
        fontFamily: "var(--font-jakarta), var(--font-sans), sans-serif",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Top Row: Main Stats + Feature Card */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Big Composite Card */}
          <div className="col-span-1 xl:col-span-2 bg-white rounded-[32px] overflow-hidden shadow-sm flex flex-col md:flex-row relative min-h-[340px]">
            {/* Left Content Stats */}
            <div className="w-full md:w-[55%] p-8 flex flex-col justify-between z-10">
              <div className="flex gap-8 md:gap-12 mb-8">
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#8BA398" }}
                  >
                    Contactos Activos
                  </div>
                  <div
                    className="text-[40px] font-extrabold leading-none tracking-tight"
                    style={{ color: "#0A2B1D" }}
                  >
                    {stats.totalContacts.toLocaleString("es")}
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#8BA398" }}
                  >
                    Citas esta Semana
                  </div>
                  <div
                    className="text-[40px] font-extrabold leading-none tracking-tight"
                    style={{ color: "#0A2B1D" }}
                  >
                    {stats.appointmentsThisWeek}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 w-full max-w-sm">
                {/* Properties Active Card */}
                <div
                  className="rounded-[20px] p-5 flex-1 relative overflow-hidden"
                  style={{ background: "#E2F2E9" }}
                >
                  <div className="flex items-center gap-2 text-sm mb-3 font-bold text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Propiedades Activas
                  </div>
                  <div
                    className="text-3xl font-extrabold mb-2"
                    style={{ color: "#0A2B1D" }}
                  >
                    {activeProperties}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-green-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${stats.totalProperties > 0 ? Math.round((activeProperties / stats.totalProperties) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-green-700">
                      {stats.totalProperties > 0
                        ? Math.round(
                            (activeProperties / stats.totalProperties) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                {/* Commissions Card */}
                <div
                  className="rounded-[20px] p-5 flex-1 relative overflow-hidden"
                  style={{ background: "#E2F3F9" }}
                >
                  <div className="flex items-center gap-2 text-sm mb-3 font-bold text-blue-700">
                    <DollarSign className="h-4 w-4" />
                    Total Propiedades
                  </div>
                  <div
                    className="text-3xl font-extrabold mb-2"
                    style={{ color: "#0A2B1D" }}
                  >
                    {stats.totalProperties}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${stats.totalProperties > 0 ? Math.round((soldProperties / stats.totalProperties) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-blue-700">
                      {soldProperties} vendidas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image Hero */}
            <div className="absolute bottom-0 right-0 w-[55%] h-full pointer-events-none hidden md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                className="w-full h-full object-cover rounded-tl-[40px]"
                style={{ boxShadow: "-10px -10px 30px rgba(0,0,0,0.05)" }}
                alt="Propiedad"
              />
            </div>
          </div>

          {/* Marketing Channels Card */}
          <div
            className="col-span-1 rounded-[32px] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden"
            style={{ background: "#EBF6D6" }}
          >
            <div className="z-10">
              <div className="text-green-700 text-xs font-bold uppercase tracking-wider mb-2">
                Canales de Marketing
              </div>
              <h3
                className="text-2xl font-extrabold mb-3 leading-tight"
                style={{ color: "#0A2B1D" }}
              >
                Inbox Unificado
                <br />
                IG + FB + WA
              </h3>
              <p className="text-sm text-green-800/80 mb-6">
                Responde mensajes de Instagram, Facebook y WhatsApp desde una
                sola pantalla.
              </p>
              <Link
                href="/marketing/inbox"
                className="text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-colors inline-block"
                style={{ background: "#0A2B1D" }}
              >
                Abrir Inbox
              </Link>
            </div>

            {/* Channel status badges */}
            <div className="flex gap-2 mt-6 z-10">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full ${igConnected ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-400"}`}
              >
                <Instagram className="h-3 w-3 inline mr-1" />
                {igConnected ? "IG" : "IG"}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full ${fbConnected ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}
              >
                <Facebook className="h-3 w-3 inline mr-1" />
                {fbConnected ? "FB" : "FB"}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full ${waConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
              >
                <MessageCircle className="h-3 w-3 inline mr-1" />
                {waConnected ? "WA" : "WA"}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                <Mail className="h-3 w-3 inline mr-1" />
                Email
              </span>
            </div>
          </div>
        </div>

        {/* Middle Row: Upcoming Appointments + Commission Calculator + Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="col-span-1 xl:col-span-2 bg-white rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-2xl font-bold mb-1"
                  style={{ color: "#0A2B1D" }}
                >
                  Proximas Citas
                </h3>
                <p className="text-sm" style={{ color: "#8BA398" }}>
                  Tus citas programadas esta semana
                </p>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                style={{ color: "#0A2B1D" }}
              >
                Ver Calendario
              </Link>
            </div>

            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ background: "#E2F2E9", color: "#0A2B1D" }}
                    >
                      {new Date(apt.startsAt).getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-bold text-sm truncate"
                        style={{ color: "#0A2B1D" }}
                      >
                        {apt.title}
                      </div>
                      <div className="text-xs" style={{ color: "#8BA398" }}>
                        {new Date(apt.startsAt).toLocaleTimeString("es", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {apt.contact && `- ${apt.contact.name}`}
                      </div>
                    </div>
                    <div className="text-xs font-medium" style={{ color: "#8BA398" }}>
                      {formatDate(apt.startsAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-12 text-sm"
                style={{ color: "#8BA398" }}
              >
                No hay citas programadas esta semana
              </div>
            )}
          </div>

          {/* Right Column: Commission Calculator + Stats */}
          <div className="col-span-1 flex flex-col gap-6">
            <CommissionCalculator />

            {/* Properties by Status */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm">
              <h4
                className="text-base font-bold mb-4"
                style={{ color: "#0A2B1D" }}
              >
                Estado del Inventario
              </h4>
              {stats.propertiesByStatus.length > 0 ? (
                <div className="space-y-3">
                  {stats.propertiesByStatus.map((item) => {
                    const statusLabels: Record<string, string> = {
                      draft: "Borrador",
                      active: "Activa",
                      reserved: "Reservada",
                      sold: "Vendida",
                      rented: "Arrendada",
                      inactive: "Inactiva",
                    };
                    const statusColors: Record<string, string> = {
                      draft: "#94a3b8",
                      active: "#22c55e",
                      reserved: "#f59e0b",
                      sold: "#3b82f6",
                      rented: "#8b5cf6",
                      inactive: "#ef4444",
                    };
                    return (
                      <div
                        key={item.status}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: statusColors[item.status] || "#94a3b8",
                            }}
                          />
                          <span className="text-sm" style={{ color: "#0A2B1D" }}>
                            {statusLabels[item.status] || item.status}
                          </span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: "#0A2B1D" }}>
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#8BA398" }}>
                  Sin datos
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Recent Properties + Recent Contacts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Properties */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-bold"
                style={{ color: "#0A2B1D" }}
              >
                Propiedades Recientes
              </h3>
              <Link
                href="/properties"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                style={{ color: "#0A2B1D" }}
              >
                Ver todas
              </Link>
            </div>
            {stats.recentProperties.length > 0 ? (
              <div className="space-y-2">
                {stats.recentProperties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <span
                        className="font-semibold text-sm truncate block"
                        style={{ color: "#0A2B1D" }}
                      >
                        {property.title}
                      </span>
                      {property.price && (
                        <span className="text-xs text-blue-600 font-bold">
                          {formatCurrency(
                            parseFloat(property.price),
                            property.currency ?? "USD",
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "#8BA398" }}>
                      {formatDate(property.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm py-8 text-center" style={{ color: "#8BA398" }}>
                Sin propiedades
              </p>
            )}
          </div>

          {/* Recent Contacts */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-bold"
                style={{ color: "#0A2B1D" }}
              >
                Contactos Recientes
              </h3>
              <Link
                href="/contacts"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                style={{ color: "#0A2B1D" }}
              >
                Ver todos
              </Link>
            </div>
            {stats.recentContacts.length > 0 ? (
              <div className="space-y-2">
                {stats.recentContacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "#0A2B1D" }}
                      >
                        {contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span
                        className="font-semibold text-sm"
                        style={{ color: "#0A2B1D" }}
                      >
                        {contact.name}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "#8BA398" }}>
                      {formatDate(contact.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm py-8 text-center" style={{ color: "#8BA398" }}>
                Sin contactos
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
