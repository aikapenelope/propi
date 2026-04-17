import Link from "next/link";
import { Plus } from "lucide-react";
import { getAppointments } from "@/server/actions/appointments";
import { BigCalendarView } from "@/components/calendar/big-calendar-view";

export default async function CalendarPage() {
  // Fetch a wide range (current year) so the calendar has data for navigation
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);
  const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  const appointmentList = await getAppointments(from, to);

  // Map to the format react-big-calendar expects
  const events = appointmentList.map((apt) => ({
    id: apt.id,
    title: apt.title,
    start: new Date(apt.startsAt),
    end: new Date(apt.endsAt),
    status: apt.status,
    contactName: apt.contact?.name,
    propertyTitle: apt.property?.title,
    location: apt.location ?? undefined,
  }));

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
        <Link
          href="/calendar/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Cita</span>
        </Link>
      </div>

      {/* Calendar */}
      <BigCalendarView events={events} />
    </div>
  );
}
