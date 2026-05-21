import { Suspense } from "react";
import { cache } from "react";
import Link from "next/link";
import {
  Building2,
  UserCheck,
  Key,
  Wallet,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  CheckSquare,
  Plus,
  Users,
  AlertTriangle,
} from "lucide-react";
import { getDashboardStats } from "@/server/actions/dashboard";
import { getUpcomingAppointments } from "@/server/actions/appointments";
import { getTodayTasksCount } from "@/server/actions/tasks";
import { getRecentActivities } from "@/server/actions/activity-log";
import { formatDate } from "@/lib/utils";
import { TasksWidget } from "@/components/tasks/tasks-widget";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const dynamic = "force-dynamic";

// ── Cached fetchers ──────────────────────────────────────────────────────────
//
// React.cache() deduplicates calls within a single render pass.
// getDashboardStats() is used in both MetricCards and QuickStatsPanel;
// getUpcomingAppointments(4) is used in both HeaderStats and UpcomingPanel.
// Without caching these would each make two database round-trips.
//
const getCachedStats = cache(getDashboardStats);
const getCachedUpcoming = cache(() => getUpcomingAppointments(4));
const getCachedTodayTasks = cache(getTodayTasksCount);
const getCachedActivities = cache(() => getRecentActivities(6));

// ── Shared constants ─────────────────────────────────────────────────────────

/** Map property type enum to short display label for the bar chart */
const typeLabels: Record<string, string> = {
  apartment: "Apto",
  house: "Casa",
  office: "Ofic",
  commercial: "Local",
  land: "Lote",
  warehouse: "Galp",
  other: "Otro",
};

/** Day of week labels (0 = Sunday) */
const dayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

/** Human-readable relative time label */
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

// ── Skeleton components ──────────────────────────────────────────────────────
//
// Each skeleton mirrors the visual dimensions of its content so the layout
// does not shift when the real content streams in.

function HeaderStatsSkeleton() {
  return (
    <p className="text-muted-foreground text-xs md:text-sm flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 md:mt-2">
      <span className="h-3.5 w-32 rounded bg-muted animate-pulse inline-block" />
    </p>
  );
}

function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 md:p-5 min-h-[180px] min-w-0 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
          <div className="h-8 w-16 rounded bg-muted mt-2" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionCardSkeleton() {
  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-7 card-shadow animate-pulse">
      <div className="h-5 w-32 rounded bg-muted mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((j) => (
          <div key={j} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Async streaming components ───────────────────────────────────────────────
//
// Each component is an async Server Component that owns its own data fetch.
// Wrapping each in <Suspense> in the page below lets the server stream HTML
// for each section as its query resolves, instead of waiting for all queries
// to finish before sending anything to the client.

/**
 * The header subtitle line: "X citas hoy", "Y tareas vencidas", etc.
 * Suspended separately so the greeting heading renders immediately while
 * the counts load.
 */
async function HeaderStats() {
  const [upcoming, todayTasks] = await Promise.all([
    getCachedUpcoming(),
    getCachedTodayTasks(),
  ]);

  return (
    <p className="text-muted-foreground text-xs md:text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
      {upcoming.length > 0 && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {upcoming.length} cita{upcoming.length !== 1 ? "s" : ""} hoy
        </span>
      )}
      {todayTasks.overdue > 0 && (
        <span className="flex items-center gap-1 text-amber-500">
          <AlertTriangle className="h-3 w-3" />
          {todayTasks.overdue} tarea{todayTasks.overdue !== 1 ? "s" : ""} vencida{todayTasks.overdue !== 1 ? "s" : ""}
        </span>
      )}
      {todayTasks.total > 0 && todayTasks.overdue === 0 && (
        <span className="flex items-center gap-1">
          <CheckSquare className="h-3 w-3" />
          {todayTasks.total} tarea{todayTasks.total !== 1 ? "s" : ""} pendiente{todayTasks.total !== 1 ? "s" : ""}
        </span>
      )}
      {upcoming.length === 0 && todayTasks.total === 0 && (
        <span>Todo al dia</span>
      )}
    </p>
  );
}

/**
 * The four KPI metric cards (properties, contacts, closed sales, appointments).
 * Uses getDashboardStats() which involves multiple aggregation queries — the
 * most expensive data fetch on the page.
 */
