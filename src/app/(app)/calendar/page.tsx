import Link from "next/link";
import { Plus, MapPin, User, Building2 } from "lucide-react";
import { getAppointments } from "@/server/actions/appointments";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistio",
};

const statusColors: Record<string, string> = {
  scheduled: "#3b82f6",
  confirmed: "#22c55e",
  completed: "#94a3b8",
  cancelled: "#ef4444",
  no_show: "#f59e0b",
};

interface CalendarPageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params = await searchParams;

  // Default to current month
  const now = new Date();
  const from = params.from
    ? new Date(params.from)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = params.to
    ? new Date(params.to)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const appointmentList = await getAppointments(from, to);

  // Group by date
  const grouped = appointmentList.reduce<
    Record<string, typeof appointmentList>
  >((acc, apt) => {
    const dateKey = format(apt.startsAt, "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
          <p className="text-sm text-muted-foreground">
            {format(from, "MMMM yyyy", { locale: es })} -{" "}
            {appointmentList.length} cita
            {appointmentList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/calendar/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Cita</span>
        </Link>
      </div>

      {/* Appointment list grouped by date */}
      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No hay citas este mes
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Agenda tu primera cita para empezar.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                {format(new Date(dateKey + "T12:00:00"), "EEEE, d 'de' MMMM", {
                  locale: es,
                })}
              </h2>
              <div className="space-y-2">
                {grouped[dateKey].map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                  >
                    {/* Time */}
                    <div className="flex shrink-0 flex-col items-center text-xs">
                      <span className="font-medium text-foreground">
                        {format(apt.startsAt, "HH:mm")}
                      </span>
                      <span className="text-muted-foreground">
                        {format(apt.endsAt, "HH:mm")}
                      </span>
                    </div>

                    {/* Status indicator */}
                    <div
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          statusColors[apt.status] ?? "#94a3b8",
                      }}
                      title={statusLabels[apt.status] ?? apt.status}
                    />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{apt.title}</p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {apt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {apt.location}
                          </span>
                        )}
                        {apt.contact && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {apt.contact.name}
                          </span>
                        )}
                        {apt.property && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {apt.property.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${statusColors[apt.status] ?? "#94a3b8"}20`,
                        color: statusColors[apt.status] ?? "#94a3b8",
                      }}
                    >
                      {statusLabels[apt.status] ?? apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
