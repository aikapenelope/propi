import Link from "next/link";
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { getDashboardStats } from "@/server/actions/dashboard";
import { getUpcomingAppointments } from "@/server/actions/appointments";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CommissionCalculator } from "@/components/dashboard/commission-calculator";

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  active: "Activa",
  reserved: "Reservada",
  sold: "Vendida",
  rented: "Arrendada",
  inactive: "Inactiva",
};

const sourceLabels: Record<string, string> = {
  website: "Web",
  referral: "Referido",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  portal: "Portal",
  walk_in: "Visita",
  phone: "Telefono",
  other: "Otro",
};

export default async function DashboardPage() {
  const [stats, upcoming] = await Promise.all([
    getDashboardStats(),
    getUpcomingAppointments(5),
  ]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalProperties}
              </p>
              <p className="text-xs text-muted-foreground">Propiedades</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalContacts}
              </p>
              <p className="text-xs text-muted-foreground">Contactos</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.appointmentsThisWeek}
              </p>
              <p className="text-xs text-muted-foreground">Citas esta semana</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.propertiesByStatus.find((s) => s.status === "active")
                  ?.count ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Activas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Properties by status */}
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Propiedades por Estado
          </h2>
          {stats.propertiesByStatus.length > 0 ? (
            <div className="space-y-2">
              {stats.propertiesByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">
                    {statusLabels[item.status] ?? item.status}
                  </span>
                  <span className="font-medium text-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos</p>
          )}
        </div>

        {/* Contacts by source */}
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Contactos por Fuente
          </h2>
          {stats.contactsBySource.length > 0 ? (
            <div className="space-y-2">
              {stats.contactsBySource.map((item) => (
                <div
                  key={item.source}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">
                    {sourceLabels[item.source ?? "other"] ?? item.source}
                  </span>
                  <span className="font-medium text-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos</p>
          )}
        </div>

        {/* Upcoming appointments */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Proximas Citas
            </h2>
            <Link
              href="/calendar"
              className="text-xs text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {upcoming.length > 0 ? (
            <div className="space-y-2">
              {upcoming.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg bg-muted p-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{apt.title}</p>
                    {apt.contact && (
                      <p className="text-xs text-muted-foreground">
                        {apt.contact.name}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(apt.startsAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay citas programadas
            </p>
          )}
        </div>

        {/* Commission calculator */}
        <CommissionCalculator />
      </div>

      {/* Recent activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent contacts */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Contactos Recientes
            </h2>
            <Link
              href="/contacts"
              className="text-xs text-primary hover:underline"
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
                  className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-foreground">
                    {contact.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(contact.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin contactos</p>
          )}
        </div>

        {/* Recent properties */}
        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Propiedades Recientes
            </h2>
            <Link
              href="/properties"
              className="text-xs text-primary hover:underline"
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
                  className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-muted transition-colors"
                >
                  <div>
                    <span className="font-medium text-foreground">
                      {property.title}
                    </span>
                    {property.price && (
                      <span className="ml-2 text-xs text-primary">
                        {formatCurrency(
                          parseFloat(property.price),
                          property.currency ?? "USD",
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(property.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin propiedades</p>
          )}
        </div>
      </div>
    </div>
  );
}
