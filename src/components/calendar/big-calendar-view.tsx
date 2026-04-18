"use client";

import { useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useRouter } from "next/navigation";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";

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
  completed: "#6b7280",
  cancelled: "#ef4444",
  no_show: "#f59e0b",
};

const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistio",
};

export function BigCalendarView({ events }: BigCalendarViewProps) {
  const router = useRouter();

  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      const dateStr = selectInfo.start.toISOString().slice(0, 16);
      router.push(`/calendar/new?date=${dateStr}`);
      selectInfo.view.calendar.unselect();
    },
    [router],
  );

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      router.push(`/calendar/${clickInfo.event.id}/edit`);
    },
    [router],
  );

  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: statusColors[e.status] || "#3b82f6",
    borderColor: statusColors[e.status] || "#3b82f6",
    extendedProps: {
      status: e.status,
      contactName: e.contactName,
      propertyTitle: e.propertyTitle,
      location: e.location,
    },
  }));

  return (
    <div className="propi-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        locale="es"
        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Dia",
          list: "Agenda",
        }}
        events={fcEvents}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        nowIndicator={true}
        height="auto"
        contentHeight="auto"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        slotDuration="00:30:00"
        longPressDelay={100}
        eventContent={(eventInfo) => (
          <div className="overflow-hidden px-1 py-0.5">
            <div className="truncate text-[11px] font-medium">
              {eventInfo.event.title}
            </div>
            {eventInfo.view.type !== "dayGridMonth" &&
              eventInfo.event.extendedProps.contactName && (
                <div className="truncate text-[10px] opacity-75">
                  {eventInfo.event.extendedProps.contactName}
                </div>
              )}
          </div>
        )}
        eventDidMount={(info) => {
          const props = info.event.extendedProps;
          const parts = [
            info.event.title,
            statusLabels[props.status] || props.status,
            props.contactName ? `Contacto: ${props.contactName}` : null,
            props.propertyTitle ? `Propiedad: ${props.propertyTitle}` : null,
            props.location ? `Lugar: ${props.location}` : null,
          ].filter(Boolean);
          info.el.title = parts.join("\n");
        }}
      />

      <style>{`
        .propi-calendar {
          --fc-border-color: var(--border);
          --fc-button-bg-color: transparent;
          --fc-button-border-color: var(--border);
          --fc-button-text-color: var(--foreground);
          --fc-button-hover-bg-color: var(--muted);
          --fc-button-hover-border-color: var(--border);
          --fc-button-active-bg-color: var(--primary);
          --fc-button-active-border-color: var(--primary);
          --fc-button-active-text-color: var(--primary-foreground);
          --fc-today-bg-color: color-mix(in srgb, var(--primary) 6%, transparent);
          --fc-neutral-bg-color: var(--muted);
          --fc-page-bg-color: transparent;
          --fc-event-text-color: #fff;
          --fc-list-event-hover-bg-color: var(--muted);
          --fc-now-indicator-color: var(--primary);
        }
        .propi-calendar .fc {
          font-family: inherit;
        }
        .propi-calendar .fc-toolbar {
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem !important;
        }
        .propi-calendar .fc-toolbar-title {
          font-size: 1rem !important;
          font-weight: 600;
          color: var(--foreground);
          text-transform: capitalize;
        }
        .propi-calendar .fc-button {
          border-radius: 0.5rem !important;
          padding: 0.375rem 0.75rem !important;
          font-size: 0.8125rem !important;
          font-weight: 500 !important;
          box-shadow: none !important;
          transition: background 0.15s, color 0.15s;
        }
        .propi-calendar .fc-button:focus {
          box-shadow: none !important;
        }
        .propi-calendar .fc-button-group > .fc-button {
          border-radius: 0 !important;
        }
        .propi-calendar .fc-button-group > .fc-button:first-child {
          border-radius: 0.5rem 0 0 0.5rem !important;
        }
        .propi-calendar .fc-button-group > .fc-button:last-child {
          border-radius: 0 0.5rem 0.5rem 0 !important;
        }
        .propi-calendar .fc-scrollgrid {
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .propi-calendar .fc-col-header-cell {
          padding: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted-foreground);
          text-transform: capitalize;
        }
        .propi-calendar .fc-daygrid-day-number {
          padding: 0.25rem 0.5rem;
          font-size: 0.8125rem;
          color: var(--foreground);
        }
        .propi-calendar .fc-daygrid-day.fc-day-other .fc-daygrid-day-number {
          color: var(--muted-foreground);
          opacity: 0.5;
        }
        .propi-calendar .fc-event {
          border-radius: 4px !important;
          border: none !important;
          cursor: pointer;
        }
        .propi-calendar .fc-daygrid-more-link {
          font-size: 0.75rem;
          color: var(--primary);
          font-weight: 500;
        }
        .propi-calendar .fc-timegrid-slot {
          height: 2.5rem;
        }
        .propi-calendar .fc-timegrid-slot-label {
          font-size: 0.75rem;
          color: var(--muted-foreground);
        }
        .propi-calendar .fc-list-event-title {
          font-size: 0.8125rem;
        }
        .propi-calendar .fc-list-day-cushion {
          background: var(--muted) !important;
          text-transform: capitalize;
        }
        .propi-calendar .fc-list-empty {
          background: transparent;
          text-align: center;
          padding: 2rem;
          color: var(--muted-foreground);
        }
        /* Mobile */
        @media (max-width: 640px) {
          .propi-calendar .fc-toolbar {
            gap: 0.25rem;
          }
          .propi-calendar .fc-toolbar-title {
            font-size: 0.875rem !important;
            width: 100%;
            text-align: center;
            order: -1;
          }
          .propi-calendar .fc-button {
            padding: 0.25rem 0.5rem !important;
            font-size: 0.75rem !important;
          }
          .propi-calendar .fc-daygrid-day-number {
            font-size: 0.75rem;
            padding: 0.125rem 0.25rem;
          }
          .propi-calendar .fc-event {
            font-size: 0.625rem;
          }
          .propi-calendar .fc-col-header-cell {
            font-size: 0.625rem;
            padding: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}
