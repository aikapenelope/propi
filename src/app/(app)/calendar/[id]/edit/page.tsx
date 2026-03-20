import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAppointment } from "@/server/actions/appointments";
import { getContacts } from "@/server/actions/contacts";
import { getProperties } from "@/server/actions/properties";
import { AppointmentForm } from "@/components/calendar/appointment-form";

interface EditAppointmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAppointmentPage({
  params,
}: EditAppointmentPageProps) {
  const { id } = await params;
  const [appointment, contacts, properties] = await Promise.all([
    getAppointment(id),
    getContacts(),
    getProperties(),
  ]);

  if (!appointment) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6">
      <Link
        href="/calendar"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Calendario
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-foreground">Editar Cita</h1>
      <div className="max-w-2xl">
        <AppointmentForm
          appointment={appointment}
          contacts={contacts.map((c) => ({ id: c.id, name: c.name }))}
          properties={properties.map((p) => ({ id: p.id, title: p.title }))}
        />
      </div>
    </div>
  );
}
