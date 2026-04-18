"use client";

import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  contactName?: string;
  propertyTitle?: string;
  location?: string;
}

interface BigCalendarViewProps {
  events: CalendarEvent[];
}

const statusColors: Record<string, string> = {
  scheduled: "#3b82f6",
  confirmed: "#22c55e",
  completed: "#94a3b8",
  cancelled: "#ef4444",
  no_show: "#f59e0b",
};

export function BigCalendarView({ events }: BigCalendarViewProps) {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const router = useRouter();

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      router.push(`/calendar/${event.id}/edit`);
    },
    [router],
  );

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date }) => {
      const dateStr = format(start, "yyyy-MM-dd'T'HH:mm");
      router.push(`/calendar/new?date=${dateStr}`);
    },
    [router],
  );

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const color = statusColors[event.status] || "#3b82f6";
    return {
      style: {
        backgroundColor: color,
        borderRadius: "6px",
        border: "none",
        color: "#fff",
        fontSize: "12px",
        padding: "2px 6px",
      },
    };
  }, []);

  const messages = useMemo(
    () => ({
      today: "Hoy",
      previous: "Anterior",
      next: "Siguiente",
      month: "Mes",
      week: "Semana",
      day: "Dia",
      agenda: "Agenda",
      date: "Fecha",
      time: "Hora",
      event: "Cita",
      noEventsInRange: "No hay citas en este periodo.",
      showMore: (total: number) => `+${total} mas`,
    }),
    [],
  );

  return (
    <div className="big-calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        messages={messages}
        culture="es"
        popup
        tooltipAccessor={(event) =>
          [
            event.title,
            event.contactName ? `Contacto: ${event.contactName}` : null,
            event.propertyTitle ? `Propiedad: ${event.propertyTitle}` : null,
            event.location ? `Lugar: ${event.location}` : null,
          ]
            .filter(Boolean)
            .join("\n")
        }
      />
      <style>{`
        .big-calendar-wrapper {
          height: calc(100vh - 10rem);
          min-height: 500px;
        }
        .big-calendar-wrapper .rbc-calendar {
          height: 100%;
        }
        .big-calendar-wrapper .rbc-toolbar {
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0;
        }
        .big-calendar-wrapper .rbc-toolbar button {
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--foreground);
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .big-calendar-wrapper .rbc-toolbar button:hover {
          background: var(--muted);
        }
        .big-calendar-wrapper .rbc-toolbar button.rbc-active {
          background: var(--primary);
          color: var(--primary-foreground);
          border-color: var(--primary);
        }
        .big-calendar-wrapper .rbc-toolbar-label {
          font-weight: 600;
          font-size: 1rem;
          color: var(--foreground);
          text-transform: capitalize;
        }
        .big-calendar-wrapper .rbc-header {
          padding: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted-foreground);
          border-bottom: 1px solid var(--border);
          text-transform: capitalize;
        }
        .big-calendar-wrapper .rbc-month-view,
        .big-calendar-wrapper .rbc-time-view {
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .big-calendar-wrapper .rbc-day-bg + .rbc-day-bg,
        .big-calendar-wrapper .rbc-month-row + .rbc-month-row {
          border-color: var(--border);
        }
        .big-calendar-wrapper .rbc-off-range-bg {
          background: var(--muted);
        }
        .big-calendar-wrapper .rbc-today {
          background: color-mix(in srgb, var(--primary) 8%, transparent);
        }
        .big-calendar-wrapper .rbc-date-cell {
          padding: 0.25rem 0.5rem;
          font-size: 0.8125rem;
          color: var(--foreground);
        }
        .big-calendar-wrapper .rbc-show-more {
          font-size: 0.75rem;
          color: var(--primary);
          font-weight: 500;
        }
        .big-calendar-wrapper .rbc-event {
          font-size: 0.75rem;
        }
        .big-calendar-wrapper .rbc-time-slot {
          border-color: var(--border);
        }
        .big-calendar-wrapper .rbc-timeslot-group {
          border-color: var(--border);
        }
        .big-calendar-wrapper .rbc-time-header-content {
          border-color: var(--border);
        }
        .big-calendar-wrapper .rbc-time-content {
          border-color: var(--border);
        }
        .big-calendar-wrapper .rbc-label {
          font-size: 0.75rem;
          color: var(--muted-foreground);
        }
        .big-calendar-wrapper .rbc-current-time-indicator {
          background: var(--primary);
        }
        /* Agenda view styling */
        .big-calendar-wrapper .rbc-agenda-view {
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .big-calendar-wrapper .rbc-agenda-view table {
          border: none;
        }
        .big-calendar-wrapper .rbc-agenda-table thead th {
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted-foreground);
          border-bottom: 1px solid var(--border);
          text-transform: capitalize;
        }
        .big-calendar-wrapper .rbc-agenda-table tbody td {
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          color: var(--foreground);
          border-bottom: 1px solid var(--border);
        }
        .big-calendar-wrapper .rbc-agenda-date-cell {
          white-space: nowrap;
          text-transform: capitalize;
        }
        .big-calendar-wrapper .rbc-agenda-time-cell {
          white-space: nowrap;
          color: var(--muted-foreground);
          font-size: 0.75rem;
        }
        .big-calendar-wrapper .rbc-agenda-event-cell {
          cursor: pointer;
        }
        .big-calendar-wrapper .rbc-agenda-empty {
          padding: 2rem;
          text-align: center;
          color: var(--muted-foreground);
          font-size: 0.875rem;
        }
        /* Mobile: force day view to be usable */
        @media (max-width: 640px) {
          .big-calendar-wrapper {
            height: calc(100vh - 8rem);
            min-height: 400px;
          }
          .big-calendar-wrapper .rbc-toolbar {
            font-size: 0.75rem;
            gap: 0.25rem;
          }
          .big-calendar-wrapper .rbc-toolbar button {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }
          .big-calendar-wrapper .rbc-toolbar-label {
            font-size: 0.875rem;
            width: 100%;
            text-align: center;
            order: -1;
          }
          .big-calendar-wrapper .rbc-month-row {
            min-height: 3.5rem;
          }
          .big-calendar-wrapper .rbc-event {
            font-size: 0.625rem;
            padding: 1px 3px;
          }
          .big-calendar-wrapper .rbc-date-cell {
            font-size: 0.75rem;
            padding: 0.125rem 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}
