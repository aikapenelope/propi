import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  Pencil,
} from "lucide-react";
import { getContact } from "@/server/actions/contacts";
import { formatDate } from "@/lib/utils";
import { DeleteContactButton } from "@/components/contacts/delete-contact-button";

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({
  params,
}: ContactDetailPageProps) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6">
      {/* Back link */}
      <Link
        href="/contacts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Contactos
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {contact.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {contact.name}
            </h1>
            {contact.company && (
              <p className="text-sm text-muted-foreground">
                {contact.company}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/contacts/${id}/edit`}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <DeleteContactButton id={id} />
        </div>
      </div>

      {/* Contact info grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Details card */}
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Informacion
          </h2>
          <dl className="space-y-3 text-sm">
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-primary hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-primary hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{contact.company}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Creado {formatDate(contact.createdAt)}
              </span>
            </div>
          </dl>
        </div>

        {/* Tags card */}
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Etiquetas
          </h2>
          {contact.contactTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {contact.contactTags.map((ct) => (
                <span
                  key={ct.tag.id}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: `${ct.tag.color}20`,
                    color: ct.tag.color ?? "#6366f1",
                  }}
                >
                  {ct.tag.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin etiquetas</p>
          )}
        </div>

        {/* Notes card */}
        {contact.notes && (
          <div className="rounded-lg border border-border p-4 md:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Notas
            </h2>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {contact.notes}
            </p>
          </div>
        )}

        {/* Upcoming appointments */}
        <div className="rounded-lg border border-border p-4 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Proximas Citas
          </h2>
          {contact.appointments.length > 0 ? (
            <div className="space-y-2">
              {contact.appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {apt.title}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDate(apt.startsAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay citas programadas
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
