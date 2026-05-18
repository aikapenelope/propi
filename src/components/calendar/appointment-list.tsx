"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Pencil,
  Phone,
} from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp-template";
import { buildGoogleCalendarUrl } from "@/lib/calendar-links";
import { DeleteAppointmentButton } from "@/components/calendar/delete-appointment-button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppointmentContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface AppointmentProperty {
  id: string;
  title: string;
}

interface AppointmentItem {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  location: string | null;
  contact: AppointmentContact | null;
  property: AppointmentProperty | null;
}

interface AppointmentListProps {
  appointments: AppointmentItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: "Programada", color: "text-blue-500", bg: "bg-blue-500/10" },
  confirmed: { label: "Confirmada", color: "text-green-500", bg: "bg-green-500/10" },
  completed: { label: "Completada", color: "text-gray-500", bg: "bg-gray-500/10" },
  cancelled: { label: "Cancelada", color: "text-red-500", bg: "bg-red-500/10" },
  no_show: { label: "No asistio", color: "text-amber-500", bg: "bg-amber-500/10" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(date));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

type Filter = "upcoming" | "today" | "week" | "past";

function filterAppointments(appointments: AppointmentItem[], filter: Filter): AppointmentItem[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  switch (filter) {
    case "today":
      return appointments.filter(
        (a) => new Date(a.startsAt) >= todayStart && new Date(a.startsAt) < todayEnd,
      );
    case "week":
      return appointments.filter(
        (a) => new Date(a.startsAt) >= todayStart && new Date(a.startsAt) < weekEnd,
      );
    case "past":
      return appointments
        .filter((a) => new Date(a.startsAt) < now)
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    case "upcoming":
    default:
      return appointments
        .filter((a) => new Date(a.startsAt) >= now)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppointmentList({ appointments }: AppointmentListProps) {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filterAppointments(appointments, filter);

  const filters: { value: Filter; label: string }[] = [
    { value: "upcoming", label: "Proximas" },
    { value: "today", label: "Hoy" },
    { value: "week", label: "Semana" },
    { value: "past", label: "Pasadas" },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setExpandedId(null); }}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "today"
              ? "No hay citas para hoy"
              : filter === "past"
                ? "No hay citas pasadas"
                : "No hay citas programadas"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((appt) => {
            const isExpanded = expandedId === appt.id;
            const status = statusConfig[appt.status] ?? statusConfig.scheduled;
            const contactPhone = appt.contact?.phone;
            const startsAt = new Date(appt.startsAt);
            const endsAt = new Date(appt.endsAt);

            return (
              <div
                key={appt.id}
                className="rounded-xl border border-border bg-background overflow-hidden"
              >
                {/* Summary row — tap to expand */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : appt.id)}
                  className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50"
                >
                  {/* Date badge */}
                  <div className="flex flex-col items-center justify-center w-12 shrink-0">
                    <span className="text-lg font-bold text-foreground leading-none">
                      {startsAt.getDate()}
                    </span>
                    <span className="text-[10px] uppercase text-muted-foreground font-medium">
                      {formatShortDate(startsAt).split(" ")[1]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {appt.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {formatTime(startsAt)}
                      </span>
                      {appt.contact && (
                        <>
                          <User className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
                          <span className="text-xs text-muted-foreground truncate">
                            {appt.contact.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.color} ${status.bg}`}
                  >
                    {status.label}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-3">
                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          Fecha
                        </p>
                        <p className="text-foreground font-medium capitalize">
                          {formatDate(startsAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          Hora
                        </p>
                        <p className="text-foreground font-medium">
                          {formatTime(startsAt)} — {formatTime(endsAt)}
                        </p>
                      </div>
                      {appt.contact && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            Contacto
                          </p>
                          <p className="text-foreground font-medium">
                            {appt.contact.name}
                          </p>
                          {contactPhone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />
                              {contactPhone}
                            </p>
                          )}
                        </div>
                      )}
                      {appt.location && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            Ubicacion
                          </p>
                          <p className="text-foreground font-medium flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {appt.location}
                          </p>
                        </div>
                      )}
                      {appt.property && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            Propiedad
                          </p>
                          <p className="text-foreground font-medium truncate">
                            {appt.property.title}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {appt.description && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                          Notas
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-line">
                          {appt.description}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* WhatsApp */}
                      {appt.contact && contactPhone ? (
                        <a
                          href={buildWhatsAppUrl(contactPhone, {
                            nombre: appt.contact.name,
                            motivo: appt.title,
                            fecha: formatDate(startsAt),
                            hora: formatTime(startsAt),
                            ubicacion: appt.location ?? undefined,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Enviar recordatorio
                        </a>
                      ) : appt.contact ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground bg-muted cursor-not-allowed">
                          <Phone className="h-3.5 w-3.5" />
                          Sin telefono
                        </span>
                      ) : null}

                      {/* Google Calendar */}
                      <a
                        href={buildGoogleCalendarUrl({
                          title: appt.title,
                          startsAt,
                          endsAt,
                          description: appt.description ?? undefined,
                          location: appt.location ?? undefined,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Google Calendar
                      </a>

                      {/* Edit */}
                      <Link
                        href={`/calendar/${appt.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors bg-muted text-foreground hover:bg-muted/80"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Link>

                      {/* Delete */}
                      <DeleteAppointmentButton id={appt.id} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
