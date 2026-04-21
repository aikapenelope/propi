"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useRouter } from "next/navigation";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import { hapticLight } from "@/lib/haptics";

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

/** Detect mobile viewport (matches Tailwind's md breakpoint). */
function useIsMobile() {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false, // SSR fallback: assume desktop
  );
}

export function BigCalendarView({ events }: BigCalendarViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const calendarRef = useRef<FullCalendar>(null);
  const touchStartX = useRef(0);

  // Swipe to navigate months/weeks on mobile
  useEffect(() => {
    if (!isMobile) return;
    const el = document.querySelector(".propi-calendar");
    if (!el) return;

    function handleTouchStart(e: Event) {
      touchStartX.current = (e as TouchEvent).touches[0].clientX;
    }

    function handleTouchEnd(e: Event) {
      const dx = (e as TouchEvent).changedTouches[0].clientX - touchStartX.current;
      const api = calendarRef.current?.getApi();
      if (!api) return;

      // Only trigger on horizontal swipes > 80px
      if (Math.abs(dx) < 80) return;

      if (dx < 0) {
        api.next();
        hapticLight();
      } else {
        api.prev();
        hapticLight();
      }
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile]);

  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      const dateStr = selectInfo.start.toISOString().slice(0, 16);
      router.push(`/calendar/new?date=${dateStr}`);
      selectInfo.view.calendar.unselect();
      hapticLight();
    },
    [router],
  );

  // On mobile, tap on a day to create appointment (instead of drag-select)
  const handleDateClick = useCallback(
    (info: { date: Date }) => {
      if (!isMobile) return;
      const dateStr = info.date.toISOString().slice(0, 16);
      router.push(`/calendar/new?date=${dateStr}`);
      hapticLight();
    },
    [isMobile, router],
  );

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      router.push(`/calendar/${clickInfo.event.id}/edit`);
      hapticLight();
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
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={isMobile ? "listWeek" : "dayGridMonth"}
        headerToolbar={
          isMobile
            ? {
                left: "prev,next",
                center: "title",
                right: "listWeek,dayGridMonth",
              }
            : {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }
        }
        locale="es"
        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Dia",
          list: "Agenda",
        }}
        events={fcEvents}
        /* Disable drag-select on mobile (conflicts with scroll).
           On desktop, keep selectable for range selection. */
        selectable={!isMobile}
        selectMirror={!isMobile}
        select={!isMobile ? handleDateSelect : undefined}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        dayMaxEvents={isMobile ? 2 : 3}
        weekends={true}
        nowIndicator={true}
        height="auto"
        contentHeight="auto"
        stickyHeaderDates={true}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        slotDuration="00:30:00"
        /* 300ms feels natural: long enough to not trigger on scroll,
           short enough to not feel laggy. */
        longPressDelay={300}
        selectLongPressDelay={400}
        eventLongPressDelay={500}
        eventContent={(eventInfo) => (
          <div className="overflow-hidden px-1.5 py-1">
            <div className="truncate text-xs font-medium leading-tight">
              {eventInfo.event.title}
            </div>
            {eventInfo.view.type !== "dayGridMonth" &&
              eventInfo.event.extendedProps.contactName && (
                <div className="truncate text-[11px] opacity-75 mt-0.5">
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
        /* Prev/Next nav buttons — pill shaped, distinct from each other */
        .propi-calendar .fc-prev-button,
        .propi-calendar .fc-next-button {
          border-radius: 0.5rem !important;
          padding: 0.375rem 0.625rem !important;
          min-width: 38px;
          min-height: 38px;
        }
        .propi-calendar .fc-prev-button {
          margin-right: 4px !important;
        }
        /* View toggle button group (Mes, Agenda, etc.) */
        .propi-calendar .fc-button-group > .fc-button {
          border-radius: 0 !important;
        }
        .propi-calendar .fc-button-group > .fc-button:first-child {
          border-radius: 0.5rem 0 0 0.5rem !important;
        }
        .propi-calendar .fc-button-group > .fc-button:last-child {
          border-radius: 0 0.5rem 0.5rem 0 !important;
        }
        /* Override button-group stripping on prev/next (they're also in a group) */
        .propi-calendar .fc-toolbar-chunk:first-child .fc-button-group > .fc-button {
          border-radius: 0.5rem !important;
          margin-right: 4px;
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
          font-size: 0.875rem;
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

        /* Mobile optimizations */
        @media (max-width: 767px) {
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
            padding: 0.375rem 0.625rem !important;
            font-size: 0.75rem !important;
            min-height: 36px;
            min-width: 36px;
          }
          .propi-calendar .fc-daygrid-day-number {
            font-size: 0.8125rem;
            padding: 0.25rem 0.375rem;
          }
          .propi-calendar .fc-daygrid-day-events {
            min-height: 1.5rem;
          }
          .propi-calendar .fc-event {
            font-size: 0.6875rem;
            min-height: 22px;
          }
          .propi-calendar .fc-col-header-cell {
            font-size: 0.6875rem;
            padding: 0.375rem;
          }
          /* Bigger touch targets for list view */
          .propi-calendar .fc-list-event {
            min-height: 44px;
          }
          .propi-calendar .fc-list-event-title {
            font-size: 0.875rem;
            padding: 0.5rem 0;
          }
          .propi-calendar .fc-list-event-time {
            font-size: 0.75rem;
            min-width: 60px;
          }
          .propi-calendar .fc-list-day-cushion {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  );
}
