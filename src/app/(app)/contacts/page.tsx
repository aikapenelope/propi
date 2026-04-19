import Link from "next/link";
import { Mail, Phone, Building } from "lucide-react";
import { getContacts } from "@/server/actions/contacts";
import { formatDate } from "@/lib/utils";
import { ContactsHeader } from "@/components/contacts/contacts-header";
import { ContactSwipeRow } from "@/components/contacts/contact-swipe-row";

export const dynamic = "force-dynamic";

interface ContactsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ContactsPage({
  searchParams,
}: ContactsPageProps) {
  const { q } = await searchParams;
  const contactList = await getContacts(q);

  return (
    <div className="p-4 md:p-6">
      {/* Header with import button */}
      <ContactsHeader count={contactList.length} />

      {/* Search */}
      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, email, telefono..."
          className="h-10 w-full max-w-md rounded-lg border border-border bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </form>

      {/* Contact list */}
      {contactList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No hay contactos
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q
              ? "No se encontraron resultados para tu busqueda."
              : "Crea tu primer contacto para empezar."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contactList.map((contact) => (
            <ContactSwipeRow
              key={contact.id}
              contactId={contact.id}
              phone={contact.phone}
            >
              <Link
                href={`/contacts/${contact.id}`}
                className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                style={{ viewTransitionName: `contact-${contact.id}` }}
              >
              {/* Avatar placeholder */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {contact.name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </span>
                  )}
                  {contact.company && (
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {contact.company}
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="hidden gap-1 sm:flex">
                {contact.contactTags.slice(0, 3).map((ct) => (
                  <span
                    key={ct.tag.id}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${ct.tag.color}20`,
                      color: ct.tag.color ?? "#6366f1",
                    }}
                  >
                    {ct.tag.name}
                  </span>
                ))}
              </div>

              {/* Date */}
              <span className="hidden text-xs text-muted-foreground md:block">
                {formatDate(contact.updatedAt)}
              </span>
              </Link>
            </ContactSwipeRow>
          ))}
        </div>
      )}
    </div>
  );
}
