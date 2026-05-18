"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createAppointment,
  updateAppointment,
  type AppointmentFormData,
} from "@/server/actions/appointments";
import { ContactPicker } from "@/components/ui/contact-picker";

const statusOptions = [
  { value: "scheduled", label: "Programada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "no_show", label: "No asistio" },
];

/** Generate time slots from 06:00 to 22:00 in 30-minute increments. */
const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

/** Duration options in minutes. */
const DURATION_OPTIONS = [
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1.5 horas" },
  { value: "120", label: "2 horas" },
  { value: "180", label: "3 horas" },
];

interface Contact {
  id: string;
  name: string;
}

interface Property {
  id: string;
  title: string;
}

interface AppointmentFormProps {
  appointment?: {
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    status: string;
    location: string | null;
    contactId: string | null;
    propertyId: string | null;
  };
  contacts: Contact[];
  properties: Property[];
  defaultDate?: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date to YYYY-MM-DD for the date input. */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Format a Date to HH:mm for the time select. */
function toTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = date.getMinutes() >= 30 ? "30" : "00";
  return `${h}:${m}`;
}

/** Calculate duration in minutes between two dates. */
function getDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/** Get the next round half-hour from now. */
function getNextSlot(): { date: string; time: string } {
  const now = new Date();
  const minutes = now.getMinutes();
  if (minutes < 30) {
    now.setMinutes(30, 0, 0);
  } else {
    now.setHours(now.getHours() + 1, 0, 0, 0);
  }
  return { date: toDateString(now), time: toTimeString(now) };
}

/** Combine a date string (YYYY-MM-DD) and time string (HH:mm) into an ISO string. */
function combineDateTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

/** Add minutes to a time string, return new time string. */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppointmentForm({
  appointment,
  contacts,
  properties,
  defaultDate,
}: AppointmentFormProps) {
  const router = useRouter();
  const isEditing = !!appointment;

  // Compute initial values
  const defaults = (() => {
    if (appointment) {
      const start = new Date(appointment.startsAt);
      const end = new Date(appointment.endsAt);
      return {
        date: toDateString(start),
        time: toTimeString(start),
        duration: String(getDuration(start, end)),
      };
    }
    if (defaultDate) {
      return {
        date: toDateString(defaultDate),
        time: toTimeString(defaultDate),
        duration: "60",
      };
    }
    const next = getNextSlot();
    return { date: next.date, time: next.time, duration: "60" };
  })();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [duration, setDuration] = useState(defaults.duration);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    // Combine date + time into ISO strings
    const startsAt = combineDateTime(date, time);
    const endTime = addMinutesToTime(time, parseInt(duration));
    const endsAt = combineDateTime(date, endTime);

    const data: AppointmentFormData = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      startsAt,
      endsAt,
      status: (fd.get("status") as string) || undefined,
      location: (fd.get("location") as string) || undefined,
      contactId: (fd.get("contactId") as string) || undefined,
      propertyId: (fd.get("propertyId") as string) || undefined,
    };

    try {
      if (isEditing) {
        await updateAppointment(appointment.id, data);
        router.push("/calendar");
      } else {
        await createAppointment(data);
        router.push("/calendar?view=agenda");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar la cita";
      setError(message);
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground">
          Motivo de la cita *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Ej: Visita apartamento, Reunion con comprador..."
          defaultValue={appointment?.title}
          className={inputClass}
        />
      </div>

      {/* Date + Time + Duration — all on one row on desktop */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-foreground">
            Fecha *
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-foreground">
            Hora *
          </label>
          <select
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-foreground">
            Duracion
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-foreground">
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={appointment?.status ?? "scheduled"}
          className={inputClass}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-foreground">
          Ubicacion
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={appointment?.location ?? ""}
          placeholder="Direccion o enlace virtual"
          className={inputClass}
        />
      </div>

      {/* Contact */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Contacto
        </label>
        <div className="mt-1">
          <ContactPicker
            name="contactId"
            contacts={contacts}
            defaultValue={appointment?.contactId}
            placeholder="Buscar contacto..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Property */}
      <div>
        <label htmlFor="propertyId" className="block text-sm font-medium text-foreground">
          Propiedad
        </label>
        <select
          id="propertyId"
          name="propertyId"
          defaultValue={appointment?.propertyId ?? ""}
          className={inputClass}
        >
          <option value="">Sin propiedad</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Notas
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={appointment?.description ?? ""}
          placeholder="Notas adicionales sobre la cita..."
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear Cita"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