async function MetricCards() {
  const stats = await getCachedStats();

  const activeProperties =
    stats.propertiesByStatus.find((s) => s.status === "active")?.count ?? 0;
  const soldProperties =
    stats.propertiesByStatus.find((s) => s.status === "sold")?.count ?? 0;
  const reservedProperties =
    stats.propertiesByStatus.find((s) => s.status === "reserved")?.count ?? 0;

  // Bar chart: properties by type (normalize to percentages)
  const maxTypeCount = Math.max(
    ...stats.propertiesByType.map((t) => t.count),
    1,
  );
  const typeBarData = stats.propertiesByType.slice(0, 7).map((t) => ({
    label: typeLabels[t.type] || t.type,
    height: Math.round((t.count / maxTypeCount) * 100),
    count: t.count,
  }));

  // Area chart: contacts by month (build SVG path)
  const monthCounts = stats.contactsByMonth.map((m) => m.count);
  const maxMonthCount = Math.max(...monthCounts, 1);
  const contactPoints = monthCounts.map((c, i) => {
    const x = monthCounts.length > 1 ? (i / (monthCounts.length - 1)) * 200 : 100;
    const y = 70 - (c / maxMonthCount) * 60;
    return `${x},${y}`;
  });
  const contactLinePath =
    contactPoints.length > 1
      ? `M${contactPoints.join(" L")}`
      : "M0,70 L200,70";
  const contactAreaPath =
    contactPoints.length > 1
      ? `M${contactPoints.join(" L")} L200,80 L0,80 Z`
      : "M0,70 L200,70 L200,80 L0,80 Z";

  // Column chart: appointments by day of week
  const dayData = dayLabels.map((label, dayIndex) => {
    const found = stats.appointmentsByDay.find((d) => d.day === dayIndex);
    return { label, count: found?.count ?? 0 };
  });
  const maxDayCount = Math.max(...dayData.map((d) => d.count), 1);
  const todayDow = new Date().getDay();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
      {/* Card 1: Properties by type (real bar chart) */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 md:p-5 card-shadow card-glow-green relative overflow-hidden group hover:border-white/[0.08] transition-colors min-w-0 min-h-[180px]">

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground/80">
            Propiedades
          </span>
          <InfoTooltip text="Total de propiedades en tu inventario. La grafica muestra la distribucion por tipo." />
        </div>
        <p className="text-muted-foreground text-xs mb-1 relative z-10">
          Portafolio activo
        </p>
        <h3 className="text-3xl font-bold mb-4 text-foreground relative z-10">
          {stats.totalProperties}
        </h3>

        {/* Real bar chart from propertiesByType */}
        <div className="flex items-end justify-between h-8 gap-1.5 mb-2 relative z-10">
          {typeBarData.length > 0
            ? typeBarData.map((bar) => (
                <div
                  key={bar.label}
                  className="w-full bg-primary/40 rounded-[2px] hover:bg-primary transition-colors"
                  style={{ height: `${Math.max(bar.height, 5)}%` }}
                  title={`${bar.label}: ${bar.count}`}
                />
              ))
            : Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full bg-primary/10 rounded-[2px]"
                  style={{ height: "5%" }}
                />
              ))}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground relative z-10 mb-3">
          {typeBarData.map((bar) => (
            <span key={bar.label}>{bar.label}</span>
          ))}
        </div>

        <div className="flex justify-between text-[11px] relative z-10 pt-2 border-t border-border">
          <div>
            <span className="text-muted-foreground block mb-0.5">Activas</span>
            <span className="font-medium text-foreground">{activeProperties}</span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block mb-0.5">Vendidas</span>
            <span className="font-medium text-foreground">{soldProperties}</span>
          </div>
        </div>
      </div>

      {/* Card 2: Contacts (real SVG area chart from contactsByMonth) */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 md:p-5 card-shadow card-glow-blue relative overflow-hidden group hover:border-white/[0.08] transition-colors min-w-0 min-h-[180px]">

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-8 h-8 rounded-full border border-blue-500/30 flex items-center justify-center bg-blue-500/10">
            <UserCheck className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-sm font-medium text-foreground/80">
            Contactos
          </span>
          <InfoTooltip text="Contactos creados en los ultimos 6 meses. La grafica muestra el crecimiento mensual." />
        </div>
        <p className="text-muted-foreground text-xs mb-1 relative z-10">
          Ultimos 6 meses
        </p>
        <h3 className="text-3xl font-bold mb-2 text-foreground relative z-10">
          {stats.totalContacts}
        </h3>

        {/* Real SVG area chart from contactsByMonth */}
        <div className="absolute bottom-0 left-0 right-0 h-28 opacity-80 group-hover:opacity-100 transition-opacity">
          <svg
            viewBox="0 0 200 80"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="blueFade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={contactAreaPath} fill="url(#blueFade)" />
            <path d={contactLinePath} fill="none" stroke="#3B82F6" strokeWidth="2" />
          </svg>
        </div>

        {/* Source breakdown */}
        <div className="relative z-10 mt-auto pt-16">
          <div className="flex flex-wrap gap-2">
            {stats.contactsBySource.slice(0, 3).map((s) => (
              <span
                key={s.source}
                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium"
              >
                {s.source}: {s.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card 3: Closed Sales */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 md:p-5 card-shadow card-glow-purple relative overflow-hidden group hover:border-white/[0.08] transition-colors flex flex-col min-w-0 min-h-[180px]">

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-8 h-8 rounded-full border border-purple-500/30 flex items-center justify-center bg-purple-500/10">
            <Key className="h-4 w-4 text-purple-400" />
          </div>
          <span className="text-sm font-medium text-foreground/80">
            Ventas Cerradas
          </span>
          <InfoTooltip text="Propiedades con status 'Vendida' o 'Reservada'. Cambia el status desde el detalle de cada propiedad." />
        </div>

        <div className="flex-1 flex gap-4 mt-2">
          <div className="flex-1 relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
            <p className="text-muted-foreground text-[11px] mb-1 uppercase tracking-wider font-semibold">Vendidas</p>
            <h4 className="text-3xl font-bold text-foreground">{soldProperties}</h4>
          </div>
          <div className="flex-1 relative pl-4 opacity-70">
            <div className="absolute left-0 top-4 bottom-0 w-1 bg-gradient-to-b from-purple-500/40 to-indigo-500/40 rounded-full" />
            <p className="text-muted-foreground text-[11px] mb-1 uppercase tracking-wider font-semibold mt-4">Reservadas</p>
            <h4 className="text-xl font-bold text-foreground/70">{reservedProperties}</h4>
          </div>
        </div>
      </div>

      {/* Card 4: Appointments by day (real column chart) */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 md:p-5 card-shadow card-glow-amber relative overflow-hidden group hover:border-white/[0.08] transition-colors flex flex-col min-w-0 min-h-[180px]">

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-8 h-8 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-500/10">
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-sm font-medium text-foreground/80">
            Citas esta Semana
          </span>
          <InfoTooltip text="Citas programadas de lunes a domingo. La grafica muestra la distribucion por dia." />
        </div>

        <h3 className="text-4xl font-bold text-foreground relative z-10 mb-2">
          {stats.appointmentsThisWeek}
        </h3>

        {/* Real column chart from appointmentsByDay */}
        <div className="flex-1 flex items-end justify-between gap-1.5 px-1 relative z-10 pb-2">
          {dayData.map((d, i) => {
            const isToday = i === todayDow;
            const height =
              maxDayCount > 0
                ? Math.max(Math.round((d.count / maxDayCount) * 100), 5)
                : 5;
            return (
              <div
                key={d.label}
                className={`w-full rounded-t-[3px] transition-colors ${
                  isToday
                    ? "bg-gradient-to-t from-amber-600 to-amber-400"
                    : d.count > 0
                      ? "bg-amber-500/30 hover:bg-amber-500/50"
                      : "bg-white/[0.04] hover:bg-white/10"
                }`}
                style={{ height: `${height}%` }}
                title={`${d.label}: ${d.count} citas`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1 px-1 text-[10px] text-muted-foreground font-medium border-t border-border pt-2">
          {dayData.map((d, i) => (
            <span key={d.label} className={i === todayDow ? "text-amber-400 font-bold" : ""}>
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Upcoming appointments panel */
async function UpcomingAppointmentsPanel() {
  const upcoming = await getCachedUpcoming();

  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-7 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded border border-primary/30 flex items-center justify-center bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Proximas Citas</h2>
          <InfoTooltip text="Tus proximas 4 citas. Haz click en una para editarla o cancelarla." />
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
                {apt.startsAt ? new Date(apt.startsAt).getDate() : "-"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-foreground truncate">{apt.title}</div>
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
  );
}

/** Recent activity timeline */
async function RecentActivityPanel() {
  const recentActivities = await getCachedActivities();

  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-7 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded border border-primary/30 flex items-center justify-center bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Actividad Reciente</h2>
        </div>
      </div>

      {recentActivities.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Sin actividad reciente
        </p>
      ) : (
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <Link
              key={activity.id}
              href={`/contacts/${activity.contactId}`}
              className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.05] transition-colors group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {activity.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {activity.contact?.name} · {timeAgo(activity.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Quick stats summary panel (reuses cached getDashboardStats) */
async function QuickStatsPanel() {
  const stats = await getCachedStats();

  const activeProperties =
    stats.propertiesByStatus.find((s) => s.status === "active")?.count ?? 0;
  const soldProperties =
    stats.propertiesByStatus.find((s) => s.status === "sold")?.count ?? 0;

  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-7 card-shadow">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 rounded border border-primary/30 flex items-center justify-center bg-primary/10">
          <Key className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Resumen Rapido</h2>
      </div>
      <div className="space-y-4">
        <Link href="/properties" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors">
          <span className="text-sm text-muted-foreground">Propiedades activas</span>
          <span className="text-lg font-bold text-foreground">{activeProperties}</span>
        </Link>
        <Link href="/pipeline" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors">
          <span className="text-sm text-muted-foreground">Leads en pipeline</span>
          <span className="text-lg font-bold text-foreground">{stats.totalContacts}</span>
        </Link>
        <Link href="/reports" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors">
          <span className="text-sm text-muted-foreground">Ventas cerradas</span>
          <span className="text-lg font-bold text-emerald-500">{soldProperties}</span>
        </Link>
        <Link href="/calendar" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors">
          <span className="text-sm text-muted-foreground">Citas esta semana</span>
          <span className="text-lg font-bold text-foreground">{stats.appointmentsThisWeek}</span>
        </Link>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
//
// Synchronous — renders the shell immediately.  Each data-dependent section
// is wrapped in <Suspense> so the server streams HTML chunks as queries
// resolve, instead of waiting for all four queries to finish before sending
// the first byte of content.
//
// React.cache() above ensures that getCachedStats() and getCachedUpcoming()
// are each called only once even though they appear in multiple components.

export default function DashboardPage() {
  // Time-based greeting computed synchronously (no DB needed)
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos dias" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="max-w-[1600px] mx-auto px-3 md:px-8 py-4 md:py-6">
      {/* Title + quick actions — renders immediately, no data needed */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
            {greeting}
          </h1>
          {/*
           * HeaderStats streams in the subtitle counts (citas hoy, tareas vencidas).
           * The skeleton keeps the layout stable while the two fast queries resolve.
           */}
          <Suspense fallback={<HeaderStatsSkeleton />}>
            <HeaderStats />
          </Suspense>
        </div>

        {/* Quick action buttons — always available immediately */}
        <div className="flex items-center gap-2">
          <Link
            href="/properties/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Propiedad
          </Link>
          <Link
            href="/contacts/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            Contacto
          </Link>
          <Link
            href="/calendar/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" />
            Cita
          </Link>
        </div>
      </div>

      {/*
       * 4 KPI cards — streams in once getDashboardStats() resolves.
       * This is typically the heaviest query (multiple GROUP BYs).
       */}
      <Suspense fallback={<MetricCardsSkeleton />}>
        <MetricCards />
      </Suspense>

      {/* Bottom section: three panels in a responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {/*
         * Upcoming appointments — reuses cached getCachedUpcoming() result,
         * so no extra DB call even though HeaderStats also awaits it.
         */}
        <Suspense fallback={<SectionCardSkeleton />}>
          <UpcomingAppointmentsPanel />
        </Suspense>

        {/* Recent activity */}
        <Suspense fallback={<SectionCardSkeleton />}>
          <RecentActivityPanel />
        </Suspense>

        {/* Tasks widget (client component, fetches its own data) */}
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-7 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded border border-primary/30 flex items-center justify-center bg-primary/10">
                <CheckSquare className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Tareas Pendientes</h2>
              <InfoTooltip text="Tareas con fecha limite proxima. Marca como completada con un click." />
            </div>
            <Link
              href="/tasks"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <TasksWidget />
        </div>

        {/*
         * Quick stats — reuses cached getCachedStats() result,
         * no extra DB call despite MetricCards also awaiting it.
         */}
        <Suspense fallback={<SectionCardSkeleton />}>
          <QuickStatsPanel />
        </Suspense>
      </div>
    </div>
  );
}
