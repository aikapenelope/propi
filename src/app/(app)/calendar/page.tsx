import Link from "next/link";
import { Plus } from "lucide-react";
import { getAppointments } from "@/server/actions/appointments";
import { BigCalendarView } from "@/components/calendar/big-calendar-view";
import { AppointmentList } from "@/components/calendar/appointment-list";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { CalendarViewToggle } from "@/components/calendar/calendar-view-toggle";

export const dynamic = "force-dynamic";

export default async function CalendarPage(props: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await props.searchParams;
  const view = params.view === "agenda" ? "agenda" : "calendar";

  // Fetch 6 months before and after today so the user can navigate freely
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 7, 0, 23, 59, 59);
  const appointmentList = await getAppointments(from, to);

  // Map to the format FullCalendar expects
  const calendarEvents = appointmentList.map((apt) => ({
    id: apt.id,
    title: apt.title,
    start: new Date(apt.startsAt),
    end: new Date(apt.endsAt),
    status: apt.status,
    contactName: apt.contact?.name,
    propertyTitle: apt.property?.title,
    location: apt.location ?? undefined,
  }));

  // Map to the format AppointmentList expects (includes contact phone)
  const agendaItems = appointmentList.map((apt) => ({
    id: apt.id,
    title: apt.title,
    description: apt.description,
    startsAt: apt.startsAt,
    endsAt: apt.endsAt,
    status: apt.status,
    location: apt.location,
    contact: apt.contact
      ? {
          id: apt.contact.id,
          name: apt.contact.name,
          phone: apt.contact.phone,
          email: apt.contact.email,
        }
      : null,
    property: apt.property
      ? { id: apt.property.id, title: apt.property.title }
      : null,
  }));

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          Calendario
          <InfoTooltip text="Usa la vista Calendario para ver disponibilidad. Usa Agenda para gestionar citas, enviar recordatorios por WhatsApp y agregar a Google Calendar." />
        </h1>
        <Link
          href="/calendar/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Cita</span>
        </Link>
      </div>

      {/* View toggle */}
      <CalendarViewToggle current={view} />

      {/* Views */}
      {view === "calendar" ? (
        <BigCalendarView events={calendarEvents} />
      ) : (
        <AppointmentList appointments={agendaItems} />
      )}
    </div>
  );
}
