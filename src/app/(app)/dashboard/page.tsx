import Link from "next/link";
import {
  Building2,
  UserCheck,
  Key,
  Wallet,
  TrendingUp,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { getDashboardStats } from "@/server/actions/dashboard";
import { getUpcomingAppointments } from "@/server/actions/appointments";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, upcoming] = await Promise.all([
    getDashboardStats(),
    getUpcomingAppointments(4),
  ]);

  const activeProperties =
    stats.propertiesByStatus.find((s) => s.status === "active")?.count ?? 0;
  const soldProperties =
    stats.propertiesByStatus.find((s) => s.status === "sold")?.count ?? 0;
  const reservedProperties =
    stats.propertiesByStatus.find((s) => s.status === "reserved")?.count ?? 0;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">
      {/* Title */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 glow-text">
            Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Resumen de tu negocio inmobiliario
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/properties/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,255,85,0.25)]"
          >
            <Building2 className="h-4 w-4" />
            Nueva Propiedad
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {/* Properties Listed */}
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow relative overflow-hidden group hover:border-white/[0.08] hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center bg-primary/10 shadow-[0_0_10px_rgba(0,255,85,0.1)]">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground/80">
              Propiedades
            </span>
          </div>
          <p className="text-muted-foreground text-xs mb-1 relative z-10">
            Portafolio activo
          </p>
          <h3 className="text-3xl font-bold mb-4 text-foreground relative z-10">
            {stats.totalProperties}
          </h3>

          {/* Mini bar chart */}
          <div className="flex items-end justify-between h-8 gap-1.5 mb-4 relative z-10">
            {[60, 80, 50, 90, 100, 70, 85, 75, 95, 65].map((h, i) => (
              <div
                key={i}
                className="w-full bg-primary/40 rounded-[2px] hover:bg-primary transition-colors"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between text-[11px] relative z-10 pt-2 border-t border-border">
            <div>
              <span className="text-muted-foreground block mb-0.5">
                Activas
              </span>
              <span className="font-medium text-foreground">
                {activeProperties}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block mb-0.5">
                Vendidas
              </span>
              <span className="font-medium text-foreground">
                {soldProperties}
              </span>
            </div>
          </div>
        </div>

        {/* Active Leads */}
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow relative overflow-hidden group hover:border-white/[0.08] hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-8 h-8 rounded-full border border-blue-500/30 flex items-center justify-center bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              <UserCheck className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-foreground/80">
              Contactos
            </span>
          </div>
          <p className="text-muted-foreground text-xs mb-1 relative z-10">
            Leads activos
          </p>
          <h3 className="text-3xl font-bold mb-2 text-foreground relative z-10">
            {stats.totalContacts}
          </h3>

          {/* SVG area chart */}
          <div className="absolute bottom-0 left-0 right-0 h-28 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg
              viewBox="0 0 200 80"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <linearGradient
                  id="blueFade"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,60 C30,50 60,70 100,40 C130,20 170,50 200,10 L200,80 L0,80 Z"
                fill="url(#blueFade)"
              />
              <path
                d="M0,60 C30,50 60,70 100,40 C130,20 170,50 200,10"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Closed Sales */}
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow relative overflow-hidden group hover:border-white/[0.08] hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-8 h-8 rounded-full border border-purple-500/30 flex items-center justify-center bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
              <Key className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-foreground/80">
              Ventas Cerradas
            </span>
          </div>

          <div className="flex-1 flex gap-4 mt-2">
            <div className="flex-1 relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.4)]" />
              <p className="text-muted-foreground text-[11px] mb-1 uppercase tracking-wider font-semibold">
                Vendidas
              </p>
              <h4 className="text-3xl font-bold text-foreground">
                {soldProperties}
              </h4>
            </div>
            <div className="flex-1 relative pl-4 opacity-70">
              <div className="absolute left-0 top-4 bottom-0 w-1 bg-gradient-to-b from-purple-500/40 to-indigo-500/40 rounded-full" />
              <p className="text-muted-foreground text-[11px] mb-1 uppercase tracking-wider font-semibold mt-4">
                Reservadas
              </p>
              <h4 className="text-xl font-bold text-foreground/70">
                {reservedProperties}
              </h4>
            </div>
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 card-shadow relative overflow-hidden group hover:border-white/[0.08] hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-8 h-8 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
              <Wallet className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-sm font-medium text-foreground/80">
              Citas esta Semana
            </span>
          </div>

          <h3 className="text-4xl font-bold text-foreground relative z-10 mb-2">
            {stats.appointmentsThisWeek}
          </h3>

          {/* Mini column chart */}
          <div className="flex-1 flex items-end justify-between gap-1.5 px-1 relative z-10 pb-2">
            {[40, 60, 80, 50, 70, 45].map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-t-[3px] transition-colors ${
                  i === 2
                    ? "bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-white/[0.04] hover:bg-white/10"
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Upcoming Appointments + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-7 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded border border-primary/30 flex items-center justify-center bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Proximas Citas
              </h2>
            </div>
            <Link
              href="/calendar"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todas
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay citas programadas
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold bg-primary/10 text-primary">
                    {apt.startsAt
                      ? new Date(apt.startsAt).getDate()
                      : "-"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-foreground truncate">
                      {apt.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {apt.startsAt ? formatDate(apt.startsAt) : ""}{" "}
                      {apt.location ? `- ${apt.location}` : ""}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      apt.status === "confirmed"
                        ? "bg-primary/10 text-primary"
                        : apt.status === "scheduled"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Properties + Contacts */}
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-7 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded border border-primary/30 flex items-center justify-center bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Actividad Reciente
              </h2>
            </div>
          </div>

          {/* Recent Properties */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Propiedades
            </h3>
            <div className="space-y-2">
              {stats.recentProperties.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {p.title}
                      </span>
                      {p.price && (
                        <span className="text-xs text-primary font-bold ml-2">
                          ${parseFloat(p.price).toLocaleString()} {p.currency}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Contacts */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Contactos
            </h3>
            <div className="space-y-2">
              {stats.recentContacts.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-xs font-bold text-background">
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {c.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {c.source || ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
