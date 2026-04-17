"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createAppointment,
  updateAppointment,
  type AppointmentFormData,
} from "@/server/actions/appointments";

const statusOptions = [
  { value: "scheduled", label: "Programada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "no_show", label: "No asistio" },
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

function toLocalDatetime(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function AppointmentForm({
  appointment,
  contacts,
  properties,
  defaultDate,
}: AppointmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isEditing = !!appointment;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data: AppointmentFormData = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      startsAt: new Date(fd.get("startsAt") as string).toISOString(),
      endsAt: new Date(fd.get("endsAt") as string).toISOString(),
      status: (fd.get("status") as string) || undefined,
      location: (fd.get("location") as string) || undefined,
      contactId: (fd.get("contactId") as string) || undefined,
      propertyId: (fd.get("propertyId") as string) || undefined,
    };

    try {
      if (isEditing) {
        await updateAppointment(appointment.id, data);
      } else {
        await createAppointment(data);
      }
      router.push("/calendar");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground">
          Titulo *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={appointment?.title}
          className={inputClass}
        />
      </div>

      {/* Start / End */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className="block text-sm font-medium text-foreground">
            Inicio *
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={
              appointment
                ? toLocalDatetime(appointment.startsAt)
                : defaultDate
                  ? toLocalDatetime(defaultDate)
                  : ""
            }
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="endsAt" className="block text-sm font-medium text-foreground">
            Fin *
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={
              appointment
                ? toLocalDatetime(appointment.endsAt)
                : defaultDate
                  ? toLocalDatetime(new Date(defaultDate.getTime() + 60 * 60 * 1000))
                  : ""
            }
            className={inputClass}
          />
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
        <label htmlFor="contactId" className="block text-sm font-medium text-foreground">
          Contacto
        </label>
        <select
          id="contactId"
          name="contactId"
          defaultValue={appointment?.contactId ?? ""}
          className={inputClass}
        >
          <option value="">Sin contacto</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
