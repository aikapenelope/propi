import { AppointmentForm } from "@/components/calendar/appointment-form";
import { getContacts } from "@/server/actions/contacts";
import { getProperties } from "@/server/actions/properties";

export default async function NewAppointmentPage() {
  const [contacts, properties] = await Promise.all([
    getContacts(),
    getProperties(),
  ]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nueva Cita</h1>
      <div className="max-w-2xl">
        <AppointmentForm
          contacts={contacts.map((c) => ({ id: c.id, name: c.name }))}
          properties={properties.map((p) => ({ id: p.id, title: p.title }))}
        />
      </div>
    </div>
  );
}
